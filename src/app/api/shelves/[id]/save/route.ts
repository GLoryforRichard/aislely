// src/app/api/shelves/[id]/save/route.ts — confirm catalog: alias expansion + Titan embed + upsert.
// Ported from projectH0; auth via Better Auth session → aisleyTenantId.
import { getTenantId } from '@/lib/aisley-session';
import { withTenant } from '@/lib/aurora';
import { expandAliasesBatch, embed, buildSearchText, normalizeCanonicalName } from '@/lib/bedrock';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ProductInput {
  name: string;
  category?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantId();
  if (!tenantId) return new Response('Unauthorized', { status: 401 });
  const { id: shelfId } = await ctx.params;

  const body = (await req.json()) as { products?: ProductInput[] };
  const items = (body.products ?? []).filter((p) => p?.name?.trim());
  if (!items.length) return Response.json({ ok: true, saved: 0 });

  // 1) Normalize + dedupe names; alias-expand + embed (Bedrock, outside the txn)
  const names = Array.from(new Set(items.map((p) => normalizeCanonicalName(p.name))));
  const aliasesByName = await expandAliasesBatch(names);
  const embeds = new Map<string, number[]>();
  for (const name of names) {
    const text = buildSearchText(name, aliasesByName[name] ?? []);
    embeds.set(name, await embed(text));
  }

  // 2) Write (inside the RLS txn)
  const result = await withTenant(tenantId, async (c) => {
    const shelf = (
      await c.query<{ id: string; store_id: string; code: string; category: string | null }>(
        'select id, store_id, code, category from shelves where id=$1',
        [shelfId]
      )
    ).rows[0];
    if (!shelf) throw new Error('shelf not found');

    let saved = 0;
    for (const p of items) {
      const canonical = normalizeCanonicalName(p.name);
      const aliases = aliasesByName[canonical] ?? [];
      const searchText = buildSearchText(canonical, aliases);
      const vec = embeds.get(canonical);
      const vecLiteral = vec ? `[${vec.join(',')}]` : null;

      const up = await c.query<{ id: string }>(
        `insert into products
           (tenant_id,store_id,canonical_name,name_zh,name_en,category,aliases,search_text,embedding,confidence,latest_shelf_id,evidence_count)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9::vector,$10,$11,1)
         on conflict (store_id, canonical_name) do update set
           aliases = excluded.aliases,
           search_text = excluded.search_text,
           embedding = excluded.embedding,
           name_zh = coalesce(excluded.name_zh, products.name_zh),
           category = coalesce(excluded.category, products.category),
           confidence = excluded.confidence,
           latest_shelf_id = excluded.latest_shelf_id,
           evidence_count = products.evidence_count + 1,
           updated_at = now()
         returning id`,
        [
          tenantId,
          shelf.store_id,
          canonical,
          aliases[0] ?? null,
          canonical,
          p.category ?? shelf.category ?? null,
          aliases,
          searchText,
          vecLiteral,
          p.confidence ?? 'medium',
          shelfId,
        ]
      );
      const productId = up.rows[0].id;
      await c.query(
        `insert into product_aisles(tenant_id,store_id,product_id,shelf_id,shelf_code,confidence,source)
         values($1,$2,$3,$4,$5,$6,'photo')`,
        [tenantId, shelf.store_id, productId, shelfId, shelf.code, p.confidence ?? 'medium']
      );
      saved++;
    }

    await c.query("update shelves set status='done' where id=$1", [shelfId]);
    for (let i = 0; i < names.length; i++) {
      await c.query("insert into usage_events(tenant_id,store_id,kind) values($1,$2,'embedding')", [
        tenantId,
        shelf.store_id,
      ]);
    }
    return { saved };
  });

  return Response.json({ ok: true, ...result });
}

// src/app/api/setup/route.ts — save floor plan (create store + bulk shelves), mark setup_done.
// Ported from projectH0; auth via Better Auth session → aisleyTenantId (RLS scopes writes).
import { getTenantId } from '@/lib/aisley-session';
import { withTenant } from '@/lib/aurora';

export const runtime = 'nodejs';

interface ShelfInput {
  code: string;
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  category?: string | null;
  included?: boolean;
  status?: string;
}

function slugify(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30) || 'store';
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: Request) {
  const tenantId = await getTenantId();
  if (!tenantId) return new Response('Unauthorized', { status: 401 });

  const body = (await req.json()) as { storeName?: string; type?: string; shelves?: ShelfInput[] };
  const storeName = String(body.storeName ?? '').trim() || 'My store';
  const storeType = String(body.type ?? 'custom');
  const shelves = Array.isArray(body.shelves) ? body.shelves : [];

  const result = await withTenant(tenantId, async (c) => {
    const existing = (
      await c.query<{ id: string; slug: string }>(
        'select id, slug from stores where tenant_id=$1 order by created_at asc limit 1',
        [tenantId]
      )
    ).rows[0];

    let storeId: string;
    let slug: string;
    if (existing) {
      storeId = existing.id;
      slug = existing.slug;
      await c.query('update stores set name=$2, type=$3, setup_done=true where id=$1', [
        storeId,
        storeName,
        storeType,
      ]);
    } else {
      const r = await c.query<{ id: string; slug: string }>(
        'insert into stores(tenant_id,slug,name,type,setup_done) values($1,$2,$3,$4,true) returning id, slug',
        [tenantId, slugify(storeName), storeName, storeType]
      );
      storeId = r.rows[0].id;
      slug = r.rows[0].slug;
    }

    // Floor plan is finalized before catalog entry; replace shelves wholesale.
    await c.query('delete from shelves where store_id=$1', [storeId]);
    for (const s of shelves) {
      await c.query(
        `insert into shelves(tenant_id,store_id,code,kind,x,y,w,h,category,included,status)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          tenantId,
          storeId,
          s.code,
          s.kind,
          s.x,
          s.y,
          s.w,
          s.h,
          s.category ?? null,
          s.included ?? true,
          s.status ?? 'todo',
        ]
      );
    }
    return { storeId, slug, shelfCount: shelves.length };
  });

  return Response.json({ ok: true, ...result });
}

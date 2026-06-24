// src/app/api/store/[slug]/search/route.ts — Aislely multilingual store search (public, SSE)
// Ported from projectH0. Resolves the store by public slug → sets tenant GUC → reuses the
// pgvector+tsvector+RRF hybrid search core on the shared Aurora DB. Misses are logged as restock signals.
import { resolveStoreBySlug, withTenant } from '@/lib/aurora';
import { embed } from '@/lib/bedrock';
import { hybridSearch, finishPayload } from '@/lib/store-search';
import { sseResponse } from '@/lib/sse';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const resolved = await resolveStoreBySlug(slug);
  if (!resolved) return new Response('store not found', { status: 404 });

  const { q } = (await req.json()) as { q?: string };
  const query = (q ?? '').trim();
  if (!query) return new Response('empty query', { status: 400 });

  const lang = /[一-鿿]/.test(query) ? 'zh' : 'en';

  return sseResponse(async (send) => {
    send('plan_start', { q: query });
    send('tool_call', { tool: 'embed', label: 'Embedding query' });
    const qvec = await embed(query);
    send('tool_result', { tool: 'embed', ok: true });

    const result = await withTenant(resolved.tenantId, async (c) =>
      hybridSearch(c, resolved.storeId, query, qvec, send)
    );

    // Log search + usage (customer source; a miss becomes a restock signal)
    await withTenant(resolved.tenantId, async (c) => {
      const top = result.hit ? result.fused[0] : null;
      await c.query(
        `insert into search_logs(tenant_id,store_id,q,q_normalized,hit,lang,source,matched_product_id)
         values($1,$2,$3,$4,$5,$6,'customer',$7)`,
        [resolved.tenantId, resolved.storeId, query, query.toLowerCase(), result.hit, lang, top ? top.id : null]
      );
      await c.query("insert into usage_events(tenant_id,store_id,kind) values($1,$2,'search')", [
        resolved.tenantId,
        resolved.storeId,
      ]);
    });

    send('finish', finishPayload(result, query));
  });
}

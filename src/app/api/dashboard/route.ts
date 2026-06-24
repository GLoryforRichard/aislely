// src/app/api/dashboard/route.ts — owner labor-saving dashboard (real SQL).
// Ported from projectH0; tenant from the Better Auth session's linked aisleyTenantId.
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { withTenant } from '@/lib/aurora';
import { toCredits } from '@/lib/aislely-credits';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const tenantId = (session?.user as { aisleyTenantId?: string } | undefined)?.aisleyTenantId;
  if (!tenantId) return new Response('Unauthorized', { status: 401 });

  const data = await withTenant(tenantId, async (c) => {
    const store = (
      await c.query<{ id: string }>(
        'select id from stores where tenant_id=$1 order by created_at asc limit 1',
        [tenantId]
      )
    ).rows[0];
    if (!store) return null;

    const shelf = (
      await c.query(
        `select count(*)::int total,
                count(*) filter (where status='done')::int done,
                count(*) filter (where included)::int included
         from shelves where store_id=$1`,
        [store.id]
      )
    ).rows[0];

    const products = (await c.query('select count(*)::int n from products where store_id=$1', [store.id]))
      .rows[0].n as number;

    const s = (
      await c.query(
        `select count(*)::int total, count(*) filter (where hit)::int hits from search_logs where store_id=$1`,
        [store.id]
      )
    ).rows[0];

    const topTerms = (
      await c.query(
        `select q, count(*)::int n from search_logs where store_id=$1 group by q order by n desc, max(created_at) desc limit 8`,
        [store.id]
      )
    ).rows;

    const usage = (
      await c.query(
        `select kind, count(*)::int n from usage_events
         where tenant_id=$1 and created_at > now() - interval '30 days' group by kind`,
        [tenantId]
      )
    ).rows as { kind: string; n: number }[];

    return { shelf, products, s, topTerms, usage };
  });

  if (!data) return Response.json({ ready: false });

  const total = data.s.total as number;
  const hits = data.s.hits as number;
  const recognitions = data.usage.find((u) => u.kind === 'recognition')?.n ?? 0;
  const searches = data.usage.find((u) => u.kind === 'search')?.n ?? 0;

  return Response.json({
    ready: true,
    shelves: { total: data.shelf.total, done: data.shelf.done, included: data.shelf.included },
    products: data.products,
    search: { total, hits, hitRate: total ? Math.round((hits / total) * 100) : 0 },
    savedInquiries: hits,
    topTerms: data.topTerms.map((t: { q: string; n: number }) => ({ q: t.q, count: t.n })),
    credits: { used: toCredits(recognitions, searches) },
    usage: { recognitions, searches },
  });
}

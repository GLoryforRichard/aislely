// src/app/api/restock-signals/route.ts — restock signals (unmatched search terms ranked)
// Ported from projectH0; tenant comes from the Better Auth session's linked aisleyTenantId.
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { withTenant } from '@/lib/aurora';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const tenantId = (session?.user as { aisleyTenantId?: string } | undefined)?.aisleyTenantId;
  if (!tenantId) return new Response('Unauthorized', { status: 401 });

  const rows = await withTenant(tenantId, async (c) => {
    const store = (
      await c.query<{ id: string }>(
        'select id from stores where tenant_id=$1 order by created_at asc limit 1',
        [tenantId]
      )
    ).rows[0];
    if (!store) return [];
    return (
      await c.query<{ term: string; cnt: number; last_ms: string }>(
        `select coalesce(nullif(q_normalized,''), lower(btrim(q))) as term,
                count(*)::int as cnt,
                (extract(epoch from max(created_at))*1000)::bigint::text as last_ms
         from search_logs
         where store_id=$1 and hit=false
         group by term
         order by cnt desc, max(created_at) desc
         limit 30`,
        [store.id]
      )
    ).rows;
  });

  return Response.json({
    signals: rows.map((r) => ({
      term: r.term,
      count: r.cnt,
      lastSeen: Number(r.last_ms),
      suggestion: 'Consider restocking',
    })),
  });
}

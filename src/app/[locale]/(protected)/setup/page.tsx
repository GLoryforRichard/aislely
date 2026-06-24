import { redirect } from 'next/navigation';
import { getTenantId } from '@/lib/aisley-session';
import { withTenant, type StoreShelf } from '@/lib/aurora';
import type { Shelf } from '@/lib/aislely-types';
import SetupClient from './setup-client';

export const runtime = 'nodejs';

export default async function SetupPage() {
  const tenantId = await getTenantId();
  if (!tenantId) redirect('/auth/login');

  const data = await withTenant(tenantId, async (c) => {
    const store = (
      await c.query<{ name: string }>(
        'select name from stores where tenant_id=$1 order by created_at asc limit 1',
        [tenantId]
      )
    ).rows[0];
    const shelves = (
      await c.query<StoreShelf>(
        'select id, code, kind, x, y, w, h, category, included, status from shelves order by code'
      )
    ).rows;
    return { name: store?.name ?? '', shelves };
  });

  return (
    <SetupClient
      initialShelves={data.shelves as unknown as Shelf[]}
      initialName={data.name}
    />
  );
}

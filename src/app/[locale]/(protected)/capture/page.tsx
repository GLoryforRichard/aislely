import { redirect } from 'next/navigation';
import { getTenantId } from '@/lib/aisley-session';
import { withTenant, type StoreShelf } from '@/lib/aurora';
import CaptureClient from './capture-client';

export const runtime = 'nodejs';

export default async function CapturePage() {
  const tenantId = await getTenantId();
  if (!tenantId) redirect('/auth/login');

  // RLS scopes shelves to this tenant.
  const shelves = await withTenant(tenantId, async (c) =>
    (
      await c.query<StoreShelf>(
        'select id, code, kind, x, y, w, h, category, included, status from shelves order by code'
      )
    ).rows
  );

  return <CaptureClient shelves={shelves} />;
}

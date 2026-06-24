import 'server-only';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

// Resolve the current user's linked Aislely tenant id from the Better Auth session.
// Returns null if not signed in / no store provisioned.
export async function getTenantId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return (session?.user as { aisleyTenantId?: string } | undefined)?.aisleyTenantId ?? null;
}

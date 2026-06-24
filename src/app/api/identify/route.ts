// src/app/api/identify/route.ts — shelf photo → Nova Lite vision (ported from projectH0).
import sharp from 'sharp';
import { getTenantId } from '@/lib/aisley-session';
import { withTenant } from '@/lib/aurora';
import { detectShelfProducts } from '@/lib/bedrock';

export const runtime = 'nodejs'; // sharp + Bedrock SDK need Node runtime
export const maxDuration = 60;

export async function POST(req: Request) {
  const tenantId = await getTenantId();
  if (!tenantId) return new Response('Unauthorized', { status: 401 });

  const form = await req.formData();
  const file = form.get('image');
  if (!(file instanceof File)) {
    return Response.json({ error: 'missing image' }, { status: 400 });
  }
  const hintRaw = form.get('hint');
  const hint = typeof hintRaw === 'string' && hintRaw.trim() ? hintRaw.trim() : undefined;

  // Fix EXIF orientation + compress (controls Nova input cost)
  const input = Buffer.from(await file.arrayBuffer());
  const jpeg = await sharp(input)
    .rotate()
    .resize({ width: 1536, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  let products;
  try {
    products = await detectShelfProducts(new Uint8Array(jpeg), 'jpeg', hint);
  } catch (err) {
    console.error('[identify] Bedrock failed', err);
    return Response.json({ error: 'recognition failed, please retry' }, { status: 502 });
  }

  // Log a recognition usage event (tenant-scoped under RLS)
  await withTenant(tenantId, async (client) => {
    await client.query("INSERT INTO usage_events (tenant_id, kind) VALUES ($1, 'recognition')", [
      tenantId,
    ]);
  });

  return Response.json({ products });
}

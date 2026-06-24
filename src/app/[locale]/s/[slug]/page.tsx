import { notFound } from 'next/navigation';
import { loadStoreShelves } from '@/lib/aurora';
import type { Shelf } from '@/lib/aislely-types';
import { AislelyHeader } from '@/components/aislely/Brandmark';
import StoreSearchBox from './store-search-box';

export const runtime = 'nodejs';

// Public customer self-serve store page (no login) — Aislely skin: bear + floor-plan map.
export default async function PublicStorePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  const data = await loadStoreShelves(slug);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <AislelyHeader
        title={data.store.storeName}
        subtitle="Find any product — ask in any language, even with typos."
        size={56}
      />

      <StoreSearchBox slug={slug} shelves={data.shelves as unknown as Shelf[]} />

      <p className="mt-8 text-center text-xs text-stone-400">Powered by Aislely · 找货熊</p>
    </main>
  );
}

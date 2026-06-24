'use client';

import { useEffect, useState } from 'react';
import { AislelyHeader } from '@/components/aislely/Brandmark';

type Dash = {
  ready: boolean;
  shelves?: { total: number; done: number; included: number };
  products?: number;
  search?: { total: number; hits: number; hitRate: number };
  savedInquiries?: number;
  topTerms?: { q: string; count: number }[];
};

// Owner console — labor-saving dashboard (catalog progress, hit rate, saved inquiries, top terms).
export default function InsightsPage() {
  const [d, setD] = useState<Dash | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setD)
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="text-3xl font-bold tracking-tight text-[#8a531a]">{value}</div>
      <div className="mt-1 text-xs text-stone-500">{label}</div>
    </div>
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <AislelyHeader
        title="店铺看板 · Insights"
        subtitle="建库进度、搜索命中、省下的问询、热门搜索词"
      />

      {err && <p className="text-red-500">Error: {err}</p>}
      {!err && !d && <p className="text-stone-400">Loading…</p>}
      {d && d.ready === false && <p className="text-stone-400">还没建店。</p>}

      {d?.ready && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="在库商品" value={d.products ?? 0} />
            <Stat label="货架建库" value={`${d.shelves?.done ?? 0}/${d.shelves?.total ?? 0}`} />
            <Stat label="搜索命中率" value={`${d.search?.hitRate ?? 0}%`} />
            <Stat label="省下问询" value={d.savedInquiries ?? 0} />
          </div>

          {!!d.topTerms?.length && (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold text-stone-700">热门搜索 Top searches</h2>
              <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200">
                {d.topTerms.map((t, i) => (
                  <li key={i} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-stone-800">{t.q}</span>
                    <span className="rounded-full bg-[#f6ecdd] px-2 py-0.5 text-xs font-bold text-[#8a531a]">
                      {t.count}×
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </main>
  );
}

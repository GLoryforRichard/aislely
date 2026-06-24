'use client';

import { useEffect, useState } from 'react';
import { AislelyHeader } from '@/components/aislely/Brandmark';

type Signal = { term: string; count: number; lastSeen: number; suggestion: string };

// Owner console — restock signals (unmatched customer searches → buying suggestions).
export default function RestockPage() {
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/restock-signals')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setSignals(d.signals || []))
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <AislelyHeader
        title="进货信号 · Restock signals"
        subtitle="顾客搜了却没找到的词 —— 按需求排序的选品建议"
      />

      {err && <p className="text-red-500">Error: {err}</p>}
      {!err && signals === null && <p className="text-stone-400">Loading…</p>}
      {!err && signals?.length === 0 && <p className="text-stone-400">还没有进货信号。</p>}

      {!!signals?.length && (
        <div className="overflow-hidden rounded-2xl border border-stone-200">
          <table className="w-full text-sm">
            <thead className="bg-[#f6ecdd] text-left text-[#8a531a]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">搜索词 Term</th>
                <th className="px-4 py-2.5 font-semibold">次数</th>
                <th className="px-4 py-2.5 font-semibold">建议</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s, i) => (
                <tr key={i} className="border-t border-stone-100">
                  <td className="px-4 py-2.5 font-medium text-stone-800">{s.term}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-[#f6ecdd] px-2 py-0.5 text-xs font-bold text-[#8a531a]">
                      {s.count}×
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-stone-500">{s.suggestion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

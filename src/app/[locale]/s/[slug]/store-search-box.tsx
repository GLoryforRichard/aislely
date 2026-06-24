'use client';

import { useState } from 'react';
import FloorPlan from '@/components/aislely/FloorPlan';
import type { Shelf } from '@/lib/aislely-types';

type Result = {
  productId: string;
  name: string;
  nameZh: string | null;
  shelfCode: string | null;
  category?: string | null;
};

// Customer self-serve search — SSE search route + Aislely floor-plan map with shelf highlight.
export default function StoreSearchBox({ slug, shelves }: { slug: string; shelves: Shelf[] }) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [miss, setMiss] = useState<string | null>(null);
  const [hlCode, setHlCode] = useState<string | null>(null);

  const highlightIds = hlCode ? shelves.filter((s) => s.code === hlCode).map((s) => s.id) : [];

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query || busy) return;
    setBusy(true);
    setAnswer(null);
    setResults([]);
    setMiss(null);
    setHlCode(null);
    try {
      const res = await fetch(`/api/store/${slug}/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q: query }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() || '';
        for (const p of parts) {
          const line = p.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          const ev = JSON.parse(line.slice(6));
          if (ev.event === 'finish') {
            if (ev.hit) {
              setAnswer(ev.answer);
              setResults(ev.results || []);
              setHlCode(ev.results?.[0]?.shelfCode ?? null);
            } else {
              setMiss(ev.message || 'Not found');
            }
          }
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={run} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What are you looking for? (any language)"
          className="flex-1 rounded-lg border border-stone-300 px-4 py-3 text-base outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? '…' : 'Find'}
        </button>
      </form>

      {shelves.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
          <FloorPlan shelves={shelves} mode="view" highlightIds={highlightIds} />
        </div>
      )}

      {answer && (
        <div className="wb-fade-in rounded-xl border-2 border-primary bg-[#f6ecdd] px-4 py-3">
          <div className="font-bold text-[#8a531a]">{answer}</div>
        </div>
      )}

      {results.length > 0 && (
        <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
          {results.map((r) => (
            <li key={r.productId} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-stone-800">{r.name}</div>
                {r.nameZh && <div className="truncate text-xs text-stone-400">{r.nameZh}</div>}
              </div>
              {r.shelfCode && (
                <span className="grid h-9 min-w-9 place-items-center rounded-lg border-2 border-primary px-2 text-sm font-bold text-[#8a531a]">
                  {r.shelfCode}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {miss && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">{miss}</div>
      )}
    </div>
  );
}

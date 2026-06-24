'use client';

import { useRef, useState } from 'react';
import { AislelyHeader } from '@/components/aislely/Brandmark';
import { categoryOf } from '@/lib/aislely-catalog';
import type { StoreShelf } from '@/lib/aurora';

type Detected = { name: string; category?: string; confidence?: 'high' | 'medium' | 'low' };
type Phase = 'idle' | 'detecting' | 'review' | 'saved';

export default function CaptureClient({ shelves }: { shelves: StoreShelf[] }) {
  const billable = shelves.filter((s) => s.included && (s.kind === 'shelf' || s.kind === 'fridge'));
  const [phase, setPhase] = useState<Phase>('idle');
  const [active, setActive] = useState<StoreShelf | null>(null);
  const [detected, setDetected] = useState<Detected[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pick(shelf: StoreShelf) {
    setActive(shelf);
    setErr(null);
    fileRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !active) return;
    setPhase('detecting');
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const hint = categoryOf(active.category as never)?.en ?? active.category ?? '';
      if (hint) fd.append('hint', hint);
      const res = await fetch('/api/identify', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setDetected(data.products || []);
      setPhase('review');
    } catch (e) {
      setErr(String((e as Error).message));
      setPhase('idle');
    }
  }

  async function save() {
    if (!active || !detected.length) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/shelves/${active.id}/save`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ products: detected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPhase('saved');
    } catch (e) {
      setErr(String((e as Error).message));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setActive(null);
    setDetected([]);
    setPhase('idle');
    setErr(null);
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <AislelyHeader
        title="拍照建库 · Capture shelves"
        subtitle="对着货架拍一张 —— AI 识别每个商品,零打字录入"
      />

      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />

      {err && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>}

      {/* idle — pick a shelf */}
      {phase === 'idle' && (
        billable.length === 0 ? (
          <p className="text-stone-400">还没有货架。先去 <a href="/setup" className="text-[#8a531a] underline">画平面图</a>。</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {billable.map((s) => {
              const cat = categoryOf(s.category as never);
              const done = s.status === 'done';
              return (
                <button
                  key={s.id}
                  onClick={() => pick(s)}
                  className="flex flex-col items-start gap-1 rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-primary"
                >
                  <span className="grid h-9 min-w-9 place-items-center rounded-lg border border-primary px-2 font-bold text-[#8a531a]">
                    {s.code}
                  </span>
                  <span className="mt-1 text-sm text-stone-700">{cat ? `${cat.emoji} ${cat.zh}` : '未分类'}</span>
                  <span className={`text-xs ${done ? 'text-emerald-600' : 'text-stone-400'}`}>
                    {done ? '✓ 已建库 · 重拍可更新' : '📷 点此拍照建库'}
                  </span>
                </button>
              );
            })}
          </div>
        )
      )}

      {/* detecting */}
      {phase === 'detecting' && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-10 text-center">
          <div className="wb-scan mx-auto mb-3 h-1 w-32 rounded bg-primary" />
          <p className="text-stone-600">AI 正在识别货架 {active?.code} 的商品…</p>
        </div>
      )}

      {/* review */}
      {phase === 'review' && (
        <div>
          <p className="mb-3 text-sm text-stone-500">
            货架 <b className="text-[#8a531a]">{active?.code}</b> 识别到 {detected.length} 个商品 —— 删掉错的,然后保存。
          </p>
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200">
            {detected.map((p, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm text-stone-800">{p.name}</span>
                <span className="rounded-full bg-[#f6ecdd] px-2 py-0.5 text-[10px] font-bold text-[#8a531a]">{p.confidence ?? 'medium'}</span>
                <button onClick={() => setDetected((d) => d.filter((_, j) => j !== i))} className="text-stone-400 hover:text-red-500">✕</button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <button onClick={save} disabled={saving || !detected.length} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
              {saving ? '保存中…' : `保存 ${detected.length} 个商品`}
            </button>
            <button onClick={reset} className="rounded-lg border border-stone-300 px-5 py-2.5 font-semibold text-stone-600">取消</button>
          </div>
        </div>
      )}

      {/* saved */}
      {phase === 'saved' && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-8 text-center">
          <div className="text-3xl">🎉</div>
          <p className="mt-2 font-bold text-emerald-900">货架 {active?.code} 已建库!</p>
          <button onClick={reset} className="mt-4 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90">
            继续下一个货架
          </button>
        </div>
      )}
    </main>
  );
}

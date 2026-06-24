'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AislelyHeader } from '@/components/aislely/Brandmark';
import FloorPlan, { clampPos, collides, findFreeSpot } from '@/components/aislely/FloorPlan';
import { CATEGORIES } from '@/lib/aislely-catalog';
import { buildTemplate, makeShelf, TEMPLATES } from '@/lib/aislely-templates';
import type { Shelf, ShelfKind, TemplateKey } from '@/lib/aislely-types';

const KINDS: { kind: ShelfKind; label: string; emoji: string }[] = [
  { kind: 'shelf', label: '货架', emoji: '📦' },
  { kind: 'fridge', label: '冷柜', emoji: '🧊' },
  { kind: 'checkout', label: '收银台', emoji: '💰' },
  { kind: 'entrance', label: '入口', emoji: '🚪' },
];

export default function SetupClient({
  initialShelves,
  initialName,
}: {
  initialShelves: Shelf[];
  initialName: string;
}) {
  const router = useRouter();
  const [shelves, setShelves] = useState<Shelf[]>(
    initialShelves.length ? initialShelves : buildTemplate('small')
  );
  const [storeName, setStoreName] = useState(initialName || 'My store');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sel = shelves.find((s) => s.id === selectedId) ?? null;
  const update = (id: string, patch: Partial<Shelf>) =>
    setShelves((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  function addKind(kind: ShelfKind) {
    const [w, h] = kind === 'fridge' ? [8, 2] : kind === 'shelf' ? [6, 2] : kind === 'checkout' ? [4, 1] : [5, 1];
    const [x, y] = findFreeSpot(shelves, w, h);
    const s = makeShelf(shelves, kind, x, y);
    setShelves((arr) => [...arr, s]);
    setSelectedId(s.id);
  }

  function loadTemplate(key: TemplateKey) {
    setShelves(buildTemplate(key));
    setSelectedId(null);
  }

  function onMove(id: string, x: number, y: number) {
    update(id, { x, y });
  }

  function resize(dim: 'w' | 'h', delta: number) {
    if (!sel) return;
    const nw = dim === 'w' ? Math.max(1, sel.w + delta) : sel.w;
    const nh = dim === 'h' ? Math.max(1, sel.h + delta) : sel.h;
    const [x, y] = clampPos(sel.x, sel.y, nw, nh);
    if (collides(shelves, sel.id, x, y, nw, nh)) return;
    update(sel.id, { w: nw, h: nh, x, y });
  }

  function rotate() {
    if (!sel) return;
    const [x, y] = clampPos(sel.x, sel.y, sel.h, sel.w);
    if (collides(shelves, sel.id, x, y, sel.h, sel.w)) return;
    update(sel.id, { w: sel.h, h: sel.w, x, y });
  }

  function del() {
    if (!sel) return;
    setShelves((arr) => arr.filter((s) => s.id !== sel.id));
    setSelectedId(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ storeName, type: 'custom', shelves }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMsg(`已保存 ${data.shelfCount} 个货架 ✓ 去「拍照建库」录入商品`);
      router.refresh();
    } catch (e) {
      setMsg(`保存失败:${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  const pickable = sel && (sel.kind === 'shelf' || sel.kind === 'fridge');

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <AislelyHeader title="平面图 · Floor plan" subtitle="拖动摆放货架,点选后设品类,保存即可拍照建库" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          placeholder="Store name"
        />
        <button onClick={save} disabled={saving} className="rounded-lg bg-primary px-5 py-2 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
          {saving ? '保存中…' : '保存平面图'}
        </button>
        {msg && <span className="text-sm text-stone-600">{msg}</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-[200px_1fr_220px]">
        {/* Palette + templates */}
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-400">添加组件</div>
            <div className="grid grid-cols-2 gap-2">
              {KINDS.map((k) => (
                <button key={k.kind} onClick={() => addKind(k.kind)} className="rounded-lg border border-stone-200 bg-white px-2 py-2 text-xs font-medium text-stone-700 transition hover:border-primary">
                  {k.emoji} {k.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-400">模板</div>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button key={t.key} onClick={() => loadTemplate(t.key)} className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-xs text-stone-700 transition hover:border-primary">
                  {t.emoji} <b>{t.name}</b> · {t.desc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
          <FloorPlan
            shelves={shelves}
            mode="edit"
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={onMove}
            showCategory
          />
        </div>

        {/* Properties */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          {!sel ? (
            <p className="text-sm text-stone-400">点选一个货架来编辑。</p>
          ) : (
            <div className="space-y-4">
              <div className="text-sm font-bold text-stone-900">{sel.code}</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button onClick={() => resize('w', 1)} className="rounded border border-stone-200 px-2 py-1">宽+</button>
                <button onClick={() => resize('w', -1)} className="rounded border border-stone-200 px-2 py-1">宽-</button>
                <button onClick={() => resize('h', 1)} className="rounded border border-stone-200 px-2 py-1">高+</button>
                <button onClick={() => resize('h', -1)} className="rounded border border-stone-200 px-2 py-1">高-</button>
                <button onClick={rotate} className="rounded border border-stone-200 px-2 py-1">旋转</button>
                <button onClick={del} className="rounded border border-red-200 px-2 py-1 text-red-600">删除</button>
              </div>
              {pickable && (
                <div>
                  <div className="mb-1.5 text-xs font-bold text-stone-500">品类(拍照更准)</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => update(sel.id, { category: c.key })}
                        className={`rounded px-2 py-1 text-left text-[11px] ${sel.category === c.key ? 'bg-[#f6ecdd] font-bold text-[#8a531a]' : 'border border-stone-200 text-stone-600'}`}
                      >
                        {c.emoji} {c.zh}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

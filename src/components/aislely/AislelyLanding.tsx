import Link from 'next/link';
import FloorPlan from '@/components/aislely/FloorPlan';
import { Brandmark } from '@/components/aislely/Brandmark';
import type { Shelf } from '@/lib/aislely-types';

// Sample store layout for the hero demo (highlight = "the answer").
const SAMPLE_SHELVES: Shelf[] = [
  { id: 'f1', code: 'F1', kind: 'fridge', x: 1, y: 1, w: 9, h: 2, category: 'dairy', included: true, status: 'done', items: [] },
  { id: 'f2', code: 'F2', kind: 'fridge', x: 11, y: 1, w: 9, h: 2, category: 'drink', included: true, status: 'done', items: [] },
  { id: 'a1', code: 'A1', kind: 'shelf', x: 1, y: 4, w: 2, h: 9, category: 'fresh', included: true, status: 'done', items: [] },
  { id: 'b1', code: 'B1', kind: 'shelf', x: 5, y: 4, w: 6, h: 2, category: 'noodle', included: true, status: 'done', items: [] },
  { id: 'b4', code: 'B4', kind: 'shelf', x: 5, y: 13, w: 6, h: 2, category: 'grain', included: true, status: 'done', items: [] },
  { id: 'c1', code: 'C1', kind: 'shelf', x: 14, y: 4, w: 6, h: 2, category: 'sauce', included: true, status: 'done', items: [] },
  { id: 'c3', code: 'C3', kind: 'shelf', x: 14, y: 10, w: 6, h: 2, category: 'snack', included: true, status: 'done', items: [] },
  { id: 'co', code: '收银', kind: 'checkout', x: 1, y: 17, w: 5, h: 2, included: true, status: 'done', items: [] },
  { id: 'en', code: '入口', kind: 'entrance', x: 14, y: 17, w: 6, h: 2, included: true, status: 'done', items: [] },
];

function Feature({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 transition hover:border-primary">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-3 text-lg font-bold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">{body}</p>
    </div>
  );
}

export default function AislelyLanding() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 text-center md:pb-24 md:pt-24">
        <div className="mx-auto mb-6 w-fit">
          <Brandmark size={104} />
        </div>
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          Aislely 找货熊 · in-store product finder
        </div>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.1] tracking-tight text-stone-900 md:text-7xl">
          Find any product&rsquo;s aisle
          <br />
          <span className="text-[#8a531a]">in seconds — in any language</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-stone-500 md:text-lg">
          Staff snap a photo to build the shelf map — zero typing. Shoppers and new hires ask in any
          language, even with typos, and instantly see exactly which aisle. Your store answers
          &ldquo;where is it?&rdquo; by itself.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/register"
            className="w-full rounded-xl bg-primary px-7 py-3.5 text-[15px] font-bold text-primary-foreground transition hover:opacity-90 sm:w-auto"
          >
            Start free
          </Link>
          <Link
            href="/s/demo"
            className="w-full rounded-xl border border-stone-300 bg-white px-7 py-3.5 text-[15px] font-bold text-stone-700 transition hover:bg-stone-50 sm:w-auto"
          >
            See live demo store
          </Link>
        </div>

        {/* Floor-plan demo */}
        <div className="mx-auto mt-12 max-w-3xl md:mt-16">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-4 py-2.5 text-sm">
              <span>🔍</span>
              <span className="text-stone-800">laoganma</span>
              <span className="ml-auto rounded-md bg-[#f6ecdd] px-2 py-0.5 text-xs font-bold text-[#8a531a]">
                → shelf B4
              </span>
            </div>
            <div className="bg-stone-50 p-3">
              <FloorPlan shelves={SAMPLE_SHELVES} mode="view" highlightIds={['b4']} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="grid gap-4 md:grid-cols-3">
            <Feature
              emoji="📷"
              title="Snap to catalog, zero typing"
              body="Photograph a shelf — AI vision reads every package in any language and builds the catalog with bilingual names and aliases."
            />
            <Feature
              emoji="🌏"
              title="Ask however they say it"
              body="Hybrid vector + full-text search, absurdly forgiving — handles other languages, pinyin, and typos, then points to the exact shelf on a map."
            />
            <Feature
              emoji="📍"
              title="Turn misses into restock"
              body="Every search that finds nothing is logged into a restock-signal report — real demand you're missing, ready to act on."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="rounded-3xl bg-stone-900 px-6 py-14 text-center md:py-20">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white">
            <Brandmark size={60} />
          </div>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
            One system to own the &ldquo;where is it?&rdquo; question
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-stone-400 md:text-base">
            New hires perform like ten-year veterans on day one.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/register"
              className="rounded-xl bg-primary px-8 py-3.5 text-[15px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              Start free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

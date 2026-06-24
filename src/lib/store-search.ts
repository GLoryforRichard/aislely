// lib/search.ts —— 混合搜索内核(pgvector 向量 + tsvector 全文 + RRF 融合)
// 店员端(/api/search)与顾客自助端(/api/s/[slug]/search)共用。
// 调用前提:c 已在设好租户 GUC 的事务连接内(withTenant)。
import "server-only";
import type { PoolClient } from "pg";

const RRF_K = 60;
export const HIT_DIST = 0.5; // 余弦距离阈值:小于此判定语义命中(区分命中/未命中→进货信号)

export interface SearchRow {
  id: string;
  canonical_name: string;
  name_zh: string | null;
  name_en: string | null;
  category: string | null;
  confidence: string | null;
  shelf_code: string | null;
  shelf_category: string | null;
  dist?: string | number;
  rank?: string | number;
}

export type SendFn = (event: string, data?: Record<string, unknown>) => void;

export interface SearchResult {
  fused: SearchRow[];
  ftCount: number;
  vecTopDist: number | null;
  vecTop: SearchRow | null;
  hit: boolean;
}

/** 在单个 store 上跑向量 + 全文 + RRF。send 可选,用于推送 SSE 工具事件。 */
export async function hybridSearch(
  c: PoolClient,
  storeId: string,
  query: string,
  qvec: number[],
  send?: SendFn
): Promise<SearchResult> {
  const vecLiteral = `[${qvec.join(",")}]`;

  send?.("tool_call", { tool: "vector_search", label: "语义向量检索 (pgvector)" });
  const vecRows = (
    await c.query<SearchRow>(
      `select p.id, p.canonical_name, p.name_zh, p.name_en, p.category, p.confidence,
              s.code as shelf_code, s.category as shelf_category,
              (p.embedding <=> $1::vector)::float8 as dist
       from products p left join shelves s on s.id = p.latest_shelf_id
       where p.store_id=$2 and p.embedding is not null
       order by p.embedding <=> $1::vector limit 20`,
      [vecLiteral, storeId]
    )
  ).rows;
  send?.("tool_result", { tool: "vector_search", count: vecRows.length });

  send?.("tool_call", { tool: "fulltext_search", label: "多语言全文检索 (tsvector)" });
  const ftRows = (
    await c.query<SearchRow>(
      `select p.id, p.canonical_name, p.name_zh, p.name_en, p.category, p.confidence,
              s.code as shelf_code, s.category as shelf_category,
              ts_rank(p.search_tsv, plainto_tsquery('simple',$1))::float8 as rank
       from products p left join shelves s on s.id = p.latest_shelf_id
       where p.store_id=$2 and (p.search_tsv @@ plainto_tsquery('simple',$1)
             or p.search_text ilike '%'||$1||'%' or p.canonical_name ilike '%'||$1||'%')
       order by rank desc limit 20`,
      [query, storeId]
    )
  ).rows;
  send?.("tool_result", { tool: "fulltext_search", count: ftRows.length });

  // RRF 融合(按 product id 去重,score = Σ 1/(K+rank))
  send?.("tool_call", { tool: "rrf", label: "RRF 融合排序" });
  const score = new Map<string, number>();
  const meta = new Map<string, SearchRow>();
  vecRows.forEach((row, i) => {
    score.set(row.id, (score.get(row.id) ?? 0) + 1 / (RRF_K + i + 1));
    meta.set(row.id, row);
  });
  ftRows.forEach((row, i) => {
    score.set(row.id, (score.get(row.id) ?? 0) + 1 / (RRF_K + i + 1));
    if (!meta.has(row.id)) meta.set(row.id, row);
  });
  const fused = [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => meta.get(id)!);
  send?.("tool_result", { tool: "rrf", count: fused.length });

  const vecTopDist = vecRows[0]?.dist != null ? Number(vecRows[0].dist) : null;
  const hit = ftRows.length > 0 || (vecTopDist != null && vecTopDist < HIT_DIST);
  return { fused, ftCount: ftRows.length, vecTopDist, vecTop: vecRows[0] ?? null, hit };
}

/** 把搜索结果拼成前端要的 finish 事件载荷。答案按"查询语言"输出(中文搜→中文答,英文搜→英文答)。 */
export function finishPayload(r: SearchResult, query: string): Record<string, unknown> {
  const zh = /[一-鿿]/.test(query);
  const top = r.fused[0];
  if (r.hit && top) {
    const disp = zh
      ? top.name_zh || top.name_en || top.canonical_name
      : top.name_en || top.canonical_name || top.name_zh;
    const answer = top.shelf_code
      ? zh
        ? `${disp} 在 ${top.shelf_code} 货架`
        : `${disp} is on shelf ${top.shelf_code}`
      : disp;
    return {
      hit: true,
      answer,
      results: r.fused.map((row) => ({
        productId: row.id,
        name: row.name_en || row.canonical_name,
        nameZh: row.name_zh,
        shelfCode: row.shelf_code,
        category: row.category,
        confidence: row.confidence,
      })),
    };
  }
  // 品类兜底线索:用最相近商品的货架品类作为"可能在"猜测
  const guessCat = r.vecTop?.shelf_category || r.vecTop?.category || null;
  const message = zh
    ? guessCat
      ? `没找到,可能在「${guessCat}」区附近`
      : "没找到,已记入进货信号"
    : guessCat
      ? `Not found — maybe near the “${guessCat}” section`
      : "Not found — logged as a restock signal";
  return { hit: false, guess: guessCat, message };
}

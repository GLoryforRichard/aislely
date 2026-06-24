// 共享类型定义 —— MVP 阶段全部为前端模拟数据

export type CategoryKey =
  | "noodle"
  | "sauce"
  | "snack"
  | "drink"
  | "frozen"
  | "grain"
  | "dairy"
  | "daily"
  | "fresh"
  | "beer";

export interface CategoryDef {
  key: CategoryKey;
  zh: string;
  en: string;
  emoji: string;
  /** 查询时品类兜底匹配用的关键词(中英混合) */
  keywords: string[];
}

export interface CatalogProduct {
  id: string;
  zh: string;
  en: string;
  /** 拼音、俗称、常见拼错等,用于演示多语言/容错搜索 */
  aliases: string[];
  price: number;
  emoji: string;
  category: CategoryKey;
}

/** 货架上已录入的商品(识别确认后入库) */
export interface StoredItem {
  productId: string;
  confidence: "high" | "medium" | "low";
  addedAt: number;
  /** 真后端返回的展示名(localStorage/mock 时缺省,改用 catalog 查) */
  name?: string;
  nameZh?: string;
}

export type ShelfKind = "shelf" | "fridge" | "checkout" | "entrance";

export interface Shelf {
  id: string;
  /** 货架编号,如 A1、B3、F1,创建时自动分配 */
  code: string;
  kind: ShelfKind;
  /** 网格坐标与尺寸(单位:格) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** 货架卖什么 —— 门店 SOP 的点睛之笔 */
  category?: CategoryKey;
  /** 是否纳入录入(订阅计费)范围 */
  included: boolean;
  /** 录入状态 */
  status: "todo" | "done";
  items: StoredItem[];
}

export type TemplateKey = "mini" | "small" | "mid";

export interface SearchLog {
  q: string;
  hit: boolean;
  ts: number;
}

export interface User {
  name: string;
  email: string;
  createdAt: number;
}

export type PlanTier = "starter" | "growth" | "enterprise";

export type Role = "owner" | "staff";

export interface AppState {
  v: 2;
  /** SaaS 流程门控:注册 → 选套餐 → 支付 → 画图建库 → 工作台 */
  user: User | null;
  /** 当前用户在该门店的角色(owner=老板 / staff=店员);未登录为 null */
  role: Role | null;
  plan: { tier: PlanTier; monthly: number; paidAt: number } | null;
  /** 平面图是否已完成并"建库" */
  setupDone: boolean;
  demo: boolean;
  /** slug 供顾客自助 QR(/s/[slug])公开访问 */
  store: { name: string; slug: string; type: TemplateKey | "custom"; createdAt: number } | null;
  shelves: Shelf[];
  searches: SearchLog[];
}

/** 横版网格(桌面优先);移动端整图缩放仍可读 */
export const GRID_W = 32;
export const GRID_H = 20;
/** SVG 每格边长 */
export const CELL = 20;

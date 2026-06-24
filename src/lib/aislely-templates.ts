import type { CategoryKey, Shelf, ShelfKind, TemplateKey } from "./aislely-types";

export interface TemplateDef {
  key: TemplateKey;
  name: string;
  desc: string;
  emoji: string;
}

export const TEMPLATES: TemplateDef[] = [
  { key: "mini", name: "便利店", desc: "约 8 组货架", emoji: "🏪" },
  { key: "small", name: "小型超市", desc: "约 12 组货架", emoji: "🛒" },
  { key: "mid", name: "中型超市", desc: "约 16 组货架", emoji: "🏬" },
];

type Spec = [code: string, kind: ShelfKind, x: number, y: number, w: number, h: number, category?: CategoryKey];

// 横版 32×20 网格;模板自带「典型品类」预标注,用户只需确认或微调
const SPECS: Record<TemplateKey, Spec[]> = {
  mini: [
    ["F1", "fridge", 2, 1, 12, 2, "drink"],
    ["F2", "fridge", 18, 1, 12, 2, "dairy"],
    ["A1", "shelf", 4, 6, 10, 2, "noodle"],
    ["A2", "shelf", 4, 10, 10, 2, "snack"],
    ["A3", "shelf", 4, 14, 10, 2, "sauce"],
    ["B1", "shelf", 18, 6, 10, 2, "drink"],
    ["B2", "shelf", 18, 10, 10, 2, "grain"],
    ["B3", "shelf", 18, 14, 10, 2, "daily"],
    ["收银", "checkout", 2, 17, 5, 2],
    ["入口", "entrance", 14, 19, 5, 1],
  ],
  small: [
    ["F1", "fridge", 1, 1, 12, 2, "frozen"],
    ["F2", "fridge", 15, 1, 9, 2, "dairy"],
    ["A1", "shelf", 1, 5, 2, 12, "fresh"],
    ["B1", "shelf", 6, 5, 8, 2, "noodle"],
    ["B2", "shelf", 6, 9, 8, 2, "sauce"],
    ["B3", "shelf", 6, 13, 8, 2, "snack"],
    ["C1", "shelf", 17, 5, 8, 2, "drink"],
    ["C2", "shelf", 17, 9, 8, 2, "grain"],
    ["C3", "shelf", 17, 13, 8, 2, "daily"],
    ["D1", "shelf", 29, 5, 2, 12, "beer"],
    ["F3", "fridge", 26, 1, 5, 2, "drink"],
    ["B4", "shelf", 6, 17, 8, 2, "snack"],
    ["收银", "checkout", 1, 18, 5, 1],
    ["入口", "entrance", 20, 19, 5, 1],
  ],
  mid: [
    ["F1", "fridge", 1, 1, 10, 2, "frozen"],
    ["F2", "fridge", 13, 1, 9, 2, "dairy"],
    ["F3", "fridge", 24, 1, 7, 2, "drink"],
    ["A1", "shelf", 1, 5, 2, 12, "fresh"],
    ["B1", "shelf", 6, 5, 7, 2, "noodle"],
    ["B2", "shelf", 6, 9, 7, 2, "sauce"],
    ["B3", "shelf", 6, 13, 7, 2, "grain"],
    ["B4", "shelf", 6, 17, 7, 2, "daily"],
    ["C1", "shelf", 16, 5, 7, 2, "snack"],
    ["C2", "shelf", 16, 9, 7, 2, "snack"],
    ["C3", "shelf", 16, 13, 7, 2, "dairy"],
    ["C4", "shelf", 16, 17, 7, 2, "beer"],
    ["D1", "shelf", 26, 5, 7, 2, "drink"],
    ["D2", "shelf", 26, 9, 7, 2, "daily"],
    ["D3", "shelf", 26, 13, 7, 2, "beer"],
    ["E1", "shelf", 29, 16, 2, 4, "beer"],
    ["收银1", "checkout", 1, 18, 4, 1],
    ["收银2", "checkout", 6, 18, 4, 1],
    ["入口", "entrance", 20, 19, 6, 1],
  ],
};

let uid = 0;
const nextId = () => `s${Date.now().toString(36)}${(uid++).toString(36)}`;

export function buildTemplate(key: TemplateKey): Shelf[] {
  return SPECS[key].map(([code, kind, x, y, w, h, category]) => ({
    id: nextId(),
    code,
    kind,
    x,
    y,
    w,
    h,
    category,
    included: kind === "shelf" || kind === "fridge",
    status: "todo" as const,
    items: [],
  }));
}

/** 新增组件自动编号:货架 A 系列 / 冷柜 F 系列 / 收银、入口直接用名字 */
export function nextCode(shelves: Shelf[], kind: ShelfKind): string {
  if (kind === "checkout") return "收银";
  if (kind === "entrance") return "入口";
  const letter = kind === "fridge" ? "F" : "A";
  const used = new Set(shelves.map((s) => s.code));
  for (let n = 1; n < 99; n++) {
    if (!used.has(`${letter}${n}`)) return `${letter}${n}`;
  }
  return `${letter}99`;
}

export function makeShelf(shelves: Shelf[], kind: ShelfKind, x: number, y: number): Shelf {
  const size: Record<ShelfKind, [number, number]> = {
    shelf: [6, 2],
    fridge: [8, 2],
    checkout: [4, 1],
    entrance: [5, 1],
  };
  const [w, h] = size[kind];
  return {
    id: nextId(),
    code: nextCode(shelves, kind),
    kind,
    x,
    y,
    w,
    h,
    category: undefined,
    included: kind === "shelf" || kind === "fridge",
    status: "todo",
    items: [],
  };
}

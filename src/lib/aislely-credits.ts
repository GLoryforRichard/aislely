// lib/credits.ts —— 统一 AI credit 计量
// 定价按 credit 消耗:每次 AI 识别 / 搜索消耗固定 credit;货架数仅作参考估算。
// ⚠️ 下列成本为 Beta 占位值,待功能完成后按 Bedrock 真实账单校准。
export const CREDIT_COST = { recognition: 10, search: 1 } as const;

/** 把"识别/搜索次数"换算成消耗的 credit 数 */
export function toCredits(recognitions: number, searches: number): number {
  return recognitions * CREDIT_COST.recognition + searches * CREDIT_COST.search;
}

/** 千分位展示,如 40,000 */
export function fmtCredits(n: number): string {
  return n.toLocaleString("en-US");
}

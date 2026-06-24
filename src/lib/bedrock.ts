// lib/bedrock.ts —— AWS Bedrock:Nova Lite 视觉识别 + Nova 中文别名扩展 + Titan V2 嵌入
// Prompt 移植自上一代项目(lib/gemini.ts BASE_VISION_PROMPT、tools-a.ts ALIAS_BATCH_PROMPT)
import "server-only";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
  type ConverseCommandOutput,
  type ImageFormat,
} from "@aws-sdk/client-bedrock-runtime";

// 模型 id 可经 env 覆盖。Nova 在 us-east-1 走跨区推理配置,需 "us." 前缀。
const VISION_MODEL = process.env.BEDROCK_VISION_MODEL || "us.amazon.nova-lite-v1:0";
const TEXT_MODEL = process.env.BEDROCK_TEXT_MODEL || "us.amazon.nova-lite-v1:0";
const EMBED_MODEL = process.env.BEDROCK_EMBED_MODEL || "amazon.titan-embed-text-v2:0";
export const EMBED_DIM = 1024; // Titan V2;与 schema 的 vector(1024) 一致,入库后不可改

const g = globalThis as unknown as { __wbBedrock?: BedrockRuntimeClient };
function getClient(): BedrockRuntimeClient {
  if (!g.__wbBedrock) {
    g.__wbBedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });
  }
  return g.__wbBedrock;
}

export interface DetectedProduct {
  name: string;
  category?: string;
  confidence?: "high" | "medium" | "low";
}

// ── 纯工具(移植自 tools-a.ts)────────────────────────────────────────────
export function buildSearchText(canonical: string, aliases: string[]): string {
  return Array.from(new Set([canonical, ...aliases].map((s) => s.trim()).filter(Boolean))).join(" · ");
}

export function normalizeCanonicalName(raw: string): string {
  return raw
    .trim()
    .replace(/\s*[[(][^\])]*[\])]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function converseText(resp: ConverseCommandOutput): string {
  const content = resp.output?.message?.content ?? [];
  return content
    .map((c) => ("text" in c && typeof c.text === "string" ? c.text : ""))
    .join("")
    .trim();
}

// 从模型输出里宽松地抠出 JSON(容忍 ```json 围栏 / 前后散文)
function parseJsonLoose<T>(text: string, fallback: T): T {
  if (!text) return fallback;
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s) as T;
  } catch {
    /* fall through */
  }
  const start = s.search(/[[{]/);
  const end = Math.max(s.lastIndexOf("]"), s.lastIndexOf("}"));
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(s.slice(start, end + 1)) as T;
    } catch {
      /* ignore */
    }
  }
  return fallback;
}

const BASE_VISION_PROMPT = `You are looking at a grocery store shelf photo from an Asian / international supermarket.

Identify every distinct product visible on the shelf. The shelf may contain items with packaging in English, Chinese, Korean, Japanese, or other languages.

IMPORTANT — what counts as a product:
- Only retail packages physically placed on the shelf for customers to buy.
- Skip labels printed on cardboard SHIPPING BOXES at the very top of the shelf (those boxes are storage, not stock).
- Skip price tags and shelf talkers.
- If you see N identical packages stacked, return ONE entry with a single bounding box covering the cluster.

CRITICAL — name the SPECIFIC product, never a category fallback:

Forbidden generic names (these are categories, not products):
  "Dried beans", "Sauce", "Snack", "Drink", "Noodle", "Spice", "Candy",
  "Cookies", "Canned food", "Chips", "Instant noodle", "Tea", "Oil",
  "Vinegar", "Frozen food".

How to name correctly — ALWAYS use the most specific identifier you can find:
1. PACKAGING LABEL — Read every word printed on the package, in any language. Combine brand + variety when both are visible, e.g. "Samyang Buldak Ramen", "Lao Gan Ma Chili Crisp", "Pocky Strawberry".
2. VARIETY CUES — If only a generic name is printed, use color/shape of contents, country-of-origin text, net weight to name the specific variety.
3. SHELF HINT — Use the worker-provided shelf hint to disambiguate, but never override clear visual evidence.
4. UNCERTAIN — If you still cannot identify, set confidence="low" AND write a SHORT descriptor with color/shape/packaging clues, e.g. "Unidentified red bottle sauce (no visible label)", NOT "Sauce".

Return ONLY a JSON array of objects, no prose, no markdown code fence. Keep it compact (no extra whitespace) so all products fit. Each object has exactly:
- "name": short SPECIFIC canonical English name. Title Case.
- "category": one of "sauce","noodle","snack","frozen","drink","dry-good","fresh","other"
- "confidence": "high" | "medium" | "low"

If the shelf is empty or unreadable, return [].`;

// Nova Lite 视觉:货架图 → 结构化商品列表
export async function detectShelfProducts(
  imageBytes: Uint8Array,
  format: ImageFormat = "jpeg",
  shelfHint?: string
): Promise<DetectedProduct[]> {
  const prompt = shelfHint
    ? `${BASE_VISION_PROMPT}\n\nWorker-provided shelf hint: ${shelfHint}`
    : BASE_VISION_PROMPT;

  const resp = await getClient().send(
    new ConverseCommand({
      modelId: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [{ image: { format, source: { bytes: imageBytes } } }, { text: prompt }],
        },
      ],
      inferenceConfig: { maxTokens: 5000, temperature: 0 },
    })
  );

  const raw = parseJsonLoose<unknown[]>(converseText(resp), []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => {
      const conf = p.confidence;
      return {
        name: String(p.name ?? "").trim(),
        category: typeof p.category === "string" ? p.category : undefined,
        confidence: conf === "high" || conf === "medium" || conf === "low" ? conf : undefined,
      } satisfies DetectedProduct;
    })
    .filter((p) => p.name.length > 0);
}

const ALIAS_BATCH_PROMPT = `You generate Chinese aliases for a list of grocery products in a bilingual (English + Chinese) supermarket.

Aliases are for displaying a readable bilingual label and catching Chinese-only queries.

Return ONLY a JSON object (no prose, no code fence) where each key is the input canonical English name (verbatim) and the value is an array of 3–6 short search aliases customers might type or say:
- 2–4 Chinese forms: the standard name, the common short form, AND the generic category word (e.g. for chili crisp include both "老干妈" and "辣椒酱")
- 1 pinyin form of the main Chinese name (e.g. "laoganma")
Keep each alias short; no duplicates; do not include the English name.

Example input names: ["Gochujang", "Lao Gan Ma chili crisp"]
Example output: {"Gochujang":["韩式辣椒酱","辣椒酱","gochujang"],"Lao Gan Ma chili crisp":["老干妈","辣椒酱","油辣椒","laoganma"]}`;

// Nova:批量为商品生成中文别名(绕开 Titan 跨语言弱)
export async function expandAliasesBatch(
  canonicalNames: string[],
  shelfContext?: string
): Promise<Record<string, string[]>> {
  if (!canonicalNames.length) return {};
  const resp = await getClient().send(
    new ConverseCommand({
      modelId: TEXT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              text:
                `${ALIAS_BATCH_PROMPT}\n\n` +
                (shelfContext ? `Shelf context: ${shelfContext}\n\n` : "") +
                `Canonical names:\n${JSON.stringify(canonicalNames)}`,
            },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 1500, temperature: 0.4 },
    })
  );

  const parsed = parseJsonLoose<Record<string, unknown>>(converseText(resp), {});
  const out: Record<string, string[]> = {};
  for (const name of canonicalNames) {
    const v = parsed[name];
    out[name] = Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
  }
  return out;
}

// Titan Text Embeddings V2 → 1024 维向量(已归一化)
export async function embed(text: string): Promise<number[]> {
  const resp = await getClient().send(
    new InvokeModelCommand({
      modelId: EMBED_MODEL,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({ inputText: text, dimensions: EMBED_DIM, normalize: true }),
    })
  );
  const parsed = JSON.parse(new TextDecoder().decode(resp.body)) as { embedding?: number[] };
  const v = parsed.embedding ?? [];
  if (v.length !== EMBED_DIM) {
    throw new Error(`Titan 返回维度 ${v.length},期望 ${EMBED_DIM}`);
  }
  return v;
}

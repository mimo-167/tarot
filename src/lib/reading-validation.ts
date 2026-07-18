import cardsJson from "@/data/tarot-cards.json";
import { getSpread } from "@/data/spreads";
import type { ReadingRequest, TarotCard } from "@/types/tarot";

const cards = cardsJson as TarotCard[];
const cardMap = new Map(cards.map((card) => [card.id, card]));

export type ValidationResult =
  | { ok: true; request: ReadingRequest; cards: TarotCard[] }
  | { ok: false; error: string };

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export function validateReadingRequest(value: unknown): ValidationResult {
  if (!value || typeof value !== "object") return { ok: false, error: "请求格式无效。" };
  const raw = value as Record<string, unknown>;
  const rawSpread = raw.spread as Record<string, unknown> | undefined;
  const spreadId = text(rawSpread?.id, 40);
  const canonicalSpread = getSpread(spreadId);
  if (!canonicalSpread) return { ok: false, error: "牌阵不存在。" };

  if (!Array.isArray(raw.cards) || raw.cards.length !== canonicalSpread.positions.length) {
    return { ok: false, error: "抽牌数量与牌阵不匹配。" };
  }

  const seen = new Set<string>();
  const selectedCards: TarotCard[] = [];
  const normalizedCards: ReadingRequest["cards"] = [];
  for (const [index, entry] of raw.cards.entries()) {
    if (!entry || typeof entry !== "object") return { ok: false, error: "抽牌数据无效。" };
    const item = entry as Record<string, unknown>;
    const id = text(item.id, 8);
    const orientation = item.orientation;
    const card = cardMap.get(id);
    if (!card || seen.has(id)) return { ok: false, error: "抽牌中存在无效或重复牌。" };
    if (orientation !== "upright" && orientation !== "reversed") {
      return { ok: false, error: "正逆位数据无效。" };
    }
    seen.add(id);
    selectedCards.push(card);
    normalizedCards.push({ id, orientation, position: canonicalSpread.positions[index] });
  }

  const rawOptions = raw.options as Record<string, unknown> | null | undefined;
  const options = canonicalSpread.needsOptions
    ? { a: text(rawOptions?.a, 100), b: text(rawOptions?.b, 100) }
    : null;
  if (canonicalSpread.needsOptions && (!options?.a || !options.b)) {
    return { ok: false, error: "二选一牌阵需要填写 A、B 两个选项。" };
  }

  return {
    ok: true,
    request: {
      question: text(raw.question, 300),
      context: text(raw.context, 800),
      timeframe: text(raw.timeframe, 100),
      spread: {
        id: canonicalSpread.id,
        name: canonicalSpread.name,
        description: canonicalSpread.description,
        positions: canonicalSpread.positions,
      },
      options,
      cards: normalizedCards,
    },
    cards: selectedCards,
  };
}

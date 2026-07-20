import cardsJson from "@/data/tarot-cards.json";
import { getSpread, localizeSpread } from "@/data/spreads";
import type { Locale } from "@/i18n/config";
import type { ReadingRequest, TarotCard } from "@/types/tarot";

const cards = cardsJson as TarotCard[];
const cardMap = new Map(cards.map((card) => [card.id, card]));

export type ValidationErrorCode =
  | "INVALID_REQUEST"
  | "SPREAD_NOT_FOUND"
  | "CARD_COUNT_MISMATCH"
  | "INVALID_CARD_DATA"
  | "INVALID_CARD"
  | "INVALID_ORIENTATION"
  | "OPTIONS_REQUIRED";

export type ValidationResult =
  | { ok: true; request: ReadingRequest; cards: TarotCard[] }
  | { ok: false; code: ValidationErrorCode };

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const invalid = (code: ValidationErrorCode): ValidationResult => ({ ok: false, code });

export function validateReadingRequest(
  value: unknown,
  locale: Locale = "zh-CN",
): ValidationResult {
  if (!value || typeof value !== "object") return invalid("INVALID_REQUEST");
  const raw = value as Record<string, unknown>;
  const rawSpread = raw.spread as Record<string, unknown> | undefined;
  const spreadId = text(rawSpread?.id, 40);
  const canonicalSpread = getSpread(spreadId);
  if (!canonicalSpread) return invalid("SPREAD_NOT_FOUND");
  const localizedSpread = localizeSpread(canonicalSpread, locale);

  if (!Array.isArray(raw.cards) || raw.cards.length !== localizedSpread.positions.length) {
    return invalid("CARD_COUNT_MISMATCH");
  }

  const seen = new Set<string>();
  const selectedCards: TarotCard[] = [];
  const normalizedCards: ReadingRequest["cards"] = [];
  for (const [index, entry] of raw.cards.entries()) {
    if (!entry || typeof entry !== "object") return invalid("INVALID_CARD_DATA");
    const item = entry as Record<string, unknown>;
    const id = text(item.id, 8);
    const orientation = item.orientation;
    const card = cardMap.get(id);
    if (!card || seen.has(id)) return invalid("INVALID_CARD");
    if (orientation !== "upright" && orientation !== "reversed") {
      return invalid("INVALID_ORIENTATION");
    }
    seen.add(id);
    selectedCards.push(card);
    normalizedCards.push({
      id,
      orientation,
      position: localizedSpread.positions[index],
    });
  }

  const rawOptions = raw.options as Record<string, unknown> | null | undefined;
  const options = localizedSpread.needsOptions
    ? { a: text(rawOptions?.a, 100), b: text(rawOptions?.b, 100) }
    : null;
  if (localizedSpread.needsOptions && (!options?.a || !options.b)) {
    return invalid("OPTIONS_REQUIRED");
  }

  return {
    ok: true,
    request: {
      locale,
      question: text(raw.question, 300),
      context: text(raw.context, 800),
      timeframe: text(raw.timeframe, 100),
      spread: {
        id: localizedSpread.id,
        name: localizedSpread.name,
        description: localizedSpread.description,
        positions: localizedSpread.positions,
      },
      options,
      cards: normalizedCards,
    },
    cards: selectedCards,
  };
}

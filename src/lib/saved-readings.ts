import "server-only";

import type { Locale } from "@/i18n/config";
import type { ReadingRequest, TarotCard } from "@/types/tarot";

export type ReadingRow = {
  id: string;
  user_id: string;
  user_email?: string;
  locale: Locale;
  question: string;
  context: string;
  timeframe: string;
  spread_id: string;
  spread_name: string;
  spread_description: string;
  positions_json: string;
  options_json: string | null;
  cards_json: string;
  ai_reading: string;
  created_at: number;
  updated_at: number;
};

function parseJson(value: string | null, fallback: unknown) {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return fallback;
  }
}

export function readingRowToJson(row: ReadingRow) {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    locale: row.locale,
    question: row.question,
    context: row.context,
    timeframe: row.timeframe,
    spread: {
      id: row.spread_id,
      name: row.spread_name,
      description: row.spread_description,
      positions: parseJson(row.positions_json, []),
    },
    options: parseJson(row.options_json, null),
    cards: parseJson(row.cards_json, []),
    aiReading: row.ai_reading,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createCardSnapshots(
  request: ReadingRequest,
  cards: TarotCard[],
) {
  return cards.map((card, index) => ({
    id: card.id,
    slug: card.slug,
    nameZh: card.nameZh,
    nameEn: card.nameEn,
    image: card.image,
    position: request.cards[index].position,
    orientation: request.cards[index].orientation,
    core: card.core,
    upright: card.upright,
    reversed: card.reversed,
    relationship: card.relationship,
    career: card.career,
    advice: card.advice,
  }));
}

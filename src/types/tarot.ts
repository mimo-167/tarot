import type { Locale } from "@/i18n/config";

export type Orientation = "upright" | "reversed";

export type SpreadCategory = "general" | "love" | "career" | "self";
export type SpreadDifficulty = "basic" | "advanced";

export type TarotCard = {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  arcana: "major" | "minor";
  suit: "major" | "wands" | "cups" | "swords" | "pentacles";
  number: number;
  image: string;
  core: string;
  upright: string;
  reversed: string;
  relationship: string;
  career: string;
  advice: string;
  knowledge: string;
};

export type Spread = {
  id: string;
  name: string;
  nameEn: string;
  eyebrow: string;
  eyebrowEn: string;
  description: string;
  descriptionEn: string;
  positions: string[];
  positionsEn: string[];
  questions: string[];
  questionsEn: string[];
  needsOptions?: boolean;
  category: SpreadCategory;
  difficulty: SpreadDifficulty;
};

export type LocalizedSpread = Pick<Spread, "id" | "needsOptions"> & {
  name: string;
  eyebrow: string;
  description: string;
  positions: string[];
  questions: string[];
  category: string;
  difficulty: string;
};

export type DrawnCard = TarotCard & {
  orientation: Orientation;
  revealed: boolean;
};

export type ReadingRequest = {
  locale: Locale;
  question: string;
  context?: string;
  timeframe?: string;
  spread: Pick<LocalizedSpread, "id" | "name" | "description" | "positions">;
  options?: { a: string; b: string } | null;
  cards: Array<{
    id: string;
    position: string;
    orientation: Orientation;
  }>;
};

export type AppView =
  | "home"
  | "spreads"
  | "question"
  | "preparation"
  | "table"
  | "reveal"
  | "daily"
  | "favorites"
  | "history";

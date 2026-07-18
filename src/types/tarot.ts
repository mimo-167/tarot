export type Orientation = "upright" | "reversed";

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
  eyebrow: string;
  description: string;
  positions: string[];
  needsOptions?: boolean;
  category: "通用" | "感情" | "事业" | "抉择";
};

export type DrawnCard = TarotCard & {
  orientation: Orientation;
  revealed: boolean;
};

export type ReadingRequest = {
  question: string;
  context?: string;
  timeframe?: string;
  spread: Pick<Spread, "id" | "name" | "description" | "positions">;
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
  | "table"
  | "reveal"
  | "daily"
  | "favorites";

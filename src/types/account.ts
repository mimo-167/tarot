import type { Locale } from "@/i18n/config";
import type { Orientation } from "@/types/tarot";

export type SessionUser = {
  id: string;
  email: string;
  role: "member" | "admin";
  locale: Locale;
  status: "active" | "suspended";
  createdAt: number;
  lastLoginAt: number;
};

export type SavedCardSnapshot = {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  image: string;
  position: string;
  orientation: Orientation;
  core: string;
  upright: string;
  reversed: string;
  relationship: string;
  career: string;
  advice: string;
};

export type SavedReading = {
  id: string;
  userId: string;
  userEmail?: string;
  locale: Locale;
  question: string;
  context: string;
  timeframe: string;
  spread: {
    id: string;
    name: string;
    description: string;
    positions: string[];
  };
  options: { a: string; b: string } | null;
  cards: SavedCardSnapshot[];
  aiReading: string;
  createdAt: number;
  updatedAt: number;
};

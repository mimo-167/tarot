import { describe, expect, it } from "vitest";
import cardsJson from "@/data/tarot-cards.json";
import { buildLocalSynthesis, createTableDeck, getCardCopy, localMeaningFor, orientationLabel, shuffle } from "@/lib/game";
import type { TarotCard } from "@/types/tarot";

describe("tarot game helpers", () => {
  it("keeps all 78 cards unique", () => {
    const deck = createTableDeck(cardsJson as TarotCard[], () => 0.42);
    expect(deck).toHaveLength(78);
    expect(new Set(deck.map((card) => card.id)).size).toBe(78);
    expect(deck.every((card) => card.orientation === "upright" || card.orientation === "reversed")).toBe(true);
  });

  it("does not mutate when shuffling", () => {
    const source = [1, 2, 3, 4];
    const result = shuffle(source, () => 0.2);
    expect(source).toEqual([1, 2, 3, 4]);
    expect(result).toHaveLength(4);
  });

  it("returns a useful local synthesis", () => {
    const deck = createTableDeck(cardsJson as TarotCard[], () => 0.3);
    expect(buildLocalSynthesis(deck.slice(0, 3)).length).toBeGreaterThan(0);
  });

  it("localizes card meanings, orientations, and synthesis in English", () => {
    const deck = createTableDeck(cardsJson as TarotCard[], () => 0.3);
    const card = deck[0];
    const copy = getCardCopy(card, "en");
    expect(copy.name).toBe(card.nameEn);
    expect(copy.upright).not.toMatch(/[\u4e00-\u9fff]/);
    expect(orientationLabel("reversed", "en")).toBe("Reversed");
    expect(localMeaningFor(card, "What should I know about my career?", "en")).toContain(copy.career);
    expect(buildLocalSynthesis(deck.slice(0, 3), "en").join(" ")).not.toMatch(/[\u4e00-\u9fff]/);
  });
});

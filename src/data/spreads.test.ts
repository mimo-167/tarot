import { describe, expect, it } from "vitest";
import { localizeSpread, spreads } from "@/data/spreads";

describe("tarot spread catalogue", () => {
  it("contains 23 complete bilingual spreads with unique ids", () => {
    expect(spreads).toHaveLength(23);
    expect(new Set(spreads.map((spread) => spread.id)).size).toBe(23);

    for (const spread of spreads) {
      expect(spread.positionsEn).toHaveLength(spread.positions.length);
      expect(spread.questions.length).toBeGreaterThan(0);
      expect(spread.questionsEn.length).toBeGreaterThan(0);
      expect(localizeSpread(spread, "en").positions).toEqual(spread.positionsEn);
    }
  });

  it("places the three image-only spreads in their requested advanced groups", () => {
    expect(spreads.find((spread) => spread.id === "innerGift")).toMatchObject({
      category: "self",
      difficulty: "advanced",
    });
    expect(spreads.find((spread) => spread.id === "ankh")).toMatchObject({
      category: "self",
      difficulty: "advanced",
    });
    expect(spreads.find((spread) => spread.id === "wealthTree")).toMatchObject({
      category: "career",
      difficulty: "advanced",
    });
  });
});

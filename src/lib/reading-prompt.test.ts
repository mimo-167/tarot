import { describe, expect, it } from "vitest";
import englishCardsJson from "@/data/tarot-cards.en.json";
import cardsJson from "@/data/tarot-cards.json";
import { localizeSpread, spreads } from "@/data/spreads";
import type { Locale } from "@/i18n/config";
import { buildUserPrompt, SYSTEM_PROMPTS } from "@/lib/reading-prompt";
import type { ReadingRequest, TarotCard } from "@/types/tarot";

type EnglishCardCopy = {
  id: string;
  upright: string;
  reversed: string;
  relationship: string;
  career: string;
  advice: string;
};

const englishCards = englishCardsJson as EnglishCardCopy[];
const cards = cardsJson as TarotCard[];
const cjkPattern = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;

function makeReading(locale: Locale) {
  const spread = localizeSpread(spreads.find((item) => item.id === "free3")!, locale);
  const selectedCards = ["M00", "M01", "M02"].map((id) => {
    const card = cards.find((candidate) => candidate.id === id);
    if (!card) throw new Error(`Missing test card: ${id}`);
    return card;
  });
  const request: ReadingRequest = {
    locale,
    question: "",
    context: "",
    timeframe: "",
    spread,
    options: null,
    cards: selectedCards.map((card, index) => ({
      id: card.id,
      position: spread.positions[index],
      orientation: index === 1 ? "reversed" : "upright",
    })),
  };
  return { request, selectedCards };
}

describe("English tarot card copy", () => {
  it("covers all 78 canonical cards with unique ids and complete English fields", () => {
    const ids = englishCards.map((card) => card.id);
    const canonicalIds = cards.map((card) => card.id);

    expect(englishCards).toHaveLength(78);
    expect(new Set(ids).size).toBe(78);
    expect([...ids].sort()).toEqual([...canonicalIds].sort());

    for (const card of englishCards) {
      expect(Object.keys(card).sort()).toEqual(
        ["id", "upright", "reversed", "relationship", "career", "advice"].sort(),
      );
      for (const field of ["id", "upright", "reversed", "relationship", "career", "advice"] as const) {
        expect(card[field].trim(), `${card.id}.${field} should not be empty`).not.toBe("");
      }
      expect(JSON.stringify(card), `${card.id} should not contain Chinese copy`).not.toMatch(cjkPattern);
    }
  });
});

describe("localized reading prompts", () => {
  it("builds an English-only prompt with English headings, positions, and orientations", () => {
    const { request, selectedCards } = makeReading("en");
    const userPrompt = buildUserPrompt(request, selectedCards, "en");

    expect(SYSTEM_PROMPTS.en).toContain("## Card-by-card");
    expect(SYSTEM_PROMPTS.en).toContain("## Reading the spread as a whole");
    expect(SYSTEM_PROMPTS.en).toContain("## Back to your question");
    expect(SYSTEM_PROMPTS.en).toContain("## Takeaways");
    expect(SYSTEM_PROMPTS.en).toContain("### Position | Card · Upright/Reversed");
    expect(userPrompt).toContain("Position: Present situation");
    expect(userPrompt).toContain("Position: Central influence");
    expect(userPrompt).toContain("· Upright");
    expect(userPrompt).toContain("· Reversed");
    expect(userPrompt).toContain("What theme in my life deserves the most attention right now?");
    expect(userPrompt).not.toMatch(cjkPattern);
  });

  it("keeps the Chinese headings and orientation labels in the Chinese prompt", () => {
    const { request, selectedCards } = makeReading("zh-CN");
    const userPrompt = buildUserPrompt(request, selectedCards, "zh-CN");

    expect(SYSTEM_PROMPTS["zh-CN"]).toContain("## 逐张看牌");
    expect(SYSTEM_PROMPTS["zh-CN"]).toContain("## 这组牌连起来看");
    expect(SYSTEM_PROMPTS["zh-CN"]).toContain("## 回到你的问题");
    expect(SYSTEM_PROMPTS["zh-CN"]).toContain("## 可以带走的提醒");
    expect(userPrompt).toContain("位置：现状");
    expect(userPrompt).toContain("· 正位");
    expect(userPrompt).toContain("· 逆位");
  });
});

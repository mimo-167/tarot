import { describe, expect, it } from "vitest";
import {
  createReadingPreview,
  GUEST_PREVIEW_BOUNDARY,
  isSafetyReading,
  stripGuestPreviewBoundary,
} from "@/lib/reading-preview";

describe("createReadingPreview", () => {
  it("shows all card-by-card content and only the marked first half of the synthesis", () => {
    const reading = `先看这次抽牌的脉络。

## 逐张看牌

### 现状｜愚者 · 正位

CARD_ONE

### 核心影响｜魔术师 · 逆位

CARD_TWO

## 这组牌连起来看

VISIBLE_SYNTHESIS_HOOK

${GUEST_PREVIEW_BOUNDARY}

LOCKED_SYNTHESIS

## 回到你的问题

LOCKED_ANSWER

## 可以带走的提醒

LOCKED_TAKEAWAYS`;

    const preview = createReadingPreview(reading, "zh-CN");
    expect(preview).toContain("## 逐张看牌");
    expect(preview).toContain("CARD_ONE");
    expect(preview).toContain("CARD_TWO");
    expect(preview).toContain("## 这组牌连起来看");
    expect(preview).toContain("VISIBLE_SYNTHESIS_HOOK");
    expect(preview).not.toContain(GUEST_PREVIEW_BOUNDARY);
    expect(preview).not.toContain("LOCKED_SYNTHESIS");
    expect(preview).not.toContain("回到你的问题");
    expect(preview).not.toContain("LOCKED_ANSWER");
  });

  it("supports the English response structure", () => {
    const reading = `Opening.

## Card-by-card

ALL_CARD_CONTENT

## Reading the spread as a whole

VISIBLE_HOOK

${GUEST_PREVIEW_BOUNDARY}

LOCKED_SYNTHESIS

## Back to your question

LOCKED_ANSWER`;

    const preview = createReadingPreview(reading, "en");
    expect(preview).toContain("ALL_CARD_CONTENT");
    expect(preview).toContain("VISIBLE_HOOK");
    expect(preview).not.toContain("LOCKED_SYNTHESIS");
    expect(preview).not.toContain("Back to your question");
  });

  it("uses half of the synthesis when the model omits the boundary", () => {
    const reading = `## Card-by-card

ALL_CARDS

## Reading the spread as a whole

1234567890

## Back to your question

LOCKED_ANSWER`;

    const preview = createReadingPreview(reading, "en");
    expect(preview).toContain("ALL_CARDS");
    expect(preview).toContain("12345");
    expect(preview).not.toContain("67890");
    expect(preview).not.toContain("LOCKED_ANSWER");
  });

  it("removes the technical boundary from the complete reading", () => {
    expect(stripGuestPreviewBoundary(`Before

${GUEST_PREVIEW_BOUNDARY}

After`)).toBe("Before\n\nAfter");
  });

  it("returns no preview when the required response structure is missing", () => {
    expect(createReadingPreview("A direct unstructured answer.", "en")).toBe("");
  });

  it("recognizes localized safety readings", () => {
    expect(isSafetyReading("## 安全优先\n\n请立即联系可信赖的人。", "zh-CN")).toBe(true);
    expect(isSafetyReading("## Safety first\n\nContact local emergency support.", "en")).toBe(true);
    expect(isSafetyReading("## Card-by-card\n\nA normal reading.", "en")).toBe(false);
    expect(isSafetyReading("## Safety first\n\nSupport.\n\n## Takeaways\n\nMore.", "en")).toBe(false);
  });
});

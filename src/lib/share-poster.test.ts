import { describe, expect, it } from "vitest";
import { spreads } from "@/data/spreads";
import { getShareFileName, readingExcerpt } from "@/lib/share-poster";

describe("share poster helpers", () => {
  it("turns a Markdown reading into a compact plain-text excerpt", () => {
    const result = readingExcerpt("## Back to your question\n\n**Move slowly** and [check the facts](https://example.com).\n- Keep a boundary.");

    expect(result).toBe("Back to your question Move slowly and check the facts. - Keep a boundary.");
    expect(result).not.toMatch(/[#*_`\[\]()]/);
  });

  it("creates localized PNG download names", () => {
    expect(getShareFileName(spreads[0], "zh-CN")).toBe("星月塔罗-三张自由牌.png");
    expect(getShareFileName(spreads[0], "en")).toBe("moon-stars-tarot-three-card-reflection.png");
  });
});

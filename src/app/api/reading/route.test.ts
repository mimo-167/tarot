import { describe, expect, it } from "vitest";
import { spreads } from "@/data/spreads";
import { validateReadingRequest } from "@/lib/reading-validation";

describe("validateReadingRequest", () => {
  it("accepts a canonical three-card reading", () => {
    const spread = spreads[0];
    const result = validateReadingRequest({
      question: "我该关注什么？",
      spread,
      cards: ["M00", "W01", "C02"].map((id, index) => ({
        id,
        position: spread.positions[index],
        orientation: index === 1 ? "reversed" : "upright",
      })),
    });
    expect(result.ok).toBe(true);
  });

  it("rejects duplicate cards", () => {
    const spread = spreads[0];
    const result = validateReadingRequest({
      spread,
      cards: spread.positions.map((position) => ({ id: "M00", position, orientation: "upright" })),
    });
    expect(result).toMatchObject({ ok: false });
  });

  it("requires both choices for the choice spread", () => {
    const spread = spreads.find((item) => item.id === "choice")!;
    const result = validateReadingRequest({
      spread,
      options: { a: "A", b: "" },
      cards: ["M00", "M01", "M02", "M03", "M04"].map((id, index) => ({
        id,
        position: spread.positions[index],
        orientation: "upright",
      })),
    });
    expect(result).toMatchObject({ ok: false });
  });
});

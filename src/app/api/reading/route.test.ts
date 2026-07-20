import { describe, expect, it } from "vitest";
import { spreads } from "@/data/spreads";
import { validateReadingRequest } from "@/lib/reading-validation";
import { POST } from "@/app/api/reading/route";

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

  it("normalizes English spread copy and ignores client-provided positions", () => {
    const spread = spreads[0];
    const result = validateReadingRequest({
      locale: "en",
      question: "What deserves my attention?",
      spread: { id: spread.id, name: "tampered", positions: ["tampered"] },
      cards: ["M00", "W01", "C02"].map((id) => ({
        id,
        position: "tampered",
        orientation: "upright",
      })),
    }, "en");

    expect(result).toMatchObject({
      ok: true,
      request: {
        locale: "en",
        spread: {
          name: "Three-Card Reflection",
          positions: ["First card", "Second card", "Third card"],
        },
        cards: [
          { position: "First card" },
          { position: "Second card" },
          { position: "Third card" },
        ],
      },
    });
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
    expect(result).toMatchObject({ ok: false, code: "OPTIONS_REQUIRED" });
  });
});

describe("reading API localization", () => {
  it("returns an English error for malformed JSON when requested by header", async () => {
    const response = await POST(new Request("http://localhost/api/reading", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tarot-locale": "en",
      },
      body: "{",
    }));

    expect(response.status).toBe(400);
    expect(response.headers.get("content-language")).toBe("en");
    expect(await response.json()).toEqual({
      code: "INVALID_JSON",
      error: "The request body is not valid JSON.",
    });
  });

  it("uses the payload locale for localized validation errors", async () => {
    const response = await POST(new Request("http://localhost/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept-Language": "zh-CN" },
      body: JSON.stringify({ locale: "en", spread: { id: "missing" }, cards: [] }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "SPREAD_NOT_FOUND",
      error: "That tarot spread does not exist.",
    });
  });
});

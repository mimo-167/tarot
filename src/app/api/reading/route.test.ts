import { afterEach, describe, expect, it, vi } from "vitest";
import { spreads } from "@/data/spreads";
import { getRuntimeEnv } from "@/lib/runtime-env";
import { validateReadingRequest } from "@/lib/reading-validation";
import { POST } from "@/app/api/reading/route";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(async () => null),
  isSameOrigin: vi.fn(() => true),
  sha256: vi.fn(async (value: string) => value),
}));
vi.mock("@/lib/runtime-env", () => ({
  getRuntimeEnv: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("validateReadingRequest", () => {
  it("accepts a canonical three-card reading", () => {
    const spread = spreads.find((item) => item.id === "free3")!;
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
    const spread = spreads.find((item) => item.id === "free3")!;
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
          name: "Open Three-Card Spread",
          positions: ["Present situation", "Central influence", "Development trend"],
        },
        cards: [
          { position: "Present situation" },
          { position: "Central influence" },
          { position: "Development trend" },
        ],
      },
    });
  });

  it("rejects duplicate cards", () => {
    const spread = spreads.find((item) => item.id === "free3")!;
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

describe("reading API guest access", () => {
  it("returns the complete AI reading without requiring login or storing an unlock preview", async () => {
    const spread = spreads.find((item) => item.id === "free3")!;
    const generatedReading = `## 逐张看牌

完整逐牌解读

## 这组牌连起来看

完整组合解读

<!-- guest-preview-boundary -->

## 回到你的问题

完整问题答案

## 可以带走的提醒

- 完整行动建议`;
    vi.mocked(getRuntimeEnv).mockReturnValue({
      DEEPSEEK_API_KEY: "test-key",
      AI_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    } as ReturnType<typeof getRuntimeEnv>);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: generatedReading } }],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));

    const response = await POST(new Request("http://localhost/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-tarot-locale": "zh-CN" },
      body: JSON.stringify({
        locale: "zh-CN",
        spread: { id: spread.id },
        cards: ["M00", "W01", "C02"].map((id, index) => ({
          id,
          position: spread.positions[index],
          orientation: "upright",
        })),
      }),
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      reading: expect.stringContaining("完整问题答案"),
      isPreview: false,
    });
    expect(body.reading).toContain("完整行动建议");
    expect(body.reading).not.toContain("guest-preview-boundary");
    expect(body).not.toHaveProperty("previewId");
  });
});

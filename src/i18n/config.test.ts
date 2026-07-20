import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  localeFromAcceptLanguage,
  resolveLocale,
} from "@/i18n/config";

describe("locale resolution", () => {
  it("uses a valid locale cookie before browser preferences", () => {
    expect(resolveLocale("zh-CN", "en-US,en;q=0.9")).toBe("zh-CN");
    expect(resolveLocale("en", "zh-CN,zh;q=0.9")).toBe("en");
  });

  it("ignores an invalid locale cookie", () => {
    expect(resolveLocale("fr", "zh-TW,zh;q=0.9")).toBe("zh-CN");
  });

  it("maps any Chinese or English language variant", () => {
    expect(localeFromAcceptLanguage("zh-Hant-TW,zh;q=0.9")).toBe("zh-CN");
    expect(localeFromAcceptLanguage("en-GB,en;q=0.8")).toBe("en");
  });

  it("honors quality weights and original order for ties", () => {
    expect(localeFromAcceptLanguage("en-US;q=0.6,zh-CN;q=0.9")).toBe("zh-CN");
    expect(localeFromAcceptLanguage("en-US;q=0.8,zh-CN;q=0.8")).toBe("en");
  });

  it("skips disabled languages and falls back to English for unsupported browser languages", () => {
    expect(localeFromAcceptLanguage("zh-CN;q=0,en-US;q=0.7")).toBe("en");
    expect(localeFromAcceptLanguage("fr-FR,de;q=0.8")).toBe("en");
  });

  it("keeps Chinese as the default when no language header is available", () => {
    expect(localeFromAcceptLanguage(null)).toBe(DEFAULT_LOCALE);
    expect(localeFromAcceptLanguage("  ")).toBe(DEFAULT_LOCALE);
  });
});

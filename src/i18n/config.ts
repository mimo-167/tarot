export type Locale = "zh-CN" | "en";

export const LOCALE_COOKIE = "tarot_locale";
export const DEFAULT_LOCALE: Locale = "zh-CN";
export const FALLBACK_BROWSER_LOCALE: Locale = "en";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "zh-CN" || value === "en";
}

type LanguagePreference = {
  index: number;
  quality: number;
  range: string;
};

function parseLanguagePreference(value: string, index: number): LanguagePreference | null {
  const [rawRange, ...parameters] = value.split(";");
  const range = rawRange.trim().toLowerCase();
  if (!range) return null;

  let quality = 1;
  const qualityParameter = parameters
    .map((parameter) => parameter.trim())
    .find((parameter) => parameter.toLowerCase().startsWith("q="));

  if (qualityParameter) {
    const parsedQuality = Number(qualityParameter.slice(2));
    quality = Number.isFinite(parsedQuality) && parsedQuality >= 0 && parsedQuality <= 1
      ? parsedQuality
      : 0;
  }

  return { index, quality, range };
}

export function localeFromAcceptLanguage(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage?.trim()) return DEFAULT_LOCALE;

  const preferences = acceptLanguage
    .split(",")
    .map(parseLanguagePreference)
    .filter((preference): preference is LanguagePreference => Boolean(preference))
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  for (const { quality, range } of preferences) {
    if (quality === 0 || range === "*") continue;
    const language = range.split("-")[0];
    if (language === "zh") return "zh-CN";
    if (language === "en") return "en";
  }

  return FALLBACK_BROWSER_LOCALE;
}

export function resolveLocale(
  cookieLocale: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  return isLocale(cookieLocale) ? cookieLocale : localeFromAcceptLanguage(acceptLanguage);
}

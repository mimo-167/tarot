import type { Locale } from "@/i18n/config";

export const GUEST_PREVIEW_BOUNDARY = "<!-- guest-preview-boundary -->";

const sectionHeadings: Record<Locale, { cards: string; whole: string; safety: string }> = {
  "zh-CN": {
    cards: "逐张看牌",
    whole: "这组牌连起来看",
    safety: "安全优先",
  },
  en: {
    cards: "Card-by-card",
    whole: "Reading the spread as a whole",
    safety: "Safety first",
  },
};

type Section = {
  start: number;
  bodyStart: number;
  title: string;
};

function findSections(reading: string): Section[] {
  return [...reading.matchAll(/^##[ \t]+(.+?)[ \t]*\r?$/gm)].map((match) => {
    let bodyStart = (match.index || 0) + match[0].length;
    while (reading[bodyStart] === "\r" || reading[bodyStart] === "\n") bodyStart += 1;
    return {
      start: match.index || 0,
      bodyStart,
      title: match[1].trim(),
    };
  });
}

export function stripGuestPreviewBoundary(reading: string) {
  return reading
    .replaceAll(GUEST_PREVIEW_BOUNDARY, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isSafetyReading(reading: string, locale: Locale) {
  const expected = sectionHeadings[locale];
  const sections = findSections(reading);
  return sections.length === 1 && sections[0].title === expected.safety;
}

export function createReadingPreview(reading: string, locale: Locale) {
  const sections = findSections(reading);
  const expected = sectionHeadings[locale];
  const cardsIndex = sections.findIndex((section) => section.title === expected.cards);
  const wholeIndex = sections.findIndex(
    (section, index) => index > cardsIndex && section.title === expected.whole,
  );

  if (cardsIndex < 0 || wholeIndex < 0) return "";

  const cardsSection = sections[cardsIndex];
  const wholeSection = sections[wholeIndex];
  const nextSection = sections[wholeIndex + 1];
  const wholeEnd = nextSection?.start ?? reading.length;
  const boundary = reading.indexOf(GUEST_PREVIEW_BOUNDARY, wholeSection.bodyStart);
  const hasBoundary = boundary >= wholeSection.bodyStart && boundary < wholeEnd;
  let wholeContentEnd = wholeEnd;
  while (
    wholeContentEnd > wholeSection.bodyStart
    && /\s/u.test(reading[wholeContentEnd - 1])
  ) {
    wholeContentEnd -= 1;
  }
  const previewEnd = hasBoundary
    ? boundary
    : wholeSection.bodyStart + Math.ceil(
      (wholeContentEnd - wholeSection.bodyStart) / 2,
    );

  return stripGuestPreviewBoundary(reading.slice(cardsSection.start, previewEnd));
}

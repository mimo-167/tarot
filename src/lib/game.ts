import type { DrawnCard, TarotCard } from "@/types/tarot";
import type { Locale } from "@/i18n/config";
import englishCardsJson from "@/data/tarot-cards.en.json";

export type TableCard = DrawnCard & {
  x: number;
  y: number;
  rotate: number;
  selected: boolean;
};

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function createTableDeck(cards: TarotCard[], random = Math.random): TableCard[] {
  return shuffle(cards, random).map((card) => ({
    ...card,
    orientation: random() < 0.5 ? "reversed" : "upright",
    revealed: false,
    selected: false,
    x: 4 + random() * 84,
    y: 5 + random() * 76,
    rotate: -32 + random() * 64,
  }));
}

type EnglishCardCopy = {
  id: string;
  upright: string;
  reversed: string;
  relationship: string;
  career: string;
  advice: string;
};

const englishCardMap = new Map(
  (englishCardsJson as EnglishCardCopy[]).map((card) => [card.id, card]),
);

export function getCardCopy(card: TarotCard, locale: Locale) {
  if (locale === "en") {
    const english = englishCardMap.get(card.id);
    if (english) return { name: card.nameEn, ...english };
  }
  return {
    id: card.id,
    name: card.nameZh,
    upright: card.upright,
    reversed: card.reversed,
    relationship: card.relationship,
    career: card.career,
    advice: card.advice,
  };
}

const synthesisCopy = {
  "zh-CN": {
    suitNames: { major: "大阿尔卡那", wands: "权杖", cups: "圣杯", swords: "宝剑", pentacles: "星币" },
    suitFocus: {
      major: "人生阶段、价值选择与更深层的课题",
      wands: "行动、动力、创造与推进节奏",
      cups: "感受、关系、直觉与情绪需要",
      swords: "事实、沟通、判断与边界",
      pentacles: "工作、金钱、时间、身体与现实基础",
    },
    leading: (suit: string, focus: string) => `这组牌里${suit}主题较集中，眼下尤其值得观察${focus}。这不是吉凶计分，而是在提示问题主要在哪一层运作。`,
    mixed: "这组牌分布在不同花色，说明问题同时牵动感受、想法、行动或现实条件。与其寻找单一答案，更适合逐层梳理每个位置。",
    major: "大阿尔卡那占比较明显，牌面更像在讨论阶段转换、价值取舍或身份感，而不只是一个短期技巧。最终仍要回到你能观察和调整的现实行动。",
    repeated: (number: string) => `牌面重复出现数字 ${number} 的阶段主题。可以把它看作一种节奏上的呼应，但具体含义仍以各自花色和牌阵位置为准。`,
    close: "本地解读提供的是牌义线索。把每张牌放回它的位置与现实信息中核对，会比把任何一张牌当作确定结论更有帮助。",
  },
  en: {
    suitNames: { major: "Major Arcana", wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pentacles" },
    suitFocus: {
      major: "life stages, value choices, and deeper personal themes",
      wands: "action, motivation, creativity, and the pace of progress",
      cups: "feelings, relationships, intuition, and emotional needs",
      swords: "facts, communication, judgment, and boundaries",
      pentacles: "work, money, time, the body, and practical foundations",
    },
    leading: (suit: string, focus: string) => `${suit} appears more than once, drawing attention to ${focus}. This is not a score of good or bad cards; it suggests the layer of life where the question is most active.`,
    mixed: "The cards span different suits, suggesting that feelings, thoughts, actions, and practical conditions may all be involved. Rather than seeking one simple answer, work through the positions layer by layer.",
    major: "The Major Arcana are especially prominent. The cards may be speaking to a shift in life stage, values, or identity rather than only a short-term technique. Bring the reflection back to actions you can observe and influence.",
    repeated: (number: string) => `The number ${number} repeats among the Minor Arcana, creating a possible echo in the pace or stage of the situation. Its meaning still depends on each suit and spread position.`,
    close: "These local meanings are interpretive clues. Checking each card against its position and the facts of your situation is more useful than treating any single card as a fixed conclusion.",
  },
} satisfies Record<Locale, {
  suitNames: Record<TarotCard["suit"], string>;
  suitFocus: Record<TarotCard["suit"], string>;
  leading: (suit: string, focus: string) => string;
  mixed: string;
  major: string;
  repeated: (number: string) => string;
  close: string;
}>;

export function buildLocalSynthesis(cards: DrawnCard[], locale: Locale = "zh-CN"): string[] {
  if (!cards.length) return [];
  const copy = synthesisCopy[locale];
  const suitCounts = cards.reduce<Record<string, number>>((counts, card) => {
    counts[card.suit] = (counts[card.suit] || 0) + 1;
    return counts;
  }, {});
  const [leadingSuit, leadingCount] = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0] as [
    TarotCard["suit"],
    number,
  ];
  const majorCount = cards.filter((card) => card.arcana === "major").length;
  const insights: string[] = [];

  if (leadingCount > 1) {
    insights.push(copy.leading(copy.suitNames[leadingSuit], copy.suitFocus[leadingSuit]));
  } else {
    insights.push(copy.mixed);
  }

  if (majorCount >= Math.ceil(cards.length / 2)) {
    insights.push(copy.major);
  }

  const numberCounts = cards.reduce<Record<number, number>>((counts, card) => {
    if (card.arcana === "minor") counts[card.number] = (counts[card.number] || 0) + 1;
    return counts;
  }, {});
  const repeated = Object.entries(numberCounts).find(([, count]) => count > 1);
  if (repeated) {
    insights.push(copy.repeated(repeated[0]));
  }

  insights.push(copy.close);
  return insights;
}

export const orientationLabel = (orientation: DrawnCard["orientation"], locale: Locale = "zh-CN") =>
  orientation === "reversed"
    ? locale === "en" ? "Reversed" : "逆位"
    : locale === "en" ? "Upright" : "正位";

export function localMeaningFor(card: DrawnCard, question: string, locale: Locale = "zh-CN") {
  const copy = getCardCopy(card, locale);
  const base = card.orientation === "reversed" ? copy.reversed : copy.upright;
  if (locale === "en") {
    if (/love|relationship|partner|dating|marriage|marry|romance|reconcil|breakup/i.test(question)) return `${base} ${copy.relationship}`;
    if (/work|career|job|study|school|exam|money|financ|profession|project|business|startup/i.test(question)) return `${base} ${copy.career}`;
  } else {
    if (/感情|关系|对方|喜欢|爱|婚|复合/.test(question)) return `${base} ${copy.relationship}`;
    if (/工作|事业|学业|考试|钱|财|职业|项目|创业/.test(question)) return `${base} ${copy.career}`;
  }
  return `${base} ${copy.advice}`;
}

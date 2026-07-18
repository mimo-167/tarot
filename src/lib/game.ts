import type { DrawnCard, TarotCard } from "@/types/tarot";

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

const suitNames: Record<TarotCard["suit"], string> = {
  major: "大阿尔卡那",
  wands: "权杖",
  cups: "圣杯",
  swords: "宝剑",
  pentacles: "星币",
};

const suitFocus: Record<TarotCard["suit"], string> = {
  major: "人生阶段、价值选择与更深层的课题",
  wands: "行动、动力、创造与推进节奏",
  cups: "感受、关系、直觉与情绪需要",
  swords: "事实、沟通、判断与边界",
  pentacles: "工作、金钱、时间、身体与现实基础",
};

export function buildLocalSynthesis(cards: DrawnCard[]): string[] {
  if (!cards.length) return [];
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
    insights.push(`这组牌里${suitNames[leadingSuit]}主题较集中，眼下尤其值得观察${suitFocus[leadingSuit]}。这不是吉凶计分，而是在提示问题主要在哪一层运作。`);
  } else {
    insights.push("这组牌分布在不同花色，说明问题同时牵动感受、想法、行动或现实条件。与其寻找单一答案，更适合逐层梳理每个位置。 ");
  }

  if (majorCount >= Math.ceil(cards.length / 2)) {
    insights.push("大阿尔卡那占比较明显，牌面更像在讨论阶段转换、价值取舍或身份感，而不只是一个短期技巧。最终仍要回到你能观察和调整的现实行动。 ");
  }

  const numberCounts = cards.reduce<Record<number, number>>((counts, card) => {
    if (card.arcana === "minor") counts[card.number] = (counts[card.number] || 0) + 1;
    return counts;
  }, {});
  const repeated = Object.entries(numberCounts).find(([, count]) => count > 1);
  if (repeated) {
    insights.push(`牌面重复出现数字 ${repeated[0]} 的阶段主题。可以把它看作一种节奏上的呼应，但具体含义仍以各自花色和牌阵位置为准。`);
  }

  insights.push("本地解读提供的是牌义线索。把每张牌放回它的位置与现实信息中核对，会比把任何一张牌当作确定结论更有帮助。 ");
  return insights;
}

export const orientationLabel = (orientation: DrawnCard["orientation"]) =>
  orientation === "reversed" ? "逆位" : "正位";

export function localMeaningFor(card: DrawnCard, question: string) {
  const base = card.orientation === "reversed" ? card.reversed : card.upright;
  if (/感情|关系|对方|喜欢|爱|婚|复合/.test(question)) return `${base} ${card.relationship}`;
  if (/工作|事业|学业|考试|钱|财|职业|项目|创业/.test(question)) return `${base} ${card.career}`;
  return `${base} ${card.advice}`;
}

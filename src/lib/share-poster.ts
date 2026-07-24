import type { DrawnCard, Spread } from "@/types/tarot";
import type { Locale } from "@/i18n/config";
import { getCardCopy, orientationLabel } from "@/lib/game";
import { localizeSpread } from "@/data/spreads";

const posterCopy = {
  "zh-CN": {
    unsupported: "当前浏览器无法生成分享图",
    brand: "星 月 塔 罗",
    subtitle: (spread: string) => `${spread} · 一次属于你的静心观察`,
    reflection: "牌面是一面镜子，答案仍在你的现实选择里。",
    disclaimer: "星月塔罗 · 仅用于娱乐、自我观察与启发",
    failed: "分享图生成失败",
    fileName: (spread: string) => `星月塔罗-${spread}.png`,
    readingTitle: "解读摘录",
  },
  en: {
    unsupported: "This browser cannot create a share image",
    brand: "MOON & STARS TAROT",
    subtitle: (spread: string) => `${spread} · A quiet moment of reflection`,
    reflection: "The cards are a mirror; your choices in real life remain your own.",
    disclaimer: "Moon & Stars Tarot · For entertainment and reflection only",
    failed: "Could not create the share image",
    fileName: (spread: string) => `moon-stars-tarot-${spread.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.png`,
    readingTitle: "Reading snapshot",
  },
} satisfies Record<Locale, {
  unsupported: string;
  brand: string;
  subtitle: (spread: string) => string;
  reflection: string;
  disclaimer: string;
  failed: string;
  fileName: (spread: string) => string;
  readingTitle: string;
}>;

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });

const roundedRect = (context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  context.beginPath();
  context.roundRect(x, y, w, h, r);
};

export const readingExcerpt = (value: string) => value
  .replace(/```[\s\S]*?```/g, " ")
  .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
  .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/[#>*_`~|]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const wrapCanvasText = (
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines: number,
) => {
  const lines: string[] = [];
  let line = "";
  const pushPiece = (piece: string) => {
    if (lines.length >= maxLines) return;
    const candidate = line ? `${line} ${piece}` : piece;
    if (context.measureText(candidate).width <= maxWidth) {
      line = candidate;
      return;
    }
    if (line) lines.push(line);
    if (lines.length >= maxLines) {
      line = "";
      return;
    }
    line = piece;
  };

  for (const word of value.split(/\s+/)) {
    if (context.measureText(word).width <= maxWidth) {
      pushPiece(word);
    } else {
      let fragment = "";
      for (const character of Array.from(word)) {
        const candidate = `${fragment}${character}`;
        if (fragment && context.measureText(candidate).width > maxWidth) {
          pushPiece(fragment);
          fragment = character;
        } else {
          fragment = candidate;
        }
      }
      if (fragment) pushPiece(fragment);
    }
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && value.length > lines.join(" ").length) {
    let last = lines.at(-1) || "";
    while (last && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last.trimEnd()}…`;
  }
  return lines;
};

export function getShareFileName(spread: Spread, locale: Locale = "zh-CN") {
  return posterCopy[locale].fileName(localizeSpread(spread, locale).name);
}

export async function createSharePoster(
  cards: DrawnCard[],
  spread: Spread,
  locale: Locale = "zh-CN",
  reading = "",
) {
  const copy = posterCopy[locale];
  const displaySpread = localizeSpread(spread, locale);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(copy.unsupported);

  const gradient = context.createRadialGradient(540, 100, 10, 540, 700, 900);
  gradient.addColorStop(0, "#382151");
  gradient.addColorStop(0.52, "#130c21");
  gradient.addColorStop(1, "#07050d");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < 120; index += 1) {
    const x = (index * 193) % canvas.width;
    const y = (index * index * 37) % canvas.height;
    context.fillStyle = `rgba(240,220,166,${0.08 + (index % 4) * 0.04})`;
    context.beginPath();
    context.arc(x, y, index % 7 === 0 ? 2 : 1, 0, Math.PI * 2);
    context.fill();
  }

  context.textAlign = "center";
  context.fillStyle = "#d7ba76";
  context.font = "24px serif";
  context.fillText("RIDER · WAITE · SMITH", 540, 92);
  context.fillStyle = "#fff9ea";
  context.font = "700 72px serif";
  context.fillText(copy.brand, 540, 178);
  context.fillStyle = "#c9bdd5";
  context.font = "30px sans-serif";
  context.fillText(copy.subtitle(displaySpread.name), 540, 232);

  const visibleCards = cards.slice(0, 8);
  const cardWidth = visibleCards.length > 5 ? 126 : 156;
  const cardHeight = Math.round(cardWidth * 1.5);
  const gap = visibleCards.length > 5 ? 14 : 24;
  const columns = visibleCards.length > 5 ? 4 : visibleCards.length;
  const rows = Math.ceil(visibleCards.length / columns);
  const totalWidth = columns * cardWidth + (columns - 1) * gap;
  const startX = (canvas.width - totalWidth) / 2;
  const startY = rows === 1 ? 370 : 320;

  await Promise.all(
    visibleCards.map(async (card, index) => {
      const displayCard = getCardCopy(card, locale);
      const row = Math.floor(index / columns);
      const column = index % columns;
      const rowCount = row === rows - 1 ? visibleCards.length - row * columns : columns;
      const rowWidth = rowCount * cardWidth + (rowCount - 1) * gap;
      const x = row === rows - 1 ? (canvas.width - rowWidth) / 2 + column * (cardWidth + gap) : startX + column * (cardWidth + gap);
      const y = startY + row * (cardHeight + 118);
      const image = await loadImage(card.image);
      context.save();
      roundedRect(context, x - 6, y - 6, cardWidth + 12, cardHeight + 12, 13);
      context.fillStyle = "#d8b96e";
      context.fill();
      roundedRect(context, x, y, cardWidth, cardHeight, 9);
      context.clip();
      if (card.orientation === "reversed") {
        context.translate(x + cardWidth / 2, y + cardHeight / 2);
        context.rotate(Math.PI);
        context.drawImage(image, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
      } else {
        context.drawImage(image, x, y, cardWidth, cardHeight);
      }
      context.restore();
      context.textAlign = "center";
      context.fillStyle = "#fff9ea";
      context.font = "600 25px sans-serif";
      context.fillText(displayCard.name, x + cardWidth / 2, y + cardHeight + 42);
      context.fillStyle = "#bcaeca";
      context.font = "22px sans-serif";
      context.fillText(`${displaySpread.positions[index]} · ${orientationLabel(card.orientation, locale)}`, x + cardWidth / 2, y + cardHeight + 76);
    }),
  );

  const excerpt = readingExcerpt(reading);
  if (excerpt) {
    roundedRect(context, 78, 944, 924, 256, 18);
    context.fillStyle = "rgba(22, 13, 34, .88)";
    context.fill();
    context.strokeStyle = "rgba(217, 188, 117, .28)";
    context.lineWidth = 2;
    context.stroke();
    context.textAlign = "left";
    context.fillStyle = "#d7ba76";
    context.font = "600 24px sans-serif";
    context.fillText(copy.readingTitle, 112, 990);
    context.fillStyle = "#d7cedc";
    context.font = "25px sans-serif";
    wrapCanvasText(context, excerpt, 856, 5).forEach((line, index) => {
      context.fillText(line, 112, 1035 + index * 34);
    });
  }

  context.textAlign = "center";
  context.fillStyle = "#d7ba76";
  context.font = "28px serif";
  context.fillText(copy.reflection, 540, excerpt ? 1248 : 1268);
  context.fillStyle = "#8f819f";
  context.font = "22px sans-serif";
  context.fillText(copy.disclaimer, 540, 1312);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(copy.failed))), "image/png"),
  );
}

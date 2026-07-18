import type { DrawnCard, Spread } from "@/types/tarot";
import { orientationLabel } from "@/lib/game";

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

export async function createSharePoster(cards: DrawnCard[], spread: Spread) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器无法生成分享图");

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
  context.fillText("星 月 塔 罗", 540, 178);
  context.fillStyle = "#c9bdd5";
  context.font = "30px sans-serif";
  context.fillText(`${spread.name} · 一次属于你的静心观察`, 540, 232);

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
      context.fillText(card.nameZh, x + cardWidth / 2, y + cardHeight + 42);
      context.fillStyle = "#bcaeca";
      context.font = "22px sans-serif";
      context.fillText(`${spread.positions[index]} · ${orientationLabel(card.orientation)}`, x + cardWidth / 2, y + cardHeight + 76);
    }),
  );

  context.textAlign = "center";
  context.fillStyle = "#d7ba76";
  context.font = "28px serif";
  context.fillText("牌面是一面镜子，答案仍在你的现实选择里。", 540, 1268);
  context.fillStyle = "#8f819f";
  context.font = "22px sans-serif";
  context.fillText("星月塔罗 · 仅用于娱乐、自我观察与启发", 540, 1312);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("分享图生成失败"))), "image/png"),
  );
}

export async function sharePoster(cards: DrawnCard[], spread: Spread) {
  const blob = await createSharePoster(cards, spread);
  const file = new File([blob], `星月塔罗-${spread.name}.png`, { type: "image/png" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: "我的星月塔罗牌阵", files: [file] });
    return "已打开系统分享面板";
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return "分享图已生成";
}

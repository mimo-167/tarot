import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "docs", "RWS塔罗AI辅助解牌知识库.md");
const outputPath = path.join(root, "src", "data", "tarot-cards.json");
const markdown = await readFile(sourcePath, "utf8");

const cardsBlock = markdown.split("## 7. 78 张牌独立牌义")[1]?.split("## 8. 牌阵与位置解读")[0];
if (!cardsBlock) throw new Error("未在知识库中找到 78 张牌章节");

const matches = [...cardsBlock.matchAll(/^###\s+([MWCSP]\d{2})\s+(.+?)\s+([A-Za-z][A-Za-z\s]+)$/gm)];
const suitMap = { M: "major", W: "wands", C: "cups", S: "swords", P: "pentacles" };
const folderMap = { M: "maj", W: "wands", C: "cups", S: "swords", P: "pents" };

const clean = (value = "") => value.trim().replace(/\[S\d+\]/g, "").trim();
const field = (section, label) => {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = section.match(new RegExp(`^- \\*\\*${escaped}：\\*\\*\\s*(.+)$`, "m"));
  return clean(match?.[1]);
};

const cards = matches.map((match, index) => {
  const [heading, id, nameZh, nameEn] = match;
  const start = (match.index ?? 0) + heading.length;
  const end = matches[index + 1]?.index ?? cardsBlock.length;
  const section = cardsBlock.slice(start, end).trim();
  const prefix = id[0];
  const number = Number(id.slice(1));
  const imageFile = `${folderMap[prefix]}${String(number).padStart(2, "0")}.jpg`;
  return {
    id,
    slug: `${suitMap[prefix]}-${String(number).padStart(2, "0")}`,
    nameZh: nameZh.trim(),
    nameEn: nameEn.trim(),
    arcana: prefix === "M" ? "major" : "minor",
    suit: suitMap[prefix],
    number,
    image: `/cards/${imageFile}`,
    core: field(section, "编号/核心"),
    upright: field(section, "正位"),
    reversed: field(section, "逆位"),
    relationship: field(section, "关系"),
    career: field(section, "事业/学业/财务"),
    advice: field(section, "建议与边界"),
    knowledge: `### ${id} ${nameZh.trim()} ${nameEn.trim()}\n\n${section}`,
  };
});

if (cards.length !== 78) throw new Error(`预期 78 张牌，实际解析到 ${cards.length} 张`);
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(cards, null, 2)}\n`, "utf8");
console.log(`已从知识库生成 ${cards.length} 张牌：${outputPath}`);

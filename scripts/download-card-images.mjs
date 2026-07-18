import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = "https://raw.githubusercontent.com/searge/tarot/master/assets/img/big";
const output = path.join(process.cwd(), "public", "cards");
const files = [
  ...Array.from({ length: 22 }, (_, index) => `maj${String(index).padStart(2, "0")}.jpg`),
  ...["wands", "cups", "swords", "pents"].flatMap((suit) =>
    Array.from({ length: 14 }, (_, index) => `${suit}${String(index + 1).padStart(2, "0")}.jpg`),
  ),
];

await mkdir(output, { recursive: true });
let downloaded = 0;

for (const [index, file] of files.entries()) {
  const destination = path.join(output, file);
  try {
    await access(destination);
    continue;
  } catch {
    // Download only missing assets so the script is safely repeatable.
  }

  const response = await fetch(`${base}/${file}`);
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, bytes);
  downloaded += 1;
  process.stdout.write(`\r牌面素材 ${index + 1}/${files.length}`);
}

console.log(`\n完成：新增 ${downloaded} 张，目录共应有 ${files.length} 张。`);

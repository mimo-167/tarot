import { rm } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd());
for (const directory of [".next", ".open-next"]) {
  const target = path.resolve(root, directory);
  if (path.dirname(target) !== root) throw new Error(`Refusing to clean outside project: ${target}`);
  await rm(target, { recursive: true, force: true });
}
console.log("已清理 .next 与 .open-next 构建产物");

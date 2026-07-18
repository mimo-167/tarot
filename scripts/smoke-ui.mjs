import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const executablePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifacts = path.join(process.cwd(), "artifacts");
await mkdir(artifacts, { recursive: true });

const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(baseUrl, { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(artifacts, "home-desktop.png"), fullPage: true });
  await page.locator("::-p-text(开始一次占卜)").click();
  await page.waitForSelector(".spread-card");
  const spreadCount = await page.$$eval(".spread-card", (items) => items.length);
  if (spreadCount !== 9) throw new Error(`牌阵数量错误：${spreadCount}`);
  await page.locator(".spread-card .spread-main").click();
  await page.waitForSelector(".question-card");
  await page.locator("textarea").fill("未来三个月，我在工作中最值得关注什么？");
  await page.locator("::-p-text(进入塔罗牌桌)").click();
  await page.waitForSelector(".tarot-table .table-card");
  const deckCount = await page.$$eval(".tarot-table .table-card", (items) => items.length);
  if (deckCount !== 78) throw new Error(`牌组数量错误：${deckCount}`);

  for (let index = 0; index < 3; index += 1) {
    await page.locator(".table-card:not(.is-picked):not([disabled])").click();
  }
  await page.locator("::-p-text(完成选牌)").click();
  await page.waitForSelector(".spread-board");
  for (let index = 0; index < 3; index += 1) {
    await page.locator("::-p-text(翻开这一张)").click();
  }
  await new Promise((resolve) => setTimeout(resolve, 1100));
  await page.screenshot({ path: path.join(artifacts, "reading-desktop.png"), fullPage: true });
  await page.locator("::-p-text(查看本地牌义)").click();
  await page.waitForSelector(".reading-dialog");
  const readingCount = await page.$$eval(".local-card-reading", (items) => items.length);
  if (readingCount !== 3) throw new Error(`本地解读牌数错误：${readingCount}`);

  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await mobile.goto(baseUrl, { waitUntil: "networkidle0" });
  await mobile.locator("::-p-text(每日一牌)").click();
  await mobile.waitForSelector(".daily-stage");
  await mobile.screenshot({ path: path.join(artifacts, "daily-mobile.png"), fullPage: true });

  if (errors.length) throw new Error(`浏览器控制台错误：\n${errors.join("\n")}`);
  console.log(`UI smoke passed: 9 spreads, ${deckCount} unique deck buttons, 3-card reveal/local reading, mobile daily page.`);
} finally {
  await browser.close();
}

import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const executablePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifacts = path.join(process.cwd(), "artifacts");
await mkdir(artifacts, { recursive: true });

const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
const errors = [];

const watchErrors = (page, label) => {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${label}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`${label}: ${error.message}`));
};

const expectLanguage = async (page, locale) => {
  await page.waitForFunction((expected) => document.documentElement.lang === expected, {}, locale);
};

try {
  const englishContext = await browser.createBrowserContext();
  const page = await englishContext.newPage();
  watchErrors(page, "desktop");
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: "networkidle0" });
  await expectLanguage(page, "en");
  await page.waitForSelector("::-p-text(Begin a reading)");
  await page.screenshot({ path: path.join(artifacts, "home-en-desktop.png"), fullPage: true });

  await page.locator("::-p-text(Begin a reading)").click();
  await page.waitForSelector(".spread-card");
  const spreadCount = await page.$$eval(".spread-card", (items) => items.length);
  if (spreadCount !== 9) throw new Error(`Expected 9 spreads, found ${spreadCount}`);
  await page.locator(".spread-card .spread-main").click();
  await page.waitForSelector(".question-card");
  const question = "What direction deserves my attention at work over the next three months?";
  await page.locator("textarea").fill(question);

  // Switching language must preserve in-progress game state and persist the explicit preference.
  await page.locator(".language-switch").click();
  await expectLanguage(page, "zh-CN");
  if (await page.$eval("textarea", (element) => element.value) !== question) {
    throw new Error("The question was lost when switching to Chinese");
  }
  await page.locator(".language-switch").click();
  await expectLanguage(page, "en");
  if (await page.$eval("textarea", (element) => element.value) !== question) {
    throw new Error("The question was lost when switching back to English");
  }

  await page.locator("::-p-text(Enter the tarot table)").click();
  await page.waitForSelector(".tarot-table .table-card");
  const deckCount = await page.$$eval(".tarot-table .table-card", (items) => items.length);
  if (deckCount !== 78) throw new Error(`Expected 78 deck buttons, found ${deckCount}`);

  for (let index = 0; index < 3; index += 1) {
    await page.locator(".table-card:not(.is-picked):not([disabled])").click();
  }
  await page.locator("::-p-text(Finish selection)").click();
  await page.waitForSelector(".spread-board");
  for (let index = 0; index < 3; index += 1) {
    await page.locator("::-p-text(Reveal this card)").click();
  }
  await new Promise((resolve) => setTimeout(resolve, 1100));
  await page.screenshot({ path: path.join(artifacts, "reading-en-desktop.png"), fullPage: true });
  await page.locator("::-p-text(View local meanings)").click();
  await page.waitForSelector(".reading-dialog");
  const readingCount = await page.$$eval(".local-card-reading", (items) => items.length);
  if (readingCount !== 3) throw new Error(`Expected 3 local card readings, found ${readingCount}`);
  const localReading = await page.$eval(".reading-body", (element) => element.innerText);
  if (/[㐀-䶿一-鿿豈-﫿]/u.test(localReading)) {
    throw new Error("English local reading contains Chinese copy");
  }

  await page.locator('[aria-label="Close reading"]').click();
  await page.locator(".language-switch").click();
  await expectLanguage(page, "zh-CN");
  await page.reload({ waitUntil: "networkidle0" });
  await expectLanguage(page, "zh-CN");
  await page.waitForSelector("::-p-text(开始一次占卜)");

  const mobileContext = await browser.createBrowserContext();
  const mobile = await mobileContext.newPage();
  watchErrors(mobile, "mobile");
  await mobile.setExtraHTTPHeaders({ "Accept-Language": "en-GB,en;q=0.9" });
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await mobile.goto(baseUrl, { waitUntil: "networkidle0" });
  await expectLanguage(mobile, "en");
  const switchBox = await mobile.$eval(".language-switch", (element) => {
    const box = element.getBoundingClientRect();
    return { width: box.width, height: box.height, right: box.right };
  });
  if (switchBox.width < 42 || switchBox.height < 42 || switchBox.right > 390) {
    throw new Error(`Mobile language control is not safely tappable: ${JSON.stringify(switchBox)}`);
  }
  await mobile.locator("::-p-text(Daily Card)").click();
  await mobile.waitForSelector(".daily-stage");
  await mobile.screenshot({ path: path.join(artifacts, "daily-en-mobile.png"), fullPage: true });

  await englishContext.close();
  await mobileContext.close();
  if (errors.length) throw new Error(`Browser console errors:\n${errors.join("\n")}`);
  console.log("Bilingual UI smoke passed: browser-language SSR, persistent switch, 9 spreads, 78-card table, English local reading, and mobile language control.");
} finally {
  await browser.close();
}

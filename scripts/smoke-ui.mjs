import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const executablePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const localProxyHeaders = baseUrl.startsWith("http://")
  ? { "x-forwarded-proto": "https" }
  : {};
const artifacts = path.join(process.cwd(), "artifacts");
await mkdir(artifacts, { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});
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
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().endsWith("/api/reading")) {
      void request.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ reading: "## Card-by-card\n\n### First card | The Fool · Upright\nA grounded beginning.\n\n## Reading the spread as a whole\nThe cards invite patient action.\n\n## Back to your question\nMove forward while checking the facts.\n\n## Takeaways\n- Name one practical next step.\n- Keep a clear boundary." }),
      });
    } else {
      void request.continue();
    }
  });
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9", ...localProxyHeaders });
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: "networkidle0" });
  await expectLanguage(page, "en");
  await page.waitForSelector(".hero-actions .primary");
  if ((await page.$eval(".language-switch", (element) => element.textContent?.trim())) !== "中文") {
    throw new Error("English UI does not show the full Chinese language label");
  }
  if (await page.$(".ritual-line")) {
    throw new Error("The removed home ritual timeline is still present");
  }
  const footerShape = await page.$eval(".site-footer", (element) => ({
    paragraphs: element.querySelectorAll(":scope > p").length,
    navigation: element.querySelectorAll(":scope > nav").length,
  }));
  if (footerShape.paragraphs !== 1 || footerShape.navigation !== 0) {
    throw new Error(`Footer is not reduced to one content line: ${JSON.stringify(footerShape)}`);
  }
  await page.screenshot({ path: path.join(artifacts, "home-en-desktop.png"), fullPage: true });

  await page.locator(".hero-actions .primary").click();
  await page.waitForSelector(".spread-card");
  const spreadCount = await page.$$eval(".spread-card", (items) => items.length);
  if (spreadCount !== 23) throw new Error(`Expected 23 spreads, found ${spreadCount}`);
  const spreadDetails = await page.$$eval(".spread-card", (items) => items.map((item) => ({
    category: item.querySelector(".spread-category-pill")?.textContent?.trim(),
    questions: item.querySelectorAll(".spread-questions span").length,
  })));
  if (spreadDetails.some((spread) => !spread.category || spread.questions < 1)) {
    throw new Error("A spread card is missing its category, difficulty, or suitable questions");
  }
  await new Promise((resolve) => setTimeout(resolve, 1_300));
  await page.screenshot({ path: path.join(artifacts, "spreads-en-desktop.png"), fullPage: true });
  await page.locator('[data-spread-id="free3"] .spread-main').click();
  await page.waitForSelector(".question-card");
  const question = "What direction deserves my attention at work over the next three months?";
  await page.locator("textarea").fill(question);

  // Switching language must preserve in-progress game state and persist the explicit preference.
  await page.locator(".language-switch").click();
  await expectLanguage(page, "zh-CN");
  if ((await page.$eval(".language-switch", (element) => element.textContent?.trim())) !== "English") {
    throw new Error("Chinese UI does not show the full English language label");
  }
  if (await page.$eval("textarea", (element) => element.value) !== question) {
    throw new Error("The question was lost when switching to Chinese");
  }
  await page.locator(".language-switch").click();
  await expectLanguage(page, "en");
  if (await page.$eval("textarea", (element) => element.value) !== question) {
    throw new Error("The question was lost when switching back to English");
  }

  await page.locator("::-p-text(Continue to a quiet moment)").click();
  await page.waitForSelector(".preparation-screen");
  const initiallyDisabled = await page.$eval(".preparation-actions .primary", (element) => element.hasAttribute("disabled"));
  if (!initiallyDisabled) throw new Error("The preparation page did not create a short guided pause");
  await page.screenshot({ path: path.join(artifacts, "preparation-en-desktop.png"), fullPage: true });
  await page.waitForFunction(() => !document.querySelector(".preparation-actions .primary")?.hasAttribute("disabled"), { timeout: 5_000 });
  await page.$eval(".preparation-actions .primary", (element) => element.click());
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
  if (await page.$(".save-reading-dialog")) {
    throw new Error("Guest users still see a save or login prompt after revealing the cards");
  }
  const revealedCardOpacity = await page.$eval(".reveal-card.revealed", (element) => getComputedStyle(element).opacity);
  if (revealedCardOpacity !== "1") {
    throw new Error(`Revealed card artwork is dimmed: opacity ${revealedCardOpacity}`);
  }
  if (await page.$(".sound-controls, [aria-label*='sound' i]")) {
    throw new Error("Music or sound-effect controls are still present");
  }
  await page.screenshot({ path: path.join(artifacts, "reading-en-desktop.png"), fullPage: true });

  // A share action must open an in-site preview with an explicit download link.
  await page.locator("::-p-text(Create share image)").click();
  await page.waitForSelector(".share-preview-dialog");
  await page.waitForFunction(() => (document.querySelector(".share-preview-dialog img")?.naturalWidth || 0) > 0);
  const downloadName = await page.$eval(".share-preview-actions a[download]", (element) => element.getAttribute("download"));
  if (!downloadName?.endsWith(".png")) throw new Error("Share preview does not expose a PNG download");
  await new Promise((resolve) => setTimeout(resolve, 450));
  await page.screenshot({ path: path.join(artifacts, "share-preview-en-desktop.png"), fullPage: true });
  await page.locator('[aria-label="Close share image preview"]').click();

  await page.locator("::-p-text(View local meanings)").click();
  await page.waitForSelector(".reading-dialog");
  const readingCount = await page.$$eval(".local-card-reading", (items) => items.length);
  if (readingCount !== 3) throw new Error(`Expected 3 local card readings, found ${readingCount}`);
  const localReading = await page.$eval(".reading-body", (element) => element.innerText);
  if (/[㐀-䶿一-鿿豈-﫿]/u.test(localReading)) {
    throw new Error("English local reading contains Chinese copy");
  }

  await page.locator("::-p-text(Create a reading image)").click();
  await page.waitForSelector(".share-preview-dialog");
  await page.locator('[aria-label="Close share image preview"]').click();

  await page.locator("::-p-text(AI combined analysis)").click();
  await page.locator("::-p-text(Start combined reading)").click();
  await page.waitForSelector("::-p-text(Back to your question)");
  await page.locator("::-p-text(Create a reading image)").click();
  await page.waitForSelector(".share-preview-dialog");
  await page.waitForFunction(() => (document.querySelector(".share-preview-dialog img")?.naturalWidth || 0) > 0);
  await page.locator('[aria-label="Close share image preview"]').click();

  await page.locator('[aria-label="Close reading"]').click();
  await page.locator(".language-switch").click();
  await expectLanguage(page, "zh-CN");
  await page.reload({ waitUntil: "networkidle0" });
  await expectLanguage(page, "zh-CN");
  await page.waitForSelector("::-p-text(进入牌阵选择)");

  const mobileContext = await browser.createBrowserContext();
  const mobile = await mobileContext.newPage();
  watchErrors(mobile, "mobile");
  await mobile.setExtraHTTPHeaders({ "Accept-Language": "en-GB,en;q=0.9", ...localProxyHeaders });
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
  console.log("UI smoke passed: bilingual labels, guided preparation, 78-card guest flow without a save prompt, in-site preview/download, local and AI reading share actions, and mobile language control.");
} finally {
  await browser.close();
}

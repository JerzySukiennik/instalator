// Instalator: render shop thumbnails of every catalogue device into assets/thumbs/<id>.png.
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
const require = createRequire("/Users/jurek/openclaw/node_modules/");
const { chromium } = require("playwright-core");
const BASE = process.env.BASE || "http://localhost:8771/";
mkdirSync("assets/thumbs", { recursive: true });
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto(`${BASE}Niepotrzebne/tools/thumbs.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
const { CATALOG } = await import(new URL("../../src/shared/catalog.js", import.meta.url));
let n = 0;
for (const d of CATALOG) {
  try {
    const url = await page.evaluate((id) => window.__thumb(id), d.id);
    writeFileSync(`assets/thumbs/${d.id}.png`, Buffer.from(url.split(",")[1], "base64"));
    n++;
  } catch (e) { console.log("fail", d.id, e.message.slice(0, 80)); }
}
console.log("thumbs", n);
await browser.close();

// Instalator: render the tablet dashboard of a demo house in all three platform styles to PNG files.
// node dashshot.mjs <outDir> [building]
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
const require = createRequire("/Users/jurek/openclaw/node_modules/");
const { chromium } = require("playwright-core");
const [outDir = "Niepotrzebne/shots/dash", building = "dom"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 720 });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto(`${process.env.BASE || "http://localhost:8771/"}?net=local&role=tv&demo=${building}&view=tablet&hud=0`, { waitUntil: "load" });
await page.waitForFunction(() => window.__demoReady === true, null, { timeout: 90000 });
const shots = await page.evaluate(async () => {
  const { renderDash } = await import("/src/dash/render.js");
  const { snapshotFor } = await import("/src/shared/game.js");
  const opts = window.__dashOpts ? window.__dashOpts() : { camImages: window.__camImages || {} };
  const snap = snapshotFor(window.__tv.state, window.__tv.data);
  const out = {};
  for (const p of ["ha", "apple", "google"]) {
    const c = document.createElement("canvas");
    c.width = 1180; c.height = 820;
    renderDash(c.getContext("2d"), 1180, 820, { ...snap, tablet: { ...snap.tablet, platform: p } }, window.__tv.data, opts);
    out[p] = c.toDataURL("image/png");
  }
  return out;
});
for (const [p, url] of Object.entries(shots)) writeFileSync(`${outDir}/dash-${p}.png`, Buffer.from(url.split(",")[1], "base64"));
console.log("ok", Object.keys(shots));
await browser.close();

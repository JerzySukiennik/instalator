// Instalator: shots of the real lobby → board → job flow (TV + two phones + desk mode) for the UI/HUD critic.
// node uishot.mjs <outDir>
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire("/Users/jurek/openclaw/node_modules/");
const { chromium } = require("playwright-core");

const out = process.argv[2] || "uishots";
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE || "http://localhost:8773/";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const snap = async (page, path) => { await page.bringToFront(); await wait(700); await page.screenshot({ path, timeout: 60000 }); };
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]
});
const logs = [];
const watchPage = (p, tag) => {
  p.on("pageerror", (e) => logs.push(`[${tag} pageerror] ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error") logs.push(`[${tag} error] ${m.text()}`); });
};

async function flow() {
  const ctx = await browser.newContext();
  const tv = await ctx.newPage();
  await tv.setViewportSize({ width: 1600, height: 900 });
  watchPage(tv, "tv");
  await tv.goto(`${BASE}?net=local&role=tv`, { waitUntil: "load" });
  await tv.waitForFunction(() => window.__tv && window.__tv.host && (window.__tv.host.localCode || window.__tv.host.code), null, { timeout: 60000 });
  const code = await tv.evaluate(() => window.__tv.host.localCode || window.__tv.host.code);
  await wait(5000);
  const join = await ctx.newPage();
  await join.setViewportSize({ width: 390, height: 844 });
  await join.goto(`${BASE}?role=pad&net=local&room=${code}&emu=1`, { waitUntil: "load" });
  await wait(2500);
  await snap(join, `${out}/pad-join.png`);
  await join.close();
  const pads = [];
  for (const name of ["Tata", "Jurek"]) {
    const p = await ctx.newPage();
    await p.setViewportSize({ width: 390, height: 844 });
    watchPage(p, name);
    await p.goto(`${BASE}?role=pad&net=local&room=${code}&name=${name}&emu=1`, { waitUntil: "load" });
    pads.push(p);
    await wait(1800);
  }
  await wait(1500);
  await snap(tv, `${out}/tv-lobby.png`);
  await snap(pads[0], `${out}/pad-lobby.png`);
  await pads[0].evaluate(() => window.__pad.send({ a: "start" }));
  await wait(3500);
  await pads[0].evaluate(() => window.__pad.send({ a: "vote", i: 1 }));
  await pads[1].evaluate(() => window.__pad.send({ a: "vote", i: 2 }));
  await wait(1800);
  await snap(tv, `${out}/tv-board.png`);
  await snap(pads[0], `${out}/pad-board.png`);
  await pads[0].evaluate(() => window.__pad.send({ a: "pick", i: 1 }));
  await wait(9000);
  await snap(tv, `${out}/tv-jobstart.png`);
  await snap(pads[0], `${out}/pad-tasks-fresh.png`);
  await snap(pads[1], `${out}/pad-watch.png`);
  await pads[0].evaluate(() => window.__pad.openTask("panel"));
  await wait(3500);
  await snap(tv, `${out}/tv-task-panel.png`);
  await snap(pads[1], `${out}/pad-watch-panel.png`);
  await ctx.close();
}

async function desk() {
  const ctx = await browser.newContext();
  const tv = await ctx.newPage();
  await tv.setViewportSize({ width: 1600, height: 900 });
  watchPage(tv, "desk");
  await tv.goto(`${BASE}?net=local&role=tv&desk=1&name=Tata`, { waitUntil: "load" });
  await wait(9000);
  await snap(tv, `${out}/tv-desk-lobby.png`);
  logs.push("[desk frames] " + tv.frames().map((f) => f.url().slice(0, 90)).join(" , "));
  const frame = tv.frames().find((f) => f !== tv.mainFrame() && f.url().includes("role=pad"));
  if (frame) {
    await frame.evaluate(() => window.__pad.send({ a: "start" }));
    await wait(3000);
    await snap(tv, `${out}/tv-desk-board.png`);
    await frame.evaluate(() => window.__pad.send({ a: "pick", i: 2 }));
    await wait(9000);
    await frame.evaluate(() => window.__pad.openTask("rack"));
    await wait(4000);
    await snap(tv, `${out}/tv-desk-rack.png`);
  } else logs.push("[desk] no iframe");
  await ctx.close();
}

try { await flow(); } catch (e) { logs.push("[flow] " + e.message); }
try { await desk(); } catch (e) { logs.push("[desk] " + e.message); }
console.log(logs.slice(-30).join("\n") || "ok");
await browser.close();

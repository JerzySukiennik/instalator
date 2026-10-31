// Instalator: pre-deploy smoke test — every building loads in demo mode and a phone joins, with no page errors.
// node smoke.mjs [baseUrl]   exit 1 on any failure
import { createRequire } from "node:module";
const require = createRequire("/Users/jurek/openclaw/node_modules/");
const { chromium } = require("playwright-core");

const BASE = process.argv[2] || process.env.BASE || "http://localhost:8773/";
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]
});
const fails = [];
const ctx = await browser.newContext();
for (const b of ["kawalerka", "dom", "gzowo", "willa"]) {
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 960, height: 540 });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(`${BASE}?net=local&role=tv&demo=${b}&view=overview`, { waitUntil: "load" });
  let ready = true;
  try { await p.waitForFunction(() => window.__demoReady === true, null, { timeout: 60000 }); } catch (e) { ready = false; }
  const info = await p.evaluate(() => ({ devs: window.__tv?.state?.devs?.length || 0, rooms: window.__tv?.data?.rooms?.length || 0 })).catch(() => ({}));
  if (b === "dom") {
    const code = await p.evaluate(() => window.__tv.host.localCode || window.__tv.host.code);
    const pad = await ctx.newPage();
    await pad.setViewportSize({ width: 390, height: 844 });
    pad.on("pageerror", (e) => errs.push("pad: " + e.message));
    await pad.goto(`${BASE}?role=pad&net=local&room=${code}&name=Smoke&emu=1`, { waitUntil: "load" });
    try { await pad.waitForFunction(() => window.__pad && window.__pad.S && window.__pad.S.phase, null, { timeout: 15000 }); } catch (e) { errs.push("pad never got state"); }
    await pad.close();
  }
  const ok = ready && !errs.length && info.devs > 5;
  console.log(`${ok ? "OK  " : "FAIL"} ${b.padEnd(10)} devs=${info.devs} rooms=${info.rooms}${ready ? "" : " (demo timeout)"}${errs.length ? " errors: " + errs.slice(0, 3).join(" | ") : ""}`);
  if (!ok) fails.push(b);
  await p.close();
}
await browser.close();
process.exit(fails.length ? 1 : 0);

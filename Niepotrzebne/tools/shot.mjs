// Instalator: headless Chrome (real GPU via ANGLE/Metal) shots of TV demo views and phone screens.
// node shot.mjs tv <out.png> "<query>"            e.g. "demo=dom&view=rack"
// node shot.mjs pad <out.png> "<tvQuery>" "<padJS>"  TV demo + a phone page in the same browser, padJS runs in the pad
import { createRequire } from "node:module";
const require = createRequire("/Users/jurek/openclaw/node_modules/");
const { chromium } = require("playwright-core");

const [mode = "tv", out = "shot.png", query = "demo=dom&view=overview", padJS = ""] = process.argv.slice(2);
const BASE = process.env.BASE || "http://localhost:8771/";
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]
});
const context = await browser.newContext();
const logs = [];
const tv = await context.newPage({ viewport: { width: 1600, height: 900 } });
await tv.setViewportSize({ width: Number(process.env.W || 1600), height: Number(process.env.H || 900) });
tv.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(`[tv ${m.type()}] ${m.text()}`); });
tv.on("pageerror", (e) => logs.push(`[tv pageerror] ${e.message}`));
await tv.goto(`${BASE}?net=local&role=tv&${query}`, { waitUntil: "load" });
try { await tv.waitForFunction(() => window.__demoReady === true, null, { timeout: 90000 }); } catch (e) { logs.push("[harness] demo timeout"); }
await tv.waitForTimeout(Number(process.env.WAIT || 2500));
if (mode === "tv") {
  const info = await tv.evaluate(() => ({ fps: window.__fps, calls: window.__tv?.R.renderer.info.render.calls, tris: window.__tv?.R.renderer.info.render.triangles, reqs: (window.__tv?.state && window.__tv.state.job) ? `${window.__tv.state.job.reqs.length} reqs` : "" }));
  logs.push("[info] " + JSON.stringify(info));
  await tv.screenshot({ path: out });
} else {
  const code = await tv.evaluate(() => window.__tv.host.code);
  const pad = await context.newPage();
  await pad.setViewportSize({ width: 390, height: 844 });
  pad.on("pageerror", (e) => logs.push(`[pad pageerror] ${e.message}`));
  pad.on("console", (m) => { if (m.type() === "error") logs.push(`[pad error] ${m.text()}`); });
  await pad.goto(`${BASE}?role=pad&net=local&room=${code}&name=Tata&emu=1`, { waitUntil: "load" });
  await pad.waitForTimeout(2200);
  if (padJS) { try { const r = await pad.evaluate(`(async () => { ${padJS} })()`); if (r !== undefined) logs.push("[padjs] " + JSON.stringify(r)); } catch (e) { logs.push("[padjs error] " + e.message); } }
  await pad.waitForTimeout(Number(process.env.PWAIT || 1500));
  await pad.screenshot({ path: out });
  if (process.env.TVOUT) await tv.screenshot({ path: process.env.TVOUT });
}
console.log(logs.slice(-40).join("\n"));
await browser.close();

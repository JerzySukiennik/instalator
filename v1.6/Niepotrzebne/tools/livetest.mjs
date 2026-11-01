// Instalator: live online test — TV claims an RTDB room on the deployed site and a phone in a separate browser context joins over WebRTC/relay.
// node livetest.mjs [baseUrl]   exit 1 on failure
import { createRequire } from "node:module";
const require = createRequire("/Users/jurek/openclaw/node_modules/");
const { chromium } = require("playwright-core");

const BASE = process.argv[2] || "https://instalator.gzowo.fun/";
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]
});
const errs = [];
let ok = false;
try {
  const tvCtx = await browser.newContext();
  const tv = await tvCtx.newPage();
  await tv.setViewportSize({ width: 960, height: 540 });
  tv.on("pageerror", (e) => errs.push("tv: " + e.message));
  tv.on("console", (m) => { if (m.type() === "error") errs.push("tv console: " + m.text()); });
  await tv.goto(`${BASE}?role=tv`, { waitUntil: "load" });
  await tv.waitForFunction(() => window.__tv && window.__tv.host && window.__tv.host.kind === "dual", null, { timeout: 45000 });
  const code = await tv.evaluate(() => window.__tv.host.code);
  console.log("room", code);
  const padCtx = await browser.newContext();
  const pad = await padCtx.newPage();
  await pad.setViewportSize({ width: 390, height: 844 });
  pad.on("pageerror", (e) => errs.push("pad: " + e.message));
  await pad.goto(`${BASE}?role=pad&room=${code}&name=Test&emu=1`, { waitUntil: "load" });
  await pad.waitForFunction(() => window.__pad && window.__pad.S && window.__pad.S.phase === "lobby", null, { timeout: 45000 });
  const players = await tv.evaluate(() => window.__tv.state.players.map((p) => `${p.name}:${p.online}`));
  const via = await pad.evaluate(() => window.__pad.link?.mode || window.__pad.link?.kind || "?");
  console.log("players", players.join(", "), "via", via);
  ok = players.some((p) => p.startsWith("Test:true"));
} catch (e) {
  errs.push("harness: " + e.message.split("\n")[0]);
}
if (errs.length) console.log(errs.slice(0, 6).join("\n"));
console.log(ok ? "LIVE OK" : "LIVE FAIL");
await browser.close();
process.exit(ok ? 0 : 1);

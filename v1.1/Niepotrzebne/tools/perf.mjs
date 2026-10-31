// Instalator: TV frame-rate check per building at 1080p with the camera orbiting (short run, real GPU).
// node perf.mjs [baseUrl]
import { createRequire } from "node:module";
const require = createRequire("/Users/jurek/openclaw/node_modules/");
const { chromium } = require("playwright-core");

const BASE = process.argv[2] || process.env.BASE || "http://localhost:8775/";
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--disable-gpu-vsync", "--disable-frame-rate-limit"]
});
for (const [b, view] of [["kawalerka", "overview"], ["dom", "overview"], ["gzowo", "overview"], ["willa", "overview"], ["willa", "night"]]) {
  const p = await browser.newPage();
  await p.setViewportSize({ width: 1920, height: 1080 });
  await p.goto(`${BASE}?net=local&role=tv&demo=${b}&view=${view}`, { waitUntil: "load" });
  await p.waitForFunction(() => window.__demoReady === true, null, { timeout: 90000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    const T = window.__tv;
    T.dir.orbit.speed = 0.08;
    const times = [];
    let last = performance.now();
    await new Promise((res) => {
      const t0 = last;
      const f = (now) => { times.push(now - last); last = now; if (now - t0 < 5000) requestAnimationFrame(f); else res(); };
      requestAnimationFrame(f);
    });
    times.sort((a, b) => a - b);
    const avg = times.reduce((s, x) => s + x, 0) / times.length;
    const p95 = times[Math.floor(times.length * 0.95)];
    const info = T.R.renderer.info.render;
    return { fps: Math.round(1000 / avg), p95ms: Math.round(p95 * 10) / 10, frames: times.length, calls: info.calls, tris: info.triangles, px: T.R.renderer.getPixelRatio() };
  });
  console.log(`${(b + " " + view).padEnd(18)} avg ${r.fps} fps, p95 ${r.p95ms} ms, calls ${r.calls}, tris ${r.tris}, dpr ${r.px}`);
  await p.close();
}
await browser.close();

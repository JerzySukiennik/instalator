// Instalator: headless Chrome (real GPU) shot of a building view, usage: node buildshot.mjs <id> <out.png> [view] [floor] [query] (env W, H, PORT); prints draw calls, triangles, data checks.
const { createRequire } = await import('node:module');
const require = createRequire('/Users/jurek/openclaw/node_modules/');
const { chromium } = require('playwright-core');

const [id = 'kawalerka', out = 'shot.png', view = 'dollhouse', floor = '', extra = ''] = process.argv.slice(2);
const W = +(process.env.W || 1600), H = +(process.env.H || 900), port = process.env.PORT || 8773;
const profile = process.env.PROFILE || '/private/tmp/claude-501/instalator-buildshot-profile';
const browser = await chromium.launchPersistentContext(profile, {
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
  viewport: { width: W, height: H }, deviceScaleFactor: 1
});
const page = browser.pages()[0] || await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${(e.stack || '').split('\n').slice(0, 5).join('\n')}`));
const url = `http://127.0.0.1:${port}/Niepotrzebne/tools/buildings.html?id=${id}&view=${view}&shot=1${floor !== '' ? `&floor=${floor}` : ''}${extra ? `&${extra}` : ''}`;
await page.goto(url, { waitUntil: 'load' });
try { await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 60000, polling: 250 }); } catch (e) { logs.push('[harness] timeout'); }
await page.waitForTimeout(400);
const res = await page.evaluate(() => ({ stats: window.__stats, check: window.__check, err: window.__err, t: window.__t }));
await page.screenshot({ path: out });
console.log(logs.filter((l) => !l.includes('[stats]') || true).slice(-30).join('\n'));
console.log(JSON.stringify({ id, view, floor, ...res.stats, checks: res.check?.length ?? null, err: res.err, t: res.t }));
await browser.close();

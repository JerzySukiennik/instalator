// Instalator: headless Chrome (real GPU) shots of the device model viewer: one id, all ids, a grid or a compare sheet.
const { createRequire } = await import('node:module');
const require = createRequire('/Users/jurek/openclaw/node_modules/');
const { chromium } = require('playwright-core');
const path = await import('node:path');
const fs = await import('node:fs');

const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? '1']; }));
const what = pos[0] || 'grid';
const out = path.resolve(pos[1] || `Niepotrzebne/shots/models/${what.replace(/[^a-z0-9-]/gi, '_')}.png`);
const PORT = flags.port || 8772;
const BASE = `http://127.0.0.1:${PORT}/Niepotrzebne/tools/models.html`;
const extra = Object.entries(flags).filter(([k]) => !['port', 'w', 'h'].includes(k)).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('');

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
});
const logs = [];
async function shot(query, file, w, h, tries = 2) {
  try { await shotOnce(query, file, w, h); } catch (e) { if (tries > 1) { logs.push('[retry] ' + query + ' ' + String(e.message || e).slice(0, 120)); await shot(query, file, w, h, tries - 1); } else throw e; }
}

async function shotOnce(query, file, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(BASE + query, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 90000 }).catch(() => logs.push('[harness] timeout ' + query));
  const err = await page.evaluate(() => window.__error);
  if (err) logs.push('[error] ' + query + ' ' + err);
  await page.waitForTimeout(150);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file });
  await page.close();
  console.log('shot', file);
}

if (what === 'all') {
  const page = await browser.newPage();
  await page.goto(BASE + '?list=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 60000 });
  const ids = flags.family ? await page.evaluate((f) => window.__ids.filter((id) => (window.__info[id] || {}).family === f), flags.family) : flags.ids ? flags.ids.split(',') : await page.evaluate(() => window.__ids);
  await page.close();
  const dir = out.endsWith('.png') ? path.dirname(out) : out;
  const pre = out.endsWith('.png') ? path.basename(out, '.png') + '_' : '';
  for (const id of ids) await shot(`?id=${id}&spin=0${extra}`, path.join(dir, `${pre}${id}.png`), +(flags.w || 640), +(flags.h || 640));
} else if (what === 'grid') {
  await shot(`?grid=1${extra}`, out, +(flags.w || 1800), +(flags.h || 1100));
} else if (what.startsWith('compare')) {
  const ids = what.includes('=') ? what.split('=')[1] : flags.ids;
  const n = ids.split(',').length;
  await shot(`?compare=${ids}${extra}`, out, +(flags.w || 1380), +(flags.h || Math.min(1500, n * 420)));
} else {
  await shot(`?id=${what}&spin=0${extra}`, out, +(flags.w || 800), +(flags.h || 800));
}
if (logs.length) console.log(logs.slice(0, 40).join('\n'));
await browser.close();

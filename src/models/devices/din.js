// Instalator device models: DIN-rail modules (MCB, RCD, isolator, surge arrester, Shelly Pro family) and the flush panel enclosure.
import * as THREE from 'three';
import { Kit, polyPts, circPts, rrPts } from './kit.js';
import { CLEAR, labelMat, displayMat, roundRect } from './mat.js';
import { rectPts, rj45Pts, cupGeo } from './ports.js';

export const MOD = 0.0175;
const HAGER_GREY = '#e2e3df';
const HAGER_DARK = '#c9cbc7';

function profilePts(H, D, nose, zs, ch = 0.0015) {
  const h = H / 2, n = nose / 2;
  const P = [[0, -h + 0.004], [0.004, -h], [zs - ch, -h], [zs, -h + ch], [zs, -n - ch], [zs + ch, -n], [D - ch, -n], [D, -n + ch], [D, n - ch], [D - ch, n], [zs + ch, n], [zs, n + ch], [zs, h - ch], [zs - ch, h], [0.004, h], [0, h - 0.004]];
  return polyPts(P.map(([z, y]) => [-z, y]));
}

function dinBody(kit, mods, color, o = {}) {
  const W = mods * MOD - 0.0004, H = o.H ?? 0.085, D = o.D ?? 0.07, nose = o.nose ?? 0.045, zs = o.zs ?? 0.044;
  kit.shape(o.mat || 'satin', color, profilePts(H, D, nose, zs), W, -W / 2, 0, 0, { axis: 'x' });
  kit.box('metal', '#9da1a5', 0, 0, 0.0012, W * 0.98, 0.034, 0.0024);
  return { W, H, D, nose, zs };
}

function screw(kit, x, y, z, o = {}) {
  const r = o.r ?? 0.0036;
  kit.lathe('matte', o.hole || '#2b2c2e', x, y, z + 0.0001, [[r * 0.8, 0], [r, 0]], { seg: 14, axis: '-z' });
  kit.cyl('metal', o.head || '#c2bba8', x, y, z - 0.0003, r * 0.8, 0.001, { axis: 'z', seg: 12 });
  kit.box('matte', '#4c4a45', x, y, z + 0.00025, r * 1.25, 0.0007, 0.0002, { rz: 0.5 });
  kit.box('matte', '#4c4a45', x, y, z + 0.00025, r * 1.25, 0.0007, 0.0002, { rz: -1.07 });
}

function lever(kit, x, y, z, o = {}) {
  const lk = new Kit();
  const w = o.w ?? 0.0105, len = o.len ?? 0.0135;
  lk.push(0, 0, 0, -(o.up ?? 0.42), 0, 0);
  lk.box('satin', o.color || '#8e9194', 0, 0, len / 2, w, o.t ?? 0.0072, len, { r: 0.0012, seg: 2, axis: 'x' });
  lk.box('satin', o.tip || '#7d8083', 0, 0.0002, len - 0.001, w + 0.0004, (o.t ?? 0.0072) + 0.0012, 0.003, { r: 0.0012, seg: 2, axis: 'x' });
  if (o.mark) lk.box('satin', o.mark, 0, (o.t ?? 0.0072) / 2 + 0.0001, len * 0.55, w * 0.42, 0.0003, 0.003);
  lk.pop();
  const g = lk.build();
  const piv = new THREE.Group();
  piv.name = 'lever';
  piv.position.set(x, y, z);
  piv.add(g);
  piv.userData = { on: 0, off: o.off ?? 0.95 };
  kit.extra.push(piv);
  return piv;
}

function hagerPrint(key, W, H, lines, o = {}) {
  const pxm = 6000, w = Math.round(W * pxm), h = Math.round(H * pxm);
  return labelMat(key, w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    for (const L of lines) {
      if (L.logo) {
        ctx.fillStyle = '#1aa3c9'; ctx.fillRect(L.x * pxm, h - L.y * pxm - 1.2 * L.s * pxm, L.w * pxm, 1.2 * L.s * pxm);
        ctx.fillStyle = '#ffffff'; ctx.font = `700 ${L.s * pxm}px Helvetica, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(':hager', (L.x + L.w / 2) * pxm, h - L.y * pxm - 0.6 * L.s * pxm);
        continue;
      }
      if (L.rect) { ctx.fillStyle = L.color; ctx.fillRect(L.x * pxm, h - (L.y + L.rect[1]) * pxm, L.rect[0] * pxm, L.rect[1] * pxm); continue; }
      ctx.fillStyle = L.color || '#4d5257';
      ctx.font = `${L.weight || 600} ${L.s * pxm}px Helvetica, Arial`;
      ctx.textAlign = L.align || 'left';
      ctx.textBaseline = 'middle';
      if (L.rot) { ctx.save(); ctx.translate(L.x * pxm, h - L.y * pxm); ctx.rotate(L.rot); ctx.fillText(L.t, 0, 0); ctx.restore(); }
      else ctx.fillText(L.t, L.x * pxm, h - L.y * pxm);
    }
  }, o);
}

function mcb(curve, amps) {
  const kit = new Kit();
  const b = dinBody(kit, 1, HAGER_GREY, { H: 0.083, D: 0.07 });
  const { W, H, D, nose, zs } = b;
  screw(kit, 0, H / 2 - 0.0095, zs);
  screw(kit, 0, -H / 2 + 0.0095, zs);
  kit.box('satin', '#cbe7e8', 0, -nose / 2 + 0.0072, D + 0.0008, W - 0.002, 0.0128, 0.0016, { r: 0.0008, seg: 1 });
  cupLever(kit, W, D, -0.002);
  const lv = lever(kit, 0, -0.002, D - 0.004, { mark: '#f2f2f0' });
  const pm = hagerPrint('mcb-' + curve + amps, W, nose, [
    { logo: true, x: 0.0015, y: nose - 0.0058, w: W - 0.003, s: 0.0026 },
    { t: (curve === 'C' ? 'MCN1' : 'MBN1') + String(amps).padStart(2, '0'), x: W / 2, y: nose - 0.0094, s: 0.002, align: 'center', color: '#5a5f64' },
    { t: curve + amps, x: W / 2, y: nose - 0.0128, s: 0.0029, align: 'center', weight: 700, color: '#3b4045' },
  ]);
  kit.quad(pm, null, W, nose, 0, 0, D + 0.00012);
  kit.ud.lever = lv;
  kit.ud.modules = 1;
  kit.ud.rating = curve + amps;
  return kit.build();
}

function cupLever(kit, W, D, y) {
  kit.box('matte', '#3c3e40', 0, y, D - 0.0011, W - 0.005, 0.016, 0.0024);
}

function rcd() {
  const kit = new Kit();
  const b = dinBody(kit, 2, HAGER_GREY, { H: 0.085, D: 0.07 });
  const { W, H, D, nose, zs } = b;
  for (const x of [-MOD / 2, MOD / 2]) { screw(kit, x, H / 2 - 0.0095, zs); screw(kit, x, -H / 2 + 0.0095, zs); }
  kit.box('satin', '#cbe7e8', 0, -nose / 2 + 0.0072, D + 0.0008, W - 0.002, 0.0128, 0.0016, { r: 0.0008, seg: 1 });
  kit.box('satin', '#2f8fd6', MOD / 2, nose / 2 - 0.0085, D + 0.0012, 0.0085, 0.0062, 0.0024, { r: 0.0012, seg: 2 });
  kit.box('matte', '#3c3e40', -MOD / 2, -0.002, D - 0.0011, MOD - 0.005, 0.016, 0.0024);
  kit.box('matte', '#3d3f41', MOD / 2 - 0.002, -0.004, D + 0.0002, 0.0028, 0.0022, 0.0004);
  const lv = lever(kit, -MOD / 2, -0.002, D - 0.004, {});
  const pm = hagerPrint('rcd-cda240', W, nose, [
    { logo: true, x: W / 2 + 0.001, y: nose - 0.0045, w: MOD - 0.003, s: 0.0026 },
    { t: 'CDA240J', x: 0.0015, y: nose - 0.0075, s: 0.0021, color: '#c43c6a' },
    { t: '40A/30mA', x: W / 2 + 0.0008, y: nose - 0.0105, s: 0.0019, color: '#5a5f64' },
    { t: 'T', x: W * 0.75, y: nose - 0.0085, s: 0.0035, align: 'center', color: '#ffffff', weight: 700 },
  ]);
  kit.quad(pm, null, W, nose, 0, 0, D + 0.00012);
  kit.ud.lever = lv;
  kit.ud.modules = 2;
  kit.ud.rating = '40A 30mA A';
  return kit.build();
}

function mainSwitch() {
  const kit = new Kit();
  const b = dinBody(kit, 2, HAGER_GREY, { H: 0.085, D: 0.07 });
  const { W, H, D, nose, zs } = b;
  for (const x of [-MOD / 2, MOD / 2]) { screw(kit, x, H / 2 - 0.0095, zs); screw(kit, x, -H / 2 + 0.0095, zs); }
  kit.box('satin', '#cbe7e8', 0, -nose / 2 + 0.0072, D + 0.0008, W - 0.002, 0.0128, 0.0016, { r: 0.0008, seg: 1 });
  kit.box('matte', '#3c3e40', 0, -0.002, D - 0.0011, W - 0.004, 0.016, 0.0024);
  const lk = new Kit();
  lk.push(0, 0, 0, -0.42, 0, 0);
  for (const x of [-MOD / 2, MOD / 2]) {
    lk.box('satin', '#9a9d9f', x, 0, 0.0068, 0.0122, 0.0076, 0.0136, { r: 0.0012, seg: 2, axis: 'x' });
    lk.box('satin', '#2d9a54', x, 0.0012, 0.01365, 0.0046, 0.0034, 0.0003);
  }
  lk.box('satin', '#8b8e90', 0, 0, 0.0115, 0.006, 0.006, 0.0032);
  lk.pop();
  const lg = lk.build();
  const piv = new THREE.Group();
  piv.name = 'lever';
  piv.position.set(0, -0.002, D - 0.004);
  piv.add(lg);
  piv.userData = { on: 0, off: 0.95 };
  kit.extra.push(piv);
  const pm = hagerPrint('isolator-sbn240', W, nose, [
    { logo: true, x: W / 2 + 0.001, y: nose - 0.0045, w: MOD - 0.003, s: 0.0026 },
    { t: 'SBN240', x: 0.0015, y: nose - 0.0075, s: 0.0021, color: '#5a5f64' },
    { t: '40A', x: 0.0015, y: nose - 0.0103, s: 0.0024, color: '#3b4045', weight: 700 },
  ]);
  kit.quad(pm, null, W, nose, 0, 0, D + 0.00012);
  kit.ud.lever = piv;
  kit.ud.modules = 2;
  kit.ud.rating = '2P 40A';
  return kit.build();
}

function surge() {
  const kit = new Kit();
  const b = dinBody(kit, 2, '#d8dad6', { H: 0.09, D: 0.0775, zs: 0.044 });
  const { W, H, D, nose, zs } = b;
  for (const x of [-MOD / 2, MOD / 2]) { screw(kit, x, H / 2 - 0.0095, zs); screw(kit, x, -H / 2 + 0.0095, zs); }
  for (const x of [-MOD / 2, MOD / 2]) {
    kit.box('satin', '#eceeeb', x, 0, D - 0.008 + 0.0006, MOD - 0.0012, nose + 0.012, 0.0172, { r: 0.0012, seg: 2 });
    kit.led('#36c25c', 'status', (m) => kit.box(m, null, x, nose / 2 + 0.0015, D + 0.0016, 0.0062, 0.0026, 0.0004), { intensity: 0.9 });
  }
  const pm = hagerPrint('spd-spa', W, nose + 0.012, [
    { logo: true, x: 0.0012, y: nose + 0.012 - 0.0115, w: MOD - 0.0034, s: 0.0024 },
    { logo: true, x: MOD + 0.0012, y: nose + 0.012 - 0.0115, w: MOD - 0.0034, s: 0.0024 },
    { t: 'SPA090', x: 0.0016, y: nose + 0.012 - 0.0148, s: 0.0021, color: '#4d5257' },
    { t: 'SPA090N', x: MOD + 0.0016, y: nose + 0.012 - 0.0148, s: 0.0021, color: '#4d5257' },
    { t: 'T1+T2', x: 0.0016, y: nose + 0.012 - 0.021, s: 0.0019, color: '#6b7075' },
    { t: 'CE', x: 0.004, y: 0.006, s: 0.003, color: '#4d5257', weight: 700 },
    { t: 'CE', x: MOD + 0.004, y: 0.006, s: 0.003, color: '#4d5257', weight: 700 },
  ]);
  kit.quad(pm, null, W, nose + 0.012, 0, 0, D + 0.0014);
  kit.ud.modules = 2;
  return kit.build();
}

function terminalBlock(kit, x, y, z, w, color, n, up = 1) {
  kit.box('satin', color, x, y, z, w, 0.0105, 0.012, { r: 0.0012, seg: 2 });
  for (let i = 0; i < n; i++) {
    const sx = x - w / 2 + (i + 0.5) * (w / n);
    kit.cyl('metal', '#b8b3a3', sx, y + up * 0.0002, z + 0.0062, 0.0021, 0.0012, { axis: 'z', seg: 10 });
    kit.box('matte', '#3d3c38', sx, y + up * 0.0002, z + 0.0069, 0.0032, 0.0006, 0.0003);
    kit.box('matte', '#141414', sx, y + up * 0.0052, z - 0.0005, 0.0034, 0.0006, 0.0034);
  }
}

function shellyLogoMat(color) {
  return labelMat('shelly-logo-' + color, 256, 96, (ctx) => {
    ctx.clearRect(0, 0, 256, 96);
    ctx.fillStyle = color;
    ctx.font = 'italic 700 64px "Brush Script MT", "Snell Roundhand", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Shelly', 128, 50);
  });
}

function narrowPrint(kind, names, txt, D, nose) {
  const pxm = 16000, qw = 0.0165, qh = nose - 0.002, cw = Math.round(qw * pxm), ch = Math.round(qh * pxm);
  const lh = 0.0034, top = 0.0018;
  const pm = labelMat('shelly-front-' + kind, cw, ch, (ctx) => {
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = txt;
    ctx.font = `600 ${Math.round(lh * 0.6 * pxm)}px Helvetica, Arial`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    names.forEach((n, i) => ctx.fillText(n, (qw / 2 + 0.0026) * pxm, (top + 0.0005 + lh * (i + 0.5)) * pxm));
    ctx.textAlign = 'center';
    ctx.font = `italic 700 ${Math.round(0.0052 * pxm)}px "Brush Script MT", "Snell Roundhand", Georgia, serif`;
    ctx.fillStyle = kind === '3em' ? '#6b7177' : '#ffffff';
    ctx.fillText('Shelly', cw / 2, (qh / 2 + 0.0045 - 0.0002) * pxm);
    ctx.font = `600 ${Math.round(0.0021 * pxm)}px Helvetica, Arial`;
    ctx.fillStyle = txt;
    ctx.fillText('Reset', cw / 2, (qh / 2 + 0.0181) * pxm);
  });
  return { pm, qw, qh };
}

function shellyNarrow(kind) {
  const kit = new Kit();
  const body = kind === '3em' ? '#f1f1ee' : kind === 'dimmer' ? '#5ccf2e' : '#1b1c1e';
  const b = dinBody(kit, 1, body, { H: 0.094, D: 0.069, nose: 0.045, zs: 0.031, mat: 'satin' });
  const { W, H, D, nose } = b;
  const top = '#2eaa4c';
  const bot = kind === '3em' ? '#1e1f21' : '#1f5fd0';
  terminalBlock(kit, 0, H / 2 - 0.0045, 0.0262, W - 0.0012, top, 2, 1);
  terminalBlock(kit, 0, H / 2 - 0.0128, 0.0372, W - 0.0012, top, 2, 1);
  if (kind === '3em') { terminalBlock(kit, -W / 4, -H / 2 + 0.0085, 0.0372, W / 2 - 0.0008, bot, 1, -1); terminalBlock(kit, W / 4, -H / 2 + 0.0085, 0.0372, W / 2 - 0.0008, bot, 1, -1); }
  else terminalBlock(kit, 0, -H / 2 + 0.0085, 0.0372, W - 0.0016, bot, 2, -1);
  const names = kind === '3em' ? ['Power', 'Wi-Fi', 'LAN', '', 'Count'] : ['Power', 'Wi-Fi', 'LAN', 'Out 1', 'Out 2'];
  const cols = kind === '3em' ? ['#ff4a3d', '#3d8bff', '#38d15a', '', '#38d15a'] : ['#ff4a3d', '#3d8bff', '#38d15a', '#ff4a3d', '#ff4a3d'];
  const txt = kind === '3em' ? '#4a4f55' : '#ffffff';
  const { pm, qw, qh } = narrowPrint(kind, names, txt, D, nose);
  kit.quad(pm, null, qw, qh, 0, 0, D + 0.00012);
  const ytop = qh / 2 - 0.0018;
  names.forEach((n, i) => { if (n) kit.led(cols[i], 'status', (m) => kit.cyl(m, null, 0.0041, ytop - 0.0005 - 0.0034 * (i + 0.5), D + 0.0003, 0.00055, 0.0006, { axis: 'z', seg: 8 }), { intensity: 2.2 }); });
  kit.cyl('satin', kind === '3em' ? '#e6e6e2' : kind === 'dimmer' ? '#52bd29' : '#2a2b2e', 0, -0.0128, D + 0.0004, 0.0029, 0.0008, { axis: 'z', seg: 14 });
  if (kind === '3em') kit.port('LAN', 'rj45', 0.003, -H / 2, 0.024);
  else {
    kit.box('matte', '#121314', 0.003, -H / 2 + 0.002, 0.024, 0.0105, 0.004, 0.009);
    kit.tube('satin', '#d5d7d9', [[0.003, -H / 2 + 0.001, 0.024], [0.003, -H / 2 - 0.02, 0.022], [0.0015, -H / 2 - 0.05, 0.012]], 0.0022, { rs: 6, segs: 8 });
    kit.port('LAN', 'rj45', 0.003, -H / 2, 0.024);
  }
  kit.ud.modules = 1;
  kit.ud.channels = kind === '3em' ? 3 : 2;
  return kit.build();
}

function shellyScreen() {
  return displayMat('shelly-4pm-screen', 192, 224, (ctx, w, h) => {
    ctx.fillStyle = '#071226';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d7e3f5'; ctx.font = '600 15px Helvetica, Arial'; ctx.fillText('18:00', 10, 20);
    ctx.fillStyle = '#4ea1ff'; ctx.fillRect(110, 9, 70, 14);
    const rows = [['7.1W', true], ['OFF', false], ['5.4W', true], ['OFF', false]];
    rows.forEach(([t, on], i) => {
      const y = 50 + i * 42;
      ctx.fillStyle = on ? '#ffd23f' : '#4b5a70'; ctx.font = '700 15px Helvetica, Arial'; ctx.fillText(on ? 'ϟ' : '', 10, y + 6);
      ctx.fillStyle = '#ffffff'; ctx.font = '700 22px Helvetica, Arial'; ctx.fillText(t, 28, y + 8);
      ctx.fillStyle = on ? '#4ea1ff' : '#37465b'; roundRect(ctx, 136, y - 9, 44, 20, 10); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(on ? 170 : 146, y + 1, 7, 0, Math.PI * 2); ctx.fill();
    });
  });
}

function shelly4pm() {
  const kit = new Kit();
  const b = dinBody(kit, 3, '#1b1c1e', { H: 0.096, D: 0.059, nose: 0.06, zs: 0.028 });
  const { W, H, D, nose, zs } = b;
  terminalBlock(kit, 0, H / 2 - 0.0075, 0.0375, W - 0.006, '#202124', 5, 1);
  kit.box('glass', '#06080c', 0.0035, 0.0055, D + 0.0003, 0.031, 0.036, 0.0006, { r: 0.0016, seg: 2 });
  kit.display(shellyScreen(), 0.0285, 0.0333, 0.0035, 0.0055, D + 0.00065);
  kit.quad(shellyLogoMat('#ffffff'), null, 0.034, 0.0115, -W / 2 + 0.0066, 0.006, D + 0.00012, { rz: Math.PI / 2 });
  for (const [x, t] of [[-0.0075, '^'], [0.0035, 'v'], [0.0145, 'ok']]) kit.box('satin', '#2b2c30', x, -0.0185, D + 0.0003, 0.0068, 0.0034, 0.0006, { r: 0.0012, seg: 2 });
  const bl = labelMat('shelly4pm-btn', 192, 32, (ctx) => { ctx.clearRect(0, 0, 192, 32); ctx.fillStyle = '#cfd6df'; ctx.font = '600 22px Helvetica, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⌃', 34, 18); ctx.fillText('⌄', 96, 12); ctx.fillText('OK', 158, 16); });
  kit.quad(bl, null, 0.033, 0.0055, 0.0035, -0.0185, D + 0.00065);
  for (let i = 0; i < 4; i++) kit.led('#38d15a', 'status', (m) => kit.cyl(m, null, -0.009 + i * 0.006, -nose / 2 + 0.0022, D + 0.0003, 0.0007, 0.0006, { axis: 'z', seg: 8 }), { intensity: 2 });
  kit.box('matte', '#121314', 0.012, -H / 2 + 0.002, 0.024, 0.012, 0.004, 0.009);
  kit.tube('satin', '#d5d7d9', [[0.012, -H / 2 + 0.001, 0.024], [0.012, -H / 2 - 0.02, 0.022], [0.009, -H / 2 - 0.05, 0.012]], 0.0022, { rs: 6, segs: 8 });
  kit.port('LAN', 'rj45', 0.012, -H / 2, 0.024);
  kit.ud.modules = 3;
  kit.ud.channels = 4;
  return kit.build();
}

function railSlotsMat(slots) {
  const w = slots * 24, h = 48;
  return labelMat('din-rail-' + slots, w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(40,43,46,0.9)';
    for (let x = 6; x < w - 30; x += 50) { ctx.beginPath(); ctx.moveTo(x + 5, 18); ctx.lineTo(x + 29, 18); ctx.arc(x + 29, 24, 6, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x + 5, 30); ctx.arc(x + 5, 24, 6, Math.PI / 2, Math.PI * 1.5); ctx.fill(); }
  }, { metal: 0.6, rough: 0.4 });
}

function panelEnclosure(opts = {}) {
  const rows = Math.max(1, Math.min(4, opts.rows || 2));
  const slots = Math.max(6, Math.min(24, opts.slotsPerRow || opts.slots || 12));
  const kit = new Kit();
  const W = 0.138 + slots * MOD, H = 0.2555 + rows * 0.125, D = 0.0945;
  const ow = W - 0.034, oh = H - 0.034, zr = -0.072, zc = -0.0255;
  const rowY = (i) => (rows - 1) / 2 * 0.125 - i * 0.125;
  kit.add('satin', '#e6e7e5', cupGeo(rectPts(0, 0, ow, oh), D - 0.012), { face: (cx, cy, cz, nx, ny, nz) => (nz > 0.9 ? '#eeeeec' : null) });
  kit.shape('satin', '#f6f6f3', rrPts(W, H, 0.004, 2), 0.014, 0, 0, 0, { holes: [rectPts(0, 0, ow, oh)], bevel: 0.002 });
  const coverHoles = [];
  const rails = [];
  const x0 = -slots * MOD / 2;
  const rs = railSlotsMat(slots);
  for (let i = 0; i < rows; i++) {
    const y = rowY(i);
    coverHoles.push(rectPts(0, y, slots * MOD + 0.002, 0.0462));
    kit.box('metal', '#c1c4c7', 0, y, zr - 0.0037, slots * MOD + 0.03, 0.035, 0.0075);
    kit.box('metal', '#a8abaf', 0, y, zr - 0.0002, slots * MOD + 0.03, 0.025, 0.0006);
    kit.quad(rs, null, slots * MOD + 0.02, 0.012, 0, y, zr + 0.0002);
    kit.box('satin', '#f1f1ef', 0, y + 0.0385, zc + 0.0036, slots * MOD + 0.002, 0.012, 0.0004);
    rails.push({ y: +y.toFixed(5), x0: +x0.toFixed(5), z: zr, slots, label: { y: +(y + 0.0385).toFixed(5), x0: +x0.toFixed(5), w: +(slots * MOD).toFixed(4), h: 0.012, z: +(zc + 0.0039).toFixed(4) } });
  }
  kit.shape('satin', '#f4f4f2', rectPts(0, 0, ow - 0.002, oh - 0.002), 0.0024, 0, 0, zc, { holes: coverHoles });
  const door = new Kit();
  const dW = ow - 0.003, dH = oh - 0.003;
  door.shape('satin', '#f6f6f3', rectPts(dW / 2, 0, dW, dH), 0.004, 0, 0, 0, { holes: [rrPts(dW - 0.04, dH - 0.04, 0.006, 2, dW / 2, 0)] });
  door.box(CLEAR.glass, null, dW / 2, 0, 0.002, dW - 0.036, dH - 0.036, 0.0025);
  door.box('satin', '#e7e8e6', dW - 0.012, 0, 0.005, 0.008, 0.06, 0.004, { r: 0.003, seg: 2 });
  const dg = door.build();
  dg.position.set(-dW / 2, 0, 0.0075);
  dg.name = 'door';
  dg.userData.hinge = 'left';
  dg.userData.open = -1.75;
  kit.extra.push(dg);
  const g = kit.build();
  g.userData.door = dg;
  g.userData.rails = rails;
  g.userData.rows = rows;
  g.userData.slotsPerRow = slots;
  g.userData.slotWidth = MOD;
  return g;
}

export const DIN = {
  'shelly-pro-4pm': { mount: 'din', family: 'din', name: 'Shelly Pro 4PM', build: shelly4pm },
  'shelly-pro-3em': { mount: 'din', family: 'din', name: 'Shelly Pro 3EM', build: () => shellyNarrow('3em') },
  'shelly-pro-2pm': { mount: 'din', family: 'din', name: 'Shelly Pro 2PM', build: () => shellyNarrow('2pm') },
  'shelly-pro-dimmer-2pm': { mount: 'din', family: 'din', name: 'Shelly Pro Dimmer 2PM', build: () => shellyNarrow('dimmer') },
  'surge-t1t2': { mount: 'din', family: 'din', name: 'Ogranicznik przepięć T1+T2', build: surge },
  'main-switch': { mount: 'din', family: 'din', name: 'Rozłącznik izolacyjny 2P 40A', build: mainSwitch },
  rcd: { mount: 'din', family: 'din', name: 'Wyłącznik różnicowoprądowy 2P 40A 30mA', build: rcd },
  'mcb-b10': { mount: 'din', family: 'din', name: 'Wyłącznik nadprądowy B10', build: () => mcb('B', 10) },
  'mcb-b16': { mount: 'din', family: 'din', name: 'Wyłącznik nadprądowy B16', build: () => mcb('B', 16) },
  'mcb-c20': { mount: 'din', family: 'din', name: 'Wyłącznik nadprądowy C20', build: () => mcb('C', 20) },
  'panel-enclosure': { mount: 'wall', family: 'din', name: 'Rozdzielnica podtynkowa', build: panelEnclosure, view: { yaw: 22, el: 12 } },
};

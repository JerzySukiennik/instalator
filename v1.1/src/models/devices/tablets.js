// Instalator device models: tablets (iPad A16, iPad mini, Galaxy Tab A9+) with live display hooks, plus the magnetic PoE wall station and desk stand.
import * as THREE from 'three';
import { Kit, circPts } from './kit.js';
import { labelMat, displayMat, roundRect } from './mat.js';

const IPAD_COL = { silver: '#d9dbdd', blue: '#9fb6cf', pink: '#e8b9c2', yellow: '#efdd8f' };

function lockScreen(key, w, h, o) {
  return displayMat(key, w, h, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    o.grad.forEach((c, i) => g.addColorStop(i / (o.grad.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = o.wave;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = h * 0.06;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) ctx.lineTo(x, h * (0.25 + i * 0.12) + Math.sin(x / w * 6 + i) * h * 0.05);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = `600 ${h * 0.05}px "SF Pro Display", Helvetica, Arial`;
    ctx.fillText('piątek, 31 października', w / 2, h * 0.17);
    ctx.font = `700 ${h * 0.2}px "SF Pro Display", Helvetica, Arial`;
    ctx.fillText('16:30', w / 2, h * 0.38);
  });
}

function tablet(o, opts = {}) {
  const kit = new Kit();
  const portrait = !!opts.portrait;
  let W = o.W, H = o.H;
  if (portrait) [W, H] = [H, W];
  const D = o.D, r = o.r;
  kit.box('metal', o.back, 0, 0, D / 2, W, H, D, { r, seg: 6, bevel: Math.min(0.0009, D / 4) });
  kit.box('glass', '#060607', 0, 0, D + 0.00008, W - 0.0012, H - 0.0012, 0.0002, { r: r - 0.0006, seg: 6 });
  let dw = o.dw, dh = o.dh;
  if (portrait) [dw, dh] = [dh, dw];
  const key = o.key + (portrait ? '-p' : '-l');
  kit.display(lockScreen(key, portrait ? 300 : 420, portrait ? 420 : 300, o.screen), dw, dh, 0, 0, D + 0.0002, { r: o.dr, seg: 5 });
  const cam = portrait ? [0, H / 2 - o.bezel / 2] : [0, H / 2 - o.bezel / 2];
  if (o.camLong && portrait) { cam[0] = W / 2 - o.bezel / 2; cam[1] = 0; }
  kit.cyl('glass', '#16171a', cam[0], cam[1], D + 0.00012, 0.0013, 0.0002, { axis: 'z', seg: 10 });
  kit.cyl('glass', '#1d2230', 0 + (portrait ? -0.03 : -0.03), H / 2 - 0.016, -0.0004, 0.0042, 0.0012, { axis: 'z', seg: 12 });
  if (o.logo) kit.quad(o.logo, null, 0.022, 0.022, 0, 0, -0.0002, { ry: Math.PI });
  for (const [x, y, w, h] of o.buttons(W, H, portrait)) kit.box('metal', o.back, x, y, D / 2, w, h, D * 0.5, { r: Math.min(w, h) * 0.45, seg: 2 });
  kit.ud.screen = { w: dw, h: dh, portrait };
  kit.ud.backCenter = [0, 0, 0];
  return kit.build();
}

function appleLogoBack(color) {
  return labelMat('apple-logo-back-' + color, 128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(64, 44); ctx.bezierCurveTo(52, 34, 26, 38, 26, 68); ctx.bezierCurveTo(26, 92, 44, 114, 54, 114); ctx.bezierCurveTo(60, 114, 60, 110, 64, 110); ctx.bezierCurveTo(68, 110, 70, 114, 76, 114); ctx.bezierCurveTo(88, 114, 102, 92, 104, 80);
    ctx.bezierCurveTo(92, 74, 90, 56, 100, 48); ctx.bezierCurveTo(92, 36, 74, 36, 64, 44); ctx.fill();
    ctx.beginPath(); ctx.moveTo(64, 38); ctx.bezierCurveTo(64, 26, 72, 16, 84, 14); ctx.bezierCurveTo(84, 26, 76, 36, 64, 38); ctx.fill();
  }, { metal: 0.6, rough: 0.25 });
}

function ipadA16(opts = {}) {
  const col = IPAD_COL[opts.color] || IPAD_COL.blue;
  return tablet({
    key: 'ipad-a16-lock', W: 0.2486, H: 0.1795, D: 0.007, r: 0.012, dw: 0.2272, dh: 0.1578, dr: 0.008, bezel: 0.0108,
    back: col, logo: appleLogoBack('#c9ccd0'), camLong: true,
    screen: { grad: ['#2b6bff', '#8d4dff', '#ff7ac8'], wave: '#ffffff' },
    buttons: (W, H, p) => (p ? [[W / 2 + 0.0004, H / 2 - 0.05, 0.0016, 0.018], [-W / 2 + 0.03, H / 2 + 0.0004, 0.022, 0.0016]] : [[-W / 2 + 0.05, H / 2 + 0.0004, 0.018, 0.0016], [W / 2 + 0.0004, H / 2 - 0.03, 0.0016, 0.022]]),
  }, opts);
}

function ipadMini(opts = {}) {
  return tablet({
    key: 'ipad-mini-lock', W: 0.1954, H: 0.1348, D: 0.0063, r: 0.011, dw: 0.1795, dh: 0.1195, dr: 0.0085, bezel: 0.0078,
    back: opts.color === 'starlight' ? '#e6e1d6' : '#3b4048', logo: appleLogoBack('#5a6068'), camLong: true,
    screen: { grad: ['#0b1d4d', '#2f6bff', '#7fd0ff'], wave: '#a7e1ff' },
    buttons: (W, H, p) => [[-W / 2 + 0.036, H / 2 + 0.0004, 0.02, 0.0015]],
  }, opts);
}

function galaxyTab(opts = {}) {
  return tablet({
    key: 'galaxy-a9p-lock', W: 0.2571, H: 0.1687, D: 0.0069, r: 0.009, dw: 0.2373, dh: 0.1483, dr: 0.003, bezel: 0.0102,
    back: opts.color === 'silver' ? '#c9ccd0' : '#55585d', logo: labelMat('samsung-word', 256, 48, (ctx) => { ctx.clearRect(0, 0, 256, 48); ctx.fillStyle = '#3e4146'; ctx.font = '700 30px Helvetica, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SAMSUNG', 128, 26); }), camLong: true,
    screen: { grad: ['#d9d4f2', '#9a8fe0', '#5a4ec4'], wave: '#ffffff' },
    buttons: (W, H, p) => [[W / 2 - 0.04, H / 2 + 0.0004, 0.03, 0.0015]],
  }, opts);
}

function iportWall() {
  const kit = new Kit();
  const W = 0.12624, D = 0.0198;
  kit.loft('satin', '#1b1c1e', 0, 0, 0, W, W, 0.022, 5, [[0.0015, 0], [0, 0.0015], [0, 0.0125], ...topR(0.015, 0.0025, 2)], { axis: 'z' });
  kit.lathe('satin', '#151617', 0, 0, 0, [[0.0325, 0.015], [0.0325, 0.0185], [0.0315, 0.0198], [0, 0.0198]], { seg: 40, axis: 'z' });
  kit.lathe('satin', '#26272a', 0, 0, 0, [[0.0318, 0.01985], [0.0302, 0.01985]], { seg: 40, axis: 'z' });
  for (let i = 0; i < 5; i++) kit.cyl('metal', '#d7b45a', 0, 0.011 - i * 0.0055, 0.0199, 0.0009, 0.0004, { axis: 'z', seg: 8 });
  kit.quad(labelMat('iport-word', 256, 48, (ctx) => { ctx.clearRect(0, 0, 256, 48); ctx.fillStyle = '#6a6d72'; ctx.font = '500 28px Helvetica, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('I P O R T', 128, 26); }), null, 0.026, 0.0049, 0, -W / 2 + 0.013, 0.0151);
  kit.ud.attach = { pos: [0, 0, 0.0262], rot: [0, 0, 0] };
  kit.port('poe', 'poe', 0, 0, 0);
  return kit.build();
}

function topR(H, f, n = 3) { return Array.from({ length: n + 1 }, (_, i) => { const t = (i / n) * Math.PI / 2; return [f - f * Math.cos(t), H - f + f * Math.sin(t)]; }); }

function iportStand() {
  const kit = new Kit();
  const W = 0.0884, D = 0.1486, H = 0.1781;
  const side = [[D / 2, 0], [D / 2, 0.014], [D / 2 - 0.01, 0.02], [-0.005, 0.02], [-0.045, H], [-D / 2 + 0.006, H], [-D / 2, H - 0.006], [-D / 2, 0]];
  kit.shape('satin', '#1b1c1e', side.map(([z, y]) => new THREE.Vector2(-z, y)), W, -W / 2, 0, 0, { axis: 'x', bevel: 0.003, bevelSeg: 2 });
  const tilt = -0.2475;
  kit.push(0, 0.118, -0.0298, tilt, 0, 0);
  kit.lathe('satin', '#151617', 0, 0, 0, [[0.032, -0.002], [0.032, 0.0025], [0.031, 0.0038], [0, 0.0038]], { seg: 40, axis: 'z' });
  for (let i = 0; i < 5; i++) kit.cyl('metal', '#d7b45a', 0, 0.011 - i * 0.0055, 0.0039, 0.0009, 0.0004, { axis: 'z', seg: 8 });
  kit.ud.attach = { pos: kit.pt(0, 0, 0.0062), rot: [tilt, 0, 0] };
  kit.pop();
  kit.push(0, 0.0437, -0.011, tilt, 0, 0);
  kit.quad(labelMat('iport-word', 256, 48, (ctx) => { ctx.clearRect(0, 0, 256, 48); ctx.fillStyle = '#6a6d72'; ctx.font = '500 28px Helvetica, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('I P O R T', 128, 26); }), null, 0.026, 0.0049, 0, 0, 0.0004);
  kit.pop();
  for (const [x, z] of [[-0.03, 0.06], [0.03, 0.06], [-0.03, -0.06], [0.03, -0.06]]) kit.cyl('rubber', '#0b0b0b', x, -0.0008, z, 0.006, 0.0016, { seg: 10 });
  kit.port('power', 'power', 0, 0.01, -D / 2);
  return kit.build();
}

export const TABLETS = {
  'ipad-a16': { mount: 'tabletWall', family: 'tablet', name: 'Apple iPad (A16)', build: ipadA16, view: { yaw: 20, el: 10 } },
  'ipad-mini': { mount: 'tabletWall', family: 'tablet', name: 'Apple iPad mini', build: ipadMini, view: { yaw: 20, el: 10 } },
  'galaxy-tab-a9p': { mount: 'tabletWall', family: 'tablet', name: 'Samsung Galaxy Tab A9+', build: galaxyTab, view: { yaw: 20, el: 10 } },
  'tablet-wall-mount': { mount: 'tabletWall', family: 'tablet', name: 'iPort Connect Pro Wall Mount', build: iportWall, view: { yaw: 25, el: 12 } },
  'tablet-stand': { mount: 'surface', family: 'tablet', name: 'iPort Connect Pro Stand', build: iportStand, view: { yaw: 35, el: 14 } },
};

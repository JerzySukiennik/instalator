// Instalator device models: other gear (Roborock Saros 10R with dock, Shelly Plug S Gen3, Shelly 1 Gen4, Tesla Wall Connector, Netatmo weather station).
import * as THREE from 'three';
import { Kit, polyPts, arc, rrPts, loftGeo, rrLoop } from './kit.js';
import { CLEAR, labelMat } from './mat.js';
import { topR, botR } from './unifi-desk.js';

function word(key, text, color, px, w, h, weight = 600, spacing = 0, font = 'Helvetica, Arial') {
  return labelMat(key, w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.font = `${weight} ${px}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (spacing) { const chars = [...text]; const tw = chars.length * px * 0.62 + (chars.length - 1) * spacing; chars.forEach((c, i) => ctx.fillText(c, w / 2 - tw / 2 + px * 0.31 + i * (px * 0.62 + spacing), h / 2)); }
    else ctx.fillText(text, w / 2, h / 2);
  });
}

function robot() {
  const kit = new Kit();
  const R = 0.175, H = 0.0798;
  kit.lathe('satin', '#151618', 0, 0, 0, [[0, 0.008], [R - 0.012, 0.008], [R - 0.004, 0.012], [R, 0.02], [R, 0.06], [R - 0.003, 0.068], [R - 0.012, 0.072]], { seg: 48 });
  kit.lathe('gloss', '#0c0c0e', 0, 0, 0, [[R - 0.012, 0.072], [R - 0.03, 0.0745], [0, 0.0755]], { seg: 48 });
  kit.lathe('metal', '#4a4c50', 0, 0, 0, [[0.05, 0.0757], [0.046, 0.0762], [0, 0.0764]].reverse().reverse(), { seg: 32 });
  kit.cyl('satin', '#202124', 0, 0.042, 0, R + 0.002, 0.04, { seg: 48, arc: Math.PI * 0.9, phase: -Math.PI * 0.45, open: true });
  kit.box('glass', '#0b0c0e', 0, 0.044, R - 0.0005, 0.12, 0.014, 0.004, { r: 0.006, seg: 2 });
  for (const s of [-1, 1]) kit.cyl('rubber', '#0e0e0f', s * 0.12, 0.022, 0.02, 0.035, 0.026, { axis: 'x', seg: 14 });
  kit.cyl('rubber', '#2a2b2e', 0.11, 0.004, 0.11, 0.035, 0.006, { seg: 12 });
  kit.led('#ffffff', 'status', (m) => kit.box(m, null, 0, 0.0767, 0.12, 0.016, 0.0006, 0.003, { r: 0.0012, seg: 2, axis: 'y' }), { intensity: 1.2 });
  return kit.build();
}

function saros10r() {
  const kit = new Kit();
  const W = 0.4, Hd = 0.47, Dd = 0.3, ramp = 0.36;
  const z0 = -0.12;
  kit.loft('satin', '#1a1b1d', 0, 0, z0, W, Dd, 0.03, 5, [[0.002, 0], [0, 0.002], [0, Hd - 0.03], ...topR(Hd, 0.03, 4)]);
  kit.box('gloss', '#0f1012', 0, 0.105 + (Hd - 0.11) / 2, z0 + Dd / 2 + 0.0015, W - 0.03, Hd - 0.14, 0.003, { r: 0.018, seg: 3 });
  kit.box('matte', '#2a2b2e', 0, 0.105 + (Hd - 0.11) * 0.56, z0 + Dd / 2 + 0.0032, W - 0.03, 0.0016, 0.0008);
  kit.quad(word('roborock-word', 'roborock', '#6d6f73', 40, 256, 64, 500), null, 0.07, 0.0175, 0, 0.33, z0 + Dd / 2 + 0.0034);
  kit.box('satin', '#151618', 0, 0.006, z0 + Dd / 2 + ramp / 2 - 0.02, W - 0.01, 0.012, ramp, { r: 0.04, seg: 4, axis: 'y' });
  kit.box('matte', '#26272a', 0, 0.0125, z0 + Dd / 2 + ramp / 2 - 0.02, W - 0.05, 0.001, ramp - 0.05, { r: 0.03, seg: 3, axis: 'y' });
  kit.box('satin', '#202124', 0, 0.06, z0 + Dd / 2 + 0.02, W - 0.02, 0.1, 0.04, { r: 0.012, seg: 3 });
  kit.led('#ffffff', 'status', (m) => kit.box(m, null, 0, Hd - 0.012, z0 + Dd / 2 - 0.004, 0.05, 0.002, 0.004, { r: 0.001, seg: 1 }), { intensity: 1 });
  const rb = robot();
  rb.position.set(0, 0.012, z0 + Dd / 2 + 0.19);
  rb.name = 'robot';
  kit.extra.push(rb);
  const g = kit.build();
  g.userData.robot = rb;
  g.userData.leds.push(...rb.userData.leds);
  return g;
}

function plugS(opts = {}) {
  const kit = new Kit();
  const black = opts.color !== 'white';
  const body = black ? '#1a1b1d' : '#f2f2f0';
  kit.cyl('satin', body, 0, 0, -0.001, 0.0195, 0.002, { axis: 'z', seg: 28 });
  for (const x of [-0.0095, 0.0095]) kit.cyl('metal', '#c8cacc', x, 0, -0.0095, 0.0024, 0.019, { axis: 'z', seg: 10 });
  kit.lathe('satin', body, 0, 0, 0, [[0.019, 0], [0.0225, 0.004], [0.0232, 0.012], [0.0232, 0.034], [0.0228, 0.038]], { seg: 32, axis: 'z' });
  kit.light(opts.ledColor || '#5cff8a', 'lamp', [0, 0, 0.042], (m) => kit.lathe(m, null, 0, 0, 0, [[0.0228, 0.038], [0.0236, 0.0405], [0.0232, 0.0435], [0.0215, 0.0445]], { seg: 32, axis: 'z' }), { on: !!opts.on, base: '#c9ced2', intensity: 0.9, roughness: 0.15 });
  kit.lathe('satin', black ? '#111213' : '#e6e6e4', 0, 0, 0, [[0.0215, 0.0445], [0.019, 0.0438], [0.0185, 0.034], [0.0175, 0.0335], [0, 0.0335]], { seg: 32, axis: 'z' });
  for (const x of [-0.0095, 0.0095]) kit.cyl('matte', '#050505', x, 0, 0.0337, 0.0026, 0.0004, { axis: 'z', seg: 10 });
  for (const y of [-0.019, 0.019]) kit.box('metal', '#c4c6c8', 0, y, 0.039, 0.007, 0.0014, 0.008);
  kit.led('#ffffff', 'status', (m) => kit.cyl(m, null, 0.016, 0.009, 0.0446, 0.0008, 0.0004, { axis: 'z', seg: 8 }), { intensity: 1 });
  kit.port('outlet', 'power', 0, 0, 0.034);
  return kit.build();
}

function shelly1g4() {
  const kit = new Kit();
  const W = 0.0365, H = 0.042, D = 0.0165;
  kit.box('satin', '#2b74d9', 0, 0, D / 2, W, H, D, { r: 0.0025, seg: 2, bevel: 0.0008 });
  for (let i = 0; i < 5; i++) {
    const x = -W / 2 + 0.005 + i * 0.0066;
    kit.box('matte', '#1d3f74', x, -H / 2 - 0.0001, D * 0.55, 0.0052, 0.0004, 0.0085);
    kit.box('metal', '#c3bda9', x, -H / 2 + 0.0004, D * 0.55, 0.0036, 0.0006, 0.0036);
    kit.box('satin', '#2363c2', x, -H / 2 + 0.0035, D + 0.0003, 0.005, 0.006, 0.0006);
    kit.cyl('metal', '#c3bda9', x, -H / 2 + 0.0035, D + 0.0009, 0.0017, 0.0006, { axis: 'z', seg: 10 });
  }
  const pm = labelMat('shelly1g4-top', 256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 700 58px "Brush Script MT", "Snell Roundhand", Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Shelly', 128, 70);
    ctx.font = '700 30px Helvetica, Arial'; ctx.fillText('1 Gen4', 128, 120);
    ctx.font = '500 16px Helvetica, Arial'; ctx.fillText('110-240V~ 16A', 128, 156); ctx.fillText('O  SW  L  N', 128, 216);
  });
  kit.quad(pm, null, W - 0.003, W - 0.003, 0, 0.003, D + 0.0002);
  kit.led('#3d8bff', 'status', (m) => kit.cyl(m, null, W / 2 - 0.006, H / 2 - 0.006, D + 0.0002, 0.0007, 0.0004, { axis: 'z', seg: 8 }), { intensity: 1.4 });
  return kit.build();
}

function teslaOutline(wt, wb, h, n = 18) {
  const pts = [];
  const rb = 0.03, yb = -h / 2;
  const ytop = h / 2 - wt / 2;
  pts.push(...arc(wb / 2 - rb, yb + rb, rb, -Math.PI / 2, 0, 4));
  pts.push(...arc(0, ytop, wt / 2, 0, Math.PI, n));
  pts.push(...arc(-wb / 2 + rb, yb + rb, rb, Math.PI, Math.PI * 1.5, 4));
  return polyPts(pts);
}

function teslaWall() {
  const kit = new Kit();
  const W = 0.152, Ht = 0.345;
  const out = teslaOutline(W, 0.112, Ht);
  const inner = teslaOutline(W - 0.012, 0.1, Ht - 0.012);
  kit.shape('satin', '#3a3b3e', inner, 0.072, 0, 0, 0, { bevel: 0.004, bevelSeg: 1 });
  kit.shape('gloss', '#f4f5f6', out, 0.042, 0, 0, 0.07, { bevel: 0.012, bevelSeg: 3 });
  kit.quad(word('tesla-word', 'TESLA', '#6f7378', 34, 256, 48, 700, 14), null, 0.05, 0.0094, 0, Ht * 0.5 - 0.058, 0.1123);
  kit.led('#43e36b', 'status', (m) => kit.box(m, null, 0, -0.012, 0.1122, 0.0022, 0.03, 0.0006, { r: 0.001, seg: 1 }), { intensity: 2.2 });
  kit.tube('rubber', '#141415', [[0.0, -Ht * 0.5 + 0.02, 0.05], [0.002, -Ht * 0.5 - 0.06, 0.055], [0.01, -Ht * 0.5 - 0.2, 0.06], [0.04, -Ht * 0.5 - 0.3, 0.08], [0.09, -Ht * 0.5 - 0.36, 0.1]], 0.0085, { rs: 7, segs: 22, tension: 0.5 });
  kit.box('rubber', '#1a1a1b', 0.0, -Ht * 0.5 - 0.004, 0.05, 0.026, 0.02, 0.026, { r: 0.008, seg: 2 });
  kit.port('cable', 'power', 0.09, -Ht * 0.5 - 0.36, 0.1);
  return kit.build();
}

function netatmo() {
  const kit = new Kit();
  const mod = (x, H) => {
    kit.cyl('satin', '#f3f3f1', x, 0.0035, 0, 0.0226, 0.007, { seg: 32 });
    kit.cyl('metal', '#c5c8cb', x, 0.007 + (H - 0.016) / 2, 0, 0.0225, H - 0.016, { seg: 32 });
    kit.lathe('satin', '#f3f3f1', x, H - 0.009, 0, [[0.0225, 0], [0.0225, 0.007], [0.021, 0.009], [0, 0.009]], { seg: 32 });
    kit.box('matte', '#2b2c2e', x, 0.007 + (H - 0.016) * 0.55, 0.0224, 0.0022, (H - 0.016) * 0.55, 0.0006);
    kit.quad(word('netatmo-word', 'NETATMO', '#7d8186', 28, 256, 40, 700, 2), null, 0.024, 0.00375, x, 0.0105, 0.0228);
  };
  mod(-0.034, 0.155);
  mod(0.034, 0.105);
  kit.led('#ffffff', 'status', (m) => kit.cyl(m, null, -0.034, 0.1551, 0, 0.0012, 0.0004, { seg: 8 }), { intensity: 0.8 });
  return kit.build();
}

export const OTHER = {
  'roborock-saros-10r': { mount: 'floor', family: 'other', name: 'Roborock Saros 10R', build: saros10r, view: { yaw: 30, el: 16 } },
  'shelly-plug-s': { mount: 'wall', family: 'other', name: 'Shelly Plug S Gen3', build: plugS, view: { yaw: 35, el: 14 } },
  'shelly-1-gen4': { mount: 'wall', family: 'other', name: 'Shelly 1 Gen4', build: shelly1g4, view: { yaw: 25, el: 24 } },
  'tesla-wall-connector': { mount: 'garage', family: 'other', name: 'Tesla Wall Connector', build: teslaWall, view: { yaw: 25, el: 8 } },
  'netatmo-weather': { mount: 'surface', family: 'other', name: 'Netatmo Smart Weather Station', build: netatmo, view: { yaw: 15, el: 12 } },
};

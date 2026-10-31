// Instalator device models: 19" wall cabinets (9U, 12U) with glass door and the flush multimedia box, with rack/door/shelf hooks.
import * as THREE from 'three';
import { Kit, rrPts, circPts } from './kit.js';
import { CLEAR, labelMat } from './mat.js';
import { rectPts, cupGeo } from './ports.js';
import { U } from './unifi-rack.js';

const BLACK = '#1d1e21';

function railMat(units) {
  const h = units * 3 * 16;
  return labelMat('rail-holes-' + units, 32, h, (ctx) => {
    ctx.clearRect(0, 0, 32, h);
    ctx.fillStyle = 'rgba(12,13,14,0.92)';
    for (let u = 0; u < units; u++) for (const f of [6.35, 22.25, 38.1]) { const y = h - (u * 44.45 + f) / (units * 44.45) * h; ctx.fillRect(10, y - 4.5, 12, 9); }
  }, { metal: 0.6, rough: 0.45 });
}

function cabinet(units) {
  const kit = new Kit();
  const W = 0.6, D = 0.45, H = units * U + 0.11, t = 0.0015;
  const y0 = -H / 2, y1 = H / 2;
  kit.box('satin', BLACK, 0, y1 - t / 2, D / 2, W, t, D);
  kit.box('satin', BLACK, 0, y0 + t / 2, D / 2, W, t, D);
  kit.box('satin', BLACK, 0, 0, t / 2, W, H, t);
  for (const s of [-1, 1]) {
    kit.box('satin', BLACK, s * (W / 2 - t / 2), 0, D / 2, t, H, D);
    for (let i = 0; i < 5; i++) kit.box('matte', '#0c0c0d', s * (W / 2 + 0.0001), y1 - 0.06 - i * 0.012, D * 0.55, 0.0004, 0.004, 0.16, { r: 0.0018, seg: 2, axis: 'x' });
  }
  const iw = W - 2 * t - 0.002, ih = H - 2 * t - 0.002;
  kit.box('matte', '#17181b', 0, y1 - t - 0.0006, D / 2, iw, 0.0008, D - 0.004);
  kit.box('matte', '#17181b', 0, y0 + t + 0.0006, D / 2, iw, 0.0008, D - 0.004);
  kit.box('matte', '#141518', 0, 0, t + 0.0006, iw, ih, 0.0008);
  for (const s of [-1, 1]) kit.box('matte', '#191a1d', s * (W / 2 - t - 0.0006), 0, D / 2, 0.0008, ih, D - 0.004);
  const perf = labelMat('cab-perf', 256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) ctx.fillRect(6 + i * 16, 6 + j * 16, 8, 4);
  }, { rough: 0.9 });
  kit.quad(perf, null, iw * 0.7, ih * 0.75, 0, 0, t + 0.0012);
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
    const y = y0 + 0.08 + k * (H - 0.16) / 3;
    kit.box('metal', '#5a5e63', s * (W / 2 - 0.05), y, 0.06, 0.004, 0.004, 0.05);
    kit.box('metal', '#5a5e63', s * (W / 2 - 0.05), y, 0.085, 0.03, 0.004, 0.004);
  }
  kit.box('satin', '#26272a', 0, y1 - 0.025, D - 0.012, W - 0.006, 0.05, 0.024);
  kit.box('satin', '#26272a', 0, y0 + 0.025, D - 0.012, W - 0.006, 0.05, 0.024);
  for (const s of [-1, 1]) kit.box('satin', '#26272a', s * (W / 2 - 0.03), 0, D - 0.012, 0.06, H - 0.1, 0.024);
  for (const x of [-0.12, 0.12]) {
    kit.lathe('matte', '#0b0b0c', x, y1 + 0.0002, D * 0.5, [[0.045, 0], [0, 0]], { seg: 24 });
    for (let k = 0; k < 4; k++) kit.box('satin', '#2a2b2e', x, y1 + 0.0006, D * 0.5, 0.09, 0.0008, 0.004, { ry: k * Math.PI / 4 });
  }
  kit.box('rubber', '#111213', 0, y1 + 0.0003, 0.06, 0.28, 0.0006, 0.03);
  const zr = D - 0.075, ru = units * U, yU0 = -ru / 2;
  const rail = railMat(units);
  for (const s of [-1, 1]) {
    const x = s * 0.2325;
    kit.box('metal', '#b8bbbf', x, 0, zr - 0.001, 0.018, ru + 0.03, 0.002);
    kit.box('metal', '#a9acb0', s * 0.2405, 0, zr - 0.02, 0.002, ru + 0.03, 0.038);
    kit.quad(rail, null, 0.012, ru, x, 0, zr + 0.0002);
  }
  kit.box('alu', '#9da1a6', 0, y1 - t - 0.0028, zr - 0.035, W - 0.07, 0.004, 0.018, { r: 0.0012, seg: 1 });
  kit.led('#dbe6ff', 'strip', (m) => kit.box(m, null, 0, y1 - t - 0.0049, zr - 0.035, W - 0.08, 0.0008, 0.012), { intensity: 2.4 });
  kit.ao({ axis: 2, lo: 0.0, hi: D * 0.85, k: 0.42 });
  const door = new Kit();
  const dW = W - 0.004, dH = H - 0.004, fw = 0.032;
  door.shape('satin', '#202124', rectPts(dW / 2, 0, dW, dH), 0.018, 0, 0, 0, { holes: [rectPts(dW / 2, 0, dW - 2 * fw, dH - 2 * fw)] });
  door.box(CLEAR.smoke, null, dW / 2, 0, 0.009, dW - 2 * fw + 0.01, dH - 2 * fw + 0.01, 0.004);
  door.box('satin', '#2b2c30', dW - 0.016, 0, 0.024, 0.022, 0.12, 0.012, { r: 0.006, seg: 3 });
  door.box('chrome', '#c9ccd0', dW - 0.016, 0.03, 0.031, 0.008, 0.008, 0.002, { r: 0.0035, seg: 4 });
  door.box('satin', '#151618', dW - 0.016, -0.012, 0.0315, 0.012, 0.05, 0.006, { r: 0.003, seg: 3 });
  for (const s of [-1, 1]) door.cyl('chrome', '#a5a8ad', 0.004, s * (dH / 2 - 0.05), 0.009, 0.004, 0.03, { seg: 8 });
  const dg = door.build();
  dg.position.set(-W / 2 + 0.002, 0, D + 0.0005);
  dg.name = 'door';
  dg.userData.hinge = 'left';
  dg.userData.open = -1.75;
  kit.extra.push(dg);
  const g = kit.build();
  g.userData.door = dg;
  g.userData.units = units;
  g.userData.rackOrigin = [0, +yU0.toFixed(5), +zr.toFixed(5)];
  g.userData.rails = { x: [-0.2325, 0.2325], z: zr, u: U };
  return g;
}

function mediaBox() {
  const kit = new Kit();
  const W = 0.42, H = 0.55, D = 0.14, iw = 0.392, ih = 0.522;
  const plate = labelMat('mbox-perf', 256, 340, (ctx) => {
    ctx.clearRect(0, 0, 256, 340);
    ctx.fillStyle = 'rgba(70,74,78,0.55)';
    for (let i = 0; i < 20; i++) for (let j = 0; j < 27; j++) ctx.fillRect(10 + i * 12, 8 + j * 12, 6, 6);
  }, { metal: 0.5, rough: 0.5 });
  kit.add('metal', '#d6d8da', cupGeo(rectPts(0, 0, iw, ih), D), { face: (cx, cy, cz, nx, ny, nz) => (nz > 0.9 ? '#e3e4e5' : null) });
  kit.quad(plate, null, iw - 0.03, ih - 0.03, 0, 0, -D + 0.0004);
  kit.shape('satin', '#f4f4f2', rectPts(0, 0, W, H), 0.008, 0, 0, 0, { holes: [rectPts(0, 0, iw, ih)] });
  kit.box('metal', '#b5b8bb', 0, 0.2, -D + 0.008, iw - 0.02, 0.035, 0.0075);
  kit.box('satin', '#f1f1ef', 0.09, 0.2, -D + 0.04, 0.054, 0.085, 0.06, { r: 0.004, seg: 2 });
  kit.box('matte', '#2b2c2e', 0.09, 0.2, -D + 0.0705, 0.04, 0.04, 0.001, { r: 0.018, seg: 6 });
  const shY = -0.075, shT = 0.0025, shD = D - 0.012;
  kit.box('metal', '#c3c6c9', 0, shY - shT / 2, -D / 2 - 0.004, iw - 0.006, shT, shD);
  kit.box('metal', '#b7babd', 0, shY - 0.012, -0.012 - 0.003, iw - 0.006, 0.024, 0.0015);
  for (const s of [-1, 1]) for (const yy of [0.12, -0.2]) kit.box('rubber', '#2c2d2f', s * 0.15, yy, -D + 0.012, 0.03, 0.004, 0.02);
  const door = new Kit();
  const dW = iw - 0.004, dH = ih - 0.004;
  const vent = labelMat('mbox-vent', 256, 64, (ctx) => {
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = 'rgba(30,32,34,0.9)';
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const x = 6 + i * 42, y = 8 + r * 19; ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + 32, y); ctx.arc(x + 32, y + 4, 4, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x + 4, y + 8); ctx.arc(x + 4, y + 4, 4, Math.PI / 2, Math.PI * 1.5); ctx.fill(); }
  });
  door.box('satin', '#f6f6f4', dW / 2, 0, 0.0015, dW, dH, 0.003, { bevel: 0.0008 });
  for (const yy of [dH / 2 - 0.05, -dH / 2 + 0.05]) door.quad(vent, null, 0.25, 0.0625, dW / 2, yy, 0.0031);
  door.box('matte', '#c9cbcd', dW - 0.022, 0, 0.0045, 0.012, 0.05, 0.003, { r: 0.004, seg: 3 });
  door.cyl('chrome', '#b9bcc0', dW - 0.022, 0, 0.0065, 0.0035, 0.002, { axis: 'z', seg: 12 });
  const dg = door.build();
  dg.position.set(-dW / 2, 0, 0.005);
  dg.name = 'door';
  dg.userData.hinge = 'left';
  dg.userData.open = -1.75;
  kit.extra.push(dg);
  const g = kit.build();
  g.userData.door = dg;
  g.userData.units = 0;
  g.userData.rackOrigin = [0, +(shY).toFixed(4), -0.012];
  g.userData.shelf = { origin: [0, +shY.toFixed(4), +(-D / 2 - 0.004).toFixed(4)], w: +(iw - 0.01).toFixed(3), d: +(shD - 0.004).toFixed(3) };
  return g;
}

export const RACKS = {
  'rack-9u': { mount: 'wall', family: 'rack', name: 'Szafa wisząca 19" 9U', build: () => cabinet(9), view: { yaw: 32, el: 16 } },
  'rack-12u': { mount: 'wall', family: 'rack', name: 'Szafa wisząca 19" 12U', build: () => cabinet(12), view: { yaw: 32, el: 16 } },
  'media-box': { mount: 'wall', family: 'rack', name: 'Skrzynka multimedialna podtynkowa', build: mediaBox, view: { yaw: 18, el: 10 } },
};

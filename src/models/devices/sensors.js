// Instalator device models: sensors and security (Aqara Hub M3, Door P2, Motion P2, FP2, leak, smoke, Camera G5 Pro) and the Nuki Smart Lock Ultra.
import * as THREE from 'three';
import { Kit, circPts } from './kit.js';
import { labelMat } from './mat.js';
import { topR, botR } from './unifi-desk.js';

const AQ = '#f6f6f4';

function word(key, text, color, px = 44, w = 256, h = 64, weight = 500) {
  return labelMat(key, w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.font = `${weight} ${px}px "Avenir Next", Helvetica, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
  });
}

function hubM3() {
  const kit = new Kit();
  const W = 0.105, H = 0.034;
  kit.loft('metal', '#5a5652', 0, 0, 0, W - 0.006, W - 0.006, 0.02, 4, [[0.002, 0], [0, 0.002], [0, 0.0115]]);
  const grille = labelMat('m3-grille', 512, 64, (ctx) => {
    ctx.clearRect(0, 0, 512, 64);
    ctx.fillStyle = 'rgba(20,20,20,0.9)';
    for (let i = 0; i < 64; i++) for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(4 + i * 8 + (j % 2) * 4, 10 + j * 14, 2.4, 0, Math.PI * 2); ctx.fill(); }
  }, { metal: 0.6, rough: 0.5 });
  for (let k = 0; k < 4; k++) kit.quad(grille, null, 0.06, 0.0075, Math.sin(k * Math.PI / 2) * (W / 2 - 0.0028), 0.0058, Math.cos(k * Math.PI / 2) * (W / 2 - 0.0028), { ry: k * Math.PI / 2 });
  kit.loft('metal', '#6a655f', 0, 0.0115, 0, W, W, 0.022, 5, [[0, 0], [0, 0.0185], ...topR(0.0205, 0.002, 2)]);
  kit.loft('gloss', '#0d0d0e', 0, 0.032, 0, W - 0.004, W - 0.004, 0.02, 5, [[0, 0], [0.0004, 0.0015], [0.0018, 0.002]]);
  kit.box('satin', '#d6d3cf', 0, 0.022, W / 2 + 0.0002, 0.016, 0.0055, 0.0012, { r: 0.0027, seg: 3 });
  kit.box('matte', '#141414', 0, 0.0035, W / 2 - 0.0016, 0.011, 0.0034, 0.004, { r: 0.0008, seg: 2 });
  kit.led('#ffffff', 'status', (m) => kit.box(m, null, 0, 0.0125, W / 2 + 0.0001, 0.02, 0.0007, 0.0004), { intensity: 1 });
  kit.port('lan', 'rj45', 0.02, 0.018, -W / 2);
  return kit.build();
}

function doorP2() {
  const kit = new Kit();
  kit.loft('satin', AQ, 0, 0, 0, 0.0245, 0.072, 0.0118, 5, [[0.0008, 0], [0, 0.0008], [0, 0.0075], ...topR(0.0122, 0.0045, 3)], { axis: 'z' });
  kit.lathe('satin', '#f1f1ef', 0, -0.024, 0.0122, [[0, 0.0003], [0.0042, 0.0001], [0.0049, -0.0003]].map(([r, y]) => [r, y]).reverse(), { seg: 20, axis: 'z' });
  kit.lathe('satin', '#dcdcda', 0, -0.024, 0.0119, [[0.0053, 0.0001], [0.0049, -0.0001]], { seg: 20, axis: 'z' });
  kit.led('#3d8bff', 'status', (m) => kit.cyl(m, null, 0, 0.012, 0.0121, 0.0004, 0.0004, { axis: 'z', seg: 6 }), { intensity: 0.6 });
  kit.loft('satin', AQ, 0.022, 0.0, 0, 0.0145, 0.036, 0.0071, 4, [[0.0008, 0], [0, 0.0008], [0, 0.0072], ...topR(0.0112, 0.0038, 3)], { axis: 'z' });
  return kit.build();
}

function motionP2(opts = {}) {
  const kit = new Kit();
  const wall = opts.mount === 'wall';
  if (wall) kit.push(0, 0, 0, Math.PI / 2, 0, 0);
  kit.lathe('satin', AQ, 0, 0, 0, [[0, 0], [0.0165, 0], [0.0168, 0.0012], [0.0145, 0.004], [0.007, 0.013], [0.0052, 0.016], [0, 0.016]], { seg: 24 });
  kit.cyl('satin', '#f1f1ef', 0, 0.022, 0, 0.0042, 0.012, { seg: 12 });
  kit.sphere('satin', '#eeeeec', 0, 0.03, 0, 0.0062, { ws: 12, hs: 8 });
  kit.cyl('satin', '#f1f1ef', 0, 0.035, 0, 0.0032, 0.006, { seg: 10 });
  if (wall) kit.pop();
  const y0 = wall ? 0 : 0.037, z0 = wall ? 0.037 : 0;
  kit.push(0, y0, z0, wall ? -0.12 : 0, 0, 0);
  kit.loft('satin', AQ, 0, wall ? -0.022 : 0, 0, 0.032, 0.03, 0.006, 3, [[0.001, 0], [0, 0.001], [0, 0.041], ...topR(0.044, 0.003, 2)]);
  const yy = wall ? -0.022 : 0;
  kit.box('satin', '#ebebe9', 0, yy + 0.0285, 0.0152, 0.0262, 0.024, 0.0018, { r: 0.0035, seg: 3 });
  kit.quad(word('aqara-word-grey', 'Aqara', '#9ea2a6'), null, 0.012, 0.003, 0, yy + 0.0105, 0.0151);
  kit.box('matte', '#c9c9c7', 0, yy + 0.0435, 0.006, 0.0045, 0.0008, 0.0013, { r: 0.0006, seg: 2, axis: 'y' });
  kit.pop();
  kit.ud.mount = wall ? 'wall' : 'surface';
  return kit.build();
}

function fp2() {
  const kit = new Kit();
  const R = 0.0375, H = 0.022;
  kit.lathe('satin', AQ, 0, 0, 0, [[0, -H], [0.026, -H + 0.0004], [0.033, -H + 0.0018], [0.0362, -H + 0.0045], [0.0375, -H + 0.009], [0.0374, -0.004], [0.0365, -0.001], [0.033, 0], [0, 0]], { seg: 40 });
  kit.quad(word('aqara-word-pale', 'Aqara', '#c6c9cc'), null, 0.014, 0.0035, 0, -H - 0.0002, 0, { rx: Math.PI / 2 });
  kit.box('glass', '#2a2c30', 0, -H + 0.0006, -0.031, 0.006, 0.0016, 0.002, { r: 0.0007, seg: 2 });
  return kit.build();
}

function leak() {
  const kit = new Kit();
  const R = 0.025, H = 0.0135;
  kit.lathe('satin', AQ, 0, 0, 0, [[0, 0], [0.0225, 0], [0.0246, 0.0016], [0.025, 0.005], [0.0246, 0.0095], [0.0228, 0.0125], [0.019, 0.0135], [0, 0.0138]], { seg: 36 });
  for (const x of [-0.008, 0.008]) kit.cyl('metal', '#c3c5c8', x, -0.0005, 0, 0.0018, 0.001, { seg: 8 });
  const pm = labelMat('aqara-leak-top', 128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = '#b2b6ba';
    ctx.beginPath(); ctx.moveTo(64, 38); ctx.bezierCurveTo(74, 54, 82, 64, 82, 74); ctx.arc(64, 74, 18, 0, Math.PI); ctx.bezierCurveTo(46, 64, 54, 54, 64, 38); ctx.fill();
  });
  kit.quad(pm, null, 0.018, 0.018, 0, 0.0139, 0, { rx: -Math.PI / 2 });
  return kit.build();
}

function smoke() {
  const kit = new Kit();
  const R = 0.0525, H = 0.045;
  kit.lathe('satin', AQ, 0, 0, 0, [[0, -H], [0.03, -H + 0.0006], [0.042, -H + 0.003], [0.0485, -H + 0.008], [0.0515, -H + 0.016], [0.0525, -H + 0.026], [0.0522, -0.006], [0.051, -0.002], [0.048, 0], [0, 0]], { seg: 44 });
  const slots = labelMat('aqara-smoke-slots', 512, 512, (ctx) => {
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = 'rgba(45,47,50,0.92)';
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      if (Math.abs(Math.sin(a) - 1) < 0.02 && Math.cos(a) > -0.2 && Math.cos(a) < 0.2) continue;
      ctx.save(); ctx.translate(256, 256); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(150, -3.2); ctx.lineTo(228, -3.2); ctx.arc(228, 0, 3.2, -Math.PI / 2, Math.PI / 2); ctx.lineTo(150, 3.2); ctx.arc(150, 0, 3.2, Math.PI / 2, Math.PI * 1.5); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#a9adb1'; ctx.font = '500 34px "Avenir Next", Helvetica, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Aqara', 256, 256);
  });
  kit.quad(slots, null, 0.092, 0.092, 0, -H - 0.0002, 0, { rx: Math.PI / 2 });
  kit.box('satin', '#efefed', 0, -H + 0.0018, 0.0405, 0.012, 0.0024, 0.0055, { r: 0.0018, seg: 2, axis: 'y' });
  kit.led('#3dd06a', 'status', (m) => kit.cyl(m, null, 0, -H - 0.0001, -0.012, 0.0006, 0.0003, { seg: 8 }), { intensity: 0.8 });
  return kit.build();
}

function nukiUltra(opts = {}) {
  const kit = new Kit();
  const R = 0.0285, L = 0.058;
  kit.cyl('satin', opts.ring === 'white' ? '#efefed' : '#1b1b1c', 0, 0, 0.003, 0.0292, 0.006, { axis: 'z', seg: 40 });
  kit.lathe('chrome', '#a3a7ab', 0, 0, 0, [[0.0284, 0.006], [R, 0.008], [R, L - 0.0035], [0.0279, L - 0.0008], [0.0268, L]], { seg: 44, axis: 'z' });
  kit.lathe('chrome', '#b4b7ba', 0, 0, 0, [[0.0268, L], [0.0172, L + 0.0001]], { seg: 40, axis: 'z' });
  kit.lathe('chrome', '#c4c7ca', 0, 0, 0, [[0.0172, L + 0.0001], [0.0166, L + 0.0022], [0.0152, L + 0.003], [0, L + 0.0032]], { seg: 40, axis: 'z' });
  kit.led('#ffffff', 'ring', (m) => kit.lathe(m, null, 0, 0, 0, [[0.0181, L + 0.00012], [0.0174, L + 0.00012]], { seg: 40, axis: 'z' }), { intensity: 0 });
  kit.quad(word('nuki-word', 'nuki', '#8e9195', 40, 128, 48, 700), null, 0.008, 0.003, 0, -0.0105, L + 0.0033);
  return kit.build();
}

function g5Pro() {
  const kit = new Kit();
  kit.cyl('satin', AQ, 0, 0.0, 0.003, 0.03, 0.006, { axis: 'z', seg: 32 });
  kit.box('satin', '#efefed', 0, 0.0, 0.017, 0.022, 0.016, 0.024, { r: 0.004, seg: 2, axis: 'x' });
  kit.box('satin', '#efefed', 0, 0.009, 0.03, 0.026, 0.016, 0.012, { r: 0.004, seg: 2, axis: 'x', rx: -0.7 });
  kit.cyl('satin', '#e2e2e0', 0, 0.016, 0.036, 0.007, 0.028, { axis: 'x', seg: 12 });
  kit.push(0, 0.05, 0.075, 0.12, 0, 0);
  kit.loft('satin', AQ, 0, 0, -0.055, 0.084, 0.07, 0.022, 5, [[0.006, 0], ...botR(0, 0.006, 2), [0, 0.096], ...topR(0.11, 0.014, 4)], { axis: 'z' });
  kit.box('glass', '#0a0b0d', 0, 0, 0.0552, 0.066, 0.052, 0.0008, { r: 0.012, seg: 4 });
  kit.push(-0.0142, 0.0095, 0.0556);
  kit.cyl('metal', '#3a3d42', 0, 0, 0.0008, 0.0128, 0.0016, { axis: 'z', seg: 24 });
  kit.cyl('glass', '#0d1118', 0, 0, 0.0018, 0.0098, 0.0022, { axis: 'z', seg: 24 });
  kit.cyl('glass', '#1f2c44', 0, 0, 0.003, 0.0048, 0.0004, { axis: 'z', seg: 16 });
  kit.ud.lens = { pos: kit.pt(0, 0, 0.003), dir: kit.dir(0, 0, 1), fov: 135 };
  kit.pop();
  kit.cyl('satin', '#d8d8d6', 0.0148, 0.0095, 0.0562, 0.0078, 0.0012, { axis: 'z', seg: 20 });
  kit.cyl('glass', '#1a1b1e', -0.0142, -0.0135, 0.0562, 0.0075, 0.0012, { axis: 'z', seg: 20 });
  kit.quad(word('aqara-word-grey', 'Aqara', '#9ea2a6'), null, 0.016, 0.004, 0.0422, 0.012, 0.0, { ry: Math.PI / 2 });
  kit.pop();
  return kit.build();
}

export const SENSORS = {
  'aqara-hub-m3': { mount: 'surface', family: 'sensor', name: 'Aqara Hub M3', build: hubM3, view: { el: 22 } },
  'aqara-door-p2': { mount: 'door', family: 'sensor', name: 'Aqara Door and Window Sensor P2', build: doorP2, view: { yaw: 18, el: 10 } },
  'aqara-motion-p2': { mount: 'surface', family: 'sensor', name: 'Aqara Motion and Light Sensor P2', build: motionP2, view: { yaw: 25, el: 12 } },
  'aqara-fp2': { mount: 'ceiling', family: 'sensor', name: 'Aqara Presence Sensor FP2', build: fp2 },
  'aqara-leak': { mount: 'floor', family: 'sensor', name: 'Aqara Water Leak Sensor', build: leak, view: { el: 40 } },
  'aqara-smoke': { mount: 'ceiling', family: 'sensor', name: 'Aqara Smart Smoke Detector', build: smoke },
  'nuki-ultra': { mount: 'doorLock', family: 'sensor', name: 'Nuki Smart Lock Ultra', build: nukiUltra, view: { yaw: 35, el: 14 } },
  'aqara-g5-pro': { mount: 'outdoorWall', family: 'sensor', name: 'Aqara Camera G5 Pro', build: g5Pro, view: { yaw: 30, el: 10 } },
};

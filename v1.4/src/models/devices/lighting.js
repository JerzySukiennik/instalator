// Instalator device models: lighting (Hue A60 and GU10, IKEA KAJPLATS, Hue Bridge Pro, Hue Tap Dial, IKEA DIRIGERA, Govee Floor Lamp 2).
import * as THREE from 'three';
import { Kit, circPts } from './kit.js';
import { COL, labelMat, lightMat } from './mat.js';
import { topR, botR } from './unifi-desk.js';

const WARM = '#ffd7a3';

function wordMat(key, text, color, font, w = 256, h = 96) {
  return labelMat(key, w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    String(text).split('\n').forEach((t, i, a) => ctx.fillText(t, w / 2, h / 2 + (i - (a.length - 1) / 2) * h * 0.36));
  });
}

function e27Base(kit, seg = 8) {
  const thread = [];
  for (let i = 0; i <= 6; i++) thread.push([i % 2 ? 0.0126 : 0.0137, -0.0262 + i * 0.0033]);
  kit.lathe('metal', '#d3d5d7', 0, 0, 0, [...thread, [0.0124, -0.0055]], { seg, face: (cx, cy, cz, nx, ny, nz) => (ny < -0.2 ? '#9fa3a7' : null) });
  kit.lathe('gloss', '#141416', 0, 0, 0, [[0.0124, -0.0055], [0.0062, -0.0024], [0.0034, -0.0014]], { seg: 8 });
  kit.lathe('metal', '#cdb98a', 0, 0, 0, [[0.0034, -0.0014], [0, 0]], { seg: 8 });
}

function bulb(o) {
  const kit = new Kit();
  e27Base(kit);
  kit.lathe('satin', o.body, 0, 0, 0, o.neck, { seg: 12 });
  const lc = o.color || WARM;
  kit.light(lc, 'bulb', [0, o.lightY, 0], (m) => kit.lathe(m, null, 0, 0, 0, o.dome, { seg: 12 }), { on: o.on, base: '#efedea', intensity: o.on ? 1.15 : 1.15 });
  if (o.logo) kit.quad(o.logo, null, o.logoW, o.logoW * 0.375, 0, o.logoY, o.logoZ, { rx: o.logoRx || 0, rz: Math.PI });
  kit.ud.bulb = true;
  return kit.build();
}

function hueE27(opts = {}) {
  return bulb({
    on: opts.on, color: opts.color,
    body: '#f4f4f2',
    neck: [[0.029, -0.075], [0.0255, -0.0605], [0.0192, -0.0445], [0.0158, -0.0325], [0.015, -0.0262]],
    dome: [[0, -0.112], [0.0165, -0.1112], [0.0268, -0.1062], [0.0301, -0.0965], [0.0299, -0.0855], [0.029, -0.075]],
    lightY: -0.094,
    logo: wordMat('hue-word-dark', 'hue', '#4f4a44', '600 66px "Avenir Next", Helvetica, Arial', 192, 72), logoW: 0.016, logoY: -0.056, logoZ: 0.0247, logoRx: 0.34,
  });
}

function kajplats(opts = {}) {
  return bulb({
    on: opts.on, color: opts.color,
    body: '#f2f1ee',
    neck: [[0.028, -0.066], [0.0215, -0.052], [0.0162, -0.036], [0.0148, -0.0262]],
    dome: [[0, -0.122], [0.0195, -0.1188], [0.0315, -0.1075], [0.0346, -0.0905], [0.0322, -0.0745], [0.028, -0.066]],
    lightY: -0.092,
    logo: wordMat('ikea-word', 'IKEA', '#4d4a46', '700 60px Helvetica, Arial', 192, 72), logoW: 0.012, logoY: -0.047, logoZ: 0.0198, logoRx: 0.36,
  });
}

function hueGU10(opts = {}) {
  const kit = new Kit();
  kit.lathe('satin', '#f5f5f3', 0, 0, 0, [[0.0222, -0.0566], [0.0249, -0.0558], [0.025, -0.0505], [0.0222, -0.038], [0.0192, -0.0262], [0.0136, -0.0222], [0.0134, -0.0095], [0, -0.0095]], { seg: 14 });
  kit.light(opts.color || WARM, 'bulb', [0, -0.055, 0], (m) => kit.lathe(m, null, 0, 0, 0, [[0, -0.0568], [0.0222, -0.0566]], { seg: 14 }), { on: opts.on, base: '#ebe9e5', intensity: 1.9 });
  for (const x of [-0.0055, 0.0055]) {
    kit.cyl('metal', '#c9cbcd', x, -0.0047, 0, 0.0013, 0.0094, { seg: 5, open: true });
    kit.cyl('metal', '#c9cbcd', x, -0.0012, 0, 0.0025, 0.0024, { seg: 6 });
  }
  kit.quad(wordMat('hue-gu10-word', 'PHILIPS\nhue', '#6f6a64', '600 40px "Avenir Next", Helvetica, Arial', 192, 128), null, 0.0175, 0.0117, 0, -0.0425, 0.0242, { rx: 0.23, rz: Math.PI });
  kit.ud.bulb = true;
  return kit.build();
}

function hueBridgePro() {
  const kit = new Kit();
  const W = 0.0923, H = 0.026;
  kit.loft('matte', '#0c0c0e', 0, 0, 0, W, W, 0.021, 5, [[0.003, 0], ...botR(0, 0.003, 2), ...topR(H, 0.006, 3)]);
  kit.lathe('satin', '#3d3d42', 0, H, 0, [[0.0318, 0.00005], [0.0309, 0.0003]], { seg: 40 });
  kit.lathe('gloss', '#151518', 0, H, 0, [[0.0309, 0.0003], [0.0296, 0.0006], [0.02, 0.0008], [0, 0.0009]], { seg: 40 });
  kit.quad(wordMat('hue-word-bridge', 'hue', '#8d8d95', '500 66px "Avenir Next", Helvetica, Arial', 192, 72), null, 0.019, 0.0071, 0, H + 0.0011, 0.002, { rx: -Math.PI / 2 });
  kit.led('#f1f3f6', 'status', (m) => kit.cyl(m, null, -0.004, H + 0.00005, -0.038, 0.0007, 0.0003, { seg: 8 }), { intensity: 1.4 });
  kit.box('matte', '#4b4b4f', 0.004, H + 0.0001, -0.038, 0.0032, 0.0002, 0.0018);
  kit.port('lan', 'rj45', -0.01, 0.012, -W / 2);
  kit.port('power', 'power', 0.015, 0.012, -W / 2);
  return kit.build();
}

function hueTapDial() {
  const kit = new Kit();
  kit.loft('satin', '#f5f5f3', 0, 0, 0, 0.083, 0.083, 0.007, 3, [[0.0006, 0], [0, 0.0008], [0, 0.0045], ...topR(0.0062, 0.0016, 2)], { axis: 'z' });
  kit.loft('satin', '#f7f7f5', 0, 0, 0.0062, 0.059, 0.059, 0.0085, 3, [[0, 0], [0, 0.009], ...topR(0.0122, 0.003, 3)], { axis: 'z' });
  const z0 = 0.0184;
  kit.lathe('satin', '#eeeeec', 0, 0, z0, [[0.0242, -0.0002], [0.0242, 0.0042], [0.0236, 0.0052], [0.0222, 0.0056]], { seg: 32, axis: 'z' });
  kit.lathe('satin', '#f8f8f6', 0, 0, z0, [[0.0222, 0.0056], [0.0185, 0.0058], [0, 0.0062]], { seg: 32, axis: 'z' });
  for (const a of [0, Math.PI / 2]) kit.box('matte', '#d5d6d4', 0, 0, z0 + 0.0061, 0.037, 0.0004, 0.0004, { rz: a });
  kit.box('matte', '#d5d6d4', 0, 0, z0 + 0.0062, 0.0024, 0.0024, 0.0003, { rz: Math.PI / 4 });
  const dots = [[[0, 0.0105]], [[0.0098, 0.0013], [0.0112, -0.0013]].map(([x, y]) => [x, y]), [[-0.0005, -0.0098], [0.0005, -0.0112], [0.0015, -0.0098]], [[-0.0098, 0.0012], [-0.0112, 0.0012], [-0.0098, -0.0012], [-0.0112, -0.0012]]];
  for (const set of dots) for (const [x, y] of set) kit.cyl('matte', '#b9bab8', x, y, z0 + 0.0063, 0.0006, 0.0002, { axis: 'z', seg: 6 });
  return kit.build();
}

function dirigera() {
  const kit = new Kit();
  const R = 0.056, T = 0.027;
  kit.push(0, R, 0.0, 0, 0, 0);
  kit.cyl('satin', '#eceae6', 0, 0, T * 0.32, R * 0.965, T * 0.64, { axis: 'z', seg: 40 });
  kit.lathe('satin', '#f6f5f2', 0, 0, T * 0.62, [[R, -0.0001], [R, T * 0.3], [R - 0.0012, T * 0.38], [0, T * 0.38]], { seg: 40, axis: 'z' });
  kit.pop();
  kit.box('satin', '#e3e1dc', 0, 0.0035, T * 0.3, 0.05, 0.007, T * 0.55);
  kit.box('fabric', '#f1eee6', 0, -0.0085, T * 0.98, 0.014, 0.018, 0.0012, { r: 0.002, seg: 2, rx: 0.08 });
  kit.quad(wordMat('ikea-tag', 'IKEA', '#b7b2a6', '700 60px Helvetica, Arial', 192, 72), null, 0.012, 0.0045, 0, -0.0095, T * 0.98 + 0.0008, { rz: Math.PI });
  kit.port('lan', 'rj45', 0, 0.03, 0);
  return kit.build();
}

function goveeFloorLamp(opts = {}) {
  const kit = new Kit();
  const Hh = 1.52;
  kit.lathe('satin', '#1b1c1e', 0, 0, 0, [[0, 0], [0.122, 0], [0.13, 0.004], [0.131, 0.012], [0.124, 0.02], [0.02, 0.024], [0, 0.024]], { seg: 40 });
  kit.box('satin', '#232427', 0, Hh / 2 + 0.012, 0, 0.034, Hh - 0.02, 0.026, { r: 0.008, seg: 3, axis: 'y' });
  kit.box('satin', '#2a2b2e', 0, Hh + 0.004, 0, 0.036, 0.012, 0.028, { r: 0.009, seg: 3, axis: 'y' });
  kit.light(opts.color || '#ff6ad5', 'lamp', [0, 0.8, 0.02], (m) => kit.box(m, null, 0, 0.8, 0.0132, 0.022, 1.38, 0.002, { r: 0.004, seg: 2 }), { on: opts.on ?? true, base: '#f1f1f1', intensity: 2.2 });
  kit.led('#ffffff', 'status', (m) => kit.cyl(m, null, 0.07, 0.0242, 0.07, 0.003, 0.0006, { seg: 10 }), { intensity: 0.6 });
  return kit.build();
}

export const LIGHT = {
  'hue-e27': { mount: 'socketE27', family: 'light', name: 'Philips Hue White and Color E27', build: hueE27, bulb: true, view: { on: true, lc: '#d76bff' } },
  'hue-gu10': { mount: 'socketGU10', family: 'light', name: 'Philips Hue White and Color GU10', build: hueGU10, bulb: true, view: { on: true, lc: '#d76bff' } },
  'ikea-kajplats-e27': { mount: 'socketE27', family: 'light', name: 'IKEA KAJPLATS E27', build: kajplats, bulb: true, view: { on: true, lc: '#4fd6ff' } },
  'hue-bridge-pro': { mount: 'surface', family: 'light', name: 'Philips Hue Bridge Pro', build: hueBridgePro, view: { el: 52 } },
  'hue-tap-dial': { mount: 'wall', family: 'light', name: 'Philips Hue Tap Dial Switch', build: hueTapDial },
  'ikea-dirigera': { mount: 'surface', family: 'light', name: 'IKEA DIRIGERA', build: dirigera },
  'govee-floor-lamp-2': { mount: 'floor', family: 'light', name: 'Govee Floor Lamp 2', build: goveeFloorLamp, view: { el: 12 } },
};

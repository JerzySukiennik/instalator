// Instalator device models: UniFi 19" rack gear (UDM Pro Max, USW Pro Max 16/24 PoE, UNVR, patch and brush panel, PDU Pro, UPS 2U, shelf).
import * as THREE from 'three';
import { Kit, rrPts, circPts } from './kit.js';
import { COL, labelMat } from './mat.js';
import { rectPts, rj45Pts, cupGeo, cup, rj45, sfp, openBox, frontPrint, printPlane, uniScreen, pinMat } from './ports.js';

export const U = 0.04445;
const ZF = 0.0024;
const T = 0.0012;
const SILVER = COL.uniSilver;

function ears(kit, w, u, color = SILVER) {
  const ew = (0.4826 - w) / 2;
  if (ew < 0.004) return;
  const hh = u * U - 0.0008;
  for (const s of [-1, 1]) {
    const cx = s * (w / 2 + ew / 2);
    const ys = u === 1 ? [0.00635, 0.0381] : [0.00635, u * U - 0.00635];
    const holes = ys.map((y) => rrPts(0.0095, 0.0064, 0.0031, 3, s * 0.23255, y));
    kit.shape('metal', color, rectPts(cx, u * U / 2, ew, hh), 0.0018, 0, 0, 0, { holes });
    kit.box('metal', COL.uniSilverDark, s * (w / 2 + 0.0009), u * U / 2, -0.012, 0.0018, hh * 0.8, 0.026);
  }
}

function chassis(kit, o) {
  const { w, h, depth, u = 1 } = o;
  const y0 = (u * U - h) / 2, yc = y0 + h / 2;
  kit.shape('metal', o.color || SILVER, rectPts(0, yc, w, h), T, 0, 0, ZF - T, { holes: o.holes || [] });
  kit.add('metal', o.side || COL.uniSilverDark, openBox(w, h, depth).translate(0, yc, ZF - T - depth / 2));
  if (o.ears !== false) ears(kit, w, u, o.color || SILVER);
  return { y0, yc, top: y0 + h };
}

function vents(kit, ranges, y, x0) {
  for (const [a, b] of ranges) kit.box('matte', COL.uniSlot, x0 + (a + b) / 2, y, ZF + 0.00006, b - a, 0.0011, 0.00012);
}

function screen(kit, x, y, size, kind) {
  kit.box('glass', '#08090b', x, y, ZF + 0.0003, size + 0.0032, size + 0.0032, 0.0006, { r: 0.0034, seg: 3 });
  kit.display(uniScreen(kind), size, size, x, y, ZF + 0.00062, { r: 0.0026 });
}

function etherMat(color = '#3d8bff') {
  const m = new THREE.MeshStandardMaterial({ color: '#e9e8e3', emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.5, metalness: 0, flatShading: true });
  m.name = 'dev-etherlight';
  m.userData.on = 1.2;
  return m;
}

function etherGroup(kit, x0, y, n, pitch, firstId, kinds, color) {
  const gw = n * pitch + 0.0014, gh = 0.0128, cx = x0 + gw / 2;
  cup(kit, rectPts(cx, y, gw, gh), 0.0115, ZF - T, '#1a1b1d', '#141516');
  for (let i = 0; i < n; i++) {
    const px = x0 + 0.0007 + pitch * (i + 0.5);
    const mat = etherMat(color);
    const face = new THREE.Shape(rectPts(px, y, pitch - 0.0009, 0.0116));
    face.holes.push(new THREE.Path(rj45Pts(px, y, true)));
    kit.add(mat, null, new THREE.ShapeGeometry(face).translate(0, 0, ZF - T - 0.0006));
    kit.add(mat, null, cupGeo(rj45Pts(px, y, true), 0.008).translate(0, 0, ZF - T - 0.0006));
    kit.add('matte', '#a3a4a6', new THREE.ShapeGeometry(new THREE.Shape(rj45Pts(px, y, true))).translate(0, 0, ZF - T - 0.0085));
    kit.quad(pinMat(), null, 0.0068, 0.0028, px, y - 0.0023, ZF - T - 0.0084);
    kit.port(firstId + i, kinds(firstId + i), px, y, ZF, mat);
    kit.leds.push({ material: mat, role: 'port', color });
  }
  return rectPts(cx, y, gw, gh);
}

function bay(kit, x, y, w, h, o = {}) {
  cup(kit, rectPts(x, y, w, h), 0.006, ZF - T, '#141516', '#141516');
  kit.box('metal', o.tray || '#c3c6c9', x + 0.0012, y, ZF - T - 0.0012, w - 0.0034, h - 0.0018, 0.0016);
  kit.box('matte', '#202123', x - w / 2 + 0.0016, y, ZF - T - 0.0011, 0.0018, h - 0.0024, 0.0016);
  kit.led('#f4f7ff', 'status', (m) => kit.cyl(m, null, x + w / 2 - 0.009, y + h * 0.18, ZF - T - 0.0002, 0.0006, 0.0006, { axis: 'z', seg: 8 }), { intensity: 1.4 });
  return rectPts(x, y, w, h);
}

function udmProMax(opts = {}) {
  const kit = new Kit();
  const W = 0.4424, H = 0.0437, X = (x) => x - W / 2;
  const y0 = (U - H) / 2, Y = (y) => y0 + y;
  const holes = [];
  holes.push(bay(kit, X(0.0975), Y(0.0226), 0.106, 0.0301));
  holes.push(bay(kit, X(0.2055), Y(0.0226), 0.106, 0.0301));
  const gx = X(0.3405), rowsY = [Y(0.0302), Y(0.0163)], pitch = 0.0153;
  holes.push(rectPts(gx, Y(0.0232), 4 * pitch + 0.0024, 0.0298));
  cup(kit, rectPts(gx, Y(0.0232), 4 * pitch + 0.0024, 0.0298), 0.0115, ZF - T, '#cfd2d5', '#1a1b1c', 'metal');
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 4; i++) {
      const px = gx + (i - 1.5) * pitch, py = rowsY[r];
      const face = new THREE.Shape(rectPts(px, py, pitch - 0.0012, 0.0128));
      face.holes.push(new THREE.Path(rj45Pts(px, py, r === 0)));
      kit.add('matte', '#3d3f42', new THREE.ShapeGeometry(face).translate(0, 0, ZF - T - 0.0011));
      rj45(kit, px, py, ZF - T - 0.0011, { up: r === 0, wall: '#2a2b2d' });
      const ly = py + (r === 0 ? 0.0052 : -0.0052);
      const led = kit.led('#41e05a', 'port', (m) => { kit.box(m, null, px + 0.0049, ly, ZF - T - 0.0007, 0.0026, 0.0016, 0.0004); kit.box(m, null, px - 0.0049, ly, ZF - T - 0.0007, 0.0026, 0.0016, 0.0004); }, { intensity: 2.6 });
      kit.port(r === 0 ? 1 + i * 2 : 2 + i * 2, 'rj45', px, py, ZF, led);
    }
  }
  kit.ports.sort((a, b) => +a.id - +b.id);
  const p9x = X(0.3949), p9y = Y(0.0164);
  holes.push(rectPts(p9x, p9y, 0.0148, 0.0132));
  kit.add('matte', '#3d3f42', new THREE.ShapeGeometry(Object.assign(new THREE.Shape(rectPts(p9x, p9y, 0.0148, 0.0132)), { holes: [new THREE.Path(rj45Pts(p9x, p9y, true))] })).translate(0, 0, ZF - T - 0.0004));
  rj45(kit, p9x, p9y, ZF - T - 0.0004);
  const l9 = kit.led('#41e05a', 'port', (m) => { kit.box(m, null, p9x + 0.0049, p9y + 0.0054, ZF - T + 0.0001, 0.0026, 0.0016, 0.0004); kit.box(m, null, p9x - 0.0049, p9y + 0.0054, ZF - T + 0.0001, 0.0026, 0.0016, 0.0004); }, { intensity: 2.6 });
  kit.port(9, 'wan', p9x, p9y, ZF, l9);
  const sx = X(0.4135);
  for (const [id, sy] of [[10, Y(0.0302)], [11, Y(0.0163)]]) {
    holes.push(sfp(kit, sx, sy, ZF - T, { w: 0.0138, h: 0.0104 }));
    const l = kit.led('#41e05a', 'port', (m) => kit.box(m, null, sx + 0.0058, sy + 0.0036, ZF + 0.00005, 0.0012, 0.0012, 0.0002), { intensity: 1.6 });
    kit.port(id, 'sfp', sx, sy, ZF, l);
  }
  holes.push(circPts(0.0007, 8, X(0.4285), Y(0.0163)));
  cup(kit, circPts(0.0007, 8, X(0.4285), Y(0.0163)), 0.002, ZF - T, '#111', '#111');
  chassis(kit, { w: W, h: H, depth: 0.2856, u: 1, holes });
  vents(kit, [[0.043, 0.152], [0.1545, 0.2615], [0.2645, 0.3712], [0.3742, 0.4205]], Y(H - 0.0021), -W / 2);
  screen(kit, X(0.0245), Y(0.0245), 0.0215, 'gateway');
  const pm = frontPrint('udmpm-front', W, H, [
    { t: 'UDM', x: 0.0168, y: 0.0062, size: 0.0024, weight: 700, color: '#42474d' },
    { t: 'Pro Max', x: 0.0322, y: 0.0062, size: 0.0022, weight: 400, color: '#5d636a' },
    { t: '1', x: 0.0975, y: 0.0042, size: 0.0016 }, { t: '2', x: 0.2055, y: 0.0042, size: 0.0016 },
    ...[1, 3, 5, 7].map((n, i) => ({ t: String(n), x: 0.3405 + (i - 1.5) * 0.0153, y: 0.0405, size: 0.0014 })),
    ...[2, 4, 6, 8].map((n, i) => ({ t: String(n), x: 0.3405 + (i - 1.5) * 0.0153, y: 0.0062, size: 0.0014 })),
    { t: '9', x: 0.3949, y: 0.0062, size: 0.0014 }, { t: '10', x: 0.4135, y: 0.0405, size: 0.0014 }, { t: '11', x: 0.4135, y: 0.0062, size: 0.0014 },
    { rect: [0.012, 0.0011], x: 0.3889, y: 0.0035, color: '#a8adb2' }, { rect: [0.0135, 0.0011], x: 0.4068, y: 0.0035, color: '#a8adb2' },
    { t: 'RESET', x: 0.4318, y: 0.0163, size: 0.0012, align: 'left', color: '#5d636a' },
  ], { metal: 0.5, rough: 0.45 });
  printPlane(kit, pm, W, H, -W / 2, y0, ZF + 0.00008);
  kit.port('power', 'power', 0.17, Y(0.022), -0.2856);
  kit.ud.rackUnits = 1;
  return kit.build();
}

function uswProMax(n, opts = {}) {
  const kit = new Kit();
  const big = n === 24;
  const W = big ? 0.4424 : 0.3251, H = 0.0437, X = (x) => x - W / 2;
  const y0 = (U - H) / 2, Y = (y) => y0 + y;
  const holes = [];
  const pitch = big ? 0.01382 : 0.01431;
  const py = Y(big ? 0.0193 : 0.0172);
  const groups = big ? [0.0465, 0.1593, 0.2721] : [0.0368, 0.1538];
  const kinds = () => 'poe';
  groups.forEach((gx, gi) => holes.push(etherGroup(kit, X(gx), py, 8, pitch, 1 + gi * 8, kinds, ['#3d8bff', '#a35bff', '#21c8a8'][gi])));
  const sfpX = big ? [0.3935, 0.4095] : [0.2803, 0.2963];
  sfpX.forEach((sx, i) => {
    holes.push(sfp(kit, X(sx), py, ZF - T, { w: 0.0142, h: 0.0098 }));
    const l = kit.led('#f2f6ff', 'port', (m) => kit.box(m, null, X(sx), Y(big ? 0.0312 : 0.0296), ZF + 0.00006, 0.0022, 0.0022, 0.00025), { intensity: 1.3 });
    kit.port(n + 1 + i, 'sfp', X(sx), py, ZF, l);
  });
  const rx = X(big ? 0.4232 : 0.3112), ry = Y(0.0068);
  holes.push(circPts(0.0007, 8, rx, ry));
  cup(kit, circPts(0.0007, 8, rx, ry), 0.002, ZF - T, '#111', '#111');
  chassis(kit, { w: W, h: H, depth: big ? 0.325 : 0.16, u: 1, holes });
  const vr = big ? [[0.0465, 0.1205], [0.1235, 0.197], [0.2, 0.2735], [0.2765, 0.35], [0.353, 0.4165]] : [[0.0368, 0.1058], [0.1088, 0.1778], [0.1808, 0.2498], [0.2528, 0.3168]];
  vents(kit, vr, Y(H - 0.0021), -W / 2);
  const dx = X(big ? 0.0285 : 0.0163);
  screen(kit, dx, Y(big ? 0.0262 : 0.0224), 0.0205, 'switch');
  const items = [
    { t: 'USW', x: dx - W * 0 + W / 2 - 0.0062, y: 0.0062, size: 0.0021, weight: 700, color: '#42474d' },
    { t: 'Pro Max', x: dx + W / 2 + 0.0058, y: 0.0062, size: 0.002, weight: 400, color: '#5d636a' },
    { t: 'RESET', x: (big ? 0.4232 : 0.3112) + 0.0018, y: 0.0068, size: 0.0011, align: 'left', color: '#5d636a' },
  ];
  for (let i = 0; i < n; i++) {
    const g = Math.floor(i / 8), k = i % 8;
    items.push({ t: String(i + 1) + (i >= n - (big ? 8 : 4) ? ' ϟ⁺⁺' : ' ϟ⁺'), x: groups[g] + 0.0007 + pitch * (k + 0.5), y: 0.0088 - (big ? 0 : 0.002), size: 0.00125 });
  }
  const g3 = big ? 0.2721 : 0.1538 + pitch * 4;
  items.push({ rect: [big ? 8 * pitch : 4 * pitch, 0.0011], x: g3 + 0.0007, y: (big ? 0.0047 : 0.0038), color: '#b0b5ba' });
  items.push({ rect: [0.031, 0.0011], x: sfpX[0] - 0.0075, y: (big ? 0.0047 : 0.0038), color: '#b0b5ba' });
  sfpX.forEach((sx, i) => items.push({ t: String(n + 1 + i), x: sx, y: 0.0088 - (big ? 0 : 0.002), size: 0.0013 }));
  const pm = frontPrint('uswpm-front-' + n, W, H, items, { metal: 0.5, rough: 0.45 });
  printPlane(kit, pm, W, H, -W / 2, y0, ZF + 0.00008);
  kit.port('power', 'power', W / 2 - 0.04, Y(0.022), -(big ? 0.325 : 0.16));
  kit.ud.rackUnits = 1;
  kit.ud.etherlighting = true;
  return kit.build();
}

function unvr() {
  const kit = new Kit();
  const W = 0.4424, H = 0.0437, X = (x) => x - W / 2;
  const y0 = (U - H) / 2, Y = (y) => y0 + y;
  const holes = [];
  const bays = [[0.0128, 0.1186], [0.1208, 0.2244], [0.2266, 0.330], [0.3324, 0.4365]];
  for (const [a, b] of bays) holes.push(bay(kit, X((a + b) / 2), Y(0.0208), b - a, 0.0282));
  for (const [a, b] of [[0.0398, 0.1186], [0.1214, 0.2238], [0.2272, 0.3294], [0.333, 0.4359]]) {
    const sl = rrPts(b - a, 0.0019, 0.00095, 2, X((a + b) / 2), Y(H - 0.0026));
    holes.push(sl);
    cup(kit, sl, 0.004, ZF - T, '#1d1f21', '#0b0c0d');
  }
  const rx = X(0.4262), ry = Y(0.0034);
  holes.push(circPts(0.0007, 8, rx, ry));
  cup(kit, circPts(0.0007, 8, rx, ry), 0.002, ZF - T, '#111', '#111');
  chassis(kit, { w: W, h: H, depth: 0.325, u: 1, holes });
  kit.led('#5cc8ff', 'status', (m) => kit.box(m, null, X(0.0245), Y(H - 0.0026), ZF + 0.00008, 0.0232, 0.0017, 0.0002, { r: 0.0008, seg: 1 }), { intensity: 2.8 });
  const pm = frontPrint('unvr-front', W, H, [
    { t: 'NVR', x: 0.0205, y: 0.0034, size: 0.0019, weight: 700, color: '#42474d' },
    ...bays.map(([a, b], i) => ({ t: String(i + 1), x: (a + b) / 2, y: 0.0034, size: 0.0014 })),
    { t: 'RESET', x: 0.4282, y: 0.0034, size: 0.0011, align: 'left', color: '#5d636a' },
  ], { metal: 0.5, rough: 0.45 });
  printPlane(kit, pm, W, H, -W / 2, y0, ZF + 0.00008);
  kit.port(1, 'rj45', 0.12, Y(0.022), -0.325);
  kit.port(2, 'sfp', 0.1, Y(0.022), -0.325);
  kit.port('power', 'power', 0.17, Y(0.022), -0.325);
  kit.ud.rackUnits = 1;
  return kit.build();
}

function patchPanel24() {
  const kit = new Kit();
  const W = 0.4826, H = 0.0437, y0 = (U - H) / 2, yc = y0 + H / 2;
  const holes = [];
  const pitch = 0.0164, x0 = -pitch * 11.5, py = yc + 0.0005;
  for (let i = 0; i < 24; i++) {
    const px = x0 + i * pitch;
    holes.push(rectPts(px, py, 0.0148, 0.0198));
    kit.box('matte', '#1d1e20', px, py, ZF - 0.006, 0.0146, 0.0196, 0.012);
    const face = new THREE.Shape(rectPts(px, py, 0.0146, 0.0196));
    face.holes.push(new THREE.Path(rj45Pts(px, py - 0.0012, false)));
    kit.add('matte', '#202123', new THREE.ShapeGeometry(face).translate(0, 0, ZF - T + 0.0002));
    rj45(kit, px, py - 0.0012, ZF - T + 0.0002, { up: false, wall: '#242527', depth: 0.0075 });
    kit.box('matte', '#2c2d30', px, py + 0.0079, ZF - T + 0.0005, 0.0094, 0.0016, 0.0006);
    kit.port(i + 1, 'rj45', px, py - 0.0012, ZF);
  }
  for (const s of [-1, 1]) holes.push(rrPts(0.0095, 0.0064, 0.0031, 3, s * 0.23255, 0.00635), rrPts(0.0095, 0.0064, 0.0031, 3, s * 0.23255, 0.0381));
  kit.shape('metal', SILVER, rectPts(0, yc, W, H), T, 0, 0, ZF - T, { holes });
  kit.box('metal', COL.uniSilverDark, 0, y0 + 0.0008, -0.06, 0.43, 0.0016, 0.12);
  for (const s of [-1, 1]) kit.box('metal', SILVER, s * 0.2155, yc, -0.06, 0.0016, H - 0.004, 0.12);
  kit.cyl('chrome', '#d8dadc', 0, y0 + 0.012, -0.112, 0.0055, 0.43, { axis: 'x', seg: 10 });
  const pm = frontPrint('patch24-front', W, H, [
    ...Array.from({ length: 24 }, (_, i) => ({ t: String(i + 1), x: W / 2 + x0 + i * pitch, y: 0.0405, size: 0.0019, weight: 600, color: '#3f454b' })),
    { logo: 0.0045, x: 0.03, y: 0.022, color: '#7f868d' },
  ], { metal: 0.5, rough: 0.45 });
  printPlane(kit, pm, W, H, -W / 2, y0, ZF + 0.00008);
  kit.ud.rackUnits = 1;
  return kit.build();
}

function brushPanel() {
  const kit = new Kit();
  const W = 0.4826, H = 0.0437, y0 = (U - H) / 2, yc = y0 + H / 2;
  const holes = [rrPts(0.405, 0.023, 0.0035, 3, 0, yc)];
  for (const s of [-1, 1]) holes.push(rrPts(0.0095, 0.0064, 0.0031, 3, s * 0.23255, 0.00635), rrPts(0.0095, 0.0064, 0.0031, 3, s * 0.23255, 0.0381));
  kit.shape('metal', SILVER, rectPts(0, yc, W, H), T, 0, 0, ZF - T, { holes });
  cup(kit, rrPts(0.405, 0.023, 0.0035, 3, 0, yc), 0.012, ZF - T, '#141414', '#0a0a0a');
  const n = 54;
  for (const s of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const x = -0.2 + (i + 0.5) * (0.4 / n);
      const shade = ['#1b1b1c', '#252527', '#141415'][i % 3];
      kit.box('rubber', shade, x, yc + s * 0.0058, ZF - T - 0.0014 - (i % 2) * 0.0004, 0.4 / n + 0.0002, 0.0104, 0.0016, { rx: s * 0.18 });
    }
  }
  kit.ud.rackUnits = 1;
  return kit.build();
}

function nema(kit, x, y, z, s = 1) {
  kit.box('matte', '#121314', x, y, z, 0.0175 * s, 0.0175 * s, 0.002, { r: 0.0022, seg: 2 });
  for (const dx of [-0.0034, 0.0034]) cup(kit, rectPts(x + dx * s, y + 0.0024 * s, 0.0013 * s, 0.0058 * s), 0.003, z + 0.001, '#050505', '#000');
  cup(kit, circPts(0.0019 * s, 8, x, y - 0.0044 * s), 0.003, z + 0.001, '#050505', '#000');
}

function pduPro() {
  const kit = new Kit();
  const W = 0.4424, H = 0.0874, u = 2, X = (x) => x - W / 2;
  const y0 = (u * U - H) / 2, Y = (y) => y0 + y;
  const holes = [];
  const sx = X(0.059), sw = 0.333, sy = Y(0.0648);
  holes.push(rectPts(sx + sw / 2, sy, sw, 0.0215));
  kit.box('matte', '#141516', sx + sw / 2, sy, ZF - T - 0.001, sw, 0.0215, 0.002);
  for (let i = 0; i < 12; i++) {
    nema(kit, sx + 0.0139 + i * 0.02755, sy, ZF - T + 0.0004, 0.92);
    kit.port('o' + (i + 1), 'power', sx + 0.0139 + i * 0.02755, sy, ZF);
  }
  [0.072, 0.1555, 0.239, 0.3225].forEach((x, i) => { nema(kit, X(x + 0.04), Y(0.0275), ZF + 0.0008, 1); kit.port('o' + (13 + i), 'power', X(x + 0.04), Y(0.0275), ZF); });
  const ux = X(0.405);
  holes.push(rj45Pts(ux - 0.0105, Y(0.0275), true));
  rj45(kit, ux - 0.0105, Y(0.0275), ZF - T);
  for (const yy of [0.0228, 0.0322]) { holes.push(rrPts(0.0088, 0.0035, 0.0015, 2, ux + 0.006, Y(yy))); cup(kit, rrPts(0.0088, 0.0035, 0.0015, 2, ux + 0.006, Y(yy)), 0.006, ZF - T, '#202124', '#0b0b0c'); }
  chassis(kit, { w: W, h: H, depth: 0.106, u, holes });
  for (const [x, y] of [[0.0135, 0.07], [0.0215, 0.07], [0.0135, 0.0615], [0.0215, 0.0615]]) kit.box('matte', '#2c2f33', X(x), Y(y), ZF + 0.00006, 0.0021, 0.0042, 0.00012);
  kit.box('glass', '#08090b', X(0.0175), Y(0.0262), ZF + 0.0003, 0.0215, 0.0215, 0.0006, { r: 0.003, seg: 3 });
  kit.display(uniScreen('pdu'), 0.0185, 0.0185, X(0.0175), Y(0.0262), ZF + 0.00062, { r: 0.002 });
  kit.box('matte', '#2c2f33', X(0.428), Y(0.0745), ZF + 0.00006, 0.0018, 0.0018, 0.00012);
  const pm = frontPrint('pdu-front', W, H, [{ t: 'SmartPower PDU Pro', x: 0.0175, y: 0.0115, size: 0.0016, color: '#5d636a', weight: 600 }], { metal: 0.5, rough: 0.45 });
  printPlane(kit, pm, W, H, -W / 2, y0, ZF + 0.00008);
  kit.ud.rackUnits = 2;
  return kit.build();
}

function ups2u() {
  const kit = new Kit();
  const W = 0.4424, H = 0.0874, u = 2, X = (x) => x - W / 2;
  const y0 = (u * U - H) / 2, Y = (y) => y0 + y;
  const holes = [];
  const slots = [];
  for (let i = 0; i < 5; i++) for (const yy of [H - 0.0052, 0.0052]) slots.push(rrPts(0.0805, 0.0026, 0.0012, 3, X(0.0215 + 0.0812 * i + 0.04), Y(yy)));
  for (const sl of slots) { holes.push(sl); cup(kit, sl, 0.006, ZF - T, '#202224', '#0d0e0f'); }
  const bx = X(0.0215), by = Y(H / 2 + 0.0004);
  holes.push(circPts(0.0046, 24, bx, by));
  cup(kit, circPts(0.0046, 24, bx, by), 0.0015, ZF - T, '#9da1a5', '#9da1a5', 'metal');
  chassis(kit, { w: W, h: H, depth: 0.3, u, holes });
  kit.led('#3c7dff', 'ring', (m) => kit.add(m, null, new THREE.ShapeGeometry(Object.assign(new THREE.Shape(circPts(0.0044, 24, bx, by)), { holes: [new THREE.Path(circPts(0.0033, 24, bx, by))] })).translate(0, 0, ZF - T - 0.0006)), { intensity: 2.2 });
  kit.cyl('satin', '#e3e6e9', bx, by, ZF - T - 0.0001, 0.0032, 0.0012, { axis: 'z', seg: 20 });
  const pm = frontPrint('ups2u-front', W, H, [
    { t: '\u23FB', x: 0.0215, y: H / 2 + 0.0004, size: 0.0034, color: '#5a6067' },
    { rect: [0.0042, 0.0019], x: 0.0283, y: H / 2 + 0.0014, color: '#4a5056', r: 0.0003 },
    { t: 'UPS', x: 0.0336, y: H / 2 + 0.0004, size: 0.0016, weight: 700, color: '#4a5056', align: 'left' },
    { logo: 0.0085, x: W / 2, y: H / 2 + 0.001, color: '#a7acb1' },
  ], { metal: 0.5, rough: 0.45 });
  printPlane(kit, pm, W, H, -W / 2, y0, ZF + 0.00008);
  for (let i = 0; i < 4; i++) kit.port('o' + (i + 1), 'power', -0.15 + i * 0.03, Y(0.044), -0.3);
  kit.ud.rackUnits = 2;
  return kit.build();
}

function rackShelf() {
  const kit = new Kit();
  const W = 0.4826, D = 0.25, u = 1, t = 0.0015;
  for (const s of [-1, 1]) {
    const holes = [rrPts(0.0095, 0.0064, 0.0031, 3, s * 0.23255, 0.00635), rrPts(0.0095, 0.0064, 0.0031, 3, s * 0.23255, 0.0381)];
    kit.shape('metal', SILVER, rectPts(s * 0.2275, U / 2, 0.0275, U - 0.0008), t, 0, 0, 0, { holes });
    kit.shape('metal', SILVER, rectPts(0.11, 0.006, 0.22, 0.012), t, s * 0.2138, 0, 0, { axis: 'x' });
  }
  const holes = [];
  for (const [x, z] of [[-0.16, 0.035], [0.16, 0.035], [-0.16, 0.2], [0.16, 0.2]]) holes.push(rrPts(0.04, 0.016, 0.0079, 4, x, z));
  kit.shape('metal', SILVER, rectPts(0, D / 2, 0.428, D), t, 0, 0.0016, 0, { axis: 'y', holes });
  kit.shape('metal', SILVER, rectPts(0, 0.012, 0.428, 0.024), t, 0, 0, -D, {});
  const perf = labelMatDots();
  kit.quad(perf, null, 0.25, 0.13, 0, 0.0016 + t + 0.0002, -0.125, { rx: -Math.PI / 2 });
  kit.ud.rackUnits = 1;
  kit.ud.shelf = { origin: [0, 0.0031, -D / 2], w: 0.42, d: D - 0.01 };
  return kit.build();
}

function labelMatDots() {
  return labelMat('shelf-perf', 500, 260, (ctx) => {
    ctx.clearRect(0, 0, 500, 260);
    ctx.fillStyle = 'rgba(40,44,48,0.85)';
    for (let i = 0; i < 46; i++) for (let j = 0; j < 24; j++) { ctx.beginPath(); ctx.arc(8 + i * 10.6 + (j % 2) * 5.3, 8 + j * 10.4, 2.6, 0, Math.PI * 2); ctx.fill(); }
  }, { metal: 0.5, rough: 0.5 });
}

export const RACK = {
  'udm-pro-max': { mount: 'rack', family: 'rack', name: 'UniFi Dream Machine Pro Max', build: udmProMax },
  'usw-pro-max-16-poe': { mount: 'rack', family: 'rack', name: 'UniFi Switch Pro Max 16 PoE', build: (o) => uswProMax(16, o) },
  'usw-pro-max-24-poe': { mount: 'rack', family: 'rack', name: 'UniFi Switch Pro Max 24 PoE', build: (o) => uswProMax(24, o) },
  unvr: { mount: 'rack', family: 'rack', name: 'UniFi Network Video Recorder', build: unvr },
  'patch-panel-24': { mount: 'rack', family: 'rack', name: 'UniFi Keystone Patch Panel 24', build: patchPanel24 },
  'brush-panel': { mount: 'rack', family: 'rack', name: 'UniFi Brush Panel 1U', build: brushPanel },
  'pdu-pro': { mount: 'rack', family: 'rack', name: 'UniFi SmartPower PDU Pro', build: pduPro },
  'ups-2u': { mount: 'rack', family: 'rack', name: 'UniFi UPS 2U', build: ups2u },
  'rack-shelf': { mount: 'rack', family: 'rack', name: 'UniFi Rack Shelf 1U', build: rackShelf },
};

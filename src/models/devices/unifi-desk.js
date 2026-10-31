// Instalator device models: UniFi desktop gear (Cloud Gateway Ultra/Max, Switch Flex Mini, Lite 8 PoE) and the operator ONT.
import * as THREE from 'three';
import { Kit, rrPts, circPts } from './kit.js';
import { COL } from './mat.js';
import { rectPts, rj45Pts, cup, rj45, frontPrint, printPlane, uniScreen, uLogoMat } from './ports.js';

const WHITE = COL.uniWhite;

export const topR = (H, f, n = 3, k0 = 0) => Array.from({ length: n + 1 }, (_, i) => { const t = (i / n) * Math.PI / 2; return [k0 + f - f * Math.cos(t), H - f + f * Math.sin(t)]; });
export const botR = (y0, b, n = 2, k0 = 0) => Array.from({ length: n + 1 }, (_, i) => { const t = (i / n) * Math.PI / 2; return [k0 + b - b * Math.sin(t), y0 + b - b * Math.cos(t)]; });

function backPort(kit, x, y, z) {
  kit.add('matte', '#d4d6d8', new THREE.ShapeGeometry(new THREE.Shape(rectPts(0, 0, 0.0148, 0.0128))).rotateY(Math.PI).translate(x, y, z - 0.0001));
  kit.add('matte', '#121314', new THREE.ShapeGeometry(new THREE.Shape(rj45Pts(0, 0, true))).rotateY(Math.PI).translate(x, y, z - 0.0002));
}

function gateway(max) {
  const kit = new Kit();
  const W = 0.1418, H = 0.027, D = 0.1276;
  kit.loft('satin', WHITE, 0, 0, 0, W, D, 0.013, 5, [[0.007, 0], [0.007, 0.0008], ...botR(0.0008, 0.007, 3), ...topR(H, 0.0026, 3)]);
  kit.loft('matte', '#9c9fa2', 0, 0.0002, 0, W - 0.016, D - 0.016, 0.007, 2, [[0, 0], [0, 0.001]]);
  const dx = -W / 2 + 0.22 * W, dy = 0.0172, zf = D / 2;
  kit.box('glass', '#0a0b0d', dx, dy, zf + 0.0002, 0.0245, 0.0112, 0.0006, { r: 0.0056, seg: 6 });
  kit.display(uniScreen('pill', 256, 116), 0.0222, 0.0094, dx, dy, zf + 0.00055, { r: 0.0047, seg: 6 });
  const pm = frontPrint(max ? 'ucg-max-front' : 'ucg-ultra-front', 0.06, 0.004, [{ t: max ? 'Cloud Gateway Max' : 'Cloud Gateway Ultra', x: 0.03, y: 0.002, size: 0.0021, color: '#c4c7ca', weight: 500 }]);
  printPlane(kit, pm, 0.06, 0.004, dx - 0.03, 0.0079, zf + 0.0001);
  if (max) {
    kit.box('matte', '#c9cbcd', 0.0405, 0.0168, zf + 0.00005, 0.0282, 0.0128, 0.0002, { r: 0.0028, seg: 3 });
    kit.box('satin', '#f1f1ef', 0.0405, 0.0168, zf + 0.0002, 0.0272, 0.0118, 0.0003, { r: 0.0024, seg: 3 });
    kit.box('matte', '#2a2b2d', 0.0478, 0.0096, zf + 0.00008, 0.0032, 0.0011, 0.0002, { r: 0.0005, seg: 2 });
    for (let i = 0; i < 4; i++) kit.box('matte', '#2a2b2d', 0.006 + i * 0.0166, 0.00384, zf - 0.00088, 0.0145, 0.0022, 0.0003, { rx: 0.57, r: 0.001, seg: 2 });
  }
  const logo = uLogoMat('#c9ccd0');
  kit.quad(logo, null, 0.009, 0.009, 0, H + 0.0001, -0.03, { rx: -Math.PI / 2 });
  const zb = -D / 2;
  for (let i = 0; i < 5; i++) {
    const x = -0.026 + i * 0.0165;
    backPort(kit, x, 0.0155, zb);
    kit.port(i + 1, i === 4 ? 'wan' : 'rj45', x, 0.0155, zb);
  }
  kit.add('matte', '#202224', new THREE.ShapeGeometry(new THREE.Shape(rrPts(0.009, 0.0034, 0.0016, 3))).rotateY(Math.PI).translate(0.05, 0.0155, zb - 0.0002));
  kit.port('usb-c', 'power', 0.05, 0.0155, zb);
  kit.led('#f0f6ff', 'status', (m) => kit.box(m, null, 0, 0.0003, D / 2 - 0.012, 0.03, 0.0006, 0.001), { intensity: 0.8, silent: false });
  return kit.build();
}

function deskSwitch(o) {
  const kit = new Kit();
  const { W, H, D, r, prof, plateY, ports, frames, jack } = o;
  const [py0, py1] = plateY;
  kit.loft('satin', WHITE, 0, 0, 0, W, D, r, 4, prof, { skip: (x, y, z) => z > D / 2 - 1e-5 && y > py0 && y < py1 });
  const holes = frames.map(([x0, x1, y, h]) => rectPts((x0 + x1) / 2, y, x1 - x0, h));
  const blue = o.blueLed;
  holes.push(circPts(0.0007, 10, blue[0], blue[1]));
  kit.shape('satin', WHITE, rectPts(0, (py0 + py1) / 2, W - 2 * r, py1 - py0), 0.0012, 0, 0, D / 2 - 0.0012, { holes });
  kit.led('#3a7bff', 'status', (m) => kit.cyl(m, null, blue[0], blue[1], D / 2 - 0.0006, 0.0007, 0.001, { axis: 'z', seg: 10 }), { intensity: 2.4 });
  const zf = D / 2;
  for (const [x0, x1, y, h] of frames) cup(kit, rectPts((x0 + x1) / 2, y, x1 - x0, h), 0.0112, zf - 0.0012, '#c4c6c8', '#2a2b2c');
  ports.forEach((p, i) => {
    const face = new THREE.Shape(rectPts(p.x, p.y, jack[0], jack[1]));
    const hy = p.y - 0.0008;
    face.holes.push(new THREE.Path(rj45Pts(p.x, hy, true)));
    kit.add('metal', '#c9ccd0', new THREE.ShapeGeometry(face).translate(0, 0, zf - 0.0012 - 0.0011));
    rj45(kit, p.x, hy, zf - 0.0012 - 0.0011, { depth: 0.008, wall: '#2b2c2e', bottom: '#0c0c0d' });
    let led = null;
    if (p.amber) kit.led('#ffa21f', 'port', (m) => kit.box(m, null, p.x - jack[0] / 2 + 0.0021, p.y + jack[1] / 2 - 0.0013, zf - 0.0012 - 0.0009, 0.0026, 0.0014, 0.0004), { intensity: 1.8 });
    led = kit.led('#3fe05c', 'port', (m) => kit.box(m, null, p.x + jack[0] / 2 - 0.0021, p.y + jack[1] / 2 - 0.0013, zf - 0.0012 - 0.0009, 0.0026, 0.0014, 0.0004), { intensity: 1.8 });
    kit.port(p.id, p.kind, p.x, hy, zf, led);
  });
  const pm = frontPrint(o.key, W - 2 * r, py1 - py0, o.print.map((it) => ({ ...it, x: it.x + W / 2 - r, y: it.y - py0 })));
  printPlane(kit, pm, W - 2 * r, py1 - py0, -(W / 2 - r), py0, zf + 0.0001);
  kit.quad(uLogoMat('#cdd0d3'), null, 0.008, 0.008, 0, H + 0.0001, -D * 0.1, { rx: -Math.PI / 2 });
  kit.port('power', 'power', 0, H / 2, -D / 2);
  return kit.build();
}

function flexMini() {
  const W = 0.10716, H = 0.02117, D = 0.07015, r = 0.0075;
  const X = (x) => x - W / 2;
  const xs = [20.5, 37.3, 53.8, 70.4, 86.9].map((v) => X(v / 1000));
  const y = 0.0123;
  return deskSwitch({
    key: 'flexmini-front', W, H, D, r,
    prof: [...botR(0, 0.0022, 2), ...topR(H, 0.0018, 2)],
    plateY: [0.0022, H - 0.0018],
    frames: [[X(0.0124), X(0.029), y, 0.0134], [X(0.0294), X(0.0954), y, 0.0134]],
    jack: [0.0142, 0.0124],
    blueLed: [X(0.0086), 0.0124],
    ports: xs.map((x, i) => ({ id: i + 1, kind: i === 0 ? 'poe' : 'rj45', x, y })),
    print: [
      { rect: [0.0162, 0.0026], x: X(0.0124), y: 0.0052, color: '#a3a7ab', r: 0.0006 },
      { t: 'PoE IN', x: X(0.0198), y: 0.0039, size: 0.0019, color: '#ffffff', weight: 600 },
      ...xs.slice(1).map((x, i) => ({ t: String(i + 2), x, y: 0.0039, size: 0.0019, color: '#8d9298' })),
      { t: 'LINK', x: X(0.0975), y: 0.0165, size: 0.0011, color: '#9ba0a5', align: 'left' },
      { rect: [0.0015, 0.0011], x: X(0.0975), y: 0.0137, color: '#9aa0a6' },
      { rect: [0.0015, 0.0011], x: X(0.0975), y: 0.0119, color: '#ff9f1c' },
      { rect: [0.0015, 0.0011], x: X(0.0975), y: 0.0101, color: '#41d65a' },
    ],
  });
}

function lite8() {
  const W = 0.1637, H = 0.0317, D = 0.0996, r = 0.0085;
  const X = (x) => x - W / 2;
  const y = 0.0181, pitch = 0.0156;
  const g1 = 0.0176, g2 = 0.0838, gw = 4 * pitch + 0.0008;
  const xs = [];
  for (let i = 0; i < 4; i++) xs.push(X(g1 + 0.0004 + pitch * (i + 0.5)));
  for (let i = 0; i < 4; i++) xs.push(X(g2 + 0.0004 + pitch * (i + 0.5)));
  const lx = X(0.1508);
  return deskSwitch({
    key: 'lite8-front', W, H, D, r,
    prof: [[0.0042, 0], [0.0042, 0.0022], ...botR(0.0022, 0.0042, 3), ...topR(H, 0.0034, 3)],
    plateY: [0.0064, H - 0.0034],
    frames: [[X(g1), X(g1 + gw), y, 0.0136], [X(g2), X(g2 + gw), y, 0.0136]],
    jack: [0.0146, 0.0124],
    blueLed: [X(0.0102), 0.0181],
    ports: xs.map((x, i) => ({ id: i + 1, kind: i < 4 ? 'poe' : 'rj45', x, y, amber: i < 4 })),
    print: [
      ...xs.map((x, i) => ({ t: String(i + 1) + (i < 4 ? ' ϟ+' : ''), x, y: 0.0091, size: 0.0018, color: '#8d9298' })),
      { t: 'PoE', x: lx, y: 0.0262, size: 0.0011, color: '#9ba0a5', align: 'left' },
      { rect: [0.0016, 0.0011], x: lx, y: 0.0233, color: '#9aa0a6' }, { t: 'OFF', x: lx + 0.0022, y: 0.0238, size: 0.0009, color: '#9ba0a5', align: 'left' },
      { rect: [0.0016, 0.0011], x: lx, y: 0.0216, color: '#ff9f1c' }, { t: 'ON', x: lx + 0.0022, y: 0.0221, size: 0.0009, color: '#9ba0a5', align: 'left' },
      { t: 'LINK', x: lx, y: 0.0187, size: 0.0011, color: '#9ba0a5', align: 'left' },
      { rect: [0.0016, 0.0011], x: lx, y: 0.0158, color: '#9aa0a6' }, { t: 'DOWN', x: lx + 0.0022, y: 0.0163, size: 0.0009, color: '#9ba0a5', align: 'left' },
      { rect: [0.0016, 0.0011], x: lx, y: 0.0141, color: '#ff9f1c' }, { t: '10/100', x: lx + 0.0022, y: 0.0146, size: 0.0009, color: '#9ba0a5', align: 'left' },
      { rect: [0.0016, 0.0011], x: lx, y: 0.0124, color: '#41d65a' }, { t: '1000', x: lx + 0.0022, y: 0.0129, size: 0.0009, color: '#9ba0a5', align: 'left' },
    ],
  });
}

function ont() {
  const kit = new Kit();
  const W = 0.088, H = 0.118, D = 0.03;
  kit.loft('satin', '#f4f4f2', 0, 0, 0, W, H, 0.009, 4, [[0.0015, 0], ...botR(0, 0.0015, 1), ...topR(D, 0.0055, 3)], { axis: 'z' });
  const names = ['POWER', 'PON', 'LOS', 'LAN'];
  const cols = ['#3fe05c', '#3fe05c', '#ff3b30', '#3fe05c'];
  names.forEach((n, i) => {
    const x = -0.0255 + i * 0.017;
    if (n !== 'LOS') kit.led(cols[i], 'status', (m) => kit.cyl(m, null, x, 0.036, D + 0.0001, 0.0014, 0.0008, { axis: 'z', seg: 10 }), { intensity: 2 });
    else kit.cyl('satin', '#d9d9d7', x, 0.036, D + 0.0001, 0.0014, 0.0008, { axis: 'z', seg: 10 });
  });
  const pm = frontPrint('ont-front', 0.07, 0.03, [
    ...names.map((n, i) => ({ t: n, x: 0.0095 + i * 0.017, y: 0.0185, size: 0.0022, color: '#8d9298', weight: 600 })),
    { t: 'ONT', x: 0.035, y: 0.0035, size: 0.0042, color: '#b9bdc1', weight: 700 },
  ]);
  printPlane(kit, pm, 0.07, 0.03, -0.035, 0.0205 - 0.019 + 0.002, D + 0.0002);
  const yb = -H / 2;
  kit.box('matte', '#e4e4e1', 0, yb - 0.0005, D / 2, W - 0.02, 0.001, D - 0.012);
  kit.box('satin', '#2f9a4a', -0.024, yb - 0.006, 0.015, 0.0092, 0.012, 0.0074);
  kit.box('satin', '#2f9a4a', -0.024, yb - 0.0135, 0.015, 0.0064, 0.004, 0.0052);
  kit.tube('satin', '#f2d33a', [[-0.024, yb - 0.015, 0.015], [-0.024, yb - 0.04, 0.0125], [-0.022, yb - 0.08, 0.006], [-0.02, yb - 0.11, 0.004]], 0.0016, { rs: 6, segs: 10 });
  kit.add('matte', '#cfd1d3', new THREE.ShapeGeometry(new THREE.Shape(rectPts(0, 0, 0.0148, 0.0128))).rotateX(Math.PI / 2).translate(0.014, yb - 0.0011, 0.015));
  kit.add('matte', '#121314', new THREE.ShapeGeometry(new THREE.Shape(rj45Pts(0, 0, true))).rotateX(Math.PI / 2).translate(0.014, yb - 0.0012, 0.015));
  kit.port('LAN1', 'rj45', 0.014, yb - 0.0012, 0.015);
  kit.cyl('matte', '#1b1c1e', 0.032, yb - 0.0016, 0.015, 0.0034, 0.002, { seg: 12 });
  kit.port('DC', 'power', 0.032, yb - 0.002, 0.015);
  return kit.build();
}

export const DESK = {
  'ucg-ultra': { mount: 'surface', family: 'network', name: 'UniFi Cloud Gateway Ultra', build: () => gateway(false) },
  'ucg-max': { mount: 'surface', family: 'network', name: 'UniFi Cloud Gateway Max', build: () => gateway(true) },
  'usw-flex-mini': { mount: 'surface', family: 'network', name: 'UniFi Switch Flex Mini', build: flexMini },
  'usw-lite-8-poe': { mount: 'surface', family: 'network', name: 'UniFi Switch Lite 8 PoE', build: lite8 },
  ont: { mount: 'wall', family: 'network', name: 'Operator ONT', build: ont },
};

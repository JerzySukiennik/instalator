// Instalator device models: UniFi Protect cameras (G5 Bullet, G5 Turret Ultra, G5 Flex) and the G4 Doorbell Pro.
import * as THREE from 'three';
import { Kit } from './kit.js';
import { COL, displayMat, roundRect } from './mat.js';
import { uLogoMat } from './ports.js';
import { topR, botR } from './unifi-desk.js';

const WHITE = COL.uniWhite;

function lensStack(kit, z, r, o = {}) {
  kit.cyl('metal', '#3a3d42', 0, 0, z + 0.001, r * 1.32, 0.002, { axis: 'z', seg: 20 });
  kit.cyl('glass', '#0b0d12', 0, 0, z + 0.0024, r, 0.0028, { axis: 'z', seg: 20 });
  kit.cyl('glass', '#1d2a3f', 0, 0, z + 0.0039, r * 0.55, 0.0004, { axis: 'z', seg: 16 });
  if (o.dot !== false) kit.cyl('glass', '#24262b', 0, r * 2.4, z + 0.0006, r * 0.22, 0.0012, { axis: 'z', seg: 8 });
}

function g5Bullet() {
  const kit = new Kit();
  kit.cyl('satin', WHITE, 0, 0, 0.007, 0.031, 0.014, { axis: 'z', seg: 28 });
  kit.cyl('satin', '#eceeef', 0, 0, 0.019, 0.0245, 0.012, { axis: 'z', seg: 10 });
  kit.cyl('satin', WHITE, 0, 0, 0.032, 0.012, 0.016, { axis: 'z', seg: 16 });
  kit.sphere('satin', WHITE, 0, 0, 0.044, 0.0145, { ws: 16, hs: 10 });
  const tilt = 0.2;
  kit.push(0, 0.006, 0.05, tilt, 0, 0);
  const L = 0.0744, R = 0.03775;
  kit.lathe('satin', WHITE, 0, 0, 0, [[0, 0], [0.016, 0.0008], [0.027, 0.0045], [0.0335, 0.0105], [0.0368, 0.018], [R, 0.026], [R, L - 0.0016], [R - 0.0009, L], [R - 0.0042, L], [R - 0.0046, L - 0.0062]], { seg: 32, axis: 'z' });
  kit.lathe('glass', '#0a0b0e', 0, 0, 0, [[R - 0.0046, L - 0.0062], [0, L - 0.0058]], { seg: 32, axis: 'z' });
  kit.push(0, 0.002, L - 0.0062);
  lensStack(kit, 0, 0.0082);
  kit.ud.lens = { pos: kit.pt(0, 0, 0.004), dir: kit.dir(0, 0, 1), fov: 84.4, vfov: 45.4 };
  kit.pop();
  kit.quad(uLogoMat('#c4c7cb'), null, 0.012, 0.012, -R - 0.0002, 0, L * 0.55, { ry: -Math.PI / 2 });
  kit.led('#3d7bff', 'status', (m) => kit.cyl(m, null, 0.016, -0.02, L - 0.0058, 0.0009, 0.0006, { axis: 'z', seg: 8 }), { intensity: 1.6 });
  kit.pop();
  kit.port('uplink', 'poe', 0, 0, 0.002);
  return kit.build();
}

function g5TurretUltra() {
  const kit = new Kit();
  kit.lathe('satin', WHITE, 0, 0, 0, [[0.0334, -0.026], [0.0341, -0.0352], [0.0364, -0.0376], [0.0398, -0.0352], [0.0424, -0.0302], [0.0442, -0.0228], [0.0452, -0.0142], [0.0453, -0.0062], [0.0446, -0.001], [0.044, 0], [0.032, 0]], { seg: 40 });
  kit.quad(uLogoMat('#c4c7cb'), null, 0.011, 0.011, 0.0228, -0.016, 0.0392, { ry: 0.52 });
  kit.push(0, -0.0372, 0, 0.8, 0, 0);
  kit.sphere('satin', WHITE, 0, 0, 0, 0.0335, { ws: 28, hs: 18 });
  kit.sphere('glass', '#0b0c0f', 0, 0, 0, 0.0337, { ws: 28, hs: 6, thLen: 1.02, axis: 'z' });
  kit.push(0, 0, 0.0315);
  lensStack(kit, 0, 0.0085, { dot: false });
  kit.ud.lens = { pos: kit.pt(0, 0, 0.004), dir: kit.dir(0, 0, 1), fov: 102.4, vfov: 54.9 };
  kit.pop();
  kit.cyl('glass', '#2a2c31', 0.0135, 0.0105, 0.03, 0.0014, 0.001, { axis: 'z', seg: 8, rx: -0.4, ry: 0.4 });
  kit.cyl('glass', '#2a2c31', -0.0135, 0.0105, 0.03, 0.0014, 0.001, { axis: 'z', seg: 8, rx: -0.4, ry: -0.4 });
  kit.pop();
  kit.port('uplink', 'poe', 0, -0.002, -0.03);
  return kit.build();
}

function g5Flex() {
  const kit = new Kit();
  kit.lathe('satin', WHITE, 0, 0, 0, [[0, 0], [0.022, 0], [0.0238, 0.0018], [0.024, 0.004], [0.024, 0.0435], [0.0215, 0.0452], [0, 0.0452]], { seg: 32 });
  kit.quad(uLogoMat('#c4c7cb'), null, 0.01, 0.01, 0, 0.018, 0.0242);
  kit.cyl('satin', '#d5d7d9', 0, 0.047, 0, 0.0125, 0.004, { seg: 16 });
  kit.push(0, 0.049, 0, 0.1, 0, 0);
  const hp = [[0, 0], [0.019, 0], [0.0228, 0.0016], [0.024, 0.0045], [0.024, 0.0345]];
  for (let i = 1; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; hp.push([0.024 * Math.cos(a), 0.0345 + 0.024 * Math.sin(a)]); }
  kit.lathe('satin', WHITE, 0, 0, 0, hp, { seg: 32 });
  kit.cyl('satin', '#f2f3f4', 0, 0.0345, 0.0205, 0.0198, 0.009, { axis: 'z', seg: 32 });
  kit.lathe('glass', '#0b0c0f', 0, 0.0345, 0.0251, [[0.0186, 0], [0.0181, 0.0009], [0.012, 0.0016], [0, 0.0018]], { seg: 32, axis: 'z' });
  kit.push(0, 0.0345, 0.0262);
  lensStack(kit, 0, 0.0072, { dot: false });
  kit.ud.lens = { pos: kit.pt(0, 0, 0.004), dir: kit.dir(0, 0, 1), fov: 102.4, vfov: 54.9 };
  kit.pop();
  for (const [x, y] of [[0, 0.0155], [0, -0.0155], [0.0155, 0], [-0.0155, 0]]) kit.cyl('glass', '#24262b', x, 0.0345 + y, 0.0268, 0.0009, 0.0004, { axis: 'z', seg: 8 });
  kit.led('#3d7bff', 'status', (m) => kit.cyl(m, null, 0, 0.0098, 0.0238, 0.0007, 0.0006, { axis: 'z', seg: 8 }), { intensity: 1.6 });
  kit.pop();
  kit.port('uplink', 'poe', 0, 0.01, -0.024);
  return kit.build();
}

function doorbellScreen() {
  return displayMat('g4db-screen', 96, 144, (ctx, w, h) => {
    ctx.fillStyle = '#020306';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 2, w * 0.5, h * 0.5, w);
    g.addColorStop(0, '#0d1d44'); g.addColorStop(1, '#020306');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4c7dff';
    for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 10 + (i * 7) % 34; ctx.beginPath(); ctx.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r * 1.6, 1.6 + (i % 3), 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px Helvetica, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WELCOME', w / 2, h / 2 + 5);
  });
}

function g4DoorbellPro(opts = {}) {
  const kit = new Kit();
  const W = 0.0517, H = 0.1606, D = 0.0287;
  const white = opts.color === 'white';
  const body = white ? '#eceeef' : '#1c1d20', face = white ? '#f2f3f4' : '#0d0e10';
  kit.loft('satin', body, 0, 0, 0, W, H, 0.012, 4, [[0.0008, 0], [0, 0.0008], [0, D - 0.0045], ...topR(D, 0.0045, 3)], { axis: 'z' });
  kit.box('gloss', face, 0, 0, D + 0.0001, W - 0.008, H - 0.008, 0.0004, { r: 0.008, seg: 4 });
  kit.box('glass', '#08090b', 0, 0.057, D + 0.00035, 0.03, 0.028, 0.0004, { r: 0.012, seg: 5 });
  kit.push(0, 0.059, D + 0.0004);
  lensStack(kit, 0, 0.0052, { dot: false });
  kit.ud.lens = { pos: kit.pt(0, 0, 0.004), dir: kit.dir(0, 0, 1), fov: 138, vfov: 114 };
  kit.pop();
  for (const x of [-0.0045, 0.0045]) kit.cyl('glass', '#2e3036', x, 0.0465, D + 0.0006, 0.0013, 0.0006, { axis: 'z', seg: 8 });
  kit.led('#2f86ff', 'ring', (m) => kit.lathe(m, null, 0, 0.006, D + 0.0007, [[0.0084, 0], [0.0102, 0]], { seg: 32, axis: '-z' }), { intensity: 2.6 });
  kit.cyl('gloss', '#101114', 0, 0.006, D + 0.0007, 0.0083, 0.0012, { axis: 'z', seg: 28 });
  kit.quad(uLogoMat('#5b6068'), null, 0.007, 0.007, 0, 0.006, D + 0.00135);
  kit.box('glass', '#050608', 0, -0.03, D + 0.00045, 0.0175, 0.0255, 0.0003, { r: 0.0015, seg: 2 });
  kit.display(doorbellScreen(), 0.0155, 0.0232, 0, -0.03, D + 0.0007, { r: 0.0012, seg: 2 });
  kit.box('satin', '#2a2b2f', 0, -0.06, D + 0.00045, 0.0135, 0.0075, 0.0004, { r: 0.0025, seg: 3 });
  kit.push(0, -H / 2 + 0.003, D * 0.62, -0.7, 0, 0);
  kit.box('glass', '#090a0c', 0, 0, 0, 0.022, 0.0005, 0.011, { r: 0.002 });
  kit.ud.lens2 = { pos: kit.pt(0, -0.001, 0), dir: kit.dir(0, -1, 0.4), fov: 97.5 };
  kit.pop();
  kit.port('uplink', 'poe', 0, -0.05, 0.002);
  return kit.build();
}

export const CAM = {
  'g5-bullet': { mount: 'outdoorWall', family: 'network', name: 'UniFi G5 Bullet', build: g5Bullet },
  'g5-turret-ultra': { mount: 'ceiling', family: 'network', name: 'UniFi G5 Turret Ultra', build: g5TurretUltra, view: { flip: false, el: 4, yaw: 24 } },
  'g5-flex': { mount: 'surface', family: 'network', name: 'UniFi G5 Flex', build: g5Flex },
  'g4-doorbell-pro': { mount: 'doorbell', family: 'network', name: 'UniFi G4 Doorbell Pro', build: g4DoorbellPro },
};

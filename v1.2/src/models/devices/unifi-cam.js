// Instalator device models: UniFi Protect cameras (G5 Bullet, G5 Turret Ultra, G5 Flex) and the G4 Doorbell Pro.
import * as THREE from 'three';
import { Kit } from './kit.js';
import { COL, displayMat, roundRect, labelMat } from './mat.js';
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
  kit.cyl('satin', WHITE, 0, 0, 0.006, 0.037, 0.012, { axis: 'z', seg: 40, face: (cx, cy, cz, nx, ny, nz) => (Math.abs(nz) < 0.5 && Math.floor(((Math.atan2(cy, cx) + Math.PI) / (Math.PI * 2)) * 20) % 2 ? '#dfe1e3' : null) });
  kit.lathe('satin', WHITE, 0, 0, 0, [[0.037, 0.012], [0.0335, 0.0145], [0.026, 0.0165], [0.0215, 0.022]], { seg: 20, axis: 'z' });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; kit.box('satin', '#eceeef', Math.cos(a) * 0.0305, Math.sin(a) * 0.0305, 0.0145, 0.006, 0.0042, 0.006, { rz: a }); }
  kit.cyl('satin', WHITE, 0, 0, 0.031, 0.0118, 0.02, { axis: 'z', seg: 16 });
  kit.sphere('satin', WHITE, 0, 0, 0.044, 0.0148, { ws: 16, hs: 10 });
  kit.push(0, 0.004, 0.047, 0.18, 0, 0);
  const L = 0.0744;
  kit.lathe('satin', WHITE, 0, 0, 0, [[0, 0], [0.014, 0.0012], [0.024, 0.0052], [0.031, 0.011], [0.0362, 0.019], [0.0389, 0.029], [0.0396, 0.039], [0.039, 0.049], [0.0377, 0.058], [0.0364, 0.066], [0.0356, 0.0722], [0.0344, L], [0.0316, L], [0.0313, L - 0.0042]], { seg: 32, axis: 'z' });
  kit.lathe('glass', '#0a0b0e', 0, 0, 0, [[0.0313, L - 0.0042], [0, L - 0.0038]], { seg: 32, axis: 'z' });
  kit.push(0, 0, L - 0.0042);
  lensStack(kit, 0, 0.0088, { dot: false });
  kit.ud.lens = { pos: kit.pt(0, 0, 0.004), dir: kit.dir(0, 0, 1), fov: 84.4, vfov: 45.4 };
  kit.pop();
  kit.cyl('glass', '#24262b', -0.0128, 0.0128, L - 0.0036, 0.0011, 0.0008, { axis: 'z', seg: 8 });
  kit.cyl('glass', '#24262b', 0.0128, 0.0128, L - 0.0036, 0.0011, 0.0008, { axis: 'z', seg: 8 });
  for (const s of [-1, 1]) kit.quad(uLogoMat('#c4c7cb'), null, 0.014, 0.014, s * 0.0398, 0, 0.038, { ry: s * Math.PI / 2 });
  kit.led('#3d7bff', 'status', (m) => kit.cyl(m, null, 0, -0.0215, L - 0.0035, 0.0009, 0.0006, { axis: 'z', seg: 8 }), { intensity: 1.6 });
  kit.pop();
  kit.port('uplink', 'poe', 0, 0, 0.002);
  return kit.build();
}

function g5TurretUltra() {
  const kit = new Kit();
  kit.lathe('satin', WHITE, 0, 0, 0, [[0.0334, -0.024], [0.0338, -0.0355], [0.0352, -0.0368], [0.0381, -0.0352], [0.0412, -0.0302], [0.0432, -0.0238], [0.0446, -0.0158], [0.0451, -0.0082], [0.0448, -0.0028], [0.0441, 0], [0.032, 0]], { seg: 40 });
  kit.lathe('satin', '#e9ebed', 0, 0, 0, [[0.0336, -0.02], [0.0334, -0.024]], { seg: 40 });
  kit.quad(uLogoMat('#c4c7cb'), null, 0.011, 0.011, 0.0228, -0.016, 0.0392, { ry: 0.52 });
  kit.push(0, -0.0315, 0, 0.5, 0, 0);
  kit.sphere('satin', WHITE, 0, 0, 0, 0.0332, { ws: 28, hs: 18 });
  kit.sphere('glass', '#0b0c0f', 0, 0, 0, 0.0334, { ws: 28, hs: 6, thLen: 0.98, axis: 'z' });
  kit.push(0, 0, 0.0312);
  lensStack(kit, 0, 0.0088, { dot: false });
  kit.ud.lens = { pos: kit.pt(0, 0, 0.004), dir: kit.dir(0, 0, 1), fov: 102.4, vfov: 54.9 };
  kit.pop();
  for (const sx of [-1, 1]) kit.cyl('glass', '#2a2c31', sx * 0.0135, 0.0105, 0.0298, 0.0013, 0.001, { axis: 'z', seg: 8, rx: -0.36, ry: sx * 0.42 });
  kit.pop();
  kit.port('uplink', 'poe', 0, -0.002, -0.03);
  return kit.build();
}

function capsuleDisc(r, R, y0, off, seg = 32) {
  const g = new THREE.RingGeometry(0.0002, r, seg, 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const z = y <= 0 ? Math.sqrt(Math.max(0, R * R - x * x)) : Math.sqrt(Math.max(0, R * R - x * x - y * y));
    p.setXYZ(i, x, y0 + y, z + off);
  }
  return g;
}

function g5Flex() {
  const kit = new Kit();
  kit.lathe('satin', WHITE, 0, 0, 0, [[0, 0], [0.022, 0], [0.0238, 0.0018], [0.024, 0.004], [0.024, 0.0435], [0.0215, 0.0452], [0, 0.0452]], { seg: 32 });
  kit.quad(uLogoMat('#c4c7cb'), null, 0.01, 0.01, 0, 0.018, 0.0242);
  kit.cyl('satin', '#d5d7d9', 0, 0.047, 0, 0.0125, 0.004, { seg: 16 });
  kit.push(0, 0.049, 0, 0.08, 0, 0);
  const R = 0.024, yc = 0.0345;
  const hp = [[0, 0], [0.019, 0], [0.0228, 0.0016], [R, 0.0045], [R, yc]];
  for (let i = 1; i <= 10; i++) { const a = (i / 10) * Math.PI / 2; hp.push([R * Math.cos(a), yc + R * Math.sin(a)]); }
  kit.lathe('satin', WHITE, 0, 0, 0, hp, { seg: 36 });
  kit.add('satin', '#e4e6e8', capsuleDisc(0.0196, R, yc, 0.00012, 28));
  kit.add('glass', '#0a0b0e', capsuleDisc(0.0178, R, yc, 0.00028, 28));
  kit.push(0, yc, R - 0.0002);
  kit.cyl('metal', '#3a3d42', 0, 0, -0.0006, 0.0088, 0.0012, { axis: 'z', seg: 24 });
  kit.cyl('glass', '#0d1118', 0, 0, 0.0004, 0.0069, 0.0012, { axis: 'z', seg: 24 });
  kit.cyl('glass', '#1f2c44', 0, 0, 0.0011, 0.0034, 0.0003, { axis: 'z', seg: 16 });
  kit.ud.lens = { pos: kit.pt(0, 0, 0.002), dir: kit.dir(0, 0, 1), fov: 102.4, vfov: 54.9 };
  kit.pop();
  for (const [x, y] of [[0, 0.0138], [0.0138, 0.0004], [-0.0138, 0.0004]]) { const z = y <= 0 ? Math.sqrt(R * R - x * x) : Math.sqrt(R * R - x * x - y * y); kit.cyl('glass', '#2a2d33', x, yc + y, z + 0.0002, 0.0009, 0.0004, { axis: 'z', seg: 8 }); }
  kit.led('#3d7bff', 'status', (m) => kit.cyl(m, null, 0, 0.0098, R - 0.0001, 0.0007, 0.0006, { axis: 'z', seg: 8 }), { intensity: 1.6 });
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
  const body = white ? '#eceeef' : '#141517', face = white ? '#f2f3f4' : '#0d0e10';
  kit.loft('matte', body, 0, 0, 0, W, H, 0.012, 4, [[0.0008, 0], [0, 0.0008], [0, D - 0.0045], ...topR(D, 0.0045, 3)], { axis: 'z' });
  kit.box('gloss', face, 0, 0, D + 0.0001, W - 0.0075, H - 0.0075, 0.0004, { r: 0.0085, seg: 4 });
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
  kit.box('satin', '#26272b', 0, -0.0565, D + 0.00045, 0.0135, 0.0072, 0.0004, { r: 0.0025, seg: 3 });
  const grille = labelMat('g4db-grille', 192, 96, (ctx) => {
    ctx.clearRect(0, 0, 192, 96);
    for (const x0 of [8, 100]) {
      ctx.fillStyle = '#3c3e44'; roundRect(ctx, x0, 10, 84, 76, 14); ctx.fill();
      ctx.fillStyle = '#16171a';
      for (let i = 0; i < 6; i++) ctx.fillRect(x0 + 10, 20 + i * 11, 64, 5);
    }
  });
  kit.quad(grille, null, 0.03, 0.015, 0, -0.0705, D + 0.00048);
  kit.push(0, -H / 2 + 0.003, D * 0.62, -0.7, 0, 0);
  kit.box('glass', '#090a0c', 0, 0, 0, 0.022, 0.0005, 0.011, { r: 0.002 });
  kit.ud.lens2 = { pos: kit.pt(0, -0.001, 0), dir: kit.dir(0, -1, 0.4), fov: 97.5 };
  kit.pop();
  kit.port('uplink', 'poe', 0, -0.05, 0.002);
  return kit.build();
}

export const CAM = {
  'g5-bullet': { mount: 'outdoorWall', family: 'network', name: 'UniFi G5 Bullet', build: g5Bullet, view: { yaw: 40, el: 12 } },
  'g5-turret-ultra': { mount: 'ceiling', family: 'network', name: 'UniFi G5 Turret Ultra', build: g5TurretUltra, view: { flip: false, el: -6, yaw: 24 } },
  'g5-flex': { mount: 'surface', family: 'network', name: 'UniFi G5 Flex', build: g5Flex },
  'g4-doorbell-pro': { mount: 'doorbell', family: 'network', name: 'UniFi G4 Doorbell Pro', build: g4DoorbellPro },
};

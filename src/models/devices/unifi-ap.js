// Instalator device models: UniFi Wi-Fi 7 access points (U7 Pro, U7 Lite, U7 Pro Wall, U7 Outdoor).
import * as THREE from 'three';
import { Kit, circPts, polyPts, arc } from './kit.js';
import { COL } from './mat.js';
import { uLogoMat } from './ports.js';
import { topR, botR } from './unifi-desk.js';

const WHITE = COL.uniWhite;

function faceAt(prof, r) {
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
    if (r >= Math.min(r0, r1) && r <= Math.max(r0, r1) && r1 !== r0) return y0 + (y1 - y0) * (r - r0) / (r1 - r0);
  }
  return prof[0][1];
}

function ceilingDisc(R, H, ringR, ringW, face) {
  const kit = new Kit();
  const prof = face.map(([r, dy]) => [r * R, -H + dy * H]);
  kit.lathe('satin', WHITE, 0, 0, 0, prof, { seg: 56 });
  const ring = [];
  for (let i = 0; i <= 3; i++) { const r = ringR - ringW + (ringW * i) / 3; ring.push([r, faceAt(prof, r) - 0.0003]); }
  const rin = ringR - ringW - 0.0012, rout = ringR + 0.0012;
  kit.lathe('satin', '#d7dae0', 0, 0, 0, [[rin, faceAt(prof, rin) - 0.0001], [ringR - ringW, faceAt(prof, ringR - ringW) - 0.0002]], { seg: 56 });
  kit.led('#1530ff', 'ring', (m) => kit.lathe(m, null, 0, 0, 0, ring, { seg: 56 }), { intensity: 1.35 });
  kit.lathe('satin', '#e3e6ec', 0, 0, 0, [[ringR, faceAt(prof, ringR) - 0.0002], [rout, faceAt(prof, rout) - 0.0001]], { seg: 56 });
  const yc = faceAt(prof, 0);
  kit.lathe('satin', '#f6f6f5', 0, 0, 0, [[0, yc - 0.0004], [rin, faceAt(prof, rin) - 0.0004]], { seg: 40 });
  kit.quad(uLogoMat('#bfc2c7'), null, ringR * 0.5, ringR * 0.5, 0, yc - 0.0009, 0, { rx: Math.PI / 2 });
  kit.lathe('metal', '#c9ccd0', 0, 0, 0, [[R * 0.62, -0.002], [R * 0.62, 0], [0, 0]], { seg: 32 });
  kit.port('uplink', 'poe', 0, -0.004, -R * 0.4);
  kit.ud.coverage = { band: 'wifi7' };
  return kit.build();
}

function u7Pro() {
  const R = 0.103, H = 0.046;
  return ceilingDisc(R, H, 0.0435, 0.0068, [[0, 0], [0.25, 0.03], [0.5, 0.1], [0.7, 0.2], [0.84, 0.31], [0.93, 0.42], [0.98, 0.53], [1, 0.62], [0.99, 0.72], [0.96, 0.82], [0.9, 0.91], [0.82, 0.97], [0.74, 1], [0, 1]]);
}

function u7Lite() {
  const R = 0.08575, H = 0.031;
  return ceilingDisc(R, H, 0.0365, 0.0062, [[0, 0], [0.5, 0.004], [0.75, 0.018], [0.88, 0.06], [0.95, 0.15], [0.99, 0.3], [1, 0.46], [0.98, 0.65], [0.93, 0.82], [0.85, 0.94], [0.78, 1], [0, 1]]);
}

function wallOutline(w, h, rb, rt = 0.0012) {
  return polyPts([...arc(w / 2 - rb, -h / 2 + rb, rb, -Math.PI / 2, 0, 5), ...arc(w / 2 - rt, h / 2 - rt, rt, 0, Math.PI / 2, 1), ...arc(-w / 2 + rt, h / 2 - rt, rt, Math.PI / 2, Math.PI, 1), ...arc(-w / 2 + rb, -h / 2 + rb, rb, Math.PI, Math.PI * 1.5, 5)]);
}

function u7ProWall() {
  const kit = new Kit();
  const W = 0.103, H = 0.15;
  kit.shape('metal', '#bfc3c8', wallOutline(W, H, 0.013), 0.0105, 0, 0, 0, { bevel: 0.0012 });
  kit.shape('satin', WHITE, wallOutline(W - 0.0042, H - 0.0016, 0.0118), 0.0095, 0, 0, 0.0098, { bevel: 0.0016, bevelSeg: 2 });
  const D = 0.0193;
  kit.led('#45e3e0', 'status', (m) => kit.box(m, null, 0, H / 2 - 0.022, D + 0.00012, 0.0105, 0.0017, 0.0003, { r: 0.0008, seg: 2 }), { intensity: 2.4 });
  kit.quad(uLogoMat('#c6c9cd'), null, 0.022, 0.022, 0, -0.012, D + 0.0002);
  kit.port('uplink', 'poe', 0, -H / 2 + 0.02, 0.002);
  return kit.build();
}

function u7Outdoor() {
  const kit = new Kit();
  const W = 0.17, H = 0.208, D = 0.0545;
  kit.loft('satin', '#c9cbcd', 0, 0, 0, 0.09, 0.11, 0.012, 3, [[0, 0], [0, 0.012]], { axis: 'z' });
  kit.box('metal', '#b9bcc0', 0, 0, 0.004, 0.05, 0.16, 0.008, { r: 0.004 });
  const pil = [[0.004, 0], ...botR(0, 0.004, 2)];
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pil.push([0.014 - 0.014 * Math.cos(a), 0.0325 + 0.014 * Math.sin(a)]); }
  kit.seLoft('satin', WHITE, 0, 0, 0.008, W, H, 4.6, 52, pil, { axis: 'z' });
  kit.quad(uLogoMat('#c7cacd'), null, 0.026, 0.026, 0, 0.004, D + 0.0002);
  kit.led('#3d7bff', 'status', (m) => kit.cyl(m, null, 0, -H / 2 + 0.031, D - 0.0002, 0.0009, 0.0008, { axis: 'z', seg: 8 }), { intensity: 2.4 });
  kit.port('uplink', 'poe', 0, -H / 2 - 0.002, 0.03);
  return kit.build();
}

export const AP = {
  'u7-pro': { mount: 'ceiling', family: 'network', name: 'UniFi U7 Pro', build: u7Pro, view: { el: 30 } },
  'u7-lite': { mount: 'ceiling', family: 'network', name: 'UniFi U7 Lite', build: u7Lite, view: { el: 30 } },
  'u7-pro-wall': { mount: 'wall', family: 'network', name: 'UniFi U7 Pro Wall', build: u7ProWall },
  'u7-outdoor': { mount: 'outdoorWall', family: 'network', name: 'UniFi U7 Outdoor', build: u7Outdoor },
};

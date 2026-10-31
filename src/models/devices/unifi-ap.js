// Instalator device models: UniFi Wi-Fi 7 access points (U7 Pro, U7 Lite, U7 Pro Wall, U7 Outdoor).
import * as THREE from 'three';
import { Kit, circPts } from './kit.js';
import { COL } from './mat.js';
import { uLogoMat } from './ports.js';
import { topR, botR } from './unifi-desk.js';

const WHITE = COL.uniWhite;

function ceilingDisc(R, H, ringR, ringW, face) {
  const kit = new Kit();
  const prof = face.map(([r, dy]) => [r * R, -H + dy * H]);
  kit.lathe('satin', WHITE, 0, 0, 0, prof, { seg: 56 });
  kit.lathe('satin', '#dcdddf', 0, 0, 0, [[ringR - ringW - 0.0011, -H - 0.00008], [ringR - ringW, -H - 0.00008]], { seg: 56 });
  kit.led('#4a4dff', 'ring', (m) => kit.lathe(m, null, 0, 0, 0, [[ringR - ringW, -H - 0.00015], [ringR, -H - 0.00015]], { seg: 56 }), { intensity: 3.2 });
  kit.lathe('satin', '#eef0f3', 0, 0, 0, [[ringR, -H - 0.0001], [ringR + 0.0016, -H + 0.0001]], { seg: 56 });
  kit.quad(uLogoMat('#c2c5c9'), null, ringR * 0.42, ringR * 0.42, 0, -H - 0.0003, 0, { rx: Math.PI / 2 });
  kit.lathe('metal', '#c9ccd0', 0, 0, 0, [[R * 0.62, -0.002], [R * 0.62, 0], [0, 0]], { seg: 32 });
  kit.port('uplink', 'poe', 0, -0.004, -R * 0.4);
  kit.ud.coverage = { band: 'wifi7' };
  return kit.build();
}

function u7Pro() {
  const R = 0.103, H = 0.046;
  return ceilingDisc(R, H, 0.0415, 0.0031, [[0, 0], [0.3, 0.004], [0.58, 0.018], [0.76, 0.045], [0.88, 0.09], [0.955, 0.16], [0.992, 0.25], [1, 0.34], [0.993, 0.46], [0.968, 0.6], [0.922, 0.74], [0.86, 0.87], [0.8, 0.95], [0.74, 1], [0, 1]]);
}

function u7Lite() {
  const R = 0.08575, H = 0.033;
  return ceilingDisc(R, H, 0.0345, 0.0027, [[0, 0], [0.35, 0.006], [0.62, 0.028], [0.8, 0.07], [0.91, 0.14], [0.97, 0.24], [0.997, 0.36], [0.998, 0.48], [0.975, 0.62], [0.93, 0.76], [0.86, 0.89], [0.78, 0.97], [0.72, 1], [0, 1]]);
}

function u7ProWall() {
  const kit = new Kit();
  const W = 0.103, H = 0.15, D = 0.036;
  kit.loft('metal', '#c4c7cb', 0, 0, 0, W, H, 0.007, 3, [[0.0012, 0], [0, 0.0012], [0, 0.023]], { axis: 'z' });
  kit.loft('satin', WHITE, 0, 0, 0.0225, W + 0.0004, H + 0.0004, 0.0072, 3, [[0, 0], ...topR(D - 0.0225, 0.0028, 3)], { axis: 'z' });
  kit.led('#45e3e0', 'status', (m) => kit.box(m, null, 0, H / 2 - 0.0215, D + 0.00012, 0.0105, 0.0016, 0.0003, { r: 0.0007, seg: 2 }), { intensity: 2.2 });
  kit.quad(uLogoMat('#c6c9cd'), null, 0.02, 0.02, 0, -0.004, D + 0.0002);
  kit.port('uplink', 'poe', 0, -H / 2 + 0.02, 0.002);
  return kit.build();
}

function u7Outdoor() {
  const kit = new Kit();
  const W = 0.17, H = 0.208, D = 0.0545;
  kit.loft('satin', '#c9cbcd', 0, 0, 0, 0.09, 0.11, 0.012, 3, [[0, 0], [0, 0.012]], { axis: 'z' });
  kit.box('metal', '#b9bcc0', 0, 0, 0.004, 0.05, 0.16, 0.008, { r: 0.004 });
  const pil = [[0.004, 0], ...botR(0, 0.004, 2)];
  for (let i = 0; i <= 7; i++) { const a = (i / 7) * Math.PI / 2; pil.push([0.03 - 0.03 * Math.cos(a), 0.0165 + 0.03 * Math.sin(a)]); }
  kit.seLoft('satin', WHITE, 0, 0, 0.008, W, H, 4.2, 48, pil, { axis: 'z' });
  kit.quad(uLogoMat('#c7cacd'), null, 0.026, 0.026, 0, 0.004, D + 0.0002);
  kit.led('#3d7bff', 'status', (m) => kit.cyl(m, null, 0, -H / 2 + 0.031, D - 0.0002, 0.0009, 0.0008, { axis: 'z', seg: 8 }), { intensity: 2.4 });
  kit.led('#3d7bff', 'status', (m) => { for (let i = 0; i < 4; i++) kit.box(m, null, W / 2 + 0.0001, 0.012 + i * 0.006, 0.03, 0.0004, 0.0014, 0.0014); }, { intensity: 1.8 });
  kit.port('uplink', 'poe', 0, -H / 2 - 0.002, 0.03);
  return kit.build();
}

export const AP = {
  'u7-pro': { mount: 'ceiling', family: 'network', name: 'UniFi U7 Pro', build: u7Pro },
  'u7-lite': { mount: 'ceiling', family: 'network', name: 'UniFi U7 Lite', build: u7Lite },
  'u7-pro-wall': { mount: 'wall', family: 'network', name: 'UniFi U7 Pro Wall', build: u7ProWall },
  'u7-outdoor': { mount: 'outdoorWall', family: 'network', name: 'UniFi U7 Outdoor', build: u7Outdoor },
};

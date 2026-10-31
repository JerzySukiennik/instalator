// Instalator buildings: furniture and fixture kit (real proportions, chamfered upholstery, kitchens, bathrooms, plants, clutter, lamps, bulbs).

import { C, shade, mixc, rng, hash } from './geo.js';
import { P } from './palette.js';

const TAU = Math.PI * 2;

function legs4(g, w, d, h, r, col, inset = 0.06, seg = 6, taper = 0.75) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.cyl(sx * (w / 2 - inset), 0, sz * (d / 2 - inset), r * taper, r, h, seg, col);
}

function barHandle(g, x, y, z, len, vertical, col, depth = 0.03) {
  g.use('metal');
  if (vertical) {
    g.bx(x - 0.007, y - len / 2, z, x + 0.007, y + len / 2, z + 0.012, col);
    g.bx(x - 0.005, y - len / 2 + 0.01, z, x + 0.005, y - len / 2 + 0.02, z + depth, col);
    g.bx(x - 0.005, y + len / 2 - 0.02, z, x + 0.005, y + len / 2 - 0.01, z + depth, col);
    g.bx(x - 0.007, y - len / 2, z + depth - 0.012, x + 0.007, y + len / 2, z + depth, col);
  } else {
    g.bx(x - len / 2, y - 0.006, z + depth - 0.012, x + len / 2, y + 0.006, z + depth, col);
    g.bx(x - len / 2 + 0.01, y - 0.005, z, x - len / 2 + 0.02, y + 0.005, z + depth, col);
    g.bx(x + len / 2 - 0.02, y - 0.005, z, x + len / 2 - 0.01, y + 0.005, z + depth, col);
  }
}

function books(g, x0, x1, y, z, depth, R, o = {}) {
  const cols = o.cols || ['#7b2f2a', '#2e4a6b', '#c9b48a', '#3f5a3a', '#d8d2c4', '#8a5a3c', '#1f2a36', '#b5543c', '#e3c25a', '#6d6a63', '#4c3b5a', '#efe9dc'];
  let x = x0;
  while (x < x1 - 0.02) {
    if (R() < 0.12 && o.gaps !== false) { x += 0.04 + R() * 0.12; continue; }
    const w = 0.018 + R() * 0.03, h = (o.h || 0.22) * (0.75 + R() * 0.3), d = depth * (0.75 + R() * 0.2);
    if (x + w > x1) break;
    const col = cols[Math.floor(R() * cols.length)];
    if (R() < 0.08 && o.lean !== false) {
      g.at(x + w / 2, y, z, 0, 0, -0.18);
      g.bx(-w / 2, 0, -d / 2, w / 2, h, d / 2, col, { top: '#ece6d6' });
      g.pop();
      x += w + 0.05;
    } else {
      g.bx(x, y, z - d / 2, x + w, y + h, z + d / 2, col, { top: '#ece6d6' });
      x += w + 0.002;
    }
  }
  if (o.stack) {
    let yy = y;
    for (let i = 0; i < 3; i++) {
      const w = 0.2 + R() * 0.06, h = 0.03 + R() * 0.02;
      g.bx(o.stack - w / 2, yy, z - depth * 0.45, o.stack + w / 2, yy + h, z + depth * 0.45, cols[Math.floor(R() * cols.length)], { top: '#ece6d6' });
      yy += h;
    }
  }
}

function potAt(g, x, y, z, r, h, col) {
  g.at(x, y, z);
  g.use('satin');
  g.lathe([[0, 0], [r * 0.78, 0], [r * 0.86, h * 0.1], [r, h * 0.92], [r * 1.05, h], [r * 0.93, h], [r * 0.9, h - 0.03], [0, h - 0.03]], 12, col);
  g.use('matte');
  g.cyl(0, h - 0.04, 0, r * 0.88, r * 0.88, 0.006, 12, P.soil);
  g.pop();
}

function leafShape(g, base, dir, len, wid, col, droop = 0.25, split = false) {
  const d = Math.hypot(dir[0], dir[2]) || 1;
  const ux = dir[0] / d, uz = dir[2] / d;
  const sx = -uz, sz = ux;
  const pts = [];
  const N = 5;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const along = len * t, w = wid * Math.sin(Math.PI * Math.min(1, t * 1.05)) * (t < 0.15 ? 0.6 : 1);
    const yy = base[1] + dir[1] * len * t - droop * len * t * t;
    pts.push({ c: [base[0] + ux * along, yy, base[2] + uz * along], w });
  }
  const dark = shade(col, 0.82);
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[i + 1];
    const L = (p, s) => [p.c[0] + sx * p.w * s, p.c[1] + p.w * 0.12, p.c[2] + sz * p.w * s];
    const cut = split && i >= 1 && i <= 3;
    for (const s of [1, -1]) {
      const c0 = s > 0 ? col : dark;
      if (cut && i === 2) {
        g.tri(a.c, L(a, s * 0.5), L(b, s), c0);
        g.tri(a.c, L(b, s), b.c, c0);
      } else g.quad(a.c, L(a, s), L(b, s), b.c, c0);
    }
  }
}

export const KIT = {};

KIT.sofa = (g, o) => {
  const w = o.w ?? 2.2, d = o.d ?? 0.94, fab = C(o.color ?? P.fabricGrey), leg = o.leg ?? P.walnut;
  const seatH = 0.45, armW = o.armW ?? 0.17, armH = 0.62, backH = 0.86, backD = 0.24, base = o.legH ?? 0.14;
  const chaise = o.chaise || 0, cd = o.chaiseD ?? 1.6, cw = o.chaiseW ?? 0.92;
  g.use('satin');
  legs4(g, w, d, base, 0.022, leg, 0.07);
  if (chaise) for (const sz of [0.3, cd - d / 2 - 0.07]) g.cyl(chaise * (w / 2 - 0.07), 0, sz, 0.017, 0.022, base, 6, leg);
  g.use('matte');
  const body = shade(fab, 0.9);
  g.cb(-w / 2, base, -d / 2, w / 2, seatH - 0.13, d / 2, 0.025, body);
  const hasArmL = !(chaise === -1), hasArmR = !(chaise === 1);
  if (hasArmL) g.cb(-w / 2, base, -d / 2, -w / 2 + armW, armH, d / 2, 0.05, fab);
  if (hasArmR) g.cb(w / 2 - armW, base, -d / 2, w / 2, armH, d / 2, 0.05, fab);
  const ax0 = -w / 2 + (hasArmL ? armW : 0), ax1 = w / 2 - (hasArmR ? armW : 0);
  g.cb(ax0 - (hasArmL ? 0.02 : 0), base, -d / 2, ax1 + (hasArmR ? 0.02 : 0), backH - 0.2, -d / 2 + backD - 0.04, 0.04, fab);
  if (chaise) {
    const x0 = chaise > 0 ? w / 2 - cw : -w / 2, x1 = chaise > 0 ? w / 2 : -w / 2 + cw;
    g.cb(x0, base, d / 2 - 0.05, x1, seatH - 0.13, cd - d / 2, 0.025, body);
    g.cb(x0 + 0.01, seatH - 0.14, d / 2 - 0.2, x1 - 0.01, seatH + 0.005, cd - d / 2 - 0.01, 0.05, fab);
    const ax = chaise > 0 ? w / 2 : -w / 2;
    g.cb(Math.min(ax, ax - chaise * 0.08), base, -d / 2, Math.max(ax, ax - chaise * 0.08), seatH + 0.12, cd - d / 2, 0.03, fab);
  }
  const n = o.seats ?? (ax1 - ax0 > 1.7 ? 3 : 2), cwid = (ax1 - ax0) / n;
  for (let i = 0; i < n; i++) {
    const x0 = ax0 + i * cwid + 0.005, x1 = ax0 + (i + 1) * cwid - 0.005;
    if (chaise && ((chaise > 0 && i === n - 1) || (chaise < 0 && i === 0))) continue;
    g.cb(x0, seatH - 0.14, -d / 2 + backD - 0.06, x1, seatH + 0.005, d / 2 - 0.015, 0.05, fab);
  }
  for (let i = 0; i < n; i++) {
    const x0 = ax0 + i * cwid + 0.01, x1 = ax0 + (i + 1) * cwid - 0.01;
    g.at((x0 + x1) / 2, seatH - 0.02, -d / 2 + 0.12, 0, -0.16);
    g.cb(-(x1 - x0) / 2, 0, -0.08, (x1 - x0) / 2, backH - seatH + 0.04, 0.08, 0.07, shade(fab, 1.03));
    g.pop();
  }
  const pil = o.pillows ?? [P.mustard, P.linen];
  pil.forEach((pc, k) => {
    const left = k % 2 === 0;
    const px = left ? ax0 + 0.26 + Math.floor(k / 2) * 0.32 : ax1 - 0.26 - Math.floor(k / 2) * 0.32;
    g.at(px, seatH + 0.17, -d / 2 + 0.3, left ? 0.25 : -0.3, -0.35);
    g.cb(-0.21, -0.19, -0.055, 0.21, 0.19, 0.055, 0.05, pc);
    g.pop();
  });
  if (o.throw) {
    const tx = ax1 - 0.35;
    g.cb(tx - 0.28, seatH - 0.01, -d / 2 + 0.2, tx + 0.22, seatH + 0.03, d / 2 + 0.01, 0.015, o.throw);
    g.cb(tx - 0.28, seatH - 0.25, d / 2 - 0.005, tx + 0.22, seatH + 0.02, d / 2 + 0.03, 0.01, o.throw);
  }
  return { size: [w, backH, chaise ? cd : d], center: [0, 0, chaise ? (cd - d) / 2 : 0], outlets: [{ pos: [w / 2 + 0.25, 0.3, -d / 2], n: 2 }], surfaces: [] };
};

KIT.armchair = (g, o) => {
  const w = o.w ?? 0.82, d = o.d ?? 0.86, fab = C(o.color ?? P.fabricBeige), leg = o.leg ?? P.walnut;
  g.use('satin');
  legs4(g, w, d, 0.16, 0.02, leg, 0.06);
  g.use('matte');
  g.cb(-w / 2, 0.16, -d / 2, w / 2, 0.32, d / 2, 0.03, shade(fab, 0.92));
  g.cb(-w / 2, 0.16, -d / 2, -w / 2 + 0.13, 0.6, d / 2 - 0.02, 0.05, fab);
  g.cb(w / 2 - 0.13, 0.16, -d / 2, w / 2, 0.6, d / 2 - 0.02, 0.05, fab);
  g.at(0, 0.3, -d / 2 + 0.1, 0, -0.2);
  g.cb(-w / 2 + 0.1, 0, -0.1, w / 2 - 0.1, 0.55, 0.06, 0.06, fab);
  g.pop();
  g.cb(-w / 2 + 0.13, 0.3, -d / 2 + 0.18, w / 2 - 0.13, 0.45, d / 2 - 0.02, 0.05, shade(fab, 1.03));
  if (o.pillow) { g.at(0, 0.6, -d / 2 + 0.24, 0.1, -0.4); g.cb(-0.18, -0.15, -0.05, 0.18, 0.15, 0.05, 0.04, o.pillow); g.pop(); }
  return { size: [w, 0.86, d] };
};

KIT.pouf = (g, o) => {
  g.use('matte');
  g.cyl(0, 0, 0, o.r ?? 0.24, o.r ?? 0.24, o.h ?? 0.42, 12, o.color ?? P.wool, { top: shade(o.color ?? P.wool, 1.05) });
  return { size: [0.5, 0.42, 0.5] };
};

KIT.coffeeTable = (g, o) => {
  const w = o.w ?? 1.1, d = o.d ?? 0.6, h = o.h ?? 0.42, top = o.top ?? P.oak, leg = o.leg ?? P.black;
  if (o.round) {
    g.use('satin');
    g.cyl(0, h - 0.03, 0, w / 2, w / 2, 0.03, 20, top);
    g.use('metal');
    g.cyl(0, 0, 0, 0.18, 0.18, 0.015, 14, leg);
    g.cyl(0, 0, 0, 0.03, 0.03, h - 0.03, 8, leg);
  } else {
    g.use('satin');
    g.cb(-w / 2, h - 0.035, -d / 2, w / 2, h, d / 2, 0.006, top);
    g.cb(-w / 2 + 0.03, 0.08, -d / 2 + 0.03, w / 2 - 0.03, 0.1, d / 2 - 0.03, 0.004, shade(top, 0.92));
    legs4(g, w, d, h - 0.035, 0.022, leg, 0.05, 6, 0.85);
  }
  const R = rng(o.seed || 7);
  if (o.clutter !== false) {
    g.use('satin');
    books(g, -w / 2 + 0.12, -w / 2 + 0.12, h, 0.0, 0.25, R, { stack: -w / 2 + 0.22 });
    g.use('gloss');
    g.cyl(w / 4, h, -0.04, 0.12, 0.13, 0.05, 14, o.bowl ?? '#e8e2d6');
    g.use('matte');
    g.blob(w / 4 - 0.03, h + 0.07, -0.04, 0.045, 0.04, 0.045, '#d9a441', 3, { detail: 0 });
    g.blob(w / 4 + 0.05, h + 0.065, -0.02, 0.04, 0.035, 0.04, '#8fb04a', 4, { detail: 0 });
    g.use('matte');
    g.bx(0.05, h, 0.1, 0.2, h + 0.012, 0.16, '#2b2c2f');
  }
  return { size: [w, h, o.round ? w : d], surfaces: [{ x: 0, y: h, z: 0, w: w * 0.6, d, tag: 'stolik' }] };
};

KIT.sideTable = (g, o) => {
  const r = o.r ?? 0.22, h = o.h ?? 0.5;
  g.use('satin');
  g.cyl(0, h - 0.025, 0, r, r, 0.025, 16, o.top ?? P.oak);
  g.use('metal');
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; g.line([Math.cos(a) * r * 0.7, 0, Math.sin(a) * r * 0.7], [Math.cos(a) * r * 0.45, h - 0.025, Math.sin(a) * r * 0.45], 0.012, o.leg ?? P.black, 5); }
  return { size: [r * 2, h, r * 2], surfaces: [{ x: 0, y: h, z: 0, w: r, d: r, tag: 'stolik' }] };
};

KIT.rug = (g, o) => {
  const w = o.w ?? 2.0, d = o.d ?? 1.4, col = C(o.color ?? P.wool), bd = o.border ?? shade(col, 0.82), pat = o.pattern ?? 'border';
  g.use('matte');
  if (o.round) {
    g.cyl(0, 0, 0, w / 2, w / 2, 0.012, 28, col, { noBottom: true });
    g.cyl(0, 0.012, 0, w / 2 - 0.08, w / 2 - 0.08, 0.002, 28, bd, { noBottom: true });
    g.cyl(0, 0.014, 0, w / 2 - 0.16, w / 2 - 0.16, 0.002, 28, col, { noBottom: true });
    return { size: [w, 0.015, w], noShadow: true };
  }
  g.bx(-w / 2, 0, -d / 2, w / 2, 0.012, d / 2, col, { skip: 'b' });
  if (pat === 'border') {
    const b = 0.09;
    g.bx(-w / 2 + b, 0.012, -d / 2 + b, w / 2 - b, 0.0135, -d / 2 + b + 0.035, bd, { skip: 'b' });
    g.bx(-w / 2 + b, 0.012, d / 2 - b - 0.035, w / 2 - b, 0.0135, d / 2 - b, bd, { skip: 'b' });
    g.bx(-w / 2 + b, 0.012, -d / 2 + b, -w / 2 + b + 0.035, 0.0135, d / 2 - b, bd, { skip: 'b' });
    g.bx(w / 2 - b - 0.035, 0.012, -d / 2 + b, w / 2 - b, 0.0135, d / 2 - b, bd, { skip: 'b' });
  } else if (pat === 'stripes') {
    for (let i = 0; i < 7; i++) { const z = -d / 2 + 0.15 + i * (d - 0.3) / 6; g.bx(-w / 2 + 0.05, 0.012, z - 0.02, w / 2 - 0.05, 0.0135, z + 0.02, bd, { skip: 'b' }); }
  } else if (pat === 'berber') {
    const R = rng(o.seed || 3);
    for (let i = 0; i < 9; i++) {
      const x = -w / 2 + 0.25 + R() * (w - 0.5), z = -d / 2 + 0.25 + R() * (d - 0.5), s = 0.08 + R() * 0.08;
      g.quad([x, 0.0135, z - s], [x + s, 0.0135, z], [x, 0.0135, z + s], [x - s, 0.0135, z], bd);
    }
    for (const s of [-1, 1]) for (let k = 0; k < 14; k++) g.bx(-w / 2 + 0.05 + k * (w - 0.1) / 13 - 0.008, 0, s * (d / 2 + 0.02) - 0.02, -w / 2 + 0.05 + k * (w - 0.1) / 13 + 0.008, 0.006, s * (d / 2 + 0.02) + 0.02, '#efe8da', { skip: 'b' });
  }
  return { size: [w, 0.015, d], noShadow: true };
};

KIT.tv = (g, o) => {
  const inch = o.inch ?? 55, w = inch * 0.0221, h = inch * 0.01245, th = 0.028;
  g.use('matte');
  g.bx(-0.2, 0.15, 0, 0.2, h - 0.15, 0.03, '#1a1b1d');
  g.cb(-w / 2, 0, 0.03, w / 2, h, 0.03 + th, 0.004, '#141518');
  g.bx(-w / 2 + 0.008, 0.012, 0.03 + th, w / 2 - 0.008, h - 0.008, 0.03 + th + 0.002, '#22262d', { top: '#1b1d22' });
  g.bx(-w / 2 + 0.02, h * 0.55, 0.03 + th + 0.0021, -w / 2 + 0.2, h - 0.03, 0.03 + th + 0.0025, '#2b313a');
  return { size: [w, h, 0.07], tv: { pos: [0, h / 2, 0.0] }, strips: [{ kind: 'tv', pts: [[-w / 2 + 0.06, 0.06, 0.028], [w / 2 - 0.06, 0.06, 0.028], [w / 2 - 0.06, h - 0.06, 0.028], [-w / 2 + 0.06, h - 0.06, 0.028], [-w / 2 + 0.06, 0.06, 0.028]] }], outlets: [{ pos: [0.32, -0.18, 0.0], n: 2, y: o.y + 0.0 }], kind: 'tv' };
};
KIT.tv.wall = true;

KIT.tvStand = (g, o) => {
  const w = o.w ?? 1.8, d = o.d ?? 0.4, h = o.h ?? 0.46, col = C(o.color ?? '#f0eee9'), wood = o.wood ?? P.oak;
  g.use('satin');
  if (o.legs !== false) legs4(g, w, d, 0.12, 0.018, P.black, 0.05, 6, 0.8);
  const y0 = o.legs === false ? 0.0 : 0.12;
  g.cb(-w / 2, y0, -d / 2, w / 2, h, d / 2, 0.006, col, { top: o.topCol ?? col });
  const n = Math.max(2, Math.round(w / 0.6));
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + (i * w) / n + 0.004, x1 = -w / 2 + ((i + 1) * w) / n - 0.004;
    g.bx(x0, y0 + 0.01, d / 2, x1, h - 0.01, d / 2 + 0.006, i % 2 ? wood : shade(col, 0.98));
  }
  let tvMeta = null;
  if (o.tv) {
    const inch = o.tv, tw = inch * 0.0221, th2 = inch * 0.01245;
    g.use('matte');
    g.bx(-0.16, h, -0.12, 0.16, h + 0.012, 0.05, '#1a1b1d');
    g.bx(-0.03, h, -0.1, 0.03, h + 0.09, -0.06, '#1a1b1d');
    g.cb(-tw / 2, h + 0.07, -0.1, tw / 2, h + 0.07 + th2, -0.07, 0.004, '#141518');
    g.bx(-tw / 2 + 0.008, h + 0.08, -0.07, tw / 2 - 0.008, h + 0.062 + th2, -0.068, '#22262d');
    tvMeta = { pos: [0, h + 0.07 + th2 / 2, -0.12] };
  }
  const R = rng(o.seed || 11);
  if (o.decor !== false) {
    g.use('matte');
    books(g, w / 2 - 0.42, w / 2 - 0.12, h, 0.0, 0.22, R, { h: 0.2 });
    g.use('gloss');
    g.at(-w / 2 + 0.2, h, 0);
    g.lathe([[0, 0], [0.05, 0], [0.065, 0.08], [0.04, 0.2], [0.025, 0.24], [0, 0.24]], 10, o.vase ?? '#c56e4c');
    g.pop();
  }
  const meta = { size: [w, h, d], surfaces: [{ x: -w / 4, y: h, z: 0.02, w: w / 2 - 0.1, d, tag: 'szafka RTV' }], outlets: [{ pos: [0.3, 0.3, -d / 2], n: 3 }], kind: 'tvstand' };
  if (tvMeta) {
    meta.tv = tvMeta;
    const tw = o.tv * 0.0221, th2 = o.tv * 0.01245;
    meta.strips = [{ kind: 'tv', pts: [[-tw / 2 + 0.06, h + 0.12, -0.105], [tw / 2 - 0.06, h + 0.12, -0.105], [tw / 2 - 0.06, h + 0.04 + th2, -0.105], [-tw / 2 + 0.06, h + 0.04 + th2, -0.105], [-tw / 2 + 0.06, h + 0.12, -0.105]] }];
    meta.size = [w, h + 0.07 + th2, d];
  }
  return meta;
};

KIT.sideboard = (g, o) => {
  const w = o.w ?? 1.6, d = o.d ?? 0.45, h = o.h ?? 0.78, col = C(o.color ?? P.walnut);
  g.use('satin');
  legs4(g, w, d, 0.16, 0.016, P.black, 0.06, 6, 0.8);
  g.cb(-w / 2, 0.16, -d / 2, w / 2, h, d / 2, 0.006, col);
  const n = o.doors ?? 3;
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + (i * w) / n + 0.004, x1 = -w / 2 + ((i + 1) * w) / n - 0.004;
    g.bx(x0, 0.17, d / 2, x1, h - 0.01, d / 2 + 0.006, shade(col, 0.97 + (i % 2) * 0.05));
    g.use('metal');
    g.cyl((x0 + x1) / 2 + (i < n / 2 ? 0.15 : -0.15) * 0, h - 0.08, d / 2 + 0.006, 0.012, 0.012, 0.02, 6, '#b89b5e');
    g.use('satin');
  }
  const R = rng(o.seed || 5);
  if (o.decor !== false) {
    g.use('gloss');
    g.at(-w / 2 + 0.25, h, 0);
    g.lathe([[0, 0], [0.07, 0], [0.09, 0.12], [0.05, 0.28], [0.03, 0.32], [0, 0.32]], 10, o.vase ?? '#d9d3c7');
    g.pop();
    g.use('matte');
    books(g, 0.1, 0.45, h, 0, 0.22, R, { h: 0.24 });
    g.at(w / 2 - 0.3, h, -0.1, -0.12);
    g.bx(-0.17, 0, -0.012, 0.17, 0.42, 0.012, '#2f2a26');
    g.bx(-0.15, 0.02, 0.012, 0.15, 0.4, 0.014, o.art ?? '#c99a5b');
    g.pop();
  }
  return { size: [w, h, d], surfaces: [{ x: 0, y: h, z: 0, w: w * 0.8, d, tag: 'komoda' }], outlets: [{ pos: [w / 2 - 0.2, 0.3, -d / 2], n: 2 }] };
};

KIT.bookshelf = (g, o) => {
  const w = o.w ?? 0.8, d = o.d ?? 0.3, h = o.h ?? 2.0, col = C(o.color ?? '#f0eee9'), n = o.shelves ?? 5;
  g.use('satin');
  g.bx(-w / 2, 0, -d / 2, -w / 2 + 0.018, h, d / 2, col);
  g.bx(w / 2 - 0.018, 0, -d / 2, w / 2, h, d / 2, col);
  g.bx(-w / 2, h - 0.018, -d / 2, w / 2, h, d / 2, col);
  g.bx(-w / 2, 0, -d / 2, w / 2, 0.07, d / 2, col);
  g.bx(-w / 2 + 0.018, 0.07, -d / 2, w / 2 - 0.018, h - 0.018, -d / 2 + 0.006, shade(col, 0.92));
  const R = rng(o.seed || 13);
  for (let i = 1; i <= n; i++) {
    const y = 0.07 + (i * (h - 0.09)) / (n + 1);
    g.bx(-w / 2 + 0.018, y - 0.018, -d / 2, w / 2 - 0.018, y, d / 2, col);
    const yb = 0.07 + ((i - 1) * (h - 0.09)) / (n + 1);
    g.use('matte');
    if (R() < 0.8) books(g, -w / 2 + 0.03, w / 2 - 0.03, yb + (i === 1 ? 0 : 0), 0, d * 0.85, R, { h: Math.min(0.26, (h - 0.09) / (n + 1) - 0.06) });
    else { g.use('gloss'); g.cyl(0, yb, 0, 0.07, 0.06, 0.16, 10, '#d8d2c6'); }
    g.use('satin');
  }
  return { size: [w, h, d], surfaces: [{ x: 0, y: h, z: 0, w: w * 0.7, d, tag: 'regał' }] };
};

KIT.wallShelf = (g, o) => {
  const w = o.w ?? 1.0, d = o.d ?? 0.22, col = C(o.color ?? P.oak);
  g.use('satin');
  g.bx(-w / 2, 0, 0, w / 2, 0.025, d, col);
  const R = rng(o.seed || 21);
  g.use('matte');
  if (o.items !== false) {
    books(g, -w / 2 + 0.05, -w / 2 + 0.35, 0.025, d / 2, d * 0.8, R, { h: 0.2 });
    g.use('gloss');
    g.at(w / 2 - 0.15, 0.025, d / 2);
    g.lathe([[0, 0], [0.05, 0], [0.06, 0.1], [0, 0.1]], 10, P.potWhite);
    g.pop();
    g.use('matte2');
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9, L = 0.12 + (i % 3) * 0.06;
      leafShape(g, [w / 2 - 0.15, 0.12, d / 2], [Math.cos(a), 0.4, Math.sin(a)], L, 0.025, P.leafLight, 2.2);
    }
  }
  return { size: [w, 0.3, d], surfaces: [{ x: 0, y: 0.025, z: d / 2, w: w * 0.5, d, tag: 'półka' }], strips: [{ kind: 'shelf', pts: [[-w / 2 + 0.03, -0.005, d - 0.02], [w / 2 - 0.03, -0.005, d - 0.02]] }] };
};
KIT.wallShelf.wall = true;

KIT.diningTable = (g, o) => {
  const w = o.w ?? 1.6, d = o.d ?? 0.9, h = 0.75, top = o.top ?? P.oak, leg = o.leg ?? P.oak;
  g.use('satin');
  if (o.round) {
    g.cyl(0, h - 0.035, 0, w / 2, w / 2, 0.035, 24, top);
    g.cyl(0, 0, 0, 0.25, 0.22, 0.03, 16, leg);
    g.cyl(0, 0.03, 0, 0.06, 0.08, h - 0.065, 10, leg);
  } else {
    g.cb(-w / 2, h - 0.035, -d / 2, w / 2, h, d / 2, 0.008, top);
    g.bx(-w / 2 + 0.06, h - 0.1, -d / 2 + 0.06, w / 2 - 0.06, h - 0.035, -d / 2 + 0.08, shade(top, 0.9));
    g.bx(-w / 2 + 0.06, h - 0.1, d / 2 - 0.08, w / 2 - 0.06, h - 0.035, d / 2 - 0.06, shade(top, 0.9));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.bx(sx * (w / 2 - 0.05) - 0.025, 0, sz * (d / 2 - 0.05) - 0.025, sx * (w / 2 - 0.05) + 0.025, h - 0.035, sz * (d / 2 - 0.05) + 0.025, leg);
  }
  const chairs = o.chairs ?? (o.round ? 4 : 4);
  const style = o.chair ?? 'wood';
  const spots = [];
  if (o.round) for (let i = 0; i < chairs; i++) { const a = (i / chairs) * TAU + 0.4; spots.push([Math.sin(a) * (w / 2 + 0.12), Math.cos(a) * (w / 2 + 0.12), a + Math.PI]); }
  else {
    const per = Math.ceil(chairs / 2);
    for (let i = 0; i < per; i++) {
      const x = -w / 2 + ((i + 0.5) * w) / per;
      spots.push([x, d / 2 + 0.16, Math.PI]);
      if (spots.length < chairs) spots.push([x + 0.03, -d / 2 - 0.16, 0]);
    }
    if (o.ends) { spots.push([-w / 2 - 0.2, 0, Math.PI / 2]); spots.push([w / 2 + 0.2, 0, -Math.PI / 2]); }
  }
  spots.forEach(([x, z, r], i) => { g.at(x, 0, z, r + (hash(i, x) - 0.5) * 0.18); KIT.chair(g, { style, color: o.chairCol }); g.pop(); });
  if (o.decor !== false) {
    g.use('gloss');
    g.at(0.1, h, 0);
    g.lathe([[0, 0], [0.04, 0], [0.05, 0.08], [0.03, 0.18], [0.035, 0.2], [0, 0.2]], 10, '#cfd9d8');
    g.pop();
    g.use('matte2');
    for (let i = 0; i < 5; i++) leafShape(g, [0.1, h + 0.16, 0], [Math.cos(i * 1.3), 0.9, Math.sin(i * 1.3)], 0.16, 0.03, P.leafLight, 0.3);
    g.use('satin');
    g.cb(-0.3, h, -0.18, 0.1, h + 0.008, 0.18, 0.003, o.runner ?? '#d9cfbf');
  }
  return { size: [w + (o.round ? 0.5 : 0.3), h, d + 0.65], surfaces: [{ x: -w / 4, y: h, z: 0, w: w / 2, d, tag: 'stół' }], shadowK: 0.7, kind: 'dining' };
};

KIT.chair = (g, o = {}) => {
  const style = o.style ?? 'wood', col = C(o.color ?? (style === 'black' ? '#232427' : style === 'white' ? '#ece9e3' : P.oak));
  const sh = 0.46, sw = 0.44, sd = 0.46;
  g.use(style === 'black' ? 'metal' : 'satin');
  if (style === 'eames' || style === 'white') {
    g.use('satin');
    g.cb(-sw / 2, sh - 0.04, -sd / 2, sw / 2, sh, sd / 2, 0.04, col);
    g.at(0, sh - 0.02, -sd / 2 + 0.03, 0, -0.18);
    g.cb(-sw / 2, 0, -0.02, sw / 2, 0.36, 0.02, 0.03, col);
    g.pop();
    g.use('satin');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.line([sx * 0.13, sh - 0.04, sz * 0.13], [sx * 0.22, 0, sz * 0.22], 0.013, P.oakLight, 5);
    g.use('metal');
    g.line([-0.13, sh - 0.2, 0.13], [0.13, sh - 0.2, -0.13], 0.004, '#b9bcc0', 4);
    g.line([-0.13, sh - 0.2, -0.13], [0.13, sh - 0.2, 0.13], 0.004, '#b9bcc0', 4);
    return { size: [0.5, 0.82, 0.5] };
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const h = sz < 0 ? 0.86 : sh - 0.03;
    g.bx(sx * (sw / 2 - 0.03) - 0.016, 0, sz * (sd / 2 - 0.03) - 0.016, sx * (sw / 2 - 0.03) + 0.016, h, sz * (sd / 2 - 0.03) + 0.016, col);
  }
  g.cb(-sw / 2, sh - 0.035, -sd / 2, sw / 2, sh, sd / 2, 0.008, col);
  g.bx(-sw / 2 + 0.03, 0.6, -sd / 2 + 0.013, sw / 2 - 0.03, 0.84, -sd / 2 + 0.035, col);
  if (o.cushion || style === 'upholstered') { g.use('matte'); g.cb(-sw / 2 + 0.02, sh, -sd / 2 + 0.03, sw / 2 - 0.02, sh + 0.035, sd / 2 - 0.02, 0.015, o.cushion || P.linen); }
  return { size: [0.5, 0.86, 0.5] };
};

KIT.stool = (g, o) => {
  const h = o.h ?? 0.65, col = o.color ?? P.oak;
  g.use('satin');
  g.cyl(0, h - 0.03, 0, 0.17, 0.17, 0.03, 14, col);
  g.use('metal');
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.78; g.line([Math.cos(a) * 0.1, h - 0.03, Math.sin(a) * 0.1], [Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19], 0.011, o.leg ?? P.black, 5); }
  g.cyl(0, h * 0.35, 0, 0.15, 0.15, 0.012, 14, o.leg ?? P.black, { noTop: false });
  return { size: [0.4, h, 0.4] };
};

KIT.desk = (g, o) => {
  const w = o.w ?? 1.2, d = o.d ?? 0.6, h = 0.75, top = o.top ?? P.oakLight, leg = o.leg ?? '#f0eee9';
  g.use('satin');
  g.cb(-w / 2, h - 0.03, -d / 2, w / 2, h, d / 2, 0.005, top);
  for (const sx of [-1, 1]) g.bx(sx * (w / 2 - 0.03) - 0.02, 0, -d / 2 + 0.03, sx * (w / 2 - 0.03) + 0.02, h - 0.03, d / 2 - 0.03, leg);
  if (o.drawers) g.cb(w / 2 - 0.45, 0.04, -d / 2 + 0.02, w / 2 - 0.05, h - 0.04, d / 2 - 0.02, 0.005, leg);
  const R = rng(o.seed || 31);
  if (o.monitor !== false) {
    g.use('matte');
    g.bx(-0.11, h, -d / 2 + 0.06, 0.11, h + 0.012, -d / 2 + 0.2, '#25262a');
    g.bx(-0.025, h, -d / 2 + 0.1, 0.025, h + 0.3, -d / 2 + 0.13, '#25262a');
    g.at(0, h + 0.13, -d / 2 + 0.14, 0, -0.06);
    g.cb(-0.31, 0, 0, 0.31, 0.37, 0.025, 0.004, '#17181b');
    g.bx(-0.3, 0.01, 0.025, 0.3, 0.36, 0.027, '#2a3240');
    g.pop();
    g.bx(-0.22, h, 0.0, 0.22, h + 0.018, 0.14, '#d9d9d6');
    g.bx(0.28, h, 0.03, 0.34, h + 0.015, 0.13, '#d9d9d6');
  }
  if (o.laptop) {
    g.use('metal');
    g.bx(-0.17, h, 0.0, 0.17, h + 0.015, 0.23, '#a9adb2');
    g.at(0, h + 0.015, 0.0, 0, 0.35 - Math.PI / 2 + 1.2);
    g.bx(-0.17, 0, 0, 0.17, 0.008, 0.23, '#a9adb2');
    g.pop();
  }
  g.use('matte');
  if (o.books !== false) books(g, -w / 2 + 0.05, -w / 2 + 0.3, h, -d / 2 + 0.12, 0.2, R, { h: 0.22, gaps: false });
  g.use('gloss');
  g.cyl(w / 2 - 0.2, h, 0.05, 0.04, 0.04, 0.1, 10, o.mug ?? '#e9e4d8');
  let chair = null;
  if (o.chair !== false) {
    g.at(o.chairX ?? 0.05, 0, d / 2 + 0.25, Math.PI + 0.25);
    chair = KIT.officeChair(g, { color: o.chairCol });
    g.pop();
  }
  void chair;
  return { size: [w, h, d], surfaces: [{ x: w / 4, y: h, z: 0, w: w / 3, d, tag: 'biurko' }], strips: [{ kind: 'desk', pts: [[-w / 2 + 0.03, h - 0.035, -d / 2 + 0.02], [w / 2 - 0.03, h - 0.035, -d / 2 + 0.02]] }], outlets: [{ pos: [0.3, 0.3, -d / 2], n: 3 }] };
};

KIT.officeChair = (g, o = {}) => {
  const col = C(o.color ?? '#2d2f33');
  g.use('metal');
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; g.line([0, 0.06, 0], [Math.cos(a) * 0.3, 0.04, Math.sin(a) * 0.3], 0.014, '#3a3c40', 4); g.cyl(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3, 0.025, 0.025, 0.04, 6, '#1a1b1d'); }
  g.cyl(0, 0.06, 0, 0.025, 0.025, 0.36, 8, '#8f9297');
  g.use('matte');
  g.cb(-0.24, 0.42, -0.24, 0.24, 0.5, 0.22, 0.03, col);
  g.at(0, 0.5, -0.24, 0, -0.12);
  g.cb(-0.22, 0.02, -0.03, 0.22, 0.56, 0.03, 0.03, col);
  g.pop();
  for (const sx of [-1, 1]) g.bx(sx * 0.25 - 0.02, 0.5, -0.12, sx * 0.25 + 0.02, 0.66, 0.1, '#2a2b2e');
  return { size: [0.6, 1.1, 0.6] };
};

KIT.bed = (g, o) => {
  const w = o.w ?? 1.6, l = o.l ?? 2.0, frame = C(o.frame ?? P.oak), fab = o.head ?? null;
  const bed = C(o.duvet ?? P.linen), sheet = C(o.sheet ?? '#f2efe8'), hb = o.headH ?? 1.05, fh = 0.32;
  g.use(fab ? 'matte' : 'satin');
  if (fab) {
    g.cb(-w / 2 - 0.06, 0.06, -l / 2 - 0.06, w / 2 + 0.06, fh, l / 2 + 0.04, 0.03, fab);
    g.cb(-w / 2 - 0.1, 0.06, -l / 2 - 0.12, w / 2 + 0.1, hb, -l / 2 - 0.02, 0.05, fab);
    g.use('satin');
    legs4(g, w + 0.08, l + 0.06, 0.06, 0.02, P.black, 0.08);
  } else {
    g.cb(-w / 2 - 0.05, 0.12, -l / 2 - 0.04, w / 2 + 0.05, fh, l / 2 + 0.04, 0.01, frame);
    g.cb(-w / 2 - 0.06, 0, -l / 2 - 0.08, w / 2 + 0.06, hb, -l / 2 - 0.02, 0.012, frame);
    legs4(g, w + 0.06, l + 0.06, 0.12, 0.028, frame, 0.06, 6, 0.9);
  }
  g.use('matte');
  g.cb(-w / 2 + 0.01, fh - 0.02, -l / 2 + 0.01, w / 2 - 0.01, fh + 0.2, l / 2 - 0.01, 0.04, sheet);
  const top = fh + 0.2;
  const dz0 = -l / 2 + (o.duvetStart ?? 0.62);
  g.cb(-w / 2 - 0.04, top - 0.16, dz0, w / 2 + 0.04, top + 0.075, l / 2 + 0.04, 0.05, bed);
  g.cb(-w / 2 - 0.035, top + 0.02, dz0 - 0.03, w / 2 + 0.035, top + 0.1, dz0 + 0.22, 0.04, shade(bed, 1.04));
  const np = o.pillows ?? (w > 1.2 ? 2 : 1), pw = (w - 0.12) / np;
  for (let i = 0; i < np; i++) {
    const x = -w / 2 + 0.06 + (i + 0.5) * pw;
    g.at(x, top + 0.07, -l / 2 + 0.24, (i - 0.5) * 0.06, -0.55);
    g.cb(-pw / 2 + 0.02, -0.05, -0.17, pw / 2 - 0.02, 0.07, 0.17, 0.05, o.pillow ?? '#f4f1ea');
    g.pop();
  }
  if (o.deco) {
    g.at(-0.1, top + 0.13, -l / 2 + 0.45, 0.15, -0.5);
    g.cb(-0.2, -0.05, -0.15, 0.2, 0.05, 0.15, 0.04, o.deco);
    g.pop();
  }
  if (o.throw !== false) {
    const tc = C(o.throw ?? P.mustard);
    const tz = l / 2 - 0.45;
    g.cb(-w / 2 - 0.05, top + 0.075, tz - 0.25, w / 2 + 0.05, top + 0.1, tz + 0.25, 0.01, tc);
    for (const s of [-1, 1]) g.cb(s * (w / 2 + 0.05) - 0.012, top - 0.2, tz - 0.25, s * (w / 2 + 0.05) + 0.012, top + 0.1, tz + 0.25, 0.008, tc);
  }
  return { size: [w + 0.12, hb, l + 0.12], center: [0, 0, -0.03], strips: [{ kind: 'bed', pts: [[-w / 2 - 0.02, hb - 0.03, -l / 2 - 0.13], [w / 2 + 0.02, hb - 0.03, -l / 2 - 0.13]] }], outlets: [{ pos: [-(w / 2 + 0.38), 0.3, -l / 2 - 0.1], n: 2 }, { pos: [w / 2 + 0.38, 0.3, -l / 2 - 0.1], n: 2 }], kind: 'bed' };
};

KIT.nightstand = (g, o) => {
  const w = o.w ?? 0.45, d = o.d ?? 0.38, h = o.h ?? 0.5, col = C(o.color ?? '#efece6');
  g.use('satin');
  legs4(g, w, d, 0.12, 0.014, o.leg ?? P.oak, 0.04, 6, 0.8);
  g.cb(-w / 2, 0.12, -d / 2, w / 2, h, d / 2, 0.006, col, { top: o.top ?? col });
  g.bx(-w / 2 + 0.01, h - 0.16, d / 2, w / 2 - 0.01, h - 0.01, d / 2 + 0.006, shade(col, 0.97));
  g.use('metal');
  g.bx(-0.05, h - 0.09, d / 2 + 0.006, 0.05, h - 0.08, d / 2 + 0.02, '#b89b5e');
  const R = rng(o.seed || 41);
  g.use('matte');
  if (o.books !== false) books(g, 0.0, 0.0, h, 0.04, 0.2, R, { stack: 0.08 });
  const meta = { size: [w, h, d], surfaces: [{ x: -0.08, y: h, z: 0, w: 0.2, d, tag: 'szafka nocna' }] };
  if (o.lamp !== false) {
    const lm = KIT.tableLamp(g, { ...o, x: -0.1, base: h, small: true });
    meta.lamps = lm.lamps;
  }
  return meta;
};

KIT.tableLamp = (g, o) => {
  const x = o.x ?? 0, b = o.base ?? 0, s = o.small ? 0.85 : 1;
  const body = o.lampBody ?? '#d8cfc0', shadeC = o.shadeCol ?? '#f1ebe0';
  g.use('gloss');
  g.at(x, b, 0);
  g.lathe([[0, 0], [0.07 * s, 0], [0.085 * s, 0.05 * s], [0.08 * s, 0.14 * s], [0.03 * s, 0.22 * s], [0.012, 0.25 * s], [0, 0.25 * s]], 10, body);
  g.use('matte2');
  g.lathe([[0.15 * s, 0.24 * s], [0.11 * s, 0.42 * s]], 14, shadeC);
  g.pop();
  return { size: [0.32 * s, 0.45 * s, 0.32 * s], lamps: [{ pos: [x, b + 0.25 * s, 0], kind: 'E27', up: true, shape: 'a60', lampKind: 'lampka' }] };
};

KIT.floorLamp = (g, o) => {
  const style = o.style ?? 'arc', col = o.color ?? '#1d1e20';
  g.use('metal');
  if (style === 'arc') {
    g.cyl(0, 0, 0, 0.17, 0.17, 0.03, 16, col);
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([Math.sin(t * 1.6) * 1.0 * t * 0.9, 0.03 + Math.sin(t * Math.PI * 0.55) * 1.95, 0]); }
    g.tube(pts, 0.011, col, 6);
    const tip = pts[pts.length - 1];
    g.use('matte2');
    g.at(tip[0], tip[1], 0);
    g.lathe([[0.03, 0.02], [0.19, -0.16]], 16, col);
    g.pop();
    return { size: [0.4, 2.0, 0.4], lamps: [{ pos: [tip[0], tip[1] - 0.02, 0], kind: 'E27', up: false, shape: 'a60', lampKind: 'lampa podłogowa' }] };
  }
  if (style === 'gzowo') {
    g.cyl(0, 0, 0, 0.24, 0.24, 0.025, 20, col);
    g.line([0, 0.025, 0], [-0.2, 1.85, 0], 0.012, col, 6);
    g.use('matte2');
    g.at(-0.24, 1.82, 0, 0, 0, 0.35);
    g.lathe([[0.025, 0.06], [0.08, 0.02], [0.13, -0.1]], 14, col);
    g.pop();
    return { size: [0.5, 1.95, 0.5], lamps: [{ pos: [-0.25, 1.86, 0], kind: 'E27', up: false, shape: 'a60', lampKind: 'lampa podłogowa' }] };
  }
  g.cyl(0, 0, 0, 0.15, 0.15, 0.025, 14, col);
  g.cyl(0, 0.025, 0, 0.012, 0.012, 1.45, 6, col);
  g.use('matte2');
  g.lathe([[0.22, 1.33], [0.17, 1.62]], 16, o.shadeCol ?? '#efe8dc');
  return { size: [0.45, 1.65, 0.45], lamps: [{ pos: [0, 1.42, 0], kind: 'E27', up: true, shape: 'a60', lampKind: 'lampa podłogowa' }] };
};

KIT.wardrobe = (g, o) => {
  const w = o.w ?? 1.2, d = o.d ?? 0.6, h = o.h ?? 2.2, col = C(o.color ?? '#efece6'), n = o.doors ?? Math.max(1, Math.round(w / 0.5));
  g.use('satin');
  g.bx(-w / 2 + 0.01, 0, -d / 2, w / 2 - 0.01, 0.08, d / 2 - 0.03, shade(col, 0.8));
  g.bx(-w / 2, 0.08, -d / 2, w / 2, h, d / 2 - 0.02, col);
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + (i * w) / n + 0.002, x1 = -w / 2 + ((i + 1) * w) / n - 0.002;
    const mir = o.mirror === i || o.mirror === 'all';
    g.use(mir ? 'gloss' : 'satin');
    g.bx(x0, 0.085, d / 2 - 0.02, x1, h - 0.005, d / 2, mir ? '#b8c4cb' : shade(col, 1 + ((i % 2) - 0.5) * 0.015));
    if (o.handles !== 'none') {
      const hx = i % 2 === 0 ? x1 - 0.05 : x0 + 0.05;
      if (o.handles === 'long') barHandle(g, hx, h * 0.55, d / 2, h * 0.62, true, o.handleCol ?? '#c9ccd1', 0.02);
      else barHandle(g, hx, 1.05, d / 2, 0.22, true, o.handleCol ?? '#2b2c2f', 0.025);
    }
  }
  return { size: [w, h, d], kind: 'wardrobe' };
};

KIT.dresser = (g, o) => {
  const w = o.w ?? 0.9, d = o.d ?? 0.45, h = o.h ?? 0.85, col = C(o.color ?? '#efece6');
  g.use('satin');
  legs4(g, w, d, 0.1, 0.016, o.leg ?? P.oak, 0.05, 6, 0.8);
  g.cb(-w / 2, 0.1, -d / 2, w / 2, h, d / 2, 0.006, col, { top: o.top ?? col });
  const n = o.drawers ?? 3;
  for (let i = 0; i < n; i++) {
    const y0 = 0.11 + (i * (h - 0.12)) / n + 0.003, y1 = 0.11 + ((i + 1) * (h - 0.12)) / n - 0.003;
    g.bx(-w / 2 + 0.008, y0, d / 2, w / 2 - 0.008, y1, d / 2 + 0.006, shade(col, 0.98));
    barHandle(g, 0, (y0 + y1) / 2, d / 2 + 0.006, 0.16, false, o.handleCol ?? '#b89b5e', 0.02);
    g.use('satin');
  }
  return { size: [w, h, d], surfaces: [{ x: 0, y: h, z: 0, w: w * 0.7, d, tag: 'komoda' }], outlets: [{ pos: [w / 2 + 0.2, 0.3, -d / 2], n: 2 }] };
};

function cabinetFront(g, x0, x1, y0, y1, z, col, o = {}) {
  g.use(o.mat ?? 'satin');
  g.bx(x0 + 0.002, y0 + 0.002, z, x1 - 0.002, y1 - 0.002, z + 0.018, col);
  if (o.handle === 'bar') barHandle(g, o.hx ?? (x0 + x1) / 2, o.hy ?? y1 - 0.06, z + 0.018, Math.min(0.3, (x1 - x0) * 0.6), o.vertical ?? false, o.handleCol ?? '#2a2b2e', 0.025);
  else if (o.handle === 'groove') { g.use('matte'); g.bx(x0 + 0.002, y1 - 0.025, z + 0.012, x1 - 0.002, y1 - 0.002, z + 0.019, shade(col, 0.55)); }
  else if (o.handle === 'knob') { g.use('metal'); g.cyl((x0 + x1) / 2, (y0 + y1) / 2 + (o.hy ?? 0), z + 0.018, 0.012, 0.012, 0.02, 6, o.handleCol ?? '#b89b5e'); }
}

KIT.kitchen = (g, o) => {
  const mods = o.mods || [{ t: 'drawers', w: 0.6 }, { t: 'sink', w: 0.8 }, { t: 'dw', w: 0.6 }, { t: 'hob', w: 0.6 }, { t: 'base', w: 0.6 }];
  const len = mods.reduce((s, m) => s + m.w, 0);
  const d = o.d ?? 0.6, H = 0.9, plinth = 0.1, wt = o.worktopT ?? 0.038;
  const front = C(o.front ?? '#efede8'), carc = C(o.carcass ?? shade(front, 0.95)), wtop = C(o.worktop ?? P.oak), handle = o.handle ?? 'bar';
  const steel = o.steel;
  const upY = o.upperY ?? 1.45, upH = o.upperH ?? 0.72, upD = o.upperD ?? 0.35;
  const meta = { size: [len, H, d], surfaces: [], strips: [], outlets: [], mounts: [], kind: 'kitchen' };
  let x = -len / 2;
  g.use(steel ? 'metal' : 'satin');
  g.bx(-len / 2 + 0.01, 0, -d / 2 + 0.02, len / 2 - 0.01, plinth, d / 2 - 0.06, steel ? '#9a9da1' : shade(carc, 0.7));
  const tops = [];
  for (const m of mods) {
    const x0 = x, x1 = x + m.w, xm = (x0 + x1) / 2;
    if (m.t === 'gap') { x = x1; continue; }
    if (m.t === 'fridge' || m.t === 'tall' || m.t === 'oven' && m.tall) {
      g.use('satin');
      if (!m.free) g.bx(x0, 0, -d / 2, x1, o.tallH ?? 2.2, d / 2 - 0.02, carc);
      const th = o.tallH ?? 2.2;
      if (m.t === 'fridge' && m.free) {
        g.use(m.finish === 'steel' ? 'metal' : 'gloss');
        const fc = m.color ?? (m.finish === 'steel' ? '#c5c8cc' : '#eeede9');
        g.cb(x0 + 0.01, 0.0, -d / 2 + 0.02, x1 - 0.01, m.h ?? 1.86, d / 2 + 0.03, 0.012, fc);
        g.bx(x0 + 0.012, (m.h ?? 1.86) * 0.62, d / 2 + 0.03, x1 - 0.012, (m.h ?? 1.86) * 0.62 + 0.006, d / 2 + 0.035, shade(fc, 0.7));
        barHandle(g, x0 + 0.06, (m.h ?? 1.86) * 0.82, d / 2 + 0.03, 0.4, true, '#9fa3a8', 0.035);
        barHandle(g, x0 + 0.06, (m.h ?? 1.86) * 0.38, d / 2 + 0.03, 0.5, true, '#9fa3a8', 0.035);
      } else if (m.t === 'fridge') {
        cabinetFront(g, x0, x1, plinth, 1.2, d / 2 - 0.02, front, { handle, vertical: true, hx: x0 + 0.05, hy: 1.05 });
        cabinetFront(g, x0, x1, 1.2, th, d / 2 - 0.02, front, { handle, vertical: true, hx: x0 + 0.05, hy: 1.4 });
      } else if (m.t === 'oven') {
        cabinetFront(g, x0, x1, plinth, 0.5, d / 2 - 0.02, front, { handle });
        g.use('gloss');
        g.bx(x0 + 0.01, 0.5, d / 2 - 0.02, x1 - 0.01, 0.5 + 0.595, d / 2, '#1c1d20');
        g.bx(x0 + 0.04, 0.6, d / 2, x1 - 0.04, 0.95, d / 2 + 0.002, '#26282c');
        barHandle(g, xm, 1.03, d / 2, m.w - 0.12, false, '#b6b9bd', 0.03);
        g.use('gloss');
        g.bx(x0 + 0.01, 1.1, d / 2 - 0.02, x1 - 0.01, 1.48, d / 2, '#1c1d20');
        g.bx(x0 + 0.05, 1.16, d / 2, x1 - 0.2, 1.42, d / 2 + 0.002, '#2a2d33');
        cabinetFront(g, x0, x1, 1.5, th, d / 2 - 0.02, front, { handle, hy: 1.56 });
      } else {
        cabinetFront(g, x0, x1, plinth, 1.15, d / 2 - 0.02, front, { handle, vertical: true, hx: x1 - 0.05, hy: 1.0 });
        cabinetFront(g, x0, x1, 1.15, th, d / 2 - 0.02, front, { handle, vertical: true, hx: x1 - 0.05, hy: 1.3 });
      }
      x = x1;
      continue;
    }
    g.use(steel ? 'metal' : 'satin');
    g.bx(x0, plinth, -d / 2, x1, H - wt, d / 2 - 0.02, steel ? '#b9bcc0' : carc);
    const fz = d / 2 - 0.02;
    if (m.t === 'drawers' || (steel && m.t === 'base')) {
      const nd = m.n ?? 3;
      for (let i = 0; i < nd; i++) {
        const y0 = plinth + (i * (H - wt - plinth)) / nd, y1 = plinth + ((i + 1) * (H - wt - plinth)) / nd;
        cabinetFront(g, x0, x1, y0, y1, fz, steel ? '#c7cacd' : front, { handle: steel ? 'bar' : handle, hy: y1 - 0.05, mat: steel ? 'metal' : 'satin', handleCol: steel ? '#8e9196' : undefined });
      }
    } else if (m.t === 'dw') {
      cabinetFront(g, x0, x1, plinth, H - wt, fz, steel ? '#c7cacd' : front, { handle: steel ? 'bar' : handle, mat: steel ? 'metal' : 'satin' });
    } else if (m.t === 'ovenBase') {
      g.use('gloss');
      g.bx(x0 + 0.01, plinth + 0.04, fz, x1 - 0.01, H - wt - 0.08, fz + 0.02, '#1c1d20');
      g.bx(x0 + 0.04, plinth + 0.1, fz + 0.02, x1 - 0.04, H - wt - 0.25, fz + 0.022, '#2a2d33');
      barHandle(g, xm, H - wt - 0.13, fz + 0.02, m.w - 0.12, false, '#b6b9bd', 0.03);
      cabinetFront(g, x0, x1, H - wt - 0.08, H - wt, fz, front, { handle: 'none' });
    } else if (m.t === 'washer') {
      g.use('gloss');
      g.bx(x0 + 0.005, plinth - 0.1, fz - 0.01, x1 - 0.005, H - wt - 0.005, fz + 0.01, '#f1f0ec');
      g.use('matte');
      g.at(xm, plinth + 0.33, fz + 0.01, 0, Math.PI / 2);
      g.cyl(0, 0, 0, 0.19, 0.19, 0.03, 18, '#c9cdd1');
      g.cyl(0, 0.03, 0, 0.15, 0.15, 0.005, 18, '#3c4752');
      g.pop();
    } else {
      const nd = m.w > 0.65 ? 2 : 1;
      for (let i = 0; i < nd; i++) {
        const a = x0 + (i * m.w) / nd, b = x0 + ((i + 1) * m.w) / nd;
        cabinetFront(g, a, b, plinth, H - wt, fz, steel ? '#c7cacd' : front, { handle: steel ? 'bar' : handle, hx: nd === 2 ? (i === 0 ? b - 0.05 : a + 0.05) : b - 0.05, hy: H - wt - 0.06, vertical: handle === 'bar' && !steel, mat: steel ? 'metal' : 'satin' });
      }
    }
    tops.push([x0, x1, m]);
    x = x1;
  }
  const over = 0.025;
  g.use(steel ? 'metal' : o.worktopMat ?? 'satin');
  const segs = [];
  let cur = null;
  for (const [x0, x1] of tops) { if (cur && Math.abs(cur[1] - x0) < 1e-4) cur[1] = x1; else { cur = [x0, x1]; segs.push(cur); } }
  for (const [a, b] of segs) g.bx(a - (a <= -len / 2 + 1e-4 ? (o.endOver ?? 0) : 0), H - wt, -d / 2, b + (b >= len / 2 - 1e-4 ? (o.endOver ?? 0) : 0), H, d / 2 + over, steel ? '#cfd2d5' : wtop);
  for (const [x0, x1, m] of tops) {
    const xm = (x0 + x1) / 2;
    if (m.t === 'sink') {
      g.use('metal');
      g.bx(xm - 0.25, H - 0.004, -0.2, xm + 0.25, H + 0.002, 0.22, '#d2d5d8');
      g.bx(xm - 0.23, H - 0.18, -0.18, xm + 0.23, H - 0.002, 0.2, '#9da1a6');
      g.bx(xm - 0.23, H - 0.004, -0.18, xm + 0.23, H + 0.0025, -0.175, '#c3c6c9');
      g.cyl(xm, H + 0.002, -0.24, 0.025, 0.022, 0.05, 8, '#d9dcdf');
      g.tube([[xm, H + 0.05, -0.24], [xm, H + 0.3, -0.24], [xm, H + 0.34, -0.2], [xm, H + 0.33, -0.08], [xm, H + 0.28, -0.06]], 0.012, '#d9dcdf', 6);
      g.bx(xm + 0.04, H + 0.15, -0.255, xm + 0.1, H + 0.165, -0.235, '#d9dcdf');
      meta.mounts.push({ kind: 'floor', pos: [xm, 0.0, d / 2 + 0.25], n: [0, 1, 0], tags: ['wet', 'sink'] });
    } else if (m.t === 'hob') {
      g.use('gloss');
      g.bx(xm - 0.29, H, -0.26, xm + 0.29, H + 0.006, 0.25, '#141518');
      g.use('matte');
      for (const [hx, hz, r] of [[-0.14, -0.12, 0.09], [0.14, -0.12, 0.07], [-0.14, 0.12, 0.07], [0.14, 0.12, 0.09]]) {
        g.cyl(xm + hx, H + 0.006, hz, r, r, 0.0008, 16, '#2a2c30', { noBottom: true });
        g.cyl(xm + hx, H + 0.0068, hz, r - 0.006, r - 0.006, 0.0005, 16, '#141518', { noBottom: true });
      }
      g.bx(xm - 0.08, H + 0.006, 0.2, xm + 0.08, H + 0.0075, 0.23, '#3a3d42');
      meta.hobX = xm;
    } else if (m.t !== 'gap') {
      meta.surfaces.push({ x: xm, y: H, z: 0.0, w: Math.max(0.3, x1 - x0 - 0.1), d: d, tag: 'blat' });
    }
  }
  if (o.splash !== false) {
    const sc = C(o.splashCol ?? '#f2f0eb'), y0 = H, y1 = o.upper === false ? H + 0.6 : upY;
    g.use('gloss');
    if (o.splashTiles) {
      const tw = 0.15, th = 0.075;
      const R = rng(9);
      for (let yy = y0; yy < y1 - 0.01; yy += th) for (let xx = -len / 2 + ((Math.round((yy - y0) / th) % 2) * tw) / 2 - tw; xx < len / 2; xx += tw) {
        const a = Math.max(-len / 2, xx + 0.002), b = Math.min(len / 2, xx + tw - 0.002);
        if (b - a < 0.01) continue;
        g.bx(a, yy + 0.002, -d / 2, b, Math.min(y1, yy + th - 0.002), -d / 2 + 0.008, sc.clone().multiplyScalar(0.97 + R() * 0.06));
      }
      g.use('matte');
      g.bx(-len / 2, y0, -d / 2 - 0.002, len / 2, y1, -d / 2 + 0.004, C(o.groutCol ?? '#cfcac0'));
    } else g.bx(-len / 2, y0, -d / 2, len / 2, y1, -d / 2 + 0.01, sc);
  }
  if (o.upper !== false) {
    let ux = -len / 2;
    const ups = o.uppers || mods.map((m) => ({ w: m.w, t: m.t === 'hob' ? 'hood' : m.t === 'fridge' || m.t === 'tall' || m.t === 'oven' && m.tall ? 'none' : 'cab' }));
    for (const u of ups) {
      const x0 = ux, x1 = ux + u.w, xm = (x0 + x1) / 2;
      if (u.t === 'cab' || u.t === 'glass' || u.t === 'open') {
        g.use('satin');
        g.bx(x0, upY, -d / 2, x1, upY + upH, -d / 2 + upD - 0.02, carc);
        if (u.t === 'open') {
          g.bx(x0 + 0.018, upY + upH / 2 - 0.01, -d / 2, x1 - 0.018, upY + upH / 2 + 0.008, -d / 2 + upD - 0.02, carc);
          g.use('gloss');
          for (let k = 0; k < Math.floor(u.w / 0.12); k++) g.cyl(x0 + 0.08 + k * 0.12, upY + 0.02, -d / 2 + 0.16, 0.04, 0.035, 0.1, 10, k % 2 ? '#e9e4d8' : '#c7d3d2');
          g.use('satin');
        } else {
          const nd = u.w > 0.65 ? 2 : 1;
          for (let i = 0; i < nd; i++) {
            const a = x0 + (i * u.w) / nd, b = x0 + ((i + 1) * u.w) / nd;
            cabinetFront(g, a, b, upY, upY + upH, -d / 2 + upD - 0.02, u.t === 'glass' ? '#cdd9dc' : front, { handle: handle === 'groove' ? 'none' : handle, hx: nd === 2 ? (i === 0 ? b - 0.05 : a + 0.05) : b - 0.05, hy: upY + 0.06, vertical: handle === 'bar' });
          }
        }
        meta.strips.push({ kind: 'kitchen', pts: [[x0 + 0.03, upY - 0.008, -d / 2 + upD - 0.06], [x1 - 0.03, upY - 0.008, -d / 2 + upD - 0.06]] });
      } else if (u.t === 'hood') {
        g.use(o.hood === 'black' ? 'gloss' : 'metal');
        const hc = o.hood === 'black' ? '#1d1e21' : '#c8cbce';
        g.bx(xm - 0.3, upY + 0.12, -d / 2, xm + 0.3, upY + 0.19, -d / 2 + 0.5, hc);
        g.bx(xm - 0.13, upY + 0.19, -d / 2, xm + 0.13, (o.hoodTop ?? upY + upH + 0.35), -d / 2 + 0.26, hc);
        g.use('matte');
        g.bx(xm - 0.26, upY + 0.118, -d / 2 + 0.05, xm + 0.26, upY + 0.121, -d / 2 + 0.46, '#56595e');
      }
      ux = x1;
    }
    const merged = [];
    for (const s of meta.strips) { const l = merged[merged.length - 1]; if (l && Math.abs(l.pts[1][0] - s.pts[0][0]) < 0.07) l.pts[1] = s.pts[1]; else merged.push({ kind: 'kitchen', pts: s.pts.map((p) => p.slice()) }); }
    meta.strips = merged;
  }
  for (let k = 0; k < Math.max(1, Math.floor(len / 1.2)); k++) meta.outlets.push({ pos: [-len / 2 + 0.4 + k * 1.2, H + 0.22, -d / 2], n: 2, y: H + 0.22 });
  const R = rng(o.seed || 77);
  const cl = o.clutter ?? ['kettle', 'board', 'jar'];
  let ci = 0;
  for (const s of meta.surfaces) {
    const what = cl[ci++];
    if (!what) break;
    const cx = s.x + (R() - 0.5) * 0.1;
    if (what === 'kettle') { g.use('gloss'); g.at(cx, H, -0.12); g.lathe([[0, 0], [0.085, 0], [0.09, 0.03], [0.08, 0.2], [0.05, 0.24], [0, 0.24]], 12, o.kettle ?? '#f0eeea'); g.pop(); g.use('matte'); g.bx(cx + 0.07, H + 0.06, -0.13, cx + 0.11, H + 0.2, -0.11, '#2b2c2f'); }
    else if (what === 'toaster') { g.use('gloss'); g.cb(cx - 0.14, H, -0.2, cx + 0.14, H + 0.19, -0.04, 0.03, o.toaster ?? '#d9d4ca'); g.use('matte'); g.bx(cx - 0.09, H + 0.188, -0.17, cx - 0.01, H + 0.191, -0.07, '#2b2c2f'); g.bx(cx + 0.01, H + 0.188, -0.17, cx + 0.09, H + 0.191, -0.07, '#2b2c2f'); }
    else if (what === 'coffee') { g.use('gloss'); g.cb(cx - 0.13, H, -0.25, cx + 0.13, H + 0.36, 0.05, 0.02, '#1f2023'); g.use('metal'); g.bx(cx - 0.08, H + 0.12, 0.05, cx + 0.08, H + 0.15, 0.09, '#b9bcc0'); g.cyl(cx, H + 0.03, 0.0, 0.035, 0.03, 0.07, 8, '#f0ede6'); }
    else if (what === 'board') { g.use('satin'); g.at(cx, H, -0.24, 0, 0.0, 0.0); g.cb(-0.18, 0, -0.012, 0.18, 0.3, 0.012, 0.006, P.oakLight); g.pop(); g.use('gloss'); g.cyl(cx + 0.25, H, -0.08, 0.06, 0.055, 0.15, 10, '#d4cec2'); g.use('satin'); for (let i = 0; i < 5; i++) g.line([cx + 0.25, H + 0.12, -0.08], [cx + 0.25 + (i - 2) * 0.012, H + 0.3, -0.08 + (i % 2) * 0.01], 0.006, i % 2 ? P.oak : '#2b2c2f', 4); }
    else if (what === 'jar') { g.use('gloss'); for (let i = 0; i < 3; i++) g.cyl(cx - 0.12 + i * 0.12, H, -0.22, 0.045, 0.045, 0.14 - i * 0.02, 10, ['#d8d2c4', '#c7b79a', '#d8d2c4'][i]); }
    else if (what === 'fruit') { g.use('gloss'); g.cyl(cx, H, 0, 0.13, 0.15, 0.06, 14, '#e9e2d4'); g.use('matte'); for (let i = 0; i < 5; i++) g.blob(cx + Math.cos(i * 1.3) * 0.06, H + 0.08, Math.sin(i * 1.3) * 0.06, 0.04, 0.04, 0.04, ['#c64f2c', '#e0b33c', '#8fb04a', '#c64f2c', '#e09a2c'][i], i + 2, { detail: 0 }); }
    else if (what === 'herbs') { potAt(g, cx, H, -0.2, 0.06, 0.1, '#c47a55'); g.use('matte'); g.blob(cx, H + 0.16, -0.2, 0.08, 0.07, 0.08, P.leafLight, 6); }
    else if (what === 'dishrack') { g.use('metal'); g.bx(cx - 0.2, H, -0.15, cx + 0.2, H + 0.08, 0.1, '#c9ccd0'); g.use('gloss'); for (let i = 0; i < 4; i++) { g.at(cx - 0.12 + i * 0.07, H + 0.02, -0.03, 0, 0, 0.2); g.cyl(0, 0, 0, 0.11, 0.11, 0.012, 14, '#f3f1ec'); g.pop(); } }
    else if (what === 'boombox') { g.use('metal'); g.cb(cx - 0.27, H, -0.22, cx + 0.27, H + 0.25, -0.03, 0.01, '#b9bcc0'); g.use('matte'); for (const s2 of [-1, 1]) { g.at(cx + s2 * 0.16, H + 0.12, -0.03, 0, Math.PI / 2); g.cyl(0, 0, 0, 0.075, 0.075, 0.012, 16, '#1d1e20'); g.cyl(0, 0.012, 0, 0.03, 0.03, 0.006, 10, '#4a4c50'); g.pop(); } g.bx(cx - 0.06, H + 0.16, -0.03, cx + 0.06, H + 0.21, -0.025, '#2d3036'); g.use('metal'); g.line([cx - 0.24, H + 0.25, -0.12], [cx - 0.2, H + 0.32, -0.12], 0.008, '#c9ccd0', 4); g.line([cx + 0.24, H + 0.25, -0.12], [cx + 0.2, H + 0.32, -0.12], 0.008, '#c9ccd0', 4); g.line([cx - 0.2, H + 0.32, -0.12], [cx + 0.2, H + 0.32, -0.12], 0.008, '#c9ccd0', 4); }
    else if (what === 'redbottle') { g.use('gloss'); g.cyl(cx, H, -0.2, 0.035, 0.035, 0.2, 10, '#b3261e'); g.cyl(cx, H + 0.2, -0.2, 0.015, 0.012, 0.06, 8, '#b3261e'); }
  }
  return meta;
};

KIT.island = (g, o) => {
  const w = o.w ?? 2.0, d = o.d ?? 0.9, H = 0.9, front = C(o.front ?? '#efede8'), top = C(o.worktop ?? P.marbleW), over = o.overhang ?? 0.3;
  g.use('satin');
  g.bx(-w / 2 + 0.02, 0, -d / 2 + 0.05, w / 2 - 0.02, 0.1, d / 2 - over - 0.03, shade(front, 0.7));
  g.bx(-w / 2, 0.1, -d / 2, w / 2, H - 0.04, d / 2 - over, front);
  const n = Math.round(w / 0.6);
  for (let i = 0; i < n; i++) {
    const a = -w / 2 + (i * w) / n, b = -w / 2 + ((i + 1) * w) / n;
    cabinetFront(g, a, b, 0.1, H - 0.04, -d / 2 - 0.018, front, { handle: o.handle ?? 'groove' });
  }
  g.use(o.topMat ?? 'gloss');
  g.cb(-w / 2 - 0.02, H - 0.04, -d / 2 - 0.02, w / 2 + 0.02, H, d / 2, 0.004, top);
  if (o.waterfall) for (const s of [-1, 1]) g.bx(s * (w / 2 + 0.02) - 0.02, 0, -d / 2 - 0.02, s * (w / 2 + 0.02) + 0.02, H - 0.04, d / 2, top);
  const stools = o.stools ?? 3;
  for (let i = 0; i < stools; i++) { g.at(-w / 2 + ((i + 0.5) * w) / stools, 0, d / 2 + 0.12, Math.PI + (hash(i, 3) - 0.5) * 0.3); KIT.stool(g, { color: o.stoolCol ?? P.oak }); g.pop(); }
  if (o.decor !== false) {
    g.use('gloss');
    g.cyl(w / 4, H, -0.05, 0.16, 0.18, 0.07, 16, '#e7e2d8');
    g.use('matte');
    for (let i = 0; i < 6; i++) g.blob(w / 4 + Math.cos(i * 1.1) * 0.08, H + 0.09, -0.05 + Math.sin(i * 1.1) * 0.08, 0.045, 0.04, 0.045, ['#d4a336', '#c64f2c', '#8fb04a'][i % 3], 10 + i, { detail: 0 });
    g.use('satin');
    g.bx(-w / 4 - 0.18, H, -0.15, -w / 4 + 0.18, H + 0.015, 0.1, P.oakLight);
  }
  return { size: [w, H, d + 0.5], center: [0, 0, 0.2], surfaces: [{ x: -w / 4, y: H, z: 0, w: w / 2, d, tag: 'wyspa' }], outlets: [], kind: 'island', shadowK: 0.9 };
};

KIT.fridge = (g, o) => {
  const w = o.w ?? 0.6, d = o.d ?? 0.65, h = o.h ?? 1.86, steel = o.finish === 'steel';
  g.use(steel ? 'metal' : 'gloss');
  const col = o.color ?? (steel ? '#c4c7cb' : '#efeeea');
  g.cb(-w / 2, 0.02, -d / 2, w / 2, h, d / 2 - 0.04, 0.012, col);
  g.cb(-w / 2 + 0.002, 0.02, d / 2 - 0.04, w / 2 - 0.002, h * 0.62 - 0.004, d / 2, 0.01, col);
  g.cb(-w / 2 + 0.002, h * 0.62 + 0.004, d / 2 - 0.04, w / 2 - 0.002, h - 0.002, d / 2, 0.01, col);
  barHandle(g, -w / 2 + 0.05, h * 0.8, d / 2, 0.36, true, '#a4a8ad', 0.035);
  barHandle(g, -w / 2 + 0.05, h * 0.4, d / 2, 0.42, true, '#a4a8ad', 0.035);
  if (o.magnets !== false) {
    g.use('matte');
    const cc = ['#d9483b', '#3f7fbf', '#f2c14e', '#6fae5a'];
    for (let i = 0; i < 4; i++) g.bx(-0.1 + (i % 2) * 0.12, h * 0.7 + Math.floor(i / 2) * 0.12, d / 2, -0.03 + (i % 2) * 0.12, h * 0.7 + Math.floor(i / 2) * 0.12 + 0.09, d / 2 + 0.003, i === 1 ? '#f4f1ea' : cc[i]);
  }
  return { size: [w, h, d], surfaces: [{ x: 0, y: h, z: 0, w: w * 0.6, d: d * 0.8, tag: 'lodówka' }], outlets: [{ pos: [0, 0.3, -d / 2], n: 1 }] };
};

KIT.washer = (g, o) => {
  const w = 0.6, d = 0.56, h = o.h ?? 0.85, col = o.color ?? '#f1f0ec';
  g.use('gloss');
  g.cb(-w / 2, 0.02, -d / 2, w / 2, h, d / 2, 0.012, col);
  g.bx(-w / 2 + 0.02, h - 0.12, d / 2, w / 2 - 0.02, h - 0.02, d / 2 + 0.004, shade(col, 0.95));
  g.use('matte');
  g.bx(-w / 2 + 0.04, h - 0.1, d / 2 + 0.004, -w / 2 + 0.2, h - 0.04, d / 2 + 0.008, '#c9cdd1');
  g.at(0, h * 0.45, d / 2, 0, Math.PI / 2);
  g.cyl(0, 0, 0, 0.2, 0.2, 0.03, 20, '#cfd3d6');
  g.cyl(0, 0.03, 0, 0.155, 0.155, 0.004, 20, '#3b4652');
  g.pop();
  g.use('metal');
  g.cyl(0.12, h - 0.07, d / 2 + 0.008, 0.025, 0.025, 0.02, 10, '#b9bcc0');
  return { size: [w, h, d], surfaces: [{ x: 0, y: h, z: 0, w: 0.4, d: 0.4, tag: 'pralka' }], outlets: [{ pos: [0.2, 0.9, -d / 2], n: 1 }], mounts: [{ kind: 'floor', pos: [0, 0, d / 2 + 0.2], n: [0, 1, 0], tags: ['wet', 'washer'] }] };
};

KIT.toilet = (g, o) => {
  const wall = o.hung ?? true, col = '#f6f5f2';
  g.use('gloss');
  if (wall) {
    g.bx(-0.25, 0, -0.04, 0.25, 1.15, 0.0, o.frameCol ?? '#ece9e3');
    g.cb(-0.18, 0.28, 0.0, 0.18, 0.41, 0.16, 0.04, col);
    g.at(0, 0.4, 0.3);
    g.sc(1, 1, 1.35);
    g.lathe([[0, -0.13], [0.13, -0.13], [0.175, -0.04], [0.18, 0.0], [0.0, 0.0]], 14, col);
    g.pop();
    g.pop();
    g.cb(-0.18, 0.4, 0.04, 0.18, 0.43, 0.54, 0.03, '#fbfaf8');
    g.use('metal');
    g.bx(-0.12, 0.98, 0.0, 0.12, 1.14, 0.012, '#d5d8db');
    g.bx(-0.11, 0.99, 0.012, -0.005, 1.13, 0.016, '#c6c9cc');
    return { size: [0.4, 1.15, 0.58], mounts: [{ kind: 'floor', pos: [0.3, 0, 0.3], n: [0, 1, 0], tags: ['wet', 'wc'] }] };
  }
  g.cb(-0.19, 0.38, -0.01, 0.19, 0.8, 0.16, 0.03, col);
  g.cb(-0.2, 0.79, -0.015, 0.2, 0.82, 0.17, 0.01, col);
  g.cyl(0, 0, 0.32, 0.12, 0.15, 0.38, 12, col);
  g.at(0, 0.38, 0.36);
  g.sc(1, 1, 1.3);
  g.cyl(0, 0, 0, 0.17, 0.18, 0.03, 14, '#fbfaf8');
  g.pop();
  g.pop();
  return { size: [0.4, 0.82, 0.65], mounts: [{ kind: 'floor', pos: [0.3, 0, 0.3], n: [0, 1, 0], tags: ['wet', 'wc'] }] };
};

KIT.vanity = (g, o) => {
  const w = o.w ?? 0.8, d = o.d ?? 0.46, h = 0.85, col = C(o.color ?? P.oak), top = o.top ?? '#f6f5f2';
  g.use('satin');
  g.cb(-w / 2, 0.3, -d / 2, w / 2, h - 0.06, d / 2, 0.006, col);
  g.bx(-w / 2 + 0.01, 0.31, d / 2, w / 2 - 0.01, h - 0.07, d / 2 + 0.006, shade(col, 0.97));
  g.use('matte');
  g.bx(-w / 2 + 0.01, h - 0.2, d / 2 + 0.006, w / 2 - 0.01, h - 0.19, d / 2 + 0.009, shade(col, 0.6));
  g.use('gloss');
  g.cb(-w / 2 - 0.005, h - 0.06, -d / 2, w / 2 + 0.005, h, d / 2 + 0.01, 0.012, top);
  const nb = o.double ? 2 : 1;
  for (let i = 0; i < nb; i++) {
    const bx = nb === 1 ? 0 : (i - 0.5) * w * 0.5;
    g.bx(bx - 0.2, h - 0.002, -d / 2 + 0.08, bx + 0.2, h + 0.003, d / 2 - 0.04, '#e3e2de');
    g.use('metal');
    g.cyl(bx, h, -d / 2 + 0.05, 0.018, 0.016, 0.16, 8, '#d9dcdf');
    g.bx(bx - 0.012, h + 0.14, -d / 2 + 0.045, bx + 0.012, h + 0.155, -d / 2 + 0.15, '#d9dcdf');
    g.bx(bx - 0.01, h + 0.16, -d / 2 + 0.045, bx + 0.01, h + 0.2, -d / 2 + 0.065, '#d9dcdf');
    g.use('gloss');
  }
  g.cyl(w / 2 - 0.12, h, -d / 2 + 0.08, 0.035, 0.035, 0.1, 8, '#f2f0ea');
  g.use('matte');
  g.cyl(w / 2 - 0.12, h + 0.1, -d / 2 + 0.08, 0.008, 0.008, 0.08, 4, '#5aa0d0');
  g.cyl(w / 2 - 0.1, h + 0.1, -d / 2 + 0.085, 0.008, 0.008, 0.07, 4, '#e46a5b');
  g.use('gloss');
  g.cyl(-w / 2 + 0.1, h, -d / 2 + 0.08, 0.03, 0.03, 0.15, 8, '#c9d7d6');
  return { size: [w, h, d], surfaces: [{ x: w / 2 - 0.15, y: h, z: 0, w: 0.2, d: d * 0.6, tag: 'umywalka' }], outlets: [{ pos: [w / 2 + 0.15, 1.15, -d / 2], n: 1 }], mounts: [{ kind: 'floor', pos: [0, 0, d / 2 + 0.15], n: [0, 1, 0], tags: ['wet', 'sink'] }] };
};

KIT.mirror = (g, o) => {
  const w = o.w ?? 0.7, h = o.h ?? 0.9, fr = o.frame;
  g.use('gloss');
  if (o.round) {
    g.at(0, h / 2, 0, 0, Math.PI / 2);
    if (fr) g.cyl(0, 0, 0, w / 2 + 0.02, w / 2 + 0.02, 0.022, 28, fr);
    g.cyl(0, 0.004, 0, w / 2, w / 2, 0.02, 28, '#b9c6cc');
    g.pop();
  } else {
    if (fr) g.cb(-w / 2 - 0.025, -0.025, 0, w / 2 + 0.025, h + 0.025, 0.022, 0.004, fr);
    g.bx(-w / 2, 0, 0.002, w / 2, h, 0.024, '#b4c2c9', { front: '#c3cfd5' });
    g.bx(-w / 2 + w * 0.1, h * 0.55, 0.024, -w / 2 + w * 0.16, h * 0.95, 0.0245, '#d7e1e5');
  }
  return { size: [w, h, 0.03], noData: !!o.noData };
};
KIT.mirror.wall = true;

KIT.mirrorCabinet = (g, o) => {
  const w = o.w ?? 0.6, h = o.h ?? 0.7;
  g.use('satin');
  g.cb(-w / 2, 0, 0, w / 2, h, 0.13, 0.006, '#f0eee9');
  g.use('gloss');
  g.bx(-w / 2 + 0.005, 0.005, 0.13, w / 2 - 0.005, h - 0.005, 0.135, '#b8c5cb', { front: '#c3cfd5' });
  g.bx(-w / 2 + 0.06, h * 0.55, 0.135, -w / 2 + 0.1, h * 0.95, 0.1355, '#d7e1e5');
  g.use('matte');
  g.bx(-w / 2 + 0.02, -0.03, 0.08, w / 2 - 0.02, 0.0, 0.13, '#f4f2ec');
  return { size: [w, h, 0.14], strips: [] };
};
KIT.mirrorCabinet.wall = true;

KIT.bathtub = (g, o) => {
  const w = o.w ?? 1.7, d = o.d ?? 0.75, h = 0.56, col = '#f6f5f2', panel = o.panel ?? '#f1f0ec';
  g.use('gloss');
  g.cb(-w / 2, 0, -d / 2, w / 2, h - 0.04, d / 2, 0.01, panel);
  g.bx(-w / 2, h - 0.04, -d / 2, w / 2, h, -d / 2 + 0.07, col);
  g.bx(-w / 2, h - 0.04, d / 2 - 0.07, w / 2, h, d / 2, col);
  g.bx(-w / 2, h - 0.04, -d / 2 + 0.07, -w / 2 + 0.1, h, d / 2 - 0.07, col);
  g.bx(w / 2 - 0.1, h - 0.04, -d / 2 + 0.07, w / 2, h, d / 2 - 0.07, col);
  g.bx(-w / 2 + 0.1, h - 0.35, -d / 2 + 0.07, w / 2 - 0.1, h - 0.33, d / 2 - 0.07, '#e9edf0');
  g.use('metal');
  g.cyl(w / 2 - 0.05, h, 0, 0.02, 0.02, 0.08, 8, '#d9dcdf');
  g.tube([[w / 2 - 0.05, h + 0.08, 0], [w / 2 - 0.05, h + 0.14, 0], [w / 2 - 0.15, h + 0.14, 0]], 0.012, '#d9dcdf', 6);
  g.use('matte');
  g.cb(-w / 2 + 0.25, 0, d / 2 + 0.02, -w / 2 + 0.85, 0.012, d / 2 + 0.52, 0.01, o.mat ?? '#9fb2b8');
  return { size: [w, h, d], mounts: [{ kind: 'floor', pos: [w / 2 - 0.2, 0, d / 2 + 0.25], n: [0, 1, 0], tags: ['wet', 'bath'] }] };
};

KIT.shower = (g, o) => {
  const w = o.w ?? 0.9, d = o.d ?? 0.9, glass = o.glass ?? 'front';
  g.use('gloss');
  g.cb(-w / 2, 0, -d / 2, w / 2, 0.05, d / 2, 0.006, '#f3f2ee');
  g.use('metal');
  g.cyl(0, 0.05, 0, 0.04, 0.04, 0.003, 10, '#b9bcc0');
  g.cyl(-w / 2 + 0.08, 0.05, -d / 2 + 0.03, 0.012, 0.012, 2.0, 6, '#d9dcdf');
  g.at(-w / 2 + 0.08, 2.0, -d / 2 + 0.03);
  g.line([0, 0, 0], [0.28, 0.02, 0.18], 0.011, '#d9dcdf', 6);
  g.pop();
  g.cyl(-w / 2 + 0.36, 1.97, -d / 2 + 0.21, 0.12, 0.12, 0.015, 16, '#d0d3d6');
  g.bx(-w / 2 + 0.05, 1.0, -d / 2 + 0.0, -w / 2 + 0.11, 1.12, -d / 2 + 0.06, '#d9dcdf');
  const gs = [];
  if (glass === 'front' || glass === 'corner') gs.push([[-w / 2 + 0.25, d / 2], [w / 2, d / 2]]);
  if (glass === 'side' || glass === 'corner') gs.push([[w / 2, -d / 2], [w / 2, d / 2]]);
  for (const [a, b] of gs) {
    g.use('glass');
    g.face([[a[0], 0.05, a[1]], [b[0], 0.05, b[1]], [b[0], 2.0, b[1]], [a[0], 2.0, a[1]]], [a[0] + 0.01, 1, a[1] - 1], '#ffffff');
    g.use('metal');
    g.line([a[0], 2.0, a[1]], [b[0], 2.0, b[1]], 0.008, '#c9ccd0', 4);
    g.line([a[0], 0.05, a[1]], [a[0], 2.0, a[1]], 0.008, '#c9ccd0', 4);
  }
  g.use('gloss');
  g.bx(w / 2 - 0.3, 1.2, -d / 2, w / 2 - 0.05, 1.22, -d / 2 + 0.12, '#d9dcdf');
  g.cyl(w / 2 - 0.25, 1.22, -d / 2 + 0.06, 0.025, 0.025, 0.16, 8, '#e46a5b');
  g.cyl(w / 2 - 0.16, 1.22, -d / 2 + 0.06, 0.025, 0.025, 0.13, 8, '#f1e6c9');
  return { size: [w, 2.0, d], mounts: [{ kind: 'floor', pos: [0, 0, d / 2 + 0.2], n: [0, 1, 0], tags: ['wet', 'shower'] }], shadowA: 0.15 };
};

KIT.towelRail = (g, o) => {
  const w = o.w ?? 0.5, h = o.h ?? 1.2, col = o.color ?? '#f1f0ec';
  g.use('gloss');
  for (const s of [-1, 1]) g.bx(s * w / 2 - 0.02, 0, 0.04, s * w / 2 + 0.02, h, 0.07, col);
  for (let i = 0; i < 12; i++) { const y = 0.06 + (i * (h - 0.1)) / 11; g.bx(-w / 2, y - 0.011, 0.045, w / 2, y + 0.011, 0.065, col); }
  for (const s of [-1, 1]) g.bx(s * w / 2 - 0.012, 0.05, 0, s * w / 2 + 0.012, 0.08, 0.05, '#d9dcdf');
  if (o.towel !== false) {
    g.use('matte');
    const tc = o.towel ?? '#d8c7b0';
    g.cb(-w / 2 + 0.05, h * 0.42, 0.072, w / 2 - 0.05, h * 0.78, 0.09, 0.01, tc);
    g.cb(-w / 2 + 0.05, h * 0.55, 0.025, w / 2 - 0.05, h * 0.78, 0.045, 0.01, shade(tc, 0.95));
  }
  return { size: [w, h, 0.1], radiator: { valve: [w / 2 + 0.03, 0.065, 0.055], dir: [1, 0, 0] }, kind: 'towelrail' };
};
KIT.towelRail.wall = true;

KIT.radiator = (g, o) => {
  const w = o.w ?? 1.0, h = o.h ?? 0.6, col = C(o.color ?? '#f3f2ee');
  g.use('satin');
  for (const s of [-1, 1]) g.bx(s * (w / 2 - 0.08) - 0.02, 0.06, 0, s * (w / 2 - 0.08) + 0.02, h - 0.08, 0.04, '#e3e2de');
  g.cb(-w / 2, 0, 0.04, w / 2, h, 0.1, 0.008, col, { top: shade(col, 0.88) });
  const n = Math.round(w / 0.05);
  g.use('matte');
  for (let i = 1; i < n; i++) { const x = -w / 2 + (i * w) / n; g.bx(x - 0.003, 0.05, 0.1, x + 0.003, h - 0.05, 0.1025, shade(col, 0.9)); }
  g.use('gloss');
  g.cyl(w / 2 - 0.02, h - 0.06, 0.07, 0.016, 0.016, 0.07, 8, '#e9e8e4', {});
  g.at(w / 2 + 0.05, h - 0.06, 0.07, 0, 0, Math.PI / 2);
  g.cyl(0, 0, 0, 0.025, 0.025, 0.07, 10, '#f4f3ef');
  g.pop();
  return { size: [w + 0.12, h, 0.1], radiator: { valve: [w / 2 + 0.01, h - 0.06, 0.07], dir: [1, 0, 0] }, kind: 'radiator' };
};
KIT.radiator.wall = true;

KIT.boiler = (g, o) => {
  const w = 0.42, h = 0.72, d = 0.33;
  g.use('gloss');
  g.cb(-w / 2, 0, 0, w / 2, h, d, 0.02, o.color ?? '#f2f1ed');
  g.use('matte');
  g.bx(-0.13, 0.12, d, 0.13, 0.2, d + 0.004, '#2a2d33');
  g.bx(-0.08, 0.14, d + 0.004, 0.0, 0.18, d + 0.006, '#7fc1d8');
  g.use('metal');
  for (let i = 0; i < 5; i++) g.cyl(-0.16 + i * 0.08, -0.25, 0.1, 0.011, 0.011, 0.25, 6, i === 2 ? '#d4a64a' : '#b87333');
  g.cyl(0, h, d / 2, 0.05, 0.05, 0.25, 10, '#d9dcdf');
  return { size: [w, h, d], mounts: [{ kind: 'boiler', pos: [w / 2 + 0.03, h * 0.5, d / 2], n: [1, 0, 0], tags: ['boiler'] }], kind: 'boiler', outlets: [{ pos: [w / 2 + 0.15, -0.05, 0], n: 1, y: 1.0 }] };
};
KIT.boiler.wall = true;

KIT.waterHeater = (g, o) => {
  const r = o.r ?? 0.28, h = o.h ?? 1.7;
  g.use('gloss');
  g.cyl(0, 0, 0, r, r, h, 18, o.color ?? '#efeee9', { top: '#e3e2dd' });
  g.use('matte');
  g.bx(-0.08, h * 0.6, r - 0.01, 0.08, h * 0.6 + 0.12, r + 0.01, '#2a2d33');
  g.use('metal');
  g.cyl(-0.08, h, 0, 0.012, 0.012, 0.6, 6, '#b87333');
  g.cyl(0.08, h, 0, 0.012, 0.012, 0.6, 6, '#b87333');
  return { size: [r * 2, h, r * 2], mounts: [{ kind: 'boiler', pos: [0, 1.2, r], n: [0, 0, 1], tags: ['heater'] }] };
};

KIT.heatPump = (g, o) => {
  const w = o.w ?? 1.1, h = o.h ?? 0.85, d = 0.45;
  g.use('satin');
  g.bx(-w / 2 + 0.05, 0, -d / 2 + 0.05, -w / 2 + 0.12, 0.14, d / 2 - 0.05, '#4a4c50');
  g.bx(w / 2 - 0.12, 0, -d / 2 + 0.05, w / 2 - 0.05, 0.14, d / 2 - 0.05, '#4a4c50');
  g.cb(-w / 2, 0.14, -d / 2, w / 2, h, d / 2, 0.015, o.color ?? '#e7e6e2');
  g.use('matte');
  g.at(-w / 2 + 0.38, 0.14 + (h - 0.14) / 2, d / 2, 0, Math.PI / 2);
  g.cyl(0, 0, 0, 0.3, 0.3, 0.01, 24, '#2b2d31');
  for (let i = 0; i < 6; i++) g.line([-0.28, 0.012, -0.25 + i * 0.1], [0.28, 0.012, -0.25 + i * 0.1], 0.004, '#9a9da1', 4);
  g.pop();
  return { size: [w, h, d], kind: 'heatpump' };
};

KIT.utilitySink = (g, o) => {
  g.use('satin');
  g.cb(-0.3, 0, -0.25, 0.3, 0.85, 0.25, 0.01, '#e9e8e4');
  g.use('metal');
  g.bx(-0.26, 0.6, -0.21, 0.26, 0.852, 0.21, '#a9adb2');
  g.tube([[0, 0.85, -0.23], [0, 1.15, -0.23], [0, 1.15, -0.1], [0, 1.08, -0.08]], 0.012, '#d9dcdf', 6);
  return { size: [0.6, 0.85, 0.5] };
};

KIT.shelfUnit = (g, o) => {
  const w = o.w ?? 0.9, d = o.d ?? 0.4, h = o.h ?? 1.8, col = o.color ?? '#7d8085', n = o.shelves ?? 4;
  g.use('metal');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.bx(sx * (w / 2 - 0.02) - 0.015, 0, sz * (d / 2 - 0.02) - 0.015, sx * (w / 2 - 0.02) + 0.015, h, sz * (d / 2 - 0.02) + 0.015, col);
  const R = rng(o.seed || 51);
  const boxCols = o.boxCols || ['#c9a77a', '#b8946a', '#d8d2c4', '#5b6f8a', '#8a3b2f', '#e3c25a', '#3f5a3a'];
  for (let i = 0; i < n; i++) {
    const y = 0.1 + (i * (h - 0.15)) / (n - 1);
    g.use('satin');
    g.bx(-w / 2, y - 0.02, -d / 2, w / 2, y, d / 2, o.shelfCol ?? '#a8abaf');
    if (i === n - 1 && o.topEmpty) continue;
    let x = -w / 2 + 0.04;
    g.use('matte');
    while (x < w / 2 - 0.12) {
      const bw = 0.15 + R() * 0.22, bh = 0.1 + R() * Math.min(0.28, (h - 0.15) / (n - 1) - 0.12), bd = d * (0.6 + R() * 0.35);
      if (x + bw > w / 2 - 0.03) break;
      if (R() < 0.75) g.cb(x, y, -bd / 2, x + bw, y + bh, bd / 2, 0.005, boxCols[Math.floor(R() * boxCols.length)]);
      x += bw + 0.02 + R() * 0.05;
    }
  }
  return { size: [w, h, d], surfaces: [{ x: 0, y: 0.1 + ((n - 1) * (h - 0.15)) / (n - 1), z: 0, w: w * 0.5, d, tag: 'regał' }] };
};

KIT.blackShelving = (g, o) => {
  const w = o.w ?? 0.8, d = o.d ?? 0.4, h = o.h ?? 1.9, col = '#1b1c1e';
  g.use('satin');
  g.bx(-w / 2, 0, -d / 2, -w / 2 + 0.02, h, d / 2, col);
  g.bx(w / 2 - 0.02, 0, -d / 2, w / 2, h, d / 2, col);
  g.bx(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.01, col);
  const R = rng(o.seed || 5);
  for (let i = 0; i < 5; i++) {
    const y = 0.05 + i * (h - 0.05) / 4;
    g.use('satin');
    g.bx(-w / 2, y - 0.02, -d / 2, w / 2, y, d / 2, col);
    if (i === 4) continue;
    g.use('gloss');
    let x = -w / 2 + 0.06;
    while (x < w / 2 - 0.1) {
      const k = R();
      const c = ['#e9e4d8', '#c7b79a', '#b3261e', '#3f5a3a', '#f2c14e', '#d8d2c4'][Math.floor(R() * 6)];
      if (k < 0.4) g.cyl(x + 0.04, y, 0, 0.04, 0.04, 0.12 + R() * 0.12, 8, c);
      else if (k < 0.75) { g.use('matte'); g.cb(x, y, -0.12, x + 0.12, y + 0.1 + R() * 0.15, 0.12, 0.005, c); g.use('gloss'); }
      else g.cyl(x + 0.04, y, 0, 0.035, 0.03, 0.25, 8, '#2f5b3a');
      x += 0.13 + R() * 0.05;
    }
  }
  return { size: [w, h, d] };
};

KIT.shoeCabinet = (g, o) => {
  const w = o.w ?? 0.8, d = o.d ?? 0.3, h = o.h ?? 0.9, col = C(o.color ?? '#efece6');
  g.use('satin');
  g.cb(-w / 2, 0.05, -d / 2, w / 2, h, d / 2, 0.006, col, { top: o.top ?? P.oak });
  for (let i = 0; i < 2; i++) { const y0 = 0.05 + (i * (h - 0.05)) / 2 + 0.003, y1 = 0.05 + ((i + 1) * (h - 0.05)) / 2 - 0.003; g.bx(-w / 2 + 0.008, y0, d / 2, w / 2 - 0.008, y1, d / 2 + 0.006, shade(col, 0.98)); barHandle(g, 0, y1 - 0.04, d / 2 + 0.006, 0.12, false, '#2b2c2f', 0.02); g.use('satin'); }
  g.use('matte');
  g.cb(-w / 2 + 0.06, h, -0.06, -w / 2 + 0.3, h + 0.02, 0.09, 0.005, '#3a3d42');
  g.use('gloss');
  g.cyl(w / 2 - 0.12, h, 0, 0.06, 0.07, 0.04, 12, '#cbbfa8');
  g.use('metal');
  g.bx(w / 2 - 0.15, h + 0.04, -0.01, w / 2 - 0.09, h + 0.045, 0.02, '#c9a65a');
  const shoes = o.shoes ?? 3;
  g.use('matte');
  for (let i = 0; i < shoes; i++) {
    const sx = -w / 2 + 0.15 + i * 0.22, c = ['#3a3d42', '#c9b9a0', '#8a3b2f', '#2e4a6b'][i % 4];
    for (const s of [-0.045, 0.045]) { g.at(sx + s, 0, d / 2 + 0.2, 0.1 * (i - 1)); g.cb(-0.04, 0, -0.13, 0.04, 0.07, 0.13, 0.025, c, { top: shade(c, 1.1) }); g.cb(-0.035, 0.06, -0.13, 0.035, 0.12, -0.04, 0.02, c); g.pop(); }
  }
  return { size: [w, h, d], surfaces: [{ x: 0, y: h, z: 0, w: w * 0.4, d, tag: 'szafka na buty' }], shadowK: 1 };
};

KIT.coatHooks = (g, o) => {
  const w = o.w ?? 0.8, col = o.color ?? P.oak;
  g.use('satin');
  g.bx(-w / 2, 0, 0, w / 2, 0.1, 0.02, col);
  const n = o.n ?? 4;
  const R = rng(o.seed || 61);
  const coats = o.coats ?? ['#2e3a4b', '#8a6a4a', '#3f4a3a', '#b9b2a6'];
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + ((i + 0.5) * w) / n;
    g.use('metal');
    g.line([x, 0.05, 0.02], [x, 0.08, 0.08], 0.007, '#2b2c2f', 4);
    if (i < coats.length && R() < 0.85) {
      g.use('matte');
      g.at(x, 0.02, 0.07, (R() - 0.5) * 0.3);
      g.cb(-0.17, -0.85, -0.05, 0.17, 0.0, 0.07, 0.04, coats[i]);
      g.cb(-0.08, -0.08, -0.04, 0.08, 0.04, 0.08, 0.03, shade(coats[i], 0.85));
      g.pop();
    }
  }
  return { size: [w, 1.0, 0.15], noShadow: true };
};
KIT.coatHooks.wall = true;

KIT.bench = (g, o) => {
  const w = o.w ?? 1.0, d = o.d ?? 0.36, h = o.h ?? 0.45, col = o.color ?? P.oak;
  g.use('satin');
  g.cb(-w / 2, h - 0.04, -d / 2, w / 2, h, d / 2, 0.006, col);
  for (const s of [-1, 1]) g.bx(s * (w / 2 - 0.05) - 0.02, 0, -d / 2 + 0.03, s * (w / 2 - 0.05) + 0.02, h - 0.04, d / 2 - 0.03, o.leg ?? col);
  if (o.cushion) { g.use('matte'); g.cb(-w / 2 + 0.02, h, -d / 2 + 0.02, w / 2 - 0.02, h + 0.05, d / 2 - 0.02, 0.02, o.cushion); }
  return { size: [w, h, d] };
};

KIT.picture = (g, o) => {
  const w = o.w ?? 0.5, h = o.h ?? 0.7, fr = o.frame ?? '#2b2c2f', art = o.art ?? 'abstract';
  g.use('matte');
  g.cb(-w / 2, 0, 0, w / 2, h, 0.025, 0.004, fr);
  g.bx(-w / 2 + 0.03, 0.03, 0.025, w / 2 - 0.03, h - 0.03, 0.027, o.mat ?? '#f3efe6');
  const ix0 = -w / 2 + 0.07, ix1 = w / 2 - 0.07, iy0 = 0.07, iy1 = h - 0.07;
  const z = 0.0272;
  const R = rng(o.seed || 71);
  if (art === 'abstract') {
    const cols = o.cols || ['#c56e4c', '#d9a441', '#3f5a6b', '#9aa58c'];
    for (let i = 0; i < 3; i++) {
      const cx = ix0 + R() * (ix1 - ix0), cy = iy0 + R() * (iy1 - iy0), r = (ix1 - ix0) * (0.18 + R() * 0.2);
      const pts = [];
      for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; pts.push([Math.max(ix0, Math.min(ix1, cx + Math.cos(a) * r)), Math.max(iy0, Math.min(iy1, cy + Math.sin(a) * r))]); }
      for (let k = 1; k < 9; k++) g.tri([pts[0][0], pts[0][1], z + i * 0.0003], [pts[k][0], pts[k][1], z + i * 0.0003], [pts[k + 1][0], pts[k + 1][1], z + i * 0.0003], cols[i % cols.length]);
    }
  } else if (art === 'landscape') {
    g.bx(ix0, iy0, z - 0.0002, ix1, iy1, z, '#a9c3d4');
    g.bx(ix0, iy0, z, ix1, iy0 + (iy1 - iy0) * 0.35, z + 0.0004, '#6f8a4c');
    g.tri([ix0, iy0 + (iy1 - iy0) * 0.35, z + 0.0002], [ix0 + (ix1 - ix0) * 0.45, iy0 + (iy1 - iy0) * 0.75, z + 0.0002], [ix1, iy0 + (iy1 - iy0) * 0.35, z + 0.0002], '#7f8f9f');
  } else if (art === 'photo') {
    g.bx(ix0, iy0, z - 0.0002, ix1, iy1, z, o.tone ?? '#9b8a76');
    g.bx(ix0 + 0.02, iy0 + 0.02, z, ix0 + (ix1 - ix0) * 0.5, iy0 + (iy1 - iy0) * 0.7, z + 0.0004, shade(o.tone ?? '#9b8a76', 0.7));
  } else if (art === 'lines') {
    for (let i = 0; i < 6; i++) { const y = iy0 + ((i + 0.5) * (iy1 - iy0)) / 6; g.bx(ix0, y - 0.004, z - 0.0002, ix0 + (ix1 - ix0) * (0.4 + R() * 0.6), y + 0.004, z, '#2b2c2f'); }
  }
  return { size: [w, h, 0.03], noShadow: true, noData: false };
};
KIT.picture.wall = true;

KIT.clock = (g, o) => {
  const r = o.r ?? 0.15;
  g.use('matte');
  g.at(0, r, 0, 0, Math.PI / 2);
  g.cyl(0, 0, 0, r, r, 0.035, 20, o.color ?? '#2b2c2f');
  g.cyl(0, 0.035, 0, r - 0.012, r - 0.012, 0.002, 20, '#f4f1ea');
  g.pop();
  g.bx(-0.004, r - 0.005, 0.038, 0.004, r + 0.09, 0.04, '#2b2c2f');
  g.bx(-0.003, r - 0.004, 0.04, 0.07, r + 0.004, 0.042, '#2b2c2f');
  return { size: [r * 2, r * 2, 0.04], noShadow: true };
};
KIT.clock.wall = true;

KIT.curtain = (g, o) => {
  const w = o.w ?? 1.6, top = o.h ?? 2.45, bottom = o.bottom ?? 1.0, col = C(o.color ?? '#e8e2d6'), pat = o.pattern;
  const h = top - bottom;
  g.use('matte');
  g.bx(-w / 2 - 0.1, top - 0.03, 0.04, w / 2 + 0.1, top, 0.07, o.rod ?? '#2b2c2f');
  if (o.sheer !== false) {
    const sc = C(o.sheerCol ?? '#f4f2ed');
    for (let i = 0; i < Math.round(w / 0.12); i++) {
      const x0 = -w / 2 + i * 0.12;
      g.bx(x0, bottom + 0.02, 0.085 + (i % 2) * 0.012, x0 + 0.124, top - 0.04, 0.095 + (i % 2) * 0.012, sc.clone().multiplyScalar(i % 2 ? 0.95 : 1.0));
    }
  }
  const panels = o.panels ?? 2;
  for (let p = 0; p < panels; p++) {
    const side = panels === 1 ? 0 : p === 0 ? -1 : 1;
    const pw = o.panelW ?? 0.36, cx = side === 0 ? (o.x ?? 0) : side * (w / 2 + 0.06 - pw / 2);
    const folds = Math.round(pw / 0.07);
    for (let i = 0; i < folds; i++) {
      const x0 = cx - pw / 2 + (i * pw) / folds, x1 = x0 + pw / folds;
      const zz = 0.11 + (i % 2) * 0.03;
      const c = pat === 'check' ? (Math.floor(i / 2) % 2 ? col : C('#a8aaad')) : col.clone().multiplyScalar(i % 2 ? 0.93 : 1.02);
      g.bx(x0, bottom, zz, x1 + 0.004, top - 0.04, zz + 0.03, c);
      if (pat === 'check') for (let k = 0; k < Math.floor(h / 0.3); k++) g.bx(x0, bottom + 0.15 + k * 0.3, zz + 0.0301, x1 + 0.004, bottom + 0.17 + k * 0.3, zz + 0.0305, '#9ea1a5');
    }
  }
  void h;
  return { size: [w + 0.2, top, 0.16], noShadow: true, noData: true };
};
KIT.curtain.wall = true;

KIT.plant = (g, o) => {
  const kind = o.kind ?? 'monstera', s = o.s ?? 1, potCol = o.pot ?? P.potWhite;
  const R = rng(o.seed || 81);
  if (kind === 'monstera') {
    potAt(g, 0, 0, 0, 0.17 * s, 0.32 * s, potCol);
    g.use('matte');
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4 + R() * 0.4, up = 0.45 + R() * 0.5;
      const stemTop = [Math.cos(a) * 0.22 * s, (0.6 + up * 0.55) * s, Math.sin(a) * 0.22 * s];
      g.line([0, 0.28 * s, 0], stemTop, 0.008 * s, '#5d7a3a', 4);
      g.use('matte2');
      leafShape(g, stemTop, [Math.cos(a), 0.15 - R() * 0.4, Math.sin(a)], (0.3 + R() * 0.12) * s, (0.17 + R() * 0.05) * s, mixc(P.leafDark, P.leaf, R()), 0.5, true);
      g.use('matte');
    }
    return { size: [0.8 * s, 1.3 * s, 0.8 * s], shadowK: 0.5 };
  }
  if (kind === 'ficus' || kind === 'olive') {
    potAt(g, 0, 0, 0, 0.16 * s, 0.34 * s, potCol);
    g.use('matte');
    g.line([0, 0.3 * s, 0], [0.03 * s, 1.1 * s, 0.02 * s], 0.02 * s, '#6b5440', 5);
    const lc = kind === 'olive' ? '#8a9a6a' : P.leafDark;
    for (let i = 0; i < 7; i++) {
      const a = i * 2.1, y = (0.9 + R() * 0.75) * s, r = (0.18 + R() * 0.18) * s;
      g.blob(Math.cos(a) * r, y, Math.sin(a) * r, 0.2 * s, 0.17 * s, 0.2 * s, mixc(lc, P.leaf, R() * 0.5), 100 + i + (o.seed || 0));
    }
    return { size: [0.7 * s, 1.75 * s, 0.7 * s], shadowK: 0.5 };
  }
  if (kind === 'snake') {
    potAt(g, 0, 0, 0, 0.12 * s, 0.26 * s, potCol);
    g.use('matte2');
    for (let i = 0; i < 9; i++) {
      const a = i * 2.3 + R(), r = 0.04 * s * R(), h = (0.45 + R() * 0.35) * s, tw = 0.035 * s;
      const bx = Math.cos(a) * r, bz = Math.sin(a) * r, lean = 0.06 * (R() - 0.5);
      const c = mixc('#3f5f36', '#7f9a4a', R() * 0.5);
      g.quad([bx - tw, 0.24 * s, bz], [bx + tw, 0.24 * s, bz], [bx + lean + tw * 0.4, 0.24 * s + h, bz + lean], [bx + lean - tw * 0.4, 0.24 * s + h, bz + lean], c);
      g.tri([bx + lean - tw * 0.4, 0.24 * s + h, bz + lean], [bx + lean + tw * 0.4, 0.24 * s + h, bz + lean], [bx + lean, 0.24 * s + h + 0.06 * s, bz + lean], c);
    }
    return { size: [0.3 * s, 0.9 * s, 0.3 * s] };
  }
  if (kind === 'small') {
    potAt(g, 0, 0, 0, 0.07 * s, 0.11 * s, potCol);
    g.use('matte');
    g.blob(0, 0.17 * s, 0, 0.1 * s, 0.08 * s, 0.1 * s, P.leafLight, o.seed || 3);
    return { size: [0.2 * s, 0.25 * s, 0.2 * s], noShadow: true };
  }
  if (kind === 'pothos') {
    potAt(g, 0, 0, 0, 0.09 * s, 0.12 * s, potCol);
    g.use('matte2');
    for (let i = 0; i < 9; i++) {
      const a = i * 0.8 + R();
      leafShape(g, [Math.cos(a) * 0.06, 0.13 * s, Math.sin(a) * 0.06], [Math.cos(a), -0.3, Math.sin(a)], (0.15 + R() * 0.25) * s, 0.05 * s, mixc('#4f7a3f', '#9dbf5a', R()), 1.5);
    }
    return { size: [0.4 * s, 0.25 * s, 0.4 * s], noShadow: true };
  }
  return { size: [0.3, 0.3, 0.3] };
};

KIT.laundry = (g, o) => {
  g.use('matte');
  g.cyl(0, 0, 0, 0.2, 0.22, 0.45, 12, o.color ?? '#d8cdb8', { noTop: true });
  g.cyl(0, 0.44, 0, 0.18, 0.18, 0.02, 12, '#e8e2d6');
  g.cb(-0.12, 0.42, -0.1, 0.12, 0.5, 0.12, 0.03, '#9fb2b8');
  return { size: [0.44, 0.5, 0.44] };
};

KIT.bin = (g, o) => {
  g.use('metal');
  g.cyl(0, 0, 0, 0.13, 0.13, 0.45, 14, o.color ?? '#c9ccd0', { top: '#2b2c2f' });
  return { size: [0.26, 0.45, 0.26], noShadow: true };
};

KIT.toyBox = (g, o) => {
  g.use('satin');
  g.cb(-0.35, 0, -0.22, 0.35, 0.42, 0.22, 0.01, o.color ?? '#e7d4a8');
  g.use('matte');
  const R = rng(o.seed || 91);
  const cols = ['#d9483b', '#3f7fbf', '#f2c14e', '#6fae5a', '#f08a3c', '#9b6bc2'];
  for (let i = 0; i < 6; i++) {
    const x = -0.25 + R() * 0.5, z = -0.12 + R() * 0.24, c = cols[i % cols.length];
    if (i % 3 === 0) g.sphere(x, 0.47, z, 0.07, 8, 5, c);
    else g.cb(x - 0.05, 0.42, z - 0.05, x + 0.05, 0.52, z + 0.05, 0.01, c);
  }
  for (let i = 0; i < 5; i++) {
    const x = -0.5 + R() * 1.4, z = 0.35 + R() * 0.5, c = cols[(i + 2) % cols.length];
    g.cb(x - 0.035, 0, z - 0.035, x + 0.035, 0.07, z + 0.035, 0.008, c);
  }
  return { size: [0.7, 0.45, 0.44] };
};

KIT.beanbag = (g, o) => {
  g.use('matte');
  g.blob(0, 0.28, 0, 0.42, 0.3, 0.42, o.color ?? '#c9785a', o.seed || 4, { flat: true, jitter: 0.06 });
  return { size: [0.85, 0.6, 0.85] };
};

KIT.car = (g, o) => {
  const col = C(o.color ?? '#3d4f63'), kind = o.kind ?? 'hatch';
  const L = o.l ?? (kind === 'suv' ? 4.6 : kind === 'sedan' ? 4.7 : 4.2), W = o.w ?? (kind === 'suv' ? 1.9 : 1.8);
  const glass = C('#1a2127'), dark = C('#1b1c1e'), trim = C('#2a2c30'), body2 = shade(col, 0.82);
  const lift = kind === 'suv' ? 0.12 : 0;
  const prof = kind === 'sedan'
    ? [[-L / 2, 0.3], [-L / 2, 0.62], [-L / 2 + 0.12, 0.74], [-L / 2 + 1.1, 0.86], [L / 2 - 0.55, 0.9], [L / 2 - 0.1, 0.86], [L / 2, 0.7], [L / 2, 0.3]]
    : [[-L / 2, 0.3], [-L / 2, 0.64], [-L / 2 + 0.12, 0.76], [-L / 2 + 1.0, 0.88], [L / 2 - 0.12, 0.92], [L / 2, 0.82], [L / 2, 0.3]];
  const cab = kind === 'sedan'
    ? [[-L / 2 + 1.12, 0.86], [-L / 2 + 1.95, 1.42], [L / 2 - 1.35, 1.42], [L / 2 - 0.6, 0.9]]
    : kind === 'suv'
      ? [[-L / 2 + 1.05, 0.88], [-L / 2 + 1.75, 1.6], [L / 2 - 0.3, 1.58], [L / 2 - 0.12, 0.92]]
      : [[-L / 2 + 1.02, 0.88], [-L / 2 + 1.8, 1.44], [L / 2 - 0.4, 1.42], [L / 2 - 0.14, 0.92]];
  g.use('gloss');
  g.at(0, lift, 0, Math.PI / 2);
  const hw = W / 2, cw = W / 2 - 0.1;
  const P2 = (p, z) => [p[0], p[1], z];
  for (const s of [-1, 1]) g.face(prof.map((p) => P2(p, s * hw)), [0, 0.6, 0], col);
  for (let i = 0; i < prof.length; i++) {
    const a = prof[i], b = prof[(i + 1) % prof.length];
    g.face([P2(a, -hw), P2(b, -hw), P2(b, hw), P2(a, hw)], [0, 0.6, 0], i === prof.length - 1 ? dark : col);
  }
  for (const s of [-1, 1]) {
    g.use('matte');
    g.face(cab.map((p) => P2(p, s * cw)), [0, 1.0, 0], glass);
    g.use('gloss');
    const [a, b, c, d] = cab;
    const pil = (p0, p1, w2) => { const mx = p0[0] + (p1[0] - p0[0]) * w2, my = p0[1] + (p1[1] - p0[1]) * w2; return [mx, my]; };
    g.face([P2(a, s * (cw + 0.004)), P2(pil(a, b, 1), s * (cw + 0.004)), P2([b[0] + 0.1, b[1]], s * (cw + 0.004)), P2([a[0] + 0.12, a[1]], s * (cw + 0.004))], [0, 1.0, -s], col);
    const bx = (b[0] + c[0]) / 2 + 0.1;
    g.face([[bx - 0.06, cab[0][1], s * (cw + 0.004)], [bx + 0.06, cab[0][1], s * (cw + 0.004)], [bx + 0.06, b[1] - 0.01, s * (cw + 0.004)], [bx - 0.06, b[1] - 0.01, s * (cw + 0.004)]], [bx, 1.0, -s], col);
    g.face([P2([d[0] - 0.22, d[1]], s * (cw + 0.004)), P2(d, s * (cw + 0.004)), P2(c, s * (cw + 0.004)), P2([c[0] - 0.18, c[1]], s * (cw + 0.004))], [0, 1.0, -s], col);
    g.face([[-L / 2 + 0.3, 0.48, s * (hw + 0.004)], [L / 2 - 0.3, 0.48, s * (hw + 0.004)], [L / 2 - 0.3, 0.52, s * (hw + 0.004)], [-L / 2 + 0.3, 0.52, s * (hw + 0.004)]], [0, 0.5, -s], body2);
  }
  for (let i = 0; i < cab.length - 1; i++) {
    const a = cab[i], b = cab[i + 1];
    g.use(i === 1 ? 'gloss' : 'matte');
    g.face([P2(a, -cw), P2(b, -cw), P2(b, cw), P2(a, cw)], [0, 0.9, 0], i === 1 ? col : glass);
  }
  g.use('gloss');
  g.pop();
  g.use('matte');
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
    const z = sz * (L / 2 - (kind === 'sedan' ? 0.85 : 0.75));
    g.at(sx * (W / 2 - 0.13), 0.33 + lift * 0.5, z, 0, 0, Math.PI / 2);
    g.cyl(0, -0.11, 0, 0.33, 0.33, 0.22, 14, dark);
    g.cyl(0, sx > 0 ? 0.105 : -0.12, 0, 0.21, 0.21, 0.015, 10, C('#9a9da2'));
    g.pop();
  }
  g.use('gloss');
  for (const s of [-1, 1]) {
    g.bx(s * (W / 2 - 0.32) - 0.18, 0.62 + lift, L / 2 - 0.02, s * (W / 2 - 0.32) + 0.18, 0.7 + lift, L / 2 + 0.02, C('#f1eee4'));
    g.bx(s * (W / 2 - 0.22) - 0.16, 0.66 + lift, -L / 2 - 0.02, s * (W / 2 - 0.22) + 0.16, 0.76 + lift, -L / 2 + 0.02, C('#9e1f1a'));
    g.bx(s * (W / 2 + 0.02) - 0.03, 1.0 + lift, -L / 2 + 1.25, s * (W / 2 + 0.02) + 0.03, 1.08 + lift, -L / 2 + 1.4, col);
  }
  g.use('matte');
  g.bx(-0.5, 0.42 + lift, L / 2 - 0.01, 0.5, 0.58 + lift, L / 2 + 0.025, trim);
  g.bx(-0.26, 0.4 + lift, -L / 2 - 0.035, 0.26, 0.51 + lift, -L / 2 - 0.02, C('#f4f4f0'));
  g.bx(-0.26, 0.4 + lift, L / 2 + 0.025, 0.26, 0.51 + lift, L / 2 + 0.035, C('#f4f4f0'));
  g.bx(-W / 2 + 0.05, 0.28, -L / 2 + 0.02, W / 2 - 0.05, 0.42 + lift, -L / 2 + 0.12, trim);
  g.bx(-W / 2 + 0.05, 0.28, L / 2 - 0.12, W / 2 - 0.05, 0.42 + lift, L / 2 - 0.02, trim);
  return { size: [W, 1.5 + lift, L], kind: 'car', shadowK: 1, feather: 0.35, shadowA: 0.45, noData: !!o.noData };
};

KIT.bike = (g, o) => {
  const col = o.color ?? '#2e6b8a';
  g.use('metal');
  for (const z of [-0.52, 0.52]) {
    g.at(0, 0.34, z, 0, 0, Math.PI / 2);
    g.lathe([[0.33, -0.012], [0.35, 0], [0.33, 0.012]], 18, '#1d1e20');
    g.pop();
  }
  g.line([0, 0.34, -0.52], [0, 0.62, -0.1], 0.016, col, 5);
  g.line([0, 0.34, -0.52], [0, 0.34, 0.05], 0.016, col, 5);
  g.line([0, 0.34, 0.05], [0, 0.62, -0.1], 0.016, col, 5);
  g.line([0, 0.62, -0.1], [0, 0.66, 0.4], 0.016, col, 5);
  g.line([0, 0.34, 0.05], [0, 0.66, 0.4], 0.016, col, 5);
  g.line([0, 0.66, 0.4], [0, 0.34, 0.52], 0.014, col, 5);
  g.line([0, 0.66, 0.4], [0, 0.95, 0.35], 0.014, '#2b2c2f', 5);
  g.line([-0.22, 0.95, 0.35], [0.22, 0.95, 0.35], 0.012, '#2b2c2f', 5);
  g.use('matte');
  g.cb(-0.07, 0.8, -0.2, 0.07, 0.85, -0.02, 0.02, '#2b2c2f');
  g.line([0, 0.62, -0.1], [0, 0.8, -0.12], 0.012, '#2b2c2f', 5);
  return { size: [0.5, 1.0, 1.75], noShadow: true };
};

KIT.workbench = (g, o) => {
  const w = o.w ?? 1.6, d = o.d ?? 0.65;
  g.use('satin');
  g.bx(-w / 2, 0.86, -d / 2, w / 2, 0.92, d / 2, P.pine);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.bx(sx * (w / 2 - 0.06) - 0.035, 0, sz * (d / 2 - 0.06) - 0.035, sx * (w / 2 - 0.06) + 0.035, 0.86, sz * (d / 2 - 0.06) + 0.035, P.pine);
  g.bx(-w / 2 + 0.05, 0.15, -d / 2 + 0.05, w / 2 - 0.05, 0.18, d / 2 - 0.05, P.pine);
  g.bx(-w / 2, 0.92, -d / 2, w / 2, 1.85, -d / 2 + 0.02, '#c9b48a');
  g.use('matte');
  const R = rng(o.seed || 7);
  for (let i = 0; i < 9; i++) { const x = -w / 2 + 0.15 + i * (w - 0.3) / 8, y = 1.2 + R() * 0.4; g.bx(x - 0.015, y - 0.15, -d / 2 + 0.02, x + 0.015, y, -d / 2 + 0.05, ['#d9483b', '#2b2c2f', '#e3c25a', '#3f7fbf'][i % 4]); }
  g.cb(-0.3, 0.92, -0.1, 0.0, 1.02, 0.1, 0.01, '#d9483b');
  g.cb(0.2, 0.92, -0.15, 0.55, 1.08, 0.12, 0.01, '#3a5f9a');
  return { size: [w, 1.85, d], surfaces: [{ x: 0, y: 0.92, z: 0.1, w: w * 0.5, d: 0.4, tag: 'warsztat' }] };
};

KIT.trashBins = (g, o) => {
  const cols = o.cols ?? ['#2b2c2f', '#e3c25a', '#3f7fbf', '#4f8a4a', '#7a5a3a'];
  cols.forEach((c, i) => {
    g.use('satin');
    const x = (i - (cols.length - 1) / 2) * 0.62;
    g.cb(x - 0.28, 0.05, -0.33, x + 0.28, 1.0, 0.33, 0.02, c);
    g.cb(x - 0.3, 1.0, -0.35, x + 0.3, 1.06, 0.36, 0.02, shade(c, 0.85));
    g.use('matte');
    for (const s of [-1, 1]) { g.at(x + s * 0.2, 0.08, -0.3, 0, 0, Math.PI / 2); g.cyl(0, -0.03, 0, 0.08, 0.08, 0.06, 10, '#1d1e20'); g.pop(); }
  });
  return { size: [cols.length * 0.62, 1.06, 0.7], noData: true };
};

KIT.gardenSet = (g, o) => {
  const col = o.color ?? '#6b4f3a';
  g.use('satin');
  g.cb(-0.8, 0.72, -0.45, 0.8, 0.75, 0.45, 0.005, col);
  for (let i = 0; i < 6; i++) g.bx(-0.8, 0.75, -0.45 + i * 0.15 + 0.005, 0.8, 0.752, -0.45 + i * 0.15 + 0.14, shade(col, 0.95 + (i % 2) * 0.08));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.bx(sx * 0.72 - 0.03, 0, sz * 0.38 - 0.03, sx * 0.72 + 0.03, 0.72, sz * 0.38 + 0.03, col);
  for (const [x, z, r] of [[-0.45, 0.75, Math.PI], [0.45, 0.75, Math.PI], [-0.45, -0.75, 0], [0.45, -0.75, 0]]) {
    g.at(x, 0, z, r);
    g.bx(-0.22, 0.42, -0.22, 0.22, 0.45, 0.22, col);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.bx(sx * 0.19 - 0.02, 0, sz * 0.19 - 0.02, sx * 0.19 + 0.02, sz < 0 ? 0.88 : 0.42, sz * 0.19 + 0.02, col);
    for (let k = 0; k < 3; k++) g.bx(-0.2, 0.55 + k * 0.11, -0.22, 0.2, 0.62 + k * 0.11, -0.2, col);
    g.pop();
  }
  if (o.umbrella) {
    g.use('metal');
    g.cyl(0, 0, 0, 0.025, 0.025, 2.3, 6, '#d9dcdf');
    g.use('matte2');
    g.lathe([[1.3, 1.95], [0.02, 2.35]], 10, o.umbrella);
  }
  return { size: [1.8, 0.9, 2.0], noData: true };
};

KIT.lounger = (g, o) => {
  const col = o.color ?? '#efede8';
  g.use('satin');
  g.cb(-0.33, 0.25, -0.95, 0.33, 0.32, 0.6, 0.02, '#8a6446');
  g.at(0, 0.32, 0.6, 0, -0.75);
  g.cb(-0.32, 0, -0.03, 0.32, 0.65, 0.05, 0.02, '#8a6446');
  g.use('matte');
  g.cb(-0.3, 0.0, 0.05, 0.3, 0.62, 0.11, 0.03, col);
  g.pop();
  g.use('matte');
  g.cb(-0.31, 0.32, -0.93, 0.31, 0.38, 0.6, 0.03, col);
  g.use('satin');
  for (const sx of [-1, 1]) for (const sz of [-0.85, 0.5]) g.bx(sx * 0.28 - 0.025, 0, sz - 0.025, sx * 0.28 + 0.025, 0.25, sz + 0.025, '#8a6446');
  return { size: [0.7, 0.9, 2.0], noData: true };
};

KIT.grill = (g, o) => {
  g.use('gloss');
  g.at(0, 0.62, 0);
  g.lathe([[0.0, -0.22], [0.2, -0.2], [0.29, -0.08], [0.3, 0.0], [0.0, 0.0]], 16, '#1d1e20');
  g.lathe([[0.3, 0.02], [0.27, 0.14], [0.16, 0.24], [0.0, 0.27]], 16, '#1d1e20');
  g.pop();
  g.use('metal');
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; g.line([Math.cos(a) * 0.2, 0.45, Math.sin(a) * 0.2], [Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32], 0.012, '#b9bcc0', 5); }
  g.bx(-0.04, 0.88, -0.03, 0.04, 0.92, 0.03, '#2b2c2f');
  return { size: [0.65, 0.95, 0.65], noData: true };
};

KIT.trampoline = (g, o) => {
  const r = o.r ?? 1.5;
  g.use('matte');
  g.cyl(0, 0.82, 0, r, r, 0.04, 28, '#2e4a6b', { top: '#1d2733' });
  g.cyl(0, 0.83, 0, r * 0.88, r * 0.88, 0.022, 28, '#1a1b1d', { noBottom: true });
  g.use('metal');
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g.line([Math.cos(a) * r, 0, Math.sin(a) * r], [Math.cos(a) * r, 0.84, Math.sin(a) * r], 0.02, '#a9adb2', 5); g.line([Math.cos(a) * r, 0.84, Math.sin(a) * r], [Math.cos(a) * r, 2.6, Math.sin(a) * r], 0.016, '#2e4a6b', 5); }
  g.use('matte2');
  for (let i = 0; i < 18; i++) {
    const a0 = (i / 18) * TAU, a1 = ((i + 1) / 18) * TAU;
    g.quad([Math.cos(a0) * r, 0.86, Math.sin(a0) * r], [Math.cos(a1) * r, 0.86, Math.sin(a1) * r], [Math.cos(a1) * r, 2.55, Math.sin(a1) * r], [Math.cos(a0) * r, 2.55, Math.sin(a0) * r], '#3a3c40');
  }
  return { size: [r * 2, 2.6, r * 2], noData: true, shadowA: 0.12 };
};

KIT.swing = (g, o) => {
  g.use('satin');
  const c = '#7a5a3c';
  for (const s of [-1, 1]) { g.line([s * 1.2, 0, -0.6], [s * 1.0, 2.1, 0], 0.05, c, 6); g.line([s * 1.2, 0, 0.6], [s * 1.0, 2.1, 0], 0.05, c, 6); }
  g.line([-1.1, 2.1, 0], [1.1, 2.1, 0], 0.06, c, 6);
  g.use('metal');
  for (const x of [-0.5, 0.5]) { g.line([x - 0.2, 2.1, 0], [x - 0.2, 0.45, 0], 0.006, '#9a9da1', 4); g.line([x + 0.2, 2.1, 0], [x + 0.2, 0.45, 0], 0.006, '#9a9da1', 4); g.use('satin'); g.bx(x - 0.24, 0.42, -0.1, x + 0.24, 0.46, 0.1, x < 0 ? '#d9483b' : '#3f7fbf'); g.use('metal'); }
  return { size: [2.5, 2.2, 1.3], noData: true };
};

KIT.sandbox = (g, o) => {
  g.use('satin');
  const c = '#9a7350';
  g.bx(-0.8, 0, -0.8, 0.8, 0.25, -0.72, c); g.bx(-0.8, 0, 0.72, 0.8, 0.25, 0.8, c); g.bx(-0.8, 0, -0.72, -0.72, 0.25, 0.72, c); g.bx(0.72, 0, -0.72, 0.8, 0.25, 0.72, c);
  g.use('matte');
  g.bx(-0.72, 0, -0.72, 0.72, 0.18, 0.72, '#d8c597');
  g.cb(-0.3, 0.18, 0.1, -0.15, 0.3, 0.25, 0.01, '#d9483b');
  g.cb(0.2, 0.18, -0.3, 0.35, 0.26, -0.15, 0.01, '#3f7fbf');
  return { size: [1.6, 0.3, 1.6], noData: true };
};

KIT.shed = (g, o) => {
  const w = o.w ?? 2.4, d = o.d ?? 2.0, h = 2.0, col = o.color ?? '#6b5a48';
  g.use('satin');
  g.bx(-w / 2, 0, -d / 2, w / 2, h, d / 2, col);
  for (let i = 0; i < Math.round(w / 0.14); i++) g.bx(-w / 2 + i * 0.14, 0, d / 2, -w / 2 + i * 0.14 + 0.012, h, d / 2 + 0.01, shade(col, 0.8));
  g.use('matte');
  g.face([[-w / 2 - 0.2, h, -d / 2 - 0.2], [w / 2 + 0.2, h, -d / 2 - 0.2], [w / 2 + 0.2, h + 0.5, d / 2 + 0.25], [-w / 2 - 0.2, h + 0.5, d / 2 + 0.25]], [0, 0, 0], '#3a3d42');
  g.face([[-w / 2 - 0.2, h - 0.05, -d / 2 - 0.2], [w / 2 + 0.2, h - 0.05, -d / 2 - 0.2], [w / 2 + 0.2, h + 0.45, d / 2 + 0.25], [-w / 2 - 0.2, h + 0.45, d / 2 + 0.25]], [0, 9, 0], '#3a3d42');
  g.use('satin');
  g.bx(-0.45, 0, d / 2, 0.45, 1.85, d / 2 + 0.03, shade(col, 1.12));
  return { size: [w, h + 0.5, d], noData: true };
};

KIT.stove = (g, o) => {
  const col = '#16171a';
  g.use('satin');
  g.cyl(-0.18, 0, 0, 0.11, 0.11, 0.035, 6, P.birchPly, { rot: Math.PI / 6 });
  g.cyl(0.18, 0, 0, 0.11, 0.11, 0.035, 6, P.birchPly, { rot: Math.PI / 6 });
  g.use('matte');
  for (const s of [-1, 1]) { g.line([s * 0.18, 0.035, -0.12], [s * 0.2, 0.3, -0.16], 0.015, col, 5); g.line([s * 0.18, 0.035, 0.12], [s * 0.2, 0.3, 0.16], 0.015, col, 5); }
  g.cb(-0.3, 0.3, -0.25, 0.3, 0.95, 0.25, 0.04, col);
  g.cb(-0.3, 0.95, -0.25, 0.3, 1.0, 0.25, 0.02, '#202125');
  g.use('gloss');
  g.bx(-0.21, 0.42, 0.25, 0.21, 0.86, 0.255, '#3a2d26', { front: '#4a3527' });
  g.use('matte');
  g.bx(-0.24, 0.39, 0.25, 0.24, 0.42, 0.26, col);
  g.bx(-0.24, 0.86, 0.25, 0.24, 0.89, 0.26, col);
  g.bx(0.18, 0.55, 0.26, 0.21, 0.72, 0.29, '#2a2b2e');
  g.cyl(0, 1.0, 0, 0.075, 0.075, 0.28, 14, col);
  g.sphere(0, 1.3, -0.02, 0.078, 14, 6, col);
  g.line([0, 1.3, -0.02], [0, 1.36, -0.12], 0.075, col, 14);
  g.line([0, 1.36, -0.12], [0, 1.36, -(o.toWall ?? 0.55)], 0.075, col, 14);
  g.at(0, 1.36, -(o.toWall ?? 0.55) + 0.015, 0, Math.PI / 2);
  g.cyl(0, -0.015, 0, 0.11, 0.11, 0.015, 14, col);
  g.pop();
  g.use('matte');
  g.cb(-0.7, 0, -0.42, 0.7, 0.012, 0.55, 0.004, '#e8dccb');
  return { size: [0.62, 1.45, 0.62], kind: 'stove' };
};

KIT.piano = (g, o) => {
  const col = '#141518';
  g.use('gloss');
  g.cb(-0.68, 0.7, -0.17, 0.68, 0.82, 0.17, 0.01, col);
  g.bx(-0.62, 0.79, 0.0, 0.62, 0.81, 0.15, '#f2f0ea');
  g.use('matte');
  for (let i = 0; i < 36; i++) { const pat = [1, 1, 0, 1, 1, 1, 0]; if (!pat[i % 7]) continue; const x = -0.6 + i * 0.0335 + 0.02; g.bx(x - 0.007, 0.81, 0.0, x + 0.007, 0.823, 0.095, col); }
  g.use('gloss');
  g.at(0.05, 0.82, -0.08, 0, 0.25);
  g.bx(-0.25, 0, -0.01, 0.25, 0.22, 0.01, col);
  g.pop();
  g.use('metal');
  for (const s of [-1, 1]) {
    g.line([s * 0.55, 0, -0.18], [s * 0.38, 0.7, 0.16], 0.022, col, 6);
    g.line([s * 0.55, 0, 0.18], [s * 0.38, 0.7, -0.16], 0.022, col, 6);
    g.line([s * 0.55, 0.02, -0.2], [s * 0.55, 0.02, 0.2], 0.018, col, 6);
  }
  g.line([-0.45, 0.35, 0], [0.45, 0.35, 0], 0.016, col, 6);
  g.use('matte');
  g.at(0, 0, 0.62);
  g.cb(-0.3, 0.45, -0.17, 0.3, 0.5, 0.17, 0.02, '#1d1e20');
  for (const sx of [-1, 1]) g.line([sx * 0.25, 0, 0], [sx * 0.2, 0.45, 0], 0.018, col, 5);
  g.pop();
  return { size: [1.4, 1.05, 0.95], center: [0, 0, 0.25], kind: 'piano', surfaces: [{ x: 0.45, y: 0.82, z: 0, w: 0.2, d: 0.3, tag: 'pianino' }] };
};

KIT.gzowoShelf = (g, o) => {
  const w = o.w ?? 3.9, d = 0.32, col = '#141517';
  g.use('matte');
  g.cb(-w / 2, 0, 0, w / 2, 0.09, d, 0.006, col);
  const tx = o.tablet ?? -1.2;
  g.bx(tx - 0.13, 0.09, 0.12, tx + 0.13, 0.11, 0.24, '#202226');
  g.at(tx, 0.11, 0.16, 0, -0.35);
  g.cb(-0.125, 0, -0.008, 0.125, 0.18, 0.008, 0.004, '#1d1f23');
  g.bx(-0.115, 0.01, 0.008, 0.115, 0.17, 0.0095, '#3d5266');
  g.pop();
  g.cb(-0.45 - 0.165, 0.09, 0.08, -0.45 + 0.165, 0.385, 0.135, 0.006, '#16171a');
  g.bx(-0.45 - 0.165, 0.2, 0.135, -0.45 + 0.165, 0.206, 0.137, '#2a2b2e');
  g.bx(-0.47, 0.26, 0.135, -0.43, 0.29, 0.137, '#c9ccd0');
  g.cyl(tx - 0.5, 0.09, 0.16, 0.075, 0.075, 0.21, 16, '#1b1c1f');
  g.use('matte');
  const lx = 0.7;
  g.bx(lx - 0.06, 0.09, 0.1, lx + 0.06, 0.28, 0.2, '#6b4a33');
  g.at(lx, 0.28, 0.15);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; g.line([0, 0, 0], [Math.cos(a) * 0.22, 0.12 + (i % 2) * 0.08, Math.sin(a) * 0.1], 0.012, i % 2 ? '#c66b2b' : '#8a5a3a', 4); g.cb(Math.cos(a) * 0.22 - 0.04, 0.1 + (i % 2) * 0.08, Math.sin(a) * 0.1 - 0.02, Math.cos(a) * 0.22 + 0.04, 0.16 + (i % 2) * 0.08, Math.sin(a) * 0.1 + 0.02, 0.005, '#d27d3a'); }
  g.cb(-0.06, 0.04, -0.04, 0.06, 0.16, 0.04, 0.01, '#8a5a3a');
  g.pop();
  g.bx(1.15, 0.09, 0.12, 1.34, 0.23, 0.14, '#cf2f2a');
  g.bx(1.17, 0.11, 0.14, 1.32, 0.21, 0.142, '#9bb0a0');
  g.use('gloss');
  g.cyl(1.5, 0.09, 0.15, 0.07, 0.07, 0.05, 12, '#c92b27');
  g.sphere(1.5, 0.19, 0.15, 0.062, 12, 7, '#d6e6ea');
  g.use('satin');
  for (let i = 0; i < 5; i++) { g.at(1.68 + i * 0.07, 0.09, 0.15, 0, 0, i % 2 ? 0.45 : -0.45); g.bx(-0.008, 0, -0.07, 0.008, 0.21, 0.07, '#ece9e3'); g.pop(); }
  g.use('matte');
  g.bx(tx + 0.25, 0.09, 0.2, tx + 0.45, 0.11, 0.24, '#e9e7e2');
  return { size: [w, 0.45, d], surfaces: [{ x: tx, y: 0.09, z: d / 2, w: 0.5, d, tag: 'półka' }, { x: 0.2, y: 0.09, z: d / 2, w: 0.5, d, tag: 'półka' }], strips: [{ kind: 'shelf', pts: [[-w / 2 + 0.05, -0.004, d - 0.03], [w / 2 - 0.05, -0.004, d - 0.03]] }], kind: 'shelf' };
};
KIT.gzowoShelf.wall = true;

KIT.plyTable = (g, o) => {
  const w = o.w ?? 2.3, d = o.d ?? 1.15, h = 0.76, lime = '#bfe84a';
  g.use('satin');
  g.cb(-w / 2, h - 0.03, -d / 2, w / 2, h, d / 2, 0.004, P.ply, { top: '#d9b17c' });
  g.bx(-w / 2, h - 0.03, -d / 2, w / 2, h - 0.026, d / 2, '#e3c79a');
  g.use('gloss');
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.32);
    g.bx(x - 0.03, h - 0.07, -d / 2 + 0.08, x + 0.03, h - 0.03, d / 2 - 0.08, lime);
    for (const sz of [-1, 1]) { g.line([x, h - 0.07, sz * (d / 2 - 0.12)], [x + sx * 0.12, 0, sz * (d / 2 - 0.02)], 0.02, lime, 6); g.line([x, h - 0.07, sz * (d / 2 - 0.12)], [x - sx * 0.12, 0, sz * (d / 2 - 0.02)], 0.02, lime, 6); }
  }
  g.use('metal');
  g.bx(-0.55, h, -0.2, -0.21, h + 0.012, 0.04, '#a9adb2');
  g.at(-0.38, h + 0.012, -0.2, 0, -1.15);
  g.bx(-0.17, 0, 0, 0.17, 0.006, 0.23, '#a9adb2');
  g.bx(-0.16, 0.0062, 0.01, 0.16, 0.0068, 0.22, '#1e2530');
  g.pop();
  g.use('matte');
  for (const [x, z] of [[0.15, -0.1], [0.35, 0.12]]) g.cyl(x, h, z, 0.05, 0.05, 0.008, 14, '#1d1e20');
  g.bx(0.05, h, 0.25, 0.4, h + 0.03, 0.31, '#f0efea');
  for (let i = 0; i < 5; i++) g.bx(0.08 + i * 0.065, h + 0.03, 0.27, 0.11 + i * 0.065, h + 0.032, 0.29, '#2b2c2f');
  g.tube([[0.05, h + 0.01, 0.28], [-0.1, h + 0.01, 0.4], [-0.2, h + 0.005, 0.2], [-0.35, h + 0.01, 0.1]], 0.004, '#f2f2f0', 4);
  g.tube([[0.35, h + 0.01, 0.12], [0.5, h + 0.01, 0.0], [0.6, h + 0.01, 0.3], [0.9, h + 0.01, 0.45]], 0.003, '#2b2c2f', 4);
  g.use('glass');
  g.cyl(0.85, h, -0.1, 0.045, 0.035, 0.18, 10, '#ffffff');
  g.use('matte');
  for (let i = 0; i < 4; i++) g.line([0.85, h + 0.05, -0.1], [0.85 + (i - 1.5) * 0.03, h + 0.48, -0.1 + (i % 2) * 0.03], 0.004, '#4f7a3f', 4);
  g.blob(0.88, h + 0.5, -0.08, 0.05, 0.04, 0.05, '#7a9a52', 5, { detail: 0 });
  g.at(-0.35, 0, d / 2 + 0.3, Math.PI);
  KIT.chair(g, { style: 'eames', color: '#ece9e3' });
  g.pop();
  return { size: [w, h, d], surfaces: [{ x: 0.6, y: h, z: 0, w: 0.6, d: d * 0.8, tag: 'stół' }], kind: 'table' };
};

KIT.gzowoSofa = (g, o) => KIT.sofa(g, { ...o, color: '#3f4246', leg: '#1a1b1d', legH: 0.16, pillows: ['#c55f6b', '#e8dfcf'], throw: '#2c3446' });

KIT.gzowoWardrobe = (g, o) => {
  const w = o.w ?? 1.15, h = o.h ?? 2.32, d = 0.6;
  g.use('satin');
  g.bx(-w / 2, 0, -d / 2, w / 2, h, d / 2 - 0.02, '#3b3d41');
  for (let i = 0; i < 2; i++) {
    const x0 = -w / 2 + i * w / 2 + 0.002, x1 = -w / 2 + (i + 1) * w / 2 - 0.002;
    g.bx(x0, 0.01, d / 2 - 0.02, x1, h - 0.005, d / 2, '#45474b');
    barHandle(g, i === 0 ? x1 - 0.04 : x0 + 0.04, h * 0.55, d / 2, h * 0.65, true, '#c9ccd1', 0.025);
  }
  return { size: [w, h, d], kind: 'wardrobe' };
};

KIT.mirrorPanel = (g, o) => {
  const w = o.w ?? 0.9, h = o.h ?? 2.32;
  g.use('matte');
  g.bx(-w / 2 - 0.03, 0, -0.03, w / 2 + 0.03, h + 0.02, 0.0, '#2a2d31');
  g.use('gloss');
  g.bx(-w / 2, 0.01, 0.0, w / 2, h, 0.03, '#a9b6be', { front: '#b9c6cd' });
  g.bx(-w / 2 + 0.08, h * 0.4, 0.03, -w / 2 + 0.16, h * 0.95, 0.0305, '#d2dce1');
  return { size: [w + 0.06, h, 0.06] };
};

KIT.onyx = (g, o) => {
  g.use('gloss');
  g.bx(-(o.w ?? 11.8) / 2, 0, 0, (o.w ?? 11.8) / 2, 0.16, 0.08, '#e9d2ad', { top: '#f1dcb8' });
  return { size: [o.w ?? 11.8, 0.16, 0.08], noData: true, noShadow: true };
};

KIT.box = (g, o) => {
  g.use(o.mat ?? 'satin');
  g.cb(-(o.w ?? 0.4) / 2, 0, -(o.d ?? 0.4) / 2, (o.w ?? 0.4) / 2, o.h ?? 0.4, (o.d ?? 0.4) / 2, o.bev ?? 0.01, o.color ?? '#c9a77a');
  return { size: [o.w ?? 0.4, o.h ?? 0.4, o.d ?? 0.4], noData: !!o.noData };
};

KIT.gzowoFireplaceWall = KIT.stove;

export function bulbInto(g, b) {
  const p = b.pos, up = b.up ? -1 : 1;
  g.at(p[0], p[1], p[2], 0, b.up ? Math.PI : 0, 0);
  const shape = b.shape || (b.kind === 'GU10' ? 'gu10' : 'a60');
  if (shape === 'gu10') {
    g.lathe([[0, 0], [0.012, 0], [0.012, -0.012], [0.024, -0.016], [0.025, -0.05], [0.022, -0.054], [0, -0.054]], 10, '#fff6e6');
  } else if (shape === 'globe') {
    g.lathe([[0, 0], [0.014, 0], [0.014, -0.026], [0.03, -0.04], [0.047, -0.07], [0.048, -0.1], [0.04, -0.13], [0.022, -0.145], [0, -0.148]], 12, '#fff6e6');
  } else if (shape === 'candle') {
    g.lathe([[0, 0], [0.008, 0], [0.008, -0.02], [0.018, -0.04], [0.018, -0.07], [0.008, -0.095], [0, -0.1]], 8, '#fff6e6');
  } else if (shape === 'edison') {
    g.lathe([[0, 0], [0.0135, 0], [0.0135, -0.026], [0.024, -0.05], [0.031, -0.09], [0.026, -0.125], [0.012, -0.14], [0, -0.142]], 10, '#ffe2b3');
  } else {
    g.lathe([[0, 0], [0.0135, 0], [0.0135, -0.026], [0.02, -0.036], [0.03, -0.062], [0.03, -0.085], [0.022, -0.103], [0, -0.11]], 10, '#fff6e6');
  }
  g.pop();
  void up;
}

export const LIGHTS = {};

LIGHTS.pendant = (g, o, glow) => {
  const style = o.style ?? 'drum', drop = o.drop ?? 0.75, col = o.color ?? (style === 'dome' ? '#1d1e20' : '#efe8dc');
  g.use('matte');
  g.cyl(0, -0.025, 0, 0.055, 0.055, 0.025, 12, o.canopy ?? '#f2f1ed');
  g.cyl(0, -drop, 0, 0.003, 0.003, drop - 0.02, 4, '#1d1e20');
  g.cyl(0, -drop - 0.05, 0, 0.018, 0.016, 0.05, 8, o.holder ?? '#1d1e20');
  const sy = -drop - 0.03;
  if (style === 'drum') {
    g.use('matte2');
    g.lathe([[0.22, sy - 0.2], [0.22, sy + 0.04]], 20, col);
    g.use('metal');
    g.line([-0.2, sy + 0.02, 0], [0.2, sy + 0.02, 0], 0.003, '#b9bcc0', 4);
    g.line([0, sy + 0.02, -0.2], [0, sy + 0.02, 0.2], 0.003, '#b9bcc0', 4);
    return { bulbs: [{ pos: [0, -drop - 0.05, 0], kind: 'E27', shape: 'a60' }], kind: 'zwis' };
  }
  if (style === 'dome') {
    g.use('matte2');
    g.lathe([[0.025, sy + 0.02], [0.09, sy - 0.0], [0.16, sy - 0.06], [0.2, sy - 0.16], [0.205, sy - 0.18]], 18, col);
    return { bulbs: [{ pos: [0, -drop - 0.05, 0], kind: 'E27', shape: 'a60' }], kind: 'zwis' };
  }
  if (style === 'cone') {
    g.use('matte2');
    g.lathe([[0.02, sy + 0.03], [0.14, sy - 0.2]], 16, col);
    return { bulbs: [{ pos: [0, -drop - 0.05, 0], kind: 'E27', shape: 'a60' }], kind: 'zwis' };
  }
  if (style === 'globe') {
    glow.lathe([[0.03, sy + 0.0], [0.1, sy - 0.03], [0.15, sy - 0.12], [0.15, sy - 0.2], [0.1, sy - 0.28], [0.0, sy - 0.3]], 14, '#ffffff');
    return { bulbs: [{ pos: [0, -drop - 0.05, 0], kind: 'E27', shape: 'a60' }], kind: 'zwis', glassCol: '#f4efe6' };
  }
  if (style === 'bare') {
    return { bulbs: [{ pos: [0, -drop - 0.05, 0], kind: 'E27', shape: 'edison' }], kind: 'żarówka' };
  }
  if (style === 'cage') {
    g.use('metal');
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g.line([Math.cos(a) * 0.02, sy - 0.02, Math.sin(a) * 0.02], [Math.cos(a) * 0.07, sy - 0.1, Math.sin(a) * 0.07], 0.003, '#1d1e20', 3); g.line([Math.cos(a) * 0.07, sy - 0.1, Math.sin(a) * 0.07], [0, sy - 0.2, 0], 0.003, '#1d1e20', 3); }
    return { bulbs: [{ pos: [0, -drop - 0.05, 0], kind: 'E27', shape: 'edison' }], kind: 'zwis' };
  }
  return { bulbs: [{ pos: [0, -drop - 0.05, 0], kind: 'E27', shape: 'a60' }], kind: 'zwis' };
};

LIGHTS.flush = (g, o, glow) => {
  const r = o.r ?? 0.17;
  g.use('matte');
  g.cyl(0, -0.03, 0, r + 0.01, r + 0.01, 0.03, 18, o.color ?? '#f2f1ed');
  glow.lathe([[r, -0.03], [r * 0.97, -0.08], [r * 0.75, -0.14], [0, -0.16]], 16, '#ffffff');
  return { bulbs: [{ pos: [0, -0.032, 0], kind: 'E27', shape: 'a60' }], kind: 'plafon', glassCol: '#f6f3ee', lightPos: [0, -0.2, 0] };
};

LIGHTS.downlight = (g, o) => {
  const col = o.color ?? '#f2f1ed', r = 0.042, h = o.h ?? 0.1;
  g.use('matte');
  g.cyl(0, -h, 0, r, r, h, 12, col, { noBottom: true });
  g.lathe([[r - 0.001, -h], [r - 0.007, -h + 0.002], [r - 0.007, -h + 0.03]], 12, '#2a2b2e');
  return { bulbs: [{ pos: [0, -h + 0.062, 0], kind: 'GU10', shape: 'gu10' }], kind: 'oczko', lightPos: [0, -h - 0.05, 0] };
};

LIGHTS.spot = (g, o) => {
  const col = o.color ?? '#1d1e20';
  g.use('matte');
  g.cyl(0, -0.025, 0, 0.04, 0.04, 0.025, 10, col);
  g.line([0, -0.025, 0], [0, -0.09, 0.03], 0.008, col, 4);
  g.at(0, -0.12, 0.04, 0, 0.35);
  g.cyl(0, -0.04, 0, 0.038, 0.038, 0.1, 12, col, { noBottom: true });
  g.pop();
  return { bulbs: [{ pos: [0, -0.1, 0.04], kind: 'GU10', shape: 'gu10' }], kind: 'reflektorek' };
};

LIGHTS.batten = (g, o, glow) => {
  const L = o.l ?? 1.2;
  g.use('matte');
  g.bx(-L / 2, -0.04, -0.035, L / 2, 0, 0.035, '#e9e8e4');
  glow.bx(-L / 2 + 0.02, -0.06, -0.03, L / 2 - 0.02, -0.04, 0.03, '#ffffff');
  return { bulbs: [], kind: 'świetlówka', lightPos: [0, -0.1, 0] };
};

LIGHTS.fan = (g, o) => {
  const col = '#1d1e20';
  g.use('matte');
  g.cyl(0, -0.05, 0, 0.06, 0.06, 0.05, 12, col);
  g.cyl(0, -0.32, 0, 0.012, 0.012, 0.27, 6, col);
  g.cyl(0, -0.42, 0, 0.1, 0.11, 0.1, 14, col);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.3;
    g.at(0, -0.39, 0, -a);
    g.cb(0.1, -0.012, -0.05, 0.62, 0.0, 0.06, 0.004, col);
    g.pop();
  }
  g.cyl(0, -0.47, 0, 0.07, 0.06, 0.05, 12, col);
  return { bulbs: [{ pos: [0, -0.47, 0], kind: 'E27', shape: 'globe' }], kind: 'wentylator' };
};

LIGHTS.wallLamp = (g, o) => {
  const col = o.color ?? '#1d1e20';
  g.use('matte');
  g.cyl(0, -0.08, 0.0, 0.05, 0.05, 0.16, 10, col);
  g.bx(-0.03, -0.03, 0, 0.03, 0.03, 0.06, col);
  g.line([0, 0, 0.05], [0, 0.0, 0.16], 0.01, col, 5);
  g.at(0, 0, 0.18);
  g.lathe([[0.03, 0.04], [0.09, -0.08]], 14, col);
  g.pop();
  return { bulbs: [{ pos: [0, 0.02, 0.18], kind: 'E27', shape: 'a60' }], kind: 'kinkiet' };
};

LIGHTS.outdoor = (g, o, glow) => {
  const col = o.color ?? '#26282c';
  g.use('matte');
  if (o.style === 'cyl') {
    g.bx(-0.04, -0.12, 0, 0.04, 0.12, 0.02, col);
    g.cyl(0, -0.13, 0.09, 0.055, 0.055, 0.26, 12, col);
    glow.cyl(0, -0.135, 0.09, 0.045, 0.045, 0.006, 12, '#ffffff');
    glow.cyl(0, 0.129, 0.09, 0.045, 0.045, 0.006, 12, '#ffffff');
    return { bulbs: [{ pos: [0, 0.08, 0.09], kind: 'GU10', shape: 'gu10' }], kind: 'zewnętrzna' };
  }
  g.bx(-0.06, -0.09, 0, 0.06, 0.09, 0.02, col);
  g.bx(-0.012, -0.01, 0.02, 0.012, 0.01, 0.1, col);
  g.bx(-0.08, -0.02, 0.06, 0.08, 0.0, 0.2, col);
  g.cb(-0.075, -0.27, 0.065, 0.075, -0.02, 0.195, 0.005, col);
  glow.bx(-0.065, -0.25, 0.06, 0.065, -0.04, 0.2, '#ffffff');
  return { bulbs: [{ pos: [0, -0.03, 0.13], kind: 'E27', shape: 'a60' }], kind: 'kinkiet zewnętrzny', glassCol: '#efe7d6' };
};
LIGHTS.outdoor.wall = true;
LIGHTS.wallLamp.wall = true;

LIGHTS.bollard = (g, o, glow) => {
  const h = o.h ?? 0.65;
  g.use('matte');
  g.cyl(0, 0, 0, 0.065, 0.065, h - 0.12, 10, '#26282c');
  g.cyl(0, h - 0.02, 0, 0.075, 0.075, 0.02, 10, '#26282c');
  glow.cyl(0, h - 0.12, 0, 0.06, 0.06, 0.1, 10, '#ffffff');
  return { bulbs: [{ pos: [0, h - 0.025, 0], kind: 'E27', shape: 'a60' }], kind: 'słupek', glassCol: '#efe7d6' };
};

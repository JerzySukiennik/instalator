// Instalator buildings: exterior kit (faceted terrain, instanced trees and grass, hedges, fences, gates, paving, streets, cars, neighbour houses, block massing, river, jetty, pool).

import * as THREE from 'three';
import { Geo, C, shade, mixc, clamp, smooth, hash, rng, noise2, fbm } from './geo.js';
import { P, materials } from './palette.js';
import { KIT } from './furniture.js';
import { fillPattern } from './generator.js';

const TAU = Math.PI * 2;
const treeCache = new Map();

export const GRASS = { a: C('#7fa046'), b: C('#6e9440'), hi: C('#8ea852'), dry: C('#9a9a62'), shade: C('#6a8a3e') };

export function lawnColor(x, z, out = new THREE.Color()) {
  const z1 = fbm(x / 12 + 4, z / 12 - 6, 2, 21), z2 = fbm(x / 7 - 2, z / 7 + 5, 2, 24);
  out.copy(GRASS.a).lerp(GRASS.b, smooth(0.5, 0.36, z1)).lerp(GRASS.hi, smooth(0.52, 0.66, z1) * 0.85).lerp(GRASS.dry, smooth(0.6, 0.72, z2) * 0.4);
  return out;
}

function crownBlobs(g, pts, base, seed, o = {}) {
  pts.forEach(([x, y, z, rx, ry, rz], i) => g.blob(x, y, z, rx, ry ?? rx * 0.85, rz ?? rx, mixc(base, o.alt || base, hash(i, seed) * 0.6), seed * 13 + i, { detail: o.detail ?? 1, jitter: o.jitter ?? 0.13, lo: o.lo, hi: o.hi }));
}

function treeGeo(type) {
  if (treeCache.has(type)) return treeCache.get(type);
  const g = new Geo();
  g.use('t');
  const bark = '#5a4a3a';
  if (type === 'maple' || type === 'linden' || type === 'oak') {
    const big = type === 'oak' ? 1.25 : 1;
    g.cyl(0, 0, 0, 0.24 * big, 0.14 * big, 3.2, 7, type === 'oak' ? '#5b4b3c' : '#5e5244');
    for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.4; g.line([0, 2.6, 0], [Math.cos(a) * 1.3 * big, 4.2, Math.sin(a) * 1.3 * big], 0.08, '#5e5244', 5); }
    const base = type === 'linden' ? '#5f8238' : type === 'oak' ? '#4f6f33' : '#5a7d36';
    crownBlobs(g, [[0, 5.6, 0, 2.3 * big, 2.0], [1.4 * big, 4.6, 0.6, 1.6 * big, 1.4], [-1.3 * big, 4.8, -0.5, 1.7 * big, 1.5], [0.3, 4.4, -1.4 * big, 1.5 * big, 1.3], [-0.4, 4.3, 1.4 * big, 1.5 * big, 1.3], [0.2, 6.9, 0.2, 1.5 * big, 1.2]], base, type.length, { alt: '#6f8f42' });
  } else if (type === 'birch') {
    g.cyl(0, 0, 0, 0.13, 0.07, 7.5, 6, '#e9e5dc', { alt: '#d8d3c8' });
    for (let i = 0; i < 12; i++) { const y = 0.5 + i * 0.55, a = i * 2.1; g.bx(Math.cos(a) * 0.1 - 0.03, y, Math.sin(a) * 0.1 - 0.03, Math.cos(a) * 0.1 + 0.03, y + 0.05, Math.sin(a) * 0.1 + 0.03, '#2a2723'); }
    for (let i = 0; i < 3; i++) { const a = i * 2.2; g.line([0, 4.5 + i * 0.6, 0], [Math.cos(a) * 1.0, 5.6 + i * 0.6, Math.sin(a) * 1.0], 0.04, '#ddd8cc', 4); }
    crownBlobs(g, [[0, 6.6, 0, 1.4, 1.9], [0.9, 5.4, 0.4, 1.0, 1.2], [-0.8, 5.7, -0.4, 1.1, 1.3], [0.2, 7.9, 0.1, 0.8, 1.0]], '#7c9c48', 7, { alt: '#94ad5a' });
  } else if (type === 'pine') {
    g.cyl(0, 0, 0, 0.2, 0.12, 4.5, 7, '#5f4636');
    g.cyl(0, 4.5, 0, 0.12, 0.06, 6.5, 6, '#b06a3d');
    for (let i = 0; i < 4; i++) { const a = i * 1.9; g.line([0, 7 + i * 0.6, 0], [Math.cos(a) * 1.4, 7.6 + i * 0.6, Math.sin(a) * 1.4], 0.05, '#9a5d38', 4); }
    crownBlobs(g, [[0, 10, 0, 1.9, 1.0], [1.2, 8.8, 0.5, 1.3, 0.75], [-1.1, 9.2, -0.6, 1.4, 0.8], [0.3, 7.9, -1.1, 1.1, 0.7], [-0.2, 11.0, 0.3, 1.1, 0.65]], '#3e5b34', 11, { alt: '#4c6a3c', jitter: 0.16 });
  } else if (type === 'spruce') {
    g.cyl(0, 0, 0, 0.16, 0.05, 9, 6, '#4b3b2e');
    for (let i = 0; i < 6; i++) { const y = 1.0 + i * 1.35, r = 2.0 - i * 0.3; g.lathe([[r, y], [r * 0.55, y + 0.4], [0.05, y + 1.9]], 9, mixc('#2e4a2c', '#3b5a35', i / 6), { rot: i * 0.4 }); g.lathe([[0.05, y], [r, y]], 9, '#243a24', { rot: i * 0.4 }); }
  } else if (type === 'thuja') {
    g.cyl(0, 0, 0, 0.06, 0.06, 0.3, 5, '#4b3b2e');
    g.lathe([[0.0, 0.15], [0.42, 0.3], [0.48, 0.9], [0.4, 1.7], [0.22, 2.4], [0.0, 2.75]], 9, '#3d5c32', { alt: '#456836' });
  } else if (type === 'apple') {
    g.cyl(0, 0, 0, 0.13, 0.09, 1.5, 6, '#5a4a3a');
    for (let i = 0; i < 4; i++) { const a = i * 1.6; g.line([0, 1.3, 0], [Math.cos(a) * 1.0, 2.2, Math.sin(a) * 1.0], 0.05, '#5a4a3a', 4); }
    crownBlobs(g, [[0, 2.8, 0, 1.6, 1.1], [1.0, 2.4, 0.5, 1.0, 0.8], [-1.0, 2.5, -0.4, 1.1, 0.8], [0.2, 3.4, 0.1, 1.0, 0.7]], '#6a8a3f', 5, { alt: '#7c9a48' });
    const R = rng(19);
    for (let i = 0; i < 14; i++) { const a = R() * TAU, r = 1.3 + R() * 0.4, y = 2.2 + R() * 1.2; g.sphere(Math.cos(a) * r, y, Math.sin(a) * r, 0.06, 5, 3, R() < 0.7 ? '#b8322a' : '#d9b23c'); }
  } else if (type === 'willow') {
    g.cyl(0, 0, 0, 0.45, 0.3, 2.6, 7, '#5c564a');
    for (let i = 0; i < 5; i++) { const a = i * 1.3; g.line([0, 2.4, 0], [Math.cos(a) * 1.8, 4.0, Math.sin(a) * 1.8], 0.12, '#5c564a', 5); }
    crownBlobs(g, [[0, 5.0, 0, 3.0, 2.1], [2.0, 4.2, 0.8, 2.0, 1.6], [-1.9, 4.4, -0.9, 2.2, 1.7], [0.5, 3.8, -2.0, 1.8, 1.5], [-0.6, 3.8, 1.9, 1.8, 1.5]], '#7d8f5c', 23, { alt: '#93a26c' });
  } else if (type === 'alder') {
    g.cyl(0, 0, 0, 0.2, 0.1, 7, 6, '#4a4640');
    crownBlobs(g, [[0, 7.6, 0, 2.2, 3.0], [1.0, 5.6, 0.6, 1.6, 1.8], [-1.0, 6.2, -0.5, 1.6, 2.0], [0.2, 9.4, 0.0, 1.3, 1.5]], '#45663a', 31, { alt: '#507440' });
  } else if (type === 'bush') {
    crownBlobs(g, [[0, 0.75, 0, 1.0, 0.75], [0.7, 0.55, 0.3, 0.7, 0.55], [-0.6, 0.6, -0.3, 0.75, 0.6]], '#5d7a42', 41, { alt: '#6f8d4c' });
  } else if (type === 'boxball') {
    g.blob(0, 0.42, 0, 0.45, 0.42, 0.45, '#4d6b39', 51, { detail: 1, jitter: 0.05 });
  } else if (type === 'grasses') {
    const R = rng(61);
    for (let i = 0; i < 22; i++) {
      const a = R() * TAU, lean = 0.25 + R() * 0.3, h = 0.8 + R() * 0.5;
      const tip = [Math.cos(a) * lean, h, Math.sin(a) * lean];
      const c = R() < 0.4 ? '#b9a873' : '#9aa765';
      g.tri([-0.03, 0, 0], [0.03, 0, 0], tip, c);
      g.tri([0, 0, -0.03], [0, 0, 0.03], tip, c);
      g.tri([0.03, 0, 0], [-0.03, 0, 0], tip, c);
      g.tri([0, 0, 0.03], [0, 0, -0.03], tip, c);
    }
  } else if (type === 'reeds') {
    const R = rng(91);
    for (let i = 0; i < 26; i++) {
      const a = R() * TAU, d = R() * 1.2, x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = 1.5 + R() * 1.3, lean = (R() - 0.5) * 0.5, w = 0.06;
      const tip = [x + lean, h, z + lean * 0.4];
      const c = R() < 0.25 ? '#a39a62' : R() < 0.5 ? '#8a8e4f' : '#7d8546';
      for (const s of [1, -1]) { g.tri([x - w * s, 0, z], [x + w * s, 0, z], tip, c); g.tri([x, 0, z - w * s], [x, 0, z + w * s], tip, c); }
      if (R() < 0.2) g.box(tip[0], h - 0.1, tip[2], 0.07, 0.3, 0.07, '#6e5236');
    }
  } else if (type === 'flowers') {
    const R = rng(71);
    const cols = ['#d9483b', '#f2c14e', '#efe9f2', '#b26bc2', '#f08ab0', '#f6a23c'];
    for (let i = 0; i < 9; i++) {
      const x = (R() - 0.5) * 0.7, z = (R() - 0.5) * 0.7, h = 0.25 + R() * 0.25;
      g.line([x, 0, z], [x, h, z], 0.006, '#5f7f3a', 3);
      g.blob(x, h, z, 0.05, 0.035, 0.05, cols[Math.floor(R() * cols.length)], i, { detail: 0, jitter: 0.1 });
    }
    g.blob(0, 0.08, 0, 0.42, 0.12, 0.42, '#5d7a42', 3, { detail: 0 });
  }
  const geo = g.geometry('t');
  treeCache.set(type, geo);
  return geo;
}

function tuftGeo() {
  if (treeCache.has('tuft')) return treeCache.get('tuft');
  const g = new Geo();
  g.use('t');
  const R = rng(5);
  for (let i = 0; i < 5; i++) {
    const a = R() * TAU, h = 0.11 + R() * 0.12, lean = 0.03 + R() * 0.05, w = 0.016;
    const bx = (R() - 0.5) * 0.08, bz = (R() - 0.5) * 0.08;
    const tip = [bx + Math.cos(a) * lean, h, bz + Math.sin(a) * lean];
    const ca = Math.cos(a + 1.57) * w, sa = Math.sin(a + 1.57) * w;
    g.tri([bx - ca, 0, bz - sa], [bx + ca, 0, bz + sa], tip, '#4f6e2e', '#4f6e2e', '#9cb85a');
  }
  const geo = g.geometry('t');
  treeCache.set('tuft', geo);
  return geo;
}

export function makeSite(api, o = {}) {
  const M = materials();
  const g = new Geo();
  const trees = new Map();
  const tufts = [];
  const S = {
    g, api,
    ground: o.ground ?? (() => 0),
    tree(type, x, z, s = 1, ry = null) {
      if (!trees.has(type)) trees.set(type, []);
      trees.get(type).push({ x, z, s, ry: ry ?? hash(x, z) * TAU, y: S.ground(x, z) });
    },
    trees(list) { for (const t of list) S.tree(...t); },
    tuft(x, z, s = 1) { tufts.push({ x, z, s, y: S.ground(x, z) }); },
    scatter(n, test, seed = 1, sMin = 0.8, sMax = 1.3, x0 = -40, z0 = -40, x1 = 40, z1 = 40) {
      sMin *= 0.62; sMax *= 0.62; n = Math.round(n * 1.35);
      const R = rng(seed);
      let k = 0;
      for (let i = 0; i < n * 6 && k < n; i++) {
        const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0);
        if (!test(x, z)) continue;
        S.tuft(x, z, sMin + R() * (sMax - sMin));
        k++;
      }
    },
    terrain(t) {
      const cell = t.cell ?? 1.1, nx = Math.round((t.x1 - t.x0) / cell), nz = Math.round((t.z1 - t.z0) / cell);
      const N = nx + 1;
      const vx = new Float32Array((nx + 1) * (nz + 1)), vz = new Float32Array((nx + 1) * (nz + 1)), vy = new Float32Array((nx + 1) * (nz + 1));
      const col = [];
      const tc = new THREE.Color();
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
        const k = j * N + i, edge = i === 0 || j === 0 || i === nx || j === nz;
        let x = t.x0 + i * cell, z = t.z0 + j * cell;
        if (!edge && !(t.flat && t.flat(x, z))) { x += (hash(i, j, 4) - 0.5) * cell * 0.5; z += (hash(i, j, 8) - 0.5) * cell * 0.5; }
        vx[k] = x; vz[k] = z; vy[k] = S.ground(x, z);
        t.color(x, z, vy[k], tc);
        col.push(tc.r, tc.g, tc.b);
      }
      const pos = [], cc = [], nor = [];
      const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();
      const push = (a, b, d) => {
        const ax = vx[a], ay = vy[a], az = vz[a], bx = vx[b], by = vy[b], bz = vz[b], dx = vx[d], dy = vy[d], dz = vz[d];
        const mx = (ax + bx + dx) / 3, mz = (az + bz + dz) / 3;
        if (t.hole && t.hole(mx, mz)) return;
        e1.set(bx - ax, by - ay, bz - az); e2.set(dx - ax, dy - ay, dz - az);
        fn.crossVectors(e1, e2).normalize();
        let order = [a, b, d];
        if (fn.y < 0) { order = [a, d, b]; fn.negate(); }
        const j2 = 1 + (hash(mx, mz, 13) - 0.5) * 0.05;
        for (const v of order) { pos.push(vx[v], vy[v], vz[v]); nor.push(fn.x, fn.y, fn.z); cc.push(col[v * 3] * j2, col[v * 3 + 1] * j2, col[v * 3 + 2] * j2); }
      };
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const a = j * N + i, b = a + 1, d = a + N, e = d + 1;
        if ((i + j) & 1) { push(a, d, b); push(b, d, e); } else { push(a, d, e); push(a, e, b); }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
      geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, M.site);
      m.receiveShadow = true;
      m.name = 'terrain';
      api.siteGroup.add(m);
      return m;
    },
    pave(rect, y, f, seed = 3) {
      g.use(f.mat || 'satin');
      if (f.type !== 'marble' && f.type !== 'concrete' && f.type !== 'carpet' && f.type !== 'flat') {
        g.use('matte');
        g.bx(rect[0], y - 0.12, rect[1], rect[2], y - 0.002, rect[3], C(f.grout || shade(f.color, 0.7)));
        g.use(f.mat || 'satin');
      }
      if (f.type === 'flat') { g.bx(rect[0], y - 0.12, rect[1], rect[2], y + 0.012, rect[3], C(f.color), { top: C(f.color) }); return; }
      fillPattern(g, rect, y, f, seed);
    },
    kerb(a, b, y, h = 0.12, w = 0.15, col = P.kerb) {
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      g.use('satin');
      g.at((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, Math.atan2(-dz, dx));
      const n = Math.max(1, Math.round(L / 1.0));
      for (let i = 0; i < n; i++) g.cb(-L / 2 + (i * L) / n + 0.004, -0.2, -w / 2, -L / 2 + ((i + 1) * L) / n - 0.004, h, w / 2, 0.012, shade(col, 0.97 + hash(i, a[0]) * 0.06));
      g.pop();
    },
    item(t, x, y, z, r = 0, opts = {}) {
      g.use('matte');
      g.at(x, y, z, r);
      const meta = KIT[t](g, opts, {}) || {};
      g.pop();
      return meta;
    },
    hedge(a, b, h = 1.6, w = 0.7, col = '#466a36') {
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
      const n = Math.max(1, Math.round(L / 0.9));
      g.use('matte');
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, x = a[0] + dx * t, z = a[1] + dz * t;
        g.blob(x, S.ground(x, z) + h / 2, z, L / n * 0.75, h / 2, w / 2, mixc(col, '#557a40', hash(i, x) * 0.5), i + 3, { detail: 1, jitter: 0.08 });
      }
    },
    panelFence(a, b, o2 = {}) {
      const col = o2.color ?? '#33363a', h = o2.h ?? 1.5, base = o2.base ?? 0.2, post = 2.5;
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
      const n = Math.max(1, Math.round(L / post));
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        const x0 = a[0] + dx * t0, z0 = a[1] + dz * t0, x1 = a[0] + dx * t1, z1 = a[1] + dz * t1;
        const y0 = S.ground(x0, z0), y1 = S.ground(x1, z1), ym = Math.min(y0, y1);
        const segL = L / n;
        g.at((x0 + x1) / 2, ym, (z0 + z1) / 2, Math.atan2(-uz, ux));
        if (base > 0) { g.use('satin'); g.cb(-segL / 2 + 0.03, -0.25, -0.03, segL / 2 - 0.03, base, 0.03, 0.006, o2.baseCol ?? '#9d9a93'); }
        g.use('metal');
        g.bx(-segL / 2 - 0.03, -0.3, -0.02, -segL / 2 + 0.03, base + h + 0.05, 0.02, col);
        const bars = Math.round((segL - 0.1) / 0.2);
        for (let k = 0; k <= bars; k++) { const x = -segL / 2 + 0.05 + (k * (segL - 0.1)) / bars; g.bx(x - 0.003, base + 0.03, -0.004, x + 0.003, base + h, 0.004, col); }
        for (const yy of [base + 0.05, base + h * 0.45, base + h * 0.9, base + h - 0.01]) g.bx(-segL / 2 + 0.03, yy - 0.004, -0.006, segL / 2 - 0.03, yy + 0.004, 0.006, col);
        g.pop();
      }
      g.use('metal');
      g.box(b[0], S.ground(b[0], b[1]) + (base + h) / 2 - 0.1, b[1], 0.06, base + h + 0.2, 0.06, col);
    },
    woodFence(a, b, o2 = {}) {
      const col = o2.color ?? '#7a5f45', h = o2.h ?? 1.3;
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
      g.use('satin');
      g.at(a[0], 0, a[1], Math.atan2(-uz, ux));
      const posts = Math.max(1, Math.round(L / 2.2));
      for (let i = 0; i <= posts; i++) {
        const x = (i * L) / posts, wx = a[0] + ux * x, wz = a[1] + uz * x, y = S.ground(wx, wz);
        g.bx(x - 0.05, y - 0.3, -0.05, x + 0.05, y + h + 0.08, 0.05, shade(col, 0.85));
      }
      const y0 = S.ground(a[0], a[1]), y1 = S.ground(b[0], b[1]);
      for (const yy of [0.25, h - 0.2]) g.bx(0, Math.min(y0, y1) + yy, 0.05, L, Math.min(y0, y1) + yy + 0.08, 0.08, shade(col, 0.9));
      const boards = Math.round(L / 0.13);
      for (let i = 0; i < boards; i++) {
        const x = (i + 0.5) * (L / boards), wx = a[0] + ux * x, wz = a[1] + uz * x, y = S.ground(wx, wz);
        const hh = h - 0.04 + (i % 2) * 0.04;
        g.bx(x - 0.045, y + 0.06, 0.08, x + 0.045, y + hh, 0.1, shade(col, 0.92 + hash(i, a[0]) * 0.14));
        g.face([[x - 0.045, y + hh, 0.08], [x + 0.045, y + hh, 0.08], [x, y + hh + 0.05, 0.08]], [x, y, 0.2], shade(col, 0.95));
        g.face([[x - 0.045, y + hh, 0.1], [x + 0.045, y + hh, 0.1], [x, y + hh + 0.05, 0.1]], [x, y, -0.2], shade(col, 0.95));
      }
      g.pop();
    },
    swingGate(a, b, o2 = {}) {
      const col = o2.color ?? '#33363a', h = o2.h ?? 1.55, style = o2.style ?? 'bars';
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
      const y = S.ground((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      g.at(a[0], y, a[1], Math.atan2(-uz, ux));
      g.use(style === 'wood' ? 'satin' : 'metal');
      const pc = style === 'wood' ? '#5b4636' : col;
      g.bx(-0.08, -0.3, -0.08, 0.08, h + 0.25, 0.08, pc);
      g.bx(L - 0.08, -0.3, -0.08, L + 0.08, h + 0.25, 0.08, pc);
      const leaves = o2.leaves ?? (L > 2 ? 2 : 1);
      const lw = (L - 0.2) / leaves;
      for (let k = 0; k < leaves; k++) {
        const x0 = 0.1 + k * lw + 0.01, x1 = 0.1 + (k + 1) * lw - 0.01;
        if (style === 'wood') {
          for (let i = 0; i < Math.round((x1 - x0) / 0.13); i++) { const x = x0 + (i + 0.5) * 0.13; g.bx(x - 0.045, 0.08, -0.02, x + 0.045, h - 0.05 + (i % 2) * 0.04, 0.0, shade(o2.wood ?? '#7a5f45', 0.92 + hash(i, k) * 0.14)); }
          g.bx(x0, 0.3, -0.06, x1, 0.38, -0.02, '#6a5240');
          g.bx(x0, h - 0.4, -0.06, x1, h - 0.32, -0.02, '#6a5240');
          g.line([x0 + 0.05, 0.38, -0.04], [x1 - 0.05, h - 0.4, -0.04], 0.025, '#6a5240', 4);
        } else {
          g.bx(x0, 0.08, -0.025, x1, 0.14, 0.025, col);
          g.bx(x0, h - 0.06, -0.025, x1, h, 0.025, col);
          g.bx(x0, 0.08, -0.025, x0 + 0.05, h, 0.025, col);
          g.bx(x1 - 0.05, 0.08, -0.025, x1, h, 0.025, col);
          if (style === 'slats') for (let yy = 0.2; yy < h - 0.1; yy += 0.13) g.bx(x0 + 0.05, yy, -0.015, x1 - 0.05, yy + 0.09, 0.015, o2.slat ?? '#6b4f3a');
          else for (let xx = x0 + 0.13; xx < x1 - 0.06; xx += 0.12) g.bx(xx - 0.01, 0.14, -0.01, xx + 0.01, h - 0.06, 0.01, col);
        }
      }
      g.pop();
    },
    slidingGate(a, b, o2 = {}) {
      const h = o2.h ?? 1.6;
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
      const y = S.ground((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      g.at(a[0], y, a[1], Math.atan2(-uz, ux));
      g.use('metal');
      g.bx(-0.1, -0.3, -0.1, 0.1, h + 0.1, 0.1, '#2f3236');
      g.bx(L - 0.1, -0.3, -0.1, L + 0.1, h + 0.1, 0.1, '#2f3236');
      g.bx(0.12, 0.06, -0.03, L - 0.12, h, 0.03, '#2f3236');
      g.use('satin');
      for (let yy = 0.12; yy < h - 0.05; yy += 0.12) g.bx(0.18, yy, 0.03, L - 0.18, yy + 0.085, 0.05, shade(o2.slat ?? '#8a6446', 0.95 + hash(yy, L) * 0.1));
      g.use('matte');
      g.bx(-0.45, 0, 0.12, -0.15, 0.35, 0.32, '#2b2c2f');
      g.pop();
    },
    car(x, z, r, opts = {}) { S.item('car', x, S.ground(x, z), z, r, opts); },
    house(h) {
      const w = h.w, d = h.d, wh = h.h ?? 5.6, rh = h.roofH ?? 2.8, y = S.ground(h.x, h.z) - 0.1;
      g.use('satin');
      g.at(h.x, y, h.z, h.r ?? 0);
      g.bx(-w / 2, -0.3, -d / 2, w / 2, wh, d / 2, h.color ?? '#e6dfd2');
      g.bx(-w / 2 - 0.02, -0.3, -d / 2 - 0.02, w / 2 + 0.02, 0.45, d / 2 + 0.02, h.plinth ?? '#6b6863');
      const roof = h.roofCol ?? P.roofTile, ov = 0.45;
      if (h.roof === 'flat') {
        g.bx(-w / 2 - 0.05, wh, -d / 2 - 0.05, w / 2 + 0.05, wh + 0.45, d / 2 + 0.05, h.attic ?? '#d9d4ca');
      } else if (h.roof === 'hip') {
        g.face([[-w / 2 - ov, wh, -d / 2 - ov], [w / 2 + ov, wh, -d / 2 - ov], [w / 2 - d / 2 * 0.8, wh + rh, 0], [-w / 2 + d / 2 * 0.8, wh + rh, 0]], [0, wh, 0], roof);
        g.face([[-w / 2 - ov, wh, d / 2 + ov], [w / 2 + ov, wh, d / 2 + ov], [w / 2 - d / 2 * 0.8, wh + rh, 0], [-w / 2 + d / 2 * 0.8, wh + rh, 0]], [0, wh, 0], shade(roof, 0.9));
        g.face([[-w / 2 - ov, wh, -d / 2 - ov], [-w / 2 - ov, wh, d / 2 + ov], [-w / 2 + d / 2 * 0.8, wh + rh, 0]], [0, wh, 0], shade(roof, 0.95));
        g.face([[w / 2 + ov, wh, -d / 2 - ov], [w / 2 + ov, wh, d / 2 + ov], [w / 2 - d / 2 * 0.8, wh + rh, 0]], [0, wh, 0], shade(roof, 0.95));
      } else {
        for (const s of [-1, 1]) g.face([[-w / 2 - ov, wh - 0.1, s * (d / 2 + ov)], [w / 2 + ov, wh - 0.1, s * (d / 2 + ov)], [w / 2 + ov, wh + rh, 0], [-w / 2 - ov, wh + rh, 0]], [0, wh, 0], s > 0 ? roof : shade(roof, 0.88));
        for (const s of [-1, 1]) g.face([[s * w / 2, wh, -d / 2], [s * w / 2, wh, d / 2], [s * w / 2, wh + rh - 0.1, 0]], [0, wh, 0], h.color ?? '#e6dfd2');
        g.box(w * 0.25, wh + rh * 0.7, -d * 0.15, 0.5, rh * 1.0, 0.5, '#8a5a44');
      }
      g.use('matte');
      const rows = wh > 4 ? [1.0, 3.85] : [1.0];
      for (const s of [-1, 1]) for (const yy of rows) for (let i = 0; i < Math.floor(w / 2.6); i++) {
        const x = -w / 2 + (i + 0.5) * (w / Math.floor(w / 2.6));
        g.bx(x - 0.65, yy, s * (d / 2) - 0.01, x + 0.65, yy + 1.35, s * (d / 2) + 0.01, '#f2f1ec');
        g.bx(x - 0.58, yy + 0.07, s * (d / 2) - 0.02, x + 0.58, yy + 1.28, s * (d / 2) + 0.02, '#3f4b55');
      }
      for (const s of [-1, 1]) for (const yy of rows) for (let i = 0; i < Math.floor(d / 3); i++) {
        const z = -d / 2 + (i + 0.5) * (d / Math.floor(d / 3));
        g.bx(s * (w / 2) - 0.01, yy, z - 0.55, s * (w / 2) + 0.01, yy + 1.35, z + 0.55, '#f2f1ec');
        g.bx(s * (w / 2) - 0.02, yy + 0.07, z - 0.48, s * (w / 2) + 0.02, yy + 1.28, z + 0.48, '#3f4b55');
      }
      if (h.door !== false) g.bx(-0.5, 0.0, d / 2 - 0.01, 0.5, 2.15, d / 2 + 0.04, h.doorCol ?? '#5a3d2b');
      g.pop();
    },
    block(b) {
      const fl = b.floors, fh = b.fh ?? 2.8, y0 = b.y ?? 0, w = b.x1 - b.x0, d = b.z1 - b.z0, H = fl * fh + (b.base ?? 0.8);
      const col = b.color ?? '#e4e0d6', accent = b.accent ?? '#9fae9a';
      g.use('satin');
      g.bx(b.x0, y0 - 0.3, b.z0, b.x1, y0 + H, b.z1, col, { top: '#6f6c66' });
      g.bx(b.x0 - 0.02, y0 - 0.3, b.z0 - 0.02, b.x1 + 0.02, y0 + (b.base ?? 0.8), b.z1 + 0.02, '#6d6a65');
      g.bx(b.x0 - 0.05, y0 + H, b.z0 - 0.05, b.x1 + 0.05, y0 + H + 0.45, b.z1 + 0.05, shade(col, 0.95), { top: '#8a8780' });
      g.use('matte');
      g.bx(b.x0 + 0.25, y0 + H + 0.2, b.z0 + 0.25, b.x1 - 0.25, y0 + H + 0.25, b.z1 - 0.25, '#56585b');
      const bay = b.bay ?? 3.0;
      for (const face of b.faces ?? ['S', 'N']) {
        const along = face === 'S' || face === 'N' ? w : d;
        const n = Math.floor(along / bay);
        for (let f = 0; f < fl; f++) {
          if (b.skipFloor && b.skipFloor(f)) continue;
          const yy = y0 + (b.base ?? 0.8) + f * fh;
          for (let i = 0; i < n; i++) {
            const t = (i + 0.5) / n;
            if (b.skip && b.skip(face, f, i)) continue;
            const ww = (i % 3 === 1 && b.balconies?.includes(face)) ? 0.9 : 1.45;
            const hh = ww < 1 ? 2.2 : 1.45, sill = ww < 1 ? 0.0 : 0.85;
            const P0 = (u, v, yv) => face === 'S' ? [b.x0 + u, yv, b.z1 + v] : face === 'N' ? [b.x1 - u, yv, b.z0 - v] : face === 'E' ? [b.x1 + v, yv, b.z0 + u] : [b.x0 - v, yv, b.z1 - u];
            const u = t * along;
            const rect = (u0, u1, ya, yb, v, c) => { const a = P0(u0, 0, ya), bb = P0(u1, v, yb); g.bx(Math.min(a[0], bb[0]), ya, Math.min(a[2], bb[2]), Math.max(a[0], bb[0]), yb, Math.max(a[2], bb[2]), c); };
            rect(u - ww / 2 - 0.07, u + ww / 2 + 0.07, yy + sill - 0.07, yy + sill + hh + 0.07, 0.015, '#f3f2ee');
            rect(u - ww / 2, u + ww / 2, yy + sill, yy + sill + hh, 0.022, hash(f, i, face.charCodeAt(0)) < 0.25 ? '#5d6b74' : '#3c4852');
            if (hash(i, f, 7) < 0.3) rect(u - ww / 2, u + ww / 2, yy + sill + hh * 0.55, yy + sill + hh, 0.024, '#d8d2c4');
            if (ww < 1 && b.balconies?.includes(face)) {
              g.use('satin');
              rect(u - 1.6, u + 1.6, yy - 0.18, yy, 1.3, '#bcb8b0');
              g.use('matte');
              const a2 = P0(u - 1.6, 1.25, yy), b2 = P0(u + 1.6, 1.3, yy + 1.05);
              g.bx(Math.min(a2[0], b2[0]), yy, Math.min(a2[2], b2[2]), Math.max(a2[0], b2[0]), yy + 1.05, Math.max(a2[2], b2[2]), accent);
              if (hash(f, i, 3) < 0.5) { const pp = P0(u + 1.0, 0.6, yy); g.blob(pp[0], yy + 0.45, pp[2], 0.3, 0.35, 0.3, '#5d7a42', f + i, { detail: 0 }); }
            }
            g.use('matte');
          }
        }
      }
      if (b.entrance) {
        const e = b.entrance;
        g.use('satin');
        g.bx(e.x - 1.4, y0 + 2.6, e.z - 1.6, e.x + 1.4, y0 + 2.8, e.z, '#a9a59d');
        g.use('matte');
        g.bx(e.x - 0.75, y0 - 0.1, e.z - 0.03, e.x + 0.75, y0 + 2.4, e.z + 0.02, '#2f3a42');
        g.bx(e.x - 0.7, y0 + 0.1, e.z + 0.02, e.x + 0.7, y0 + 2.3, e.z + 0.04, '#6f8796');
      }
    },
    water(w) {
      const mat = waterMaterial(w);
      const geo = new THREE.PlaneGeometry(w.x1 - w.x0, w.z1 - w.z0, 1, 1);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, mat);
      m.position.set((w.x0 + w.x1) / 2, w.y, (w.z0 + w.z1) / 2);
      m.receiveShadow = false;
      m.name = 'water';
      m.renderOrder = 1;
      api.siteGroup.add(m);
      return m;
    },
    finish(parent = api.siteGroup) {
      for (const key of ['matte', 'matte2', 'satin', 'gloss', 'metal']) {
        const geo = g.geometry(key);
        if (!geo) continue;
        const m = new THREE.Mesh(geo, M[key === 'matte' ? 'site' : key === 'matte2' ? 'site2' : key]);
        m.castShadow = true;
        m.receiveShadow = true;
        m.name = `site-${key}`;
        parent.add(m);
      }
      const gl = g.geometry('glass');
      if (gl) { const m = new THREE.Mesh(gl, M.glass); m.name = 'site-glass'; parent.add(m); }
      const tint = new THREE.Color(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      for (const [type, list] of trees) {
        const geo = treeGeo(type);
        const mesh = new THREE.InstancedMesh(geo, M.tree, list.length);
        list.forEach((it, i) => {
          mesh.setMatrixAt(i, m4.compose(p.set(it.x, it.y - 0.05, it.z), q.setFromAxisAngle(up, it.ry), sc.setScalar(it.s)));
          tint.setRGB(1, 1, 1).offsetHSL((hash(it.x, it.z, 1) - 0.5) * 0.025, (hash(it.x, it.z, 2) - 0.5) * 0.08, (hash(it.x, it.z, 3) - 0.5) * 0.07);
          mesh.setColorAt(i, tint);
        });
        mesh.castShadow = !['flowers', 'grasses', 'reeds'].includes(type);
        mesh.receiveShadow = true;
        mesh.name = `trees-${type}`;
        mesh.computeBoundingSphere();
        parent.add(mesh);
      }
      if (tufts.length) {
        const mesh = new THREE.InstancedMesh(tuftGeo(), M.leaf, tufts.length);
        tufts.forEach((it, i) => {
          mesh.setMatrixAt(i, m4.compose(p.set(it.x, it.y, it.z), q.setFromAxisAngle(up, hash(it.x, it.z) * TAU), sc.set(it.s, it.s * (0.8 + hash(it.z, it.x) * 0.6), it.s)));
          lawnColor(it.x, it.z, tint);
          tint.multiplyScalar(1.25);
          mesh.setColorAt(i, tint);
        });
        mesh.receiveShadow = true;
        mesh.name = 'grass';
        mesh.computeBoundingSphere();
        parent.add(mesh);
      }
    }
  };
  return S;
}

const WV = `
varying vec3 vW;
#include <fog_pars_vertex>
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const WF = `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uSkyTop;
uniform vec3 uSkyHor;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uBank;
uniform vec3 uTree;
uniform float uBankZ;
uniform float uFarZ;
uniform float uFlow;
varying vec3 vW;
#include <fog_pars_fragment>
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
void main() {
  float near = clamp((vW.z - uBankZ) * 0.22, 0.0, 1.0);
  float far = clamp((uFarZ - vW.z) * 0.22, 0.0, 1.0);
  float depth = min(near, far);
  vec2 fp = vec2(vW.x + uTime * uFlow, vW.z);
  float n1 = vn(fp * vec2(0.32, 0.55) + vec2(0.0, uTime * 0.07));
  float n2 = vn(fp * vec2(1.1, 1.6) - vec2(uTime * 0.25, 0.0) + 5.0);
  float n3 = vn(fp * vec2(0.07, 0.28) + 11.0);
  vec3 n = normalize(vec3((n1 - 0.5) * 0.09 + (n2 - 0.5) * 0.05, 1.0, (n1 - n3) * 0.1 + (n2 - 0.5) * 0.04));
  vec3 body = mix(uShallow, uDeep, smoothstep(0.15, 1.0, depth));
  float band = vn(vec2((vW.x + uTime * uFlow * 1.6) * 0.022, vW.z * 0.21)) * vn(vec2((vW.x + uTime * uFlow) * 0.009, vW.z * 0.07 + 3.0));
  body *= 0.93 + band * 0.22;
  vec3 v = normalize(cameraPosition - vW);
  vec3 rv = reflect(-v, n);
  rv.y = max(rv.y, 0.002);
  vec3 sky = mix(uSkyHor, uSkyTop, pow(rv.y, 0.55));
  float t = (uFarZ - vW.z) / max(rv.z, 0.0001);
  float hy = rv.y * t;
  float onBank = step(0.0, rv.z) * (1.0 - smoothstep(9.0, 15.0, hy));
  vec3 bankRefl = mix(uBank, uTree, smoothstep(0.6, 2.5, hy));
  vec3 refl = mix(sky, bankRefl, onBank);
  float tn = (vW.z - uBankZ) / max(-rv.z, 0.0001);
  float hn = rv.y * tn;
  float onNear = step(rv.z, 0.0) * (1.0 - smoothstep(4.0, 12.0, hn));
  refl = mix(refl, mix(uBank, uTree, smoothstep(0.5, 2.0, hn)), onNear * 0.85);
  float fres = 0.025 + 0.975 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 col = mix(body * 0.95, refl, clamp(fres * 1.15, 0.0, 0.9));
  float rs = max(dot(rv, uSunDir), 0.0);
  col += uSunCol * (pow(rs, 320.0) * 1.8 + pow(rs, 30.0) * 0.06);
  float foam = 1.0 - smoothstep(0.0, 0.12, near);
  col = mix(col, vec3(0.82, 0.81, 0.74), foam * 0.25 * smoothstep(0.35, 0.75, vn(vW.xz * 2.2 + uTime * 0.4)));
  gl_FragColor = vec4(col, mix(0.55, 1.0, smoothstep(0.02, 0.4, near)));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

export function waterMaterial(w) {
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 12.0 }, uFlow: { value: 0.45 },
    uSunDir: { value: new THREE.Vector3(0.45, 0.7, 0.55).normalize() }, uSunCol: { value: new THREE.Color('#ffe9c8') },
    uSkyTop: { value: new THREE.Color('#6d9bc9') }, uSkyHor: { value: new THREE.Color('#d9e2e2') },
    uDeep: { value: new THREE.Color('#3d5a4e') }, uShallow: { value: new THREE.Color('#6f8c6b') },
    uBank: { value: new THREE.Color('#58603a') }, uTree: { value: new THREE.Color('#2f4026') },
    uBankZ: { value: w.bankZ ?? 0 }, uFarZ: { value: w.farZ ?? 100 }
  }]);
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: WV, fragmentShader: WF, fog: true, transparent: true, depthWrite: true });
  m.userData.water = true;
  return m;
}

export function jetty(S, x, z, len, w = 1.6, yTop = 0.2, yaw = 0) {
  const g = S.g;
  g.use('satin');
  g.at(x, 0, z, yaw);
  const boards = Math.round(len / 0.16);
  for (let i = 0; i < boards; i++) {
    const zz = i * 0.16;
    g.bx(-w / 2, yTop - 0.04, zz + 0.006, w / 2, yTop, zz + 0.15, shade('#8c6a4c', 0.88 + hash(i, x) * 0.2));
  }
  for (let i = 0; i <= Math.round(len / 1.8); i++) {
    const zz = Math.min(len - 0.1, i * 1.8);
    for (const s of [-1, 1]) g.cyl(s * (w / 2 - 0.05), -2.2, zz, 0.08, 0.08, yTop + 2.15 + (i === Math.round(len / 1.8) ? 0.5 : 0), 7, '#5d4a36');
    g.bx(-w / 2, yTop - 0.18, zz - 0.05, w / 2, yTop - 0.04, zz + 0.05, '#6b543d');
  }
  for (const s of [-1, 1]) g.bx(s * (w / 2 - 0.05) - 0.04, yTop - 0.18, 0, s * (w / 2 - 0.05) + 0.04, yTop - 0.04, len, '#6b543d');
  g.pop();
}

export function boat(S, x, y, z, yaw = 0, col = '#3f5f6f') {
  const g = S.g;
  g.use('satin');
  g.at(x, y, z, yaw);
  const L = 3.6, W = 1.25;
  const prof = (t) => W / 2 * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.85));
  for (let i = 0; i < 8; i++) {
    const t0 = i / 8, t1 = (i + 1) / 8, z0 = -L / 2 + t0 * L, z1 = -L / 2 + t1 * L;
    const a0 = prof(t0), a1 = prof(t1);
    for (const s of [-1, 1]) {
      g.face([[s * a0, 0.45, z0], [s * a1, 0.45, z1], [s * a1 * 0.6, 0.0, z1], [s * a0 * 0.6, 0.0, z0]], [0, 0.3, (z0 + z1) / 2], col);
      g.face([[s * a0 * 0.92, 0.45, z0], [s * a1 * 0.92, 0.45, z1], [s * a1 * 0.55, 0.06, z1], [s * a0 * 0.55, 0.06, z0]], [s * 3, 0.3, (z0 + z1) / 2], '#b9a582');
    }
    g.face([[-a0 * 0.6, 0.0, z0], [a0 * 0.6, 0.0, z0], [a1 * 0.6, 0.0, z1], [-a1 * 0.6, 0.0, z1]], [0, 1, (z0 + z1) / 2], shade(col, 0.7));
    g.face([[-a0 * 0.55, 0.06, z0], [a0 * 0.55, 0.06, z0], [a1 * 0.55, 0.06, z1], [-a1 * 0.55, 0.06, z1]], [0, -1, (z0 + z1) / 2], '#a8946f');
  }
  g.bx(-0.55, 0.28, -0.2, 0.55, 0.33, 0.1, '#9a7a56');
  g.bx(-0.45, 0.28, 1.0, 0.45, 0.33, 1.25, '#9a7a56');
  g.use('metal');
  g.line([0.5, 0.35, -0.1], [1.6, 0.25, -0.4], 0.02, '#b9a582', 4);
  g.pop();
}

export function kayak(S, x, y, z, yaw = 0, col = '#d9682f') {
  const g = S.g;
  g.use('gloss');
  g.at(x, y, z, yaw);
  g.sc(1, 1, 5.5);
  g.sphere(0, 0.12, 0, 0.32, 10, 6, col);
  g.pop();
  g.pop();
  g.at(x, y, z, yaw);
  g.use('matte');
  g.cyl(0, 0.2, 0.2, 0.2, 0.2, 0.05, 12, '#1d1e20');
  g.pop();
}

// Instalator buildings: flat-shaded vertex-coloured geometry soup (transform stack, baked AO, chamfered boxes, lathes, blobs) merged per material.

import * as THREE from 'three';

const cache = new Map();

export function C(c) {
  if (c && c.isColor) return c;
  let k = cache.get(c);
  if (!k) { k = new THREE.Color(c); cache.set(c, k); }
  return k;
}

export const shade = (c, k) => C(c).clone().multiplyScalar(k);
export const mixc = (a, b, t) => C(a).clone().lerp(C(b), t);
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

export function hash(x, y = 0, z = 0) {
  let h = Math.imul(Math.round(x * 997) | 0, 374761393) ^ Math.imul(Math.round(y * 991) | 0, 668265263) ^ Math.imul(Math.round(z * 983) | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function rng(seed) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function noise2(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const h = (a, b) => hash(a + s * 17.13, b - s * 3.7, s);
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x, y, oct = 3, s = 0) {
  let t = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { t += a * noise2(x * f, y * f, s + i * 7); n += a; a *= 0.5; f *= 2.03; }
  return t / n;
}

const ICO = [new THREE.IcosahedronGeometry(1, 0).attributes.position.array, new THREE.IcosahedronGeometry(1, 1).attributes.position.array];

export class Geo {
  constructor() {
    this.bk = new Map();
    this.m = new THREE.Matrix4();
    this.st = [];
    this.key = 'matte';
    this.ao = null;
    this.jit = 0;
    this.cap = 0;
  }

  use(key) { if (!this.lock) this.key = key; return this; }

  get(key) {
    let b = this.bk.get(key);
    if (!b) { b = { p: [], c: [], f: [] }; this.bk.set(key, b); }
    return b;
  }

  push(m) { this.st.push(this.m.clone()); this.m.multiply(m); return this; }

  pop() { this.m = this.st.pop(); return this; }

  at(x, y, z, ry = 0, rx = 0, rz = 0, s = 1) {
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
    if (s !== 1) m.scale(new THREE.Vector3(s, s, s));
    m.setPosition(x, y, z);
    return this.push(m);
  }

  sc(sx, sy, sz) { return this.push(new THREE.Matrix4().makeScale(sx, sy, sz)); }

  tri(a, b, c, col, cb, cc) {
    const B = this.get(this.key), e = this.m.elements, P = B.p;
    const tx = (v) => e[0] * v[0] + e[4] * v[1] + e[8] * v[2] + e[12];
    const ty = (v) => e[1] * v[0] + e[5] * v[1] + e[9] * v[2] + e[13];
    const tz = (v) => e[2] * v[0] + e[6] * v[1] + e[10] * v[2] + e[14];
    const ax = tx(a), ay = ty(a), az = tz(a), bx = tx(b), by = ty(b), bz = tz(b), cx = tx(c), cy = ty(c), cz = tz(c);
    P.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    let j = 1;
    if (this.jit) j = 1 + (hash((ax + bx + cx) / 3, (ay + by + cy) / 3, (az + bz + cz) / 3) - 0.5) * 2 * this.jit;
    const k0 = C(col), k1 = cb ? C(cb) : k0, k2 = cc ? C(cc) : k0;
    const ao = this.ao;
    const f = (y) => (ao ? ao.min + (1 - ao.min) * smooth(0, ao.h, y - ao.y0) : 1) * j;
    const fa = f(ay), fb = f(by), fc = f(cy);
    B.c.push(k0.r * fa, k0.g * fa, k0.b * fa, k1.r * fb, k1.g * fb, k1.b * fb, k2.r * fc, k2.g * fc, k2.b * fc);
    const cp = this.cap;
    B.f.push(cp, cp, cp);
    return this;
  }

  quad(a, b, c, d, col, cb, cc, cd) {
    this.tri(a, b, c, col, cb || col, cc || col);
    return this.tri(a, c, d, col, cc || col, cd || col);
  }

  face(pts, ctr, col) {
    const a = pts[0], b = pts[1], c = pts[2];
    const nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]);
    const ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]);
    const nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    let mx = 0, my = 0, mz = 0;
    for (const p of pts) { mx += p[0]; my += p[1]; mz += p[2]; }
    mx /= pts.length; my /= pts.length; mz /= pts.length;
    const flip = nx * (mx - ctr[0]) + ny * (my - ctr[1]) + nz * (mz - ctr[2]) < 0;
    const q = flip ? pts.slice().reverse() : pts;
    for (let i = 1; i < q.length - 1; i++) this.tri(q[0], q[i], q[i + 1], col);
    return this;
  }

  bx(x0, y0, z0, x1, y1, z1, col, o = {}) {
    const top = o.top || col, side = o.side || col, sk = o.skip || '';
    if (!sk.includes('t')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], top);
    if (!sk.includes('b')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], o.bottom || side);
    if (!sk.includes('f')) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], o.front || side);
    if (!sk.includes('k')) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], o.back || side);
    if (!sk.includes('r')) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], o.right || side);
    if (!sk.includes('l')) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], o.left || side);
    return this;
  }

  box(cx, cy, cz, sx, sy, sz, col, o) {
    return this.bx(cx - sx / 2, cy - sy / 2, cz - sz / 2, cx + sx / 2, cy + sy / 2, cz + sz / 2, col, o);
  }

  cb(x0, y0, z0, x1, y1, z1, bev, col, o = {}) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    const X = (x1 - x0) / 2, Y = (y1 - y0) / 2, Z = (z1 - z0) / 2;
    const b = Math.min(bev, X * 0.95, Y * 0.95, Z * 0.95);
    if (b < 0.002) return this.bx(x0, y0, z0, x1, y1, z1, col, o);
    const Xi = X - b, Yi = Y - b, Zi = Z - b, ctr = [cx, cy, cz];
    const P = (x, y, z) => [cx + x, cy + y, cz + z];
    const top = o.top || col, front = o.front || col, bottom = o.bottom || col;
    const S = [-1, 1];
    for (const s of S) {
      this.face([P(s * X, -Yi, -Zi), P(s * X, Yi, -Zi), P(s * X, Yi, Zi), P(s * X, -Yi, Zi)], ctr, col);
      this.face([P(-Xi, s * Y, -Zi), P(Xi, s * Y, -Zi), P(Xi, s * Y, Zi), P(-Xi, s * Y, Zi)], ctr, s > 0 ? top : bottom);
      this.face([P(-Xi, -Yi, s * Z), P(Xi, -Yi, s * Z), P(Xi, Yi, s * Z), P(-Xi, Yi, s * Z)], ctr, s > 0 ? front : col);
    }
    for (const si of S) for (const sj of S) {
      this.face([P(si * X, sj * Yi, -Zi), P(si * X, sj * Yi, Zi), P(si * Xi, sj * Y, Zi), P(si * Xi, sj * Y, -Zi)], ctr, sj > 0 ? top : col);
      this.face([P(si * X, -Yi, sj * Zi), P(si * X, Yi, sj * Zi), P(si * Xi, Yi, sj * Z), P(si * Xi, -Yi, sj * Z)], ctr, sj > 0 ? front : col);
      this.face([P(-Xi, si * Y, sj * Zi), P(Xi, si * Y, sj * Zi), P(Xi, si * Yi, sj * Z), P(-Xi, si * Yi, sj * Z)], ctr, si > 0 ? top : col);
      for (const sk of S) this.face([P(si * X, sj * Yi, sk * Zi), P(si * Xi, sj * Y, sk * Zi), P(si * Xi, sj * Yi, sk * Z)], ctr, sj > 0 ? top : col);
    }
    return this;
  }

  cyl(cx, y0, cz, r0, r1, h, seg, col, o = {}) {
    const y1 = y0 + h, ctr = [cx, y0 + h / 2, cz], rot = o.rot || 0, top = o.top || col;
    for (let i = 0; i < seg; i++) {
      const a0 = rot + (i / seg) * Math.PI * 2, a1 = rot + ((i + 1) / seg) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const sc = o.alt && i % 2 ? o.alt : col;
      this.face([[cx + c0 * r0, y0, cz + s0 * r0], [cx + c1 * r0, y0, cz + s1 * r0], [cx + c1 * r1, y1, cz + s1 * r1], [cx + c0 * r1, y1, cz + s0 * r1]], ctr, sc);
    }
    const cap = (y, r, c, up) => {
      if (r <= 0) return;
      const pts = [];
      for (let i = 0; i < seg; i++) { const a = rot + (i / seg) * Math.PI * 2; pts.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]); }
      this.face(pts, [cx, up ? y - 1 : y + 1, cz], c);
    };
    if (!o.noTop) cap(y1, r1, top, true);
    if (!o.noBottom) cap(y0, r0, o.bottom || col, false);
    return this;
  }

  lathe(prof, seg, col, o = {}) {
    const rot = o.rot || 0;
    for (let k = 0; k < prof.length - 1; k++) {
      const [r0, y0] = prof[k], [r1, y1] = prof[k + 1];
      const nl = Math.hypot(y1 - y0, r1 - r0) || 1;
      const nr = (y1 - y0) / nl, ny = -(r1 - r0) / nl;
      const pc = o.cols ? o.cols[k] || col : col;
      for (let i = 0; i < seg; i++) {
        const a0 = rot + (i / seg) * Math.PI * 2, a1 = rot + ((i + 1) / seg) * Math.PI * 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const am = (a0 + a1) / 2;
        const ctr = [(Math.cos(am) * (r0 + r1) / 2) - Math.cos(am) * nr * 10, (y0 + y1) / 2 - ny * 10, (Math.sin(am) * (r0 + r1) / 2) - Math.sin(am) * nr * 10];
        const pts = [];
        if (r0 > 1e-5) pts.push([c0 * r0, y0, s0 * r0], [c1 * r0, y0, s1 * r0]); else pts.push([0, y0, 0]);
        if (r1 > 1e-5) pts.push([c1 * r1, y1, s1 * r1], [c0 * r1, y1, s0 * r1]); else pts.push([0, y1, 0]);
        if (pts.length >= 3) this.face(pts, ctr, o.alt && i % 2 ? o.alt : pc);
      }
    }
    return this;
  }

  sphere(cx, cy, cz, r, ws, hs, col) {
    const prof = [];
    for (let i = 0; i <= hs; i++) { const a = -Math.PI / 2 + (i / hs) * Math.PI; prof.push([Math.cos(a) * r, Math.sin(a) * r]); }
    this.at(cx, cy, cz);
    this.lathe(prof, ws, col);
    return this.pop();
  }

  blob(cx, cy, cz, rx, ry, rz, col, seed = 1, o = {}) {
    const src = ICO[o.detail ?? 1], jit = o.jitter ?? 0.12, base = C(col);
    const lo = o.lo ? C(o.lo) : base.clone().multiplyScalar(0.62), hi = o.hi ? C(o.hi) : base.clone().lerp(new THREE.Color(1, 1, 0.92), 0.12);
    const v = (i) => {
      const x = src[i], y = src[i + 1], z = src[i + 2];
      const j = 1 + (hash(x * 3.1 + seed, y * 3.7 - seed, z * 2.9) - 0.5) * 2 * jit;
      let yy = y;
      if (o.flat && yy < -0.2) yy = -0.2 + (yy + 0.2) * 0.25;
      return [cx + x * rx * j, cy + yy * ry * j, cz + z * rz * j];
    };
    const tc = new THREE.Color();
    for (let i = 0; i < src.length; i += 9) {
      const a = v(i), b = v(i + 3), d = v(i + 6);
      const t = clamp(((a[1] + b[1] + d[1]) / 3 - (cy - ry)) / (2 * ry), 0, 1);
      tc.copy(lo).lerp(base, smooth(0, 0.55, t)).lerp(hi, smooth(0.55, 1, t) * 0.8).multiplyScalar(1 + (hash(i, seed) - 0.5) * 0.08);
      this.face([a, b, d], [cx, cy, cz], tc.clone());
    }
    return this;
  }

  poly(pts, y, col, up = true) {
    const contour = pts.map((p) => new THREE.Vector2(p[0], p[1]));
    const tris = THREE.ShapeUtils.triangulateShape(contour, []);
    for (const [i, j, k] of tris) {
      const a = [pts[i][0], y, pts[i][1]], b = [pts[j][0], y, pts[j][1]], c = [pts[k][0], y, pts[k][1]];
      this.face([a, b, c], [a[0], up ? y - 1 : y + 1, a[2]], col);
    }
    return this;
  }

  prism(pts, y0, y1, col, o = {}) {
    if (!o.noTop) this.poly(pts, y1, o.top || col, true);
    if (!o.noBottom) this.poly(pts, y0, o.bottom || col, false);
    let area = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
    const sgn = area > 0 ? 1 : -1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const nx = dz * sgn, nz = -dx * sgn;
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      this.face([[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], [mx - nx, (y0 + y1) / 2, mz - nz], o.side || col);
    }
    return this;
  }

  line(a, b, r, col, seg = 6, o = {}) {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = d.length();
    if (len < 1e-5) return this;
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    this.push(new THREE.Matrix4().compose(new THREE.Vector3(a[0], a[1], a[2]), q, new THREE.Vector3(1, 1, 1)));
    this.cyl(0, 0, 0, r, o.r1 ?? r, len, seg, col, o);
    return this.pop();
  }

  tube(pts, r, col, seg = 6) {
    for (let i = 0; i < pts.length - 1; i++) this.line(pts[i], pts[i + 1], r, col, seg);
    return this;
  }

  slab(pts, y0, y1, col, o) { return this.prism(pts, y0, y1, col, o); }

  merge(g) {
    for (const [k, b] of g.bk) {
      const t = this.get(k);
      for (let i = 0; i < b.p.length; i++) t.p.push(b.p[i]);
      for (let i = 0; i < b.c.length; i++) t.c.push(b.c[i]);
      for (let i = 0; i < b.f.length; i++) t.f.push(b.f[i]);
    }
    return this;
  }

  tris(key) { const b = this.bk.get(key); return b ? b.p.length / 9 : 0; }

  geometry(key, o = {}) {
    const b = this.bk.get(key);
    if (!b || !b.p.length) return null;
    const pos = new Float32Array(b.p);
    const n = pos.length / 3;
    const nor = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 3) {
      const o9 = i * 3;
      const ux = pos[o9 + 3] - pos[o9], uy = pos[o9 + 4] - pos[o9 + 1], uz = pos[o9 + 5] - pos[o9 + 2];
      const vx = pos[o9 + 6] - pos[o9], vy = pos[o9 + 7] - pos[o9 + 1], vz = pos[o9 + 8] - pos[o9 + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      for (let k = 0; k < 3; k++) { nor[o9 + k * 3] = nx; nor[o9 + k * 3 + 1] = ny; nor[o9 + k * 3 + 2] = nz; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(b.c), 3));
    if (o.cap) g.setAttribute('aCap', new THREE.BufferAttribute(new Float32Array(b.f), 1));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
}

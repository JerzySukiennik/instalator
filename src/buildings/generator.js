// Instalator buildings: turns a layout spec into meshes (walls per floor and side with section caps, floors, doors, windows, stairs, fixtures) and BuildingData.

import * as THREE from 'three';
import { Geo, C, shade, mixc, clamp, smooth, hash, rng, noise2, fbm } from './geo.js';
import { P, materials, wallMaterial, wallGlassMaterial, fixtureMaterial } from './palette.js';
import { KIT, LIGHTS, bulbInto } from './furniture.js';

export const r3 = (v) => Math.round(v * 1000) / 1000;
const OPEN = new Set(['balcony', 'terrace', 'outdoor']);
const YAW = (nx, nz) => Math.atan2(nx, nz);

export function qYaw(yaw) {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  return [r3(q.x), r3(q.y), r3(q.z), r3(q.w)];
}

export function pip(x, z, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ins = !ins;
  }
  return ins;
}

export function rectsOf(poly) {
  const xs = [...new Set(poly.map((p) => Math.round(p[0] * 1e4) / 1e4))].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i], x1 = xs[i + 1], xm = (x0 + x1) / 2;
    const zs = [];
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k], b = poly[(k + 1) % poly.length];
      if (Math.abs(a[1] - b[1]) < 1e-6 && (a[0] - xm) * (b[0] - xm) < 0) zs.push(a[1]);
    }
    zs.sort((a, b) => a - b);
    for (let j = 0; j + 1 < zs.length; j += 2) out.push([x0, zs[j], x1, zs[j + 1]]);
  }
  return out;
}

function polyArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return a / 2;
}

function insetPoly(poly, walls) {
  const n = poly.length, ccw = polyArea(poly) > 0, subs = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    const horiz = Math.abs(a[1] - b[1]) < 1e-6;
    const dx = Math.sign(b[0] - a[0]), dz = Math.sign(b[1] - a[1]);
    const nin = ccw ? [-dz, dx] : [dz, -dx];
    const line = horiz ? a[1] : a[0];
    const lo = horiz ? Math.min(a[0], b[0]) : Math.min(a[1], b[1]), hi = horiz ? Math.max(a[0], b[0]) : Math.max(a[1], b[1]);
    const cov = [];
    for (const w of walls) {
      const wh = Math.abs(w.a[1] - w.b[1]) < 1e-6, wv = Math.abs(w.a[0] - w.b[0]) < 1e-6;
      if (horiz && wh && Math.abs(w.a[1] - line) < 0.003) cov.push([Math.min(w.a[0], w.b[0]), Math.max(w.a[0], w.b[0]), w.t / 2]);
      if (!horiz && wv && Math.abs(w.a[0] - line) < 0.003) cov.push([Math.min(w.a[1], w.b[1]), Math.max(w.a[1], w.b[1]), w.t / 2]);
    }
    const bps = new Set([lo, hi]);
    for (const c of cov) { if (c[0] > lo + 1e-6 && c[0] < hi - 1e-6) bps.add(c[0]); if (c[1] > lo + 1e-6 && c[1] < hi - 1e-6) bps.add(c[1]); }
    const arr = [...bps].sort((p, q) => p - q);
    if (horiz ? b[0] < a[0] : b[1] < a[1]) arr.reverse();
    for (let k = 0; k < arr.length - 1; k++) {
      const mid = (arr[k] + arr[k + 1]) / 2;
      let off = 0;
      for (const c of cov) if (mid > c[0] && mid < c[1]) off = Math.max(off, c[2]);
      subs.push({ horiz, line, s1: arr[k + 1], off, ol: line + (horiz ? nin[1] : nin[0]) * off });
    }
  }
  const pts = [];
  for (let i = 0; i < subs.length; i++) {
    const e = subs[i], f = subs[(i + 1) % subs.length];
    if (e.horiz !== f.horiz) pts.push(e.horiz ? [f.ol, e.ol] : [e.ol, f.ol]);
    else if (Math.abs(e.ol - f.ol) > 1e-6) {
      pts.push(e.horiz ? [e.s1, e.ol] : [e.ol, e.s1]);
      pts.push(f.horiz ? [e.s1, f.ol] : [f.ol, e.s1]);
    }
  }
  const out = [];
  for (const p of pts) {
    const q = [r3(p[0]), r3(p[1])];
    const l = out[out.length - 1];
    if (!l || Math.abs(l[0] - q[0]) > 1e-4 || Math.abs(l[1] - q[1]) > 1e-4) out.push(q);
  }
  if (out.length > 1 && Math.abs(out[0][0] - out[out.length - 1][0]) < 1e-4 && Math.abs(out[0][1] - out[out.length - 1][1]) < 1e-4) out.pop();
  return out;
}

function clipQuad(q, x0, z0, x1, z1) {
  let pts = q;
  const planes = [[(p) => p[0] >= x0, (a, b) => (x0 - a[0]) / (b[0] - a[0])], [(p) => p[0] <= x1, (a, b) => (x1 - a[0]) / (b[0] - a[0])], [(p) => p[1] >= z0, (a, b) => (z0 - a[1]) / (b[1] - a[1])], [(p) => p[1] <= z1, (a, b) => (z1 - a[1]) / (b[1] - a[1])]];
  for (const [inside, tf] of planes) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], ia = inside(a), ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) { const t = tf(a, b); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    pts = out;
    if (pts.length < 3) return null;
  }
  return pts;
}

class Overlay {
  constructor() { this.p = []; this.c = []; }
  quad(a, b, c, d, al) {
    const v = [a, b, c, a, c, d], A = [al[0], al[1], al[2], al[0], al[2], al[3]];
    for (let i = 0; i < 6; i++) { this.p.push(v[i][0], v[i][1], v[i][2]); this.c.push(0, 0, 0, A[i]); }
  }
  strip(ax, az, bx, bz, nx, nz, y, w, a0) {
    this.quad([ax, y, az], [bx, y, bz], [bx + nx * w, y, bz + nz * w], [ax + nx * w, y, az + nz * w], [a0, a0, 0, 0]);
  }
  rect(cx, cz, w, d, rot, y, f, a0) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const T = (x, z) => [cx + x * c + z * s, y, cz - x * s + z * c];
    const hw = w / 2, hd = d / 2, ow = hw + f, od = hd + f;
    const I = [T(-hw, -hd), T(hw, -hd), T(hw, hd), T(-hw, hd)], O = [T(-ow, -od), T(ow, -od), T(ow, od), T(-ow, od)];
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; this.quad(I[i], O[i], O[j], I[j], [a0, 0, 0, a0]); }
    this.quad(I[0], I[1], I[2], I[3], [a0, a0, a0, a0]);
  }
  mesh() {
    if (!this.p.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 4));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false }));
    m.renderOrder = 1;
    m.name = 'ao';
    return m;
  }
}

export function fillPattern(g, rect, y, f, seed) {
  const [x0, z0, x1, z1] = rect;
  const base = C(f.color || P.oak), c2 = f.color2 ? C(f.color2) : null;
  const R = rng(seed);
  const tc = new THREE.Color();
  const vary = f.vary ?? 0.06;
  const pick = (k) => { tc.copy(base); if (c2) tc.lerp(c2, k); return tc.multiplyScalar(1 + (R() - 0.5) * vary * 2).clone(); };
  const put = (pts, col) => {
    const cl = clipQuad(pts, x0, z0, x1, z1);
    if (!cl) return;
    const v = cl.map((p) => [p[0], y, p[1]]);
    g.face(v, [v[0][0], y - 1, v[0][2]], col);
  };
  const type = f.type || 'planks';
  if (type === 'planks' || type === 'deck') {
    const w = f.w || (type === 'deck' ? 0.145 : 0.19), gap = f.gap ?? (type === 'deck' ? 0.008 : 0.004), alongX = (f.dir || 'x') === 'x';
    const L0 = f.len?.[0] ?? 0.9, L1 = f.len?.[1] ?? 1.9;
    const a0 = alongX ? x0 : z0, a1 = alongX ? x1 : z1, b0 = alongX ? z0 : x0, b1 = alongX ? z1 : x1;
    const origin = f.origin ?? 0;
    const k0 = Math.floor((b0 - origin) / w), k1 = Math.ceil((b1 - origin) / w);
    for (let k = k0; k < k1; k++) {
      const s0 = origin + k * w, s1 = s0 + w - gap;
      const RR = rng(seed * 31 + k * 7 + 5);
      let p = a0 - RR() * L1;
      while (p < a1) {
        const L = L0 + RR() * (L1 - L0);
        const e0 = Math.max(p, a0 - 0.01), e1 = Math.min(p + L - gap, a1 + 0.01);
        if (e1 > e0) {
          const col = pick(R());
          const q = alongX ? [[e0, s0], [e1, s0], [e1, s1], [e0, s1]] : [[s0, e0], [s1, e0], [s1, e1], [s0, e1]];
          put(q, col);
        }
        p += L;
      }
    }
  } else if (type === 'tiles' || type === 'stone') {
    const tw = f.size?.[0] ?? 0.6, td = f.size?.[1] ?? 0.6, gap = f.gap ?? 0.004, bond = f.bond ?? 0;
    const ox = f.origin?.[0] ?? 0, oz = f.origin?.[1] ?? 0;
    for (let j = Math.floor((z0 - oz) / td); j < Math.ceil((z1 - oz) / td); j++) {
      const sh = bond ? (j % 2) * tw * bond : 0;
      for (let i = Math.floor((x0 - ox - sh) / tw) - 1; i < Math.ceil((x1 - ox) / tw) + 1; i++) {
        const xa = ox + sh + i * tw + gap / 2, xb = xa + tw - gap, za = oz + j * td + gap / 2, zb = za + td - gap;
        put([[xa, za], [xb, za], [xb, zb], [xa, zb]], pick(R()));
      }
    }
  } else if (type === 'herringbone') {
    const w = f.w || 0.1, L = f.L || 0.6, gap = 0.003, k = Math.SQRT1_2;
    const ox = f.origin?.[0] ?? 0, oz = f.origin?.[1] ?? 0;
    const toW = (u, v) => [ox + (u - v) * k, oz + (u + v) * k];
    const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => { const dx = x - ox, dz = z - oz; return [(dx + dz) * k, (dz - dx) * k]; });
    const us = corners.map((c) => c[0]), vs = corners.map((c) => c[1]);
    const u0 = Math.min(...us) - L, u1 = Math.max(...us) + L, v0 = Math.min(...vs) - L, v1 = Math.max(...vs) + L;
    const jMin = Math.floor(Math.min((u0 - v1) / (2 * L), (u0 - v1) / (2 * L))) - 2, jMax = Math.ceil((u1 - v0) / (2 * L)) + 2;
    for (let j = jMin; j <= jMax; j++) {
      const iMin = Math.floor((u0 - j * L) / w) - 2, iMax = Math.ceil((u1 - j * L) / w) + 2;
      for (let i = iMin; i <= iMax; i++) {
        const a = i * w + j * L, b = i * w - j * L;
        if (b < v0 - L || b > v1 + L) continue;
        const H = [[a + gap, b - w + gap], [a + L - gap, b - w + gap], [a + L - gap, b - gap], [a + gap, b - gap]];
        const V = [[a + gap, b + gap], [a + w - gap, b + gap], [a + w - gap, b + L - gap], [a + gap, b + L - gap]];
        put(H.map(([u, v]) => toW(u, v)), pick(R()));
        put(V.map(([u, v]) => toW(u, v)), pick(R()));
      }
    }
  } else if (type === 'marble' || type === 'concrete' || type === 'carpet') {
    const cell = f.cell || (type === 'marble' ? 0.14 : 0.3);
    const tile = f.size || (type === 'marble' ? [0.8, 0.8] : null);
    const vein = C(f.vein || '#8a5a3a'), dark = C(f.dark || '#2f3d36');
    const colAt = (x, z) => {
      const c = base.clone();
      if (type === 'marble') {
        const w1 = fbm(x * 0.55 + 3, z * 0.55 - 2, 4, 5);
        const w2 = Math.abs(Math.sin((x * 1.7 + z * 0.9 + w1 * 6.0) * 1.6));
        const w3 = fbm(x * 1.6, z * 1.6, 3, 9);
        c.lerp(dark, smooth(0.35, 0.75, w1) * 0.55);
        c.lerp(base.clone().multiplyScalar(1.35), smooth(0.6, 0.85, w3) * 0.35);
        c.lerp(vein, (1 - smooth(0.0, 0.09, w2)) * 0.75);
      } else if (type === 'concrete') {
        c.multiplyScalar(0.94 + fbm(x * 0.9, z * 0.9, 3, 4) * 0.12);
      } else c.multiplyScalar(0.96 + noise2(x * 6, z * 6, 2) * 0.08);
      return c;
    };
    const nx = Math.max(1, Math.round((x1 - x0) / cell)), nz = Math.max(1, Math.round((z1 - z0) / cell));
    const gap = tile ? 0.0025 : 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      let xa = x0 + ((x1 - x0) * i) / nx, xb = x0 + ((x1 - x0) * (i + 1)) / nx, za = z0 + ((z1 - z0) * j) / nz, zb = z0 + ((z1 - z0) * (j + 1)) / nz;
      if (tile) {
        const gx = (v) => { const t = v / tile[0]; const fr = t - Math.round(t); return Math.abs(fr) * tile[0] < gap; };
        if (gx(xa) && i > 0) xa += gap;
        const gz = (v) => { const t = v / tile[1]; const fr = t - Math.round(t); return Math.abs(fr) * tile[1] < gap; };
        if (gz(za) && j > 0) za += gap;
      }
      const v = [[xa, y, za], [xb, y, za], [xb, y, zb], [xa, y, zb]];
      g.quad(v[0], v[3], v[2], v[1], colAt(xa, za), colAt(xa, zb), colAt(xb, zb), colAt(xb, za));
    }
  } else {
    put([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], base.clone());
  }
}

export function generate(spec) {
  const M = materials();
  const pal = { section: P.section, frame: P.frame, door: '#f2f0ea', doorFrame: '#f4f2ec', base: '#f4f2ec', sill: P.sill, facade: P.render, plinth: P.plinth, glassFrame: P.frameDark, extDoor: '#3a3d42', ...(spec.palette || {}) };
  const floors = spec.floors.map((f, i) => ({ index: i, slab: 0.24, ...f }));
  const FY = (fl) => floors[fl].y, FH = (fl) => floors[fl].height;
  const root = new THREE.Group();
  root.name = spec.id;
  const floorGroups = floors.map((f) => { const g = new THREE.Group(); g.name = `floor-${f.index}`; root.add(g); return { group: g, floor: f.index }; });
  const ceilingGroups = floors.map((f) => { const g = new THREE.Group(); g.name = `ceiling-${f.index}`; g.visible = false; root.add(g); return { group: g, floor: f.index }; });
  const siteGroup = new THREE.Group(); siteGroup.name = 'site'; root.add(siteGroup);
  const roofGroup = new THREE.Group(); roofGroup.name = 'roof'; roofGroup.visible = false; root.add(roofGroup);
  const stat = floors.map(() => new Geo());
  const ceil = floors.map(() => new Geo());
  const ovl = floors.map(() => new Overlay());
  const wallG = new Map();
  const groupKey = (fl, side) => `${fl}:${side}`;
  const wg = (fl, side) => {
    const k = groupKey(fl, side);
    let w = wallG.get(k);
    if (!w) { w = { floor: fl, side, geo: new Geo(), glass: new Geo(), mat: wallMaterial(pal.section), extra: [] }; w.geo.use('wall'); w.glass.use('glass'); wallG.set(k, w); }
    return w;
  };
  const data = {
    id: spec.id, name: spec.name, area: 0,
    floors: floors.map((f) => ({ index: f.index, y: r3(f.y), height: r3(f.height), name: f.name })),
    rooms: [], walls: [], furniture: [], circuits: spec.circuits || [], mounts: [], strips: [], tabletSpots: [],
    panel: null, rack: null, mediaBox: null, wan: null, entrance: null, street: null, zones: [], camera: null,
    fixtures: [], outlets: [], switches: [], approach: []
  };
  const fixtures = [];
  const doors = new Map();
  const occupied = [];
  const reserved = [];
  const mountIds = new Map();
  const addMount = (m) => {
    const base = `${m.kind}-${m.room}`;
    const n = (mountIds.get(base) || 0) + 1;
    mountIds.set(base, n);
    const out = { id: m.id || `${base}-${n}`, room: m.room, floor: m.floor, kind: m.kind, pos: m.pos.map(r3), normal: (m.normal || [0, 1, 0]).map(r3), quat: m.quat || [0, 0, 0, 1], tags: m.tags || [] };
    if (m.circuit) out.circuit = m.circuit;
    if (m.fixture) out.fixture = m.fixture;
    data.mounts.push(out);
    return out;
  };

  const walls = spec.walls.map((w, i) => {
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], len = Math.hypot(dx, dz);
    return { ...w, id: w.id || `w${i}`, i, len, d: [dx / len, dz / len], n: [-dz / len, dx / len], t: w.t ?? 0.12, ext: !!w.ext, open: (w.open || []).map((o, k) => ({ ...o, id: o.id || `${w.id || 'w' + i}-o${k}`, kind: o.kind || 'door' })), endA: 0, endB: 0, dark: { 1: [], [-1]: [] }, concave: { a: { 1: false, [-1]: false }, b: { 1: false, [-1]: false } } };
  });
  const wallsOn = (fl) => walls.filter((w) => w.floor === fl);

  const rooms = spec.rooms.map((r) => {
    const fl = r.floor ?? 0;
    const inner = r.poly.length && !r.raw ? insetPoly(r.poly, wallsOn(fl)) : r.poly.map((p) => [r3(p[0]), r3(p[1])]);
    return { ...r, floor: fl, inner, open: OPEN.has(r.kind) };
  });
  const roomById = new Map(rooms.map((r) => [r.id, r]));
  const indoorAt = (fl, x, z) => rooms.find((r) => r.floor === fl && !r.open && pip(x, z, r.inner)) || null;
  const anyRoomAt = (fl, x, z) => rooms.find((r) => r.floor === fl && pip(x, z, r.inner)) || null;

  for (const r of rooms) {
    const area = Math.abs(polyArea(r.inner));
    if (!r.open) data.area += area;
    data.rooms.push({ id: r.id, name: r.name, floor: r.floor, kind: r.kind, poly: r.inner, area: r3(area) });
  }
  data.area = Math.round(data.area);

  for (const W of walls) {
    for (const end of ['a', 'b']) {
      const p = W[end];
      let ext = 0, trim = 0;
      for (const O of walls) {
        if (O === W || O.floor !== W.floor || Math.abs(O.d[0] * W.d[0] + O.d[1] * W.d[1]) > 0.3) continue;
        const rx = p[0] - O.a[0], rz = p[1] - O.a[1];
        const s = rx * O.d[0] + rz * O.d[1], q = rx * O.n[0] + rz * O.n[1];
        if (Math.abs(q) > 0.03 || s < -0.03 || s > O.len + 0.03) continue;
        const atEnd = s < 0.03 || s > O.len - 0.03;
        const xdom = Math.abs(W.d[0]) >= Math.abs(W.d[1]);
        if (atEnd && xdom && !O.noJoin) ext = Math.max(ext, O.t / 2);
        else trim = Math.max(trim, O.t / 2);
        const into = end === 'a' ? 1 : -1;
        const oc = atEnd ? (s < 0.03 ? 1 : -1) : 0;
        for (const sd of [1, -1]) {
          const concave = oc === 0 ? true : oc * (O.d[0] * W.n[0] + O.d[1] * W.n[1]) * sd > 0;
          if (concave) W.dark[sd].push((end === 'a' ? 0 : W.len) + into * (O.t / 2));
        }
        const wsd = Math.sign(into * (W.d[0] * O.n[0] + W.d[1] * O.n[1])) || 1;
        O.dark[wsd].push(s - W.t / 2, s + W.t / 2);
      }
      const adj = trim > 0 ? -trim : ext;
      if (end === 'a') W.endA = adj; else W.endB = adj;
    }
  }

  for (const W of walls) {
    if (!W.ext) { W.side = 'int'; W.out = 0; continue; }
    const mx = (W.a[0] + W.b[0]) / 2, mz = (W.a[1] + W.b[1]) / 2, off = W.t / 2 + 0.15;
    let insideP = false, insideN = false;
    for (const f of [0.25, 0.5, 0.75]) {
      const px = W.a[0] + W.d[0] * W.len * f, pz = W.a[1] + W.d[1] * W.len * f;
      if (indoorAt(W.floor, px + W.n[0] * off, pz + W.n[1] * off)) insideP = true;
      if (indoorAt(W.floor, px - W.n[0] * off, pz - W.n[1] * off)) insideN = true;
    }
    W.out = W.outSign ?? (insideP && !insideN ? -1 : !insideP && insideN ? 1 : insideP ? -1 : 1);
    const ox = W.n[0] * W.out, oz = W.n[1] * W.out;
    W.side = W.grp || (Math.abs(ox) > Math.abs(oz) ? (ox > 0 ? 'E' : 'W') : (oz > 0 ? 'S' : 'N'));
    void mx; void mz;
  }

  const finishOf = (room) => {
    if (!room) return { color: P.plaster };
    const w = room.wall;
    if (!w) return { color: P.plaster };
    if (typeof w === 'string') return { color: w };
    return w;
  };

  const faces = [];
  const wallUse = [];

  const WP = (W, u, v, y) => [W.a[0] + W.d[0] * u + W.n[0] * v, y, W.a[1] + W.d[1] * u + W.n[1] * v];

  function wallSpan(W) {
    const fl = W.floor, y = FY(fl), H = FH(fl);
    const above = floors[fl + 1];
    let top = W.h != null ? y + W.h : W.ext ? y + H + (above ? above.slab : spec.topExtra ?? 0.28) : y + H;
    let bot = W.ext ? y - floors[fl].slab - (fl === 0 ? spec.plinth ?? 0.5 : 0) : y;
    if (W.bot != null) bot = y + W.bot;
    return { y, H, top, bot };
  }

  function drawWall(W) {
    const G = wg(W.floor, W.side);
    const g = G.geo;
    const { y, H, top, bot } = wallSpan(W);
    const u0 = -W.endA, u1 = W.len + W.endB;
    const t2 = W.t / 2;
    const ops = W.open.map((o) => {
      const s0 = o.at, s1 = o.at + o.w;
      return { ...o, s0, s1, y0: y + (o.sill ?? 0), y1: y + (o.head ?? 2.05) };
    }).sort((a, b) => a.s0 - b.s0);
    const pieces = [];
    let cur = u0;
    for (const o of ops) {
      if (o.s0 > cur + 1e-4) pieces.push({ u0: cur, u1: o.s0, y0: bot, y1: top, kind: 'solid', endA: cur === u0 ? 'end' : 'rev', endB: 'rev' });
      if (o.y0 > y + 1e-4) pieces.push({ u0: o.s0, u1: o.s1, y0: bot, y1: o.y0, kind: 'sill', op: o, endA: 'rev', endB: 'rev' });
      else if (W.ext && bot < y - 1e-4) pieces.push({ u0: o.s0, u1: o.s1, y0: bot, y1: y - 0.001, kind: 'sill', op: o, endA: 'rev', endB: 'rev', below: true });
      if (o.y1 < top - 1e-4) pieces.push({ u0: o.s0, u1: o.s1, y0: o.y1, y1: top, kind: 'lintel', op: o, endA: 'rev', endB: 'rev' });
      cur = o.s1;
    }
    if (u1 > cur + 1e-4) pieces.push({ u0: cur, u1, y0: bot, y1: top, kind: 'solid', endA: ops.length ? 'rev' : 'end', endB: 'end' });
    for (const pc of pieces) {
      if (pc.endA === 'end' && pc.u0 === u0) pc.endA = W.endA !== 0 ? 'join' : 'end';
      if (pc.endB === 'end' && pc.u1 === u1) pc.endB = W.endB !== 0 ? 'join' : 'end';
    }
    const breaksFor = (sd) => {
      const s = new Set();
      for (const d of W.dark[sd]) { s.add(d); s.add(d - 0.3); s.add(d + 0.3); }
      const fx = sd * (t2 + 0.001);
      for (const r of rooms) {
        if (r.floor !== W.floor) continue;
        for (const p of r.inner) {
          const rx = p[0] - W.a[0], rz = p[1] - W.a[1];
          const q = rx * W.n[0] + rz * W.n[1];
          if (Math.abs(q - fx) < 0.03) s.add(rx * W.d[0] + rz * W.d[1]);
        }
      }
      for (const b of W.uBreaks || []) s.add(b);
      return [...s];
    };
    const brk = { 1: breaksFor(1), [-1]: breaksFor(-1) };
    const aoU = (sd, u) => {
      let f = 1;
      for (const d of W.dark[sd]) f = Math.min(f, 0.86 + 0.14 * smooth(0, 0.3, Math.abs(u - d)));
      return f;
    };
    const sideInfo = (sd, u) => {
      const px = W.a[0] + W.d[0] * u + W.n[0] * sd * (t2 + 0.06), pz = W.a[1] + W.d[1] * u + W.n[1] * sd * (t2 + 0.06);
      const exterior = W.ext && sd === W.out;
      const room = exterior ? null : indoorAt(W.floor, px, pz);
      return { exterior, room };
    };
    const colAt = (info, yy, sd, u) => {
      if (info.exterior) {
        if (yy < FY(0) + (spec.plinthH ?? 0.32) && W.floor === 0) return C(pal.plinth);
        const fc = W.facade || spec.facadeAt?.(W, u, yy) || pal.facade;
        return C(fc);
      }
      const fin = finishOf(info.room);
      if (fin.tiles && yy - y < (fin.tiles.h ?? 2.1) + 1e-3) return C(fin.tiles.grout || P.grout);
      const acc = info.room?.accent?.find((a) => a.wall === W.id && (a.u0 == null || (u >= a.u0 && u <= a.u1)));
      if (acc) return C(acc.color);
      return C(fin.color || P.plaster);
    };
    const aoY = (info, yy) => {
      if (info.exterior) return 1;
      const h = yy - y;
      return (0.84 + 0.16 * smooth(0, 0.45, h)) * (0.94 + 0.06 * smooth(H + 0.05, H - 0.35, h));
    };

    for (const pc of pieces) {
      const ctr = [(pc.u0 + pc.u1) / 2, 0, (pc.y0 + pc.y1) / 2];
      for (const sd of [1, -1]) {
        const us = new Set([pc.u0, pc.u1]);
        for (const b of brk[sd]) if (b > pc.u0 + 0.01 && b < pc.u1 - 0.01) us.add(b);
        const ua = [...us].sort((a, b) => a - b);
        for (let i = 0; i < ua.length - 1; i++) {
          const ux0 = ua[i], ux1 = ua[i + 1], um = (ux0 + ux1) / 2;
          const info = sideInfo(sd, um);
          const fin = info.room ? finishOf(info.room) : null;
          const ys = new Set([pc.y0, pc.y1]);
          const addY = (v) => { if (v > pc.y0 + 0.005 && v < pc.y1 - 0.005) ys.add(v); };
          if (!info.exterior) { addY(y + 0.45); addY(y + H - 0.35); addY(y + H); addY(y); if (fin?.tiles) addY(y + (fin.tiles.h ?? 2.1)); }
          else if (W.floor === 0) addY(FY(0) + (spec.plinthH ?? 0.32));
          if (W.facadeBands) for (const b of W.facadeBands) addY(b);
          const ya = [...ys].sort((a, b) => a - b);
          for (let j = 0; j < ya.length - 1; j++) {
            const y0 = ya[j], y1 = ya[j + 1], v = sd * t2;
            const ym = (y0 + y1) / 2;
            const cA = (uu, yy) => colAt(info, ym, sd, um).clone().multiplyScalar(aoY(info, yy) * (info.exterior ? 1 : aoU(sd, uu)));
            const pts = [WP(W, ux0, v, y0), WP(W, ux1, v, y0), WP(W, ux1, v, y1), WP(W, ux0, v, y1)];
            const nrm = [W.n[0] * sd, 0, W.n[1] * sd];
            const c00 = cA(ux0, y0), c10 = cA(ux1, y0), c11 = cA(ux1, y1), c01 = cA(ux0, y1);
            const cx = [pts[0][0] - nrm[0], pts[0][1], pts[0][2] - nrm[2]];
            const a = pts[0], b = pts[1], c = pts[2];
            const nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]);
            const nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
            if (nx * nrm[0] + nz * nrm[2] >= 0) g.quad(pts[0], pts[1], pts[2], pts[3], c00, c10, c11, c01);
            else g.quad(pts[0], pts[3], pts[2], pts[1], c00, c01, c11, c10);
            void cx;
          }
          if (!info.exterior && info.room && pc.kind !== 'lintel') {
            faces.push({ W, sd, u0: ux0, u1: ux1, y0: pc.y0, y1: pc.y1, room: info.room, kind: pc.kind, floor: W.floor });
            if (pc.y0 <= y + 0.01) ovl[W.floor].strip(...ovlPts(W, ux0, ux1, sd, t2), y + 0.003, 0.32, 0.22);
            const fin2 = finishOf(info.room);
            const accF = info.room.accent?.find((a) => a.wall === W.id);
            if (fin2.flakes && !accF) flakeFace(g, W, sd, ux0, ux1, Math.max(pc.y0, y + 0.08), Math.min(pc.y1, y + H), fin2.flakes, y);
            if (fin2.tiles) tileFace(g, W, sd, ux0, ux1, Math.max(pc.y0, y), Math.min(pc.y1, y + (fin2.tiles.h ?? 2.1)), fin2.tiles, y);
            else if (pc.y0 <= y + 0.01 && !info.room.noBase) {
              const bc = C(info.room.base || pal.base);
              const b0 = WP(W, ux0, sd * (t2 + 0.014), y), b1 = WP(W, ux1, sd * (t2 + 0.014), y + 0.075);
              const bb = [WP(W, ux0, sd * t2, y), b1];
              g.bx(Math.min(bb[0][0], b1[0]), y, Math.min(bb[0][2], b1[2]), Math.max(bb[0][0], b1[0]), y + 0.075, Math.max(bb[0][2], b1[2]), bc, { top: shade(bc, 1.04) });
              void b0;
            }
          }
          if (info.exterior && pc.kind !== 'lintel') faces.push({ W, sd, u0: ux0, u1: ux1, y0: pc.y0, y1: pc.y1, room: null, exterior: true, kind: pc.kind, floor: W.floor });
          if (info.exterior && pc.kind === 'lintel') faces.push({ W, sd, u0: ux0, u1: ux1, y0: pc.y0, y1: pc.y1, room: null, exterior: true, kind: 'lintel', floor: W.floor });
        }
      }
      g.cap = 1;
      g.face([WP(W, pc.u0, -t2, pc.y1), WP(W, pc.u0, t2, pc.y1), WP(W, pc.u1, t2, pc.y1), WP(W, pc.u1, -t2, pc.y1)], WP(W, (pc.u0 + pc.u1) / 2, 0, pc.y1 - 1), C(pal.section));
      g.cap = 0;
      g.face([WP(W, pc.u0, -t2, pc.y0), WP(W, pc.u0, t2, pc.y0), WP(W, pc.u1, t2, pc.y0), WP(W, pc.u1, -t2, pc.y0)], WP(W, (pc.u0 + pc.u1) / 2, 0, pc.y0 + 1), C(pal.section));
      const revCol = (u, o) => {
        const sdIn = W.ext ? -W.out : 1;
        const info = sideInfo(sdIn, u);
        return info.room ? C(finishOf(info.room).color || P.plaster) : C(pal.facade);
      };
      for (const [which, uu] of [['A', pc.u0], ['B', pc.u1]]) {
        const kind = which === 'A' ? pc.endA : pc.endB;
        if (kind === 'join') continue;
        const inward = which === 'A' ? 1 : -1;
        const op = pc.kind === 'solid' ? null : pc.op;
        const yA = pc.y0, yB = pc.y1;
        const col = revCol(uu + inward * 0.01, op);
        if (W.ext && kind === 'rev') {
          const vf = revealSplit(W);
          const inC = col, outC = C(pal.facade);
          const s1 = W.out;
          g.face([WP(W, uu, s1 * t2, yA), WP(W, uu, vf, yA), WP(W, uu, vf, yB), WP(W, uu, s1 * t2, yB)], WP(W, uu + inward, 0, (yA + yB) / 2), outC);
          g.face([WP(W, uu, vf, yA), WP(W, uu, -s1 * t2, yA), WP(W, uu, -s1 * t2, yB), WP(W, uu, vf, yB)], WP(W, uu + inward, 0, (yA + yB) / 2), inC);
        } else {
          g.face([WP(W, uu, -t2, yA), WP(W, uu, t2, yA), WP(W, uu, t2, yB), WP(W, uu, -t2, yB)], WP(W, uu + inward, 0, (yA + yB) / 2), col);
        }
      }
      if (pc.kind === 'sill' && !pc.below) {
        const o = pc.op;
        if (W.ext) {
          const vf = revealSplit(W);
          g.face([WP(W, pc.u0, W.out * t2, pc.y1), WP(W, pc.u1, W.out * t2, pc.y1), WP(W, pc.u1, vf, pc.y1), WP(W, pc.u0, vf, pc.y1)], WP(W, (pc.u0 + pc.u1) / 2, 0, pc.y1 - 1), C(pal.facade));
          g.face([WP(W, pc.u0, vf, pc.y1), WP(W, pc.u1, vf, pc.y1), WP(W, pc.u1, -W.out * t2, pc.y1), WP(W, pc.u0, -W.out * t2, pc.y1)], WP(W, (pc.u0 + pc.u1) / 2, 0, pc.y1 - 1), revCol((pc.u0 + pc.u1) / 2, o));
        } else g.face([WP(W, pc.u0, -t2, pc.y1), WP(W, pc.u1, -t2, pc.y1), WP(W, pc.u1, t2, pc.y1), WP(W, pc.u0, t2, pc.y1)], WP(W, (pc.u0 + pc.u1) / 2, 0, pc.y1 - 1), revCol((pc.u0 + pc.u1) / 2, o));
      } else if (pc.kind === 'sill' && pc.below) {
        g.face([WP(W, pc.u0, -t2, pc.y1), WP(W, pc.u1, -t2, pc.y1), WP(W, pc.u1, t2, pc.y1), WP(W, pc.u0, t2, pc.y1)], WP(W, (pc.u0 + pc.u1) / 2, 0, pc.y1 - 1), C(pc.op.threshold || '#9a968f'));
      }
      if (pc.kind === 'lintel') {
        if (W.ext) {
          const vf = revealSplit(W);
          g.face([WP(W, pc.u0, W.out * t2, pc.y0), WP(W, pc.u1, W.out * t2, pc.y0), WP(W, pc.u1, vf, pc.y0), WP(W, pc.u0, vf, pc.y0)], WP(W, (pc.u0 + pc.u1) / 2, 0, pc.y0 + 1), C(pal.facade));
          g.face([WP(W, pc.u0, vf, pc.y0), WP(W, pc.u1, vf, pc.y0), WP(W, pc.u1, -W.out * t2, pc.y0), WP(W, pc.u0, -W.out * t2, pc.y0)], WP(W, (pc.u0 + pc.u1) / 2, 0, pc.y0 + 1), revCol((pc.u0 + pc.u1) / 2, pc.op));
        } else g.face([WP(W, pc.u0, -t2, pc.y0), WP(W, pc.u1, -t2, pc.y0), WP(W, pc.u1, t2, pc.y0), WP(W, pc.u0, t2, pc.y0)], WP(W, (pc.u0 + pc.u1) / 2, 0, pc.y0 + 1), revCol((pc.u0 + pc.u1) / 2, pc.op));
      }
      void ctr;
    }
    for (const o of ops) drawOpening(W, o, G);
    W.ops = ops;
  }

  function ovlPts(W, u0, u1, sd, t2) {
    const a = WP(W, u0, sd * t2, 0), b = WP(W, u1, sd * t2, 0);
    return [a[0], a[2], b[0], b[2], W.n[0] * sd, W.n[1] * sd];
  }

  function revealSplit(W) {
    return W.out * (W.t / 2 - Math.min(0.14, W.t * 0.32));
  }

  function tileFace(g, W, sd, u0, u1, y0, y1, T, fy) {
    if (y1 <= y0 + 0.01) return;
    const tw = T.size?.[0] ?? 0.3, th = T.size?.[1] ?? 0.6, gap = T.gap ?? 0.003, v = sd * (W.t / 2 + 0.005);
    const base = C(T.color || P.tileLight), R = rng(W.i * 13 + (sd > 0 ? 1 : 2));
    const ua = W.a[0] * W.d[0] + W.a[1] * W.d[1];
    for (let row = Math.floor((y0 - fy) / th); row * th + fy < y1; row++) {
      const ya = Math.max(y0, fy + row * th + gap / 2), yb = Math.min(y1, fy + (row + 1) * th - gap / 2);
      if (yb <= ya) continue;
      const shift = T.bond ? (row % 2) * tw * T.bond : 0;
      for (let k = Math.floor((u0 + ua - shift) / tw) - 1; (k * tw + shift - ua) < u1; k++) {
        const xa = Math.max(u0, k * tw + shift - ua + gap / 2), xb = Math.min(u1, (k + 1) * tw + shift - ua - gap / 2);
        if (xb <= xa + 0.005) continue;
        const col = base.clone().multiplyScalar(1 + (R() - 0.5) * 0.05);
        g.face([WP(W, xa, v, ya), WP(W, xb, v, ya), WP(W, xb, v, yb), WP(W, xa, v, yb)], WP(W, (xa + xb) / 2, v - sd, (ya + yb) / 2), col);
      }
    }
  }

  function flakeFace(g, W, sd, u0, u1, y0, y1, F, fy) {
    if (y1 <= y0 + 0.05 || u1 <= u0 + 0.05) return;
    const v = sd * (W.t / 2 + 0.0018), vj = sd * (W.t / 2 + 0.0012);
    const R = rng(Math.round(W.i * 97 + u0 * 31 + y0 * 7 + (sd > 0 ? 3 : 5)));
    const cols = (F.cols || ['#b9ad98', '#ddd5c5', '#a59a85', '#cfc5b2']).map((c) => C(c));
    const n = Math.round((u1 - u0) * (y1 - y0) * (F.n ?? 110));
    for (let i = 0; i < n; i++) {
      const u = u0 + 0.03 + R() * (u1 - u0 - 0.06), yy = y0 + 0.03 + R() * (y1 - y0 - 0.06);
      const a = R() * Math.PI, L = 0.05 + R() * 0.13, w = 0.012 + R() * 0.02, ca = Math.cos(a), sa = Math.sin(a);
      const P = (du, dy) => WP(W, u + du, v, yy + dy);
      const c = cols[Math.floor(R() * cols.length)].clone().multiplyScalar(0.95 + R() * 0.1);
      g.face([P(-ca * L - sa * w, -sa * L + ca * w), P(ca * L - sa * w, sa * L + ca * w), P(ca * L + sa * w, sa * L - ca * w), P(-ca * L + sa * w, -sa * L - ca * w)], WP(W, u, v - sd, yy), c);
    }
    const pw = F.panel?.[0] ?? 1.25, ph = F.panel?.[1] ?? 2.5, jc = C(F.joint || '#9c917e');
    const ua = W.a[0] * W.d[0] + W.a[1] * W.d[1];
    for (let k = Math.ceil((u0 + ua) / pw); k * pw - ua < u1; k++) {
      const u = k * pw - ua;
      if (u <= u0 + 0.01 || u >= u1 - 0.01) continue;
      g.face([WP(W, u - 0.003, vj, y0), WP(W, u + 0.003, vj, y0), WP(W, u + 0.003, vj, y1), WP(W, u - 0.003, vj, y1)], WP(W, u, vj - sd, (y0 + y1) / 2), jc);
    }
    const yj = fy + ph;
    if (yj > y0 + 0.01 && yj < y1 - 0.01) g.face([WP(W, u0, vj, yj - 0.003), WP(W, u1, vj, yj - 0.003), WP(W, u1, vj, yj + 0.003), WP(W, u0, vj, yj + 0.003)], WP(W, (u0 + u1) / 2, vj - sd, yj), jc);
  }

  function drawOpening(W, o, G) {
    const g = G.geo, gl = G.glass, t2 = W.t / 2, y = FY(W.floor);
    const width = o.s1 - o.s0, sgn = W.ext ? W.out : 1;
    const jamb = (u0, u1, v0, v1, y0, y1, col) => {
      const p = [WP(W, u0, v0, y0), WP(W, u1, v1, y1)];
      boxW(g, W, u0, u1, v0, v1, y0, y1, col);
      void p;
    };
    if (o.kind === 'window' || o.kind === 'glass') {
      const dark = o.dark ?? (o.kind === 'glass' ? pal.glassDark !== false : !!pal.windowDark);
      const fcol = C(o.frame || (dark ? pal.glassFrame : pal.frame));
      const fd = 0.075, vf = W.ext ? revealSplit(W) : 0;
      const va = vf, vb = vf - sgn * fd;
      const v0 = Math.min(va, vb), v1 = Math.max(va, vb);
      const fw = o.kind === 'glass' ? 0.06 : 0.07;
      const yb = o.y0, yt = o.y1;
      jamb(o.s0, o.s0 + fw, v0, v1, yb, yt, fcol);
      jamb(o.s1 - fw, o.s1, v0, v1, yb, yt, fcol);
      jamb(o.s0 + fw, o.s1 - fw, v0, v1, yt - fw, yt, fcol);
      jamb(o.s0 + fw, o.s1 - fw, v0, v1, yb, yb + (o.kind === 'glass' && (o.sill ?? 0) < 0.05 ? 0.035 : fw), fcol);
      const nPanes = o.panes || Math.max(1, Math.round(width / (o.kind === 'glass' ? 1.25 : 0.75)));
      const inner0 = o.s0 + fw, inner1 = o.s1 - fw, pw = (inner1 - inner0) / nPanes;
      const transom = o.transom ?? (o.kind === 'window' && yt - yb > 1.9 ? yt - 0.5 : null);
      for (let k = 1; k < nPanes; k++) {
        const u = inner0 + k * pw;
        jamb(u - 0.04, u + 0.04, v0 - 0.004, v1 + 0.004, yb, yt, fcol);
      }
      if (transom) jamb(inner0, inner1, v0, v1, transom - 0.035, transom + 0.035, fcol);
      const sash = o.kind === 'window' ? 0.05 : 0.035;
      const vm = (v0 + v1) / 2;
      for (let k = 0; k < nPanes; k++) {
        const pa = inner0 + k * pw + (k > 0 ? 0.04 : 0), pb = inner0 + (k + 1) * pw - (k < nPanes - 1 ? 0.04 : 0);
        const ya = yb + (o.kind === 'glass' && (o.sill ?? 0) < 0.05 ? 0.035 : fw), ybb = transom ? transom - 0.035 : yt - fw;
        if (o.kind === 'window' || o.slide) {
          const vs0 = Math.min(vm - sgn * 0.005, vm - sgn * 0.045), vs1 = Math.max(vm - sgn * 0.005, vm - sgn * 0.045);
          jamb(pa, pa + sash, vs0, vs1, ya, ybb, fcol);
          jamb(pb - sash, pb, vs0, vs1, ya, ybb, fcol);
          jamb(pa + sash, pb - sash, vs0, vs1, ya, ya + sash, fcol);
          jamb(pa + sash, pb - sash, vs0, vs1, ybb - sash, ybb, fcol);
          glassPane(gl, W, pa + sash, pb - sash, ya + sash, ybb - sash, vm - sgn * 0.025);
          const hu = k % 2 === 0 ? pb - sash / 2 : pa + sash / 2;
          const hv = vm - sgn * 0.06;
          boxW(g, W, hu - 0.012, hu + 0.012, Math.min(hv, hv - sgn * 0.03), Math.max(hv, hv - sgn * 0.03), (ya + ybb) / 2 - 0.08, (ya + ybb) / 2 + 0.02, C(o.handle || (dark ? '#2a2c30' : '#e9e9e6')));
          o.sashes = o.sashes || [];
          o.sashes.push({ pa, pb, ya, yb: ybb, hu });
        } else {
          glassPane(gl, W, pa, pb, ya, ybb, vm);
          o.sashes = o.sashes || [];
          o.sashes.push({ pa, pb, ya, yb: ybb, hu: (pa + pb) / 2 });
        }
        if (transom) glassPane(gl, W, pa, pb, transom + 0.035, yt - fw, vm);
      }
      if (o.kind === 'window' && W.ext) {
        const vin = -sgn * t2;
        const inner = sgn > 0 ? v0 : v1;
        boxW(g, W, o.s0 - 0.05, o.s1 + 0.05, Math.min(inner, vin - sgn * 0.045), Math.max(inner, vin - sgn * 0.045), yb - 0.003, yb + 0.024, C(o.sillCol || pal.sill));
        const outer = sgn > 0 ? v1 : v0, vout = sgn * t2;
        boxW(g, W, o.s0 - 0.03, o.s1 + 0.03, Math.min(outer, vout + sgn * 0.05), Math.max(outer, vout + sgn * 0.05), yb - 0.003, yb + 0.012, C(pal.flashing || '#7d8085'));
      }
      if (o.kind === 'window' && !W.ext) {
        boxW(g, W, o.s0 - 0.03, o.s1 + 0.03, -t2 - 0.03, t2 + 0.03, yb - 0.003, yb + 0.022, C(o.sillCol || pal.sill));
      }
      if ((o.kind === 'glass') && (o.sill ?? 0) < 0.05) {
        boxW(g, W, o.s0, o.s1, -t2, t2, y - 0.002, y + 0.012, C(o.threshold || '#8d8f92'));
      }
      return;
    }
    if (o.kind === 'arch') {
      if (!W.ext && o.casing !== false) casings(g, W, o, C(o.casingCol || pal.doorFrame));
      boxW(g, W, o.s0, o.s1, -t2 - 0.002, t2 + 0.002, y - 0.002, y + 0.004, C(o.threshold || '#b89a72'));
      return;
    }
    const isExt = W.ext;
    if (o.garage) {
      const vf = isExt ? revealSplit(W) : 0, vv = vf - sgn * 0.05;
      const v0g = Math.min(vf, vv), v1g = Math.max(vf, vv), gc = C(o.leafCol || '#3b3e43');
      const n = 5, hh = (o.y1 - o.y0) / n;
      for (let k = 0; k < n; k++) boxW(g, W, o.s0, o.s1, v0g, v1g, o.y0 + k * hh + 0.004, o.y0 + (k + 1) * hh - 0.004, gc.clone().multiplyScalar(k % 2 ? 0.96 : 1.03));
      boxW(g, W, o.s0 - 0.05, o.s1 + 0.05, Math.min(vf, vf + sgn * 0.02), Math.max(vf, vf + sgn * 0.02), o.y1, o.y1 + 0.08, gc);
      return;
    }
    const fc = C(o.frameCol || (isExt ? pal.extDoor : pal.doorFrame));
    const fw = 0.045;
    const yb = o.y0, yt = o.y1;
    let vA, vB;
    if (isExt) { const vf = revealSplit(W); vA = vf; vB = vf - sgn * 0.09; } else { vA = -t2 - 0.004; vB = t2 + 0.004; }
    const v0 = Math.min(vA, vB), v1 = Math.max(vA, vB);
    boxW(g, W, o.s0, o.s0 + fw, v0, v1, yb, yt, fc);
    boxW(g, W, o.s1 - fw, o.s1, v0, v1, yb, yt, fc);
    boxW(g, W, o.s0, o.s1, v0, v1, yt - fw, yt, fc);
    if (!isExt) casings(g, W, o, C(o.casingCol || pal.doorFrame));
    else {
      const vin = -sgn * t2;
      boxW(g, W, o.s0 - 0.07, o.s0, Math.min(vin, vin - sgn * 0.015), Math.max(vin, vin - sgn * 0.015), yb, yt + 0.07, C(pal.base));
      boxW(g, W, o.s1, o.s1 + 0.07, Math.min(vin, vin - sgn * 0.015), Math.max(vin, vin - sgn * 0.015), yb, yt + 0.07, C(pal.base));
      boxW(g, W, o.s0 - 0.07, o.s1 + 0.07, Math.min(vin, vin - sgn * 0.015), Math.max(vin, vin - sgn * 0.015), yt, yt + 0.07, C(pal.base));
    }
    boxW(g, W, o.s0 + fw, o.s1 - fw, v0, v1, y - 0.002, y + 0.008, C(o.threshold || (isExt ? '#7c7a76' : '#b89a72')));
    if (o.leaf === 'none') return;
    const leafW = width - 2 * fw - 0.006, leafH = yt - yb - fw - 0.012, th = isExt ? 0.068 : 0.04;
    const hingeA = (o.hinge || 'a') === 'a';
    const swing = o.swing ?? (isExt ? -W.out : 1);
    const uh = hingeA ? o.s0 + fw + 0.003 : o.s1 - fw - 0.003;
    const vh = isExt ? (swing === -W.out ? (sgn > 0 ? v0 : v1) : (sgn > 0 ? v1 : v0)) : swing * t2;
    const s = hingeA ? 1 : -1;
    const dClosed = [W.d[0] * s, W.d[1] * s], dOpen = [W.n[0] * swing, W.n[1] * swing];
    const ang = ((o.angle ?? (isExt ? 0 : 88)) * Math.PI) / 180;
    const hp = WP(W, uh, vh, yb + 0.006);
    const zs = (s === -swing) ? 1 : -1;
    const lg = new Geo();
    lg.use('wall');
    const leafCol = C(o.leafCol || (isExt ? pal.extDoor : pal.door));
    const z0 = Math.min(0, zs * th), z1 = Math.max(0, zs * th);
    lg.cb(0.004, 0, z0, leafW, leafH, z1, 0.006, leafCol);
    if (isExt) {
      lg.bx(leafW * 0.2, leafH * 0.18, z1 - 0.004, leafW * 0.32, leafH * 0.85, z1 + 0.004, C('#9fb3bd'));
      lg.bx(leafW * 0.2, leafH * 0.18, z0 - 0.004, leafW * 0.32, leafH * 0.85, z0 + 0.004, C('#9fb3bd'));
    } else if (o.style === 'panel') {
      for (const zz of [z0 - 0.003, z1]) lg.bx(0.1, 0.18, zz, leafW - 0.1, leafH - 0.18, zz + 0.003, shade(leafCol, 0.96));
    } else if (o.style === 'glass') {
      for (const zz of [z0 - 0.003, z1]) lg.bx(0.14, leafH * 0.45, zz, leafW - 0.14, leafH - 0.18, zz + 0.003, C('#c7d6dc'));
    }
    const hc = C(o.handleCol || (isExt ? '#c6c9cc' : '#bfc2c5'));
    const hx = leafW - 0.075;
    for (const [zz, dz] of [[z1, 1], [z0, -1]]) {
      lg.bx(hx - 0.02, 1.0, Math.min(zz, zz + dz * 0.012), hx + 0.02, 1.13, Math.max(zz, zz + dz * 0.012), hc);
      lg.bx(hx - 0.14, 1.04, Math.min(zz + dz * 0.04, zz + dz * 0.06), hx + 0.01, 1.065, Math.max(zz + dz * 0.04, zz + dz * 0.06), hc);
      lg.bx(hx - 0.012, 1.04, Math.min(zz, zz + dz * 0.05), hx + 0.012, 1.065, Math.max(zz, zz + dz * 0.05), hc);
    }
    const geo = lg.geometry('wall', { cap: true });
    const leaf = new THREE.Mesh(geo, G.mat);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    const pivot = new THREE.Group();
    pivot.position.set(hp[0], hp[1], hp[2]);
    const yaw0 = Math.atan2(-dClosed[1], dClosed[0]);
    const dirAt = (k) => { const a = ang * 0 + k; return [dClosed[0] * Math.cos(a) + dOpen[0] * Math.sin(a), dClosed[1] * Math.cos(a) + dOpen[1] * Math.sin(a)]; };
    const setK = (k) => { const dd = dirAt(k); pivot.rotation.y = Math.atan2(-dd[1], dd[0]); };
    setK(ang);
    pivot.add(leaf);
    G.extra.push(pivot);
    doors.set(o.id, { o, W, pivot, setK, ang, max: (o.maxAngle ?? 95) * Math.PI / 180, yaw0 });
  }

  function casings(g, W, o, col) {
    const t2 = W.t / 2, yb = o.y0, yt = o.y1, cw = 0.07, cd = 0.014;
    for (const sd of [1, -1]) {
      if (W.ext && sd === W.out) continue;
      const va = sd * t2, vb = sd * (t2 + cd);
      boxW(g, W, o.s0 - cw, o.s0, Math.min(va, vb), Math.max(va, vb), yb, yt + cw, col);
      boxW(g, W, o.s1, o.s1 + cw, Math.min(va, vb), Math.max(va, vb), yb, yt + cw, col);
      boxW(g, W, o.s0 - cw, o.s1 + cw, Math.min(va, vb), Math.max(va, vb), yt, yt + cw, col);
    }
    boxW(g, W, o.s0, o.s0 + 0.02, -t2 - 0.003, t2 + 0.003, yb, yt, col);
    boxW(g, W, o.s1 - 0.02, o.s1, -t2 - 0.003, t2 + 0.003, yb, yt, col);
    boxW(g, W, o.s0, o.s1, -t2 - 0.003, t2 + 0.003, yt - 0.02, yt, col);
  }

  function boxW(g, W, u0, u1, v0, v1, y0, y1, col, o) {
    const pts = [WP(W, u0, v0, y0), WP(W, u1, v0, y0), WP(W, u1, v1, y0), WP(W, u0, v1, y0)];
    const top = pts.map((p) => [p[0], y1, p[2]]);
    const ctr = WP(W, (u0 + u1) / 2, (v0 + v1) / 2, (y0 + y1) / 2);
    g.face([pts[0], pts[1], pts[2], pts[3]], ctr, o?.bottom || col);
    g.face(top, ctr, o?.top || col);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; g.face([pts[i], pts[j], top[j], top[i]], ctr, col); }
  }

  function glassPane(gl, W, u0, u1, y0, y1, v) {
    gl.face([WP(W, u0, v, y0), WP(W, u1, v, y0), WP(W, u1, v, y1), WP(W, u0, v, y1)], WP(W, (u0 + u1) / 2, v - 1, (y0 + y1) / 2), C('#ffffff'));
  }

  for (const W of walls) drawWall(W);

  for (const W of walls) {
    const ops = W.ops.map((o) => ({ id: o.id, t0: r3(clamp(o.s0 / W.len, 0, 1)), t1: r3(clamp(o.s1 / W.len, 0, 1)), kind: o.kind === 'arch' ? 'door' : o.kind, sill: r3(o.sill ?? 0), head: r3(o.head ?? 2.05), s0: r3(o.s0), s1: r3(o.s1) }));
    data.walls.push({ id: W.id, floor: W.floor, a: W.a.map(r3), b: W.b.map(r3), thick: W.t, exterior: W.ext, side: W.side, len: r3(W.len), openings: ops });
  }

  const voids = spec.voids || [];
  for (const fl of floors) {
    const g = stat[fl.index];
    g.use('satin');
    const vs = voids.filter((v) => v.floor === fl.index);
    for (const r of rooms) {
      if (r.floor !== fl.index) continue;
      if (!r.open) {
        for (const rc of rectsOf(r.poly)) {
          let parts = [rc];
          for (const v of vs) {
            const next = [];
            for (const p of parts) {
              const [x0, z0, x1, z1] = p;
              if (v.x1 <= x0 || v.x0 >= x1 || v.z1 <= z0 || v.z0 >= z1) { next.push(p); continue; }
              if (v.z0 > z0) next.push([x0, z0, x1, v.z0]);
              if (v.z1 < z1) next.push([x0, v.z1, x1, z1]);
              const za = Math.max(z0, v.z0), zb = Math.min(z1, v.z1);
              if (v.x0 > x0) next.push([x0, za, v.x0, zb]);
              if (v.x1 < x1) next.push([v.x1, za, x1, zb]);
            }
            parts = next;
          }
          g.use('matte');
          for (const p of parts) g.bx(p[0], fl.y - fl.slab, p[1], p[2], fl.y - 0.006, p[3], C(P.section), { top: C(r.floor === 0 ? '#8a857d' : '#8a857d') });
        }
      }
      const fin = r.floorFinish || { type: 'planks', color: P.oak };
      const gf = stat[fl.index];
      gf.use(fin.mat || 'satin');
      let seed = 1;
      for (const ch of r.id) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
      for (const rc of rectsOf(r.inner)) {
        let parts = [rc];
        for (const v of vs) {
          const next = [];
          for (const p of parts) {
            const [x0, z0, x1, z1] = p;
            if (v.x1 <= x0 || v.x0 >= x1 || v.z1 <= z0 || v.z0 >= z1) { next.push(p); continue; }
            if (v.z0 > z0) next.push([x0, z0, x1, v.z0]);
            if (v.z1 < z1) next.push([x0, v.z1, x1, z1]);
            const za = Math.max(z0, v.z0), zb = Math.min(z1, v.z1);
            if (v.x0 > x0) next.push([x0, za, v.x0, zb]);
            if (v.x1 < x1) next.push([v.x1, za, x1, zb]);
          }
          parts = next;
        }
        for (const p of parts) {
          if (fin.type !== 'marble' && fin.type !== 'concrete' && fin.type !== 'carpet') {
            gf.use('matte');
            gf.poly([[p[0], p[1]], [p[2], p[1]], [p[2], p[3]], [p[0], p[3]]], fl.y - 0.0025, C(fin.grout || shade(fin.color || P.oak, fin.type === 'planks' ? 0.55 : 0.82)));
            gf.use(fin.mat || 'satin');
          }
          fillPattern(gf, p, fl.y, fin, seed++);
        }
      }
      if (!r.open) {
        const cg = ceil[fl.index];
        const cc = C(r.ceiling?.color || '#f4f2ee');
        for (const rc of rectsOf(r.inner)) cg.poly([[rc[0], rc[1]], [rc[2], rc[1]], [rc[2], rc[3]], [rc[0], rc[3]]], fl.y + fl.height, cc, false);
      }
    }
  }

  const items = [];
  const facesOf = (room) => faces.filter((f) => f.room === room);

  function snapWall(fl, x, z, nx, nz, maxD = 0.5, roomId = null, exterior = false) {
    let best = null;
    for (const f of faces) {
      if (f.floor !== fl) continue;
      if (exterior !== null && !!f.exterior !== !!exterior) continue;
      if (roomId && (!f.room || f.room.id !== roomId)) continue;
      const W = f.W, sd = f.sd;
      const fn = [W.n[0] * sd, W.n[1] * sd];
      if (nx != null && fn[0] * nx + fn[1] * nz < 0.9) continue;
      const rx = x - W.a[0], rz = z - W.a[1];
      const u = rx * W.d[0] + rz * W.d[1], q = rx * W.n[0] + rz * W.n[1];
      const dist = Math.abs(q - sd * W.t / 2);
      if (dist > maxD || u < f.u0 - 0.02 || u > f.u1 + 0.02) continue;
      if (!best || dist < best.dist) best = { f, u, dist, W, sd, fn, pos: WP(W, u, sd * W.t / 2, 0) };
    }
    return best;
  }

  const ctx = {
    pal, P, C, shade, mixc, rng, hash, floors, rooms, roomById, M,
    lamp: [], outlets: [], fix: null
  };

  function placeItem(it, idx) {
    const room = roomById.get(it.room);
    if (!room) { console.warn('[buildings] item room missing', it); return; }
    const fl = room.floor, fy = FY(fl);
    const fn = KIT[it.t];
    if (!fn) { console.warn('[buildings] unknown item', it.t); return; }
    const rot = it.r || 0;
    const fx = Math.sin(rot), fz = Math.cos(rot);
    let x = it.x, z = it.z, y = fy + (it.y || 0);
    let g = stat[fl], wall = null;
    const wantWall = it.wall ?? fn.wall;
    if (wantWall) {
      const s = snapWall(fl, x, z, fx, fz, 0.6, null, !!it.ext);
      if (s) {
        wall = s;
        x = s.pos[0] + s.fn[0] * 0.0005; z = s.pos[2] + s.fn[1] * 0.0005;
        g = wg(fl, s.W.side).geo;
        g.lock = 'wall';
      } else console.warn('[buildings] wall item without wall', it.t, it.room, it.x, it.z);
    }
    g.use('matte');
    g.at(x, y, z, rot);
    const prevAO = g.ao, prevJ = g.jit;
    if (!wall) g.ao = { y0: fy, h: it.aoH ?? 0.32, min: it.aoMin ?? 0.66 };
    g.jit = it.jit ?? 0.022;
    const meta = fn(g, it, ctx) || {};
    g.ao = prevAO; g.jit = prevJ;
    g.pop();
    if (wall) { g.lock = null; g.use('wall'); }
    const id = it.id || `${it.t}-${room.id}-${idx}`;
    const size = meta.size || [0.5, 0.5, 0.5];
    const T = (p) => [x + p[0] * Math.cos(rot) + p[2] * Math.sin(rot), y + p[1], z - p[0] * Math.sin(rot) + p[2] * Math.cos(rot)];
    const rec = { it, id, room, fl, x, y, z, rot, meta, size, wall, T };
    items.push(rec);
    if (!meta.noData) data.furniture.push({ id, kind: meta.kind || it.t, floor: fl, room: room.id, pos: [r3(x), r3(y), r3(z)], rot: r3(rot), size: size.map(r3), wall: !!wall });
    if (!wall && !meta.noShadow && size[0] * size[2] > 0.08) {
      const off = meta.center || [0, 0, 0];
      const c = T(off);
      ovl[fl].rect(c[0], c[2], size[0] * (meta.shadowK ?? 1), size[2] * (meta.shadowK ?? 1), rot, fy + 0.004, meta.feather ?? 0.12, meta.shadowA ?? 0.3);
    }
    return rec;
  }

  (spec.items || []).forEach((it, i) => { try { placeItem(it, i); } catch (e) { console.warn('[buildings] item failed', it.t, e); } });

  const circuitById = new Map(data.circuits.map((c) => [c.id, c]));
  const lightCircuit = (roomId) => (data.circuits.find((c) => c.kind === 'light' && c.rooms.includes(roomId)) || {}).id;
  const socketCircuit = (roomId) => (data.circuits.find((c) => c.kind === 'socket' && c.rooms.includes(roomId)) || data.circuits.find((c) => c.rooms.includes(roomId)) || {}).id;

  function makeFixture(def) {
    const { id, room, circuit, kind, bulbs, glow, parent, floor } = def;
    const mat = fixtureMaterial(def.glassCol || '#fbf6ec', def.emissive || '#ffd8a0');
    const obj = new THREE.Group();
    obj.name = id;
    let bulbMesh = null;
    const bg = new Geo();
    bg.use('b');
    for (const b of bulbs) bulbInto(bg, b);
    const bgeo = bg.geometry('b');
    if (bgeo) {
      bulbMesh = new THREE.Mesh(bgeo, mat);
      bulbMesh.name = `${id}-bulb`;
      obj.add(bulbMesh);
    }
    if (glow) {
      const gg = glow.geometry('glow');
      if (gg) { const gm = new THREE.Mesh(gg, mat); gm.name = `${id}-glow`; obj.add(gm); }
    }
    (parent || floorGroups[floor].group).add(obj);
    const b0 = bulbs[0];
    const sockKind = b0 && (b0.kind === 'GU10' ? 'socketGU10' : b0.kind === 'E27' ? 'socketE27' : null);
    const lp = def.lightPos || (b0 ? [b0.pos[0], b0.pos[1] + (b0.up ? 0.06 : -0.06), b0.pos[2]] : [0, 0, 0]);
    const socket = sockKind ? { kind: sockKind, pos: b0.pos.map(r3), quat: b0.up ? [1, 0, 0, 0] : [0, 0, 0, 1] } : null;
    const f = { id, room, circuit, kind, object3d: obj, emissive: mat, bulb: bulbMesh, lightPos: lp.map(r3), socket, floor };
    fixtures.push(f);
    data.fixtures.push({ id, room, floor, circuit, kind, lightPos: f.lightPos, socket });
    if (socket) addMount({ room, floor, kind: sockKind, pos: socket.pos, normal: b0.up ? [0, 1, 0] : [0, -1, 0], quat: socket.quat, circuit, fixture: id, tags: [kind] });
    if (!circuitById.has(circuit)) console.warn('[buildings] fixture circuit missing', id, circuit);
    return f;
  }

  (spec.lights || []).forEach((L, i) => {
    const room = roomById.get(L.room);
    if (!room) { console.warn('[buildings] light room missing', L); return; }
    const fl = room.floor, fy = FY(fl);
    const fn = LIGHTS[L.t];
    if (!fn) { console.warn('[buildings] unknown light', L.t); return; }
    const onWall = fn.wall || L.wall;
    let y = L.y != null ? fy + L.y : fy + FH(fl), x = L.x, z = L.z, rot = L.r || 0, g = stat[fl], parent = null;
    if (onWall) {
      const s = snapWall(fl, x, z, Math.sin(rot), Math.cos(rot), 0.6, null, !!L.ext);
      if (s) { x = s.pos[0]; z = s.pos[2]; const G = wg(fl, s.W.side); g = G.geo; parent = G; g.lock = 'wall'; }
      else console.warn('[buildings] wall light without wall', L);
    }
    g.use(onWall ? 'wall' : 'matte');
    g.at(x, y, z, rot);
    const glow = new Geo();
    glow.use('glow');
    glow.at(x, y, z, rot);
    const res = fn(g, L, glow) || {};
    glow.pop();
    g.pop();
    if (parent) { g.lock = null; g.use('wall'); }
    const T = (p) => [x + p[0] * Math.cos(rot) + p[2] * Math.sin(rot), y + p[1], z - p[0] * Math.sin(rot) + p[2] * Math.cos(rot)];
    const bulbs = (res.bulbs || []).map((b) => ({ ...b, pos: T(b.pos) }));
    const circuit = L.circuit || lightCircuit(room.id);
    const f = makeFixture({ id: L.id || `lampa-${room.id}-${i + 1}`, room: room.id, floor: fl, circuit, kind: res.kind || L.t, bulbs, glow: res.glow ? glow : null, parent: parent ? null : null, lightPos: res.lightPos ? T(res.lightPos) : null, glassCol: res.glassCol, emissive: res.emissive });
    if (parent) parent.extra.push(f.object3d);
  });

  for (const rec of items) {
    const lamps = rec.meta.lamps || [];
    lamps.forEach((lp, k) => {
      const circuit = rec.it.circuit || socketCircuit(rec.room.id);
      const bulbs = [{ ...lp, pos: rec.T(lp.pos) }];
      makeFixture({ id: `${rec.id}-lampa${lamps.length > 1 ? k + 1 : ''}`, room: rec.room.id, floor: rec.fl, circuit, kind: lp.lampKind || 'lamp', bulbs, glassCol: lp.glassCol });
    });
  }

  for (const W of walls) {
    if (!W.ext || W.noRad) continue;
    for (const o of W.ops) {
      if (o.kind !== 'window' || (o.sill ?? 0) < 0.55 || o.noRad) continue;
      const um = (o.s0 + o.s1) / 2, sdIn = -W.out;
      const px = W.a[0] + W.d[0] * um + W.n[0] * sdIn * (W.t / 2 + 0.3), pz = W.a[1] + W.d[1] * um + W.n[1] * sdIn * (W.t / 2 + 0.3);
      const room = indoorAt(W.floor, px, pz);
      if (!room || room.rad === false || spec.radiators === false) continue;
      const fy = FY(W.floor);
      const rw = clamp(Math.round(Math.min(o.s1 - o.s0 - 0.2, room.kind === 'bath' ? 0.6 : 1.4) * 10) / 10, 0.4, 1.6);
      const fn = [W.n[0] * sdIn, W.n[1] * sdIn];
      const pos = WP(W, um, sdIn * W.t / 2, fy);
      let blocked = false;
      for (const rec of items) {
        if (rec.fl !== W.floor || rec.wall) continue;
        const dx = rec.x - pos[0], dz = rec.z - pos[2];
        const along = Math.abs(dx * W.d[0] + dz * W.d[1]), across = dx * fn[0] + dz * fn[1];
        const half = Math.max(rec.size[0], rec.size[2]) / 2;
        if (across > -0.05 && across < 0.15 + rec.size[2] && along < half + rw / 2 - 0.05 && rec.size[1] > 0.5) blocked = true;
      }
      if (blocked) continue;
      placeItem({ t: room.kind === 'bath' && o.s1 - o.s0 < 0.9 ? 'radiator' : 'radiator', room: room.id, x: pos[0], z: pos[2], r: YAW(fn[0], fn[1]), w: rw, y: 0.14, auto: true }, 900 + W.i);
    }
  }

  for (const rec of items) {
    const m = rec.meta;
    if (m.radiator) {
      const v = rec.T(m.radiator.valve);
      const dl = m.radiator.dir;
      const dw = [dl[0] * Math.cos(rec.rot) + dl[2] * Math.sin(rec.rot), 0, -dl[0] * Math.sin(rec.rot) + dl[2] * Math.cos(rec.rot)];
      addMount({ room: rec.room.id, floor: rec.fl, kind: 'radiator', pos: v, normal: dw, quat: qYaw(YAW(dw[0], dw[2])), tags: [rec.it.t === 'towelRail' ? 'towel' : 'panel'] });
    }
    if (m.surfaces) for (const s of m.surfaces) {
      const n = Math.max(1, Math.floor(s.w / 0.55));
      for (let k = 0; k < n; k++) {
        const lx = s.x - s.w / 2 + (k + 0.5) * (s.w / n);
        const p = rec.T([lx, s.y, s.z]);
        addMount({ room: rec.room.id, floor: rec.fl, kind: 'surface', pos: p, normal: [0, 1, 0], quat: qYaw(rec.rot + (s.rot || 0)), tags: [s.tag || rec.it.t] });
      }
    }
    if (m.strips) for (const s of m.strips) data.strips.push({ id: `${s.kind}-${rec.id}`, room: rec.room.id, floor: rec.fl, kind: s.kind, points: s.pts.map((p) => rec.T(p).map(r3)) });
    if (m.tv) {
      const p = rec.T(m.tv.pos);
      const fx = Math.sin(rec.rot), fz = Math.cos(rec.rot);
      addMount({ room: rec.room.id, floor: rec.fl, kind: 'tv', pos: p, normal: [fx, 0, fz], quat: qYaw(rec.rot), tags: [m.tv.tag || 'tv'] });
    }
    if (m.mounts) for (const mm of m.mounts) {
      const p = rec.T(mm.pos);
      const dl = mm.n || [0, 0, 1];
      const dw = [dl[0] * Math.cos(rec.rot) + dl[2] * Math.sin(rec.rot), dl[1], -dl[0] * Math.sin(rec.rot) + dl[2] * Math.cos(rec.rot)];
      addMount({ room: mm.room || rec.room.id, floor: rec.fl, kind: mm.kind, pos: p, normal: dw, quat: Math.abs(dw[1]) > 0.9 ? qYaw(rec.rot) : qYaw(YAW(dw[0], dw[2])), tags: mm.tags || [], circuit: mm.circuit });
    }
    if (m.outlets) for (const o of m.outlets) {
      const p = rec.T(o.pos);
      const fx = Math.sin(rec.rot), fz = Math.cos(rec.rot);
      const s = snapWall(rec.fl, p[0] - fx * 0.02, p[2] - fz * 0.02, fx, fz, 0.9, rec.room.id, false) || snapWall(rec.fl, p[0], p[2], null, null, 0.6, rec.room.id, false);
      if (s) addOutlet(rec.fl, s, FY(rec.fl) + (o.y ?? o.pos[1]), o.n || 2, rec.room.id, o.tag);
    }
  }

  function addOutlet(fl, s, y, n, roomId, tag) {
    const W = s.W, sd = s.sd, u = s.u;
    for (const oc of occupied) if (oc.W === W && oc.sd === sd && Math.abs(oc.u - u) < 0.25 && Math.abs(oc.y - y) < 0.2) return;
    occupied.push({ W, sd, u, y });
    const G = wg(fl, W.side), g = G.geo;
    const w = 0.075 * n + 0.012, v0 = sd * W.t / 2, v1 = sd * (W.t / 2 + 0.011);
    boxW(g, W, u - w / 2, u + w / 2, Math.min(v0, v1), Math.max(v0, v1), y - 0.044, y + 0.044, C('#f3f2ee'));
    for (let k = 0; k < n; k++) {
      const uc = u - w / 2 + 0.006 + 0.075 * k + 0.0375;
      boxW(g, W, uc - 0.02, uc + 0.02, Math.min(v1, v1 + sd * 0.002), Math.max(v1, v1 + sd * 0.002), y - 0.02, y + 0.02, C('#e2e1dc'));
    }
    const pos = WP(W, u, sd * W.t / 2, y);
    const fn = [W.n[0] * sd, W.n[1] * sd];
    const circuit = socketCircuit(roomId);
    const id = `gniazdo-${roomId}-${data.outlets.length + 1}`;
    data.outlets.push({ id, room: roomId, floor: fl, pos: pos.map(r3), normal: [r3(fn[0]), 0, r3(fn[1])], circuit, n });
    addMount({ room: roomId, floor: fl, kind: 'socket', pos, normal: [fn[0], 0, fn[1]], quat: qYaw(YAW(fn[0], fn[1])), circuit, tags: [tag || 'outlet'] });
  }

  function addSwitch(fl, W, sd, u, roomId) {
    const y = FY(fl) + 1.1;
    for (const oc of occupied) if (oc.W === W && oc.sd === sd && Math.abs(oc.u - u) < 0.2 && Math.abs(oc.y - y) < 0.2) return;
    occupied.push({ W, sd, u, y });
    const g = wg(fl, W.side).geo;
    const v0 = sd * W.t / 2, v1 = sd * (W.t / 2 + 0.011);
    boxW(g, W, u - 0.043, u + 0.043, Math.min(v0, v1), Math.max(v0, v1), y - 0.043, y + 0.043, C('#f3f2ee'));
    boxW(g, W, u - 0.03, u + 0.03, Math.min(v1, v1 + sd * 0.004), Math.max(v1, v1 + sd * 0.004), y - 0.03, y + 0.03, C('#eceae5'));
    const pos = WP(W, u, sd * W.t / 2, y), fn = [W.n[0] * sd, W.n[1] * sd];
    const circuit = lightCircuit(roomId);
    const id = `wlacznik-${roomId}-${data.switches.length + 1}`;
    data.switches.push({ id, room: roomId, floor: fl, pos: pos.map(r3), normal: [r3(fn[0]), 0, r3(fn[1])], circuit });
    addMount({ room: roomId, floor: fl, kind: 'switch', pos, normal: [fn[0], 0, fn[1]], quat: qYaw(YAW(fn[0], fn[1])), circuit, tags: ['switch'] });
  }

  for (const W of walls) {
    for (const o of W.ops) {
      if (o.kind !== 'door' && o.kind !== 'arch') continue;
      const hingeA = (o.hinge || 'a') === 'a';
      for (const sd of [1, -1]) {
        if (W.ext && sd === W.out) continue;
        const latchU = hingeA ? o.s1 + 0.17 : o.s0 - 0.17;
        const px = W.a[0] + W.d[0] * latchU + W.n[0] * sd * (W.t / 2 + 0.1), pz = W.a[1] + W.d[1] * latchU + W.n[1] * sd * (W.t / 2 + 0.1);
        const room = indoorAt(W.floor, px, pz);
        if (!room || room.noSwitch) continue;
        const f = faces.find((ff) => ff.W === W && ff.sd === sd && latchU > ff.u0 + 0.05 && latchU < ff.u1 - 0.05 && ff.room === room);
        if (!f) continue;
        const swingSide = (o.swing ?? 1) === sd;
        if (o.kind === 'door' && swingSide && o.leaf !== 'none' && !W.ext) { /* latch side is clear even on swing side */ }
        addSwitch(W.floor, W, sd, latchU, room.id);
      }
    }
  }

  for (const r of rooms) {
    if (r.open || r.noOutlets) continue;
    const fs = facesOf(r).filter((f) => f.kind === 'solid' && f.u1 - f.u0 > 1.6);
    fs.sort((a, b) => (b.u1 - b.u0) - (a.u1 - a.u0));
    let n = 0;
    for (const f of fs) {
      if (n >= (r.kind === 'bath' || r.kind === 'wc' || r.kind === 'hall' ? 1 : 2)) break;
      const u = (f.u0 + f.u1) / 2;
      const s = { W: f.W, sd: f.sd, u, fn: [f.W.n[0] * f.sd, f.W.n[1] * f.sd] };
      const pos = WP(f.W, u, f.sd * f.W.t / 2, 0);
      let hidden = false;
      for (const rec of items) {
        if (rec.fl !== r.floor || rec.wall) continue;
        const dx = rec.x - pos[0], dz = rec.z - pos[2];
        if (Math.hypot(dx, dz) < Math.max(rec.size[0], rec.size[2]) * 0.5 + 0.1 && rec.size[1] > 0.95) hidden = true;
      }
      if (hidden) continue;
      addOutlet(r.floor, s, FY(r.floor) + (r.kind === 'bath' ? 1.15 : 0.3), r.kind === 'bath' ? 1 : 2, r.id, 'outlet');
      n++;
    }
  }

  const blockers = (fl) => items.filter((rec) => rec.fl === fl);
  function wallFree(f, u, y, pad = 0.18) {
    const W = f.W, sd = f.sd, fn = [W.n[0] * sd, W.n[1] * sd];
    const pos = WP(W, u, sd * W.t / 2, y);
    for (const rec of blockers(f.floor)) {
      const top = rec.y + rec.size[1];
      const bottom = rec.y;
      if (y < bottom - 0.08 || y > top + 0.08) continue;
      const c = Math.cos(rec.rot), s = Math.sin(rec.rot);
      const dx = pos[0] - rec.x, dz = pos[2] - rec.z;
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      const hw = rec.size[0] / 2 + pad, back = rec.wall ? 0 : -rec.size[2] / 2;
      if (Math.abs(lx) < hw && lz > back - 0.3 && lz < back + rec.size[2] + 0.25) return false;
      void fn;
    }
    for (const oc of occupied) if (oc.W === W && oc.sd === sd && Math.abs(oc.u - u) < 0.2 && Math.abs(oc.y - y) < 0.25) return false;
    for (const rv of reserved) if (rv.W === W && rv.sd === sd && Math.abs(rv.u - u) < rv.w / 2 + 0.15 && Math.abs(rv.y - y) < rv.h / 2 + 0.15) return false;
    return true;
  }

  function anchor(spec2, kind, w, h) {
    if (!spec2) return null;
    const room = roomById.get(spec2.room);
    const fl = room.floor, fy = FY(fl);
    const s = snapWall(fl, spec2.x, spec2.z, spec2.nx ?? null, spec2.nz ?? null, 0.8, room.id, false);
    if (!s) { console.warn('[buildings] anchor wall not found', kind, spec2); return null; }
    const y = fy + spec2.y;
    const pos = WP(s.W, s.u, s.sd * s.W.t / 2, y);
    reserved.push({ W: s.W, sd: s.sd, u: s.u, y, w, h });
    const q = qYaw(YAW(s.fn[0], s.fn[1]));
    return { room: room.id, floor: fl, pos: pos.map(r3), quat: q, normal: [r3(s.fn[0]), 0, r3(s.fn[1])] };
  }
  if (spec.panel) data.panel = { ...anchor(spec.panel, 'panel', 0.45, 0.65), rows: spec.panel.rows || 3, slotsPerRow: spec.panel.slotsPerRow || 12, phases: spec.panel.phases || 1 };
  if (spec.rack) data.rack = { ...anchor(spec.rack, 'rack', 0.62, 0.7), units: spec.rack.units || 9 };
  if (spec.mediaBox) data.mediaBox = anchor(spec.mediaBox, 'mediaBox', 0.38, 0.52);
  if (spec.wan) data.wan = anchor(spec.wan, 'wan', 0.25, 0.25);

  for (const f of faces) {
    if (f.exterior || f.kind === 'sill' && f.y1 - f.y0 < 1.0) continue;
    const H = FH(f.floor), fy = FY(f.floor);
    const len = f.u1 - f.u0;
    if (len < 0.6) continue;
    const n = Math.max(1, Math.round(len / 1.25));
    for (let k = 0; k < n; k++) {
      const u = f.u0 + ((k + 0.5) * len) / n;
      for (const hh of [1.1, 2.2]) {
        if (hh > H - 0.15) continue;
        const yy = fy + hh;
        if (yy < f.y0 + 0.05 || yy > f.y1 - 0.05) continue;
        if (!wallFree(f, u, yy)) continue;
        const pos = WP(f.W, u, f.sd * f.W.t / 2, yy), fn = [f.W.n[0] * f.sd, f.W.n[1] * f.sd];
        addMount({ room: f.room.id, floor: f.floor, kind: 'wall', pos, normal: [fn[0], 0, fn[1]], quat: qYaw(YAW(fn[0], fn[1])), tags: [hh > 2 ? 'high' : 'mid', f.W.ext ? 'outerWall' : 'innerWall'] });
      }
    }
  }

  for (const r of rooms) {
    if (r.open) continue;
    const fy = FY(r.floor), H = FH(r.floor);
    for (const rc of rectsOf(r.inner)) {
      const [x0, z0, x1, z1] = rc;
      const w = x1 - x0, d = z1 - z0;
      if (w < 0.5 || d < 0.5) continue;
      const nx = Math.max(1, Math.round((w - 0.6) / 1.3) + 1), nz = Math.max(1, Math.round((d - 0.6) / 1.3) + 1);
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const x = nx === 1 ? (x0 + x1) / 2 : x0 + 0.45 + (i * (w - 0.9)) / (nx - 1);
        const z = nz === 1 ? (z0 + z1) / 2 : z0 + 0.45 + (j * (d - 0.9)) / (nz - 1);
        if (!pip(x, z, r.inner)) continue;
        if (voids.some((v) => v.floor === r.floor && x > v.x0 && x < v.x1 && z > v.z0 && z < v.z1)) continue;
        const edge = i === 0 || j === 0 || i === nx - 1 || j === nz - 1;
        addMount({ room: r.id, floor: r.floor, kind: 'ceiling', pos: [x, fy + H, z], normal: [0, -1, 0], quat: [0, 0, 0, 1], tags: [edge && (nx > 1 || nz > 1) ? 'edge' : 'center'] });
      }
    }
  }

  for (const r of rooms) {
    if (r.open) continue;
    const fy = FY(r.floor);
    const fs = facesOf(r).filter((f) => f.y0 <= fy + 0.01 && f.u1 - f.u0 > 0.7);
    let n = 0;
    for (const f of fs) {
      const len = f.u1 - f.u0, k = Math.max(1, Math.floor(len / 1.8));
      for (let i = 0; i < k; i++) {
        const u = f.u0 + ((i + 0.5) * len) / k;
        const fn = [f.W.n[0] * f.sd, f.W.n[1] * f.sd];
        const p = WP(f.W, u, f.sd * (f.W.t / 2 + 0.22), fy);
        let blocked = false;
        for (const rec of blockers(r.floor)) {
          if (rec.wall && rec.y > fy + 0.3) continue;
          const c = Math.cos(rec.rot), s = Math.sin(rec.rot);
          const dx = p[0] - rec.x, dz = p[2] - rec.z;
          const lx = dx * c - dz * s, lz = dx * s + dz * c;
          const back = rec.wall ? 0 : -rec.size[2] / 2;
          if (Math.abs(lx) < rec.size[0] / 2 + 0.2 && lz > back - 0.2 && lz < back + rec.size[2] + 0.2) { blocked = true; break; }
        }
        if (blocked) continue;
        const tags = ['wallside'];
        if (data.outlets.some((o) => o.room === r.id && Math.hypot(o.pos[0] - p[0], o.pos[2] - p[2]) < 1.2)) tags.push('nearOutlet');
        if (r.kind === 'bath' || r.kind === 'wc' || r.kind === 'kitchen' || r.kind === 'tech') tags.push('wet');
        addMount({ room: r.id, floor: r.floor, kind: 'floor', pos: p, normal: [0, 1, 0], quat: qYaw(YAW(fn[0], fn[1])), tags });
        n++;
      }
    }
    void n;
  }

  for (const W of walls) {
    for (const o of W.ops) {
      const fy = FY(W.floor);
      if (o.kind === 'door' && o.leaf !== 'none') {
        const swing = o.swing ?? (W.ext ? -W.out : 1);
        const hingeA = (o.hinge || 'a') === 'a';
        const latch = hingeA ? o.s1 - 0.12 : o.s0 + 0.12;
        const sd = W.ext ? -W.out : swing;
        const px = W.a[0] + W.d[0] * latch + W.n[0] * sd * (W.t / 2 + 0.2), pz = W.a[1] + W.d[1] * latch + W.n[1] * sd * (W.t / 2 + 0.2);
        let room = indoorAt(W.floor, px, pz);
        if (!room) { const alt = indoorAt(W.floor, W.a[0] + W.d[0] * latch - W.n[0] * sd * (W.t / 2 + 0.2), W.a[1] + W.d[1] * latch - W.n[1] * sd * (W.t / 2 + 0.2)); room = alt; }
        if (!room) continue;
        const fn = [W.n[0] * sd, W.n[1] * sd];
        const pos = WP(W, latch, sd * (W.t / 2 + 0.005), o.y1 - 0.06);
        const tags = W.ext ? ['entrance', 'exterior'] : ['interior'];
        if (o.entrance) tags.push('main');
        addMount({ room: room.id, floor: W.floor, kind: 'door', pos, normal: [fn[0], 0, fn[1]], quat: qYaw(YAW(fn[0], fn[1])), tags, id: `drzwi-${o.id}` });
        if (o.entrance) {
          const lockP = WP(W, hingeA ? o.s1 - 0.1 : o.s0 + 0.1, sd * (W.t / 2 - (W.ext ? Math.min(0.14, W.t * 0.32) + 0.09 : 0)), fy + 1.05);
          const lv = W.ext ? revealSplit(W) - W.out * 0.09 : sd * W.t / 2;
          const lp = WP(W, hingeA ? o.s1 - 0.105 : o.s0 + 0.105, lv - sd * 0.0, fy + 1.05);
          void lockP;
          addMount({ room: room.id, floor: W.floor, kind: 'doorLock', pos: lp, normal: [fn[0], 0, fn[1]], quat: qYaw(YAW(fn[0], fn[1])), tags: ['entrance'], id: `zamek-${o.id}` });
          const outSd = W.ext ? W.out : -sd;
          const ofn = [W.n[0] * outSd, W.n[1] * outSd];
          const bellU = hingeA ? o.s1 + 0.22 : o.s0 - 0.22;
          const bell = WP(W, bellU, outSd * W.t / 2, fy + 1.3);
          addMount({ room: 'outdoor', floor: W.floor, kind: 'doorbell', pos: bell, normal: [ofn[0], 0, ofn[1]], quat: qYaw(YAW(ofn[0], ofn[1])), tags: ['entrance'], id: `dzwonek-${o.id}` });
          const th = WP(W, (o.s0 + o.s1) / 2, outSd * (W.t / 2 + 0.7), fy);
          data.entrance = { pos: th.map(r3), quat: qYaw(YAW(-ofn[0], -ofn[1])), door: o.id, room: room.id, floor: W.floor };
        }
      }
      if (o.kind === 'window' || o.kind === 'glass') {
        const sdIn = W.ext ? -W.out : 1;
        const px = W.a[0] + W.d[0] * ((o.s0 + o.s1) / 2) + W.n[0] * sdIn * (W.t / 2 + 0.3), pz = W.a[1] + W.d[1] * ((o.s0 + o.s1) / 2) + W.n[1] * sdIn * (W.t / 2 + 0.3);
        const room = indoorAt(W.floor, px, pz);
        if (!room) continue;
        const fn = [W.n[0] * sdIn, W.n[1] * sdIn];
        const sashes = o.sashes || [{ pa: o.s0, pb: o.s1, yb: o.y1 - 0.1, hu: o.s1 - 0.1 }];
        const pick = o.kind === 'glass' ? sashes.slice(0, Math.min(2, sashes.length)) : sashes.slice(0, 1);
        for (const s of pick) {
          const vv = W.ext ? revealSplit(W) - W.out * 0.075 : 0;
          const pos = WP(W, s.hu, vv - sdIn * 0.0, s.yb - 0.04);
          addMount({ room: room.id, floor: W.floor, kind: 'window', pos, normal: [fn[0], 0, fn[1]], quat: qYaw(YAW(fn[0], fn[1])), tags: [o.kind] });
        }
      }
    }
  }

  const zones = (spec.zones || []).map((z) => ({ id: z.id, kind: z.kind, floor: z.floor ?? 0, pos: [r3(z.pos[0]), r3(z.pos.length === 3 ? z.pos[1] : FY(z.floor ?? 0) + 0.5), r3(z.pos.length === 3 ? z.pos[2] : z.pos[1])], r: z.r ?? 3 }));
  data.zones = zones;

  for (const f of faces) {
    if (!f.exterior) continue;
    const fl = f.floor;
    if (fl !== (spec.outdoorFloor ?? 0) && !spec.outdoorAll) continue;
    const yy = FY(fl) + (spec.outdoorH ?? 2.55);
    if (yy < f.y0 + 0.05 || yy > f.y1 - 0.05) continue;
    const len = f.u1 - f.u0;
    if (len < 0.5) continue;
    const n = Math.max(1, Math.round(len / 2.6));
    for (let k = 0; k < n; k++) {
      const u = f.u0 + ((k + 0.5) * len) / n;
      const pos = WP(f.W, u, f.sd * f.W.t / 2, yy), fn = [f.W.n[0] * f.sd, f.W.n[1] * f.sd];
      if (spec.outdoorSkip && spec.outdoorSkip(pos, fn)) continue;
      const tags = [f.W.side];
      for (const z of zones) {
        const dx = z.pos[0] - pos[0], dz = z.pos[2] - pos[2], dist = Math.hypot(dx, dz);
        if (dist < 18 && (dx * fn[0] + dz * fn[1]) > -0.2 * dist) tags.push(z.kind);
      }
      addMount({ room: 'outdoor', floor: fl, kind: 'outdoorWall', pos, normal: [fn[0], 0, fn[1]], quat: qYaw(YAW(fn[0], fn[1])), tags: [...new Set(tags)] });
    }
  }

  for (const ex of spec.extraMounts || []) {
    const fl = ex.floor ?? 0;
    const pos = ex.pos.length === 3 ? ex.pos : [ex.pos[0], FY(fl) + (ex.y ?? 1.2), ex.pos[1]];
    const n = ex.normal || [0, 0, 1];
    addMount({ id: ex.id, room: ex.room || 'outdoor', floor: fl, kind: ex.kind, pos, normal: n, quat: Math.abs(n[1]) > 0.9 ? qYaw(ex.yaw || 0) : qYaw(YAW(n[0], n[2])), tags: ex.tags || [], circuit: ex.circuit });
  }

  for (const t of spec.tablets || []) {
    const room = roomById.get(t.room);
    if (!room) continue;
    const fl = room.floor, fy = FY(fl);
    if (t.kind === 'wall') {
      const s = snapWall(fl, t.x, t.z, t.nx ?? null, t.nz ?? null, 0.8, room.id, false);
      if (!s) { console.warn('[buildings] tablet wall missing', t.id); continue; }
      const pos = WP(s.W, s.u, s.sd * s.W.t / 2, fy + (t.y ?? 1.45));
      reserved.push({ W: s.W, sd: s.sd, u: s.u, y: pos[1], w: 0.3, h: 0.25 });
      data.tabletSpots.push({ id: t.id, room: room.id, floor: fl, kind: 'wall', pos: pos.map(r3), quat: qYaw(YAW(s.fn[0], s.fn[1])), normal: [r3(s.fn[0]), 0, r3(s.fn[1])], rating: t.rating, why: t.why });
    } else {
      data.tabletSpots.push({ id: t.id, room: room.id, floor: fl, kind: 'surface', pos: [r3(t.x), r3(fy + t.y), r3(t.z)], quat: qYaw(t.r || 0), normal: [0, 1, 0], rating: t.rating, why: t.why });
    }
  }

  for (const st of spec.stairs || []) drawStairs(st);
  function drawStairs(st) {
    const g = stat[st.floor];
    const fy = FY(st.floor), R = FY(st.floor + 1) - fy, rise = R / st.n;
    const d = st.dir, n = [-d[1], d[0]], w = st.w, run = st.run || 0.27, L = st.n * run;
    const T = (a, b, y) => [st.x + d[0] * a + n[0] * b, y, st.z + d[1] * a + n[1] * b];
    const tread = C(st.tread || P.oak), riser = C(st.riser || '#efece6'), side = C(st.stringer || '#efece6');
    for (let i = 0; i < st.n; i++) {
      const a0 = i * run, y1 = fy + (i + 1) * rise;
      g.use('satin');
      boxPts(g, [T(a0 - 0.025, -w / 2, y1 - 0.042), T(a0 + run + 0.005, -w / 2, y1 - 0.042), T(a0 + run + 0.005, w / 2, y1 - 0.042), T(a0 - 0.025, w / 2, y1 - 0.042)], 0.042, tread);
      if (st.closed !== false) {
        g.use('matte');
        boxPts(g, [T(a0 - 0.02, -w / 2, y1 - rise), T(a0, -w / 2, y1 - rise), T(a0, w / 2, y1 - rise), T(a0 - 0.02, w / 2, y1 - rise)], rise - 0.042, riser);
      }
    }
    g.use('matte');
    const yaw = Math.atan2(-d[1], d[0]), slope = Math.atan2(R, L), hyp = Math.hypot(L, R);
    for (const sdd of st.stringers || [-1, 1]) {
      const b = sdd * (w / 2 + 0.03);
      const mid = T(L / 2, b, fy + R / 2);
      g.at(mid[0], mid[1], mid[2], yaw, 0, slope);
      g.cb(-hyp / 2 - 0.05, -0.32, -0.03, hyp / 2 + 0.05, 0.08, 0.03, 0.008, side);
      g.pop();
    }
    if (st.under) {
      for (let i = 0; i < st.n; i++) {
        const a0 = i * run, y1 = fy + (i + 1) * rise - 0.042;
        boxPts(g, [T(a0, -w / 2, fy), T(a0 + run, -w / 2, fy), T(a0 + run, w / 2, fy), T(a0, w / 2, fy)], Math.max(0.01, y1 - fy - 0.002), C(st.under));
      }
    }
    if (st.rail) {
      const b = st.rail * (w / 2 - 0.04);
      const rc = C(st.railCol || '#2c2f33');
      g.use('metal');
      for (let i = 0; i <= st.n; i += 3) {
        const a = Math.min(i * run + run / 2, L - 0.1), yy = fy + (Math.min(i, st.n - 1) + 1) * rise;
        g.line(T(a, b, yy), T(a, b, yy + 0.9), 0.012, rc, 6);
      }
      g.line(T(0.1, b, fy + rise + 0.9), T(L - 0.1, b, fy + st.n * rise + 0.9), 0.022, rc, 8);
    }
  }

  for (const rl of spec.railings || []) {
    const fl = rl.floor, fy = FY(fl), g = stat[fl];
    const rc = C(rl.col || '#2c2f33');
    const pts = rl.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (rl.glass) {
        g.use('matte');
        const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
        boxPts(g, [[a[0] - dz * 0.03, fy, a[1] + dx * 0.03], [b[0] - dz * 0.03, fy, b[1] + dx * 0.03], [b[0] + dz * 0.03, fy, b[1] - dx * 0.03], [a[0] + dz * 0.03, fy, a[1] - dx * 0.03]], 0.06, rc);
        stat[fl].use('glass');
        const gl = stat[fl];
        gl.face([[a[0], fy + 0.06, a[1]], [b[0], fy + 0.06, b[1]], [b[0], fy + 1.02, b[1]], [a[0], fy + 1.02, a[1]]], [a[0] - dz, fy + 0.5, a[1] + dx], C('#ffffff'));
        g.use('metal');
        g.line([a[0], fy + 1.02, a[1]], [b[0], fy + 1.02, b[1]], 0.018, rc, 6);
      } else {
        g.use('metal');
        const nPost = Math.max(1, Math.round(len / (rl.spacing || 0.11)));
        for (let k = 0; k <= nPost; k++) {
          const t = k / nPost, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
          g.line([x, fy, z], [x, fy + 1.0, z], k === 0 || k === nPost ? 0.02 : rl.bar || 0.008, rc, 4);
        }
        g.line([a[0], fy + 1.0, a[1]], [b[0], fy + 1.0, b[1]], 0.025, C(rl.top || rl.col || '#2c2f33'), 6);
        g.line([a[0], fy + 0.08, a[1]], [b[0], fy + 0.08, b[1]], 0.015, rc, 4);
      }
    }
  }

  function boxPts(g, pts, h, col) {
    const top = pts.map((p) => [p[0], p[1] + h, p[2]]);
    const ctr = [(pts[0][0] + pts[2][0]) / 2, pts[0][1] + h / 2, (pts[0][2] + pts[2][2]) / 2];
    g.face(pts, ctr, col);
    g.face(top, ctr, col);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; g.face([pts[i], pts[j], top[j], top[i]], ctr, col); }
  }

  const addGeo = (geo, parent, o = {}) => {
    for (const key of ['matte', 'matte2', 'satin', 'gloss', 'metal', 'glass']) {
      const gg = geo.geometry(key);
      if (!gg) continue;
      const m = new THREE.Mesh(gg, M[key]);
      m.castShadow = key !== 'glass' && (o.cast ?? true);
      m.receiveShadow = true;
      m.name = `${o.name || 'extra'}-${key}`;
      parent.add(m);
    }
  };
  const api = {
    spec, data, floors, rooms, roomById, M, pal, P, stat, siteGroup, roofGroup, ceilingGroups, floorGroups, ctx, faces, walls, addGeo, Geo,
    FY, FH, wg, makeFixture, addMount, qYaw, boxPts, placeItem, snapWall, WP
  };
  const safe = (name, fn) => { try { fn(); } catch (e) { console.warn(`[buildings] ${spec.id} ${name} failed`, e); } };
  if (spec.ceilingDecor) safe('ceilingDecor', () => spec.ceilingDecor(api, ceil));
  if (spec.extra) safe('extra', () => spec.extra(api));

  const meshes = [];
  const mk = (geo, mat, parent, o = {}) => {
    if (!geo) return null;
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = o.cast ?? true;
    m.receiveShadow = o.receive ?? true;
    if (o.name) m.name = o.name;
    parent.add(m);
    meshes.push(m);
    return m;
  };
  for (const fl of floors) {
    const g = stat[fl.index], parent = floorGroups[fl.index].group;
    for (const key of ['matte', 'matte2', 'satin', 'gloss', 'metal']) mk(g.geometry(key), M[key], parent, { name: `${key}-${fl.index}` });
    mk(g.geometry('glass'), M.glass, parent, { cast: false, name: `glass-${fl.index}` });
    const ao = ovl[fl.index].mesh();
    if (ao) parent.add(ao);
    const cg = ceil[fl.index];
    for (const key of ['matte', 'satin', 'metal', 'matte2']) mk(cg.geometry(key), M[key], ceilingGroups[fl.index].group, { cast: false, name: `ceil-${key}-${fl.index}` });
  }
  const wallGroups = [];
  for (const G of wallG.values()) {
    const geo = G.geo.geometry('wall', { cap: true });
    if (!geo) continue;
    const m = new THREE.Mesh(geo, G.mat);
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = `walls-${G.floor}-${G.side}`;
    floorGroups[G.floor].group.add(m);
    const gg = G.glass.geometry('glass');
    if (gg) {
      const gm = new THREE.Mesh(gg, wallGlassMaterial());
      gm.name = `glass-${G.floor}-${G.side}`;
      gm.renderOrder = 2;
      m.add(gm);
    }
    for (const e of G.extra) m.add(e);
    wallGroups.push({ mesh: m, floor: G.floor, side: G.side });
  }

  if (spec.site) safe('site', () => spec.site(api));
  if (spec.roof) safe('roof', () => spec.roof(api));

  for (const s of spec.strips || []) data.strips.push({ id: s.id, room: s.room, floor: s.floor ?? roomById.get(s.room)?.floor ?? 0, kind: s.kind, points: s.points.map((p) => p.map(r3)) });
  data.street = spec.street ? { pos: spec.street.map(r3) } : null;
  data.approach = (spec.approach || []).map((p) => p.map(r3));
  const allX = [], allZ = [];
  for (const r of data.rooms) for (const p of r.poly) { allX.push(p[0]); allZ.push(p[1]); }
  const cx = (Math.min(...allX) + Math.max(...allX)) / 2, cz = (Math.min(...allZ) + Math.max(...allZ)) / 2;
  const span = Math.max(Math.max(...allX) - Math.min(...allX), Math.max(...allZ) - Math.min(...allZ));
  data.camera = { target: [r3(cx), r3(FY(0) + 1), r3(cz)], radius: r3(span * 1.35 + 4) };
  data.views = spec.views || {};

  const setDoorOpen = (id, k) => {
    const dd = doors.get(id) || [...doors.values()].find((x) => x.o.entrance);
    if (!dd) return;
    dd.setK(clamp(k, 0, 1) * dd.max);
  };

  return { id: spec.id, name: spec.name, group: root, data, wallGroups, floorGroups, fixtures, setDoorOpen, ceilingGroups, roof: { group: roofGroup }, site: siteGroup, context: api.context || null };
}

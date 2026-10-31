// Instalator device models: geometry kit that collects parts per material, bakes vertex colours and merges them into a few meshes.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SURF, ledMat, lightMat } from './mat.js';

const _c = new THREE.Color();
const _m = new THREE.Matrix4();
const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _n = new THREE.Vector3();
const V2 = (x, y) => new THREE.Vector2(x, y);

export function rrPts(w, h, r, seg = 4, cx = 0, cy = 0) {
  r = Math.max(0, Math.min(r, w / 2 - 1e-5, h / 2 - 1e-5));
  const pts = [];
  const cs = [[cx + w / 2 - r, cy - h / 2 + r, -Math.PI / 2], [cx + w / 2 - r, cy + h / 2 - r, 0], [cx - w / 2 + r, cy + h / 2 - r, Math.PI / 2], [cx - w / 2 + r, cy - h / 2 + r, Math.PI]];
  for (const [x, y, a0] of cs) {
    if (r <= 1e-5 || seg < 1) { pts.push(V2(x + Math.cos(a0 + Math.PI / 4) * r * Math.SQRT2, y + Math.sin(a0 + Math.PI / 4) * r * Math.SQRT2)); continue; }
    for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * Math.PI / 2; pts.push(V2(x + Math.cos(a) * r, y + Math.sin(a) * r)); }
  }
  return pts;
}

export function sePts(w, h, n = 4, count = 32, cx = 0, cy = 0) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2 + Math.PI / count;
    const c = Math.cos(t), s = Math.sin(t);
    pts.push(V2(cx + Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * w / 2, cy + Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * h / 2));
  }
  return pts;
}

export function circPts(r, seg = 24, cx = 0, cy = 0, phase = 0, ry = r) {
  const pts = [];
  for (let i = 0; i < seg; i++) { const a = phase + (i / seg) * Math.PI * 2; pts.push(V2(cx + Math.cos(a) * r, cy + Math.sin(a) * ry)); }
  return pts;
}

export function polyPts(arr) { return arr.map(([x, y]) => V2(x, y)); }

export function arc(cx, cy, r, a0, a1, n, ry = r) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry]); }
  return out;
}

export function extrudeGeo(pts, depth, o = {}) {
  const shape = new THREE.Shape(pts);
  if (o.holes) for (const h of o.holes) shape.holes.push(new THREE.Path(h));
  const b = Math.min(o.bevel || 0, depth / 2 - 1e-6);
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(1e-6, depth - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: o.bevelSeg || 1, curveSegments: 1, steps: 1 });
  g.translate(0, 0, b);
  return g;
}

export function rrLoop(w, d, r, seg) {
  r = Math.max(1e-6, Math.min(r, w / 2 - 1e-6, d / 2 - 1e-6));
  const pts = [];
  const cs = [[w / 2 - r, -d / 2 + r, -Math.PI / 2], [w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, Math.PI / 2], [-w / 2 + r, -d / 2 + r, Math.PI]];
  for (const [x, y, a0] of cs) for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * Math.PI / 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  return pts;
}

export function seLoop(w, d, n, count) {
  return sePts(w, d, n, count).map((p) => [p.x, p.y]);
}

export function loftGeo(loops, o = {}) {
  const pos = [];
  const push = (a, b, c, out) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * out[0] + ny * out[1] + nz * out[2] < 0) pos.push(...a, ...c, ...b); else pos.push(...a, ...b, ...c);
  };
  const L = loops.map(({ y, pts }) => pts.map(([x, z]) => [x, y, z]));
  for (let i = 0; i < L.length - 1; i++) {
    const A = L[i], B = L[i + 1], n = A.length;
    for (let j = 0; j < n; j++) {
      const a = A[j], b = A[(j + 1) % n], c = B[(j + 1) % n], e = B[j];
      const mx = (a[0] + b[0] + c[0] + e[0]) / 4, mz = (a[2] + b[2] + c[2] + e[2]) / 4;
      const hl = Math.hypot(mx, mz) || 1, dy = e[1] - a[1];
      const out = [mx / hl * dy, Math.hypot(a[0], a[2]) - Math.hypot(e[0], e[2]), mz / hl * dy];
      if (o.skip && o.skip(mx, (a[1] + e[1]) / 2, mz)) continue;
      push(a, b, c, out);
      push(a, c, e, out);
    }
  }
  const cap = (loop, up) => {
    const tris = THREE.ShapeUtils.triangulateShape(loop.map((p) => V2(p[0], p[2])), []);
    for (const [i, j, k] of tris) push(loop[i], loop[j], loop[k], [0, up ? 1 : -1, 0]);
  };
  if (o.bottom !== false) cap(L[0], false);
  if (o.top !== false) cap(L[L.length - 1], true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

export function rrLoft(w, d, r, seg, profile, o = {}) {
  return loftGeo(profile.map(([k, y]) => ({ y, pts: rrLoop(Math.max(2e-4, w - 2 * k), Math.max(2e-4, d - 2 * k), r - k, seg) })), o);
}

export function fillet(x0, y0, r, a0, a1, n) {
  return arc(x0, y0, r, a0, a1, n);
}

export function orient(g, axis) {
  if (axis === 'z') g.rotateX(Math.PI / 2);
  else if (axis === '-z') g.rotateX(-Math.PI / 2);
  else if (axis === 'x') g.rotateZ(-Math.PI / 2);
  else if (axis === '-x') g.rotateZ(Math.PI / 2);
  else if (axis === '-y') g.rotateX(Math.PI);
  return g;
}

function smooth01(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

export class Kit {
  constructor() {
    this.buckets = new Map();
    this.stack = [];
    this.m = new THREE.Matrix4();
    this.leds = [];
    this.ports = [];
    this.extra = [];
    this.ud = {};
    this.aoCfg = null;
  }

  push(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) {
    this.stack.push(this.m.clone());
    _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'XYZ')), typeof s === 'number' ? _s.set(s, s, s) : _s.set(s[0], s[1], s[2]));
    this.m.multiply(_m);
    return this;
  }

  pop() { this.m = this.stack.pop(); return this; }

  pt(x, y, z) { return _v.set(x, y, z).applyMatrix4(this.m).toArray().map((v) => +v.toFixed(5)); }

  dir(x, y, z) { return _v.set(x, y, z).transformDirection(this.m).toArray().map((v) => +v.toFixed(5)); }

  add(mat, color, g, o = {}) {
    let geo = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'uv') geo.deleteAttribute(k);
    const n = geo.attributes.position.count;
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
    geo.clearGroups();
    const ca = new Float32Array(n * 3);
    _c.set(color ?? '#ffffff');
    const r = _c.r, gg = _c.g, b = _c.b;
    for (let i = 0; i < n; i++) { ca[i * 3] = r; ca[i * 3 + 1] = gg; ca[i * 3 + 2] = b; }
    const p = geo.attributes.position.array;
    if (o.face) {
      for (let i = 0; i < n; i += 3) {
        _a.set(p[i * 3 + 3] - p[i * 3], p[i * 3 + 4] - p[i * 3 + 1], p[i * 3 + 5] - p[i * 3 + 2]);
        _b.set(p[i * 3 + 6] - p[i * 3], p[i * 3 + 7] - p[i * 3 + 1], p[i * 3 + 8] - p[i * 3 + 2]);
        _n.crossVectors(_a, _b).normalize();
        const cx = (p[i * 3] + p[i * 3 + 3] + p[i * 3 + 6]) / 3, cy = (p[i * 3 + 1] + p[i * 3 + 4] + p[i * 3 + 7]) / 3, cz = (p[i * 3 + 2] + p[i * 3 + 5] + p[i * 3 + 8]) / 3;
        const fc = o.face(cx, cy, cz, _n.x, _n.y, _n.z);
        if (fc) { _c.set(fc); for (let k = 0; k < 3; k++) { ca[(i + k) * 3] = _c.r; ca[(i + k) * 3 + 1] = _c.g; ca[(i + k) * 3 + 2] = _c.b; } }
      }
    }
    if (o.vcol) {
      for (let i = 0; i < n; i++) {
        const f = o.vcol(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
        if (typeof f === 'number') { ca[i * 3] *= f; ca[i * 3 + 1] *= f; ca[i * 3 + 2] *= f; } else if (f) { _c.set(f); ca[i * 3] = _c.r; ca[i * 3 + 1] = _c.g; ca[i * 3 + 2] = _c.b; }
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(ca, 3));
    geo.applyMatrix4(this.m);
    const key = typeof mat === 'string' ? SURF[mat] : mat;
    if (!this.buckets.has(key)) this.buckets.set(key, []);
    this.buckets.get(key).push(geo);
    return geo;
  }

  place(mat, color, g, x, y, z, o = {}) {
    if (o.sx || o.sy || o.sz) g.scale(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
    if (o.rx || o.ry || o.rz) g.applyMatrix4(_m.makeRotationFromEuler(_e.set(o.rx || 0, o.ry || 0, o.rz || 0, o.order || 'XYZ')));
    g.translate(x, y, z);
    return this.add(mat, color, g, o);
  }

  box(mat, color, x, y, z, w, h, d, o = {}) {
    let g;
    if (o.r || o.bevel) {
      const ax = o.axis || 'z';
      if (ax === 'z') { g = extrudeGeo(rrPts(w, h, o.r || 0, o.seg ?? 3), d, { bevel: o.bevel || 0, bevelSeg: o.bevelSeg }); g.translate(0, 0, -d / 2); }
      else if (ax === 'y') { g = extrudeGeo(rrPts(w, d, o.r || 0, o.seg ?? 3), h, { bevel: o.bevel || 0, bevelSeg: o.bevelSeg }); g.translate(0, 0, -h / 2); g.rotateX(-Math.PI / 2); }
      else { g = extrudeGeo(rrPts(d, h, o.r || 0, o.seg ?? 3), w, { bevel: o.bevel || 0, bevelSeg: o.bevelSeg }); g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2); }
    } else g = new THREE.BoxGeometry(w, h, d);
    return this.place(mat, color, g, x, y, z, o);
  }

  shape(mat, color, pts, depth, x, y, z, o = {}) {
    const g = extrudeGeo(pts, depth, o);
    if (o.center) g.translate(0, 0, -depth / 2);
    if (o.axis) {
      if (o.axis === 'y') g.rotateX(-Math.PI / 2);
      else if (o.axis === '-y') g.rotateX(Math.PI / 2);
      else if (o.axis === 'x') g.rotateY(Math.PI / 2);
      else if (o.axis === '-x') g.rotateY(-Math.PI / 2);
      else if (o.axis === '-z') g.rotateY(Math.PI);
    }
    return this.place(mat, color, g, x, y, z, o);
  }

  cyl(mat, color, x, y, z, r, h, o = {}) {
    const g = new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg || 16, 1, !!o.open, o.phase || 0, o.arc || Math.PI * 2);
    if (o.base) g.translate(0, h / 2, 0);
    orient(g, o.axis);
    return this.place(mat, color, g, x, y, z, o);
  }

  loft(mat, color, x, y, z, w, d, r, seg, profile, o = {}) {
    const g = rrLoft(w, d, r, seg, profile, o);
    orient(g, o.axis);
    return this.place(mat, color, g, x, y, z, o);
  }

  seLoft(mat, color, x, y, z, w, d, n, count, profile, o = {}) {
    const g = loftGeo(profile.map(([k, yy]) => ({ y: yy, pts: seLoop(Math.max(2e-4, w - 2 * k), Math.max(2e-4, d - 2 * k), n, count) })), o);
    orient(g, o.axis);
    return this.place(mat, color, g, x, y, z, o);
  }

  loops(mat, color, x, y, z, loops, o = {}) {
    const g = loftGeo(loops, o);
    orient(g, o.axis);
    return this.place(mat, color, g, x, y, z, o);
  }

  lathe(mat, color, x, y, z, prof, o = {}) {
    const g = new THREE.LatheGeometry(prof.map(([r, yy]) => V2(Math.max(0, r), yy)), o.seg || 16, o.phase || 0, o.arc || Math.PI * 2);
    orient(g, o.axis);
    return this.place(mat, color, g, x, y, z, o);
  }

  sphere(mat, color, x, y, z, r, o = {}) {
    const g = new THREE.SphereGeometry(r, o.ws || 12, o.hs || 8, o.phi0 || 0, o.phiLen || Math.PI * 2, o.th0 || 0, o.thLen || Math.PI);
    orient(g, o.axis);
    return this.place(mat, color, g, x, y, z, o);
  }

  torus(mat, color, x, y, z, R, r, o = {}) {
    const g = new THREE.TorusGeometry(R, r, o.rs || 6, o.ts || 24, o.arc || Math.PI * 2);
    return this.place(mat, color, g, x, y, z, o);
  }

  tube(mat, color, pts, r, o = {}) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'catmullrom', o.tension ?? 0.4);
    const g = new THREE.TubeGeometry(curve, o.segs || pts.length * 4, r, o.rs || 6, false);
    return this.add(mat, color, g, o);
  }

  quad(mat, color, w, h, x, y, z, o = {}) {
    const g = new THREE.PlaneGeometry(w, h);
    if (o.uv) {
      const uv = g.attributes.uv;
      const [u0, v0, u1, v1] = o.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) ? u1 : u0, uv.getY(i) ? v1 : v0);
    }
    return this.place(mat, color, g, x, y, z, o);
  }

  rquad(mat, color, w, h, r, x, y, z, o = {}) {
    const g = new THREE.ShapeGeometry(new THREE.Shape(rrPts(w, h, r, o.seg ?? 4)));
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
    return this.place(mat, color, g, x, y, z, o);
  }

  led(color, role, fn, o = {}) {
    const mat = o.mat || ledMat(color, o.intensity ?? 2.2);
    fn(mat);
    if (!o.silent) this.leds.push({ material: mat, role, color });
    return mat;
  }

  light(color, kind, pos, fn, o = {}) {
    const mat = o.mat || lightMat(color, o.on ?? false, o.base, o);
    fn(mat);
    this.ud.light = { material: mat, kind, pos: this.pt(...pos), color };
    return mat;
  }

  port(id, kind, x, y, z, led) {
    const p = { id: String(id), kind, pos: this.pt(x, y, z) };
    if (led) p.led = led;
    this.ports.push(p);
    return p;
  }

  display(mat, w, h, x, y, z, o = {}) {
    const g = o.r ? new THREE.ShapeGeometry(new THREE.Shape(rrPts(w, h, o.r, o.seg ?? 4))) : new THREE.PlaneGeometry(w, h);
    if (o.r) { const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5); }
    if (o.rx || o.ry || o.rz) g.applyMatrix4(_m.makeRotationFromEuler(_e.set(o.rx || 0, o.ry || 0, o.rz || 0)));
    g.translate(x, y, z);
    g.applyMatrix4(this.m);
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, mat);
    mesh.name = 'display';
    this.extra.push(mesh);
    this.ud.display = { mesh, w, h };
    return mesh;
  }

  ao(cfg) { this.aoCfg = cfg; return this; }

  build(o = {}) {
    const group = new THREE.Group();
    let tris = 0;
    const ao = this.aoCfg;
    for (const [mat, list] of this.buckets) {
      const g = list.length === 1 ? list[0] : mergeGeometries(list, false);
      if (!g) continue;
      if (ao && mat.vertexColors) {
        const p = g.attributes.position.array, c = g.attributes.color.array, ax = ao.axis ?? 1;
        for (let i = 0; i < p.length / 3; i++) {
          const f = ao.k + (1 - ao.k) * smooth01(ao.lo, ao.hi, p[i * 3 + ax]);
          c[i * 3] *= f; c[i * 3 + 1] *= f; c[i * 3 + 2] *= f;
        }
      }
      g.computeVertexNormals();
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, mat);
      const solid = mat.vertexColors && !mat.transparent;
      mesh.castShadow = solid && o.shadow !== false;
      mesh.receiveShadow = !mat.transparent;
      mesh.name = mat.name || 'part';
      group.add(mesh);
      tris += g.attributes.position.count / 3;
    }
    for (const x of this.extra) { group.add(x); x.traverse((m) => { if (m.isMesh) tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; }); }
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3()).toArray().map((v) => +v.toFixed(4));
    group.userData = { ...this.ud, leds: this.leds, ports: this.ports, size, tris: Math.round(tris) };
    return group;
  }
}

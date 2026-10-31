// Instalator device models: LED strips swept along a path (Hue Play gradient, Hue Lightstrip Plus, Govee M1) with switchable light materials.
import * as THREE from 'three';
import { Kit } from './kit.js';
import { canvasTex } from './mat.js';

const SPEC = {
  'hue-play-gradient': { w: 0.017, t: 0.016, back: '#1a1b1d', face: '#e9eaea', gradient: ['#7b3cff', '#ff3d9a', '#ff8a3d', '#3d6bff'], unit: 0, name: 'Philips Hue Play gradient lightstrip' },
  'hue-lightstrip-plus': { w: 0.015, t: 0.0055, back: '#ededeb', face: '#f6f6f4', unit: 30, dot: 'soft', name: 'Philips Hue Lightstrip Plus' },
  'govee-strip-m1': { w: 0.01, t: 0.0032, back: '#efefed', face: '#f7f7f5', unit: 60, dot: 'chip', name: 'Govee Strip Light M1' },
};

const KIND_NORMAL = { kitchen: [0, -1, 0], shelf: [0, -1, 0], desk: [0, -1, 0], bed: [0, -1, 0], cove: [0, 1, 0] };

function dotTex(kind, emissive) {
  return canvasTex('strip-dot-' + kind + (emissive ? '-e' : ''), 64, 32, (ctx) => {
    ctx.fillStyle = emissive ? (kind === 'soft' ? '#5a5a5a' : '#262626') : '#f4f4f2';
    ctx.fillRect(0, 0, 64, 32);
    if (emissive) {
      const g = ctx.createRadialGradient(32, 16, 1, 32, 16, kind === 'soft' ? 26 : 12);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, emissive && kind === 'soft' ? '#5a5a5a' : '#262626');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 32);
    } else {
      ctx.fillStyle = kind === 'soft' ? '#e3e0d6' : '#e8e1c4';
      ctx.fillRect(25, 9, 14, 14);
      ctx.fillStyle = '#f6f2df';
      ctx.fillRect(28, 12, 8, 8);
    }
  });
}

function setRepeat(tex) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function gradientTex(colors) {
  const n = 32;
  const data = new Uint8Array(n * 4);
  const tex = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  const set = (cols) => {
    const cs = cols.map((c) => new THREE.Color(c));
    for (let i = 0; i < n; i++) {
      const f = (i / (n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(f)), t = f - k;
      const a = cs[k], b = cs[Math.min(cs.length - 1, k + 1)];
      const c = a.clone().lerp(b, t);
      const s = c.clone().convertLinearToSRGB();
      data[i * 4] = Math.round(s.r * 255); data[i * 4 + 1] = Math.round(s.g * 255); data[i * 4 + 2] = Math.round(s.b * 255); data[i * 4 + 3] = 255;
    }
    tex.needsUpdate = true;
  };
  set(colors);
  tex.userData.set = set;
  return tex;
}

function frames(pts, N) {
  const n = pts.length, out = [];
  let len = 0;
  for (let i = 0; i < n; i++) {
    const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(n - 1, i + 1)];
    const t = next.clone().sub(prev).normalize();
    let nn = N.clone().sub(t.clone().multiplyScalar(N.dot(t)));
    if (nn.lengthSq() < 1e-8) nn = Math.abs(t.y) < 0.9 ? new THREE.Vector3(0, 1, 0).sub(t.clone().multiplyScalar(t.y)) : new THREE.Vector3(1, 0, 0);
    nn.normalize();
    const b = new THREE.Vector3().crossVectors(t, nn).normalize();
    let sb = 1;
    if (i > 0 && i < n - 1) {
      const d0 = pts[i].clone().sub(pts[i - 1]).normalize(), d1 = pts[i + 1].clone().sub(pts[i]).normalize();
      const c = Math.max(-1, Math.min(1, d0.dot(d1)));
      const half = Math.acos(c) / 2;
      const axis = new THREE.Vector3().crossVectors(d0, d1);
      if (axis.lengthSq() > 1e-10 && Math.abs(axis.normalize().dot(nn)) > 0.7) sb = 1 / Math.max(0.35, Math.cos(half));
    }
    if (i > 0) len += pts[i].distanceTo(pts[i - 1]);
    out.push({ p: pts[i], t, n: nn, b, sb, s: len });
  }
  return { F: out, len };
}

function sweep(F, w, t, faceUV) {
  const back = [], face = [], faceUv = [];
  const corner = (f) => {
    const hb = f.b.clone().multiplyScalar(w / 2 * f.sb), ht = f.n.clone().multiplyScalar(t);
    const A = f.p.clone().add(hb), B = f.p.clone().sub(hb);
    return { A, B, C: A.clone().add(ht), D: B.clone().add(ht) };
  };
  const q = (arr, a, b, c, d) => arr.push(...a.toArray(), ...b.toArray(), ...c.toArray(), ...a.toArray(), ...c.toArray(), ...d.toArray());
  for (let i = 0; i < F.length - 1; i++) {
    const c0 = corner(F[i]), c1 = corner(F[i + 1]);
    q(face, c0.D, c0.C, c1.C, c1.D);
    const u0 = faceUV(F[i].s), u1 = faceUV(F[i + 1].s);
    faceUv.push(u0, 0, u0, 1, u1, 1, u0, 0, u1, 1, u1, 0);
    q(back, c0.A, c0.B, c1.B, c1.A);
    q(back, c0.C, c0.A, c1.A, c1.C);
    q(back, c0.B, c0.D, c1.D, c1.B);
  }
  const e0 = corner(F[0]), e1 = corner(F[F.length - 1]);
  q(back, e0.B, e0.A, e0.C, e0.D);
  q(back, e1.A, e1.B, e1.D, e1.C);
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute(face, 3));
  fg.setAttribute('uv', new THREE.Float32BufferAttribute(faceUv, 2));
  fg.computeVertexNormals();
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute(back, 3));
  return { fg, bg };
}

function planeNormal(pts) {
  for (let i = 1; i < pts.length - 1; i++) {
    const c = new THREE.Vector3().crossVectors(pts[i].clone().sub(pts[0]), pts[i + 1].clone().sub(pts[0]));
    if (c.lengthSq() > 1e-8) return c.normalize();
  }
  return null;
}

export function makeStrip(id, pts, opts = {}) {
  const S = SPEC[id];
  const N = opts.normal ? (opts.normal.isVector3 ? opts.normal.clone() : new THREE.Vector3(...opts.normal)) : KIND_NORMAL[opts.kind] ? new THREE.Vector3(...KIND_NORMAL[opts.kind]) : (planeNormal(pts) || new THREE.Vector3(0, -1, 0));
  N.normalize();
  const { F, len } = frames(pts, N);
  const faceUV = S.gradient ? (s) => s / Math.max(1e-6, len) : (s) => s * S.unit;
  const { fg, bg } = sweep(F, S.w, S.t, faceUV);
  const kit = new Kit();
  kit.add('satin', S.back, bg);
  const mat = new THREE.MeshStandardMaterial({ color: S.face, roughness: 0.55, metalness: 0, flatShading: true, emissive: new THREE.Color(opts.color || (S.gradient ? '#ffffff' : '#ffd7a3')), emissiveIntensity: opts.on === false ? 0 : (opts.on ? 2.2 : 0) });
  mat.name = 'dev-light';
  mat.userData.on = 2.2;
  if (S.gradient) {
    mat.emissiveMap = gradientTex(opts.colors || S.gradient);
  } else {
    mat.map = setRepeat(dotTex(S.dot, false));
    mat.emissiveMap = setRepeat(dotTex(S.dot, true));
  }
  const mesh = new THREE.Mesh(fg, mat);
  mesh.name = 'strip-light';
  kit.extra.push(mesh);
  const mid = F[Math.floor(F.length / 2)].p;
  const g = kit.build();
  g.userData.light = { material: mat, kind: 'strip', pos: mid.toArray().map((v) => +v.toFixed(4)), length: +len.toFixed(3) };
  if (S.gradient) g.userData.light.setGradient = (cols) => mat.emissiveMap.userData.set(cols);
  g.userData.length = +len.toFixed(3);
  return g;
}

function preview(id, opts = {}) {
  const pts = [];
  if (id === 'hue-play-gradient') {
    const w = 0.5, h = 0.28;
    for (const [x, y] of [[-w / 2, -h / 2 + 0.02], [-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h / 2 + 0.02]]) pts.push(new THREE.Vector3(x, y + h / 2 + 0.02, 0));
    const g = makeStrip(id, pts, { normal: [0, 0, 1], on: opts.on ?? true, colors: opts.colors });
    const kit = new Kit();
    kit.box('satin', '#151618', 0, h / 2 + 0.02, -0.008, w + 0.2, h + 0.14, 0.012, { r: 0.004, seg: 2 });
    kit.box('satin', '#1d1e21', 0, h / 2 + 0.02, 0.008, w - 0.16, h - 0.1, 0.02, { r: 0.012, seg: 2 });
    kit.box('glass', '#08090b', 0, h / 2 + 0.02, -0.0142, w + 0.19, h + 0.13, 0.0004);
    const tv = kit.build();
    tv.add(g);
    tv.userData = { ...g.userData, tris: g.userData.tris + tv.userData.tris, size: tv.userData.size };
    return tv;
  }
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2.2;
    pts.push(new THREE.Vector3(Math.cos(a) * (0.055 + i * 0.0018) + i * 0.0026, 0.002, Math.sin(a) * (0.042 + i * 0.001)));
  }
  return makeStrip(id, pts, { normal: [0, 1, 0], on: opts.on ?? true, color: opts.color || (id === 'govee-strip-m1' ? '#ff5fd2' : '#c86bff') });
}

export const STRIPS = Object.fromEntries(Object.entries(SPEC).map(([id, S]) => [id, { mount: 'strip', family: 'light', name: S.name, strip: (pts, o) => makeStrip(id, pts, o), build: (o) => preview(id, o), view: { el: 30, flip: false } }]));

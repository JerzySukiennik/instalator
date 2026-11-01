// Instalator buildings: wall-spot clearance rule on BuildingData (clear 0.5 x 0.6 m face, nothing within 0.8 m in front, close-up camera at 0.62 m in open air).

export const CLEAR = { w: 0.5, h: 0.6, depth: 0.8, cam: 0.62 };
export const ANCHOR_BOX = { panel: [0.45, 0.65, 0.14], rack: [0.62, 0.7, 0.62], mediaBox: [0.38, 0.52, 0.16], wan: [0.25, 0.25, 0.08] };
const OPEN = new Set(['balcony', 'terrace', 'outdoor']);
const NOT_SURFACE = new Set(['door', 'lamp', 'switch', 'outlet', 'tablet', 'tree', ...Object.keys(ANCHOR_BOX)]);

export function obb(cx, cz, ux, uz, hu, hv) {
  const vx = -uz, vz = ux;
  return [[cx - ux * hu - vx * hv, cz - uz * hu - vz * hv], [cx + ux * hu - vx * hv, cz + uz * hu - vz * hv], [cx + ux * hu + vx * hv, cz + uz * hu + vz * hv], [cx - ux * hu + vx * hv, cz - uz * hu + vz * hv]];
}

function pip(x, z, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ins = !ins;
  }
  return ins;
}

function circ(P) {
  if (P._c) return P._c;
  let cx = 0, cz = 0, r = 0;
  for (const p of P) { cx += p[0]; cz += p[1]; }
  cx /= P.length; cz /= P.length;
  for (const p of P) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cz));
  return (P._c = [cx, cz, r]);
}

function sat(A, B) {
  const ca = circ(A), cb = circ(B);
  if (Math.hypot(ca[0] - cb[0], ca[1] - cb[1]) > ca[2] + cb[2]) return false;
  for (const P of [A, B]) {
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length];
      let ax = q[1] - p[1], az = p[0] - q[0];
      const l = Math.hypot(ax, az);
      if (l < 1e-9) continue;
      ax /= l; az /= l;
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (const s of A) { const d = s[0] * ax + s[1] * az; if (d < a0) a0 = d; if (d > a1) a1 = d; }
      for (const s of B) { const d = s[0] * ax + s[1] * az; if (d < b0) b0 = d; if (d > b1) b1 = d; }
      if (a1 <= b0 + 0.003 || b1 <= a0 + 0.003) return false;
    }
  }
  return true;
}

export function boxAt(id, what, floor, c, rot, sx, sz, y0, y1) {
  const co = Math.cos(rot), si = Math.sin(rot);
  return { id, what, floor, poly: obb(c[0], c[1], co, -si, sx / 2, sz / 2), y0, y1 };
}

export function furnitureBox(f) {
  return boxAt(f.id, f.kind, f.floor, [f.pos[0], f.pos[2]], f.rot || 0, f.size[0], f.size[2], f.pos[1], f.pos[1] + f.size[1]);
}

export function wallBox(id, what, floor, pos, normal, w, h, d) {
  let nx = normal[0], nz = normal[2];
  const l = Math.hypot(nx, nz) || 1;
  nx /= l; nz /= l;
  return { id, what, floor, poly: obb(pos[0] + nx * d / 2, pos[2] + nz * d / 2, nz, -nx, w / 2, d / 2), y0: pos[1] - h / 2, y1: pos[1] + h / 2 };
}

export function ringBox(id, what, floor, p, r, y0 = p[1] - r, y1 = p[1] + r) {
  const poly = [];
  for (let i = 0; i < 8; i++) { const a = ((i + 0.5) * Math.PI) / 4; poly.push([p[0] + Math.cos(a) * r, p[2] + Math.sin(a) * r]); }
  return { id, what, floor, poly, y0, y1 };
}

function sector(L, n = 6) {
  const pts = [[L.hinge[0], L.hinge[1]]];
  const max = ((L.max ?? 95) * Math.PI) / 180, r = L.w + 0.05;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * max, ca = Math.cos(a), sa = Math.sin(a);
    pts.push([L.hinge[0] + (L.closed[0] * ca + L.open[0] * sa) * r, L.hinge[1] + (L.closed[1] * ca + L.open[1] * sa) * r]);
  }
  return pts;
}

export function clearanceScene(data, o = {}) {
  const S = new Map();
  const F = (fl) => { let s = S.get(fl); if (!s) S.set(fl, (s = { walls: [], obs: [], rooms: [] })); return s; };
  const fy = (fl) => data.floors?.[fl]?.y ?? 0, fh = (fl) => data.floors?.[fl]?.height ?? 2.7;
  for (const r of data.rooms || []) F(r.floor ?? 0).rooms.push(r);
  for (const w of data.walls || []) {
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], len = Math.hypot(dx, dz);
    if (len < 1e-4) continue;
    const ux = dx / len, uz = dz / len, t2 = (w.thick ?? 0.12) / 2;
    F(w.floor).walls.push({ id: w.id, a: w.a, u: [ux, uz], n: [-uz, ux], len, t2, ext: !!w.exterior, ops: w.openings || [], fy: fy(w.floor), fh: fh(w.floor), poly: obb((w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2, ux, uz, len / 2 + t2, t2) });
    for (const op of w.openings || []) if (op.leaf) F(w.floor).obs.push({ id: op.id, what: 'door', floor: w.floor, poly: sector(op.leaf), y0: fy(w.floor), y1: fy(w.floor) + (op.head ?? 2.05) + 0.05 });
  }
  if (o.furniture !== false) for (const f of data.furniture || []) F(f.floor).obs.push(furnitureBox(f));
  for (const f of data.fixtures || []) if (f.lightPos) F(f.floor ?? 0).obs.push(ringBox(f.id, 'lamp', f.floor ?? 0, f.lightPos, 0.13));
  for (const s of data.switches || []) F(s.floor).obs.push(wallBox(s.id, 'switch', s.floor, s.pos, s.normal, 0.09, 0.09, 0.03));
  for (const s of data.outlets || []) F(s.floor).obs.push(wallBox(s.id, 'outlet', s.floor, s.pos, s.normal, 0.075 * (s.n || 2) + 0.012, 0.09, 0.03));
  for (const k of Object.keys(ANCHOR_BOX)) {
    const a = data[k];
    if (!a?.pos || !a.normal) continue;
    const [w, h, d] = ANCHOR_BOX[k];
    F(a.floor ?? 0).obs.push(wallBox(k, k, a.floor ?? 0, a.pos, a.normal, w, h, d));
  }
  for (const t of data.tabletSpots || []) if (t.kind === 'wall') F(t.floor).obs.push(wallBox(t.id, 'tablet', t.floor, t.pos, t.normal, 0.3, 0.25, 0.03));
  for (const ob of o.extra || []) F(ob.floor ?? 0).obs.push(ob);
  return S;
}

export function addObstacle(S, ob) {
  let s = S.get(ob.floor ?? 0);
  if (!s) S.set(ob.floor ?? 0, (s = { walls: [], obs: [], rooms: [] }));
  s.obs.push(ob);
}

export function checkSpot(S, s, o = {}) {
  const F = S.get(s.floor ?? 0);
  if (!F) return 'no floor';
  const Wd = o.w ?? CLEAR.w, Hh = o.h ?? CLEAR.h, D = o.depth ?? CLEAR.depth, cam = o.cam ?? CLEAR.cam;
  const out = o.outdoor ?? s.kind === 'outdoorWall';
  let nx = s.normal[0], nz = s.normal[2];
  const nl = Math.hypot(nx, nz) || 1;
  nx /= nl; nz /= nl;
  const tx = nz, tz = -nx, px = s.pos[0], pz = s.pos[2], y0 = s.pos[1] - Hh / 2, y1 = s.pos[1] + Hh / 2;
  let host = null;
  for (const w of F.walls) {
    const rx = px - w.a[0], rz = pz - w.a[1];
    const q = rx * w.n[0] + rz * w.n[1], u = rx * w.u[0] + rz * w.u[1], sd = q >= 0 ? 1 : -1;
    if (Math.abs(Math.abs(q) - w.t2) > 0.03 || u < -0.05 || u > w.len + 0.05) continue;
    if (w.n[0] * sd * nx + w.n[1] * sd * nz < 0.9) continue;
    host = { w, u, sd };
    break;
  }
  if (!host) return 'no wall';
  const hw = host.w, line = [];
  for (const w of F.walls) {
    if (Math.abs(w.u[0] * hw.n[0] + w.u[1] * hw.n[1]) > 0.01) continue;
    const rx = w.a[0] - hw.a[0], rz = w.a[1] - hw.a[1];
    const qa = rx * hw.n[0] + rz * hw.n[1];
    if (Math.abs(qa + host.sd * w.t2 - host.sd * hw.t2) > 0.02) continue;
    const dir = w.u[0] * hw.u[0] + w.u[1] * hw.u[1], ua = rx * hw.u[0] + rz * hw.u[1], ub = ua + w.len * dir;
    line.push({ w, dir, ua, lo: Math.min(ua, ub), hi: Math.max(ua, ub) });
  }
  const u0 = host.u - Wd / 2, u1 = host.u + Wd / 2;
  line.sort((a, b) => a.lo - b.lo);
  let reach = u0;
  for (const L of line) { if (L.lo > reach + 0.005) break; reach = Math.max(reach, L.hi); }
  if (reach < u1 - 0.001) return 'wall end';
  const fy = hw.fy;
  if (!out && (y0 < fy - 0.001 || y1 > fy + hw.fh - 0.02)) return 'floor or ceiling';
  for (const L of line) {
    for (const op of L.w.ops) {
      const s0 = op.s0 ?? op.t0 * L.w.len, s1 = op.s1 ?? op.t1 * L.w.len;
      const a = L.ua + L.dir * s0, b = L.ua + L.dir * s1, lo = Math.min(a, b), hi = Math.max(a, b);
      const door = op.kind === 'door' || op.kind === 'arch';
      const m = out ? 0.03 : door ? 0.075 : 0.055;
      const ya = fy + (op.sill ?? 0) - 0.04, yb = fy + (op.head ?? 2.05) + (door && !out ? 0.075 : 0.02);
      if (hi + m > u0 && lo - m < u1 && yb > y0 && ya < y1) return `opening ${op.id}`;
    }
  }
  const d0 = 0.012;
  const FB = obb(px + (nx * (d0 + D)) / 2, pz + (nz * (d0 + D)) / 2, tx, tz, Wd / 2, (D - d0) / 2);
  const skip = new Set(line.map((L) => L.w));
  for (const w of F.walls) if (!skip.has(w) && sat(FB, w.poly)) return `wall ${w.id}`;
  for (const ob of F.obs) {
    if (ob.id === s.id || ob.y1 <= y0 || ob.y0 >= y1) continue;
    if (sat(FB, ob.poly)) return `${ob.what} ${ob.id}`;
  }
  const cx = px + nx * cam, cz = pz + nz * cam;
  for (const w of F.walls) if (pip(cx, cz, w.poly)) return `camera in wall ${w.id}`;
  const indoor = (r) => !OPEN.has(r.kind);
  if (out) { if (F.rooms.some((r) => indoor(r) && pip(cx, cz, r.poly))) return 'camera indoors'; }
  else if (!F.rooms.some((r) => pip(cx, cz, r.poly))) return 'camera outside';
  const room = !out && s.room ? F.rooms.find((r) => r.id === s.room) : null;
  const e = Wd / 2 - 0.01;
  for (const k of [-1, 0, 1]) {
    const fx = px + tx * e * k + nx * 0.04, fz = pz + tz * e * k + nz * 0.04;
    if (out) { if (F.rooms.some((r) => indoor(r) && pip(fx, fz, r.poly))) return 'face indoors'; }
    else if (room ? !pip(fx, fz, room.poly) : !F.rooms.some((r) => pip(fx, fz, r.poly))) return 'face leaves room';
  }
  return null;
}

export function checkSurface(S, s, o = {}) {
  const F = S.get(s.floor ?? 0);
  if (!F) return 'no floor';
  const Wd = o.w ?? CLEAR.w, Hh = o.h ?? CLEAR.h, D = o.depth ?? CLEAR.depth, cam = o.cam ?? CLEAR.cam;
  const q = s.quat || [0, 0, 0, 1], yaw = 2 * Math.atan2(q[1], q[3]);
  const nx = Math.sin(yaw), nz = Math.cos(yaw), tx = nz, tz = -nx;
  const px = s.pos[0], pz = s.pos[2], y0 = s.pos[1] + 0.02, y1 = y0 + Hh;
  const host = F.obs.find((ob) => !NOT_SURFACE.has(ob.what) && ob.y0 <= s.pos[1] + 0.02 && ob.y1 >= s.pos[1] - 0.06 && pip(px, pz, ob.poly));
  if (!host) return 'no surface';
  const FB = obb(px + (nx * (0.05 + D)) / 2, pz + (nz * (0.05 + D)) / 2, tx, tz, Wd / 2, (D - 0.05) / 2);
  for (const w of F.walls) if (sat(FB, w.poly)) return `wall ${w.id}`;
  for (const ob of F.obs) {
    if (ob === host || ob.id === s.id || ob.y1 <= y0 || ob.y0 >= y1) continue;
    if (sat(FB, ob.poly)) return `${ob.what} ${ob.id}`;
  }
  const cx = px + nx * cam, cz = pz + nz * cam;
  for (const w of F.walls) if (pip(cx, cz, w.poly)) return `camera in wall ${w.id}`;
  if (!F.rooms.some((r) => pip(cx, cz, r.poly))) return 'camera outside';
  return null;
}

export function tabletZone(t) {
  const q = t.quat || [0, 0, 0, 1], wall = t.kind === 'wall';
  const yaw = 2 * Math.atan2(q[1], q[3]);
  let nx = wall ? t.normal[0] : Math.sin(yaw), nz = wall ? t.normal[2] : Math.cos(yaw);
  const l = Math.hypot(nx, nz) || 1, a = wall ? 0 : -0.15, D = CLEAR.depth;
  nx /= l; nz /= l;
  return { id: t.id, floor: t.floor ?? 0, poly: obb(t.pos[0] + (nx * (a + D)) / 2, t.pos[2] + (nz * (a + D)) / 2, nz, -nx, 0.32, (D - a) / 2), y0: wall ? t.pos[1] - CLEAR.h / 2 : t.pos[1] - 0.03, y1: wall ? t.pos[1] + CLEAR.h / 2 : t.pos[1] + 0.03 + CLEAR.h };
}

export function inTabletZone(z, p, h = 0.35) {
  return p[1] < z.y1 && p[1] + h > z.y0 && pip(p[0], p[2], z.poly);
}

const FREE = new Set(['post', 'tree']);

export function clearanceReport(data, extra = null) {
  const S = clearanceScene(data, extra ? { extra, furniture: false } : {});
  const out = [];
  for (const t of data.tabletSpots || []) { const r = t.kind === 'wall' ? checkSpot(S, t) : checkSurface(S, t); if (r) out.push(`tablet ${t.id}: ${r}`); }
  const tz = (data.tabletSpots || []).map(tabletZone);
  for (const m of data.mounts || []) {
    if (m.kind === 'surface') { const z = tz.find((q) => q.floor === (m.floor ?? 0) && inTabletZone(q, m.pos)); if (z) out.push(`surface ${m.id}: in the close-up of ${z.id}`); continue; }
    if (m.kind !== 'wall' && m.kind !== 'outdoorWall') continue;
    if (m.kind === 'outdoorWall' && (m.tags || []).some((t) => FREE.has(t))) continue;
    const r = checkSpot(S, m);
    if (r) out.push(`${m.kind} ${m.id}: ${r}`);
  }
  return out;
}

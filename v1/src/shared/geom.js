// Instalator: 2D plan geometry — polygons, wall crossings, Wi-Fi signal grid and camera visibility.

export function pointInPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function polyBounds(polys) {
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const p of polys) for (const [x, z] of p) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
  return { x0, z0, x1, z1 };
}

export function polyArea(poly) {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
  return Math.abs(a / 2);
}

export function polyCentroid(poly) {
  let x = 0, z = 0;
  for (const p of poly) { x += p[0]; z += p[1]; }
  return [x / poly.length, z / poly.length];
}

function segT(ax, az, bx, bz, cx, cz, dx, dz) {
  const rx = bx - ax, rz = bz - az, sx = dx - cx, sz = dz - cz;
  const den = rx * sz - rz * sx;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((cx - ax) * sz - (cz - az) * sx) / den;
  const u = ((cx - ax) * rz - (cz - az) * rx) / den;
  if (t <= 1e-6 || t >= 1 - 1e-6 || u < 0 || u > 1) return null;
  return u;
}

export const LOSS = { int: 3.5, ext: 11, glass: 3, door: 1, floor: 11 };

export function wallLoss(walls, floor, ax, az, bx, bz) {
  let loss = 0;
  for (const w of walls) {
    if (w.floor !== floor) continue;
    const u = segT(ax, az, bx, bz, w.a[0], w.a[1], w.b[0], w.b[1]);
    if (u == null) continue;
    let kind = w.exterior ? "ext" : "int";
    for (const o of w.openings || []) {
      if (u >= o.t0 && u <= o.t1) { kind = o.kind === "door" ? "door" : "glass"; break; }
    }
    loss += LOSS[kind];
  }
  return loss;
}

export function blockedByWall(walls, floor, ax, az, bx, bz, exteriorOnly = true) {
  for (const w of walls) {
    if (w.floor !== floor || (exteriorOnly && !w.exterior)) continue;
    const u = segT(ax, az, bx, bz, w.a[0], w.a[1], w.b[0], w.b[1]);
    if (u == null) continue;
    let open = false;
    for (const o of w.openings || []) if (u >= o.t0 && u <= o.t1 && o.kind !== "door") { open = true; break; }
    if (!open) return true;
  }
  return false;
}

export function apSignal(ap, x, z, floor, walls) {
  const dx = x - ap.x, dz = z - ap.z;
  const d = Math.max(0.5, Math.hypot(dx, dz));
  let loss = wallLoss(walls, ap.floor, ap.x, ap.z, x, z);
  if (floor !== ap.floor) loss += LOSS.floor * Math.abs(floor - ap.floor);
  const deff = d * Math.pow(10, loss / 20);
  return Math.max(0, 1 - deff / ap.r);
}

export function wifiGrid(data, aps, floor, cell = 0.6, extra = null) {
  const rooms = data.rooms.filter((r) => r.floor === floor && (extra || r.kind !== "outdoor"));
  const polys = rooms.map((r) => r.poly).concat(extra ? extra : []);
  if (!polys.length) return null;
  const b = polyBounds(polys);
  const nx = Math.max(1, Math.ceil((b.x1 - b.x0) / cell)), nz = Math.max(1, Math.ceil((b.z1 - b.z0) / cell));
  const v = new Float32Array(nx * nz).fill(-1);
  let inside = 0, good = 0;
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = b.x0 + (i + 0.5) * cell, z = b.z0 + (j + 0.5) * cell;
      if (!polys.some((p) => pointInPoly(x, z, p))) continue;
      let s = 0;
      for (const ap of aps) s = Math.max(s, apSignal(ap, x, z, floor, data.walls));
      v[j * nx + i] = s;
      inside++;
      if (s >= 0.18) good++;
    }
  }
  return { x0: b.x0, z0: b.z0, nx, nz, cell, v, inside, good };
}

export function wifiCoverage(data, aps) {
  let inside = 0, good = 0;
  for (const f of data.floors) {
    const g = wifiGrid(data, aps, f.index);
    if (!g) continue;
    inside += g.inside;
    good += g.good;
  }
  return inside ? good / inside : 0;
}

export function cameraSees(cam, pt, walls) {
  const dx = pt[0] - cam.pos[0], dz = pt[2] - cam.pos[2];
  const d = Math.hypot(dx, dz);
  if (d > cam.range) return false;
  if (d > 0.4) {
    const a = Math.atan2(dx, dz), f = Math.atan2(cam.dir[0], cam.dir[2]);
    let da = Math.abs(a - f);
    if (da > Math.PI) da = Math.PI * 2 - da;
    if (da > (cam.fov * Math.PI) / 360) return false;
  }
  return !blockedByWall(walls, cam.floor, cam.pos[0], cam.pos[2], pt[0], pt[2], true);
}

export function dist3(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function cableLength(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[2] - b[2]) + Math.abs(a[1] - b[1]) + 3;
}

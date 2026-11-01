// Instalator: first-person player — pointer-lock look, WASD movement, wall and obstacle collision, ground from BVH raycasts.

import * as THREE from "three";
import { computeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const PASS = new Set(["door", "arch", "opening", "entrance", "gate", "passage", "doorway"]);
const R = 0.28, STEP = 0.4, EYE = 1.65;

function closestOnSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2));
  return [ax + dx * t, az + dz * t];
}

export class Player {
  constructor(camera, dom) {
    this.cam = camera;
    this.dom = dom;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.keys = new Set();
    this.enabled = false;
    this.locked = false;
    this.ground = true;
    this.bob = 0;
    this.moving = false;
    this.sprint = false;
    this.look = [0, 0];
    this.eye = EYE;
    this.segs = [];
    this.boxes = [];
    this.walk = [];
    this.rc = new THREE.Raycaster();
    this.rc.firstHitOnly = false;
    addEventListener("keydown", (e) => { if (!e.repeat) this.keys.add(e.code); if (e.code === "Space" && this.enabled && this.locked && this.ground) { this.vel.y = 3.4; this.ground = false; } });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("blur", () => this.keys.clear());
    document.addEventListener("pointerlockchange", () => { this.locked = document.pointerLockElement === this.dom; if (!this.locked) this.keys.clear(); this.onLock && this.onLock(this.locked); });
    document.addEventListener("mousemove", (e) => {
      if (!this.locked || !this.enabled) return;
      const k = 0.0021;
      this.yaw -= e.movementX * k;
      this.pitch = Math.max(-1.48, Math.min(1.48, this.pitch - e.movementY * k));
      this.look[0] += e.movementX; this.look[1] += e.movementY;
    });
  }

  lock() { if (!this.locked) this.dom.requestPointerLock?.(); }
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); }

  setWorld(b) {
    const data = b.data;
    this.data = data;
    this.eye = data.walk?.eye || EYE;
    this.segs = [];
    for (const w of data.walls || []) {
      const ax = w.a[0], az = w.a[1], bx = w.b[0], bz = w.b[1];
      const cuts = (w.openings || []).filter((o) => PASS.has(o.kind) || (o.sill ?? 1) < 0.1 || (data.walk?.passable || []).includes(o.id)).map((o) => [Math.min(o.t0, o.t1), Math.max(o.t0, o.t1)]).sort((p, q) => p[0] - q[0]);
      let t = 0;
      const parts = [];
      for (const [t0, t1] of cuts) { if (t0 > t) parts.push([t, t0]); t = Math.max(t, t1); }
      if (t < 1) parts.push([t, 1]);
      for (const [t0, t1] of parts) {
        if (t1 - t0 < 1e-3) continue;
        this.segs.push({ floor: w.floor ?? 0, ax: ax + (bx - ax) * t0, az: az + (bz - az) * t0, bx: ax + (bx - ax) * t1, bz: az + (bz - az) * t1, r: (w.thick || 0.12) / 2 });
      }
    }
    this.bGround = typeof b.groundAt === "function" ? b.groundAt.bind(b) : null;
    if (this.bGround && b.clearanceObstacles) this.segs = [];
    this.boxes = (b.obstacles || []).filter((o) => o.what !== "stairs" && o.poly && o.poly.length >= 3 && (o.y1 - o.y0) > 0.04);
    const skip = new Set();
    for (const wg of b.wallGroups || []) wg.mesh.traverse((o) => skip.add(o));
    for (const cg of b.ceilingGroups || []) cg.group.traverse((o) => skip.add(o));
    if (b.roof?.group) b.roof.group.traverse((o) => skip.add(o));
    this.walk = [];
    b.group.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || skip.has(o) || !o.geometry?.attributes?.position) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (m && (m.transparent && m.opacity < 0.9)) return;
      if (!o.geometry.boundsTree) { try { o.geometry.computeBoundsTree(); } catch (e) { return; } }
      this.walk.push(o);
    });
    b.group.updateMatrixWorld(true);
  }

  spawn() {
    const s = this.data?.walk?.spawn;
    if (s) { this.pos.set(...s.pos); this.yaw = s.yaw ?? 0; }
    else {
      const e = this.data?.entrance?.pos || [0, 0, 6];
      const c = this.data?.camera?.target || [0, 0, 0];
      this.pos.set(e[0] + (e[0] - c[0]) * 0.25, e[1] || 0, e[2] + (e[2] - c[2]) * 0.25 + 2);
      this.yaw = Math.atan2(-(c[0] - this.pos.x), -(c[2] - this.pos.z));
    }
    this.pitch = -0.05;
    this.vel.set(0, 0, 0);
    const g = this.groundAt(this.pos.x, this.pos.y + 2, this.pos.z);
    if (g != null) this.pos.y = g;
    this.apply(0);
  }

  floorIndex(y = this.pos.y) {
    const fl = this.data?.floors || [];
    let f = 0;
    for (const x of fl) if (x.y <= y + 0.6) f = x.index;
    return f;
  }

  groundAt(x, y, z) {
    if (this.bGround) { const g = this.bGround(x, z, y); if (g != null && isFinite(g)) return g; }
    this.rc.set(new THREE.Vector3(x, y + STEP, z), new THREE.Vector3(0, -1, 0));
    this.rc.far = 60;
    const hits = this.rc.intersectObjects(this.walk, false);
    for (const h of hits) {
      if (!h.face) continue;
      const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
      if (n.y > 0.6) return h.point.y;
    }
    return null;
  }

  collide(x, z, y) {
    const f = this.floorIndex(y);
    for (let it = 0; it < 3; it++) {
      for (const s of this.segs) {
        if (s.floor !== f) continue;
        const [cx, cz] = closestOnSeg(x, z, s.ax, s.az, s.bx, s.bz);
        const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz), min = R + s.r;
        if (d < min) {
          if (d < 1e-6) { x += min; continue; }
          x = cx + (dx / d) * min; z = cz + (dz / d) * min;
        }
      }
      for (const o of this.boxes) {
        if ((o.floor ?? 0) !== f && Math.abs((o.y0 ?? 0) - y) > 1.5) continue;
        if (o.y1 < y + 0.05 || o.y0 > y + 1.8) continue;
        const P = o.poly;
        let inside = true, best = null, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
          const a = P[i], b = P[(i + 1) % P.length];
          const ex = b[0] - a[0], ez = b[1] - a[1];
          if (ex * (z - a[1]) - ez * (x - a[0]) < 0) inside = false;
          const [cx, cz] = closestOnSeg(x, z, a[0], a[1], b[0], b[1]);
          const d = Math.hypot(x - cx, z - cz);
          if (d < bd) { bd = d; best = [cx, cz]; }
        }
        let area = 0;
        for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; area += a[0] * b[1] - b[0] * a[1]; }
        if (area < 0) {
          inside = true;
          for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if ((b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]) > 0) inside = false; }
        }
        if (!best) continue;
        if (inside) {
          const dx = best[0] - x, dz = best[1] - z, d = Math.hypot(dx, dz) || 1e-6;
          x = best[0] + (dx / d) * R; z = best[1] + (dz / d) * R;
        } else if (bd < R) {
          const dx = x - best[0], dz = z - best[1], d = bd || 1e-6;
          x = best[0] + (dx / d) * R; z = best[1] + (dz / d) * R;
        }
      }
    }
    return [x, z];
  }

  update(dt) {
    if (!this.enabled) { this.apply(dt); return; }
    const k = this.keys;
    const fw = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const st = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
    this.sprint = k.has("ShiftLeft") || k.has("ShiftRight");
    const speed = this.locked ? (this.sprint ? 4.3 : 2.7) : 0;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let mx = (-sin * fw + cos * st), mz = (-cos * fw - sin * st);
    const ml = Math.hypot(mx, mz);
    if (ml > 0) { mx /= ml; mz /= ml; }
    const tvx = mx * speed, tvz = mz * speed;
    const acc = this.ground ? 14 : 4;
    this.vel.x += (tvx - this.vel.x) * Math.min(1, dt * acc);
    this.vel.z += (tvz - this.vel.z) * Math.min(1, dt * acc);
    this.moving = ml > 0 && speed > 0;
    const steps = Math.max(1, Math.ceil((Math.hypot(this.vel.x, this.vel.z) * dt) / 0.12));
    let x = this.pos.x, z = this.pos.z;
    for (let i = 0; i < steps; i++) {
      const nx = x + (this.vel.x * dt) / steps, nz = z + (this.vel.z * dt) / steps;
      const g = this.groundAt(nx, this.pos.y, nz);
      if (g != null && g > this.pos.y + STEP + 0.01) break;
      [x, z] = this.collide(nx, nz, this.pos.y);
    }
    this.pos.x = x; this.pos.z = z;
    const g = this.groundAt(x, this.pos.y, z);
    this.vel.y -= 9.8 * dt;
    let y = this.pos.y + this.vel.y * dt;
    if (g != null && y <= g + 0.002) {
      y = this.vel.y < 0 && g > this.pos.y ? this.pos.y + Math.min(g - this.pos.y, dt * 6) : g;
      this.vel.y = 0;
      this.ground = true;
    } else this.ground = g != null && Math.abs(y - g) < 0.03;
    if (g == null && y < this.pos.y - 8) { this.spawn(); return; }
    this.pos.y = y;
    if (this.moving && this.ground) this.bob += dt * (this.sprint ? 11 : 8);
    this.apply(dt);
  }

  apply() {
    const b = this.moving && this.ground ? Math.sin(this.bob) * 0.028 : 0;
    this.cam.position.set(this.pos.x, this.pos.y + this.eye + b, this.pos.z);
    this.cam.rotation.set(this.pitch, this.yaw, 0, "YXZ");
    this.cam.updateMatrixWorld();
  }

  dir() {
    return new THREE.Vector3(0, 0, -1).applyQuaternion(this.cam.quaternion);
  }
}

// Instalator: hand-built low-poly client figure that walks a path during the handover.

import * as THREE from "three";

function mat(c) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, flatShading: true }); }

export function buildClient(look = {}) {
  const g = new THREE.Group();
  const skin = mat(look.skin || "#eec4a0"), top = mat(look.top || "#6d8fb3"), legs = mat("#3a4048"), hair = mat(look.hair || "#4a3426"), shoe = mat("#2a2a2a");
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; return o; };
  const hips = new THREE.Group(); hips.position.y = 0.92; g.add(hips);
  const legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.09, 0, 0); legR.position.set(0.09, 0, 0);
  legL.add(box(0.13, 0.86, 0.15, legs, 0, -0.43, 0), box(0.13, 0.07, 0.24, shoe, 0, -0.88, 0.04));
  legR.add(box(0.13, 0.86, 0.15, legs, 0, -0.43, 0), box(0.13, 0.07, 0.24, shoe, 0, -0.88, 0.04));
  hips.add(legL, legR);
  const torso = box(0.4, 0.6, 0.22, top, 0, 0.32, 0);
  hips.add(torso);
  const armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-0.26, 0.58, 0); armR.position.set(0.26, 0.58, 0);
  armL.add(box(0.1, 0.56, 0.12, top, 0, -0.26, 0), box(0.08, 0.1, 0.09, skin, 0, -0.58, 0));
  armR.add(box(0.1, 0.56, 0.12, top, 0, -0.26, 0), box(0.08, 0.1, 0.09, skin, 0, -0.58, 0));
  hips.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 0.78; hips.add(head);
  head.add(box(0.08, 0.08, 0.08, skin, 0, -0.06, 0));
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), skin);
  skull.scale.set(1, 1.15, 1); skull.position.y = 0.1; skull.castShadow = true;
  head.add(skull);
  const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(0.136, 1), hair);
  cap.scale.set(1.04, look.long ? 1.18 : 0.8, 1.04); cap.position.set(0, look.long ? 0.1 : 0.15, -0.02);
  head.add(cap);
  if (look.long) head.add(box(0.26, 0.3, 0.08, hair, 0, -0.02, -0.1));
  if (look.beard) head.add(box(0.2, 0.1, 0.06, hair, 0, 0.0, 0.11));
  const eyeM = mat("#2a2522");
  head.add(box(0.025, 0.025, 0.01, eyeM, -0.045, 0.12, 0.125), box(0.025, 0.025, 0.01, eyeM, 0.045, 0.12, 0.125));
  g.userData = { legL, legR, armL, armR, hips, phase: 0 };
  return g;
}

export class Walker {
  constructor(obj) {
    this.obj = obj;
    this.path = [];
    this.speed = 1.25;
    this.done = null;
  }

  go(points, done) {
    this.path = points.map((p) => new THREE.Vector3(...p));
    this.done = done;
  }

  update(dt) {
    const o = this.obj, u = o.userData;
    const target = this.path[0];
    if (!target) {
      u.legL.rotation.x *= 0.8; u.legR.rotation.x *= 0.8; u.armL.rotation.x *= 0.8; u.armR.rotation.x *= 0.8;
      return;
    }
    const d = target.clone().sub(o.position);
    d.y = 0;
    const dist = d.length();
    if (dist < 0.08) {
      this.path.shift();
      if (!this.path.length && this.done) { const f = this.done; this.done = null; f(); }
      return;
    }
    const step = Math.min(dist, this.speed * dt);
    o.position.addScaledVector(d.normalize(), step);
    o.position.y += (target.y - o.position.y) * Math.min(1, dt * 6);
    const yaw = Math.atan2(d.x, d.z);
    let dy = yaw - o.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    o.rotation.y += dy * Math.min(1, dt * 8);
    u.phase += dt * 7.5;
    const sw = Math.sin(u.phase) * 0.55;
    u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
    u.armL.rotation.x = -sw * 0.8; u.armR.rotation.x = sw * 0.8;
    u.hips.position.y = 0.92 + Math.abs(Math.cos(u.phase)) * 0.035;
  }
}

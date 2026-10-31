// Instalator: automatic TV camera — slow dollhouse orbit, room framing, close-ups on the panel/rack/tablet, scripted shots.

import * as THREE from "three";
import { polyBounds } from "../shared/geom.js";

export class Director {
  constructor(R) {
    this.R = R;
    this.cam = R.camera;
    this.pos = this.cam.position.clone();
    this.tgt = new THREE.Vector3();
    this.wantPos = this.pos.clone();
    this.wantTgt = new THREE.Vector3();
    this.mode = "orbit";
    this.orbit = { center: new THREE.Vector3(), radius: 22, height: 15, az: 0.7, speed: 0.035, sway: 0 };
    this.shot = null;
    this.stiff = 2.2;
    this.t = 0;
    this.cutMode = "overview";
  }

  overview(data, opts = {}) {
    const b = polyBounds(data.rooms.filter((r) => opts.floor == null || r.floor === opts.floor).map((r) => r.poly));
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    const span = Math.max(b.x1 - b.x0, b.z1 - b.z0, 6);
    const fy = data.floors[opts.floor ?? 0]?.y || 0;
    this.mode = "orbit";
    this.orbit.center.set(cx, fy + 0.6, cz);
    this.orbit.radius = span * (opts.zoom || 1.32) + 4;
    this.orbit.height = span * 0.95 + 3.5;
    this.orbit.speed = opts.speed ?? 0.03;
    if (opts.az != null) this.orbit.az = opts.az;
    this.cutMode = "overview";
    this.R.frame = span * 0.9 + 6;
  }

  room(data, room) {
    const b = polyBounds([room.poly]);
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    const span = Math.max(b.x1 - b.x0, b.z1 - b.z0, 3);
    const fy = data.floors[room.floor]?.y || 0;
    this.mode = "orbit";
    this.orbit.center.set(cx, fy + 0.8, cz);
    this.orbit.radius = span * 1.25 + 2.2;
    this.orbit.height = span * 1.05 + 2.4;
    this.orbit.speed = 0.02;
    this.cutMode = "overview";
    this.R.frame = span + 6;
  }

  closeup(pos, normal, dist = 1.6, lift = 0.15, fov = 34) {
    this.mode = "shot";
    const p = pos.clone().add(normal.clone().multiplyScalar(dist)).add(new THREE.Vector3(0, lift, 0));
    this.shot = { pos: p, tgt: pos.clone(), fov, sway: 0.04 };
    this.cutMode = "close";
    this.R.frame = 8;
  }

  look(pos, tgt, fov = 36, sway = 0.08) {
    this.mode = "shot";
    this.shot = { pos: pos.clone(), tgt: tgt.clone(), fov, sway };
    this.cutMode = "overview";
  }

  track(obj, offset) {
    this.mode = "track";
    this.trackObj = obj;
    this.trackOff = offset.clone();
    this.cutMode = "overview";
  }

  update(dt) {
    this.t += dt;
    if (this.mode === "track" && this.trackObj) {
      const p = this.trackObj.position;
      this.wantTgt.set(p.x, p.y + 1.1, p.z);
      this.wantPos.copy(p).add(this.trackOff);
      this.wantFov = 40;
    } else if (this.mode === "orbit") {
      const o = this.orbit;
      o.az += o.speed * dt;
      const sway = Math.sin(this.t * 0.11) * 0.06;
      this.wantTgt.copy(o.center);
      this.wantPos.set(o.center.x + Math.sin(o.az + sway) * o.radius, o.center.y + o.height, o.center.z + Math.cos(o.az + sway) * o.radius);
      this.wantFov = 36;
    } else if (this.shot) {
      const s = this.shot;
      const w = Math.sin(this.t * 0.35) * s.sway;
      this.wantPos.copy(s.pos).add(new THREE.Vector3(w, Math.sin(this.t * 0.27) * s.sway * 0.5, 0));
      this.wantTgt.copy(s.tgt);
      this.wantFov = s.fov;
    }
    const k = 1 - Math.exp(-dt * this.stiff);
    this.pos.lerp(this.wantPos, k);
    this.tgt.lerp(this.wantTgt, k);
    this.cam.position.copy(this.pos);
    this.cam.lookAt(this.tgt);
    if (this.wantFov && Math.abs(this.cam.fov - this.wantFov) > 0.05) {
      this.cam.fov += (this.wantFov - this.cam.fov) * k;
      this.cam.updateProjectionMatrix();
    }
    this.R.focus.copy(this.tgt);
  }

  snap() {
    this.update(0.016);
    this.pos.copy(this.wantPos);
    this.tgt.copy(this.wantTgt);
    this.cam.position.copy(this.pos);
    this.cam.lookAt(this.tgt);
  }
}

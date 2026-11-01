// Instalator: crosshair targeting — mount points for the held item, stations (panel, rack, tablet), installed devices; ghost preview and hold-to-install.

import * as THREE from "three";
import { BY_ID } from "../shared/catalog.js";

const REACH = 3.2;
const STYLE_TIME = { drill: 1.0, screw: 0.8, peel: 0.45, strip: 1.2, tap: 0.25, rotate: 0.7 };

export function installStyle(id, mountKind) {
  const it = BY_ID[id] || {};
  if (mountKind === "socketE27" || mountKind === "socketGU10") return "screw";
  if (it.strip) return "strip";
  if (it.caps?.includes("trv")) return "rotate";
  if (["ceiling", "outdoorWall", "doorbell", "garage", "gate"].includes(mountKind) && it.power !== "battery") return "drill";
  if (["wall", "door", "window", "floor"].includes(mountKind) && it.power === "battery") return "peel";
  if (mountKind === "wall" || mountKind === "doorLock") return "drill";
  return "tap";
}

export class Interact {
  constructor(R, house, player) {
    this.R = R; this.house = house; this.player = player;
    this.target = null;
    this.hold = 0;
    this.ghost = null; this.ghostId = null;
    this.rc = new THREE.Raycaster();
    this.tmp = new THREE.Vector3();
  }

  blocked(from, to, margin = 0.3) {
    const d = to.clone().sub(from);
    const len = d.length();
    this.rc.set(from, d.normalize());
    this.rc.far = Math.max(0, len - margin);
    const objs = [];
    for (const wg of this.house.b?.wallGroups || []) objs.push(wg.mesh);
    return this.rc.intersectObjects(objs, true).length > 0;
  }

  pickMount(S, data, held) {
    const it = BY_ID[held];
    if (!it || !data) return null;
    const eye = this.player.cam.position, fwd = this.player.dir();
    const used = new Set(S.devs.map((d) => d.mount).filter(Boolean));
    let best = null, bs = 0.985;
    const consider = (pos, kind, payload) => {
      const p = this.tmp.set(...pos);
      const v = p.clone().sub(eye);
      const dist = v.length();
      if (dist > REACH || dist < 0.15) return;
      const c = v.normalize().dot(fwd);
      const score = c + Math.max(0, 0.02 - dist * 0.004);
      if (score > bs && !this.blocked(eye, p)) { bs = score; best = { kind, pos: [...pos], dist, ...payload }; }
    };
    if (it.strip) for (const sp of data.strips || []) {
      if (!it.strip.includes(sp.kind) || S.devs.some((d) => d.strip === sp.id)) continue;
      const mid = sp.points[Math.floor(sp.points.length / 2)];
      consider(mid, "strip", { strip: sp.id, label: "taśmę LED" });
    }
    if (it.caps?.includes("tablet") || it.caps?.includes("wallmount") || it.caps?.includes("stand")) {
      for (const sp of data.tabletSpots || []) consider(sp.pos, "tablet", { spot: sp.id, rating: sp.rating, label: sp.kind === "wall" ? "tablet na ścianie" : "tablet na stojaku" });
    }
    for (const m of data.mounts || []) {
      if (used.has(m.id)) continue;
      const ok = (it.mounts || []).includes(m.kind) || (m.kind === "outdoorWall" && (it.mounts || []).includes("wall") && it.caps?.includes("outdoor"));
      if (!ok) continue;
      consider(m.pos, "mount", { mount: m, label: it.name });
    }
    return best;
  }

  pickStation(data) {
    if (!data) return null;
    const eye = this.player.cam.position, fwd = this.player.dir();
    let best = null, bs = 0.93;
    const add = (pos, kind, label) => {
      if (!pos) return;
      const p = new THREE.Vector3(...pos);
      const v = p.clone().sub(eye), dist = v.length();
      if (dist > 2.6) return;
      const c = v.normalize().dot(fwd);
      if (c > bs && !this.blocked(eye, p)) { bs = c; best = { kind, pos, label }; }
    };
    add(data.panel?.pos, "panel", "Rozdzielnica");
    add((data.rack || data.mediaBox)?.pos, "rack", data.rack ? "Szafa rack" : "Skrzynka multimedialna");
    const tob = this.house.tabletObj;
    if (tob) { const w = tob.getWorldPosition(new THREE.Vector3()); add(w.toArray(), "tabletUse", "Tablet"); }
    return best;
  }

  pickDevice(S) {
    const eye = this.player.cam.position, fwd = this.player.dir();
    let best = null, bs = 0.992;
    for (const d of S.devs) {
      if (d.place !== "mount" || !d.pos) continue;
      const p = new THREE.Vector3(...d.pos);
      const v = p.clone().sub(eye), dist = v.length();
      if (dist > REACH) continue;
      const c = v.normalize().dot(fwd);
      if (c > bs) { bs = c; best = { kind: "device", dev: d, pos: d.pos }; }
    }
    return best;
  }

  setGhost(id, target) {
    if (!target || target.kind !== "mount") {
      if (this.ghost) this.ghost.visible = false;
      return;
    }
    if (this.ghostId !== id) {
      if (this.ghost) this.R.scene.remove(this.ghost);
      const g = this.house.model(id, {});
      g.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; o.material.depthWrite = false; o.material.emissive?.set?.("#3e9b5f"); if (o.material.emissiveIntensity != null) o.material.emissiveIntensity = 0.35; } });
      this.R.scene.add(g);
      this.ghost = g; this.ghostId = id;
    }
    const m = target.mount;
    this.ghost.visible = true;
    this.ghost.position.set(...m.pos);
    const q = m.quat ? new THREE.Quaternion(...m.quat) : new THREE.Quaternion();
    this.ghost.quaternion.copy(q);
  }

  update(dt, S, data, held, mouseDown) {
    let t = null;
    if (held) t = this.pickMount(S, data, held);
    const st = this.pickStation(data);
    if (!t && st) t = st;
    if (!t && !held) t = this.pickDevice(S);
    if (this.target && t && this.target.kind === t.kind && (this.target.mount?.id || this.target.spot || this.target.strip || this.target.dev?.uid || this.target.kind) !== (t.mount?.id || t.spot || t.strip || t.dev?.uid || t.kind)) this.hold = 0;
    this.target = t;
    this.setGhost(held, t);
    let done = null;
    if (t && held && (t.kind === "mount" || t.kind === "strip" || t.kind === "tablet") && mouseDown) {
      const style = t.kind === "strip" ? "strip" : t.kind === "tablet" ? "drill" : installStyle(held, t.mount.kind);
      const need = STYLE_TIME[style] || 0.5;
      this.hold += dt;
      this.style = style;
      this.k = Math.min(1, this.hold / need);
      if (this.hold >= need) { done = { ...t, style, id: held }; this.hold = 0; this.k = 0; }
    } else { this.hold = 0; this.k = 0; this.style = null; }
    return done;
  }
}

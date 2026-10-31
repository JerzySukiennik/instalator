// Instalator: the building on the TV — loading, cutaway, device visuals, power and lights, cables, Wi-Fi heatmap, camera cones.

import * as THREE from "three";
import { BY_ID } from "../shared/catalog.js";
import { panelLayout, circuitLive, relayOf, derive } from "../shared/sim.js";
import { wifiGrid } from "../shared/geom.js";
import { buildStandin } from "./standin.js";

const U = 0.04445;
const tmpV = new THREE.Vector3();

let DM = null;
async function deviceModels() {
  if (DM !== null) return DM;
  try { DM = await import("../models/devices.js"); } catch (e) { console.warn("[house] device models not ready, using boxes", e.message); DM = false; }
  return DM;
}

function fallbackDevice(id) {
  const it = BY_ID[id] || {};
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: "#f2f2f0", roughness: 0.6, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: "#2c2f33", roughness: 0.5, flatShading: true });
  let m;
  if (it.where === "rack" || id.startsWith("rack") || id === "media-box") m = new THREE.Mesh(new THREE.BoxGeometry(0.44, U * (it.u || 1) * 0.96, 0.3), id.includes("patch") || id.includes("brush") ? dark : white), m.position.set(0, U * (it.u || 1) / 2, -0.15);
  else if (it.where === "din") m = new THREE.Mesh(new THREE.BoxGeometry(0.0175 * (it.mod || 1) - 0.001, 0.09, 0.06), white), m.position.z = 0.03;
  else if ((it.mounts || []).includes("socketE27") || (it.mounts || []).includes("socketGU10")) m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), white), m.position.y = -0.08;
  else if ((it.mounts || []).includes("ceiling")) m = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 18), white), m.position.y = -0.02;
  else m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), white), m.position.z = 0.025;
  m.castShadow = true;
  g.add(m);
  const led = new THREE.MeshStandardMaterial({ color: "#222", emissive: "#4ab4ff", emissiveIntensity: 0 });
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), led);
  dot.position.set(0, m.position.y, m.position.z + 0.04);
  g.add(dot);
  g.userData = { leds: [{ material: led, role: "status", color: "#4ab4ff" }], fallback: true };
  if (it.caps?.includes("light")) g.userData.light = { material: white, kind: "bulb", pos: [0, -0.08, 0] };
  return g;
}

function fromQuat(q, normal) {
  const o = new THREE.Quaternion();
  if (q && q.length === 4) return o.set(q[0], q[1], q[2], q[3]);
  if (normal) {
    const n = new THREE.Vector3(...normal);
    if (Math.abs(n.y) > 0.9) return o.identity();
    return o.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n.normalize());
  }
  return o.identity();
}

export class House {
  constructor(R) {
    this.R = R;
    this.root = new THREE.Group();
    R.scene.add(this.root);
    this.b = null;
    this.vis = new Map();
    this.anims = [];
    this.lights = [];
    for (let i = 0; i < 7; i++) {
      const l = new THREE.PointLight("#ffd9a0", 0, 7, 1.6);
      l.castShadow = false;
      this.R.scene.add(l);
      this.lights.push(l);
    }
    this.cutPlaneLow = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.95);
    this.cutPlaneInt = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.3);
    this.overlay = new THREE.Group();
    this.R.scene.add(this.overlay);
    this.heat = new Map();
    this.cones = new Map();
    this.runLines = new THREE.Group();
    this.overlay.add(this.runLines);
    this.floorShown = 99;
    this.t = 0;
    this.cables = new THREE.Group();
    this.R.scene.add(this.cables);
    this.cableKey = "";
    this.fill = new THREE.PointLight("#fff1dd", 0, 4.5, 1.3);
    this.R.scene.add(this.fill);
  }

  async load(id) {
    await deviceModels();
    this.clear();
    let b = null;
    if (id !== "standin") {
      try {
        const mod = await import("../buildings/index.js");
        b = await mod.buildBuilding(id, { quality: "tv" });
      } catch (e) {
        console.warn("[house] building module failed, using stand-in", e);
      }
    }
    if (!b) b = buildStandin();
    this.b = b;
    this.data = b.data;
    this.root.add(b.group);
    b.group.traverse((o) => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial && o.material.metalness > 0.3) o.material.envMap = this.R.envMap; });
    this.fixtures = b.fixtures || [];
    this.placeEnclosures();
    return b;
  }

  clear() {
    this.ready = false;
    if (this.b) this.root.remove(this.b.group);
    for (const v of this.vis.values()) v.obj.parent && v.obj.parent.remove(v.obj);
    this.vis.clear();
    for (const o of [this.panelObj, this.rackObj, this.ontObj]) if (o && o.parent) o.parent.remove(o);
    this.heat.forEach((m) => this.overlay.remove(m));
    this.heat.clear();
    this.cones.forEach((m) => this.overlay.remove(m));
    this.cones.clear();
    this.runLines.clear();
    this.cables.clear();
    this.cableKey = "";
    this.b = null;
  }

  model(id, opts) {
    let g = null;
    if (DM && DM.buildDevice) { try { g = DM.buildDevice(id, opts || {}); } catch (e) { console.warn("[house] model", id, e); } }
    if (!g) g = fallbackDevice(id);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = o.castShadow !== false; if (o.material?.metalness > 0.3) o.material.envMap = this.R.envMap; } });
    return g;
  }

  anchorObj(anchor) {
    const g = new THREE.Group();
    g.position.set(...anchor.pos);
    g.quaternion.copy(fromQuat(anchor.quat, anchor.normal));
    this.root.add(g);
    return g;
  }

  placeEnclosures() {
    const d = this.data;
    const lay = panelLayout(d);
    this.layout = lay;
    if (d.panel) {
      this.panelObj = this.anchorObj(d.panel);
      const enc = this.model("panel-enclosure", { rows: lay.rows, slotsPerRow: lay.per });
      this.panelObj.add(enc);
      this.panelEnc = enc;
      this.rails = enc.userData.rails || Array.from({ length: lay.rows }, (_, i) => ({ y: 0.5 - i * 0.14 - 0.12, x0: -lay.per * 0.0175 / 2, z: 0.07 }));
      this.breakers = new Map();
      for (const it of lay.items) {
        const id = it.kind === "main" ? "main-switch" : it.kind === "rcd" ? "rcd" : (d.circuits.find((c) => c.id === it.circuit)?.breaker || "B16") === "B10" ? "mcb-b10" : (d.circuits.find((c) => c.id === it.circuit)?.breaker || "") === "C20" ? "mcb-c20" : "mcb-b16";
        const m = this.model(id, {});
        this.putDin(m, it.row, it.slot, it.mod);
        this.breakers.set(it.key, { obj: m, lever: m.userData.lever || null, item: it, cur: 1 });
      }
    }
    const rackAnchor = d.rack || d.mediaBox;
    if (rackAnchor) {
      this.rackObj = this.anchorObj(rackAnchor);
      const cab = this.model(d.rack ? (d.rack.units > 9 ? "rack-12u" : "rack-9u") : "media-box", {});
      this.rackObj.add(cab);
      this.cab = cab;
      this.rackOrigin = new THREE.Vector3(...(cab.userData.rackOrigin || [0, 0.05, 0.42]));
    }
    if (d.wan) {
      this.ontObj = this.anchorObj(d.wan);
      this.ontObj.add(this.model("ont", {}));
    }
  }

  putDin(obj, row, slot, mod) {
    const r = this.rails[Math.min(row, this.rails.length - 1)];
    obj.position.set(r.x0 + (slot + mod / 2) * 0.0175, r.y, r.z || 0);
    this.panelEnc.add(obj);
  }

  focusPoint(kind) {
    const d = this.data;
    const a = kind === "panel" ? d.panel : kind === "rack" ? (d.rack || d.mediaBox) : null;
    if (!a) return null;
    const q = fromQuat(a.quat, a.normal);
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    return { pos: new THREE.Vector3(...a.pos), normal: n, floor: a.floor ?? 0 };
  }

  sync(s, der) {
    if (!this.b) return;
    const seen = new Set();
    for (const d of s.devs) {
      seen.add(d.uid);
      let v = this.vis.get(d.uid);
      if (!v) v = this.addDevice(d);
      if (!v) continue;
      v.d = d;
      if (d.place === "mount" && BY_ID[d.id]?.caps.includes("camera") && d.aim) {
        const yaw = Math.atan2(d.aim[0], d.aim[2]);
        if (v.yawBase === undefined) v.yawBase = new THREE.Euler().setFromQuaternion(v.obj.quaternion, "YXZ").y;
        v.obj.rotation.set(0, yaw, 0, "YXZ");
      }
    }
    for (const [uid, v] of this.vis) if (!seen.has(uid)) { v.obj.parent && v.obj.parent.remove(v.obj); this.vis.delete(uid); if (v.fixture?.bulb) v.fixture.bulb.visible = true; }
    this.state = s;
    this.der = der;
    this.applyPower();
    this.syncRuns(s);
    this.syncPatches(s);
    this.ready = true;
    if (this.wifiOn) this.showWifi(true);
    if (this.conesOn) this.showCones(true);
  }

  addDevice(d) {
    const it = BY_ID[d.id];
    if (d.place === "fixed") return null;
    let obj;
    if (d.place === "strip") {
      const sp = (this.data.strips || []).find((x) => x.id === d.strip);
      if (!sp) return null;
      const pts = sp.points.map((p) => new THREE.Vector3(...p));
      if (DM && DM.buildStrip) { try { obj = DM.buildStrip(d.id, pts, {}); } catch (e) { obj = null; } }
      if (!obj) {
        const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ff9a5a", emissiveIntensity: 1.2 });
        obj = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.01), 48, 0.008, 4), mat);
        obj.userData = { light: { material: mat, kind: "strip" } };
      }
      this.root.add(obj);
    } else if (d.place === "rack") {
      obj = this.model(d.id, {});
      obj.position.copy(this.rackOrigin).add(new THREE.Vector3(0, d.u * U, 0));
      this.cab.add(obj);
    } else if (d.place === "shelf") {
      obj = this.model(d.id, {});
      this.cab.add(obj);
    } else if (d.place === "din") {
      obj = this.model(d.id, {});
      this.putDin(obj, d.row, d.slot, it?.mod || 1);
    } else if (d.place === "tablet") {
      obj = this.model(d.id, {});
      obj.position.set(...d.pos);
      obj.quaternion.copy(fromQuat(d.quat, null));
      if (d.kind === "wall" && it?.caps.includes("tablet")) obj.position.add(new THREE.Vector3(0, 0, 0.018).applyQuaternion(obj.quaternion));
      if (d.kind !== "wall" && it?.caps.includes("tablet")) { obj.position.add(new THREE.Vector3(0, 0.05, 0).applyQuaternion(obj.quaternion)); obj.rotateX(-0.32); }
      this.root.add(obj);
      if (it?.caps.includes("tablet")) this.tabletObj = obj;
    } else {
      obj = this.model(d.id, {});
      obj.position.set(...d.pos);
      obj.quaternion.copy(fromQuat(d.quat, d.normal));
      this.root.add(obj);
    }
    const v = { obj, d, born: this.t };
    if (d.fixture) {
      v.fixture = this.fixtures.find((f) => f.id === d.fixture) || null;
      if (v.fixture?.bulb) v.fixture.bulb.visible = false;
    }
    this.vis.set(d.uid, v);
    if (d.place === "shelf" || d.id === "rack-shelf") this.layoutShelf();
    if (this.ready) this.installAnim(v);
    return v;
  }

  installAnim(v) {
    const { obj, d } = v;
    const it = BY_ID[d.id] || {};
    const p0 = obj.position.clone(), q0 = obj.quaternion.clone(), s0 = obj.scale.clone();
    const ease = (k) => 1 - Math.pow(1 - k, 3);
    const back = (k) => 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
    if (d.place === "rack") {
      this.anims.push({ t: 0, dur: 0.7, step: (k) => { obj.position.copy(p0).add(new THREE.Vector3(0, 0, 0.35 * (1 - ease(k)))); } });
    } else if (d.place === "din") {
      this.anims.push({ t: 0, dur: 0.35, step: (k) => { obj.position.copy(p0).add(new THREE.Vector3(0, 0, 0.03 * (1 - ease(k)))); obj.scale.set(s0.x, s0.y * (k < 0.8 ? 1 : 1 - 0.06 * Math.sin((k - 0.8) * 15)), s0.z); } });
    } else if (d.kind === "socketE27" || d.kind === "socketGU10") {
      this.anims.push({ t: 0, dur: 0.9, step: (k) => { const e = ease(k); obj.position.copy(p0).add(new THREE.Vector3(0, -0.06 * (1 - e), 0)); obj.quaternion.copy(q0).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (1 - e) * Math.PI * 4)); } });
    } else if (d.place === "strip") {
      obj.traverse((o) => { if (o.isMesh && o.geometry?.index) { const n = o.geometry.index.count; o.geometry.setDrawRange(0, 0); o.userData._n = n; } });
      this.anims.push({ t: 0, dur: 1.4, step: (k) => obj.traverse((o) => { if (o.userData._n) { const c = Math.floor(o.userData._n * ease(k)); o.geometry.setDrawRange(0, c - (c % 3)); } }) });
    } else if (d.place === "shelf") {
      this.anims.push({ t: 0, dur: 0.5, step: (k) => { obj.position.y = obj.userData._y0 ?? obj.position.y; } });
    } else {
      const n = new THREE.Vector3(0, 0, 1).applyQuaternion(q0);
      const ceiling = (it.mounts || []).includes("ceiling") && d.kind === "ceiling";
      const off = ceiling ? new THREE.Vector3(0, -0.25, 0) : n.multiplyScalar(0.18);
      this.anims.push({ t: 0, dur: 0.6, step: (k) => { obj.position.copy(p0).addScaledVector(off, 1 - ease(k)); obj.scale.copy(s0).multiplyScalar(Math.max(0.01, k < 1 ? back(k) : 1)); } });
      this.dust(p0);
    }
  }

  dust(p) {
    const n = 14;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos.set([p.x, p.y, p.z], i * 3); vel.push(new THREE.Vector3((Math.random() - 0.5) * 0.9, Math.random() * 0.4 - 0.25, (Math.random() - 0.5) * 0.9)); }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: "#e9e2d4", size: 0.035, transparent: true, opacity: 0.9, depthWrite: false }));
    this.overlay.add(pts);
    this.anims.push({ t: 0, dur: 0.9, step: (k) => {
      for (let i = 0; i < n; i++) { pos[i * 3] += vel[i].x * 0.016; pos[i * 3 + 1] += (vel[i].y - k * 0.6) * 0.016; pos[i * 3 + 2] += vel[i].z * 0.016; }
      geo.attributes.position.needsUpdate = true;
      pts.material.opacity = 0.9 * (1 - k);
      if (k >= 1) this.overlay.remove(pts);
    } });
  }

  layoutShelf() {
    const shelfDevs = [...this.vis.values()].filter((v) => v.d.place === "shelf");
    const shelves = [...this.vis.values()].filter((v) => v.d.id === "rack-shelf").sort((a, b) => a.d.u - b.d.u);
    const ms = this.cab?.userData.shelf;
    shelfDevs.forEach((v, i) => {
      if (shelves.length) {
        const sh = shelves[Math.min(shelves.length - 1, Math.floor(i / 3))];
        const k = i % 3;
        v.obj.position.copy(this.rackOrigin).add(new THREE.Vector3(-0.14 + k * 0.14, (sh.d.u + 1) * U + 0.004, -0.16));
      } else if (ms) {
        v.obj.position.set(ms.origin[0] - ms.w / 2 + 0.08 + i * 0.1, ms.origin[1], ms.origin[2]);
      } else {
        v.obj.position.set(-0.12 + i * 0.1, 0.1, 0.1);
      }
    });
  }


  applyPower() {
    const s = this.state, d = this.data;
    if (!s || !d) return;
    const night = this.R.nightness();
    this.lit = [];
    for (const f of this.fixtures) {
      let on = circuitLive(s, d, f.circuit);
      const rel = relayOf(s, f.circuit);
      if (on && rel && rel.dev.relay && rel.dev.relay[rel.ch] === false) on = false;
      const smart = [...this.vis.values()].find((v) => v.d.fixture === f.id);
      if (smart) on = false;
      if (on && f._on === false && this.ready) f._flick = 0.45;
      f._on = on;
      if (f.emissive) { f.emissive.emissiveIntensity = on ? 2.2 : 0; if (on) f.emissive.emissive?.set?.("#ffd8a0"); }
      if (on) this.lit.push({ pos: f.lightPos, color: "#ffd2a0", k: 1, f });
    }
    for (const v of this.vis.values()) {
      const it = BY_ID[v.d.id] || {};
      const st = this.der?.dev[v.d.uid];
      const live = !!(st && st.pw);
      for (const l of v.obj.userData.leds || []) {
        if (!l.material) continue;
        l.material.emissiveIntensity = live ? (l.role === "display" ? 1.0 : l.role === "glow" || l.role === "ring" ? 1.1 : 1.6) : 0;
        if (l.role === "status" && st) l.material.emissive?.set?.(st.net ? (l.color || "#4ab4ff") : "#f2a541");
      }
      const L = v.obj.userData.light;
      if (L && L.material) {
        const on = live && v.d.on !== false;
        const col = new THREE.Color(v.d.color || "#ffd9a0");
        if (L.material.emissive) L.material.emissive.copy(col);
        L.material.emissiveIntensity = on ? 0.6 + 2.2 * (v.d.bri ?? 0.85) : 0;
        if (on) {
          const p = L.pos ? new THREE.Vector3(...L.pos).applyMatrix4(v.obj.matrixWorld) : v.obj.getWorldPosition(new THREE.Vector3());
          this.lit.push({ pos: [p.x, p.y, p.z], color: "#" + col.getHexString(), k: it.caps?.includes("strip") ? 0.7 : 1 });
        }
      }
    }
    for (const b of this.breakers?.values() || []) {
      const it = b.item;
      const on = it.kind === "main" ? s.panel.main : it.kind === "rcd" ? !!s.panel.rcd[it.rcd] : !!s.panel.br[it.circuit];
      b.target = on ? 0 : 0.55;
    }
    this.night = night;
  }

  syncRuns(s) {
    this.runLines.clear();
    if (!this.xray) return;
    for (const d of s.devs) if (d.run) this.runLines.add(this.runMesh(d, 1));
  }

  portWorld(uid, idx) {
    const v = this.vis.get(uid);
    const obj = v ? v.obj : uid === "ont" ? this.ontObj?.children[0] : uid === "mbk" ? this.cab : null;
    if (!obj) return null;
    obj.updateWorldMatrix(true, false);
    const list = (obj.userData.ports || []).filter((p) => p.kind !== "sfp" && p.kind !== "power");
    const sorted = [...list.filter((p) => p.kind === "wan"), ...list.filter((p) => p.kind !== "wan")];
    const p = sorted[idx];
    const local = p ? new THREE.Vector3(...p.pos) : new THREE.Vector3(-0.18 + (idx % 12) * 0.03, 0.012 + Math.floor(idx / 12) * 0.016, 0.01);
    return obj.localToWorld(local);
  }

  syncPatches(s) {
    const key = JSON.stringify(s.patches) + this.vis.size;
    if (key === this.cableKey) return;
    this.cableKey = key;
    this.cables.clear();
    const a = this.data.rack || this.data.mediaBox;
    if (!a) return;
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(fromQuat(a.quat, a.normal));
    for (const p of s.patches) {
      const A = this.portWorld(p.a[0], p.a[1]), B = this.portWorld(p.b[0], p.b[1]);
      if (!A || !B) continue;
      const d = A.distanceTo(B);
      const mid = A.clone().add(B).multiplyScalar(0.5).addScaledVector(n, 0.05 + d * 0.12).add(new THREE.Vector3(0, -0.03 - d * 0.18, 0));
      const curve = new THREE.CatmullRomCurve3([A.clone(), A.clone().addScaledVector(n, 0.03), mid, B.clone().addScaledVector(n, 0.03), B.clone()], false, "centripetal");
      const mat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.55, flatShading: false });
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.0028, 6), mat);
      tube.castShadow = true;
      this.cables.add(tube);
      for (const [P, Q] of [[A, A.clone().addScaledVector(n, 0.03)], [B, B.clone().addScaledVector(n, 0.03)]]) {
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.009, 0.024), new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.4, transparent: true, opacity: 0.92 }));
        boot.position.copy(P).addScaledVector(n, 0.012);
        boot.lookAt(Q.clone().addScaledVector(n, 0.05));
        this.cables.add(boot);
      }
    }
  }

  runPath(d) {
    const a = this.data.rack || this.data.mediaBox;
    if (!a) return [];
    const fl = this.data.floors[d.floor ?? 0] || { y: 0, height: 2.7 };
    const top = fl.y + fl.height - 0.12;
    const p0 = new THREE.Vector3(...d.pos);
    const end = new THREE.Vector3(...a.pos);
    const af = this.data.floors[a.floor ?? 0] || fl;
    const topA = af.y + af.height - 0.12;
    return [p0, new THREE.Vector3(p0.x, top, p0.z), new THREE.Vector3(end.x, top, p0.z), new THREE.Vector3(end.x, topA, end.z), end];
  }

  runMesh(d, k) {
    const pts = this.runPath(d);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const col = BY_ID[d.id]?.caps.includes("camera") ? "#f2c14e" : "#4f9be8";
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.95, depthTest: false }));
    line.renderOrder = 10;
    if (k < 1) geo.setDrawRange(0, 0);
    return line;
  }

  animateRun(uid) {
    const v = this.vis.get(uid);
    const d = v?.d || this.state?.devs.find((x) => x.uid === uid);
    if (!d) return;
    const pts = this.runPath(d);
    if (pts.length < 2) return;
    const curve = new THREE.CurvePath();
    for (let i = 0; i < pts.length - 1; i++) curve.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.018, 5), new THREE.MeshBasicMaterial({ color: BY_ID[d.id]?.caps.includes("camera") ? "#f2c14e" : "#4f9be8", depthTest: false, transparent: true }));
    tube.renderOrder = 11;
    this.overlay.add(tube);
    const idx = tube.geometry.index.count;
    tube.geometry.setDrawRange(0, 0);
    this.anims.push({ t: 0, dur: 2.4, step: (k) => {
      tube.geometry.setDrawRange(0, Math.floor(idx * Math.min(1, k * 1.25)) - (Math.floor(idx * Math.min(1, k * 1.25)) % 3));
      tube.material.opacity = k < 0.8 ? 1 : 1 - (k - 0.8) * 5;
      if (k >= 1) this.overlay.remove(tube);
    } });
  }

  setXray(on) {
    this.xray = on;
    if (this.state) this.syncRuns(this.state);
  }

  showWifi(on, live = null) {
    this.wifiOn = on;
    this.heat.forEach((m) => { m.visible = false; });
    if (!on || !this.data) return;
    const aps = live || this.der?.aps || [];
    for (const f of this.data.floors) {
      const g = wifiGrid(this.data, aps, f.index, 0.5);
      if (!g) continue;
      let m = this.heat.get(f.index);
      const w = g.nx * g.cell, h = g.nz * g.cell;
      if (!m || m.userData.nx !== g.nx || m.userData.nz !== g.nz) {
        if (m) this.overlay.remove(m);
        const tex = new THREE.DataTexture(new Uint8Array(g.nx * g.nz * 4), g.nx, g.nz, THREE.RGBAFormat);
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearFilter;
        m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
        m.rotation.x = -Math.PI / 2;
        m.renderOrder = 5;
        m.userData = { nx: g.nx, nz: g.nz, tex };
        this.overlay.add(m);
        this.heat.set(f.index, m);
      }
      m.position.set(g.x0 + w / 2, f.y + 0.03, g.z0 + h / 2);
      const px = m.userData.tex.image.data;
      for (let j = 0; j < g.nz; j++) for (let i = 0; i < g.nx; i++) {
        const v = g.v[j * g.nx + i];
        const o = ((g.nz - 1 - j) * g.nx + i) * 4;
        if (v < 0) { px[o + 3] = 0; continue; }
        const c = heatColor(v);
        px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = c[3];
      }
      m.userData.tex.needsUpdate = true;
      m.visible = f.index <= this.floorShown;
    }
  }

  showCones(on) {
    this.conesOn = on;
    this.cones.forEach((m) => this.overlay.remove(m));
    this.cones.clear();
    if (!on || !this.state) return;
    for (const d of this.state.devs) {
      const it = BY_ID[d.id];
      if (!it?.caps.includes("camera") || !d.aim) continue;
      const fov = (it.cam.fov * Math.PI) / 180, r = it.cam.range;
      const geo = new THREE.CircleGeometry(r, 24, -fov / 2, fov);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: "#f2c14e", transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
      const fl = this.data.floors[d.floor ?? 0] || { y: 0 };
      m.position.set(d.pos[0], fl.y + 0.05, d.pos[2]);
      m.rotation.y = Math.atan2(d.aim[0], d.aim[2]) - Math.PI / 2;
      m.renderOrder = 6;
      this.overlay.add(m);
      this.cones.set(d.uid, m);
    }
  }

  setFloor(n) {
    this.floorShown = n;
    for (const fg of this.b?.floorGroups || []) fg.group.visible = fg.floor <= n;
    this.heat.forEach((m, f) => { m.visible = this.wifiOn && f <= n; });
  }

  cutaway(camPos, target, mode = "overview") {
    if (!this.b) return;
    const dir = tmpV.copy(camPos).sub(target).setY(0).normalize();
    const N = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
    for (const wg of this.b.wallGroups || []) {
      let planes = null;
      const fy = this.data.floors[wg.floor]?.y || 0;
      if (mode !== "none") {
        if (wg.side === "int") planes = mode === "close" ? null : [new THREE.Plane(new THREE.Vector3(0, -1, 0), fy + 1.3)];
        else {
          const n = N[wg.side];
          const dot = n ? n[0] * dir.x + n[1] * dir.z : 0;
          if (dot > 0.28) planes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), fy + (mode === "close" ? 0.35 : 0.95))];
        }
      }
      const mats = wg.material ? [wg.material] : [];
      if (!mats.length) wg.mesh.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (!mats.includes(m)) mats.push(m); }); });
      for (const m of mats) {
        const was = m.clippingPlanes?.[0]?.constant;
        const now = planes?.[0]?.constant;
        if (was !== now) { m.clippingPlanes = planes; m.clipShadows = true; m.needsUpdate = true; }
      }
    }
  }

  update(dt, focus, cam) {
    this.t += dt;
    if (cam && this.closeFill) { this.fill.position.copy(cam.position).add(new THREE.Vector3(0.2, 0.35, 0)); this.fill.intensity += (2.2 - this.fill.intensity) * Math.min(1, dt * 3); }
    else this.fill.intensity += (0 - this.fill.intensity) * Math.min(1, dt * 3);
    for (let i = this.anims.length - 1; i >= 0; i--) {
      const a = this.anims[i];
      a.t += dt;
      const k = Math.min(1, a.t / a.dur);
      a.step(k);
      if (k >= 1) this.anims.splice(i, 1);
    }
    for (const f of this.fixtures || []) {
      if (!(f._flick > 0)) continue;
      f._flick -= dt;
      if (f.emissive) f.emissive.emissiveIntensity = f._flick > 0 ? (Math.sin(this.t * 90) > 0.2 ? 2.2 : 0.2) : 2.2;
    }
    for (const b of this.breakers?.values() || []) {
      if (!b.lever || b.target === undefined) continue;
      b.lever.rotation.x += (b.target - b.lever.rotation.x) * Math.min(1, dt * 22);
    }
    if (this.lit) {
      const night = this.R.nightness();
      const f = focus || new THREE.Vector3();
      const sorted = this.lit.slice().sort((a, b) => (Math.hypot(a.pos[0] - f.x, a.pos[2] - f.z) - Math.hypot(b.pos[0] - f.x, b.pos[2] - f.z)));
      this.lights.forEach((l, i) => {
        const s = sorted[i];
        if (!s || s.pos[1] > (this.data.floors[this.floorShown]?.y ?? 99) + 3.5) { l.intensity = 0; return; }
        l.position.set(s.pos[0], s.pos[1] - 0.15, s.pos[2]);
        l.color.set(s.color);
        const fl = s.f && s.f._flick > 0 ? (Math.sin(this.t * 90) > 0.2 ? 1 : 0.15) : 1;
        l.intensity = (0.8 + night * 5.5) * s.k * fl;
      });
    }
  }
}

function heatColor(v) {
  if (v >= 0.42) return [62, 175, 98, 150];
  if (v >= 0.28) return [128, 196, 84, 135];
  if (v >= 0.18) return [222, 196, 72, 125];
  if (v > 0.05) return [222, 150, 70, 95];
  return [120, 120, 120, 70];
}

export { derive };

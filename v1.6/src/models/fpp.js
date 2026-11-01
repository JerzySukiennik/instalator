// Instalator first-person models: gloved hands with tools and procedural animation (buildHands) and the low-poly installer avatar (buildPlayer).
import * as THREE from 'three';
import { Kit } from './devices/kit.js';
import { labelMat } from './devices/mat.js';
import { buildDevice } from './devices.js';

const TOOLS = ['none', 'drill', 'screwdriver', 'device', 'cable', 'label', 'tablet'];

const FINGERS = [
  { y: 0.026, z: -0.086, l: [0.042, 0.026, 0.021], r: 0.0106 },
  { y: 0.0085, z: -0.091, l: [0.046, 0.029, 0.022], r: 0.0109 },
  { y: -0.009, z: -0.089, l: [0.043, 0.027, 0.021], r: 0.0104 },
  { y: -0.0255, z: -0.083, l: [0.034, 0.021, 0.018], r: 0.0094 },
];

const POSES = {
  relax: { f: [[0.75, 0.8, 0.5], [0.85, 0.9, 0.55], [0.95, 0.95, 0.6], [1.05, 1.0, 0.65]], th: [0.55, 0.4] },
  grip: { f: [[1.3, 1.25, 0.8], [1.35, 1.3, 0.85], [1.35, 1.3, 0.85], [1.3, 1.25, 0.8]], th: [0.95, 0.5] },
  trigger: { f: [[0.95, 1.05, 0.6], [1.4, 1.35, 0.9], [1.4, 1.35, 0.9], [1.35, 1.3, 0.85]], th: [0.95, 0.5] },
  point: { f: [[0.08, 0.06, 0.04], [1.45, 1.35, 0.9], [1.45, 1.35, 0.9], [1.4, 1.3, 0.85]], th: [0.85, 0.65] },
  pinch: { f: [[0.75, 0.55, 0.35], [1.0, 1.0, 0.7], [1.1, 1.05, 0.75], [1.15, 1.1, 0.8]], th: [0.75, 0.45] },
  support: { f: [[0.22, 0.2, 0.12], [0.25, 0.22, 0.12], [0.3, 0.25, 0.15], [0.35, 0.3, 0.18]], th: [0.15, 0.1] },
  hold: { f: [[0.95, 0.7, 0.4], [1.0, 0.75, 0.45], [1.05, 0.8, 0.45], [1.1, 0.85, 0.5]], th: [0.55, 0.3] },
};

function finger(kit, col, tip, f, curl, side) {
  kit.push(0.002 * side, f.y, f.z, 0, curl[0] * side, 0);
  kit.sphere('rubber', col, 0, 0, 0, f.r * 1.05, { ws: 6, hs: 4 });
  kit.cyl('rubber', col, 0, 0, -f.l[0] / 2, f.r, f.l[0], { axis: 'z', seg: 6, r2: f.r * 0.95 });
  kit.push(0, 0, -f.l[0], 0, curl[1] * side, 0);
  kit.sphere('rubber', col, 0, 0, 0, f.r * 0.97, { ws: 6, hs: 4 });
  kit.cyl('rubber', col, 0, 0, -f.l[1] / 2, f.r * 0.94, f.l[1], { axis: 'z', seg: 6, r2: f.r * 0.9 });
  kit.push(0, 0, -f.l[1], 0, curl[2] * side, 0);
  kit.sphere('rubber', tip, 0, 0, 0, f.r * 0.9, { ws: 6, hs: 4 });
  kit.cyl('rubber', tip, 0, 0, -f.l[2] / 2, f.r * 0.88, f.l[2], { axis: 'z', seg: 6, r2: f.r * 0.82 });
  kit.sphere('rubber', tip, 0, 0, -f.l[2], f.r * 0.82, { ws: 6, hs: 4 });
  kit.pop(); kit.pop(); kit.pop();
}

function handMeshes(pose, side, o) {
  const P = POSES[pose] || POSES.relax;
  const kit = new Kit();
  const g = o.glove, tip = shade(o.glove, 1.35), cuff = shade(o.glove, 0.8);
  kit.box('rubber', g, 0, 0, -0.046, 0.032, 0.082, 0.092, { r: 0.012, seg: 2, axis: 'z', bevel: 0.004 });
  kit.box('rubber', shade(o.glove, 1.18), -0.0105 * side, 0.0, -0.05, 0.012, 0.07, 0.07, { r: 0.008, seg: 2, axis: 'x' });
  for (let i = 1; i < 4; i++) finger(kit, g, tip, FINGERS[i], P.f[i], side);
  kit.push(-0.012 * side, 0.028, -0.022, 0.42, (0.55 + P.th[0]) * side, 0);
  kit.sphere('rubber', g, 0, 0, 0, 0.0125, { ws: 6, hs: 4 });
  kit.cyl('rubber', g, 0, 0, -0.019, 0.0115, 0.038, { axis: 'z', seg: 6, r2: 0.0105 });
  kit.push(0, 0, -0.038, 0, P.th[1] * side, 0);
  kit.sphere('rubber', tip, 0, 0, 0, 0.0105, { ws: 6, hs: 4 });
  kit.cyl('rubber', tip, 0, 0, -0.014, 0.0102, 0.028, { axis: 'z', seg: 6, r2: 0.0092 });
  kit.sphere('rubber', tip, 0, 0, -0.028, 0.0092, { ws: 6, hs: 4 });
  kit.pop(); kit.pop();
  kit.cyl('rubber', cuff, 0, 0, 0.022, 0.035, 0.046, { axis: 'z', seg: 10, r2: 0.039 });
  kit.cyl('matte', o.skin, 0, 0, 0.05, 0.033, 0.014, { axis: 'z', seg: 10 });
  kit.push(0, -0.012, 0.055, -0.18, 0, 0);
  kit.cyl('fabric', o.sleeve, 0, 0, 0.16, 0.047, 0.3, { axis: 'z', seg: 10, r2: 0.04 });
  kit.cyl('fabric', shade(o.sleeve, 0.82), 0, 0, 0.012, 0.044, 0.024, { axis: 'z', seg: 10 });
  kit.pop();
  const body = kit.build();
  const ik = new Kit();
  finger(ik, g, tip, { ...FINGERS[0], z: 0 }, P.f[0], side);
  const index = ik.build();
  const piv = new THREE.Group();
  piv.position.set(0, 0, FINGERS[0].z);
  piv.add(index);
  return { body, index: piv };
}

function shade(hex, k) {
  const c = new THREE.Color(hex);
  const h = {};
  c.getHSL(h);
  return '#' + new THREE.Color().setHSL(h.h, h.s, Math.min(1, h.l * k)).getHexString();
}

function drill() {
  const kit = new Kit();
  const OR = '#e9762b', BK = '#1f2023', DK = '#2a2b2e';
  kit.box('satin', OR, 0, -0.004, -0.004, 0.031, 0.112, 0.036, { r: 0.012, seg: 2, axis: 'y', rx: -0.2 });
  kit.box('rubber', BK, 0, -0.008, 0.012, 0.034, 0.1, 0.024, { r: 0.011, seg: 2, axis: 'y', rx: -0.2 });
  kit.box('satin', BK, 0, -0.077, 0.006, 0.074, 0.044, 0.108, { r: 0.01, seg: 2, axis: 'y', bevel: 0.003 });
  kit.box('satin', OR, 0, -0.06, 0.006, 0.07, 0.007, 0.104, { r: 0.008, seg: 1, axis: 'y' });
  kit.box('satin', DK, 0, -0.095, -0.05, 0.03, 0.01, 0.006);
  kit.box('satin', OR, 0, 0.072, -0.018, 0.058, 0.066, 0.12, { r: 0.02, seg: 3, axis: 'z', bevel: 0.004, bevelSeg: 2 });
  kit.box('rubber', BK, 0, 0.074, 0.04, 0.06, 0.064, 0.012, { r: 0.02, seg: 3, axis: 'z' });
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) kit.box('matte', '#121314', sx * 0.0292, 0.08, 0.02 - i * 0.0075, 0.0012, 0.024, 0.0032);
  kit.box('rubber', BK, 0, 0.105, -0.01, 0.03, 0.004, 0.08, { r: 0.002, seg: 1 });
  kit.cyl('satin', DK, 0, 0.072, -0.082, 0.026, 0.016, { axis: 'z', seg: 14 });
  kit.cyl('satin', '#3a3b3f', 0, 0.072, -0.094, 0.0255, 0.008, { axis: 'z', seg: 14, face: (cx, cy) => (Math.floor((Math.atan2(cy - 0.072, cx) + Math.PI) * 3.8) % 2 ? '#f2f2ee' : null) });
  kit.box('satin', BK, 0, 0.033, -0.034, 0.011, 0.026, 0.013, { r: 0.004, seg: 1, rx: 0.25 });
  kit.box('satin', DK, 0, 0.05, -0.022, 0.034, 0.008, 0.008, { r: 0.003, seg: 1 });
  kit.led('#fff6dc', 'status', (m) => kit.box(m, null, 0, -0.07, -0.0485, 0.014, 0.006, 0.002), { intensity: 1.2 });
  const body = kit.build();
  const sk = new Kit();
  sk.cyl('rubber', '#18191b', 0, 0, -0.014, 0.0175, 0.028, { axis: 'z', seg: 12, r2: 0.0155, face: (cx, cy) => (Math.floor((Math.atan2(cy, cx) + Math.PI) * 3) % 2 ? '#2c2d30' : null) });
  sk.cyl('metal', '#b8bbbe', 0, 0, -0.033, 0.0085, 0.012, { axis: 'z', seg: 8, r2: 0.005 });
  sk.cyl('metal', '#9a9ea3', 0, 0, -0.07, 0.003, 0.064, { axis: 'z', seg: 6, face: (cx, cy, cz) => (Math.floor(-cz * 230) % 2 ? '#6f7377' : null) });
  sk.cyl('metal', '#9a9ea3', 0, 0, -0.105, 0.003, 0.007, { axis: 'z', seg: 6, r2: 0.0004 });
  const spin = sk.build();
  spin.position.set(0, 0.072, -0.098);
  body.add(spin);
  body.userData.spin = spin;
  return body;
}

function screwdriver() {
  const kit = new Kit();
  const OR = '#f07b22', BK = '#1f2023';
  const bands = (cx, cy, cz) => (cy > 0.035 && cy < 0.075 && Math.floor((Math.atan2(cz, cx) + Math.PI) * 1.9) % 2 ? BK : null);
  kit.cyl('satin', OR, 0, 0.04, 0, 0.0155, 0.1, { seg: 8, r2: 0.0125, face: bands });
  kit.sphere('satin', OR, 0, -0.01, 0, 0.0155, { ws: 8, hs: 4, thLen: Math.PI / 2, rx: Math.PI });
  kit.cyl('satin', BK, 0, 0.093, 0, 0.0115, 0.008, { seg: 8, r2: 0.0085 });
  kit.cyl('chrome', '#cfd2d6', 0, 0.15, 0, 0.0032, 0.11, { seg: 6 });
  kit.box('chrome', '#b9bdc2', 0, 0.207, 0, 0.0062, 0.008, 0.0012, { r: 0.0003, seg: 1 });
  return kit.build();
}

function cablePlug(color = '#2f7bdc') {
  const kit = new Kit();
  kit.box(new THREE.MeshStandardMaterial({ color: '#d8e4ea', roughness: 0.15, transparent: true, opacity: 0.75, flatShading: true }), null, 0, 0, -0.012, 0.0118, 0.0082, 0.022);
  kit.box('metal', '#d6b24c', 0, 0.0035, -0.016, 0.009, 0.0006, 0.01);
  kit.box('satin', color, 0, 0, 0.011, 0.0125, 0.0105, 0.026, { r: 0.004, seg: 2 });
  kit.box('satin', shade(color, 0.8), 0, 0.006, -0.006, 0.006, 0.0018, 0.012, { rx: 0.25 });
  kit.tube('satin', color, [[0, 0, 0.023], [0, -0.002, 0.07], [0.012, -0.03, 0.12], [0.04, -0.12, 0.17], [0.06, -0.3, 0.16], [0.07, -0.5, 0.12]], 0.0029, { rs: 6, segs: 22 });
  return kit.build();
}

function labelMaker() {
  const kit = new Kit();
  kit.box('satin', '#3a3d42', 0, 0, 0, 0.062, 0.03, 0.17, { r: 0.012, seg: 3, axis: 'y', bevel: 0.004 });
  kit.box('satin', '#d9dbdc', 0, 0.0152, 0.015, 0.05, 0.0012, 0.11, { r: 0.006, seg: 2, axis: 'y' });
  const keys = labelMat('labelmaker-keys', 256, 512, (ctx) => {
    ctx.clearRect(0, 0, 256, 512);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) { ctx.fillStyle = r === 7 && c > 1 && c < 4 ? '#e2632b' : '#585c62'; ctx.fillRect(14 + c * 39, 16 + r * 60, 32, 48); }
  });
  kit.quad(keys, null, 0.048, 0.104, 0, 0.0162, 0.016, { rx: -Math.PI / 2 });
  kit.box('glass', '#1e2a24', 0, 0.0158, -0.058, 0.046, 0.0012, 0.026, { r: 0.002, seg: 1, axis: 'y' });
  const lcd = labelMat('labelmaker-lcd', 256, 128, (ctx) => {
    ctx.fillStyle = '#b8c9a8'; ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#1d2a1c'; ctx.font = '700 46px Menlo, monospace'; ctx.fillText('B16 KUCH', 14, 80);
  });
  kit.quad(lcd, null, 0.04, 0.02, 0, 0.0166, -0.058, { rx: -Math.PI / 2 });
  kit.box('satin', '#f6f6f2', 0, 0.006, -0.092, 0.012, 0.0004, 0.024);
  kit.box('satin', '#e2632b', 0, 0.0, -0.086, 0.064, 0.026, 0.003, { r: 0.004, seg: 1 });
  return kit.build();
}

function fallbackBox() {
  const kit = new Kit();
  kit.box('satin', '#f1f1ef', 0, 0.03, 0, 0.09, 0.06, 0.09, { r: 0.008, seg: 2, axis: 'y' });
  return kit.build();
}

function fitObject(obj, size) {
  const holder = new THREE.Group();
  const inner = obj;
  inner.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner);
  const s = box.getSize(new THREE.Vector3());
  const k = size / Math.max(1e-4, s.x, s.y, s.z);
  const c = box.getCenter(new THREE.Vector3());
  inner.position.sub(c.multiplyScalar(k));
  inner.scale.multiplyScalar(k);
  holder.add(inner);
  return holder;
}

const HOLD = {
  none: { R: { p: [0.14, -0.2, -0.27], r: [0.28, 0.3, -1.2], pose: 'relax' } },
  drill: { R: { p: [0.12, -0.2, -0.27], r: [0.1, 0.24, -0.05], pose: 'trigger' }, tool: { p: [-0.026, 0.0, -0.062], r: [0, 0, 0] } },
  screwdriver: { R: { p: [0.125, -0.245, -0.26], r: [1.85, 0.38, 0.1], pose: 'grip' }, tool: { p: [-0.026, 0.035, -0.062], r: [Math.PI, 0, 0], s: 1.2 } },
  device: { R: { p: [0.11, -0.19, -0.28], r: [0.12, 0.34, -1.42], pose: 'support' }, tool: { p: [-0.064, 0.0, -0.06], r: [0, 0, Math.PI / 2] } },
  cable: { R: { p: [0.125, -0.18, -0.26], r: [0.25, 0.34, -0.8], pose: 'pinch' }, tool: { p: [-0.024, 0.036, -0.124], r: [0.08, -0.32, 0], s: 1.35 } },
  label: { R: { p: [0.105, -0.195, -0.27], r: [0.2, 0.34, -1.3], pose: 'hold' }, tool: { p: [-0.042, 0.0, -0.065], r: [0, 0, Math.PI / 2] } },
  tablet: { R: { p: [0.14, -0.165, -0.33], r: [0.25, -0.15, 0.15], pose: 'support' }, L: { p: [-0.14, -0.165, -0.33], r: [0.25, 0.15, -0.15], pose: 'support' } },
};

export function buildHands(o = {}) {
  const opt = { sleeve: o.sleeve || '#2f3e55', glove: o.glove || '#2b2b2b', skin: o.skin || '#e9bd98' };
  const root = new THREE.Group();
  root.name = 'fpp-hands';
  const rigR = new THREE.Group(), rigL = new THREE.Group(), tabRig = new THREE.Group();
  root.add(rigR, rigL, tabRig);
  const hand = { R: { rig: rigR, side: 1, mesh: null, index: null, pose: null }, L: { rig: rigL, side: -1, mesh: null, index: null, pose: null } };
  const st = { tool: 'none', held: null, t: 0, phase: 0, amp: 0, sway: new THREE.Vector2(), swayV: new THREE.Vector2(), equip: 1, act: 0, tabletObj: null, layer: null };

  const setPose = (h, pose) => {
    if (h.pose === pose) return;
    if (h.mesh) { h.rig.remove(h.mesh, h.index); dispose(h.mesh); dispose(h.index); }
    const m = handMeshes(pose, h.side, opt);
    h.mesh = m.body; h.index = m.index; h.pose = pose;
    h.rig.add(h.mesh, h.index);
    prep(h.rig, st.layer);
  };

  const holder = new THREE.Group();
  rigR.add(holder);

  function setTool(id, deviceObj) {
    if (!TOOLS.includes(id)) id = 'none';
    const H = HOLD[id];
    st.tool = id;
    while (holder.children.length) { const c = holder.children[0]; holder.remove(c); if (c.userData.owned) dispose(c); }
    while (tabRig.children.length) { const c = tabRig.children[0]; tabRig.remove(c); if (c.userData.owned) dispose(c); }
    st.held = null; st.tabletObj = null;
    setPose(hand.R, H.R.pose);
    if (H.L) setPose(hand.L, H.L.pose);
    rigL.visible = !!H.L;
    let obj = null, owned = true;
    if (id === 'drill') obj = drill();
    else if (id === 'screwdriver') obj = screwdriver();
    else if (id === 'cable') obj = cablePlug();
    else if (id === 'label') obj = labelMaker();
    else if (id === 'device') { obj = fitObject(deviceObj ? deviceObj : fallbackBox(), 0.105); owned = !deviceObj; }
    if (obj) {
      obj.userData.owned = owned;
      const T = H.tool;
      obj.position.set(...T.p);
      obj.rotation.set(...T.r);
      if (T.s) obj.scale.setScalar(T.s);
      holder.add(obj);
      st.held = obj;
    }
    if (id === 'tablet') {
      const tab = deviceObj || buildDevice('ipad-a16');
      tab.userData.owned = !deviceObj;
      tab.position.set(0, -0.0035, 0);
      const g = new THREE.Group();
      g.add(tab);
      g.position.set(0, -0.125, -0.365);
      g.rotation.set(-0.42, 0, 0);
      g.userData.owned = false;
      tabRig.add(g);
      st.tabletObj = tab;
      st.held = tab;
    }
    prep(root, st.layer);
    st.equip = 0;
    api.tool = id;
    api.held = st.held;
    api.tablet = st.tabletObj;
  }

  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

  function place(h, H, off) {
    if (!H) return;
    h.rig.position.set(H.p[0] + off.x * h.side, H.p[1] + off.y, H.p[2] + off.z);
    h.rig.rotation.set(H.r[0] + off.rx, H.r[1] + off.ry * h.side, H.r[2] + off.rz * h.side);
  }

  function update(dt, u = {}) {
    dt = Math.min(0.05, Math.max(0, dt || 0));
    st.t += dt;
    const moving = !!u.moving, sprint = !!u.sprint;
    st.amp += ((moving ? (sprint ? 1.7 : 1) : 0) - st.amp) * Math.min(1, dt * 6);
    st.phase += dt * (sprint ? 11.5 : 8.2) * (moving ? 1 : 0.4);
    const look = u.look || [0, 0];
    st.swayV.x += (-look[0] * 0.9 - st.sway.x) * dt * 40 - st.swayV.x * dt * 9;
    st.swayV.y += (look[1] * 0.9 - st.sway.y) * dt * 40 - st.swayV.y * dt * 9;
    st.sway.x += st.swayV.x * dt; st.sway.y += st.swayV.y * dt;
    st.sway.clampScalar(-0.06, 0.06);
    st.equip = Math.min(1, st.equip + dt / 0.38);
    const e = ease(st.equip);
    const action = u.action || null;
    st.act += ((action ? 1 : 0) - st.act) * Math.min(1, dt * 14);
    const k = u.k ?? (action ? (Math.sin(st.t * 2.2) * 0.5 + 0.5) : 0);
    const off = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
    off.x += Math.sin(st.phase) * 0.008 * st.amp + st.sway.x * 0.35;
    off.y += -Math.abs(Math.cos(st.phase)) * 0.011 * st.amp + Math.sin(st.t * 1.7) * 0.0016 + st.sway.y * 0.3 - (1 - e) * 0.32;
    off.rx += st.sway.y * 0.8 - (1 - e) * 0.6;
    off.ry += st.sway.x * 0.9;
    off.rz += Math.sin(st.phase) * 0.02 * st.amp;
    const a = st.act;
    if (action === 'drill' && st.tool === 'drill') {
      off.z -= 0.035 * k * a;
      off.x += (Math.random() - 0.5) * 0.003 * a;
      off.y += (Math.random() - 0.5) * 0.003 * a;
      if (st.held && st.held.userData.spin) st.held.userData.spin.rotation.z -= dt * 55 * a;
    } else if (action === 'screw') {
      off.z -= 0.025 * k * a;
      off.rz += Math.sin(st.t * 9) * 0.55 * a;
    } else if (action === 'press') {
      const p = Math.sin(Math.min(1, k) * Math.PI);
      off.z -= 0.075 * p * a;
      off.y += 0.02 * p * a;
    } else if (action === 'place') {
      off.z -= 0.16 * ease(k) * a;
      off.y += 0.06 * ease(k) * a;
      off.rx += 0.25 * ease(k) * a;
    } else if (action === 'flip') {
      off.z -= 0.06 * a;
      off.y += 0.025 * a;
    }
    const tool = st.tool;
    const H = HOLD[tool];
    const pressPose = (action === 'press' || action === 'flip') && (tool === 'none' || tool === 'label' || tool === 'device');
    if (pressPose && tool === 'none') setPose(hand.R, 'point');
    else if (!pressPose && hand.R.pose !== H.R.pose) setPose(hand.R, H.R.pose);
    place(hand.R, H.R, off);
    if (H.L) place(hand.L, H.L, { ...off, x: off.x });
    tabRig.position.set(off.x, off.y, off.z);
    tabRig.rotation.set(off.rx * 0.6, off.ry * 0.6, 0);
    if (hand.R.index) {
      let fl = 0;
      if (action === 'flip') fl = (Math.sin(Math.min(1, k) * Math.PI)) * 0.9 * a;
      if (action === 'press') fl = -0.1 * a;
      hand.R.index.rotation.set(fl, 0, 0);
    }
    if (st.held && action === 'drill' && tool !== 'drill' && st.held.userData.spin) st.held.userData.spin.rotation.z -= dt * 55;
  }

  function setLayer(n) { st.layer = n; prep(root, n); }

  const api = { setTool, update, setLayer, tool: 'none', held: null, tablet: null, tools: TOOLS.slice() };
  root.userData.api = api;
  setTool('none');
  st.equip = 1;
  return root;
}

function prep(obj, layer) {
  obj.traverse((m) => {
    if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; }
    if (layer != null) m.layers.set(layer);
  });
}

function dispose(obj) {
  if (!obj) return;
  obj.traverse((m) => { if (m.isMesh && m.geometry) m.geometry.dispose(); });
}

function limb(build) {
  const kit = new Kit();
  build(kit);
  return kit.build();
}

function heldItem(id) {
  if (!id) return null;
  if (id === 'drill') { const d = drill(); d.scale.setScalar(0.85); return d; }
  if (id === 'screwdriver') { const s = screwdriver(); s.rotation.x = -Math.PI / 2; s.scale.setScalar(0.9); return s; }
  if (id === 'cable') return limb((k) => { k.torus('satin', '#2f7bdc', 0, -0.02, 0.03, 0.05, 0.007, { rs: 5, ts: 16 }); k.torus('satin', '#2f7bdc', 0.008, -0.02, 0.03, 0.045, 0.007, { rs: 5, ts: 16 }); });
  if (id === 'label') { const l = labelMaker(); l.rotation.x = -1.1; l.scale.setScalar(0.85); return l; }
  if (id === 'tablet') return limb((k) => { k.box('metal', '#9fb6cf', 0, 0, 0.04, 0.24, 0.17, 0.007, { r: 0.01, seg: 2, rx: -0.4 }); k.box('glass', '#1a2a4a', 0, 0.0014, 0.0438, 0.225, 0.155, 0.001, { r: 0.008, seg: 2, rx: -0.4 }); });
  return limb((k) => { k.box('satin', '#f1f1ef', 0, -0.04, 0.03, 0.1, 0.07, 0.1, { r: 0.008, seg: 2 }); k.box('satin', '#c8a26b', 0, -0.04, 0.03, 0.104, 0.074, 0.03); });
}

export function buildPlayer(o = {}) {
  const C = o.color || '#f28c28';
  const SKIN = o.skin || '#e2b08b', SHIRT = '#4a5059', PANTS = '#2e3540', BOOT = '#4a3624', VEST = '#d6f02a', REFL = '#c7cbd0', BELT = '#6b4a2b';
  const root = new THREE.Group();
  root.name = 'player';
  const hips = new THREE.Group(); hips.position.y = 0.94; root.add(hips);
  const pelvis = limb((k) => {
    k.box('matte', PANTS, 0, -0.02, 0, 0.34, 0.16, 0.21, { r: 0.04, seg: 2 });
    k.box('satin', BELT, 0, 0.035, 0, 0.36, 0.05, 0.225, { r: 0.04, seg: 2 });
    k.box('satin', '#b9a25a', 0, 0.035, 0.113, 0.05, 0.034, 0.006);
    for (const s of [-1, 1]) {
      k.box('satin', BELT, s * 0.19, -0.03, 0.03, 0.06, 0.13, 0.12, { r: 0.012, seg: 1 });
      k.box('satin', shade(BELT, 0.8), s * 0.19, 0.03, 0.03, 0.065, 0.02, 0.125);
    }
    k.cyl('satin', '#7a5432', 0.205, 0.05, -0.0, 0.009, 0.16, { seg: 6 });
    k.box('satin', '#55585c', 0.205, 0.13, 0.0, 0.025, 0.05, 0.014);
    k.cyl('satin', '#f07b22', -0.19, 0.06, 0.06, 0.008, 0.07, { seg: 6 });
    k.cyl('satin', '#cfd2d6', -0.19, 0.11, 0.06, 0.0025, 0.04, { seg: 5 });
  });
  hips.add(pelvis);
  const spine = new THREE.Group(); spine.position.y = 0.06; hips.add(spine);
  const torso = limb((k) => {
    k.box('matte', SHIRT, 0, 0.24, 0, 0.36, 0.46, 0.22, { r: 0.06, seg: 2 });
    k.box('matte', VEST, 0, 0.21, 0, 0.385, 0.38, 0.235, { r: 0.065, seg: 2 });
    for (const y of [0.1, 0.2]) k.box('satin', REFL, 0, y, 0, 0.392, 0.03, 0.242, { r: 0.068, seg: 2 });
    for (const s of [-1, 1]) {
      k.box('matte', VEST, s * 0.09, 0.43, 0, 0.07, 0.09, 0.235, { r: 0.03, seg: 1 });
      k.box('satin', REFL, s * 0.09, 0.32, 0.119, 0.026, 0.2, 0.004);
      k.box('satin', REFL, s * 0.09, 0.32, -0.119, 0.026, 0.2, 0.004);
    }
    k.box('matte', shade(VEST, 0.85), 0, 0.21, 0.118, 0.012, 0.36, 0.002);
    k.box('satin', '#2a2b2e', 0.11, 0.3, 0.12, 0.06, 0.07, 0.006);
    k.cyl('matte', SKIN, 0, 0.5, 0, 0.055, 0.08, { seg: 8 });
  });
  spine.add(torso);
  const neck = new THREE.Group(); neck.position.y = 0.53; spine.add(neck);
  const head = limb((k) => {
    k.box('matte', SKIN, 0, 0.105, 0.005, 0.17, 0.21, 0.19, { r: 0.05, seg: 2 });
    k.box('matte', shade(SKIN, 0.9), 0, 0.09, 0.1, 0.03, 0.045, 0.02, { r: 0.006, seg: 1 });
    for (const s of [-1, 1]) {
      k.box('matte', '#1d1f22', s * 0.04, 0.125, 0.1, 0.022, 0.014, 0.004);
      k.box('matte', '#3b2b20', s * 0.04, 0.148, 0.098, 0.034, 0.008, 0.006);
      k.box('matte', shade(SKIN, 0.92), s * 0.088, 0.11, 0.0, 0.016, 0.04, 0.03, { r: 0.006, seg: 1 });
    }
    k.box('matte', '#8a4f3e', 0, 0.052, 0.098, 0.05, 0.008, 0.005);
    k.sphere('satin', C, 0, 0.17, 0, 0.118, { ws: 14, hs: 8, thLen: Math.PI / 2 });
    k.cyl('satin', C, 0, 0.17, 0.0, 0.123, 0.016, { seg: 14 });
    k.box('satin', C, 0, 0.172, 0.12, 0.17, 0.012, 0.07, { r: 0.02, seg: 2, axis: 'y' });
    k.box('satin', shade(C, 0.85), 0, 0.27, 0, 0.03, 0.03, 0.2, { r: 0.012, seg: 1 });
  });
  neck.add(head);
  const mkArm = (s) => {
    const sh = new THREE.Group(); sh.position.set(s * 0.215, 0.44, 0); spine.add(sh);
    sh.add(limb((k) => {
      k.sphere('matte', SHIRT, 0, 0, 0, 0.062, { ws: 8, hs: 6 });
      k.cyl('matte', SHIRT, 0, -0.15, 0, 0.052, 0.3, { seg: 8, r2: 0.058 });
    }));
    const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
    el.add(limb((k) => {
      k.cyl('matte', SHIRT, 0, -0.13, 0, 0.044, 0.26, { seg: 8, r2: 0.05 });
      k.box('matte', '#2b2b2b', 0, -0.3, 0.005, 0.07, 0.1, 0.045, { r: 0.018, seg: 2 });
      k.box('matte', '#2b2b2b', s * -0.03, -0.29, 0.03, 0.025, 0.05, 0.025, { r: 0.01, seg: 1, rz: s * 0.3 });
    }));
    const grip = new THREE.Group(); grip.position.set(0, -0.31, 0.03); el.add(grip);
    return { sh, el, grip };
  };
  const armR = mkArm(1), armL = mkArm(-1);
  const mkLeg = (s) => {
    const hp = new THREE.Group(); hp.position.set(s * 0.095, -0.03, 0); hips.add(hp);
    hp.add(limb((k) => {
      k.cyl('matte', PANTS, 0, -0.22, 0, 0.068, 0.44, { seg: 8, r2: 0.078 });
      k.box('matte', shade(PANTS, 0.85), s * 0.07, -0.2, 0.0, 0.03, 0.14, 0.1, { r: 0.012, seg: 1 });
    }));
    const kn = new THREE.Group(); kn.position.y = -0.44; hp.add(kn);
    kn.add(limb((k) => {
      k.cyl('matte', PANTS, 0, -0.2, 0, 0.056, 0.4, { seg: 8, r2: 0.066 });
      k.box('matte', '#1e1f22', 0, -0.03, 0.06, 0.1, 0.12, 0.04, { r: 0.015, seg: 2 });
      k.box('satin', '#f07b22', 0, -0.03, 0.081, 0.06, 0.012, 0.003);
      k.box('satin', BOOT, 0, -0.44, 0.035, 0.11, 0.11, 0.27, { r: 0.03, seg: 2, axis: 'x' });
      k.box('matte', '#141414', 0, -0.488, 0.035, 0.116, 0.024, 0.28, { r: 0.012, seg: 1 });
      k.box('satin', shade(BOOT, 0.8), 0, -0.4, -0.02, 0.112, 0.06, 0.12, { r: 0.02, seg: 1 });
    }));
    return { hp, kn };
  };
  const legR = mkLeg(1), legL = mkLeg(-1);
  let tag = null;
  if (o.name) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
    const g = cv.getContext('2d');
    g.fillStyle = 'rgba(20,24,30,0.72)'; g.beginPath(); g.roundRect(4, 8, 248, 48, 22); g.fill();
    g.fillStyle = C; g.beginPath(); g.arc(30, 32, 10, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.font = '600 28px "SF Pro Text", Helvetica, Arial'; g.textBaseline = 'middle'; g.fillText(String(o.name).slice(0, 14), 50, 33);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
    tag.scale.set(0.5, 0.125, 1);
    tag.position.set(0, 2.08, 0);
    root.add(tag);
  }
  root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  const st = { phase: 0, amp: 0, holding: undefined, item: null, pitch: 0 };
  function setHolding(id) {
    if (st.holding === id) return;
    st.holding = id;
    if (st.item) { armR.grip.remove(st.item); dispose(st.item); st.item = null; }
    const it = heldItem(id);
    if (it) { st.item = it; armR.grip.add(it); it.traverse((m) => { if (m.isMesh) m.castShadow = true; }); }
  }
  function update(dt, u = {}) {
    dt = Math.min(0.05, Math.max(0, dt || 0));
    const speed = Math.max(0, u.speed || 0);
    st.amp += (Math.min(1.3, speed / 1.4) - st.amp) * Math.min(1, dt * 6);
    st.phase += dt * (2.2 + speed * 2.4) * (speed > 0.05 ? 1 : 0);
    const a = st.amp, p = st.phase;
    setHolding(u.holding || null);
    const sw = Math.sin(p);
    legR.hp.rotation.x = sw * 0.42 * a;
    legL.hp.rotation.x = -sw * 0.42 * a;
    legR.kn.rotation.x = Math.max(0, Math.sin(p - 1.3)) * 0.62 * a + 0.04;
    legL.kn.rotation.x = Math.max(0, Math.sin(p + Math.PI - 1.3)) * 0.62 * a + 0.04;
    hips.position.y = 0.94 + Math.abs(Math.cos(p)) * 0.035 * a - 0.02 * a;
    spine.rotation.y = sw * 0.08 * a;
    spine.rotation.x = 0.06 * a;
    armL.sh.rotation.x = -sw * 0.45 * a;
    armL.el.rotation.x = -0.25 - 0.25 * a;
    if (st.holding) { armR.sh.rotation.x = -0.65 + sw * 0.05 * a; armR.el.rotation.x = -0.75; armR.sh.rotation.z = 0.08; }
    else { armR.sh.rotation.x = sw * 0.45 * a; armR.el.rotation.x = -0.25 - 0.25 * a; armR.sh.rotation.z = 0; }
    armL.sh.rotation.z = -0.06; armR.sh.rotation.z += 0.06;
    st.pitch += ((u.pitch || 0) - st.pitch) * Math.min(1, dt * 10);
    neck.rotation.x = -Math.max(-0.7, Math.min(0.7, st.pitch));
  }
  function setColor(c) {
    head.traverse((m) => { if (m.isMesh && m.material.name === 'dev-satin') { const col = new THREE.Color(c), arr = m.geometry.attributes.color.array; for (let i = 0; i < arr.length; i += 3) { arr[i] = col.r; arr[i + 1] = col.g; arr[i + 2] = col.b; } m.geometry.attributes.color.needsUpdate = true; } });
  }
  root.userData.api = { update, setHolding, setColor, tag };
  update(0, {});
  return root;
}

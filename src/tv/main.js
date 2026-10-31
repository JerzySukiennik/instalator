// Instalator: TV app — owns the game state, runs the 3D house, the director camera, the HUD and the network host.

import * as THREE from "three";
import { Renderer } from "./renderer.js";
import { House } from "./house.js";
import { Director } from "./director.js";
import { Hud } from "./hud.js";
import { Audio } from "./audio.js";
import { createHost } from "../net/index.js";
import { newState, reduce, startJob, tasksFor, snapshotFor, activeCid, advanceTurn } from "../shared/game.js";
import { derive } from "../shared/sim.js";
import { BY_ID, fmtZl } from "../shared/catalog.js";
import { PROTO, netMode } from "../shared/protocol.js";
import { renderDash } from "../dash/render.js";
import { buildClient, Walker } from "./client.js";

const q = new URLSearchParams(location.search);
const canvas = document.getElementById("tv");
const R = new Renderer(canvas);
const house = new House(R);
const dir = new Director(R);
const hud = new Hud(document.getElementById("ui"));
const audio = new Audio();
const state = newState();
let data = null;
let tasks = [];
let host = null;
let url = "";
let pending = 0;
let tabletTex = null;
let tabletCanvas = null;
let script = null;
const ghosts = new Map();
let walker = null;
let peeking = false, peekTimer = 0;
let online = false;
const pings = [];

window.addEventListener("pointerdown", () => audio.unlock(), { once: false });
let drag = null;
canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag = { x: e.clientX, y: e.clientY };
  if (dir.mode !== "orbit") return;
  dir.orbit.az -= dx * 0.006;
  dir.orbit.height = Math.max(2, Math.min(dir.orbit.radius * 1.6, dir.orbit.height + dy * 0.03));
});
canvas.addEventListener("pointerup", () => { drag = null; });
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  if (dir.mode !== "orbit") return;
  const k = Math.exp(e.deltaY * 0.0012);
  dir.orbit.radius = Math.max(3, Math.min(80, dir.orbit.radius * k));
  dir.orbit.height = Math.max(2, Math.min(80, dir.orbit.height * k));
}, { passive: false });
window.addEventListener("keydown", () => audio.unlock());

function padUrl(code) {
  const base = `${location.origin}${location.pathname.replace(/index\.html$/, "")}`;
  const extra = netMode() === "local" ? "&net=local" : q.get("realm") ? `&realm=${q.get("realm")}` : "";
  return `${base}?role=pad&room=${code}${extra}`;
}

function sendState() {
  if (pending) return;
  pending = setTimeout(() => {
    pending = 0;
    const snap = snapshotFor(state, data);
    snap.tasks = tasks;
    snap.active = activeCid(state);
    host.broadcast({ t: "state", s: snap });
    refresh(snap);
  }, 30);
}

let lastSnap = null;
function refresh(snap) {
  lastSnap = snap;
  if (state.phase === "lobby") { hud.show("lobby"); hud.lobby(state, host.code, url); return; }
  if (state.phase === "board") { hud.show("board"); hud.board(state, { kawalerka: "assets/thumbs/b-kawalerka.jpg", dom: "assets/thumbs/b-dom.jpg", gzowo: "assets/thumbs/b-gzowo.jpg", willa: "assets/thumbs/b-willa.jpg" }); return; }
  if (state.phase === "job") {
    hud.show("hud");
    const newly = hud.job(snap, host.code, url, tasks);
    newly.forEach((r, i) => { const rq = state.job.reqs.find((x) => x.id === r.id); setTimeout(() => { audio.play("pen_tick", { vol: 0.9 }); if (rq && state.phase === "job") hud.achieve(rq.text); }, i * 900); });
    house.sync(state, snap.der ? { ...snap.der } : derive(state, data));
    paintTablet(snap);
    return;
  }
  if (state.phase === "handover") { hud.show("handover"); house.sync(state, snap.der); paintTablet(snap); return; }
  if (state.phase === "review") { hud.show("hud handover"); hud.review(state); house.sync(state, snap.der); return; }
  if (state.phase === "play") { hud.show("hud"); hud.clearHandover(); hud.job(snap, host.code, url, tasks); house.sync(state, snap.der); paintTablet(snap); }
}

const camRT = new THREE.WebGLRenderTarget(384, 216, { type: THREE.FloatType });
const camCam = new THREE.PerspectiveCamera(72, 16 / 9, 0.05, 250);
const camImgs = {};
let camAt = 0;
window.__camImages = camImgs;
window.__shootCams = () => shootCams(true);

function shootCams(force = false) {
  if (!data || (!force && performance.now() - camAt < 2500)) return;
  camAt = performance.now();
  const W = 384, H = 216;
  const buf = new Float32Array(W * H * 4);
  for (const card of state.tablet.dash?.cards || []) {
    if (card.kind !== "camera" || !card.dev) continue;
    const d = state.devs.find((x) => x.uid === card.dev);
    if (!d || !d.pos) continue;
    const aim = d.aim || [0, 0, 1];
    const p = new THREE.Vector3(...d.pos);
    const a = new THREE.Vector3(aim[0], 0, aim[2]).normalize();
    camCam.position.copy(p).addScaledVector(a, 0.25).add(new THREE.Vector3(0, -0.12, 0));
    camCam.lookAt(p.clone().addScaledVector(a, 7).add(new THREE.Vector3(0, -1.8, 0)));
    camCam.updateMatrixWorld();
    R.renderer.setRenderTarget(camRT);
    R.renderer.render(R.scene, camCam);
    R.renderer.setRenderTarget(null);
    R.renderer.readRenderTargetPixels(camRT, 0, 0, W, H, buf);
    const cv = camImgs[d.uid] || document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    const im = g.createImageData(W, H);
    const exp = R.renderer.toneMappingExposure * 1.25;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = ((H - 1 - y) * W + x) * 4, o = (y * W + x) * 4;
      for (let k = 0; k < 3; k++) { let c = buf[i + k] * exp; c = c / (1 + c); im.data[o + k] = Math.min(255, Math.pow(c, 1 / 2.2) * 300); }
      im.data[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    camImgs[d.uid] = cv;
  }
}

function paintTablet(snap) {
  const obj = house.tabletObj;
  if (!obj || !state.tablet.platform) return;
  const disp = obj.userData.display;
  if (!tabletCanvas) { tabletCanvas = document.createElement("canvas"); tabletCanvas.width = 1180; tabletCanvas.height = 820; }
  shootCams();
  renderDash(tabletCanvas.getContext("2d"), tabletCanvas.width, tabletCanvas.height, snap, data, { camImages: camImgs });
  if (!tabletTex) { tabletTex = new THREE.CanvasTexture(tabletCanvas); tabletTex.colorSpace = THREE.SRGBColorSpace; tabletTex.anisotropy = 4; }
  tabletTex.needsUpdate = true;
  if (disp && disp.mesh) {
    if (disp.mesh.material.map !== tabletTex) {
      disp.mesh.material = new THREE.MeshBasicMaterial({ map: tabletTex, toneMapped: false });
    }
  }
}

function focusTask(id) {
  house.setDoors(id === "panel" || id === "rack");
  house.showWifi(false);
  house.showCones(false);
  house.setXray(false);
  if (!data) return;
  if (!id) { dir.overview(data, { floor: house.floorShown < 9 ? house.floorShown : 0, speed: 0 }); return; }
  if (id === "panel" || id === "rack") {
    const f = house.focusPoint(id);
    if (f) { house.setFloor(f.floor); dir.closeup(f.pos.clone().add(new THREE.Vector3(0, id === "rack" ? 0.1 : 0, 0)), f.normal, id === "rack" ? 1.55 : 1.15, 0.12); }
    if (id === "rack") house.setXray(true);
    return;
  }
  if (id === "wifi") { house.showWifi(true); dir.overview(data, { floor: 0, zoom: 1.15, speed: 0 }); house.setFloor(data.floors.length > 1 ? 0 : 0); return; }
  if (id === "outdoor") { house.setFloor(99); house.showCones(true); dir.overview(data, { zoom: 1.7, speed: 0 }); return; }
  if (id === "tablet") {
    const spot = (data.tabletSpots || []).find((s) => s.id === state.tablet.spot);
    if (spot) { const qn = new THREE.Quaternion(...spot.quat); dir.closeup(new THREE.Vector3(...spot.pos), new THREE.Vector3(0, 0, 1).applyQuaternion(qn), 1.1, 0.05, 30); house.setFloor(spot.floor ?? 0); }
    else dir.overview(data, { floor: 0 });
    return;
  }
  if (id.startsWith("room:")) {
    const room = data.rooms.find((r) => r.id === id.slice(5));
    if (room) { house.setFloor(room.floor); dir.room(data, room); house.showCones(true); }
  }
}

function fx(e) {
  const p = e.cid ? state.players.find((x) => x.cid === e.cid) : null;
  switch (e.fx) {
    case "join": hud.toast("plus", `<b>${p?.name || "Gracz"}</b> dołącza`); audio.play("ui_pop"); break;
    case "deal": audio.play("box_open", { vol: 0.6 }); break;
    case "vote": audio.play("ui_tap", { vol: 0.6 }); break;
    case "pick": hud.pickJob(e.i); audio.play("stamp"); setTimeout(() => beginJob(e.job), 1500); break;
    case "task": {
      const t = tasks.find((x) => x.id === e.id);
      if (t) hud.banner(t.name);
      if (e.id === "handover") break;
      focusTask(e.id);
      audio.play("ui_confirm", { vol: 0.5 });
      break;
    }
    case "turn": { const n = state.players.find((x) => x.cid === e.cid); if (n) hud.banner(`Tura: ${n.name}`); focusTask(null); audio.play("ui_pop"); break; }
    case "buy": hud.toast("cart", `${BY_ID[e.id]?.name}${e.n > 1 ? ` ×${e.n}` : ""} · <b>−${fmtZl(e.price)}</b>`); audio.play("payment", { vol: 0.35 }); break;
    case "refund": hud.toast("undo", `Zwrot: ${BY_ID[e.id]?.name}`); break;
    case "install": {
      const st = e.style || "tap";
      const snd = { screw: "bulb_screw", drill: "drill_short", peel: "peel_sticker", strip: "peel_sticker", tap: "ui_pop", rotate: "screwdriver" }[st] || "ui_pop";
      audio.play(snd);
      const d = state.devs.find((x) => x.uid === e.uid);
      if (d && d.pos && state.turn.task && !["panel", "rack"].includes(state.turn.task)) {
        const fl = data.floors[d.floor ?? 0];
        if (d.place === "mount" && !String(state.turn.task).startsWith("room:")) dir.look(new THREE.Vector3(d.pos[0] + 2.4, (fl?.y || 0) + 3.2, d.pos[2] + 3.2), new THREE.Vector3(...d.pos), 34, 0.05);
      }
      break;
    }
    case "cable": setTimeout(() => house.animateRun(e.uid), 400); hud.toast("net", `Kabel w ścianie · ${e.len} m · <b>−${fmtZl(e.cost)}</b>`); audio.play("cable_zip", { vol: 0.6, delay: 0.5 }); break;
    case "rack": case "shelf": audio.play("rack_screw"); break;
    case "patch": {
      audio.play("rj45_in");
      if (state.phase === "job" && state.turn.task !== "rack") {
        clearTimeout(peekTimer);
        if (!peeking) focusTask("rack");
        peeking = true;
        peekTimer = setTimeout(() => { peeking = false; focusTask(state.turn.task); }, 2600);
      }
      break;
    }
    case "unpatch": audio.play("rj45_out"); break;
    case "adopt": audio.play("ui_confirm"); break;
    case "breaker": audio.play(e.key === "main" ? "main_switch" : e.on ? "breaker_on" : "breaker_off"); break;
    case "spark": audio.play("spark"); hud.toast("bolt", "Iskra! Najpierw wyłącz zasilanie główne.", "err"); break;
    case "din": audio.play("din_snap"); break;
    case "wire": audio.play("screwdriver", { vol: 0.7 }); break;
    case "label": audio.play("pen_tick", { vol: 0.5 }); break;
    case "tabletSpot": audio.play(e.kind === "wall" ? "drill_short" : "ui_pop"); focusTask("tablet"); break;
    case "tabletMount": audio.play("magnet_snap"); hud.toast("tablet", e.mount === "wall" ? "Tablet wisi na ścianie" : "Tablet stoi na stojaku"); break;
    case "platform": hud.toast("tablet", `System: <b>${{ ha: "Home Assistant", apple: "Dom Apple", google: "Google Home" }[e.p]}</b>`); break;
    case "pair": audio.play("ui_confirm", { vol: 0.6 }); break;
    case "dash": audio.play("ui_tap", { vol: 0.4 }); break;
    case "react": if (p) { hud.react(p, e.e); audio.play("ui_pop", { vol: 0.35 }); } break;
    case "ping": if (p) addPing(e, p.color); break;
    case "handover": runHandover(); break;
    case "play": hud.clearHandover(); hud.banner("Pobawcie się domem: stukajcie w kafelki na telefonach"); if (walker) { R.scene.remove(walker.obj); walker = null; } R.setMode("night"); dir.overview(data, { floor: 0, speed: 0.04 }); break;
    case "control": audio.play("relay_click", { vol: 0.5 }); break;
    default: break;
  }
}

function addPing(e, color) {
  const fl = data?.floors[e.floor ?? 0] || { y: 0 };
  const m = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.42, 32), new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(e.x, fl.y + 0.06, e.z);
  m.renderOrder = 20;
  R.scene.add(m);
  pings.push({ m, t: 0 });
  audio.play("ui_pop", { vol: 0.5 });
}

async function beginJob(job) {
  hud.show("hud");
  const b = await house.load(job.building);
  data = b.data;
  startJob(state, job, data);
  tasks = tasksFor(job, data);
  R.setMode("afternoon", true);
  house.setFloor(0);
  dir.overview(data, { floor: 0, zoom: 1.6, az: 2.3, speed: 0 });
  dir.snap();
  dir.overview(data, { floor: 0, speed: 0, az: 0.75 });
  host.broadcast({ t: "building", data });
  sendState();
  hud.banner("Prąd jest wyłączony. Zacznijcie od rozdzielnicy.");
  setTimeout(() => hud.bubble(job.client, job.client.hello), 600);
  setTimeout(() => hud.clearHandover(), 6500);
  audio.stopAllLoops();
  audio.loop(job.building === "gzowo" ? "amb_river" : job.building === "kawalerka" ? "amb_city" : "amb_birds", 0.22);
}

function clientPath() {
  const e = data.entrance;
  if (!e) return null;
  const E = new THREE.Vector3(...e.pos);
  let n = new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion(...(e.quat || [0, 0, 0, 1])));
  if (data.street) { const t = new THREE.Vector3(...data.street.pos).sub(E).setY(0); if (t.lengthSq() > 1) n = t.normalize(); }
  n.y = 0; n.normalize();
  const fy = data.floors[0]?.y || 0;
  const outside = E.clone().addScaledVector(n, 1.3).setY(fy);
  const start = data.street ? new THREE.Vector3(...data.street.pos).setY(fy) : E.clone().addScaledVector(n, 9).setY(fy);
  const inside = E.clone().addScaledVector(n, -1.4).setY(fy);
  const spot = (data.tabletSpots || []).find((s) => s.id === state.tablet.spot);
  let end = inside.clone().addScaledVector(n, -1.2);
  if (spot && (spot.floor ?? 0) === 0) {
    const sn = new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion(...spot.quat));
    end = new THREE.Vector3(...spot.pos).addScaledVector(sn.setY(0).normalize(), 0.75).setY(fy);
  }
  return { start, outside, door: E.clone().setY(fy), inside, end, n };
}

async function runHandover() {
  const j = state.job;
  const res = state.review.res;
  R.setMode("dusk");
  hud.show("handover");
  const steps = [];
  const P = clientPath();
  if (walker) { R.scene.remove(walker.obj); walker = null; }
  if (P) {
    const fig = buildClient(j.client.look);
    fig.position.copy(P.start);
    R.scene.add(fig);
    walker = new Walker(fig);
  }
  const follow = (k = 1) => { if (!walker) return; dir.track(walker.obj, P.n.clone().multiplyScalar(4.4 * k).add(new THREE.Vector3(P.n.z * 2.6, 3.0, -P.n.x * 2.6))); };
  steps.push({ dur: 3.6, run: () => { audio.play("car_arrive"); if (P) { walker.go([P.outside.toArray()]); house.setFloor(0); } follow(); hud.bubble(j.client, "Dzień dobry! To co, pokażecie, co tu się teraz dzieje?"); } });
  steps.push({ dur: 2.4, run: () => { audio.play("doorbell_chime"); follow(0.8); } });
  steps.push({ dur: 3.2, run: () => {
    const lock = state.devs.some((d) => BY_ID[d.id]?.caps.includes("lock") && d.paired);
    hud.bubble(j.client, lock ? "O, drzwi same się otworzyły z telefonu!" : "Wchodzę!");
    audio.play("house_door_open");
    if (house.b?.setDoorOpen) try { house.b.setDoorOpen("entrance", 1); } catch (e) {}
    if (P) walker.go([P.door.toArray(), P.inside.toArray(), P.end.toArray()]);
    follow(0.7);
  } });
  steps.push({ dur: 2.8, run: () => { audio.play("footsteps_wood", { vol: 0.8 }); if (walker) dir.track(walker.obj, new THREE.Vector3(2.4, 2.6, 2.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(P.n.x, P.n.z))); } });
  for (const r of j.reqs) {
    const st = res.find((x) => x.id === r.id);
    steps.push({ dur: 2.3, run: () => {
      focusForReq(r);
      hud.bubble(j.client, `${r.text}… ${st?.ok ? "jest!" : "hmm, tego nie widzę."}`);
      audio.play(st?.ok ? "pen_tick" : "ui_error", { vol: 0.8 });
      if (r.type === "wifi" || r.type === "wifizone") house.showWifi(true); else house.showWifi(false);
    } });
  }
  steps.push({ dur: 0.1, run: () => { house.showWifi(false); dir.overview(data, { floor: 0, speed: 0.025 }); hud.bubble(j.client, ""); state.phase = "review"; hud.review(state); audio.play("stamp"); audio.play("payment", { delay: 0.6 }); savePortfolio(); sendState(); } });
  script = { steps, i: -1, t: 0 };
}

function focusForReq(r) {
  const z = (k) => (data.zones || []).find((x) => x.kind === k);
  if (["cam", "wifizone"].includes(r.type) && z(r.zone)) { const p = new THREE.Vector3(...z(r.zone).pos); dir.look(p.clone().add(new THREE.Vector3(5, 5, 6)), p, 40); house.showCones(true); return; }
  if (["power", "labels", "energy", "blinds"].includes(r.type)) { focusTask("panel"); return; }
  if (["nvr", "ups"].includes(r.type)) { focusTask("rack"); return; }
  if (["tablet", "dash"].includes(r.type)) { focusTask("tablet"); return; }
  const kind = r.kind && r.kind !== "all" ? r.kind : { leak: "bath", tv: "living", kitchen: "kitchen", soundbar: "living", vacuum: "living" }[r.type];
  const room = kind ? data.rooms.find((x) => x.kind === kind) : null;
  if (room) { house.setFloor(room.floor); dir.room(data, room); return; }
  dir.overview(data, { floor: 0 });
}

function savePortfolio() {
  try {
    const key = "instalator.portfolio.v1";
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    R.render(0);
    const shot = canvas.toDataURL("image/jpeg", 0.6);
    list.unshift({ at: Date.now(), building: state.job.buildingName, client: state.job.client.name, stars: state.review.stars, shot });
    localStorage.setItem(key, JSON.stringify(list.slice(0, 12)));
  } catch (e) {}
}

function onMsg(cid, msg) {
  if (!msg) return;
  if (msg.t === "act") {
    if (msg.a === "hello" && msg.proto !== PROTO) { host.send(cid, { t: "nope", text: "Odśwież stronę na telefonie (nowa wersja gry)." }); return; }
    const events = reduce(state, cid, msg, data);
    for (const e of events) {
      if (e.to) { if (e.nope) host.send(e.to, { t: "nope", text: e.nope }); continue; }
      fx(e);
      host.broadcast({ t: "fx", e });
    }
    if (msg.a === "hello") {
      const p = state.players.find((x) => x.cid === cid);
      host.send(cid, { t: "welcome", you: { cid, name: p?.name, color: p?.color, host: p?.host }, code: host.code });
      if (data && state.phase !== "lobby" && state.phase !== "board") host.send(cid, { t: "building", data });
    }
    sendState();
  }
}

function onStream(cid, m) {
  if (!m || !data) return;
  if (m.t === "ghost") {
    let g = ghosts.get(cid);
    if (!m.id) { if (g) { R.scene.remove(g.obj); ghosts.delete(cid); house.showWifi(state.turn.task === "wifi"); } return; }
    if (!g || g.id !== m.id) {
      if (g) R.scene.remove(g.obj);
      const obj = house.model(m.id, {});
      obj.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.6; o.material.depthWrite = false; } });
      R.scene.add(obj);
      g = { id: m.id, obj };
      ghosts.set(cid, g);
    }
    g.obj.position.set(...m.pos);
    if (m.quat) g.obj.quaternion.set(...m.quat);
    if (BY_ID[m.id]?.caps.includes("ap")) {
      const der = derive(state, data);
      house.showWifi(true, der.aps.concat([{ x: m.pos[0], z: m.pos[2], floor: m.floor ?? 0, r: BY_ID[m.id].wifi.r }]));
    }
  }
  if (m.t === "floor") house.setFloor(m.floor);
}

async function lobbyScene() {
  R.setMode("dusk", true);
  await house.load("gzowo");
  const d = house.data;
  try {
    const { makeJob, rng } = await import("../shared/jobs.js");
    const { runDemo } = await import("./demo.js");
    const show = newState();
    const job = makeJob("gzowo", rng(11));
    job.platform = "ha";
    startJob(show, job, d);
    runDemo(show, d, reduce, { stage: "full", platform: "ha" });
    house.sync(show, derive(show, d));
  } catch (e) {
    console.warn("[lobby] showcase failed", e);
    const fake = { panel: { main: true, rcd: [true, true], br: Object.fromEntries((d.circuits || []).map((c) => [c.id, true])), labels: {} }, devs: [], patches: [] };
    house.state = fake;
    house.der = { dev: {} };
    house.applyPower();
  }
  data = null;
  dir.overview(d, { floor: 0, zoom: 1.45, speed: 0.045 });
  dir.snap();
}

async function demo(building, view) {
  const { rollJobs } = await import("../shared/jobs.js");
  const { runDemo } = await import("./demo.js");
  state.phase = "board";
  state.board.jobs = rollJobs(Number(q.get("seed")) || 7);
  const job = state.board.jobs.find((j) => j.building === building) || state.board.jobs[1];
  await beginJob(job);
  hud.clearHandover();
  if (q.get("stage") !== "empty") runDemo(state, data, reduce, { stage: q.get("stage") || "full", platform: q.get("platform") || null });
  state.players.forEach((p) => { if (p.cid === "demo") { p.online = false; p.host = false; } });
  if (q.get("platform") && state.job.platform === "any") state.tablet.platform = q.get("platform");
  sendState();
  await new Promise((r) => setTimeout(r, 120));
  if (view === "night" || view === "dusk") { R.setMode(view, true); dir.overview(data, { floor: 0, speed: 0.02 }); }
  else if (view === "handover") { reduce(state, "demo", { a: "handover" }, data); runHandover(); }
  else if (view === "review") { reduce(state, "demo", { a: "handover" }, data); state.phase = "review"; R.setMode("dusk", true); dir.overview(data, { floor: 0 }); hud.review(state); }
  else if (view.startsWith("kind:")) { const r = data.rooms.find((x) => x.kind === view.slice(5)); if (r) { state.turn.task = `room:${r.id}`; focusTask(`room:${r.id}`); } }
  else if (view !== "overview") { state.turn.task = view; focusTask(view); }
  if (q.get("az")) dir.orbit.az = Number(q.get("az"));
  dir.orbit.speed = 0;
  dir.snap();
  sendState();
  if (q.get("hud") === "0") document.getElementById("ui").style.display = "none";
  setTimeout(() => { window.__demoReady = true; }, 900);
}

function addDesk() {
  if (document.getElementById("desk")) return;
  document.body.classList.add("desk");
  const box = document.createElement("div");
  box.id = "desk";
  const base = padUrl(host.localCode || host.code).replace("&net=local", "");
  box.innerHTML = `<div class="dk"><span>Twoje narzędzia</span><button id="deskx">schowaj</button></div><iframe allow="autoplay" src="${base}&net=local&desk=1"></iframe>`;
  document.body.appendChild(box);
  document.getElementById("deskx").onclick = () => { box.remove(); document.body.classList.remove("desk"); refresh(lastSnap || snapshotFor(state, data)); R.resize(); };
  audio.unlock();
  document.getElementById("snd")?.remove();
  setTimeout(() => R.resize(), 50);
  refresh(lastSnap || snapshotFor(state, data));
}

document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".deskbtn")) addDesk(); });

function addEmulators(n) {
  const box = document.createElement("div");
  box.id = "emu";
  for (let i = 0; i < n; i++) {
    const f = document.createElement("iframe");
    f.src = `${padUrl(host.localCode || host.code).replace("&net=local", "")}&net=local&name=${encodeURIComponent(["Tata", "Jurek", "Ryś", "Mama"][i])}&emu=1`;
    box.appendChild(f);
  }
  document.body.appendChild(box);
}

let last = performance.now();
let fpsAcc = 0, fpsN = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (script) {
    script.t -= dt;
    if (script.t <= 0) {
      script.i++;
      const st = script.steps[script.i];
      if (!st) script = null; else { st.run(); script.t = st.dur; }
    }
  }
  if (lastSnap && data && (state.phase === "play" || state.turn.task === "tablet") && performance.now() - camAt > 2500) paintTablet(lastSnap);
  if (walker) walker.update(dt);
  dir.update(dt);
  house.closeFill = dir.cutMode === "close";
  house.update(dt, dir.tgt, R.camera);
  house.cutaway(R.camera.position, dir.tgt, dir.cutMode);
  for (let i = pings.length - 1; i >= 0; i--) {
    const p = pings[i];
    p.t += dt;
    const k = (p.t % 1);
    p.m.scale.setScalar(1 + k * 1.2);
    p.m.material.opacity = (1 - k) * (p.t < 3.5 ? 1 : 1 - (p.t - 3.5) * 2);
    if (p.t > 4) { R.scene.remove(p.m); pings.splice(i, 1); }
  }
  R.render(dt);
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 1) { window.__fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
  requestAnimationFrame(loop);
}

function soundHint() {
  if (document.getElementById("snd")) return;
  const b = document.createElement("button");
  b.id = "snd";
  b.className = "tape y";
  b.textContent = "🔈 Kliknij tutaj, żeby był dźwięk";
  b.style.cssText = "position:fixed;left:50%;bottom:1.2rem;transform:translateX(-50%);z-index:9;border:0;cursor:pointer;font-size:0.8rem";
  b.onclick = () => { audio.unlock(); b.remove(); };
  document.body.appendChild(b);
  window.addEventListener("pointerdown", () => b.remove(), { once: true });
}

async function boot() {
  host = await createHost({
    onConnect: () => {},
    onLeave: (cid) => {
      const p = state.players.find((x) => x.cid === cid);
      if (p) { p.online = false; if (p.host) { p.host = false; const n = state.players.find((x) => x.online); if (n) n.host = true; } }
      if (state.phase === "job" && activeCid(state) === cid) { advanceTurn(state); const n = state.players.find((x) => x.cid === activeCid(state)); if (n) { hud.banner(`Tura: ${n.name}`); host.broadcast({ t: "fx", e: { fx: "turn", cid: n.cid } }); } focusTask(null); }
      sendState();
    },
    onMsg, onStream,
    onOnline: (code) => { online = !!code; url = code ? padUrl(code) : ""; refresh(lastSnap || snapshotFor(state, data)); }
  });
  url = "";
  window.__tv = { state, house, dir, R, host, get data() { return data; }, reduce: (cid, a) => onMsg(cid, { t: "act", ...a }), THREE };
  if (q.get("demo")) {
    requestAnimationFrame(loop);
    await demo(q.get("demo"), q.get("view") || "overview");
    return;
  }
  await lobbyScene();
  if (!q.get("emu")) soundHint();
  sendState();
  refresh(snapshotFor(state, null));
  requestAnimationFrame(loop);
  if (q.get("emu")) addEmulators(Number(q.get("emu")) || 1);
  if (q.get("desk")) addDesk();
}

boot().catch((e) => { console.error(e); document.getElementById("ui").innerHTML = `<div class="card" style="margin:20vh auto;width:30rem;padding:1.4rem;pointer-events:auto">Nie udało się wystartować: ${e.message}</div>`; });

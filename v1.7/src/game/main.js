// Instalator: first-person computer game — menus, online session, house, player, crosshair installs, hotbar, shop, map, turns.

import * as THREE from "three";
import { Renderer } from "../tv/renderer.js";
import { House } from "../tv/house.js";
import { Director } from "../tv/director.js";
import { Hud } from "../tv/hud.js";
import { Audio } from "../tv/audio.js";
import { BY_ID, fmtZl } from "../shared/catalog.js";
import { Player } from "./player.js";
import { Interact } from "./interact.js";
import { hostSession, joinSession, listRooms } from "./session.js";
import { openShop } from "./shop.js";
import { Station } from "./station.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const q = new URLSearchParams(location.search);

document.body.classList.add("pc");
const canvas = $("#game");
const R = new Renderer(canvas);
const house = new House(R);
const dir = new Director(R);
const hud = new Hud($("#ui"));
const audio = new Audio();
const gui = $("#gui");
gui.innerHTML = `<div id="cross"></div><svg id="ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3"/><circle id="ringv" cx="20" cy="20" r="17" fill="none" stroke="#f3cf45" stroke-width="3" stroke-dasharray="107" stroke-dashoffset="107" transform="rotate(-90 20 20)"/></svg>
  <div id="prompt"></div><div id="heldname"></div><div id="hotbar"></div><div id="turnbar" class="hide"></div><div id="keys"></div><div id="toastG"></div>`;

const player = new Player(R.camera, canvas);
const act = new Interact(R, house, player);
const station = new Station(R, house, dir, gui);
let session = null, S = null, data = null, loadedFor = null, mode = "menu", sel = 0, mouseDown = false, win = null;
let hands = null, handsScene = null, handsCam = null, FPP = null;
const avatars = new Map();
const pings = [];
let pendingAim = null, poseT = 0, follow = false, menuName = "";

R.camera.near = 0.05;
R.camera.updateProjectionMatrix();

function toast(text, bad = false) {
  const d = document.createElement("div");
  if (bad) d.className = "bad";
  d.innerHTML = text;
  $("#toastG").appendChild(d);
  setTimeout(() => d.remove(), 3600);
}

function myTurn() { return S && S.active === session?.me; }
function nameOf(cid) { return S?.players.find((p) => p.cid === cid)?.name || "Gracz"; }

async function loadHands() {
  try { FPP = await import("../models/fpp.js"); } catch (e) { FPP = null; }
  handsScene = new THREE.Scene();
  handsScene.add(new THREE.HemisphereLight("#f4f6fa", "#6d6a62", 1.3));
  const key = new THREE.DirectionalLight("#fff3e2", 1.8);
  key.position.set(0.5, 1, 0.6);
  handsScene.add(key);
  handsCam = new THREE.PerspectiveCamera(60, 16 / 9, 0.01, 10);
  if (FPP?.buildHands) { hands = FPP.buildHands({}); handsScene.add(hands); }
}

function setHeld(id) {
  const api = hands?.userData?.api;
  if (api) {
    if (!id) api.setTool("none");
    else if (BY_ID[id]) api.setTool("device", house.model(id, {}));
    return;
  }
  if (!handsScene) return;
  handsScene.children.filter((c) => c.userData.held).forEach((c) => handsScene.remove(c));
  if (!id) return;
  const o = house.model(id, {});
  const box = new THREE.Box3().setFromObject(o), sz = box.getSize(new THREE.Vector3());
  const s = 0.16 / Math.max(sz.x, sz.y, sz.z, 0.01);
  o.scale.multiplyScalar(s);
  o.position.set(0.28, -0.22, -0.55);
  o.rotation.set(0.25, -0.5, 0);
  o.userData.held = true;
  handsScene.add(o);
}

function invList() {
  if (!S) return [];
  return Object.entries(S.inv || {}).filter(([id, n]) => n > 0 && BY_ID[id]).map(([id, n]) => ({ id, n, it: BY_ID[id] }));
}

function heldId() { const l = invList(); return l[sel]?.id || null; }

function drawHotbar() {
  const l = invList();
  if (sel >= l.length) sel = Math.max(0, l.length - 1);
  $("#hotbar").innerHTML = l.length ? l.slice(0, 9).map((x, i) => `<div class="slot ${i === sel ? "sel" : ""}"><span class="k">${i + 1}</span><img src="assets/thumbs/${x.id}.png" alt=""><span class="n">×${x.n}</span></div>`).join("") : `<div class="empty">Pusta skrzynka: <kbd>B</kbd> otwiera hurtownię</div>`;
  const id = heldId();
  $("#heldname").textContent = id ? BY_ID[id].name : "";
  if (id !== drawHotbar.last) { drawHotbar.last = id; setHeld(id); }
}

function drawTurn() {
  const t = $("#turnbar");
  if (!S || S.phase !== "job") { t.classList.add("hide"); return; }
  t.classList.remove("hide");
  const p = S.players.find((x) => x.cid === S.active);
  const solo = S.players.filter((x) => x.online).length <= 1;
  t.classList.toggle("mine", myTurn());
  t.innerHTML = `<span class="dot" style="background:${p?.color || "#888"}"></span>${solo ? "Pracujesz" : myTurn() ? "<b>Twoja tura</b>" : `Tura: <b>${esc(p?.name || "?")}</b>`} <small>${solo ? "" : myTurn() ? "· G kończy turę" : "· V jego oczami, F ping"}</small>`;
  $("#keys").innerHTML = `<span><kbd>B</kbd> hurtownia <kbd>L</kbd> lista <kbd>Tab</kbd> mapa</span><span><kbd>E</kbd> użyj <kbd>1–9</kbd> sprzęt <kbd>H</kbd> odbiór</span>`;
}

const ui = {
  snap(snap) {
    const prev = S;
    S = snap;
    document.body.classList.toggle("nocross", !["job", "handover", "play"].includes(snap.phase));
    if (snap.phase === "lobby") { showRoom(); return; }
    $("#room")?.remove();
    if (snap.phase === "board") {
      hud.show("board");
      hud.board(snap, { kawalerka: "assets/thumbs/b-kawalerka.jpg", dom: "assets/thumbs/b-dom.jpg", gzowo: "assets/thumbs/b-gzowo.jpg", willa: "assets/thumbs/b-willa.jpg" });
      boardBar();
      return;
    }
    $("#boardbar")?.remove();
    if (snap.job && loadedFor !== snap.job.id) { loadJob(snap.job); return; }
    if (!data) return;
    if (snap.phase === "review") { hud.show("handover"); hud.review(snap, () => audio.play("stamp")); house.sync(snap, snap.der); exitToGame(); player.unlock(); reviewBar(); return; }
    $("#reviewbar")?.remove();
    if (snap.phase === "play") reviewBar();
    hud.show("hud");
    const newly = hud.job(snap, session.code, "", snap.tasks || []);
    newly.forEach((r) => { const rq = snap.job.reqs.find((x) => x.id === r.id); if (rq) hud.achieve(rq.text, () => audio.play("pen_tick", { vol: 0.9 })); });
    house.sync(snap, snap.der);
    if (pendingAim) {
      const d = snap.devs.find((x) => x.mount === pendingAim.mount);
      if (d) { session.send({ a: "aim", uid: d.uid, dir: pendingAim.dir }); pendingAim = null; }
    }
    drawHotbar();
    drawTurn();
    station.refresh(snap);
    if (prev && prev.active !== snap.active && snap.active === session.me) { toast("Twoja tura!"); audio.play("ui_confirm"); }
  },
  fx(e) {
    const snd = { install: { screw: "bulb_screw", drill: "drill_short", peel: "peel_sticker", strip: "peel_sticker", tap: "ui_pop", rotate: "screwdriver" }[e.style] || "ui_pop", buy: "ui_confirm", patch: "rj45_in", unpatch: "rj45_out", din: "din_snap", spark: "spark", rack: "rack_screw", shelf: "rack_screw", label: "pen_tick", tabletMount: "magnet_snap", pair: "ui_confirm", control: "relay_click", cable: "cable_zip", adopt: "ui_confirm", deal: "box_open", vote: "ui_tap", turn: "ui_pop" }[e.fx];
    if (e.fx === "breaker") audio.play(e.key === "main" ? "main_switch" : e.on ? "breaker_on" : "breaker_off");
    else if (snd) audio.play(snd, e.fx === "buy" ? { vol: 0.4 } : {});
    if (e.fx === "buy") toast(`${esc(BY_ID[e.id]?.name)}${e.n > 1 ? ` ×${e.n}` : ""} · −${fmtZl(e.price)}`);
    if (e.fx === "spark") toast("Iskra! Najpierw wyłącz zasilanie główne.", true);
    if (e.fx === "turn") toast(`Tura: <b>${esc(nameOf(e.cid))}</b>`);
    if (e.fx === "cable") setTimeout(() => house.animateRun(e.uid), 300);
    if (e.fx === "jobStart" && S?.job?.id !== e.job.id) loadJob(e.job);
    if (e.fx === "handover") { toast(`${esc(S?.job?.client.name || "Klient")} przyjechał na odbiór`); audio.play("doorbell_chime"); }
  },
  nope(text) { toast(esc(text), true); audio.play("ui_error", { vol: 0.6 }); },
  pose(cid, m) { poseOf(cid, m); },
  avatarGone(cid) { const a = avatars.get(cid); if (a) { R.scene.remove(a.obj); avatars.delete(cid); } },
  ping(cid, m) { addPing(m.pos, S?.players.find((p) => p.cid === cid)?.color || "#f3cf45"); },
  online(code) { if (S?.phase === "lobby") showRoom(true); if (!code) toast("Pokój online się nie połączył: grasz na tym komputerze."); },
  loading(text) { loadingScreen(text); },
  lost() { toast("Połączenie z gospodarzem zerwane.", true); },
  async loadBuilding(id, jobId) { return (await loadJob({ building: id, id: jobId })).data; }
};

let loadingJob = null;
async function loadJob(job) {
  if (loadingJob && loadingJob.id === job.id) return loadingJob.p;
  loadedFor = job.id;
  const p = (async () => {
    loadingScreen(`Jedziemy: ${job.buildingName || ""}`);
    const b = await house.load(job.building, { fpp: true });
    data = b.data;
    for (const cg of b.ceilingGroups || []) cg.group.visible = true;
    if (b.roof?.group) b.roof.group.visible = true;
    player.setWorld(b);
    player.spawn();
    house.setFloor(99);
    R.setMode("afternoon", true);
    $("#loading")?.remove();
    hud.show("hud");
    mode = "fpp";
    player.enabled = true;
    if (S) ui.snap(S);
    toast("Kliknij, żeby grać. <kbd>WASD</kbd> chodzenie, mysz rozglądanie.");
    return b;
  })();
  loadingJob = { id: job.id, p };
  return p;
}

function loadingScreen(text) {
  let l = $("#loading");
  if (!l) { l = document.createElement("div"); l.id = "loading"; gui.appendChild(l); }
  l.textContent = text;
}

function poseOf(cid, m) {
  if (cid === session?.me) return;
  let a = avatars.get(cid);
  const p = S?.players.find((x) => x.cid === cid);
  if (!a) {
    let obj;
    if (FPP?.buildPlayer) obj = FPP.buildPlayer({ color: p?.color || "#f28c28", name: p?.name });
    else {
      obj = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.1, 4, 10), new THREE.MeshStandardMaterial({ color: p?.color || "#f28c28", roughness: 0.7 }));
      body.position.y = 0.8;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), new THREE.MeshStandardMaterial({ color: "#e9bd98" }));
      head.position.y = 1.62;
      obj.add(body, head);
    }
    R.scene.add(obj);
    a = { obj, p: new THREE.Vector3(...m.p), yaw: m.yaw, pitch: m.pitch, t: new THREE.Vector3(...m.p), ty: m.yaw };
    avatars.set(cid, a);
  }
  a.t.set(...m.p); a.ty = m.yaw; a.pitch = m.pitch; a.tool = m.tool;
}

function addPing(pos, color) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.26, 32), new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, side: THREE.DoubleSide }));
  m.position.set(...pos);
  m.renderOrder = 20;
  R.scene.add(m);
  pings.push({ m, t: 0 });
  audio.play("ui_pop");
}

function menu() {
  mode = "menu";
  document.body.classList.add("nocross");
  const m = document.createElement("div");
  m.id = "menu";
  let saved = "";
  try { saved = localStorage.getItem("instalator.name") || ""; } catch (e) {}
  m.innerHTML = `<div class="col">
    <h1>Instalator</h1>
    <div class="sub">Smart home na zlecenie. Kupujesz prawdziwy sprzęt, montujesz go w domu klienta, podpinasz rozdzielnicę i szafę UniFi, a na koniec klient odbiera robotę. Gracie online na zmianę.</div>
    <input type="text" id="nm" maxlength="14" placeholder="Twoje imię" value="${esc(saved || q.get("name") || "")}">
    <label><input type="checkbox" id="pub" checked> Pokój publiczny (widać go na liście)</label>
    <button class="btnp" id="new">Nowa gra</button>
    <div class="join"><input type="text" id="code" maxlength="4" placeholder="KOD"><button class="btnp w" id="join">Dołącz kodem</button></div>
    <div><b>Publiczne pokoje</b> <button class="btnp w" id="ref" style="padding:0.2rem 0.6rem;font-size:0.9rem">odśwież</button></div>
    <div class="rooms" id="rooms"><small>Szukam…</small></div>
    <div class="err" id="err"></div>
  </div><div></div>`;
  gui.appendChild(m);
  const name = () => { const v = $("#nm").value.trim() || "Gracz"; try { localStorage.setItem("instalator.name", v); } catch (e) {} menuName = v; return v; };
  $("#new").onclick = async () => { audio.unlock(); const n = name(); $("#new").disabled = true; session = await hostSession({ name: n, isPublic: $("#pub").checked, ui }); m.remove(); };
  const join = async (code) => {
    audio.unlock();
    const n = name();
    $("#err").textContent = "Łączę…";
    try { session = await joinSession(code.toUpperCase(), { name: n, ui }); m.remove(); }
    catch (e) { $("#err").textContent = e.message === "room-not-found" ? "Nie ma takiego pokoju." : "Nie udało się połączyć."; }
  };
  $("#join").onclick = () => join($("#code").value.trim());
  $("#code").addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") join($("#code").value.trim()); });
  $("#nm").addEventListener("keydown", (e) => e.stopPropagation());
  const refresh = async () => {
    if (!$("#rooms")) return;
    $("#rooms").innerHTML = "<small>Szukam…</small>";
    try {
      const rooms = await listRooms();
      if (!$("#rooms")) return;
      $("#rooms").innerHTML = rooms.length ? rooms.map((r) => `<div class="room" data-c="${r.code}"><span><b>${esc(r.name)}</b><br><small>${esc(r.building ? `w trakcie: ${r.building}` : "w lobby")} · ${r.players} graczy</small></span><span class="btnp">Dołącz</span></div>`).join("") : "<small>Nikt teraz nie gra publicznie. Załóż nową grę.</small>";
      $("#rooms").querySelectorAll(".room").forEach((r) => (r.onclick = () => join(r.dataset.c)));
    } catch (e) { if ($("#rooms")) $("#rooms").innerHTML = "<small>Lista pokoi niedostępna (brak połączenia).</small>"; }
  };
  $("#ref").onclick = refresh;
  refresh();
}

function showRoom(force) {
  let r = $("#room");
  if (!r) { r = document.createElement("div"); r.id = "room"; gui.appendChild(r); }
  const host = S.players.find((p) => p.cid === session.me)?.host;
  const key = JSON.stringify([session.code, S.players.map((p) => [p.name, p.online, p.host])]);
  if (!force && r.dataset.key === key) return;
  r.dataset.key = key;
  r.innerHTML = `<div class="box"><div style="color:var(--ink2)">Kod pokoju dla taty</div><div class="code">${esc(session.code || "…")}</div>
    <div class="pl">${S.players.filter((p) => p.online).map((p) => `<span><i style="background:${p.color}"></i>${esc(p.name)}${p.host ? " · gospodarz" : ""}</span>`).join("")}</div>
    ${host ? `<button class="btnp" id="start">Pokaż zlecenia</button>` : `<div>Czekamy, aż gospodarz wybierze zlecenie…</div>`}</div>`;
  if ($("#start")) $("#start").onclick = () => session.send({ a: "start" });
}

function boardBar() {
  let b = $("#boardbar");
  const host = S.players.find((p) => p.cid === session.me)?.host;
  if (!b) { b = document.createElement("div"); b.id = "boardbar"; gui.appendChild(b); }
  b.innerHTML = host ? `<button class="btnp w" id="reroll">Przelosuj</button><button class="btnp" id="pick">Bierzemy zlecenie z najwięcej głosami</button>` : `<span class="tape">Kliknij kartę, żeby zagłosować. Gospodarz wybiera.</span>`;
  if ($("#reroll")) $("#reroll").onclick = () => session.send({ a: "reroll" });
  if ($("#pick")) $("#pick").onclick = () => session.send({ a: "pick" });
  const mine = S.board?.votes?.[session.me];
  document.querySelectorAll("#board .job").forEach((c) => { c.classList.toggle("voted", Number(c.dataset.i) === mine); c.onclick = () => session.send({ a: "vote", i: Number(c.dataset.i) }); });
}

function reviewBar() {
  let b = $("#reviewbar");
  if (!b) { b = document.createElement("div"); b.id = "reviewbar"; gui.appendChild(b); }
  const host = S.players.find((p) => p.cid === session.me)?.host;
  b.innerHTML = host ? `${S.phase === "review" ? `<button class="btnp w" id="playh">Pobaw się domem</button>` : ""}<button class="btnp" id="nextj">Nowe zlecenie</button>` : `<span class="tape">Gospodarz wybiera, co dalej.</span>`;
  if ($("#playh")) $("#playh").onclick = () => { session.send({ a: "play" }); hud.clearHandover(); player.lock(); };
  if ($("#nextj")) $("#nextj").onclick = () => session.send({ a: "next" });
}

function openList() {
  const w = document.createElement("div");
  w.className = "win";
  const reqs = S.job.reqs.map((r) => { const st = (S.reqs || []).find((x) => x.id === r.id) || {}; return `<div style="display:flex;gap:0.7rem;padding:0.55rem 0;border-bottom:1px solid var(--line)"><b style="color:${st.ok ? "var(--ok)" : "var(--ink2)"}">${st.ok ? "✓" : "○"}</b><div><b>${esc(r.text)}</b>${st.ok ? "" : `<div style="color:var(--ink2)">${esc(st.hint || "")}</div>`}</div></div>`; }).join("");
  w.innerHTML = `<div class="box" style="width:min(44rem,94vw)"><div class="head"><h2>${esc(S.job.client.name)}</h2><span class="sp"></span><button class="x">Zamknij (L)</button></div><div style="padding:1rem 1.3rem;overflow:auto"><p style="font-style:italic;color:var(--ink2);margin-top:0">„${esc(S.job.client.hello)}”</p>${reqs}<p style="color:var(--ink2)">System klienta: <b>${esc(S.job.platformName)}</b>. Budżet: <b>${fmtZl(S.budget.total)}</b>, zostało <b>${fmtZl(S.budget.total - S.budget.spent)}</b>.</p></div></div>`;
  gui.appendChild(w);
  openWin({ el: w, close: () => w.remove() });
  w.querySelector(".x").onclick = closeWin;
}

function openWin(w) { closeWin(); win = w; player.unlock(); }
function closeWin() { if (win) { win.close(); win = null; } }

function exitToGame() { closeWin(); }

function toggleMap() {
  if (mode === "map") {
    mode = "fpp";
    for (const cg of house.b?.ceilingGroups || []) cg.group.visible = true;
    if (house.b?.roof?.group) house.b.roof.group.visible = true;
    house.setFloor(99); house.showWifi(false); house.showCones(false);
    R.camera.fov = 70; R.camera.updateProjectionMatrix();
    player.lock();
  } else if (mode === "fpp") {
    mode = "map";
    for (const cg of house.b?.ceilingGroups || []) cg.group.visible = false;
    if (house.b?.roof?.group) house.b.roof.group.visible = false;
    const f = player.floorIndex();
    house.setFloor(f); house.showWifi(true); house.showCones(true);
    dir.overview(data, { floor: f, speed: 0.02, zoom: 1.25 });
    dir.snap();
  }
}

addEventListener("keydown", (e) => {
  if (mode === "menu") return;
  if (e.code === "Escape" && win) { closeWin(); return; }
  if (mode === "station") { if (e.code === "Escape" || e.code === "KeyE") { station.exit(); mode = "fpp"; R.camera.fov = 70; R.camera.updateProjectionMatrix(); house.closeFill = false; player.lock(); } return; }
  if (!S || !data) return;
  if (e.code === "Tab") { e.preventDefault(); toggleMap(); return; }
  if (e.code === "KeyB") { if (win) closeWin(); else openWin(openShop(gui, { S, data, send: (a) => session.send(a), onClose: () => { win = null; } })); return; }
  if (e.code === "KeyL") { if (win) closeWin(); else openList(); return; }
  if (win) return;
  if (e.code.startsWith("Digit")) { const n = Number(e.code.slice(5)) - 1; if (n >= 0 && n < 9) { sel = n; drawHotbar(); } }
  if (e.code === "KeyG" && myTurn()) session.send({ a: "endTurn" });
  if (e.code === "KeyH" && myTurn()) session.send({ a: "handover" });
  if (e.code === "KeyV" && !myTurn()) { follow = !follow; toast(follow ? "Patrzysz oczami gracza na turze (V wraca)" : "Chodzisz sam"); }
  if (e.code === "KeyF" && player.locked) {
    const rc = new THREE.Raycaster(R.camera.position, player.dir());
    rc.far = 25;
    const h = rc.intersectObject(house.b.group, true)[0];
    if (h) session.ping({ pos: h.point.toArray() });
  }
  if (e.code === "KeyE" && act.target) {
    const t = act.target;
    if ((t.kind === "panel" || t.kind === "rack") && myTurn()) { mode = "station"; player.unlock(); station.enter(t.kind, S, data, (a) => session.send(a), heldId()); }
    else if (t.kind === "tabletUse" && myTurn()) station.tablet(S, data, (a) => session.send(a), openWin, closeWin);
    else if (t.kind === "device") toast(`${esc(BY_ID[t.dev.id]?.name)}: ${S.der?.dev[t.dev.uid]?.pw ? (S.der.dev[t.dev.uid].net ? "działa" : "brak sieci") : "brak prądu"}${t.dev.paired ? ", sparowane" : ""}`);
  }
});

addEventListener("wheel", (e) => { if (mode !== "fpp" || win) return; const l = invList().length; if (!l) return; sel = (sel + (e.deltaY > 0 ? 1 : -1) + l) % l; drawHotbar(); }, { passive: true });
canvas.addEventListener("mousedown", (e) => {
  audio.unlock();
  if (mode === "fpp" && !player.locked && !win) { player.lock(); return; }
  if (e.button === 0) mouseDown = true;
});
addEventListener("mouseup", (e) => { if (e.button === 0) mouseDown = false; });
player.onLock = (locked) => { if (!locked && mode === "fpp" && !win && data) pauseScreen(); else $("#pause")?.remove(); };

function pauseScreen() {
  if ($("#pause")) return;
  const p = document.createElement("div");
  p.id = "pause";
  p.innerHTML = `<div class="box"><h2>Pauza</h2><div class="keys"><kbd>WASD</kbd><span>chodzenie, Shift bieg, spacja skok</span><kbd>Mysz</kbd><span>rozglądanie, LPM przytrzymaj: montaż</span><kbd>1–9</kbd><span>sprzęt w ręce (albo kółko myszy)</span><kbd>E</kbd><span>rozdzielnica, szafa, tablet, info o urządzeniu</span><kbd>B</kbd><span>hurtownia</span><kbd>L</kbd><span>lista klienta</span><kbd>Tab</kbd><span>mapa domu z zasięgiem Wi-Fi</span><kbd>G</kbd><span>koniec tury</span><kbd>H</kbd><span>zawołaj klienta na odbiór</span><kbd>V / F</kbd><span>oczami gracza na turze / ping</span></div><div style="color:var(--ink2)">Kod pokoju: <b>${esc(session?.code || "")}</b></div><button class="btnp" id="resume">Wróć do gry</button></div>`;
  gui.appendChild(p);
  $("#resume").onclick = () => { p.remove(); player.lock(); };
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (mode === "fpp" && data) {
    if (follow && !myTurn()) {
      const a = avatars.get(S.active);
      if (a) { R.camera.position.copy(a.p).add(new THREE.Vector3(0, 1.65, 0)); R.camera.rotation.set(a.pitch || 0, a.yaw, 0, "YXZ"); R.camera.updateMatrixWorld(); }
    } else player.update(dt);
    R.focus.copy(player.pos); R.frame = 16;
    if (Math.abs(R.camera.fov - 70) > 0.1) { R.camera.fov = 70; R.camera.updateProjectionMatrix(); }
    const held = myTurn() && !win ? heldId() : null;
    const done = player.locked && !win ? act.update(dt, S, data, held && BY_ID[held]?.where !== "rack" && BY_ID[held]?.where !== "shelf" && BY_ID[held]?.where !== "din" ? held : null, mouseDown) : null;
    const t = act.target;
    $("#cross").classList.toggle("hot", !!t);
    const pr = $("#prompt");
    if (t && player.locked) {
      const txt = t.kind === "mount" ? `<kbd>LPM</kbd> przytrzymaj: zamontuj <b>${esc(t.label)}</b>` : t.kind === "strip" ? `<kbd>LPM</kbd> przytrzymaj: poprowadź taśmę` : t.kind === "tablet" ? `<kbd>LPM</kbd> przytrzymaj: ${esc(t.label)} <small>(${t.rating === "good" ? "dobre miejsce" : t.rating === "ok" ? "może być" : "słabe miejsce"})</small>` : t.kind === "device" ? `<kbd>E</kbd> ${esc(BY_ID[t.dev.id]?.name)}` : `<kbd>E</kbd> ${esc(t.label)}`;
      pr.innerHTML = myTurn() || t.kind === "device" ? txt : `Teraz tura: <b>${esc(nameOf(S.active))}</b>`;
      pr.classList.add("show");
    } else pr.classList.remove("show");
    $("#ring").classList.toggle("show", act.k > 0);
    $("#ringv").setAttribute("stroke-dashoffset", String(107 * (1 - (act.k || 0))));
    if (done) {
      if (done.kind === "mount") {
        session.send({ a: "install", id: done.id, mount: done.mount.id, style: done.style });
        if (BY_ID[done.id]?.caps.includes("camera")) { const f = player.dir(); f.y = 0; f.normalize(); pendingAim = { mount: done.mount.id, dir: [f.x, 0, f.z] }; }
      } else if (done.kind === "strip") session.send({ a: "strip", id: done.id, strip: done.strip });
      else if (done.kind === "tablet") { session.send({ a: "tabletSpot", spot: done.spot }); setTimeout(() => session.send({ a: "tabletMount", leveled: true }), 300); }
    }
    house.update(dt, player.pos, R.camera);
    house.cutaway(R.camera.position, player.pos, "none");
    poseT -= dt;
    if (poseT <= 0 && session && player.enabled) { poseT = 0.1; session.pose({ p: player.pos.toArray(), yaw: player.yaw, pitch: player.pitch, tool: heldId() }); }
  } else if (mode === "station") {
    $("#prompt").classList.remove("show");
    $("#ring").classList.remove("show");
    station.update(dt);
    house.closeFill = true;
    R.focus.copy(station.focus); R.frame = 6;
    house.update(dt, station.focus, R.camera);
    house.cutaway(R.camera.position, station.focus, "close");
  } else if (mode === "map") {
    $("#prompt").classList.remove("show");
    dir.update(dt);
    house.closeFill = false;
    house.update(dt, dir.tgt, R.camera);
    house.cutaway(R.camera.position, dir.tgt, dir.cutMode);
  } else if (mode === "menu") {
    dir.update(dt);
    house.update(dt, dir.tgt, R.camera);
    house.cutaway(R.camera.position, dir.tgt, dir.cutMode);
  }
  for (const [, a] of avatars) {
    a.p.lerp(a.t, Math.min(1, dt * 10));
    const spd = a.prev ? a.p.distanceTo(a.prev) / Math.max(dt, 1e-3) : 0;
    a.prev = a.p.clone();
    a.obj.position.copy(a.p);
    a.obj.rotation.y = a.ty + Math.PI;
    a.obj.visible = !(follow && a === avatars.get(S?.active) && mode === "fpp");
    a.obj.userData.api?.update?.(dt, { speed: spd, pitch: a.pitch || 0, holding: a.tool });
  }
  for (let i = pings.length - 1; i >= 0; i--) {
    const p = pings[i];
    p.t += dt;
    p.m.lookAt(R.camera.position);
    p.m.scale.setScalar(1 + (p.t % 1) * 1.5);
    p.m.material.opacity = Math.max(0, 1 - p.t / 4);
    if (p.t > 4) { R.scene.remove(p.m); pings.splice(i, 1); }
  }
  R.render(dt);
  if (handsScene && mode === "fpp" && !follow) {
    handsCam.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    handsCam.updateProjectionMatrix();
    hands?.userData?.api?.update?.(dt, { moving: player.moving, sprint: player.sprint, look: player.look, action: act.k > 0 ? ({ drill: "drill", screw: "screw", rotate: "screw", peel: "press", tap: "press", strip: "place" }[act.style] || "press") : null, k: act.k || 0 });
    player.look = [0, 0];
    const r = R.renderer;
    const ac = r.autoClear;
    r.autoClear = false;
    r.clearDepth();
    r.render(handsScene, handsCam);
    r.autoClear = ac;
  }
  requestAnimationFrame(loop);
}

async function showcase() {
  try {
    await house.load("gzowo");
    const { newState, startJob } = await import("../shared/game.js");
    const { makeJob, rng } = await import("../shared/jobs.js");
    const { runDemo } = await import("../tv/demo.js");
    const { reduce } = await import("../shared/game.js");
    const { derive } = await import("../shared/sim.js");
    const st = newState();
    const job = makeJob("gzowo", rng(11));
    job.platform = "ha";
    startJob(st, job, house.data);
    runDemo(st, house.data, reduce, { stage: "full", platform: "ha" });
    house.sync(st, derive(st, house.data));
    R.setMode("dusk", true);
    dir.overview(house.data, { floor: 0, zoom: 1.4, speed: 0.04 });
    dir.snap();
  } catch (e) { console.warn("[menu] showcase failed", e); }
}

window.__game = { R, house, player, act, get S() { return S; }, get session() { return session; }, get data() { return data; } };
await loadHands();
requestAnimationFrame(loop);
showcase();
menu();
if (q.get("auto") === "solo") {
  setTimeout(async () => {
    $("#menu")?.remove();
    session = await hostSession({ name: q.get("name") || "Test", isPublic: false, ui });
    if (q.get("job")) {
      session.send({ a: "start" });
      setTimeout(() => session.send({ a: "pick", i: Number(q.get("job")) }), 300);
    }
  }, 300);
}

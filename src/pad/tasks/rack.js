// Instalator: rack task — the same 3D rack as on the TV seen from the front, mount gear, drag patch cables between real ports, adopt devices.

import { BY_ID, fmtZl } from "../../shared/catalog.js";
import { portCount } from "../../shared/sim.js";
import { icon } from "../../shared/icons.js";
import { $, esc, haptic, toast, sheet } from "../ui.js";
import { frame, invList, tray } from "./common.js";
import { netStep } from "../../shared/netguide.js";
import { openShop } from "./shop.js";
import { createFront } from "../front3d.js";

const COLORS = ["#3f7fd6", "#f3cf45", "#3e9b5f", "#eeeeee", "#8b6bd6", "#80868b"];
const U = 0.04445;

function short(ctx, d) {
  if (!d) return "";
  const it = BY_ID[d.id];
  const room = ctx.B.rooms.find((r) => r.id === d.room);
  const kind = it.caps.includes("ap") ? "AP" : it.caps.includes("doorbell") ? "DZWONEK" : it.caps.includes("camera") ? "KAMERA" : it.caps.includes("wallmount") ? "TABLET" : it.name.split(" ").pop().toUpperCase();
  return `${(room ? room.name : "dwór").slice(0, 7).toUpperCase()} ${kind}`;
}

export function mount(root, ctx, taskId, h) {
  const media = !ctx.B.rack;
  const body = frame(root, ctx, media ? "Skrzynka multimedialna" : "Szafa rack", "Montuj sprzęt, potem przeciągaj kable", h, { cats: ["siec", "centrale", "kamery"] });
  let sel = null, color = COLORS[0], zoom = 1, F = null, alive = true;
  body.innerHTML = `<div class="guide"></div><div class="h"><span id="inet"></span><span id="poe"></span></div>
    <div class="rackbox"><div class="rack3d"><div class="inner"><div class="ovl"></div><svg class="cables"></svg></div><div class="loading">Ładuję szafę…</div></div><div class="zoom"><button data-z="-">${icon("minus", 18, 2.4)}</button><button data-z="+">${icon("plus", 18, 2.4)}</button></div></div>
    <div class="h">Kolor kabla<span class="colors"></span></div><div class="tray" style="border:0;background:none;padding:0;margin:0 -14px"></div><div class="h">UniFi: adopcja</div><div class="list adopt"></div>`;
  const wrap = $(".rack3d", body), inner = $(".inner", body), ovl = $(".ovl", body), svg = $(".cables", body), trayHost = $(".tray", body);
  const colorsHost = $(".colors", body);
  colorsHost.innerHTML = COLORS.map((c) => `<button data-c="${c}" style="background:${c}"></button>`).join("");
  colorsHost.querySelectorAll("button").forEach((b) => (b.onclick = () => { color = b.dataset.c; haptic(); colorsHost.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }));
  colorsHost.firstElementChild.classList.add("on");
  body.querySelectorAll(".zoom button").forEach((b) => (b.onclick = () => { zoom = b.dataset.z === "+" ? Math.min(3, zoom + 1) : Math.max(1, zoom - 1); haptic(); layout(); }));

  const patchAt = (uid, p) => ctx.S.patches.find((x) => (x.a[0] === uid && x.a[1] === p) || (x.b[0] === uid && x.b[1] === p));
  const runAt = (uid, p) => ctx.S.devs.find((d) => d.run && d.run.pp === uid && d.run.port === p);
  let step = null;
  const isHint = (uid, i) => !!(step && step.link && ((step.link.from[0] === uid && step.link.from[1] === i) || (step.link.to[0] === uid && step.link.to[1] === i)));

  const autoPlace = (id) => {
    const it = BY_ID[id];
    if (it.where === "shelf") { ctx.send({ a: "shelfPut", id }); return; }
    if (it.where === "rack" && !ctx.B.rack) { toast(`${it.name} to sprzęt do szafy 19 cali. W skrzynce się nie zmieści.`); return; }
    if (it.where !== "rack") return;
    const units = ctx.B.rack.units || 9, n = it.u || 1;
    const occ = new Set();
    for (const d of ctx.S.devs) if (d.place === "rack") for (let k = 0; k < (BY_ID[d.id].u || 1); k++) occ.add(d.u + k);
    for (let u = units - n; u >= 0; u--) {
      let ok = true;
      for (let k = 0; k < n; k++) if (occ.has(u + k)) ok = false;
      if (ok) { ctx.send({ a: "rackPut", id, u }); return; }
    }
    toast("W szafie nie ma już miejsca.");
  };
  const runAll = (links) => links.forEach((l, i) => setTimeout(() => { haptic(true); ctx.send({ a: "patch", from: l.from, to: l.to, color: l.color }); }, i * 420));
  const runOps = (ops) => ops.forEach((o, i) => setTimeout(() => {
    haptic(true);
    if (o.unpatch) ctx.send({ a: "unpatch", at: o.unpatch });
    else if (o.patch) ctx.send({ a: "patch", from: o.patch.from, to: o.patch.to, color: o.patch.color });
  }, i * 420));

  const drawGuide = () => {
    step = netStep(ctx.S, ctx.B);
    const g = $(".guide", body);
    const btns = step.refund ? `<button class="btn y sm gref">${icon("undo", 18, 2)} Zwróć (+${fmtZl(BY_ID[step.refund].price)})</button><button class="btn w sm gbuy">${icon("cart", 18, 2)} Sklep</button>`
      : step.fix ? `<button class="btn y sm gfix">${icon("drill", 18, 2)} Napraw</button>`
      : step.goto ? `<button class="btn y sm ggo">${icon("bolt", 18, 2)} Do rozdzielnicy</button>`
      : step.buy ? `<button class="btn y sm gbuy">${icon("cart", 18, 2)} Kup</button>`
      : step.place ? `<button class="btn y sm gplace">${icon("drill", 18, 2)} Zamontuj</button>`
      : step.link ? `<button class="btn y sm glink">Podłącz</button>${(step.all || []).length > 1 ? `<button class="btn w sm gall">Podłącz wszystko (${step.all.length})</button>` : ""}` : "";
    const warn = step.warn ? `<div class="gcard warn"><span class="gn">${icon("bolt", 18, 2.4)}</span><div class="gt">${esc(step.warn.text)}</div><div class="gb"><button class="btn w sm gwarn">${icon("bolt", 18, 2)} Do rozdzielnicy</button></div></div>` : "";
    g.innerHTML = `${warn}<div class="gcard ${step.done ? "ok" : step.goto ? "warn" : ""}"><span class="gn">${step.done ? icon("check", 18, 3) : step.goto ? icon("bolt", 18, 2.4) : step.n}</span><div class="gt">${esc(step.text)}</div>${btns ? `<div class="gb">${btns}</div>` : ""}</div>`;
    if ($(".gbuy", g)) $(".gbuy", g).onclick = () => openShop(ctx, ["siec", "centrale", "kamery"]);
    if ($(".gplace", g)) $(".gplace", g).onclick = () => { haptic(true); autoPlace(step.place); };
    if ($(".glink", g)) $(".glink", g).onclick = () => runAll([step.link]);
    if ($(".gall", g)) $(".gall", g).onclick = () => runAll(step.all);
    if ($(".gfix", g)) $(".gfix", g).onclick = () => runOps(step.fix);
    if ($(".gref", g)) $(".gref", g).onclick = () => { haptic(true); ctx.send({ a: "refund", id: step.refund }); toast(`Zwrócone: ${BY_ID[step.refund].name}. Pieniądze wróciły do budżetu.`); };
    if ($(".ggo", g)) $(".ggo", g).onclick = () => { haptic(); ctx.openTask(step.goto); };
    if ($(".gwarn", g)) $(".gwarn", g).onclick = () => { haptic(); ctx.openTask(step.warn.goto); };
  };

  const objs = new Map();
  let rig = null, cab = null, origin = null, cableGroup = null, ontObj = null, keyKey = "";
  const ports = [];

  const portList = (obj) => {
    const list = (obj?.userData.ports || []).filter((p) => p.kind !== "sfp" && p.kind !== "power");
    return [...list.filter((p) => p.kind === "wan"), ...list.filter((p) => p.kind !== "wan")];
  };

  const portWorld = (uid, i) => {
    const T = F.THREE;
    let obj = uid === "ont" ? ontObj : uid === "mbk" ? cab : objs.get(uid);
    if (!obj) return null;
    obj.updateWorldMatrix(true, false);
    if (uid === "mbk") {
      const sh = cab.userData.shelf;
      const w = sh ? sh.w : 0.3;
      const y = sh ? sh.origin[1] + 0.33 : 0.2;
      return cab.localToWorld(new T.Vector3(-w / 2 + 0.03 + i * (w - 0.06) / 7, y, (sh ? sh.origin[2] : 0) + 0.02));
    }
    const p = portList(obj)[i];
    if (p) return obj.localToWorld(new T.Vector3(...p.pos));
    const box = new T.Box3().setFromObject(obj);
    return new T.Vector3(box.min.x + 0.02 + (i % 12) * 0.02, box.min.y + 0.012 + Math.floor(i / 12) * 0.015, box.max.z);
  };

  const build = async () => {
    F = await createFront(inner);
    if (!alive) { F.dispose(); return; }
    $(".loading", wrap)?.remove();
    const T = F.THREE;
    rig = new T.Group();
    F.scene.add(rig);
    cab = F.DM.buildDevice(media ? "media-box" : (ctx.B.rack.units > 9 ? "rack-12u" : "rack-9u"), {});
    if (cab.userData.door) cab.userData.door.visible = false;
    rig.add(cab);
    origin = new T.Vector3(...(cab.userData.rackOrigin || [0, 0.05, 0.4]));
    ontObj = F.DM.buildDevice("ont", {});
    const cb = new T.Box3().setFromObject(cab);
    ontObj.position.set(cb.min.x - 0.09, cb.max.y - 0.16, cb.max.z - 0.05);
    rig.add(ontObj);
    cableGroup = new T.Group();
    rig.add(cableGroup);
    sync();
    layout();
  };

  const sync = () => {
    if (!F) return;
    const T = F.THREE, S = ctx.S;
    const want = S.devs.filter((d) => d.place === "rack" || d.place === "shelf");
    const ids = new Set(want.map((d) => d.uid));
    for (const [uid, o] of objs) if (!ids.has(uid)) { o.parent && o.parent.remove(o); objs.delete(uid); }
    for (const d of want) if (!objs.has(d.uid)) { const o = F.DM.buildDevice(d.id, {}); cab.add(o); objs.set(d.uid, o); }
    for (const d of want.filter((x) => x.place === "rack")) objs.get(d.uid).position.copy(origin).add(new T.Vector3(0, d.u * U, 0));
    const shelfDevs = want.filter((x) => x.place === "shelf");
    const shelves = want.filter((x) => x.id === "rack-shelf").sort((a, b) => a.u - b.u);
    const ms = cab.userData.shelf;
    shelfDevs.forEach((d, i) => {
      const o = objs.get(d.uid);
      if (shelves.length) {
        const sh = shelves[Math.min(shelves.length - 1, Math.floor(i / 3))];
        o.position.copy(origin).add(new T.Vector3(-0.14 + (i % 3) * 0.14, (sh.u + 1) * U + 0.004, -0.16));
      } else if (ms) {
        o.position.set(ms.origin[0] - ms.w / 2 + ms.w / 6 + (i % 3) * (ms.w / 3), ms.origin[1] - Math.floor(i / 3) * 0.2, ms.origin[2]);
      }
    });
    for (const d of want) {
      const o = objs.get(d.uid);
      const pw = S.der?.dev[d.uid]?.pw;
      for (const l of o.userData.leds || []) if (l.material) l.material.emissiveIntensity = pw ? (l.role === "display" ? 1 : 1.4) : 0;
    }
    const lit = new Map();
    for (const p of S.patches) { lit.set(`${p.a[0]}#${p.a[1]}`, p.color); lit.set(`${p.b[0]}#${p.b[1]}`, p.color); }
    for (const d of want) {
      const it = BY_ID[d.id] || {};
      portList(objs.get(d.uid)).forEach((p, i) => {
        if (!p.led?.emissive) return;
        const c = lit.get(`${d.uid}#${i}`);
        if (c && S.der?.dev[d.uid]?.pw) { p.led.emissive.set(it.etherlight ? c : "#39d67a"); p.led.emissiveIntensity = it.etherlight ? 1.5 : 1.1; } else p.led.emissiveIntensity = 0;
      });
    }
    const key = JSON.stringify(S.patches) + objs.size;
    if (key !== keyKey) {
      keyKey = key;
      cableGroup.clear();
      rig.updateMatrixWorld(true);
      for (const p of S.patches) {
        const A = portWorld(p.a[0], p.a[1]), B = portWorld(p.b[0], p.b[1]);
        if (!A || !B) continue;
        const dd = A.distanceTo(B);
        const n = new T.Vector3(0, 0, 1);
        const mid = A.clone().add(B).multiplyScalar(0.5).addScaledVector(n, 0.05 + dd * 0.12).add(new T.Vector3(0, -0.03 - dd * 0.18, 0));
        const curve = new T.CatmullRomCurve3([A, A.clone().addScaledVector(n, 0.03), mid, B.clone().addScaledVector(n, 0.03), B], false, "centripetal");
        cableGroup.add(new T.Mesh(new T.TubeGeometry(curve, 28, 0.0028, 6), new T.MeshStandardMaterial({ color: p.color, roughness: 0.55 })));
      }
    }
  };

  const layout = () => {
    if (!F) return;
    const T = F.THREE;
    rig.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(rig);
    const W = wrap.clientWidth || 340;
    const bw = box.max.x - box.min.x, bh = box.max.y - box.min.y;
    const halfW = (bw / 2) * 1.04;
    const H = Math.round(W * zoom * (bh * 1.04) / (bw * 1.04));
    inner.style.width = `${W * zoom}px`;
    inner.style.height = `${H}px`;
    wrap.style.height = `${Math.min(H, Math.round(innerHeight * 0.62))}px`;
    F.size(W * zoom, H);
    F.frame((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, halfW);
    overlays();
    F.render();
  };

  const overlays = () => {
    const S = ctx.S;
    ports.length = 0;
    let html = "";
    const devs = [...S.devs.filter((d) => (d.place === "rack" || d.place === "shelf") && portCount(d) > 0), ...S.devs.filter((d) => d.id === "ont" || d.id === "mb-keystone")];
    for (const d of devs) {
      const it = BY_ID[d.id] || {};
      const n = portCount(d);
      const wan = it.ports?.wan || 0, poe = it.ports?.poe || 0;
      for (let i = 0; i < n; i++) {
        const w = portWorld(d.uid, i);
        if (!w) continue;
        const [x, y] = F.project(w);
        const pt = patchAt(d.uid, i), run = runAt(d.uid, i);
        const need = !pt && ((run && !it.caps?.includes("switch")) || d.id === "ont" || (wan && i === 0) || (!it.caps?.includes("switch") && !it.caps?.includes("patch") && d.id !== "mb-keystone" && !wan && n === 1));
        const cls = `${pt ? "used" : ""} ${need ? "need" : ""} ${isHint(d.uid, i) ? "hint" : ""} ${i >= wan && i - wan < poe ? "poe" : ""}`;
        html += `<span class="p3 ${cls}" data-uid="${d.uid}" data-p="${i}" style="left:${x}px;top:${y}px"></span>`;
        if (run && !pt) html += `<span class="pl3" style="left:${x}px;top:${y - 16}px">${esc(short(ctx, run))}</span>`;
        if ((wan && i === 0) || d.id === "ont") html += `<span class="pl3" style="left:${x}px;top:${y - 16}px">${d.id === "ont" ? "INTERNET" : "WAN"}</span>`;
        ports.push({ uid: d.uid, p: i, x, y });
      }
    }
    if (sel && BY_ID[sel]?.where === "rack" && !media) {
      const T = F.THREE;
      const units = ctx.B.rack.units || 9, n = BY_ID[sel].u || 1;
      const occ = new Set();
      for (const d of S.devs) if (d.place === "rack") for (let k = 0; k < (BY_ID[d.id].u || 1); k++) occ.add(d.u + k);
      for (let u = 0; u + n <= units; u++) {
        let ok = true;
        for (let k = 0; k < n; k++) if (occ.has(u + k)) ok = false;
        if (!ok) continue;
        const a = F.project(cab.localToWorld(origin.clone().add(new T.Vector3(-0.22, (u + n) * U, 0))));
        const b = F.project(cab.localToWorld(origin.clone().add(new T.Vector3(0.22, u * U, 0))));
        html += `<span class="slot3" data-u="${u}" style="left:${a[0]}px;top:${a[1]}px;width:${b[0] - a[0]}px;height:${b[1] - a[1]}px">${icon("plus", 16, 2.4)}</span>`;
      }
    }
    ovl.innerHTML = html;
    ovl.querySelectorAll(".slot3").forEach((e) => (e.onclick = () => { haptic(true); ctx.send({ a: "rackPut", id: sel, u: Number(e.dataset.u) }); if ((ctx.S.inv[sel] || 1) <= 1) sel = null; }));
    drawCables();
  };

  const cablePath = (a, b) => {
    const sag = Math.min(60, 14 + Math.abs(a[0] - b[0]) * 0.18 + Math.abs(a[1] - b[1]) * 0.1);
    return `M${a[0]},${a[1]} C${a[0]},${a[1] + sag} ${b[0]},${b[1] + sag} ${b[0]},${b[1]}`;
  };
  const at = (uid, p) => { const q = ports.find((x) => x.uid === uid && x.p === p); return q ? [q.x, q.y] : null; };
  const drawCables = (live) => {
    svg.setAttribute("width", inner.clientWidth);
    svg.setAttribute("height", inner.clientHeight);
    let s = "";
    if (step && step.link && !live) {
      const a = at(step.link.from[0], step.link.from[1]), b = at(step.link.to[0], step.link.to[1]);
      if (a && b) s += `<path d="${cablePath(a, b)}" stroke="#f3cf45" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="5 6"><animate attributeName="stroke-dashoffset" from="22" to="0" dur="0.8s" repeatCount="indefinite"/></path>`;
    }
    if (live) s += `<path d="${cablePath(live.a, live.b)}" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="${live.hot ? "0" : "6 4"}"/><circle cx="${live.b[0]}" cy="${live.b[1]}" r="9" fill="${color}" stroke="#fff" stroke-width="2"/>`;
    svg.innerHTML = s;
  };

  const panelInfo = () => {
    const S = ctx.S;
    $("#inet", body).innerHTML = S.der?.online ? `<span class="tape" style="background:var(--ok);color:#fff">internet działa</span>` : `<span class="tape">brak internetu</span>`;
    const used = Object.entries(S.der?.poeUsed || {}).map(([u, w]) => `${w}/${BY_ID[S.devs.find((d) => d.uid === u)?.id]?.poeOut || 0} W`).join(" · ");
    $("#poe", body).textContent = used ? `PoE ${used}` : "";
    const items = invList(ctx, (it) => it.where === "rack" || it.where === "shelf");
    tray(trayHost, ctx, items, sel, (id) => {
      sel = id;
      if (id && BY_ID[id].where === "shelf") {
        if (media || ctx.S.devs.some((d) => d.id === "rack-shelf")) { haptic(true); ctx.send({ a: "shelfPut", id }); sel = null; }
        else toast("Najpierw zamontuj półkę 1U w szafie.");
      } else if (id && media && BY_ID[id].where === "rack") { toast(`${BY_ID[id].name} to sprzęt do szafy 19 cali. W skrzynce się nie zmieści, zwróć go w przewodniku u góry.`); sel = null; }
      panelInfo();
      overlays();
    }, { cats: ["siec", "centrale"], hint: sel ? "Stuknij plus w wolnym miejscu szafy" : "Sprzęt do szafy" });
    const un = S.devs.filter((d) => BY_ID[d.id]?.brand === "Ubiquiti" && S.der?.dev[d.uid]?.pw && BY_ID[d.id].power !== "none");
    $(".adopt", body).innerHTML = un.length ? un.map((d) => `<div class="row"><span class="chk ${d.adopted ? "on" : ""}">${d.adopted ? icon("check", 13, 3) : ""}</span><div class="grow"><b>${esc(BY_ID[d.id].name)}</b><span>${S.der.dev[d.uid].net ? (d.adopted ? "online" : "czeka na adopcję") : "brak połączenia"}</span></div>${!d.adopted && S.der.dev[d.uid].net ? `<button class="btn y sm" data-adopt="${d.uid}">Adoptuj</button>` : ""}</div>`).join("") : `<div class="row"><div class="grow"><span>Tu pojawią się urządzenia UniFi, gdy dostaną prąd i sieć.</span></div></div>`;
    $(".adopt", body).querySelectorAll("[data-adopt]").forEach((b) => (b.onclick = () => { haptic(true); b.textContent = "…"; setTimeout(() => ctx.send({ a: "adopt", uid: b.dataset.adopt }), 700); }));
  };

  const nearest = (x, y, skip) => {
    let best = null, bd = 26;
    for (const q of ports) {
      if (skip && q.uid === skip.uid && q.p === skip.p) continue;
      const d = Math.hypot(q.x - x, q.y - y);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  };
  const local = (e) => { const r = inner.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  let drag = null;
  inner.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".slot3")) return;
    const [x, y] = local(e);
    const q = nearest(x, y);
    if (!q) return;
    if (patchAt(q.uid, q.p)) {
      sheet("Wypiąć kabel?", (sc, s, close) => {
        sc.innerHTML = `<div style="display:flex;gap:10px"><button class="btn w n">Zostaw</button><button class="btn y ok">Wypnij</button></div>`;
        $(".n", sc).onclick = close;
        $(".ok", sc).onclick = () => { haptic(); ctx.send({ a: "unpatch", at: [q.uid, q.p] }); close(); };
      });
      return;
    }
    inner.setPointerCapture(e.pointerId);
    drag = { q, a: [q.x, q.y], b: [q.x, q.y], hot: null };
    haptic();
    e.preventDefault();
  });
  inner.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const [x, y] = local(e);
    const t = nearest(x, y, drag.q);
    const ok = t && !patchAt(t.uid, t.p);
    if (ok && (!drag.hot || drag.hot.uid !== t.uid || drag.hot.p !== t.p)) haptic();
    drag.hot = ok ? t : null;
    drag.b = ok ? [t.x, t.y] : [x, y];
    drawCables({ a: drag.a, b: drag.b, hot: ok });
  });
  const up = () => {
    if (!drag) return;
    const t = drag.hot;
    if (t) { haptic(true); ctx.send({ a: "patch", from: [drag.q.uid, drag.q.p], to: [t.uid, t.p], color }); }
    drag = null;
    drawCables();
  };
  inner.addEventListener("pointerup", up);
  inner.addEventListener("pointercancel", up);

  const ro = new ResizeObserver(() => layout());
  ro.observe(wrap);
  drawGuide();
  panelInfo();
  build().catch((e) => { console.error(e); const l = $(".loading", wrap); if (l) l.textContent = "Nie udało się wczytać szafy 3D."; });
  return {
    update() { if (drag) return; drawGuide(); panelInfo(); if (F) { sync(); overlays(); F.render(); } },
    destroy() { alive = false; ro.disconnect(); if (F) F.dispose(); }
  };
}

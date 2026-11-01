// Instalator: stations in first person — breaker panel and rack worked with the mouse on the real 3D models, and the wall tablet window.

import * as THREE from "three";
import { BY_ID, PLATFORMS } from "../shared/catalog.js";
import { portCount, panelLayout, firstFreeDin } from "../shared/sim.js";
import { netStep } from "../shared/netguide.js";
import { renderDash, gridRect, cardRect, cardKindsFor, COLS, ROWS, KIND_LABEL } from "../dash/render.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const COLORS = ["#3f7fd6", "#f3cf45", "#3e9b5f", "#eeeeee", "#8b6bd6", "#80868b"];
const U = 0.04445;

export class Station {
  constructor(R, house, dir, gui) {
    this.R = R; this.house = house; this.dir = dir; this.gui = gui;
    this.kind = null; this.layer = null; this.side = null;
    this.color = COLORS[0];
    this.drag = null;
  }

  enter(kind, S, data, send, held) {
    this.kind = kind; this.S = S; this.data = data; this.send = send; this.held = held;
    const f = this.house.focusPoint(kind);
    if (f) { this.house.setFloor(f.floor); this.dir.closeup(f.pos, f.normal, f.dist || (kind === "rack" ? 1.2 : 0.8), kind === "rack" ? 0.06 : 0.1); }
    this.house.setDoors(true);
    for (const cg of this.house.b?.ceilingGroups || []) cg.group.visible = false;
    this.layer = document.createElement("div");
    this.layer.className = "st-layer on";
    this.side = document.createElement("div");
    this.side.className = "st-side on";
    this.gui.append(this.layer, this.side);
    this.layer.addEventListener("contextmenu", (e) => e.preventDefault());
    addEventListener("mouseup", this.up = () => this.release());
    addEventListener("mousemove", this.move = (e) => this.dragMove(e));
    this.draw();
  }

  exit() {
    this.kind = null;
    this.layer?.remove(); this.side?.remove();
    this.layer = this.side = null;
    removeEventListener("mouseup", this.up);
    removeEventListener("mousemove", this.move);
    this.house.setDoors(false);
    for (const cg of this.house.b?.ceilingGroups || []) cg.group.visible = true;
    this.house.setFloor(99);
    this.house.closeFill = false;
  }

  refresh(S) { this.S = S; if (this.kind) this.draw(); this.tabUpdate(S); }

  proj(v) {
    const p = v.clone().project(this.R.camera);
    const r = this.R.renderer.domElement.getBoundingClientRect();
    return [r.left + ((p.x + 1) / 2) * r.width, r.top + ((1 - p.y) / 2) * r.height, p.z < 1];
  }

  update() {
    if (!this.kind || !this.layer) return;
    for (const el of this.layer.querySelectorAll("[data-w]")) {
      const w = el._w;
      if (!w) continue;
      const [x, y, ok] = this.proj(w);
      el.style.left = `${x}px`; el.style.top = `${y}px`; el.style.display = ok ? "" : "none";
    }
    if (this.drag) this.drawDrag();
  }

  draw() {
    if (this.kind === "panel") this.drawPanel(); else if (this.kind === "rack") this.drawRack();
  }

  drawPanel() {
    const S = this.S, data = this.data, H = this.house;
    const lay = panelLayout(data);
    const on = (key) => key === "main" ? !!S.panel.main : key.startsWith("rcd") ? !!S.panel.rcd[Number(key.slice(3))] : !!S.panel.br[key.slice(4)];
    let html = "";
    for (const [key, b] of H.breakers || []) html += `<button class="st-bk ${on(key) ? "on" : ""}" data-w data-k="${esc(key)}" title="${esc(key)}"></button>`;
    this.layer.innerHTML = html;
    for (const el of this.layer.querySelectorAll(".st-bk")) {
      const b = H.breakers.get(el.dataset.k);
      el._w = b.obj.getWorldPosition(new THREE.Vector3());
      el.onmousedown = (e) => {
        if (e.button === 2) { this.labelMenu(el.dataset.k, e); return; }
        const target = !on(el.dataset.k);
        this.sweep = target;
        this.send({ a: "breaker", key: el.dataset.k, on: target });
      };
      el.onmouseenter = () => { if (this.sweep != null && on(el.dataset.k) !== this.sweep) this.send({ a: "breaker", key: el.dataset.k, on: this.sweep }); };
    }
    const circuits = data.circuits || [];
    const live = circuits.filter((c) => S.panel.main && S.panel.br[c.id]).length;
    const din = Object.entries(S.inv || {}).filter(([id, n]) => n > 0 && BY_ID[id]?.where === "din");
    const mods = S.devs.filter((d) => d.place === "din" && d.ch?.length);
    const guide = !S.panel.main && live === 0 ? "Włącz główny wyłącznik (czerwony), potem różnicówki i bezpieczniki. Przeciągnij myszką po rzędzie, żeby pstryknąć wszystkie." : live < circuits.length ? `Pod prądem ${live} z ${circuits.length} obwodów. Pstryknij resztę.` : "Wszystko pod prądem. Prawym przyciskiem opiszesz obwód.";
    this.side.innerHTML = `<h3>Rozdzielnica</h3><p class="g">${esc(guide)}</p>
      <div class="kv"><span>Główny</span><b>${S.panel.main ? "wł." : "wył."}</b><span>Obwody pod prądem</span><b>${live}/${circuits.length}</b><span>Opisane</span><b>${circuits.filter((c) => S.panel.labels[c.id]).length}/${circuits.length}</b></div>
      ${din.length ? `<h4>Moduły do wpięcia</h4>${din.map(([id, n]) => `<div class="row"><span>${esc(BY_ID[id].name)} ×${n}</span><button class="btnp" data-din="${id}">Wepnij</button></div>`).join("")}<p class="g">Moduły wpina się bez prądu: najpierw wyłącz główny.</p>` : ""}
      ${mods.map((d) => `<h4>${esc(BY_ID[d.id].name)}</h4>${d.ch.map((c, i) => `<div class="row"><span>Kanał ${i + 1}</span><select data-uid="${d.uid}" data-ch="${i}"><option value="">nic</option>${circuits.map((x) => `<option value="${x.id}" ${c === x.id ? "selected" : ""}>${esc(x.label || x.id)} · ${esc((x.rooms || []).join(", "))}</option>`).join("")}</select></div>`).join("")}`).join("")}
      <p class="keys"><kbd>LPM</kbd> pstryk <kbd>PPM</kbd> opis <kbd>E</kbd>/<kbd>Esc</kbd> wyjście</p>`;
    this.side.querySelectorAll("[data-din]").forEach((b) => (b.onclick = () => this.send({ a: "dinPut", id: b.dataset.din })));
    this.side.querySelectorAll("select").forEach((s) => { s.onchange = () => this.send({ a: "dinCh", uid: s.dataset.uid, ch: Number(s.dataset.ch), circuit: s.value || null }); s.onkeydown = (e) => e.stopPropagation(); });
    this.update();
  }

  labelMenu(key, e) {
    if (!key.startsWith("mcb:")) return;
    const cid = key.slice(4);
    const c = (this.data.circuits || []).find((x) => x.id === cid);
    const rooms = this.data.rooms.filter((r) => r.kind !== "outdoor");
    const m = document.createElement("div");
    m.className = "st-menu on";
    m.style.left = `${e.clientX}px`; m.style.top = `${e.clientY}px`;
    m.innerHTML = `<b>Opis obwodu ${esc(c?.label || cid)}</b>${rooms.map((r) => `<button data-r="${r.id}">${esc(r.name)}</button>`).join("")}`;
    this.gui.appendChild(m);
    m.querySelectorAll("button").forEach((b) => (b.onclick = () => { this.send({ a: "label", circuit: cid, room: b.dataset.r }); m.remove(); }));
    setTimeout(() => addEventListener("mousedown", function off(ev) { if (!m.contains(ev.target)) { m.remove(); removeEventListener("mousedown", off); } }), 0);
  }

  ports() {
    const S = this.S, out = [];
    const devs = [...S.devs.filter((d) => (d.place === "rack" || d.place === "shelf") && portCount(d) > 0), ...S.devs.filter((d) => d.id === "ont" || d.id === "mb-keystone")];
    for (const d of devs) {
      const it = BY_ID[d.id] || {};
      for (let i = 0; i < portCount(d); i++) {
        const w = this.house.portWorld(d.uid, i);
        if (!w) continue;
        const used = S.patches.some((x) => (x.a[0] === d.uid && x.a[1] === i) || (x.b[0] === d.uid && x.b[1] === i));
        out.push({ uid: d.uid, p: i, w, used, wan: (it.ports?.wan && i === 0) || d.id === "ont", poe: i >= (it.ports?.wan || 0) && i - (it.ports?.wan || 0) < (it.ports?.poe || 0) });
      }
    }
    return out;
  }

  drawRack() {
    const S = this.S;
    const step = netStep(S, this.data);
    this.step = step;
    const hint = (uid, p) => step.link && ((step.link.from[0] === uid && step.link.from[1] === p) || (step.link.to[0] === uid && step.link.to[1] === p));
    this.portList = this.ports();
    this.layer.innerHTML = this.portList.map((q, i) => `<span class="st-port ${q.used ? "used" : ""} ${q.poe ? "poe" : ""} ${hint(q.uid, q.p) ? "hint" : ""}" data-w data-i="${i}">${q.wan ? `<em>${S.devs.find((d) => d.uid === q.uid)?.id === "ont" ? "INTERNET" : "WAN"}</em>` : ""}</span>`).join("") + `<svg class="st-cable"></svg>`;
    this.layer.querySelectorAll(".st-port").forEach((el) => {
      const q = this.portList[Number(el.dataset.i)];
      el._w = q.w;
      el.onmousedown = (e) => {
        e.preventDefault();
        if (q.used && e.button === 2) { this.send({ a: "unpatch", at: [q.uid, q.p] }); return; }
        if (q.used) return;
        this.drag = { q, x: e.clientX, y: e.clientY };
      };
    });
    const inv = Object.entries(S.inv || {}).filter(([id, n]) => n > 0 && (BY_ID[id]?.where === "rack" || BY_ID[id]?.where === "shelf"));
    const ubq = S.devs.filter((d) => BY_ID[d.id]?.brand === "Ubiquiti" && S.der?.dev[d.uid]?.pw && S.der.dev[d.uid].net && !d.adopted && BY_ID[d.id].power !== "none");
    const btn = step.refund ? `<button class="btnp" data-x="refund">Zwróć ${esc(BY_ID[step.refund].name)}</button>` : step.fix ? `<button class="btnp" data-x="fix">Napraw</button>` : step.link ? `<button class="btnp" data-x="link">Podłącz</button>${(step.all || []).length > 1 ? `<button class="btnp w" data-x="all">Podłącz wszystko (${step.all.length})</button>` : ""}` : step.place ? `<button class="btnp" data-x="place">Zamontuj ${esc(BY_ID[step.place].name)}</button>` : step.buy ? `<p class="g">Otwórz hurtownię: <kbd>B</kbd> po wyjściu.</p>` : "";
    this.side.innerHTML = `<h3>${this.data.rack ? "Szafa rack" : "Skrzynka multimedialna"}</h3>
      <div class="st-step ${step.done ? "ok" : ""}"><b>${step.done ? "✓" : step.n}</b><span>${esc(step.text)}</span></div>${step.warn ? `<p class="g warn">${esc(step.warn.text)}</p>` : ""}<div class="btns">${btn}</div>
      <div class="kv"><span>Internet</span><b>${S.der?.online ? "działa" : "brak"}</b><span>PoE</span><b>${Object.entries(S.der?.poeUsed || {}).map(([u, w]) => `${w}/${BY_ID[S.devs.find((d) => d.uid === u)?.id]?.poeOut || 0} W`).join(" · ") || "–"}</b></div>
      ${inv.length ? `<h4>Sprzęt do szafy</h4>${inv.map(([id, n]) => `<div class="row"><span>${esc(BY_ID[id].name)} ×${n}</span><button class="btnp w" data-mount="${id}">Zamontuj</button></div>`).join("")}` : ""}
      ${ubq.length ? `<h4>UniFi: adopcja</h4>${ubq.map((d) => `<div class="row"><span>${esc(BY_ID[d.id].name)}</span><button class="btnp w" data-adopt="${d.uid}">Adoptuj</button></div>`).join("")}` : ""}
      <h4>Kolor kabla</h4><div class="cols">${COLORS.map((c) => `<button data-c="${c}" style="background:${c}" class="${c === this.color ? "on" : ""}"></button>`).join("")}</div>
      <p class="keys"><kbd>LPM</kbd> przeciągnij port → port <kbd>PPM</kbd> odepnij <kbd>E</kbd>/<kbd>Esc</kbd> wyjście</p>`;
    const run = (links) => links.forEach((l, i) => setTimeout(() => this.send({ a: "patch", from: l.from, to: l.to, color: l.color }), i * 260));
    const ops = (list) => list.forEach((o, i) => setTimeout(() => (o.unpatch ? this.send({ a: "unpatch", at: o.unpatch }) : this.send({ a: "patch", ...o.patch })), i * 260));
    this.side.querySelectorAll("[data-x]").forEach((b) => (b.onclick = () => {
      const x = b.dataset.x;
      if (x === "link") run([step.link]); else if (x === "all") run(step.all); else if (x === "fix") ops(step.fix); else if (x === "refund") this.send({ a: "refund", id: step.refund }); else if (x === "place") this.place(step.place);
    }));
    this.side.querySelectorAll("[data-mount]").forEach((b) => (b.onclick = () => this.place(b.dataset.mount)));
    this.side.querySelectorAll("[data-adopt]").forEach((b) => (b.onclick = () => this.send({ a: "adopt", uid: b.dataset.adopt })));
    this.side.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { this.color = b.dataset.c; this.drawRack(); }));
    this.update();
  }

  place(id) {
    const it = BY_ID[id];
    if (it.where === "shelf") { this.send({ a: "shelfPut", id }); return; }
    if (!this.data.rack) return;
    const units = this.data.rack.units || 9, n = it.u || 1, occ = new Set();
    for (const d of this.S.devs) if (d.place === "rack") for (let k = 0; k < (BY_ID[d.id].u || 1); k++) occ.add(d.u + k);
    for (let u = units - n; u >= 0; u--) {
      let ok = true;
      for (let k = 0; k < n; k++) if (occ.has(u + k)) ok = false;
      if (ok) { this.send({ a: "rackPut", id, u }); return; }
    }
  }

  dragMove(e) { if (!this.drag) return; this.drag.x = e.clientX; this.drag.y = e.clientY; this.drawDrag(); }

  nearest(x, y, skip) {
    let best = null, bd = 30;
    for (const q of this.portList || []) {
      if (q === skip || q.used) continue;
      const [px, py] = this.proj(q.w);
      const d = Math.hypot(px - x, py - y);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  }

  drawDrag() {
    const svg = this.layer?.querySelector(".st-cable");
    if (!svg || !this.drag) return;
    const [ax, ay] = this.proj(this.drag.q.w);
    const hot = this.nearest(this.drag.x, this.drag.y, this.drag.q);
    const [bx, by] = hot ? this.proj(hot.w) : [this.drag.x, this.drag.y];
    svg.innerHTML = `<path d="M${ax},${ay} C${ax},${ay + 60} ${bx},${by + 60} ${bx},${by}" stroke="${this.color}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    this.drag.hot = hot;
  }

  release() {
    this.sweep = null;
    if (!this.drag) return;
    const d = this.drag;
    this.drag = null;
    const svg = this.layer?.querySelector(".st-cable");
    if (svg) svg.innerHTML = "";
    if (d.hot) this.send({ a: "patch", from: [d.q.uid, d.q.p], to: [d.hot.uid, d.hot.p], color: this.color });
  }

  tablet(S, data, send, openWin, closeWin) {
    const w = document.createElement("div");
    w.className = "win";
    const box = document.createElement("div");
    box.className = "box tabwin";
    w.appendChild(box);
    this.gui.appendChild(w);
    const st = { tab: S.tablet.platform ? "dash" : "system" };
    const render = () => {
      const s = this.tabS || S;
      const plat = s.tablet.platform;
      const pairable = s.devs.filter((d) => s.der?.dev[d.uid]?.pairable && !d.paired);
      const paired = s.devs.filter((d) => d.paired);
      box.innerHTML = `<div class="head"><h2>Tablet</h2><div class="tabs">${["system", "pair", "dash"].map((t) => `<button data-t="${t}" class="${st.tab === t ? "on" : ""}">${{ system: "System", pair: `Parowanie (${pairable.length})`, dash: "Pulpit" }[t]}</button>`).join("")}</div><span class="sp"></span><button class="x">Zamknij</button></div><div class="tb"></div>`;
      const tb = box.querySelector(".tb");
      if (st.tab === "system") {
        const forced = s.job.platform !== "any";
        tb.innerHTML = `<p>${forced ? `Klient chce: <b>${esc(PLATFORMS[s.job.platform].name)}</b>.` : "Klientowi wszystko jedno. Wybierz system:"}</p><div class="btns">${Object.entries(PLATFORMS).map(([k, p]) => `<button class="btnp ${plat === k ? "" : "w"}" data-p="${k}" ${forced && k !== s.job.platform ? "disabled" : ""}>${esc(p.name)}</button>`).join("")}</div>`;
        tb.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => send({ a: "platform", p: b.dataset.p })));
      } else if (st.tab === "pair") {
        tb.innerHTML = plat ? `<div class="btns"><button class="btnp" id="pairall" ${pairable.length ? "" : "disabled"}>Sparuj wszystko (${pairable.length})</button></div><div class="cols2">${s.devs.filter((d) => BY_ID[d.id]?.hubs).map((d) => { const ds = s.der?.dev[d.uid]; return `<div class="row"><span>${esc(BY_ID[d.id].name)}</span><small>${d.paired ? "sparowane" : ds?.pairable ? "gotowe do parowania" : !ds?.pw ? "bez prądu" : !ds?.net ? "bez sieci" : ds?.pair && !ds.pair.ok ? `potrzebny mostek: ${esc(ds.pair.need || "")}` : "niedostępne"}</small></div>`; }).join("")}</div>` : `<p>Najpierw wybierz system.</p>`;
        tb.querySelector("#pairall")?.addEventListener("click", () => send({ a: "pair", uids: pairable.map((d) => d.uid) }));
      } else {
        const cards = (s.tablet.dash?.cards || []).slice();
        tb.innerHTML = `<div class="dashwrap"><canvas width="1180" height="820"></canvas><div class="pal"><h4>Dodaj kafelek</h4>${[["camera", null], ["climate", null], ["light", null], ["energy", null], ["network", null], ["scene", null], ["media", null], ["lock", null], ["sensor", null]].map(([k]) => `<div class="pk"><b>${esc(KIND_LABEL[k])}</b>${paired.filter((d) => cardKindsFor(d.id).includes(k)).slice(0, 6).map((d) => `<button data-k="${k}" data-d="${d.uid}">${esc(BY_ID[d.id].name)}</button>`).join("") || (["energy", "network", "scene"].includes(k) ? `<button data-k="${k}" data-d="">dodaj</button>` : "<small>brak sparowanych</small>")}</div>`).join("")}<p class="g">Kliknij kafelek na tablecie, żeby go usunąć.</p></div></div>`;
        const cv = tb.querySelector("canvas");
        const ctx = cv.getContext("2d");
        const draw = () => renderDash(ctx, 1180, 820, s, data, { grid: true, camImages: window.__camImages || {} });
        draw();
        const free = (w, h) => {
          for (let y = 0; y + h <= ROWS; y++) for (let x = 0; x + w <= COLS; x++) {
            if (!cards.some((c) => x < c.x + c.w && c.x < x + w && y < c.y + c.h && c.y < y + h)) return { x, y };
          }
          return null;
        };
        tb.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => {
          const k = b.dataset.k;
          const [w0, h0] = k === "camera" ? [2, 2] : k === "climate" ? [1, 2] : k === "energy" ? [2, 1] : [1, 1];
          const pos = free(w0, h0) || free(1, 1);
          if (!pos) return;
          cards.push({ id: `c${Date.now().toString(36)}`, kind: k, dev: b.dataset.d || null, x: pos.x, y: pos.y, w: pos ? w0 : 1, h: pos ? h0 : 1 });
          send({ a: "dash", cards });
        }));
        cv.onclick = (e) => {
          const r = cv.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * 1180, y = ((e.clientY - r.top) / r.height) * 820;
          const g = gridRect(1180, 820, plat || "ha");
          const hit = cards.findIndex((c) => { const q = cardRect(g, c); return x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h; });
          if (hit >= 0) { cards.splice(hit, 1); send({ a: "dash", cards }); }
        };
      }
      box.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { st.tab = b.dataset.t; render(); }));
      box.querySelector(".x").onclick = () => closeWin();
    };
    this.tabRender = render;
    openWin({ el: w, close: () => { w.remove(); this.tabRender = null; } });
    render();
  }

  tabUpdate(S) { this.tabS = S; if (this.tabRender) this.tabRender(); }
}

export { firstFreeDin, U };

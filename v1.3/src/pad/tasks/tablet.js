// Instalator: tablet task — pick a spot, level-drill-snap the mount, choose HA / Apple Home / Google Home, pair devices, design the dashboard.

import { BY_ID, PLATFORMS, fmtZl } from "../../shared/catalog.js";
import { icon } from "../../shared/icons.js";
import { $, el, esc, haptic, toast, sheet } from "../ui.js";
import { Plan } from "../plan.js";
import { runGesture } from "../gestures.js";
import { frame, statusWord, whyText } from "./common.js";
import { openShop } from "./shop.js";
import { renderDash, gridRect, cardRect, COLS, ROWS, KIND_LABEL, cardKindsFor } from "../../dash/render.js";

const PLAT_UI = {
  ha: { col: "#18bcf2", t: "HA", d: "Otwarte i najmocniejsze. Łączy wszystko, także kamery UniFi." },
  apple: { col: "#111", t: "", d: "Proste i ładne, ale tylko na iPadzie i z urządzeniami HomeKit albo Matter." },
  google: { col: "#4285f4", t: "G", d: "Prosty Google Home na tablet, działa z Matter i asystentem." }
};

export function mount(root, ctx, taskId, h) {
  const body = frame(root, ctx, "Tablet", "Panel do sterowania domem", h, { cats: ["tablety"] });
  let step = null, selCard = null, plan = null;

  const tabDev = () => ctx.S.devs.find((d) => d.uid === ctx.S.tablet.dev);
  const haveTab = () => Object.keys(ctx.S.inv).find((k) => BY_ID[k]?.caps.includes("tablet") && ctx.S.inv[k] > 0) || (tabDev() ? tabDev().id : null);

  const steps = () => {
    const t = ctx.S.tablet;
    return [
      { id: "spot", name: "Miejsce", done: !!t.dev },
      { id: "mount", name: "Montaż", done: !!t.mount },
      { id: "system", name: "System", done: !!t.platform },
      { id: "pair", name: "Parowanie", done: ctx.S.devs.some((d) => d.paired && d.place !== "tablet") },
      { id: "dash", name: "Pulpit", done: (t.dash?.cards || []).length > 0 }
    ];
  };

  const draw = () => {
    const st = steps();
    if (!step) step = (st.find((s) => !s.done) || st[4]).id;
    body.innerHTML = `<div style="display:flex;gap:6px;overflow-x:auto;margin:-2px -2px 12px;padding:2px">${st.map((s, i) => `<button class="tape ${s.id === step ? "y" : s.done ? "" : ""}" data-s="${s.id}" style="${s.done && s.id !== step ? "background:var(--ok);color:#fff" : ""};flex:none">${i + 1}. ${s.name}</button>`).join("")}</div><div class="stepbody"></div>`;
    body.querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => { haptic(); step = b.dataset.s; draw(); }));
    const sb = $(".stepbody", body);
    ({ spot: drawSpot, mount: drawMount, system: drawSystem, pair: drawPair, dash: drawDash })[step](sb);
  };

  const drawSpot = (sb) => {
    const tab = haveTab();
    const wall = ctx.S.inv["tablet-wall-mount"] || 0, stand = ctx.S.inv["tablet-stand"] || 0;
    sb.innerHTML = `<div class="list">
      <div class="row">${icon("tablet", 26)}<div class="grow"><b>${tab ? esc(BY_ID[tab].name) : "Brak tabletu"}</b><span>${tab ? "w skrzynce" : "kup iPada albo Galaxy Tab"}</span></div>${tab ? `<span class="stat ok">jest</span>` : `<button class="btn y sm buyt">Kup</button>`}</div>
      <div class="row">${icon("drill", 26)}<div class="grow"><b>Uchwyt ścienny</b><span>${esc(BY_ID["tablet-wall-mount"].name)} · ${fmtZl(BY_ID["tablet-wall-mount"].price)}</span></div>${wall ? `<span class="stat ok">×${wall}</span>` : `<button class="btn w sm buyw">Kup</button>`}</div>
      <div class="row">${icon("level", 26)}<div class="grow"><b>Stojak magnetyczny</b><span>${esc(BY_ID["tablet-stand"].name)} · ${fmtZl(BY_ID["tablet-stand"].price)}</span></div>${stand ? `<span class="stat ok">×${stand}</span>` : `<button class="btn w sm buys">Kup</button>`}</div>
    </div>
    <div class="h">Gdzie powiesić? Zielone = dobre miejsce na ścianę</div>
    <div class="plan" style="height:300px;border-radius:16px;overflow:hidden"></div>
    <div class="list spots" style="margin-top:10px"></div>`;
    if ($(".buyt", sb)) $(".buyt", sb).onclick = () => openShop(ctx, ["tablety"]);
    if ($(".buyw", sb)) $(".buyw", sb).onclick = () => { haptic(true); ctx.send({ a: "buy", id: "tablet-wall-mount", n: 1 }); };
    if ($(".buys", sb)) $(".buys", sb).onclick = () => { haptic(true); ctx.send({ a: "buy", id: "tablet-stand", n: 1 }); };
    const spots = ctx.B.tabletSpots || [];
    const floor = spots[0]?.floor ?? 0;
    plan = new Plan($(".plan", sb), ctx.B);
    plan.set({ floor, spots, devs: ctx.S.devs, der: ctx.S.der });
    plan.on("spot", (sp) => pickSpot(sp));
    $(".spots", sb).innerHTML = spots.map((sp) => `<button class="row spot" data-id="${sp.id}" style="text-align:left"><span class="chk" style="border-color:${sp.rating === "good" ? "var(--ok)" : sp.rating === "ok" ? "var(--warn)" : "var(--mute)"};background:${sp.rating === "good" ? "var(--ok)" : sp.rating === "ok" ? "var(--warn)" : "var(--mute)"}"></span><div class="grow"><b>${esc(ctx.B.rooms.find((r) => r.id === sp.room)?.name || "")} · ${sp.kind === "wall" ? "ściana" : "blat"}</b><span>${esc(sp.why || "")}</span></div>${ctx.S.tablet.spot === sp.id ? icon("check", 18, 2.4) : ""}</button>`).join("");
    $(".spots", sb).querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => pickSpot(spots.find((s) => s.id === b.dataset.id))));
  };

  const pickSpot = (sp) => {
    if (!haveTab()) { toast("Najpierw kup tablet."); openShop(ctx, ["tablety"]); return; }
    const need = sp.kind === "wall" ? "tablet-wall-mount" : "tablet-stand";
    if (!ctx.S.inv[need]) {
      sheet(sp.kind === "wall" ? "Potrzebny uchwyt ścienny" : "Potrzebny stojak", (sc, s, close) => {
        sc.innerHTML = `<p style="margin:0 0 14px;color:var(--ink2);line-height:1.4">${sp.kind === "wall" ? "Na ścianę tablet idzie na magnetyczny uchwyt zasilany kablem sieciowym." : "Tu nie ma dobrej ściany, więc tablet stanie na magnetycznym stojaku."} ${esc(BY_ID[need].name)}, ${fmtZl(BY_ID[need].price)}.</p><button class="btn y ok">Kup i wybierz to miejsce</button>`;
        $(".ok", sc).onclick = () => { haptic(true); ctx.send({ a: "buy", id: need, n: 1 }); setTimeout(() => ctx.send({ a: "tabletSpot", spot: sp.id }), 120); close(); step = "mount"; setTimeout(draw, 300); };
      });
      return;
    }
    haptic(true);
    ctx.send({ a: "tabletSpot", spot: sp.id });
    step = "mount";
    setTimeout(draw, 250);
  };

  const drawMount = (sb) => {
    const t = ctx.S.tablet;
    const sp = (ctx.B.tabletSpots || []).find((s) => s.id === t.spot);
    if (!sp) { sb.innerHTML = `<div class="row"><div class="grow"><b>Najpierw wybierz miejsce.</b></div></div>`; return; }
    const wall = sp.kind === "wall";
    sb.innerHTML = `<div class="row" style="margin-bottom:12px">${icon(wall ? "drill" : "tablet", 28)}<div class="grow"><b>${wall ? "Montaż na ścianie" : "Stojak na blacie"}</b><span>${esc(sp.why || "")}</span></div>${t.mount ? `<span class="stat ok">gotowe</span>` : ""}</div>
      ${t.mount ? `<div class="bigtick">${icon("check", 64, 2.6)}</div><button class="btn y nx">Dalej: system</button>` : `<button class="btn y go">${wall ? "Poziomica, wiercenie, magnes" : "Postaw i przyłóż tablet"}</button>`}`;
    if ($(".nx", sb)) $(".nx", sb).onclick = () => { step = "system"; draw(); };
    if ($(".go", sb)) $(".go", sb).onclick = async () => {
      let lv = true;
      if (wall) {
        lv = (await runGesture("level")).ok;
        if (!lv) return;
        if (!(await runGesture("drill", { title: "Wierć dwa otwory" })).ok) return;
      }
      if (!(await runGesture("snap")).ok) return;
      ctx.send({ a: "tabletMount", leveled: lv });
      haptic(true);
      setTimeout(() => { step = "system"; draw(); }, 300);
    };
  };

  const drawSystem = (sb) => {
    const t = ctx.S.tablet;
    const forced = ctx.S.job.platform !== "any";
    const tab = tabDev();
    sb.innerHTML = `${forced ? `<div class="row" style="margin-bottom:12px">${icon("tablet", 24)}<div class="grow"><b>Klient chce: ${esc(PLATFORMS[ctx.S.job.platform].name)}</b><span>To jest w umowie.</span></div></div>` : `<div class="h" style="margin-top:0">Klient zostawia wybór tobie</div>`}
      <div class="plat">${["ha", "apple", "google"].map((p) => {
        const dis = (forced && p !== ctx.S.job.platform) || (p === "apple" && tab && BY_ID[tab.id].os !== "ipados");
        return `<button class="platc ${t.platform === p ? "on" : ""}" data-p="${p}" ${dis ? "disabled" : ""}><span class="lg" style="background:${PLAT_UI[p].col}">${p === "apple" ? icon("home", 26, 2.4) : PLAT_UI[p].t}</span><div><b>${esc(PLATFORMS[p].name)}</b><span>${esc(PLAT_UI[p].d)}${p === "apple" && tab && BY_ID[tab.id].os !== "ipados" ? " Twój tablet to Android." : ""}</span></div></button>`;
      }).join("")}</div>
      ${t.platform ? controllerRow(t.platform) : ""}`;
    sb.querySelectorAll(".platc").forEach((b) => (b.onclick = () => { if (b.disabled) return; haptic(true); if (!forced) ctx.send({ a: "platform", p: b.dataset.p }); setTimeout(draw, 200); }));
    if ($(".buyc", sb)) $(".buyc", sb).onclick = () => openShop(ctx, ["centrale", "multimedia"]);
    if ($(".nx", sb)) $(".nx", sb).onclick = () => { step = "pair"; draw(); };
  };

  const controllerRow = (p) => {
    const ctr = PLATFORMS[p].controllers;
    const have = ctx.S.devs.find((d) => ctr.includes(d.id));
    const live = have && ctx.S.der?.dev[have.uid]?.net;
    return `<div class="h">Centrala systemu</div><div class="row">${icon("hub", 26)}<div class="grow"><b>${have ? esc(BY_ID[have.id].name) : ctr.map((c) => BY_ID[c].name).join(" albo ")}</b><span>${have ? (live ? "działa" : "zamontowana, ale bez sieci") : "potrzebna, żeby wszystko działało z tabletu"}</span></div>${have ? `<span class="stat ${live ? "ok" : "warn"}">${live ? "ok" : "sieć?"}</span>` : `<button class="btn y sm buyc">Kup</button>`}</div><div style="margin-top:12px"><button class="btn nx">Dalej: parowanie</button></div>`;
  };

  const drawPair = (sb) => {
    const smart = ctx.S.devs.filter((d) => BY_ID[d.id]?.hubs && d.place !== "tablet");
    if (!ctx.S.tablet.platform) { sb.innerHTML = `<div class="row"><div class="grow"><b>Najpierw wybierz system.</b></div></div>`; return; }
    const pairable = smart.filter((d) => !d.paired && ctx.S.der?.dev[d.uid]?.pairable);
    sb.innerHTML = `<div class="scan">${pairable.length ? "<i></i>" : ""}<div style="position:absolute;inset:0;display:grid;place-items:center;color:#f3cf45">${icon("hub", 64, 1.6)}</div></div>
      <div style="text-align:center;margin:6px 0 12px;color:var(--ink2)">${pairable.length ? `Wykryto ${pairable.length} ${pairable.length === 1 ? "urządzenie" : "urządzeń"} do dodania` : "Nic nowego w zasięgu"}</div>
      ${pairable.length > 1 ? `<button class="btn y all" style="width:100%;margin-bottom:12px">Dodaj wszystkie (${pairable.length})</button>` : ""}
      <div class="list">${smart.map((d) => { const sw = statusWord(ctx, d); const ok = ctx.S.der?.dev[d.uid]?.pairable; return `<div class="row"><div class="grow"><b>${esc(BY_ID[d.id].name)}</b><span>${esc(ctx.B.rooms.find((r) => r.id === d.room)?.name || (d.room === "outdoor" ? "na zewnątrz" : d.place === "din" ? "rozdzielnica" : "szafa"))}${!d.paired && !ok ? ` · ${esc(whyText(ctx, d))}` : ""}</span></div>${d.paired ? `<span class="stat ok">w systemie</span>` : ok ? `<button class="btn y sm" data-pair="${d.uid}">Dodaj</button>` : `<span class="stat ${sw.c}">${esc(sw.t)}</span>`}</div>`; }).join("") || `<div class="row"><div class="grow"><span>Najpierw zamontuj urządzenia smart w pokojach.</span></div></div>`}</div>
      <div style="margin-top:12px"><button class="btn nx">Dalej: pulpit</button></div>`;
    sb.querySelectorAll("[data-pair]").forEach((b) => (b.onclick = () => { haptic(); b.textContent = "…"; setTimeout(() => { haptic(true); ctx.send({ a: "pair", uid: b.dataset.pair }); }, 650); }));
    if ($(".all", sb)) $(".all", sb).onclick = () => { haptic(true); ctx.send({ a: "pair", uids: pairable.map((d) => d.uid) }); };
    $(".nx", sb).onclick = () => { step = "dash"; draw(); };
  };

  let dashCards = null;
  const drawDash = (sb) => {
    const t = ctx.S.tablet;
    if (!t.platform) { sb.innerHTML = `<div class="row"><div class="grow"><b>Najpierw wybierz system.</b></div></div>`; return; }
    if (!dashCards) dashCards = (t.dash?.cards || []).map((c) => ({ ...c }));
    sb.innerHTML = `<div class="dashwrap" style="padding:0"><canvas class="dash"></canvas></div>
      <div class="h">Kafelki · stuknij, żeby dodać</div><div class="palette" style="margin:0 -14px"></div>
      <div class="selbar" style="display:none;gap:10px;margin-top:8px"><button class="btn w sm bigger">Rozmiar</button><button class="btn w sm del">Usuń</button></div>`;
    const cv = $(".dash", sb);
    const W = 1180, H = 820;
    cv.width = W; cv.height = H;
    const paint = () => renderDash(cv.getContext("2d"), W, H, ctx.S, ctx.B, { cards: dashCards, grid: true, selected: selCard });
    const sync = () => { ctx.send({ a: "dash", cards: dashCards }); };
    const free = (w, hh) => {
      for (let y = 0; y <= ROWS - hh; y++) for (let x = 0; x <= COLS - w; x++) if (!dashCards.some((c) => x < c.x + c.w && c.x < x + w && y < c.y + c.h && c.y < y + hh)) return { x, y };
      return null;
    };
    const pal = [];
    for (const d of ctx.S.devs.filter((x) => x.paired && x.place !== "tablet")) for (const k of cardKindsFor(d.id)) pal.push({ kind: k, dev: d.uid, label: `${KIND_LABEL[k]} · ${ctx.B.rooms.find((r) => r.id === d.room)?.name || (d.room === "outdoor" ? "zewn." : BY_ID[d.id].name.split(" ").slice(-1)[0])}` });
    pal.push({ kind: "scene", dev: null, label: "Scena · Wieczór" }, { kind: "network", dev: null, label: "Sieć UniFi" });
    const pHost = $(".palette", sb);
    pHost.innerHTML = pal.map((p, i) => `<button class="pcard ${dashCards.some((c) => c.kind === p.kind && c.dev === p.dev) ? "used" : ""}" data-i="${i}">${icon({ light: "bulb", camera: "cam", climate: "temp", energy: "energy", lock: "lock", scene: "scene", network: "net", media: "media", sensor: "sensor" }[p.kind] || "box", 22)}<b>${esc(p.label)}</b></button>`).join("");
    pHost.querySelectorAll(".pcard").forEach((b) => (b.onclick = () => {
      const p = pal[Number(b.dataset.i)];
      const size = p.kind === "camera" ? [2, 1] : p.kind === "climate" ? [1, 2] : [1, 1];
      let pos = free(size[0], size[1]) || free(1, 1);
      if (!pos) { toast("Pulpit jest pełny. Usuń albo zmniejsz kafelek."); return; }
      const fit = free(size[0], size[1]) ? size : [1, 1];
      dashCards.push({ id: `c${Date.now() % 1e6}${dashCards.length}`, kind: p.kind, dev: p.dev, x: pos.x, y: pos.y, w: fit[0], h: fit[1] });
      haptic(true); paint(); sync(); drawDash(sb);
    }));
    const selbar = $(".selbar", sb);
    const showSel = () => { selbar.style.display = selCard ? "flex" : "none"; paint(); };
    $(".del", sb).onclick = () => { dashCards = dashCards.filter((c) => c.id !== selCard); selCard = null; haptic(); showSel(); sync(); drawDash(sb); };
    $(".bigger", sb).onclick = () => {
      const c = dashCards.find((x) => x.id === selCard);
      if (!c) return;
      const sizes = [[1, 1], [2, 1], [2, 2], [1, 2]];
      const i = sizes.findIndex((s) => s[0] === c.w && s[1] === c.h);
      for (let k = 1; k <= 4; k++) {
        const [w, hh] = sizes[(i + k) % 4];
        if (c.x + w <= COLS && c.y + hh <= ROWS && !dashCards.some((o) => o !== c && c.x < o.x + o.w && o.x < c.x + w && c.y < o.y + o.h && o.y < c.y + hh)) { c.w = w; c.h = hh; break; }
      }
      haptic(); paint(); sync();
    };
    const toGrid = (e) => {
      const r = cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
      const g = gridRect(W, H, t.platform);
      return { x, y, g, gx: Math.floor((x - g.x) / (g.cw + g.gap)), gy: Math.floor((y - g.y) / (g.ch + g.gap)) };
    };
    let drag = null;
    cv.addEventListener("pointerdown", (e) => {
      const p = toGrid(e);
      const hit = dashCards.find((c) => { const cr = cardRect(p.g, c); return p.x >= cr.x && p.x <= cr.x + cr.w && p.y >= cr.y && p.y <= cr.y + cr.h; });
      selCard = hit ? hit.id : null;
      if (hit) { cv.setPointerCapture(e.pointerId); drag = { c: hit, ox: p.gx - hit.x, oy: p.gy - hit.y }; haptic(); }
      showSel();
    });
    cv.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const p = toGrid(e);
      const nx = Math.max(0, Math.min(COLS - drag.c.w, p.gx - drag.ox)), ny = Math.max(0, Math.min(ROWS - drag.c.h, p.gy - drag.oy));
      if ((nx !== drag.c.x || ny !== drag.c.y) && !dashCards.some((o) => o !== drag.c && nx < o.x + o.w && o.x < nx + drag.c.w && ny < o.y + o.h && o.y < ny + drag.c.h)) { drag.c.x = nx; drag.c.y = ny; haptic(); paint(); }
    });
    const up = () => { if (drag) { drag = null; sync(); } };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    showSel();
  };

  draw();
  return { update() { if (step === "dash") { const sb = $(".stepbody", body); if (sb) { const cv = $(".dash", sb); if (cv) renderDash(cv.getContext("2d"), 1180, 820, ctx.S, ctx.B, { cards: dashCards || ctx.S.tablet.dash.cards, grid: true, selected: selCard }); } return; } if (step === "spot" && plan) { plan.set({ devs: ctx.S.devs, der: ctx.S.der }); } draw(); } };
}

// Instalator: electrical panel task — flip breakers (tap or sweep a row), label circuits, snap Shelly DIN modules, wire channels.

import { BY_ID } from "../../shared/catalog.js";
import { panelLayout, panelFree, circuitLive } from "../../shared/sim.js";
import { icon } from "../../shared/icons.js";
import { $, el, esc, haptic, toast, sheet } from "../ui.js";
import { frame, invList, tray } from "./common.js";
import { createFront } from "../front3d.js";

export function mount(root, ctx, taskId, h) {
  const body = frame(root, ctx, "Rozdzielnica", "Pstrykaj i patrz na telewizor", h, { cats: ["rozdzielnica"] });
  const lay = panelLayout(ctx.B);
  let sel = null;
  body.innerHTML = `<div class="guide"></div><div class="h"><span id="pwr"></span><span id="lit"></span></div><div class="rackbox"><div class="rack3d panel3d"><div class="inner"><div class="ovl"></div></div><div class="loading">Ładuję rozdzielnicę…</div></div><div class="zoom"><button data-z="-">${icon("minus", 18, 2.4)}</button><button data-z="+">${icon("plus", 18, 2.4)}</button></div></div><div class="h">Moduły na szynę DIN</div><div class="tray" style="border:0;background:none;padding:0;margin:0 -14px"></div><div class="h">Obwody</div><div class="list circ"></div>`;
  const wrap = $(".panel3d", body), inner = $(".inner", wrap), ovl = $(".ovl", wrap), trayHost = $(".tray", body);
  let F = null, enc = null, zoom = 1, alive = true;
  const models = new Map();
  const bk = new Map();
  body.querySelectorAll(".zoom button").forEach((b) => (b.onclick = () => { zoom = b.dataset.z === "+" ? Math.min(3, zoom + 1) : Math.max(1, zoom - 1); haptic(); layout(); }));

  const label = (cid) => {
    const r = ctx.S.panel.labels[cid];
    if (!r) return "?";
    const room = ctx.B.rooms.find((x) => x.id === r);
    return room ? room.name.slice(0, 4).toUpperCase() : "?";
  };

  const stateOf = (it) => it.kind === "main" ? ctx.S.panel.main : it.kind === "rcd" ? !!ctx.S.panel.rcd[it.rcd] : !!ctx.S.panel.br[it.circuit];
  const keyOf = (it) => it.kind === "main" ? "main" : it.kind === "rcd" ? `rcd${it.rcd}` : `mcb:${it.circuit}`;

  const guide = () => {
    const S = ctx.S, p = S.panel;
    const circs = ctx.B.circuits || [];
    const offs = circs.filter((c) => !p.br[c.id]).length;
    const mod = Object.keys(S.inv).find((id) => S.inv[id] > 0 && BY_ID[id]?.where === "din");
    const unwired = S.devs.find((d) => d.place === "din" && d.ch && d.ch.length && d.ch.every((c) => !c));
    const needLabels = S.job?.reqs.some((r) => r.type === "labels") && circs.some((c) => !p.labels[c.id]);
    let n = 0, t = "", done = false;
    if (mod && p.main) { n = 1; t = `Masz w skrzynce ${BY_ID[mod].name}. Najpierw wyłącz GŁÓWNY, potem stuknij moduł i zielone miejsce na szynie.`; }
    else if (mod) { n = 1; t = `Stuknij ${BY_ID[mod].name} w skrzynce, potem zielone miejsce na szynie.`; }
    else if (unwired && !p.main) { n = 2; t = "Stuknij zamontowany moduł Shelly i przypisz kanały do obwodów światła."; }
    else if (!p.main) { n = 3; t = "Włącz rozłącznik GŁÓWNY: stuknij go."; }
    else if (!p.rcd[0]) { n = 4; t = "Włącz różnicówkę RCD obok."; }
    else if (offs) { n = 5; t = `Przeciągnij palcem po rzędzie bezpieczników, żeby włączyć wszystkie (${offs} wył.). Patrz, jak zapalają się pokoje.`; }
    else if (needLabels) { n = 6; t = "Podpisz obwody: wyłącz jeden bezpiecznik, zobacz na telewizorze, co zgasło, i stuknij jego żółtą etykietę."; }
    else { done = true; t = "Rozdzielnica gotowa: wszystko pod prądem."; }
    $(".guide", body).innerHTML = `<div class="gcard ${done ? "ok" : ""}"><span class="gn">${done ? icon("check", 18, 3) : n}</span><div class="gt">${esc(t)}</div></div>`;
  };

  const modelId = (it) => it.kind === "main" ? "main-switch" : it.kind === "rcd" ? "rcd" : (() => { const b = ctx.B.circuits.find((c) => c.id === it.circuit)?.breaker || "B16"; return b === "B10" ? "mcb-b10" : b === "C20" ? "mcb-c20" : "mcb-b16"; })();
  const railPos = (row, slot, mod) => {
    const rails = enc.userData.rails || [];
    const r = rails[Math.min(row, rails.length - 1)] || { y: 0, x0: -0.1, z: 0.05 };
    return [r.x0 + (slot + mod / 2) * 0.0175, r.y, r.z || 0];
  };

  const build = async () => {
    F = await createFront(inner, { bg: "#dcd7cd" });
    if (!alive) { F.dispose(); return; }
    $(".loading", wrap)?.remove();
    enc = F.DM.buildDevice("panel-enclosure", { rows: lay.rows, slotsPerRow: lay.per });
    if (enc.userData.door) enc.userData.door.visible = false;
    F.scene.add(enc);
    for (const it of lay.items) {
      const m = F.DM.buildDevice(modelId(it), {});
      m.position.set(...railPos(it.row, it.slot, it.mod));
      enc.add(m);
      bk.set(keyOf(it), { m, it, cur: null });
    }
    sync(true);
    layout();
  };

  const sync = (instant = false) => {
    if (!F) return;
    const S = ctx.S;
    const din = S.devs.filter((d) => d.place === "din");
    const ids = new Set(din.map((d) => d.uid));
    for (const [uid, m] of models) if (!ids.has(uid)) { enc.remove(m); models.delete(uid); }
    for (const d of din) {
      if (!models.has(d.uid)) { const m = F.DM.buildDevice(d.id, {}); m.position.set(...railPos(d.row, d.slot, BY_ID[d.id]?.mod || 1)); enc.add(m); models.set(d.uid, m); }
      const live = S.der?.dev[d.uid]?.pw;
      for (const l of models.get(d.uid).userData.leds || []) if (l.material) l.material.emissiveIntensity = live ? 1.4 : 0;
    }
    let moving = false;
    for (const b of bk.values()) {
      const lev = b.m.userData.lever;
      if (!lev) continue;
      const target = stateOf(b.it) ? 0 : (lev.userData?.off ?? 0.95);
      if (instant || b.cur == null) { lev.rotation.x = target; b.cur = target; continue; }
      if (Math.abs(b.cur - target) > 0.001) { b.from = lev.rotation.x; b.cur = target; b.t0 = performance.now(); moving = true; }
    }
    if (moving) {
      const tick = (now) => {
        let busy = false;
        for (const b of bk.values()) {
          const lev = b.m.userData.lever;
          if (!lev || b.t0 == null) continue;
          const k = Math.min(1, (now - b.t0) / 140);
          lev.rotation.x = b.from + (b.cur - b.from) * (1 - Math.pow(1 - k, 3));
          if (k < 1) busy = true; else b.t0 = null;
        }
        F.render();
        if (busy && alive) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  };

  const layout = () => {
    if (!F || !enc) return;
    const T = F.THREE;
    enc.updateMatrixWorld(true);
    const rails = enc.userData.rails || [];
    const box = new T.Box3();
    if (rails.length) {
      for (const r of rails.slice(0, lay.rows)) {
        box.expandByPoint(enc.localToWorld(new T.Vector3(r.x0 - 0.012, r.y + 0.07, r.z || 0)));
        box.expandByPoint(enc.localToWorld(new T.Vector3(r.x0 + lay.per * 0.0175 + 0.012, r.y - 0.075, r.z || 0)));
      }
    } else box.setFromObject(enc);
    const W = wrap.clientWidth || 340;
    const bw = box.max.x - box.min.x, bh = box.max.y - box.min.y;
    const H = Math.round(W * zoom * (bh / bw));
    inner.style.width = `${W * zoom}px`;
    inner.style.height = `${H}px`;
    wrap.style.height = `${Math.min(H, Math.round(innerHeight * 0.58))}px`;
    F.size(W * zoom, H);
    F.frame((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (bw / 2) * 1.03);
    overlays();
    F.render();
  };

  const rect = (obj) => {
    const T = F.THREE;
    const b = new T.Box3().setFromObject(obj);
    const a = F.project(new T.Vector3(b.min.x, b.max.y, b.max.z)), c = F.project(new T.Vector3(b.max.x, b.min.y, b.max.z));
    return { x: a[0], y: a[1], w: c[0] - a[0], h: c[1] - a[1] };
  };

  const overlays = () => {
    if (!F) return;
    enc.updateMatrixWorld(true);
    let html = "";
    for (const [k, b] of bk) {
      const r = rect(b.m);
      html += `<span class="bk3" data-k="${k}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px"></span>`;
      if (b.it.kind === "mcb") html += `<span class="lab3 ${ctx.S.panel.labels[b.it.circuit] ? "" : "q"}" data-c="${b.it.circuit}" style="left:${r.x + r.w / 2}px;top:${r.y + r.h + 3}px">${esc(label(b.it.circuit))}</span>`;
    }
    for (const [uid, m] of models) {
      const r = rect(m);
      html += `<span class="md3" data-uid="${uid}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px"></span>`;
    }
    if (sel) {
      const T = F.THREE;
      const mod = BY_ID[sel].mod || 1;
      for (let r = 0; r < lay.rows; r++) for (let sl = 0; sl + mod <= lay.per; sl++) {
        if (!panelFree(lay, mod, r, sl, ctx.S.devs)) continue;
        const [x, y, z] = railPos(r, sl, mod);
        const a = F.project(enc.localToWorld(new T.Vector3(x - mod * 0.0087, y + 0.045, z)));
        const c = F.project(enc.localToWorld(new T.Vector3(x + mod * 0.0087, y - 0.045, z)));
        html += `<span class="slot3" data-r="${r}" data-s="${sl}" style="left:${a[0]}px;top:${a[1]}px;width:${c[0] - a[0]}px;height:${c[1] - a[1]}px"></span>`;
        sl += mod - 1;
      }
    }
    ovl.innerHTML = html;
    ovl.querySelectorAll(".slot3").forEach((e) => (e.onclick = () => {
      if (ctx.S.panel.main) toast("Najpierw wyłącz zasilanie główne!", true); else haptic(true);
      ctx.send({ a: "dinPut", id: sel, row: Number(e.dataset.r), slot: Number(e.dataset.s) });
      if (!ctx.S.panel.main && (ctx.S.inv[sel] || 1) <= 1) sel = null;
    }));
    ovl.querySelectorAll(".lab3").forEach((l) => (l.onclick = (e) => { e.stopPropagation(); labelSheet(l.dataset.c); }));
    ovl.querySelectorAll(".md3").forEach((m) => (m.onclick = () => moduleSheet(m.dataset.uid)));
  };

  const draw = () => {
    guide();
    $("#pwr", body).innerHTML = ctx.S.panel.main ? `<span class="tape" style="background:var(--ok);color:#fff">zasilanie wł.</span>` : `<span class="tape">zasilanie wył.</span>`;
    const lit = (ctx.B.circuits || []).filter((c) => circuitLive(ctx.S, ctx.B, c.id)).length;
    $("#lit", body).textContent = `obwody ${lit}/${(ctx.B.circuits || []).length}`;
    if (F) { sync(); overlays(); F.render(); }
    const list = $(".circ", body);
    list.innerHTML = (ctx.B.circuits || []).map((c) => {
      const live = circuitLive(ctx.S, ctx.B, c.id);
      const lab = ctx.S.panel.labels[c.id];
      const room = lab ? ctx.B.rooms.find((r) => r.id === lab) : null;
      const right = lab ? c.rooms.includes(lab) : null;
      return `<div class="row" data-c="${c.id}"><span class="chk ${live ? "on" : ""}">${live ? icon("bolt", 13, 2.4) : ""}</span><div class="grow"><b>${esc(c.breaker)} · ${c.kind === "light" ? "światło" : c.kind === "socket" ? "gniazdka" : c.kind === "heating" ? "ogrzewanie" : "urządzenie"}</b><span>${room ? `opis: ${esc(room.name)}${right === false && ctx.S.job.reqs.some((r) => r.type === "labels") ? " (sprawdź!)" : ""}` : "bez opisu: stuknij, żeby podpisać"}</span></div>${icon("plus", 18, 2)}</div>`;
    }).join("");
    list.querySelectorAll(".row").forEach((r) => (r.onclick = () => labelSheet(r.dataset.c)));
    tray(trayHost, ctx, invList(ctx, (it) => it.where === "din"), sel, (id) => { sel = id; draw(); }, { cats: ["rozdzielnica"], hint: sel ? (ctx.S.panel.main ? "Wyłącz GŁÓWNY, potem stuknij zielone miejsce" : "Stuknij zielone miejsce na szynie") : "Moduły ze skrzynki" });
  };

  const labelSheet = (cid) => {
    const c = ctx.B.circuits.find((x) => x.id === cid);
    sheet("Opisz obwód", (sc, s, close) => {
      sc.innerHTML = `<p style="margin:0 0 12px;color:var(--ink2);line-height:1.4">Bezpiecznik ${esc(c.breaker)}. Wyłącz go i zobacz na telewizorze, co zgaśnie. Potem wybierz pomieszczenie.</p><div class="list">${ctx.B.rooms.filter((r) => r.kind !== "outdoor").map((r) => `<button class="row" data-r="${r.id}" style="text-align:left"><div class="grow"><b>${esc(r.name[0].toUpperCase() + r.name.slice(1))}</b></div>${ctx.S.panel.labels[cid] === r.id ? icon("check", 18, 2.4) : ""}</button>`).join("")}</div>`;
      sc.querySelectorAll("[data-r]").forEach((b) => (b.onclick = () => { haptic(); ctx.send({ a: "label", circuit: cid, room: b.dataset.r }); close(); }));
    });
  };

  const moduleSheet = (uid) => {
    const d = ctx.S.devs.find((x) => x.uid === uid);
    if (!d) return;
    const it = BY_ID[d.id];
    sheet(it.name, (sc, s, close) => {
      const lights = (ctx.B.circuits || []).filter((c) => c.kind === "light" || (it.caps.includes("blinds") && c.kind !== "socket"));
      const drawS = () => {
        const cur = ctx.S.devs.find((x) => x.uid === uid) || d;
        sc.innerHTML = `<p style="margin:0 0 12px;color:var(--ink2);line-height:1.4">${esc(it.desc)} ${ctx.S.panel.main ? "<b>Zasilanie jest włączone: przewody podepniesz po wyłączeniu głównego.</b>" : ""}</p>
          ${(cur.ch || []).map((c, i) => `<div class="h">Kanał O${i + 1}</div><div class="list">${lights.map((lc) => `<button class="row" data-ch="${i}" data-c="${lc.id}" style="text-align:left"><span class="chk ${c === lc.id ? "on" : ""}">${c === lc.id ? icon("check", 13, 3) : ""}</span><div class="grow"><b>${esc(lc.breaker)} · ${esc(ctx.S.panel.labels[lc.id] ? ctx.B.rooms.find((r) => r.id === ctx.S.panel.labels[lc.id])?.name || lc.id : "obwód " + lc.id)}</b></div></button>`).join("")}</div>`).join("") || `<div class="row"><div class="grow"><b>${it.caps.includes("energy") ? "Mierzy cały dom" : "Chroni instalację"}</b><span>Nic nie trzeba podpinać.</span></div></div>`}
          <div style="display:flex;gap:10px;margin-top:14px"><button class="btn w sm rm">${icon("undo", 18, 2)} Zdejmij</button></div>`;
        sc.querySelectorAll("[data-ch]").forEach((b) => (b.onclick = () => { haptic(); ctx.send({ a: "dinCh", uid, ch: Number(b.dataset.ch), circuit: b.dataset.c }); setTimeout(drawS, 180); }));
        $(".rm", sc).onclick = () => { ctx.send({ a: "uninstall", uid }); close(); };
      };
      drawS();
    });
  };

  let sweep = null;
  const flip = (k, on) => {
    const b = bk.get(k);
    if (!b) return;
    haptic(true);
    ctx.send({ a: "breaker", key: k, on });
    if (k === "main") ctx.S.panel.main = on; else if (k.startsWith("rcd")) ctx.S.panel.rcd[Number(k.slice(3))] = on; else ctx.S.panel.br[k.slice(4)] = on;
    sync();
  };
  inner.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".bk3");
    if (!b) return;
    inner.setPointerCapture(e.pointerId);
    const it = bk.get(b.dataset.k).it;
    const target = !stateOf(it);
    sweep = { target, done: new Set([b.dataset.k]) };
    flip(b.dataset.k, target);
    e.preventDefault();
  });
  inner.addEventListener("pointermove", (e) => {
    if (!sweep) return;
    const t = document.elementFromPoint(e.clientX, e.clientY)?.closest(".bk3");
    if (!t || sweep.done.has(t.dataset.k)) return;
    sweep.done.add(t.dataset.k);
    flip(t.dataset.k, sweep.target);
  });
  const end = () => { sweep = null; };
  inner.addEventListener("pointerup", end);
  inner.addEventListener("pointercancel", end);
  const ro = new ResizeObserver(() => layout());
  ro.observe(wrap);
  build().catch((e) => { console.error(e); const l = $(".loading", wrap); if (l) l.textContent = "Nie udało się wczytać rozdzielnicy 3D."; });

  requestAnimationFrame(draw);
  return { update() { if (!sweep) draw(); }, destroy() { alive = false; ro.disconnect(); if (F) F.dispose(); } };
}

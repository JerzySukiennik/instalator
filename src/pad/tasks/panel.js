// Instalator: electrical panel task — flip breakers (tap or sweep a row), label circuits, snap Shelly DIN modules, wire channels.

import { BY_ID } from "../../shared/catalog.js";
import { panelLayout, panelFree, circuitLive } from "../../shared/sim.js";
import { icon } from "../../shared/icons.js";
import { $, el, esc, haptic, toast, sheet } from "../ui.js";
import { frame, invList, tray } from "./common.js";

export function mount(root, ctx, taskId, h) {
  const body = frame(root, ctx, "Rozdzielnica", "Pstrykaj i patrz na telewizor", h, { cats: ["rozdzielnica"] });
  const lay = panelLayout(ctx.B);
  let sel = null;
  body.innerHTML = `<div class="guide"></div><div class="h"><span id="pwr"></span><span id="lit"></span></div><div class="panelv"></div><div class="h">Moduły na szynę DIN</div><div class="tray" style="border:0;background:none;padding:0;margin:0 -14px"></div><div class="h">Obwody</div><div class="list circ"></div>`;
  const pv = $(".panelv", body), trayHost = $(".tray", body);

  const label = (cid) => {
    const r = ctx.S.panel.labels[cid];
    if (!r) return "?";
    const room = ctx.B.rooms.find((x) => x.id === r);
    return room ? room.name.slice(0, 6).toUpperCase() : "?";
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

  const draw = () => {
    guide();
    const W = pv.clientWidth - 20 || 320;
    const sw = W / lay.per;
    $("#pwr", body).innerHTML = ctx.S.panel.main ? `<span class="tape" style="background:var(--ok);color:#fff">zasilanie wł.</span>` : `<span class="tape">zasilanie wył.</span>`;
    const lit = (ctx.B.circuits || []).filter((c) => circuitLive(ctx.S, ctx.B, c.id)).length;
    $("#lit", body).textContent = `obwody ${lit}/${(ctx.B.circuits || []).length}`;
    let html = "";
    for (let r = 0; r < lay.rows; r++) {
      html += `<div class="dinrow" data-row="${r}"><div class="rail"></div>`;
      for (let s = 0; s < lay.per; s++) {
        if (sel && panelFree(lay, BY_ID[sel].mod || 1, r, s, ctx.S.devs)) html += `<div class="slot drop" data-r="${r}" data-s="${s}" style="left:${s * sw}px;width:${sw * (BY_ID[sel].mod || 1) - 2}px"></div>`;
      }
      for (const it of lay.items.filter((x) => x.row === r)) {
        const on = stateOf(it);
        const t = it.kind === "main" ? "GŁÓWNY" : it.kind === "rcd" ? "RCD 30mA" : (ctx.B.circuits.find((c) => c.id === it.circuit)?.breaker || "B16");
        html += `<div class="din ${it.kind} ${on ? "on" : "off"}" data-k="${keyOf(it)}" style="left:${it.slot * sw + 1}px;width:${it.mod * sw - 2}px"><span class="t">${t}</span><div class="lev"><i></i></div>${it.kind === "mcb" ? `<span class="lab" data-c="${it.circuit}">${esc(label(it.circuit))}</span>` : `<span class="t">${it.kind === "main" ? "I/O" : "T"}</span>`}</div>`;
      }
      for (const d of ctx.S.devs.filter((x) => x.place === "din" && x.row === r)) {
        const it = BY_ID[d.id];
        const live = ctx.S.der?.dev[d.uid]?.pw;
        html += `<div class="din mod ${live ? "" : "off"}" data-uid="${d.uid}" style="left:${d.slot * sw + 1}px;width:${(it.mod || 1) * sw - 2}px"><span class="t">SHELLY</span><span class="led"></span><span class="t">${esc(it.name.replace("Shelly ", "").replace("Ogranicznik przepięć ", ""))}</span></div>`;
      }
      html += `</div>`;
    }
    pv.innerHTML = html;
    pv.querySelectorAll(".slot.drop").forEach((s) => (s.onclick = () => {
      if (ctx.S.panel.main) { toast("Najpierw wyłącz zasilanie główne!", true); ctx.send({ a: "dinPut", id: sel, row: Number(s.dataset.r), slot: Number(s.dataset.s) }); return; }
      haptic(true);
      ctx.send({ a: "dinPut", id: sel, row: Number(s.dataset.r), slot: Number(s.dataset.s) });
      if ((ctx.S.inv[sel] || 1) <= 1) sel = null;
    }));
    pv.querySelectorAll(".din .lab").forEach((l) => (l.onclick = (e) => { e.stopPropagation(); labelSheet(l.dataset.c); }));
    pv.querySelectorAll(".din.mod").forEach((m) => (m.onclick = () => moduleSheet(m.dataset.uid)));
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
  pv.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".din:not(.mod)");
    if (!b || e.target.closest(".lab")) return;
    pv.setPointerCapture(e.pointerId);
    const key = b.dataset.k;
    const it = lay.items.find((x) => keyOf(x) === key);
    const target = !stateOf(it);
    sweep = { target, done: new Set([key]), y0: e.clientY };
    haptic(true);
    ctx.send({ a: "breaker", key, on: target });
    b.classList.toggle("on", target); b.classList.toggle("off", !target);
  });
  pv.addEventListener("pointermove", (e) => {
    if (!sweep) return;
    const t = document.elementFromPoint(e.clientX, e.clientY)?.closest(".din:not(.mod)");
    if (!t || sweep.done.has(t.dataset.k)) return;
    sweep.done.add(t.dataset.k);
    haptic(true);
    ctx.send({ a: "breaker", key: t.dataset.k, on: sweep.target });
    t.classList.toggle("on", sweep.target); t.classList.toggle("off", !sweep.target);
  });
  const end = () => { sweep = null; };
  pv.addEventListener("pointerup", end);
  pv.addEventListener("pointercancel", end);
  pv.style.touchAction = "none";

  requestAnimationFrame(draw);
  return { update() { if (!sweep) draw(); } };
}

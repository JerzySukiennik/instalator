// Instalator: Wi-Fi task — drag an access point over the plan with a live coverage heatmap, then drill it in.

import { BY_ID } from "../../shared/catalog.js";
import { wifiGrid } from "../../shared/geom.js";
import { icon } from "../../shared/icons.js";
import { $, el, haptic, toast } from "../ui.js";
import { Plan } from "../plan.js";
import { runGesture } from "../gestures.js";
import { frame, invList, tray, deviceSheet, afterPoe } from "./common.js";

export function mount(root, ctx, taskId, h) {
  const body = frame(root, ctx, "Wi-Fi", "Przeciągnij punkt dostępowy, patrz na zasięg", h, { flush: true, cats: ["siec"] });
  body.innerHTML = `<div class="plan"></div><div class="tray"></div>`;
  const planHost = $(".plan", body), trayHost = $(".tray", body);
  const plan = new Plan(planHost, ctx.B);
  let floor = 0, sel = null, ghost = null, busy = false;
  const floors = ctx.B.floors.length > 1 ? el(`<div class="floors">${ctx.B.floors.map((f) => `<button data-f="${f.index}">${f.name || `Piętro ${f.index}`}</button>`).join("")}</div>`) : null;
  if (floors) {
    planHost.appendChild(floors);
    floors.querySelectorAll("button").forEach((b) => (b.onclick = () => { floor = Number(b.dataset.f); haptic(); ctx.stream({ t: "floor", floor }); draw(); }));
  }
  const cov = el(`<div class="cov"><b>0%</b><span>zasięgu w domu</span><small class="why" hidden></small><button class="btn y sm go" hidden>Napraw w szafie</button></div>`);
  planHost.appendChild(cov);
  $(".go", cov).onclick = () => { haptic(); ctx.openTask("rack"); };
  const outdoorAp = () => (BY_ID[sel]?.wifi?.outdoor);

  const apList = () => (ctx.S.der?.aps || []).map((a) => ({ ...a }));
  const validMounts = (id) => {
    const it = BY_ID[id];
    const used = new Set(ctx.S.devs.map((d) => d.mount).filter(Boolean));
    return (ctx.B.mounts || []).filter((m) => (it.mounts || []).includes(m.kind) && !used.has(m.id) && (m.floor ?? 0) === floor);
  };
  const snapTo = (g) => {
    let best = null, bd = 1.8;
    for (const m of validMounts(g.id)) { const d = Math.hypot(m.pos[0] - g.x, m.pos[2] - g.z); if (d < bd) { bd = d; best = m; } }
    return best;
  };

  const draw = () => {
    if (floors) floors.querySelectorAll("button").forEach((b) => b.classList.toggle("on", Number(b.dataset.f) === floor));
    const aps = apList();
    if (ghost && ghost.snap) aps.push({ x: ghost.snap.pos[0], z: ghost.snap.pos[2], floor, r: BY_ID[ghost.id].wifi.r });
    else if (ghost) aps.push({ x: ghost.x, z: ghost.z, floor, r: BY_ID[ghost.id].wifi.r });
    const grid = wifiGrid(ctx.B, aps, floor, 0.5, outdoorAp() || ctx.S.devs.some((d) => BY_ID[d.id]?.wifi?.outdoor) ? (ctx.B.zones || []).map((z) => [[z.pos[0] - (z.r || 3), z.pos[2] - (z.r || 3)], [z.pos[0] + (z.r || 3), z.pos[2] - (z.r || 3)], [z.pos[0] + (z.r || 3), z.pos[2] + (z.r || 3)], [z.pos[0] - (z.r || 3), z.pos[2] + (z.r || 3)]]) : null);
    const pct = grid && grid.inside ? Math.round((grid.good / grid.inside) * 100) : 0;
    $("b", cov).textContent = `${ghost ? pct : Math.round((ctx.S.der?.cov || 0) * 100)}%`;
    $("span", cov).textContent = ghost ? "z nowym punktem (to piętro)" : "zasięgu w całym domu";
    const mine = ctx.S.devs.filter((d) => BY_ID[d.id]?.caps.includes("ap"));
    const dark = mine.filter((d) => !(ctx.S.der?.dev[d.uid]?.pw && (ctx.S.der?.aps || []).some((a) => a.uid === d.uid)));
    const why = !ghost && dark.length ? (ctx.S.der?.dev[dark[0].uid]?.pw ? `${dark.length} z ${mine.length} punktów bez sieci` : `${dark.length} z ${mine.length} punktów bez prądu`) : "";
    $(".why", cov).hidden = !why;
    $(".why", cov).textContent = why;
    $(".go", cov).hidden = !why;
    plan.set({ floor, heat: grid, devs: ctx.S.devs, der: ctx.S.der, ghost: ghost ? { ...ghost, floor } : null, mounts: ghost ? [] : sel ? validMounts(sel) : [], zones: !!outdoorAp() });
  };

  const refresh = () => {
    const items = invList(ctx, (it) => it.caps.includes("ap"));
    if (sel && !items.some((x) => x.id === sel)) { sel = null; ghost = null; }
    tray(trayHost, ctx, items, sel, (id) => {
      sel = id;
      if (id) {
        const rooms = ctx.B.rooms.filter((r) => r.floor === floor && r.kind !== "outdoor");
        const c = rooms.length ? rooms[Math.floor(rooms.length / 2)].poly[0] : [0, 0];
        ghost = { id, x: c[0] + 1, z: c[1] + 1 };
        ghost.snap = snapTo(ghost);
      } else ghost = null;
      refresh();
    }, { cats: ["siec"], hint: sel ? "Przeciągnij kółko po planie, potem Zamontuj" : "Wybierz punkt dostępowy" });
    if (ghost && !$(".mountap", trayHost)) {
      const b = el(`<div style="padding:8px 14px 0"><button class="btn y mountap">${icon("drill", 20, 2)} Zamontuj tutaj</button></div>`);
      trayHost.prepend(b);
      $(".mountap", b).onclick = place;
    }
    draw();
  };

  const place = async () => {
    if (!ghost || busy) return;
    const m = ghost.snap || snapTo(ghost);
    if (!m) { toast("Przesuń bliżej sufitu w pokoju (świecący punkt)."); return; }
    busy = true;
    ctx.stream({ t: "ghost", id: ghost.id, pos: m.pos, quat: m.quat, floor });
    const r = await runGesture("drill");
    ctx.stream({ t: "ghost" });
    busy = false;
    if (!r.ok) return;
    ctx.send({ a: "install", id: ghost.id, mount: m.id, style: "drill" });
    haptic(true);
    setTimeout(() => { const d = ctx.S.devs.filter((x) => x.mount === m.id).pop(); if (d) afterPoe(ctx, d.uid); }, 800);
    ghost = null;
    if ((ctx.S.inv[sel] || 1) <= 1) sel = null;
    refresh();
  };

  let lastSend = 0;
  plan.on("ghost", (g) => {
    ghost = g;
    ghost.snap = snapTo(g);
    const now = performance.now();
    if (now - lastSend > 70) {
      lastSend = now;
      const p = ghost.snap ? ghost.snap.pos : [g.x, (ctx.B.floors[floor]?.y || 0) + (ctx.B.floors[floor]?.height || 2.7) - 0.02, g.z];
      ctx.stream({ t: "ghost", id: g.id, pos: p, quat: ghost.snap?.quat, floor });
    }
    draw();
  });
  plan.on("ghostDrop", () => { haptic(); draw(); });
  plan.on("mount", (m) => { if (sel) { ghost = { id: sel, x: m.pos[0], z: m.pos[2], snap: m }; place(); } });
  plan.on("device", (d) => { const st = ctx.S.der?.dev[d.uid]; deviceSheet(ctx, d, BY_ID[d.id].power === "poe" && !(st && st.pw && st.net) ? { label: "Podłącz do sieci", run: () => afterPoe(ctx, d.uid) } : null); });
  refresh();
  return { update() { refresh(); }, destroy() { ctx.stream({ t: "ghost" }); } };
}

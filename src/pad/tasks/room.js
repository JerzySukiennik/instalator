// Instalator: room and outdoor task — plan with glowing mount points, toolbox tray, physical install gestures, camera aiming.

import { BY_ID } from "../../shared/catalog.js";
import { icon } from "../../shared/icons.js";
import { $, el, haptic, toast } from "../ui.js";
import { Plan } from "../plan.js";
import { runGesture } from "../gestures.js";
import { frame, invList, tray, deviceSheet } from "./common.js";

const OUT = ["outdoorWall", "doorbell", "gate", "garage"];

function gestureFor(it, kind) {
  if (kind === "socketE27" || kind === "socketGU10") return ["screw", "bulb"];
  if (kind === "radiator") return ["screw", "temp"];
  if (kind === "doorLock") return ["screw", "lock"];
  if (kind === "door" || kind === "window") return ["peel", "sensor"];
  if (kind === "floor" && it.caps.includes("leak")) return ["peel", "sensor"];
  if (["ceiling", "wall", "outdoorWall", "doorbell", "garage", "gate", "boiler"].includes(kind)) return ["drill", "drill"];
  return ["tap", null];
}

export function mount(root, ctx, taskId, h) {
  const outdoor = taskId === "outdoor";
  const roomId = outdoor ? null : taskId.slice(5);
  const room = roomId ? ctx.B.rooms.find((r) => r.id === roomId) : null;
  const title = outdoor ? "Na zewnątrz" : room ? room.name[0].toUpperCase() + room.name.slice(1) : "Pokój";
  const cats = outdoor ? ["kamery", "siec", "dom", "czujniki"] : ["swiatlo", "klimat", "czujniki", "kamery", "multimedia", "dom"];
  const body = frame(root, ctx, title, outdoor ? "Kamery, dzwonek, brama, pogoda" : "Wybierz coś ze skrzynki, potem świecący punkt", h, { flush: true, cats });
  body.innerHTML = `<div class="plan"></div><div class="tray"></div>`;
  const planHost = $(".plan", body), trayHost = $(".tray", body);
  const plan = new Plan(planHost, ctx.B);
  const floor = room ? room.floor : 0;
  plan.set({ floor, focus: outdoor ? null : roomId, zones: outdoor });
  if (outdoor) planHost.appendChild(el(`<span class="chip tape">${icon("outdoor", 14, 2)} elewacja i działka</span>`));
  let sel = null;
  let busy = false;

  const mountsFor = (id) => {
    const it = BY_ID[id];
    const used = new Set(ctx.S.devs.map((d) => d.mount).filter(Boolean));
    const ok = new Set(it.mounts || []);
    if (it.caps.includes("outdoor") && ok.has("outdoorWall")) ok.add("outdoorWall");
    const list = (ctx.B.mounts || []).filter((m) => ok.has(m.kind) && !used.has(m.id) && (outdoor ? OUT.includes(m.kind) || m.room === "outdoor" : m.room === roomId));
    if (it.strip) for (const sp of ctx.B.strips || []) {
      if ((outdoor || sp.room === roomId) && it.strip.includes(sp.kind) && !ctx.S.devs.some((d) => d.strip === sp.id)) {
        const mid = sp.points[Math.floor(sp.points.length / 2)];
        list.push({ id: `strip:${sp.id}`, kind: "strip", strip: sp, pos: mid, floor: sp.floor ?? 0, room: sp.room });
      }
    }
    return list;
  };

  const relevant = (it) => {
    if (it.where === "rack" || it.where === "din" || it.where === "shelf" || it.caps.includes("tablet") || it.caps.includes("wallmount") || it.caps.includes("stand")) return false;
    return mountsFor(it.id).length > 0 || (it.strip && (ctx.B.strips || []).some((s) => (outdoor || s.room === roomId) && it.strip.includes(s.kind)));
  };

  const cones = () => ctx.S.devs.filter((d) => BY_ID[d.id]?.caps.includes("camera") && d.aim).map((d) => ({ pos: d.pos, dir: d.aim, fov: BY_ID[d.id].cam.fov, range: BY_ID[d.id].cam.range, floor: d.floor ?? 0, live: ctx.S.der?.dev[d.uid]?.net }));

  const refresh = () => {
    const items = invList(ctx, relevant);
    if (sel && !items.some((x) => x.id === sel)) sel = null;
    tray(trayHost, ctx, items, sel, (id) => { sel = id; refresh(); }, { cats, hint: sel ? "Stuknij świecący punkt na planie" : items.length ? "Wybierz urządzenie" : "Skrzynka pusta: kup coś w sklepie" });
    plan.set({ devs: ctx.S.devs, der: ctx.S.der, mounts: sel ? mountsFor(sel) : [], cones: cones() });
  };

  const aim = async (d, m) => {
    const it = BY_ID[d.id];
    const zones = (ctx.B.zones || []).map((z) => ({ a: Math.atan2(z.pos[2] - d.pos[2], z.pos[0] - d.pos[0]), d: Math.hypot(z.pos[0] - d.pos[0], z.pos[2] - d.pos[2]), label: ({ entrance: "wejście", driveway: "podjazd", garden: "ogród", terrace: "taras", jetty: "pomost", gate: "brama", garage: "garaż", street: "ulica" }[z.kind] || z.kind) })).filter((z) => z.d < it.cam.range * 1.6);
    const a0 = d.aim ? Math.atan2(d.aim[2], d.aim[0]) : Math.atan2(m?.normal?.[2] || 1, m?.normal?.[0] || 0);
    const res = await runGesture("aim", { fov: it.cam.fov, range: it.cam.range, targets: zones, aim0: a0, onAim: (a) => ctx.send({ a: "aim", uid: d.uid, dir: [Math.cos(a), 0, Math.sin(a)] }) });
    if (res.ok) ctx.send({ a: "aim", uid: d.uid, dir: [Math.cos(res.aim), 0, Math.sin(res.aim)] });
  };

  plan.on("mount", async (m) => {
    if (!sel || busy) return;
    const it = BY_ID[sel];
    busy = true;
    const id = sel;
    ctx.stream({ t: "ghost", id, pos: m.pos, quat: m.quat, floor: m.floor ?? 0 });
    const [g, ic] = m.kind === "strip" ? ["strip", null] : gestureFor(it, m.kind);
    let ok = true;
    if (g !== "tap") ok = (await runGesture(g, { icon: ic })).ok;
    ctx.stream({ t: "ghost" });
    busy = false;
    if (!ok) return;
    if (m.kind === "strip") ctx.send({ a: "strip", id, strip: m.strip.id });
    else ctx.send({ a: "install", id, mount: m.id, style: g === "screw" ? "screw" : g === "peel" ? "peel" : g === "drill" ? "drill" : "tap" });
    haptic(true);
    if (it.caps.includes("camera")) {
      setTimeout(() => {
        const d = ctx.S.devs.filter((x) => x.mount === m.id).pop();
        if (d) aim(d, m);
      }, 450);
    }
    if (!((ctx.S.inv[id] || 1) - 1)) sel = null;
  });

  plan.on("device", (d) => {
    const it = BY_ID[d.id];
    deviceSheet(ctx, d, it.caps.includes("camera") ? { label: "Ustaw kąt", run: () => aim(d, (ctx.B.mounts || []).find((m) => m.id === d.mount)) } : null);
  });

  plan.on("tap", (p) => {
    if (sel) toast("Stuknij jeden ze świecących punktów.");
  });

  refresh();
  return {
    update() { refresh(); },
    destroy() { ctx.stream({ t: "ghost" }); }
  };
}

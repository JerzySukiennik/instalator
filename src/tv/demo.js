// Instalator: scripted installs for screenshots and critics (?demo=<building>&view=...&stage=...).

import { BY_ID, PLATFORMS } from "../shared/catalog.js";
import { panelLayout } from "../shared/sim.js";
import { polyCentroid } from "../shared/geom.js";

export function runDemo(state, data, reduce, opts = {}) {
  const P = "demo";
  if (!state.players.some((p) => p.cid === P)) state.players.push({ cid: P, name: "Demo", color: "#f2a541", online: true, host: true });
  const act = (a) => reduce(state, P, a, data);
  const buy = (id, n = 1) => act({ a: "buy", id, n });
  const stage = opts.stage || "full";
  const big = data.rooms.length > 9;
  const flat = !data.rack;
  const plat = state.job.platform !== "any" ? state.job.platform : opts.platform || "ha";

  act({ a: "breaker", key: "main", on: true });
  act({ a: "breaker", key: "rcd0", on: true });
  act({ a: "breaker", key: "rcd1", on: true });
  for (const c of data.circuits || []) act({ a: "breaker", key: `mcb:${c.id}`, on: true });
  for (const c of data.circuits || []) act({ a: "label", circuit: c.id, room: c.rooms[0] });
  if (stage === "power") return;

  const gw = flat ? "ucg-ultra" : big ? "udm-pro-max" : "ucg-max";
  const sw = flat ? "usw-lite-8-poe" : big ? "usw-pro-max-24-poe" : "usw-pro-max-16-poe";
  if (flat) { buy(gw); buy(sw); act({ a: "shelfPut", id: gw }); act({ a: "shelfPut", id: sw }); }
  else {
    const units = data.rack.units || 9;
    let u = units - 1;
    const put = (id) => { const n = BY_ID[id].u || 1; u -= n - 1; buy(id); act({ a: "rackPut", id, u }); u -= 1; };
    put("patch-panel-24");
    put("brush-panel");
    put(sw);
    if (BY_ID[gw].where === "rack") put(gw);
    put("rack-shelf");
    put("rack-shelf");
    if (big) put("ups-2u");
    if (BY_ID[gw].where === "shelf") { buy(gw); act({ a: "shelfPut", id: gw }); }
  }
  const hub = { ha: "ha-green", apple: "apple-tv-4k", google: "google-tv-streamer" }[plat];
  for (const id of ["hue-bridge-pro", "tado-bridge-x", hub]) { buy(id); act({ a: "shelfPut", id }); }

  const used = new Set();
  const take = (m) => { used.add(m.id); return m; };
  const mounts = (kind, test = () => true) => (data.mounts || []).filter((m) => m.kind === kind && !used.has(m.id) && test(m));
  const roomKind = (m) => data.rooms.find((r) => r.id === m.room)?.kind;

  for (const f of data.floors) {
    const rooms = data.rooms.filter((r) => r.floor === f.index && r.kind !== "outdoor");
    if (!rooms.length) continue;
    const cs = rooms.map((r) => polyCentroid(r.poly));
    const cx = cs.reduce((s, c) => s + c[0], 0) / cs.length, cz = cs.reduce((s, c) => s + c[1], 0) / cs.length;
    const n = big ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const cand = mounts("ceiling", (m) => (m.floor ?? 0) === f.index).sort((a, b) => Math.hypot(a.pos[0] - cx - (i ? 4 : 0), a.pos[2] - cz) - Math.hypot(b.pos[0] - cx - (i ? 4 : 0), b.pos[2] - cz));
      if (cand[0]) { buy("u7-pro"); act({ a: "install", id: "u7-pro", mount: take(cand[0]).id }); }
    }
  }
  for (const m of mounts("socketE27")) { buy("hue-e27"); act({ a: "install", id: "hue-e27", mount: take(m).id }); }
  for (const m of mounts("socketGU10").slice(0, 8)) { buy("hue-gu10"); act({ a: "install", id: "hue-gu10", mount: take(m).id }); }
  for (const sp of data.strips || []) {
    const id = sp.kind === "tv" ? "hue-play-gradient" : sp.kind === "kitchen" ? "govee-strip-m1" : "hue-lightstrip-plus";
    buy(id); act({ a: "strip", id, strip: sp.id });
  }
  for (const m of mounts("radiator")) { buy("tado-trv-x"); act({ a: "install", id: "tado-trv-x", mount: take(m).id }); }
  for (const m of mounts("floor", (m) => roomKind(m) === "bath").slice(0, 1)) { buy("aqara-leak"); act({ a: "install", id: "aqara-leak", mount: take(m).id }); }
  buy("aqara-hub-m3"); act({ a: "shelfPut", id: "aqara-hub-m3" });
  for (const r of data.rooms.filter((r) => r.kind === "bed")) {
    const m = mounts("ceiling", (x) => x.room === r.id)[0];
    if (m) { buy("aqara-smoke"); act({ a: "install", id: "aqara-smoke", mount: take(m).id }); }
  }
  const db = mounts("doorbell")[0];
  if (db) { buy("g4-doorbell-pro"); act({ a: "install", id: "g4-doorbell-pro", mount: take(db).id }); }
  for (const z of (data.zones || []).filter((z) => z.kind !== "entrance" && z.kind !== "street")) {
    const m = mounts("outdoorWall").sort((a, b) => Math.hypot(a.pos[0] - z.pos[0], a.pos[2] - z.pos[2]) - Math.hypot(b.pos[0] - z.pos[0], b.pos[2] - z.pos[2]))[0];
    if (!m) continue;
    buy("g5-bullet");
    act({ a: "install", id: "g5-bullet", mount: take(m).id });
    const d = state.devs[state.devs.length - 1];
    const v = [z.pos[0] - m.pos[0], 0, z.pos[2] - m.pos[2]];
    const l = Math.hypot(v[0], v[2]) || 1;
    act({ a: "aim", uid: d.uid, dir: [v[0] / l, 0, v[2] / l] });
  }
  const lk = mounts("doorLock")[0];
  if (lk) { buy("nuki-ultra"); act({ a: "install", id: "nuki-ultra", mount: take(lk).id }); }
  const tvm = mounts("surface", (m) => roomKind(m) === "living")[0];
  if (tvm) { buy("sonos-era-100"); act({ a: "install", id: "sonos-era-100", mount: take(tvm).id }); }
  if (data.mounts?.some((m) => m.kind === "garage")) { const g = mounts("garage")[0]; buy("tesla-wall-connector"); act({ a: "install", id: "tesla-wall-connector", mount: take(g).id }); }

  const want = new Set(state.job.reqs.map((r) => r.type));
  const one = (id, kind, test = () => true) => {
    const m = mounts(kind, test)[0];
    if (!m) return null;
    buy(id);
    act({ a: "install", id, mount: take(m).id });
    return state.devs[state.devs.length - 1];
  };
  if (want.has("soundbar")) one("sonos-arc-ultra", "tv");
  if (want.has("weather")) one("netatmo-weather", "outdoorWall");
  if (want.has("gate")) one("shelly-1-gen4", "gate") || one("shelly-1-gen4", "garage");
  if (want.has("vacuum")) one("roborock-saros-10r", "floor", (m) => roomKind(m) === "living") || one("roborock-saros-10r", "floor");
  if (want.has("heat") && !(data.mounts || []).some((m) => m.kind === "radiator")) one("tado-thermostat-x", "wall", (m) => roomKind(m) === "living") || one("tado-thermostat-x", "wall");
  for (const r of state.job.reqs.filter((r) => r.type === "wifizone")) {
    const z = (data.zones || []).find((x) => x.kind === r.zone || x.id === r.zone);
    if (!z) continue;
    const m = mounts("outdoorWall").sort((a, b) => Math.hypot(a.pos[0] - z.pos[0], a.pos[2] - z.pos[2]) - Math.hypot(b.pos[0] - z.pos[0], b.pos[2] - z.pos[2]))[0];
    if (m) { buy("u7-outdoor"); act({ a: "install", id: "u7-outdoor", mount: take(m).id }); }
  }
  const needHA = plat !== "ha" && (want.has("ev") || (plat === "apple" && (want.has("blinds") || want.has("energy"))));
  if (needHA) { buy("ha-green"); act({ a: "shelfPut", id: "ha-green" }); }

  const lay = panelLayout(data);
  act({ a: "breaker", key: "main", on: false });
  buy("shelly-pro-3em"); act({ a: "dinPut", id: "shelly-pro-3em" });
  buy("shelly-pro-4pm"); act({ a: "dinPut", id: "shelly-pro-4pm" });
  if (want.has("blinds")) { buy("shelly-pro-2pm"); act({ a: "dinPut", id: "shelly-pro-2pm" }); }
  act({ a: "breaker", key: "main", on: true });

  if (stage !== "norack") {
    const S = state;
    const by = (id) => S.devs.filter((d) => d.id === id);
    const g = by(gw)[0], s = by(sw)[0], ont = by("ont")[0];
    const pp = S.devs.find((d) => BY_ID[d.id]?.caps.includes("patch") || d.id === "mb-keystone");
    act({ a: "patch", from: [ont.uid, 0], to: [g.uid, 0], color: "#80868b" });
    const swPorts = (BY_ID[sw].ports.rj45 || 8);
    act({ a: "patch", from: [g.uid, 1], to: [s.uid, swPorts - 1], color: "#3e9b5f" });
    let port = 0;
    const runs = S.devs.filter((d) => d.run && d.run.pp).sort((a, b) => a.run.port - b.run.port);
    for (const d of runs) {
      if (port >= swPorts - 2) break;
      act({ a: "patch", from: [s.uid, port], to: [d.run.pp, d.run.port], color: BY_ID[d.id].caps.includes("camera") ? "#f3cf45" : "#3f7fd6" });
      port++;
    }
    for (const id of ["hue-bridge-pro", "tado-bridge-x", hub, "aqara-hub-m3", ...(needHA ? ["ha-green"] : [])]) {
      const d = by(id)[0];
      if (d && BY_ID[id].ports && port < swPorts - 1) { act({ a: "patch", from: [s.uid, port], to: [d.uid, 0], color: "#eeeeee" }); port++; }
    }
    for (const d of S.devs) if (BY_ID[d.id]?.brand === "Ubiquiti") d.adopted = true;
  }

  const tabs = (data.tabletSpots || []).slice().sort((a, b) => (a.rating === "good" ? 0 : a.rating === "ok" ? 1 : 2) - (b.rating === "good" ? 0 : b.rating === "ok" ? 1 : 2));
  const spot = tabs[0];
  if (spot) {
    buy(plat === "apple" ? "ipad-a16" : "ipad-a16");
    buy(spot.kind === "wall" ? "tablet-wall-mount" : "tablet-stand");
    act({ a: "tabletSpot", spot: spot.id });
    act({ a: "tabletMount", leveled: true });
  }
  if (state.job.platform === "any") act({ a: "platform", p: plat });
  if (stage === "nopair") return;
  for (let k = 0; k < 3; k++) {
    const ids = state.devs.map((d) => d.uid);
    act({ a: "pair", uids: ids });
  }
  const pick = (cap, n = 0) => state.devs.filter((d) => d.paired && BY_ID[d.id]?.caps.includes(cap))[n];
  const cards = [];
  const put = (kind, dev, x, y, w = 1, h = 1) => cards.push({ id: `c${cards.length}`, kind, dev: dev?.uid || null, x, y, w, h });
  const cams = state.devs.filter((d) => BY_ID[d.id]?.caps.includes("camera") && !BY_ID[d.id]?.caps.includes("doorbell"));
  const bell = state.devs.find((d) => BY_ID[d.id]?.caps.includes("doorbell"));
  const cam = cams[0] || bell;
  put("camera", cam, 0, 0, 2, 2);
  put("camera", cams[1] || bell || cam, 0, 2, 1, 1);
  put("camera", bell && bell !== (cams[1] || null) ? bell : cams[2] || cam, 1, 2, 1, 1);
  const pref = ["living", "bed", "office", "kitchen", "hall"];
  const rank = (d) => { const i = pref.indexOf(roomKind({ room: d.room })); return i < 0 ? 99 : i; };
  const mainTrv = state.devs.filter((d) => d.paired && (BY_ID[d.id]?.caps.includes("trv") || BY_ID[d.id]?.caps.includes("thermostat"))).sort((a, b) => rank(a) - rank(b))[0];
  put("climate", mainTrv || pick("trv"), 2, 0, 1, 3);
  put("light", pick("light", 0), 3, 0);
  put("light", state.devs.find((d) => d.paired && d.place === "strip"), 3, 1);
  put("light", pick("light", 2) || pick("light", 1), 3, 2);
  put("lock", pick("lock"), 0, 3);
  put("sensor", pick("leak") || pick("smoke"), 1, 3);
  put("energy", null, 2, 3, 2, 2);
  put("network", null, 0, 4, 2, 1);
  put("media", pick("speaker"), 0, 5, 2, 1);
  put("scene", null, 2, 5);
  put("sensor", pick("smoke") || pick("contact"), 3, 5);
  act({ a: "dash", cards });
  const lamp = pick("light", 2) || pick("light", 1);
  if (lamp && lamp.place !== "strip") lamp.on = false;
}

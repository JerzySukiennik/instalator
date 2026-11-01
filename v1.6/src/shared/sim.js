// Instalator: derived world — panel layout, power, network graph, PoE, Wi-Fi, pairing and requirement checks.

import { BY_ID, PLATFORMS, pairStatus } from "./catalog.js";
import { wifiCoverage, apSignal, cameraSees, pointInPoly, polyCentroid } from "./geom.js";

export const WIFI_OK = 0.18;

export function panelLayout(data) {
  const p = data.panel || { rows: 3, slotsPerRow: 12 };
  const rows = Math.max(2, p.rows || 3), per = Math.max(10, p.slotsPerRow || 12);
  const items = [];
  const circuits = data.circuits || [];
  items.push({ key: "main", kind: "main", row: 0, slot: 0, mod: 2 });
  const rcds = Math.max(1, Math.ceil(circuits.length / 6));
  for (let i = 0; i < Math.min(rcds, 2); i++) items.push({ key: `rcd${i}`, kind: "rcd", rcd: i, row: 0, slot: 3 + i * 3, mod: 2 });
  let row = 1, slot = 0;
  circuits.forEach((c, i) => {
    if (slot >= per - 1) { row++; slot = 0; }
    items.push({ key: `mcb:${c.id}`, kind: "mcb", circuit: c.id, rcd: Math.min(rcds - 1, Math.floor(i / 6)), row, slot, mod: 1 });
    slot++;
  });
  const totalRows = Math.max(rows, row + 2);
  return { rows: totalRows, per, items, rcds: Math.min(rcds, 2) };
}

export function panelFree(layout, mods, row, slot, devs) {
  if (row < 0 || row >= layout.rows || slot < 0 || slot + mods > layout.per) return false;
  const taken = new Set();
  for (const it of layout.items) for (let k = 0; k < it.mod; k++) taken.add(`${it.row}:${it.slot + k}`);
  for (const d of devs) if (d.place === "din") for (let k = 0; k < (BY_ID[d.id].mod || 1); k++) taken.add(`${d.row}:${d.slot + k}`);
  for (let k = 0; k < mods; k++) if (taken.has(`${row}:${slot + k}`)) return false;
  return true;
}

export function firstFreeDin(layout, mods, devs) {
  for (let r = 1; r < layout.rows; r++) for (let s = 0; s + mods <= layout.per; s++) if (panelFree(layout, mods, r, s, devs)) return { row: r, slot: s };
  return null;
}

export function circuitLive(state, data, circuitId) {
  const p = state.panel;
  if (!p.main) return false;
  const lay = panelLayout(data);
  const it = lay.items.find((x) => x.circuit === circuitId);
  if (!it) return false;
  if (!p.rcd[it.rcd]) return false;
  return !!p.br[circuitId];
}

export function roomCircuit(data, roomId, kind = "socket") {
  const c = (data.circuits || []).find((c) => c.kind === kind && c.rooms.includes(roomId));
  return c ? c.id : (data.circuits || []).find((c) => c.rooms.includes(roomId))?.id || null;
}

export function relayOf(state, circuitId) {
  for (const d of state.devs) {
    if (d.place !== "din" || !d.ch) continue;
    const i = d.ch.indexOf(circuitId);
    if (i >= 0) return { dev: d, ch: i };
  }
  return null;
}

export function rackRoom(data) {
  return (data.rack || data.mediaBox || data.panel || {}).room;
}

function portsOf(id) {
  const d = BY_ID[id] || {};
  const p = d.ports || {};
  return (p.wan || 0) + (p.rj45 || 0);
}

export function portCount(dev) {
  if (dev.id === "ont") return 1;
  if (dev.id === "mb-keystone") return 8;
  return portsOf(dev.id);
}

export function derive(state, data) {
  const out = { dev: {}, cov: 0, aps: [], online: false, poeUsed: {}, issues: [] };
  if (!data) return out;
  const devs = state.devs;
  const byUid = Object.fromEntries(devs.map((d) => [d.uid, d]));
  const rackCircuit = roomCircuit(data, rackRoom(data), "socket");
  const rackLive = rackCircuit ? circuitLive(state, data, rackCircuit) : !!state.panel.main;
  const ups = devs.some((d) => d.place === "rack" && BY_ID[d.id]?.caps.includes("ups"));
  const rackPowered = rackLive || (ups && state.everPowered);

  const edges = new Map();
  const link = (a, b) => {
    if (!edges.has(a)) edges.set(a, []);
    if (!edges.has(b)) edges.set(b, []);
    edges.get(a).push(b);
    edges.get(b).push(a);
  };
  for (const p of state.patches) link(`${p.a[0]}#${p.a[1]}`, `${p.b[0]}#${p.b[1]}`);
  for (const d of devs) if (d.run) link(`${d.run.pp}#${d.run.port}`, `${d.uid}#0`);

  const powered = {};
  for (const d of devs) {
    const it = BY_ID[d.id] || {};
    let pw = false;
    if (d.place === "rack" || d.place === "shelf" || d.id === "ont" || d.id === "mb-keystone") pw = it.power === "none" || it.power === "usb" || rackPowered || d.id === "mb-keystone";
    else if (d.place === "din") pw = !!state.panel.main;
    else if (it.power === "battery") pw = true;
    else if (it.power === "poe") pw = false;
    else if (d.place === "mount" && (d.kind === "socketE27" || d.kind === "socketGU10")) {
      const circ = d.circuit;
      pw = circ ? circuitLive(state, data, circ) : false;
      const rel = circ ? relayOf(state, circ) : null;
      if (pw && rel && rel.dev.relay && rel.dev.relay[rel.ch] === false) pw = false;
    } else if (d.place === "tablet") pw = true;
    else {
      const c = roomCircuit(data, d.room, "socket");
      pw = c ? circuitLive(state, data, c) : !!state.panel.main;
    }
    powered[d.uid] = pw;
  }

  const gw = devs.find((d) => BY_ID[d.id]?.caps.includes("gateway") && (d.place === "rack" || d.place === "shelf"));
  const ont = devs.find((d) => d.id === "ont");
  const internet = !!(gw && ont && powered[gw.uid] && (edges.get(`${gw.uid}#0`) || []).includes(`${ont.uid}#0`));
  const seen = new Set();
  const poeFrom = {};
  if (gw && powered[gw.uid]) {
    const q = [];
    const n = portCount(gw);
    for (let i = 1; i < n; i++) q.push([`${gw.uid}#${i}`, null]);
    const passive = (d) => d.id === "mb-keystone" || !!BY_ID[d.id]?.caps.includes("patch");
    while (q.length) {
      const [node, poeSrc] = q.shift();
      if (seen.has(node)) continue;
      const [uid, portStr] = node.split("#");
      const d = byUid[uid];
      if (!d) continue;
      const it = BY_ID[d.id] || {};
      const isSwitch = !!it.caps?.includes("switch");
      if (isSwitch && !powered[uid]) continue;
      seen.add(node);
      if (isSwitch) for (let i = 0; i < portCount(d); i++) { const nn = `${uid}#${i}`; if (!seen.has(nn)) q.push([nn, null]); }
      const outSrc = isSwitch ? (Number(portStr) < (it.ports?.poe || 0) ? uid : null) : passive(d) ? poeSrc : null;
      for (const nb of edges.get(node) || []) {
        if (seen.has(nb)) continue;
        const nd = byUid[nb.split("#")[0]];
        if (nd && outSrc && !passive(nd) && !BY_ID[nd.id]?.caps.includes("switch")) poeFrom[nd.uid] = outSrc;
        q.push([nb, outSrc]);
      }
    }
  }
  const reach = (uid) => seen.has(`${uid}#0`);

  for (const d of devs) {
    const it = BY_ID[d.id] || {};
    if (it.power === "poe") {
      const src = poeFrom[d.uid];
      if (src && reach(d.uid)) {
        const sw = byUid[src];
        const budget = BY_ID[sw.id]?.poeOut || 0;
        const used = out.poeUsed[src] || 0;
        const need = it.poe || 5;
        if (used + need <= budget) { out.poeUsed[src] = used + need; powered[d.uid] = true; }
        else out.issues.push({ dev: d.uid, why: "poe-budget" });
      }
    }
    if (it.caps?.includes("wallmount") && d.place === "tablet") powered[d.uid] = true;
  }

  for (const d of devs) {
    const it = BY_ID[d.id] || {};
    if (it.caps?.includes("ap") && powered[d.uid] && reach(d.uid)) out.aps.push({ uid: d.uid, x: d.pos[0], z: d.pos[2], floor: d.floor ?? 0, r: it.wifi?.r || 10 });
  }
  out.online = internet;
  out.cov = data.walls ? wifiCoverage(data, out.aps) : 0;

  const installed = new Set();
  for (const d of devs) {
    const it = BY_ID[d.id] || {};
    const pw = powered[d.uid];
    let net = false, why = null;
    if (d.id === "ont") { net = true; }
    else if (it.ports && (it.ports.rj45 || it.ports.wan) && (d.place === "rack" || d.place === "shelf")) net = reach(d.uid) || (it.caps?.includes("gateway") && pw);
    else if (it.power === "poe") net = pw && reach(d.uid);
    else if (it.needsWifi) {
      const s = out.aps.reduce((m, ap) => Math.max(m, apSignal(ap, d.pos[0], d.pos[2], d.floor ?? 0, data.walls || [])), 0);
      net = pw && s >= WIFI_OK && internet;
      if (pw && !net) why = out.aps.length ? "wifi-weak" : "wifi-none";
    } else if (d.place === "din") net = pw && (gw ? powered[gw.uid] : false);
    else net = pw;
    if (!pw && !why) why = it.power === "poe" ? (d.run ? "poe" : "cable") : "power";
    out.dev[d.uid] = { pw: !!pw, net: !!net, why };
    if (pw && net) installed.add(d.id);
  }
  const plat = state.tablet?.platform;
  for (const d of devs) {
    const st = out.dev[d.uid];
    if (!plat) { st.pair = null; continue; }
    const ps = pairStatus(d.id, plat, installed);
    st.pair = ps;
    st.pairable = st.net && ps.ok && !!BY_ID[d.id]?.hubs;
  }
  return out;
}

const firstRoom = (data, kind) => data.rooms.filter((r) => r.kind === kind);

function roomsFor(data, kind) {
  if (kind === "all") return data.rooms.filter((r) => ["living", "bed", "kitchen", "office", "hall"].includes(r.kind));
  return firstRoom(data, kind);
}

function devsIn(state, roomIds, test) {
  return state.devs.filter((d) => roomIds.includes(d.room) && test(BY_ID[d.id] || {}, d));
}

function zonePoint(data, zone) {
  const z = (data.zones || []).find((x) => x.kind === zone || x.id === zone);
  if (z) return z.pos;
  if (zone === "entrance" && data.entrance) return data.entrance.pos;
  const room = data.rooms.find((r) => r.kind === zone || r.id === zone);
  if (room) { const c = polyCentroid(room.poly); return [c[0], (data.floors[room.floor]?.y || 0) + 1, c[1]]; }
  return null;
}

export function evaluate(state, data, der, job) {
  if (!job || !data) return [];
  const paired = (d) => !!d.paired;
  const ok = (d) => der.dev[d.uid]?.pw && der.dev[d.uid]?.net;
  const res = [];
  for (const r of job.reqs) {
    let done = false, prog = 0, hint = "";
    switch (r.type) {
      case "power": {
        const cs = data.circuits || [];
        const on = cs.filter((c) => circuitLive(state, data, c.id)).length;
        prog = cs.length ? on / cs.length : 0;
        done = prog >= 1;
        hint = "Rozdzielnica: włącz główny, różnicówkę i wszystkie bezpieczniki.";
        break;
      }
      case "labels": {
        const cs = data.circuits || [];
        const good = cs.filter((c) => state.panel.labels[c.id] && c.rooms.includes(state.panel.labels[c.id])).length;
        prog = cs.length ? good / cs.length : 0;
        done = prog >= 1;
        hint = "Rozdzielnica: podpisz każdy bezpiecznik pomieszczeniem, które zapala.";
        break;
      }
      case "light": case "color": {
        const rooms = roomsFor(data, r.kind).map((x) => x.id);
        const lights = devsIn(state, rooms, (it) => it.caps?.includes("light") && (r.type === "light" || it.caps.includes("color"))).filter((d) => ok(d) && paired(d));
        let relayLit = false;
        if (r.type === "light") {
          for (const c of data.circuits || []) {
            if (c.kind !== "light" || !c.rooms.some((x) => rooms.includes(x))) continue;
            const rel = relayOf(state, c.id);
            if (rel && rel.dev.paired && der.dev[rel.dev.uid]?.pw) relayLit = true;
          }
        }
        done = lights.length > 0 || relayLit;
        prog = done ? 1 : 0;
        hint = r.type === "color" ? "Kolorowa żarówka albo taśma, sparowana z tabletem." : "Smart żarówka albo Shelly na obwodzie światła.";
        break;
      }
      case "tv": case "kitchen": {
        const d = state.devs.find((d) => d.place === "strip" && d.stripKind === (r.type === "tv" ? "tv" : "kitchen") && ok(d) && paired(d));
        done = !!d; prog = done ? 1 : 0;
        hint = r.type === "tv" ? "Pasek LED za telewizorem w salonie." : "Taśma pod szafkami w kuchni.";
        break;
      }
      case "wifi": {
        prog = Math.min(1, der.cov / r.min);
        done = der.cov >= r.min - 1e-6;
        hint = `Zasięg teraz ${Math.round(der.cov * 100)}%. Dołóż punkt dostępowy.`;
        break;
      }
      case "wifizone": {
        const p = zonePoint(data, r.zone);
        const s = p ? der.aps.reduce((m, ap) => Math.max(m, apSignal(ap, p[0], p[2], 0, data.walls || [])), 0) : 0;
        done = s >= WIFI_OK; prog = Math.min(1, s / WIFI_OK);
        hint = "Punkt dostępowy zewnętrzny skierowany na to miejsce.";
        break;
      }
      case "cam": {
        const p = zonePoint(data, r.zone);
        const cams = state.devs.filter((d) => BY_ID[d.id]?.caps.includes("camera") && ok(d));
        done = !!p && cams.some((d) => cameraSees({ pos: d.pos, dir: d.aim || [0, 0, 1], fov: BY_ID[d.id].cam.fov, range: BY_ID[d.id].cam.range, floor: d.floor ?? 0 }, p, data.walls || []));
        prog = done ? 1 : cams.length ? 0.3 : 0;
        hint = "Kamera musi widzieć to miejsce i być podłączona do switcha PoE.";
        break;
      }
      case "doorbell": case "lock": case "vacuum": case "gate": case "ev": case "weather": case "soundbar": case "energy": case "blinds": case "nvr": case "ups": {
        const cap = { doorbell: "doorbell", lock: "lock", vacuum: "vacuum", gate: "gate", ev: "ev", weather: "weather", soundbar: "soundbar", energy: "energy", blinds: "blinds", nvr: "nvr", ups: "ups" }[r.type];
        const ds = state.devs.filter((d) => BY_ID[d.id]?.caps.includes(cap));
        const needPair = ["lock", "gate", "energy", "blinds"].includes(r.type);
        done = ds.some((d) => (r.type === "ups" ? der.dev[d.uid]?.pw : ok(d)) && (!needPair || paired(d)));
        prog = done ? 1 : ds.length ? 0.5 : 0;
        hint = ds.length ? "Jest, ale nie działa: sprawdź prąd, sieć i parowanie." : "Brakuje urządzenia.";
        break;
      }
      case "heat": {
        const rooms = roomsFor(data, r.kind).map((x) => x.id);
        const rads = (data.mounts || []).filter((m) => m.kind === "radiator" && rooms.includes(m.room));
        const thermoRooms = new Set(state.devs.filter((d) => BY_ID[d.id]?.caps.includes("thermostat") && paired(d)).map((d) => d.room));
        let n = 0;
        for (const m of rads) if (thermoRooms.has(m.room) || state.devs.some((d) => d.mount === m.id && paired(d))) n++;
        const total = rads.length || 1;
        if (!rads.length && thermoRooms.size) n = 1;
        prog = n / total; done = prog >= 1;
        hint = `Głowice tado° na kaloryferach: ${n}/${rads.length}.`;
        break;
      }
      case "leak": case "smoke": case "motion": case "contact": case "audio": {
        const cap = { leak: "leak", smoke: "smoke", motion: "motion", contact: "contact", audio: "speaker" }[r.type];
        const kind = r.type === "leak" ? "bath" : r.type === "contact" ? null : r.kind || "living";
        const rooms = kind ? roomsFor(data, kind) : [];
        if (r.type === "contact") {
          const ent = (data.mounts || []).filter((m) => m.kind === "door" && (m.tags || []).includes("entrance"));
          done = state.devs.some((d) => BY_ID[d.id]?.caps.includes("contact") && paired(d) && (ent.length ? ent.some((m) => m.id === d.mount) : true));
          prog = done ? 1 : 0;
        } else {
          const need = rooms.length || 1;
          const have = rooms.filter((rm) => state.devs.some((d) => d.room === rm.id && BY_ID[d.id]?.caps.includes(cap) && (r.type === "audio" ? ok(d) : paired(d)))).length;
          prog = have / need; done = prog >= 1;
        }
        hint = "Sprawdź, czy urządzenie jest sparowane z tabletem.";
        break;
      }
      case "tablet": {
        const t = state.tablet;
        done = !!(t.dev && t.mount && (!r.wall || t.mount === "wall"));
        prog = (t.dev ? 0.5 : 0) + (t.mount ? 0.5 : 0);
        hint = r.wall ? "Kup tablet i uchwyt ścienny, powieś w dobrym miejscu." : "Kup tablet, postaw go albo powieś.";
        break;
      }
      case "dash": {
        const cards = state.tablet.dash?.cards || [];
        const kinds = new Set(cards.map((c) => c.kind));
        const have = r.cards.filter((k) => kinds.has(k)).length;
        prog = have / r.cards.length; done = prog >= 1;
        hint = "Tablet: dodaj brakujące kafelki do pulpitu.";
        break;
      }
      default: break;
    }
    res.push({ id: r.id, ok: done, p: Math.max(0, Math.min(1, prog)), hint });
  }
  return res;
}

export function platformReady(state, der) {
  const p = state.tablet?.platform;
  if (!p) return false;
  return state.devs.some((d) => PLATFORMS[p].controllers.includes(d.id) && der.dev[d.uid]?.pw && der.dev[d.uid]?.net);
}

export function roomAt(data, floor, x, z) {
  return data.rooms.find((r) => r.floor === floor && pointInPoly(x, z, r.poly)) || null;
}

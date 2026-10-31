// Instalator: authoritative game state and the action reducer run by the TV.

import { BY_ID, CABLE_PER_M, KEYSTONE, PATCHCORD, PLATFORMS } from "./catalog.js";
import { rollJobs } from "./jobs.js";
import { panelLayout, panelFree, firstFreeDin, derive, evaluate, portCount, rackRoom } from "./sim.js";
import { cableLength } from "./geom.js";
import { PLAYER_COLORS, MAX_PLAYERS } from "./protocol.js";

export function newState() {
  return {
    v: 1, seq: 0, phase: "lobby", players: [],
    board: { seed: (Date.now() & 0xffffff) | 1, jobs: [], votes: {}, rolls: 0 },
    job: null, turn: { order: [], i: 0, task: null }, budget: { total: 0, spent: 0 },
    inv: {}, devs: [], patches: [],
    panel: { main: false, rcd: [false, false], br: {}, labels: {}, sparks: 0 },
    tablet: { dev: null, spot: null, mount: null, leveled: false, platform: null, dash: { cards: [] } },
    review: null, everPowered: false, history: []
  };
}

export function tasksFor(job, data) {
  if (!job || !data) return [];
  const t = [
    { id: "panel", name: "Rozdzielnica", icon: "din" },
    { id: "rack", name: data.rack ? "Szafa rack" : "Skrzynka multimedialna", icon: "net" },
    { id: "wifi", name: "Wi-Fi", icon: "wifi" }
  ];
  for (const r of data.rooms) if (r.kind !== "outdoor") t.push({ id: `room:${r.id}`, name: cap(r.name), icon: r.kind, room: r.id, floor: r.floor });
  if ((data.mounts || []).some((m) => ["outdoorWall", "doorbell", "gate", "garage"].includes(m.kind))) t.push({ id: "outdoor", name: "Na zewnątrz", icon: "outdoor" });
  t.push({ id: "tablet", name: "Tablet", icon: "tablet" });
  t.push({ id: "handover", name: "Odbiór", icon: "handover" });
  return t;
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function activeCid(s) {
  if (s.phase !== "job") return null;
  return s.turn.order[s.turn.i % Math.max(1, s.turn.order.length)] || null;
}

export function isActive(s, cid) {
  const online = s.players.filter((p) => p.online);
  if (online.length <= 1) return true;
  return activeCid(s) === cid;
}

const uid = (s) => `d${++s.seq}`;

export function advanceTurn(s) {
  const cur = activeCid(s);
  s.turn.task = null;
  const order = s.turn.order.filter((c) => s.players.find((p) => p.cid === c && p.online));
  if (!order.length) return;
  const at = order.indexOf(cur);
  s.turn.order = order;
  s.turn.i = at < 0 ? s.turn.i % order.length : (at + 1) % order.length;
}

function spend(s, zl) { s.budget.spent += zl; }

function invTake(s, id) {
  if (!s.inv[id]) return false;
  s.inv[id]--;
  if (!s.inv[id]) delete s.inv[id];
  return true;
}

function rackInfo(s, data) {
  const rackDevs = s.devs.filter((d) => d.place === "rack");
  const units = data.rack ? data.rack.units || 9 : 0;
  const used = new Set();
  for (const d of rackDevs) for (let k = 0; k < (BY_ID[d.id].u || 1); k++) used.add(d.u + k);
  const shelves = data.rack ? rackDevs.filter((d) => d.id === "rack-shelf").length * 3 : 4;
  const onShelf = s.devs.filter((d) => d.place === "shelf").length;
  return { units, used, shelfFree: shelves - onShelf };
}

function patchPanels(s) {
  return s.devs.filter((d) => d.id === "mb-keystone" || BY_ID[d.id]?.caps.includes("patch"));
}

function assignRuns(s, out) {
  const pps = patchPanels(s);
  if (!pps.length) return;
  const taken = new Set(s.devs.filter((d) => d.run && d.run.pp).map((d) => `${d.run.pp}#${d.run.port}`));
  for (const d of s.devs) {
    if (!d.run || d.run.pp) continue;
    for (const pp of pps) {
      const n = portCount(pp);
      let port = -1;
      for (let i = 0; i < n; i++) if (!taken.has(`${pp.uid}#${i}`)) { port = i; break; }
      if (port >= 0) {
        d.run.pp = pp.uid; d.run.port = port; taken.add(`${pp.uid}#${port}`);
        out.push({ fx: "run", uid: d.uid, pp: pp.uid, port });
        break;
      }
    }
  }
}

function needsRun(id) {
  const it = BY_ID[id];
  return it && (it.power === "poe" || it.id === "tablet-wall-mount");
}

export function startJob(s, job, data) {
  s.phase = "job";
  s.job = job;
  s.budget = { total: job.budget, spent: 0 };
  s.inv = {};
  s.devs = [];
  s.patches = [];
  s.everPowered = false;
  s.panel = { main: false, rcd: [false, false], br: {}, labels: {}, sparks: 0 };
  for (const c of data.circuits || []) s.panel.br[c.id] = false;
  s.tablet = { dev: null, spot: null, mount: null, leveled: false, platform: job.platform === "any" ? null : job.platform, dash: { cards: [] } };
  const anchor = data.rack || data.mediaBox || data.wan;
  s.devs.push({ uid: "ont", id: "ont", place: "fixed", room: anchor?.room, floor: anchor?.floor ?? 0, pos: (data.wan || anchor).pos });
  if (!data.rack) s.devs.push({ uid: "mbk", id: "mb-keystone", place: "fixed", room: anchor?.room, floor: anchor?.floor ?? 0, pos: anchor.pos });
  s.turn = { order: s.players.filter((p) => p.online).map((p) => p.cid), i: 0, task: null };
  s.review = null;
}

export function reduce(s, cid, a, data) {
  const out = [];
  const me = s.players.find((p) => p.cid === cid);
  const nope = (text) => { out.push({ to: cid, nope: text }); return out; };
  if (!a || !a.a) return out;

  if (a.a === "hello") {
    let p = me;
    if (!p) {
      if (s.players.length >= MAX_PLAYERS && !s.players.some((x) => !x.online)) return nope("Pełny pokój (max 4).");
      const used = new Set(s.players.filter((x) => x.online).map((x) => x.color));
      const slot = PLAYER_COLORS.findIndex((c) => !used.has(c));
      const ghost = s.players.find((x) => !x.online && x.name === a.name);
      if (ghost) { ghost.cid = cid; ghost.online = true; p = ghost; }
      else {
        p = { cid, name: String(a.name || "Gracz").slice(0, 14), color: PLAYER_COLORS[Math.max(0, slot)], online: true, host: false };
        s.players.push(p);
      }
    } else {
      p.online = true;
      if (a.name) p.name = String(a.name).slice(0, 14);
    }
    if (!s.players.some((x) => x.host && x.online)) { s.players.forEach((x) => (x.host = false)); p.host = true; }
    if (s.phase === "job" && !s.turn.order.includes(cid)) s.turn.order.push(cid);
    out.push({ fx: "join", cid });
    return out;
  }
  if (!me) return out;

  if (a.a === "react") { out.push({ fx: "react", cid, e: String(a.e).slice(0, 4) }); return out; }
  if (a.a === "ping") { out.push({ fx: "ping", cid, floor: a.floor, x: a.x, z: a.z }); return out; }
  if (a.a === "rename") { me.name = String(a.name || me.name).slice(0, 14); return out; }

  if (s.phase === "lobby") {
    if (a.a === "start" && me.host) {
      s.phase = "board";
      s.board.jobs = rollJobs(s.board.seed);
      s.board.votes = {};
      out.push({ fx: "deal" });
    }
    return out;
  }

  if (s.phase === "board") {
    if (a.a === "vote" && a.i >= 0 && a.i < 4) { s.board.votes[cid] = a.i; out.push({ fx: "vote", cid, i: a.i }); }
    if (a.a === "reroll" && me.host) {
      s.board.seed = (s.board.seed * 1103515245 + 12345) >>> 0 || 7;
      s.board.rolls++;
      s.board.jobs = rollJobs(s.board.seed);
      s.board.votes = {};
      out.push({ fx: "deal" });
    }
    if (a.a === "pick" && me.host) {
      const counts = [0, 0, 0, 0];
      Object.values(s.board.votes).forEach((i) => counts[i]++);
      let best = typeof a.i === "number" ? a.i : counts.indexOf(Math.max(...counts));
      out.push({ fx: "pick", i: best, job: s.board.jobs[best] });
    }
    return out;
  }

  if (s.phase === "review" || s.phase === "play") {
    if (a.a === "control") return control(s, a, out);
    if (a.a === "next" && me.host) { s.phase = "board"; s.board.seed = (s.board.seed * 69069 + 1) >>> 0; s.board.jobs = rollJobs(s.board.seed); s.board.votes = {}; out.push({ fx: "deal" }); }
    if (a.a === "play" && me.host) { s.phase = "play"; out.push({ fx: "play" }); }
    return out;
  }

  if (s.phase !== "job" || !data) return out;
  if (a.a === "control") return control(s, a, out);
  if (!isActive(s, cid)) return nope("Teraz tura kogoś innego. Możesz kibicować i podpowiadać.");

  switch (a.a) {
    case "task": {
      s.turn.task = a.id;
      out.push({ fx: "task", cid, id: a.id });
      break;
    }
    case "endTurn": {
      advanceTurn(s);
      out.push({ fx: "turn", cid: activeCid(s) });
      break;
    }
    case "buy": {
      const it = BY_ID[a.id];
      const n = Math.max(1, Math.min(12, a.n | 0 || 1));
      if (!it) return nope("Nie ma takiego produktu.");
      s.inv[a.id] = (s.inv[a.id] || 0) + n;
      spend(s, it.price * n);
      out.push({ fx: "buy", id: a.id, n, price: it.price * n });
      break;
    }
    case "refund": {
      if (!invTake(s, a.id)) return nope("Nie masz tego w skrzynce.");
      spend(s, -BY_ID[a.id].price);
      out.push({ fx: "refund", id: a.id });
      break;
    }
    case "install": {
      const it = BY_ID[a.id];
      const m = (data.mounts || []).find((x) => x.id === a.mount);
      if (!it || !m) return nope("Tu się tego nie zamontuje.");
      if (!(it.mounts || []).includes(m.kind) && !(m.kind === "outdoorWall" && (it.mounts || []).includes("wall") && it.caps.includes("outdoor"))) return nope(`To nie pasuje do miejsca: ${m.kind}.`);
      if (s.devs.some((d) => d.mount === m.id)) return nope("To miejsce jest zajęte.");
      if (!invTake(s, a.id)) return nope("Najpierw kup to w sklepie.");
      const d = { uid: uid(s), id: a.id, place: "mount", mount: m.id, kind: m.kind, room: m.room, floor: m.floor ?? 0, pos: m.pos, quat: m.quat, normal: m.normal, circuit: m.circuit || null, fixture: m.fixture || null, on: true, color: "#ffd9a0", bri: 0.85, paired: false };
      if (it.caps.includes("camera")) d.aim = a.aim || [m.normal[0], 0, m.normal[2]];
      if (needsRun(a.id)) addRun(s, d, data, out);
      s.devs.push(d);
      assignRuns(s, out);
      out.push({ fx: "install", uid: d.uid, id: a.id, style: a.style || null, by: cid });
      break;
    }
    case "strip": {
      const it = BY_ID[a.id];
      const sp = (data.strips || []).find((x) => x.id === a.strip);
      if (!it || !sp) return nope("Brak takiej ścieżki na taśmę.");
      if (!(it.strip || []).includes(sp.kind)) return nope("Ta taśma tu nie pasuje.");
      if (s.devs.some((d) => d.strip === sp.id)) return nope("Tu już jest taśma.");
      if (!invTake(s, a.id)) return nope("Najpierw kup taśmę.");
      const d = { uid: uid(s), id: a.id, place: "strip", strip: sp.id, stripKind: sp.kind, room: sp.room, floor: sp.floor ?? 0, pos: sp.points[0], on: true, color: "#ff9a5a", bri: 0.9, paired: false };
      s.devs.push(d);
      out.push({ fx: "install", uid: d.uid, id: a.id, style: "strip", by: cid });
      break;
    }
    case "aim": {
      const d = s.devs.find((x) => x.uid === a.uid);
      if (d && Array.isArray(a.dir)) { d.aim = [a.dir[0], 0, a.dir[2]]; out.push({ fx: "aim", uid: d.uid }); }
      break;
    }
    case "uninstall": {
      const i = s.devs.findIndex((x) => x.uid === a.uid && x.place !== "fixed");
      if (i < 0) return nope("Nie ma czego zdjąć.");
      const d = s.devs[i];
      if (d.place === "din" && s.panel.main) { s.panel.sparks++; out.push({ fx: "spark" }); return nope("Najpierw wyłącz zasilanie główne."); }
      s.devs.splice(i, 1);
      s.patches = s.patches.filter((p) => p.a[0] !== d.uid && p.b[0] !== d.uid);
      for (const o of s.devs) if (o.run && o.run.pp === d.uid) { o.run.pp = null; o.run.port = null; }
      s.inv[d.id] = (s.inv[d.id] || 0) + 1;
      if (s.tablet.dev === d.uid) s.tablet = { ...s.tablet, dev: null, spot: null, mount: null, leveled: false };
      assignRuns(s, out);
      out.push({ fx: "uninstall", uid: d.uid, id: d.id });
      break;
    }
    case "rackPut": {
      const it = BY_ID[a.id];
      if (!it || it.where !== "rack" || !data.rack) return nope("To nie wchodzi do szafy.");
      const info = rackInfo(s, data);
      const u = a.u | 0, n = it.u || 1;
      if (u < 0 || u + n > info.units) return nope("Nie mieści się w szafie.");
      for (let k = 0; k < n; k++) if (info.used.has(u + k)) return nope("To miejsce w szafie jest zajęte.");
      if (!invTake(s, a.id)) return nope("Najpierw kup to w sklepie.");
      const d = { uid: uid(s), id: a.id, place: "rack", u, room: data.rack.room, floor: data.rack.floor ?? 0, pos: data.rack.pos, paired: false, adopted: false };
      s.devs.push(d);
      assignRuns(s, out);
      out.push({ fx: "rack", uid: d.uid, id: a.id, u });
      break;
    }
    case "shelfPut": {
      const it = BY_ID[a.id];
      if (!it || it.where !== "shelf") return nope("To nie stoi na półce w szafie.");
      const info = rackInfo(s, data);
      if (info.shelfFree <= 0) return nope(data.rack ? "Dokup półkę do szafy (1U)." : "Skrzynka jest pełna.");
      if (!invTake(s, a.id)) return nope("Najpierw kup to w sklepie.");
      const anchor = data.rack || data.mediaBox;
      const d = { uid: uid(s), id: a.id, place: "shelf", room: anchor.room, floor: anchor.floor ?? 0, pos: anchor.pos, paired: false, adopted: false };
      s.devs.push(d);
      out.push({ fx: "shelf", uid: d.uid, id: a.id });
      break;
    }
    case "patch": {
      const A = s.devs.find((x) => x.uid === a.from?.[0]), B = s.devs.find((x) => x.uid === a.to?.[0]);
      if (!A || !B || A === B) return nope("Tak się nie da połączyć.");
      const pa = a.from[1] | 0, pb = a.to[1] | 0;
      if (pa >= portCount(A) || pb >= portCount(B)) return nope("Nie ma takiego portu.");
      const busy = (u, p) => s.patches.some((x) => (x.a[0] === u && x.a[1] === p) || (x.b[0] === u && x.b[1] === p));
      if (busy(A.uid, pa) || busy(B.uid, pb)) return nope("Port jest zajęty.");
      s.patches.push({ a: [A.uid, pa], b: [B.uid, pb], color: a.color || "#3fa7d6" });
      spend(s, PATCHCORD);
      out.push({ fx: "patch", a: [A.uid, pa], b: [B.uid, pb] });
      break;
    }
    case "unpatch": {
      const n = s.patches.length;
      s.patches = s.patches.filter((x) => !((x.a[0] === a.at[0] && x.a[1] === a.at[1]) || (x.b[0] === a.at[0] && x.b[1] === a.at[1])));
      if (s.patches.length !== n) out.push({ fx: "unpatch", at: a.at });
      break;
    }
    case "adopt": {
      const d = s.devs.find((x) => x.uid === a.uid);
      if (d) { d.adopted = true; out.push({ fx: "adopt", uid: d.uid }); }
      break;
    }
    case "breaker": {
      const p = s.panel;
      if (a.key === "main") p.main = !!a.on;
      else if (a.key.startsWith("rcd")) p.rcd[Number(a.key.slice(3))] = !!a.on;
      else if (a.key.startsWith("mcb:")) p.br[a.key.slice(4)] = !!a.on;
      if (p.main) s.everPowered = true;
      out.push({ fx: "breaker", key: a.key, on: !!a.on });
      break;
    }
    case "label": {
      s.panel.labels[a.circuit] = a.room || null;
      out.push({ fx: "label", circuit: a.circuit, room: a.room });
      break;
    }
    case "dinPut": {
      const it = BY_ID[a.id];
      if (!it || it.where !== "din") return nope("To nie jest moduł na szynę DIN.");
      if (s.panel.main) { s.panel.sparks++; out.push({ fx: "spark" }); return nope("Iskra! Najpierw wyłącz zasilanie główne."); }
      const lay = panelLayout(data);
      const pos = typeof a.row === "number" ? { row: a.row, slot: a.slot } : firstFreeDin(lay, it.mod || 1, s.devs);
      if (!pos || !panelFree(lay, it.mod || 1, pos.row, pos.slot, s.devs)) return nope("Na szynie nie ma tu miejsca.");
      if (!invTake(s, a.id)) return nope("Najpierw kup moduł.");
      const d = { uid: uid(s), id: a.id, place: "din", row: pos.row, slot: pos.slot, ch: new Array(it.channels || 0).fill(null), relay: new Array(it.channels || 0).fill(true), room: data.panel?.room, floor: data.panel?.floor ?? 0, pos: data.panel?.pos, paired: false };
      s.devs.push(d);
      out.push({ fx: "din", uid: d.uid, id: a.id });
      break;
    }
    case "dinCh": {
      const d = s.devs.find((x) => x.uid === a.uid && x.place === "din");
      if (!d || a.ch < 0 || a.ch >= d.ch.length) return nope("Nie ma takiego kanału.");
      if (s.panel.main) { s.panel.sparks++; out.push({ fx: "spark" }); return nope("Iskra! Przewody podpinamy bez prądu."); }
      for (const o of s.devs) if (o.place === "din" && o.ch) o.ch = o.ch.map((c) => (c === a.circuit ? null : c));
      d.ch[a.ch] = a.circuit || null;
      out.push({ fx: "wire", uid: d.uid, ch: a.ch, circuit: a.circuit });
      break;
    }
    case "tabletSpot": {
      const spot = (data.tabletSpots || []).find((x) => x.id === a.spot);
      if (!spot) return nope("Nie ma takiego miejsca.");
      const tabId = Object.keys(s.inv).find((k) => BY_ID[k]?.caps.includes("tablet")) || (s.tablet.dev && s.devs.find((d) => d.uid === s.tablet.dev)?.id);
      if (!tabId) return nope("Najpierw kup tablet.");
      const holder = spot.kind === "wall" ? "tablet-wall-mount" : "tablet-stand";
      const placedHolder = s.devs.find((d) => d.uid === s.tablet.holder);
      if (!s.inv[holder] && !(placedHolder && placedHolder.id === holder)) return nope(spot.kind === "wall" ? "Do ściany potrzebny jest uchwyt ścienny." : "Na blat potrzebny jest stojak magnetyczny.");
      if (s.tablet.dev) {
        const old = s.devs.find((d) => d.uid === s.tablet.dev);
        if (old) { s.inv[old.id] = (s.inv[old.id] || 0) + 1; s.devs = s.devs.filter((d) => d !== old); }
        const oldH = s.devs.find((d) => d.uid === s.tablet.holder);
        if (oldH) { s.inv[oldH.id] = (s.inv[oldH.id] || 0) + 1; s.devs = s.devs.filter((d) => d !== oldH); }
      }
      invTake(s, tabId);
      invTake(s, holder);
      const h = { uid: uid(s), id: holder, place: "tablet", room: spot.room, floor: spot.floor ?? 0, pos: spot.pos, quat: spot.quat, kind: spot.kind };
      const t = { uid: uid(s), id: tabId, place: "tablet", room: spot.room, floor: spot.floor ?? 0, pos: spot.pos, quat: spot.quat, kind: spot.kind, paired: true };
      if (holder === "tablet-wall-mount") addRun(s, h, data, out);
      s.devs.push(h, t);
      assignRuns(s, out);
      s.tablet.dev = t.uid; s.tablet.holder = h.uid; s.tablet.spot = spot.id; s.tablet.mount = null; s.tablet.leveled = false;
      out.push({ fx: "tabletSpot", uid: t.uid, spot: spot.id, kind: spot.kind });
      break;
    }
    case "tabletMount": {
      if (!s.tablet.dev) return nope("Najpierw wybierz miejsce.");
      const spot = (data.tabletSpots || []).find((x) => x.id === s.tablet.spot);
      s.tablet.leveled = !!a.leveled || spot?.kind !== "wall";
      s.tablet.mount = spot?.kind === "wall" ? "wall" : "stand";
      out.push({ fx: "tabletMount", mount: s.tablet.mount });
      break;
    }
    case "platform": {
      if (s.job.platform !== "any") return nope(`Klient chce ${PLATFORMS[s.job.platform].name}.`);
      if (!PLATFORMS[a.p]) return nope("Nie ma takiego systemu.");
      const tab = s.devs.find((d) => d.uid === s.tablet.dev);
      if (a.p === "apple" && tab && BY_ID[tab.id].os !== "ipados") return nope("Dom Apple działa tylko na iPadzie.");
      s.tablet.platform = a.p;
      s.devs.forEach((d) => { if (d.place !== "tablet") d.paired = false; });
      out.push({ fx: "platform", p: a.p });
      break;
    }
    case "pair": {
      const der = derive(s, data);
      const ids = Array.isArray(a.uids) ? a.uids : [a.uid];
      let n = 0;
      for (const u of ids) {
        const d = s.devs.find((x) => x.uid === u);
        if (d && der.dev[u]?.pairable) { d.paired = true; n++; out.push({ fx: "pair", uid: u }); }
      }
      if (!n) return nope("Tego nie da się teraz sparować.");
      break;
    }
    case "dash": {
      if (!Array.isArray(a.cards)) break;
      s.tablet.dash = { cards: a.cards.slice(0, 24).map((c, i) => ({ id: c.id || `c${i}`, kind: String(c.kind), dev: c.dev || null, x: c.x | 0, y: c.y | 0, w: Math.max(1, c.w | 0), h: Math.max(1, c.h | 0), title: c.title ? String(c.title).slice(0, 24) : null })), theme: a.theme || s.tablet.dash.theme || null };
      out.push({ fx: "dash" });
      break;
    }
    case "handover": {
      s.phase = "handover";
      const der = derive(s, data);
      const res = evaluate(s, data, der, s.job);
      const met = res.filter((r) => r.ok).length;
      let stars = (5 * met) / Math.max(1, res.length);
      const left = s.budget.total - s.budget.spent;
      if (left >= s.budget.total * 0.1) stars += 0.5;
      if (left < 0) stars -= 0.5;
      if (s.patches.length && s.devs.some((d) => d.id === "brush-panel")) stars += 0.25;
      if ((data.circuits || []).every((c) => s.panel.labels[c.id])) stars += 0.25;
      stars = Math.max(0.5, Math.min(5, Math.round(stars * 2) / 2));
      const pay = Math.round(s.budget.total * 0.18 + Math.max(0, left) * 0.3 + met * 120);
      s.review = { res, met, total: res.length, stars, left, pay, at: Date.now() };
      out.push({ fx: "handover" });
      break;
    }
    default: break;
  }
  return out;
}

function addRun(s, d, data, out) {
  const anchor = data.rack || data.mediaBox;
  if (!anchor) return;
  const len = Math.round(cableLength(d.pos, anchor.pos) + Math.abs((d.floor ?? 0) - (anchor.floor ?? 0)) * 3);
  d.run = { pp: null, port: null, len };
  const cost = len * CABLE_PER_M + KEYSTONE;
  s.budget.spent += cost;
  out.push({ fx: "cable", uid: d.uid, len, cost });
}

function control(s, a, out) {
  const d = s.devs.find((x) => x.uid === a.uid);
  if (!d) return out;
  if (typeof a.on === "boolean") d.on = a.on;
  if (typeof a.color === "string") d.color = a.color.slice(0, 9);
  if (typeof a.bri === "number") d.bri = Math.max(0, Math.min(1, a.bri));
  if (typeof a.relay === "number" && d.relay) d.relay[a.relay] = !d.relay[a.relay];
  if (typeof a.locked === "boolean") d.locked = a.locked;
  if (typeof a.temp === "number") d.temp = Math.max(5, Math.min(28, a.temp));
  out.push({ fx: "control", uid: d.uid });
  return out;
}

export function snapshotFor(s, data) {
  const der = data && s.phase !== "lobby" && s.phase !== "board" ? derive(s, data) : null;
  const reqs = der && s.job ? evaluate(s, data, der, s.job) : [];
  return { ...s, der: der ? { dev: der.dev, cov: der.cov, online: der.online, poeUsed: der.poeUsed, issues: der.issues, aps: der.aps } : null, reqs };
}

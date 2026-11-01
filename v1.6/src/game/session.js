// Instalator: game session — the host runs the rules and broadcasts snapshots, clients send actions; same interface for both.

import { createHost, connectClient } from "../net/index.js";
import { PROTO } from "../shared/protocol.js";
import { newState, reduce, startJob, tasksFor, snapshotFor, activeCid, advanceTurn } from "../shared/game.js";

const SAVE_KEY = "instalator.fpp.save.v1";

function makeCid() {
  try {
    let v = sessionStorage.getItem("instalator.fpp.cid");
    if (!v) { v = `g${Math.random().toString(36).slice(2, 9)}`; sessionStorage.setItem("instalator.fpp.cid", v); }
    return v;
  } catch (e) { return `g${Math.random().toString(36).slice(2, 9)}`; }
}

export async function hostSession({ name, isPublic, roomName, ui }) {
  const state = newState();
  const me = makeCid();
  let data = null, tasks = [], pending = 0, lobbyTimer = 0;
  const s = { me, isHost: true, S: null, code: "", localCode: "", state, get data() { return data; } };

  const emit = (events) => {
    for (const e of events) {
      if (e.to) { if (e.nope) (e.to === me ? ui.nope(e.nope) : host.send(e.to, { t: "nope", text: e.nope })); continue; }
      ui.fx(e);
      host.broadcast({ t: "fx", e });
    }
  };
  const push = () => {
    if (pending) return;
    pending = setTimeout(() => {
      pending = 0;
      const snap = snapshotFor(state, data);
      snap.tasks = tasks;
      snap.active = activeCid(state);
      s.S = snap;
      host.broadcast({ t: "state", s: snap });
      ui.snap(snap);
      autosave();
    }, 25);
  };
  const act = (cid, msg) => {
    if (msg.a === "hello" && msg.proto !== PROTO && cid !== me) { host.send(cid, { t: "nope", text: "Inna wersja gry. Odśwież stronę." }); return; }
    if (msg.a === "pick" && cid === state.players.find((p) => p.host)?.cid && state.phase === "board") {
      const counts = [0, 0, 0, 0];
      Object.values(state.board.votes).forEach((i) => counts[i]++);
      const i = typeof msg.i === "number" ? msg.i : counts.indexOf(Math.max(...counts));
      beginJob(state.board.jobs[i]);
      return;
    }
    emit(reduce(state, cid, msg, data));
    if (msg.a === "hello" && cid !== me) {
      const p = state.players.find((x) => x.cid === cid);
      host.send(cid, { t: "welcome", you: { cid, name: p?.name, color: p?.color, host: p?.host }, code: s.code });
    }
    push();
  };
  const beginJob = async (job) => {
    ui.loading(`Jedziemy: ${job.buildingName}`);
    data = await ui.loadBuilding(job.building, job.id);
    startJob(state, job, data);
    tasks = tasksFor(job, data);
    emit([{ fx: "jobStart", job }]);
    push();
  };
  const autosave = () => {
    if (!["job", "handover", "review", "play"].includes(state.phase)) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ at: Date.now(), state: { ...state, phase: state.phase === "handover" ? "job" : state.phase } })); } catch (e) {}
  };

  const host = await createHost({
    onConnect: () => {},
    onLeave: (cid) => {
      const p = state.players.find((x) => x.cid === cid);
      if (p) { p.online = false; if (p.host) { p.host = false; const n = state.players.find((x) => x.online); if (n) n.host = true; } }
      if (state.phase === "job" && activeCid(state) === cid) { advanceTurn(state); emit([{ fx: "turn", cid: activeCid(state) }]); }
      ui.avatarGone(cid);
      push();
    },
    onMsg: (cid, m) => { if (m && m.t === "act") act(cid, m); },
    onStream: (cid, m) => {
      if (!m) return;
      if (m.t === "pose") { ui.pose(cid, m); for (const p of state.players) if (p.online && p.cid !== cid && p.cid !== me) host.stream(p.cid, { ...m, cid }); }
      if (m.t === "ping") { ui.ping(cid, m); host.broadcast({ t: "ping", cid, ...m }); }
    },
    onOnline: (code) => {
      s.code = code || s.localCode;
      ui.online(code);
      if (code) publishLobby();
    }
  });
  s.localCode = host.localCode || host.code;
  s.code = host.code;

  const publishLobby = async () => {
    try {
      const { fb } = await import("../net/firebase.js");
      const api = await fb();
      const tick = () => {
        const players = state.players.filter((p) => p.online).length;
        api.set(api.ref(`lobby/${s.code}`), { name: roomName || `${name}: zlecenie`, host: name, public: !!isPublic, players, building: state.job?.building || null, phase: state.phase, at: Date.now() }).catch(() => {});
      };
      tick();
      clearInterval(lobbyTimer);
      lobbyTimer = setInterval(tick, 20000);
      addEventListener("beforeunload", () => { try { api.remove(api.ref(`lobby/${s.code}`)); } catch (e) {} });
    } catch (e) { console.warn("[lobby] publish failed", e); }
  };

  s.send = (a) => act(me, { t: "act", ...a });
  s.pose = (m) => { for (const p of state.players) if (p.online && p.cid !== me) host.stream(p.cid, { ...m, t: "pose", cid: me }); };
  s.ping = (m) => { ui.ping(me, m); host.broadcast({ t: "ping", cid: me, ...m }); };
  s.resume = async () => {
    try {
      const sv = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!sv?.state?.job) return false;
      const keep = state.players.slice();
      Object.assign(state, sv.state);
      state.players = keep.concat(sv.state.players.filter((p) => !keep.some((k) => k.cid === p.cid)).map((p) => ({ ...p, online: false, host: false })));
      state.turn.order = state.players.filter((p) => p.online).map((p) => p.cid);
      state.turn.i = 0;
      data = await ui.loadBuilding(state.job.building, state.job.id);
      tasks = tasksFor(state.job, data);
      emit([{ fx: "jobStart", job: state.job, resumed: true }]);
      push();
      return true;
    } catch (e) { return false; }
  };
  s.hasSave = () => { try { const sv = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); return sv?.state?.job && Date.now() - sv.at < 5 * 86400e3 ? sv : null; } catch (e) { return null; } };
  s.close = () => { clearInterval(lobbyTimer); try { host.close?.(); } catch (e) {} };
  act(me, { t: "act", a: "hello", name, proto: PROTO });
  return s;
}

export async function joinSession(code, { name, ui }) {
  const me = makeCid();
  const s = { me, isHost: false, S: null, code };
  const link = await connectClient({
    code, cid: me,
    onOpen: () => link.send({ t: "act", a: "hello", name, proto: PROTO }),
    onMsg: (m) => {
      if (m.t === "state") { s.S = m.s; ui.snap(m.s); }
      else if (m.t === "fx") ui.fx(m.e);
      else if (m.t === "nope") ui.nope(m.text);
      else if (m.t === "pose") ui.pose(m.cid, m);
      else if (m.t === "ping") ui.ping(m.cid, m);
    },
    onClose: () => ui.lost()
  });
  s.send = (a) => link.send({ t: "act", ...a });
  s.pose = (m) => link.stream({ ...m, t: "pose" });
  s.ping = (m) => link.stream({ ...m, t: "ping" });
  s.close = () => { try { link.close?.(); } catch (e) {} };
  return s;
}

export async function listRooms() {
  const { fb } = await import("../net/firebase.js");
  const api = await fb(8000);
  const all = (await api.get(api.ref("lobby"))) || {};
  const now = Date.now();
  return Object.entries(all).filter(([, v]) => v && v.public && now - (v.at || 0) < 60000).map(([code, v]) => ({ code, ...v })).sort((a, b) => b.at - a.at);
}

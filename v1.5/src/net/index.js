// Instalator: transport — a same-browser channel for the docked computer panel right away, the online room (WebRTC + RTDB) joins in the background.

import { netMode } from "../shared/protocol.js";

export async function createHost(handlers) {
  const local = await import("./local.js");
  if (netMode() === "local") {
    const h = await local.createLocalHost(handlers);
    h.localCode = h.code;
    setTimeout(() => handlers.onOnline && handlers.onOnline(null), 0);
    return h;
  }
  const via = new Map();
  const wrap = (tag) => ({
    onConnect: (cid) => { via.set(cid, tag); handlers.onConnect(cid); },
    onLeave: (cid, r) => { if (via.get(cid) === tag) via.delete(cid); handlers.onLeave(cid, r); },
    onMsg: (cid, m) => { via.set(cid, tag); handlers.onMsg(cid, m); },
    onStream: (cid, m) => handlers.onStream(cid, m)
  });
  const loc = await local.createLocalHost(wrap("local"));
  const api = {
    code: loc.code,
    localCode: loc.code,
    kind: "local",
    rtc: null,
    send: (cid, msg) => (via.get(cid) === "rtc" && api.rtc ? api.rtc : loc).send(cid, msg),
    broadcast: (msg) => { loc.broadcast(msg); if (api.rtc) api.rtc.broadcast(msg); },
    stream: (cid, msg) => (via.get(cid) === "rtc" && api.rtc ? api.rtc : loc).stream(cid, msg),
    mode: (cid) => (via.get(cid) === "rtc" && api.rtc ? api.rtc.mode(cid) : "local"),
    kick: (cid) => (via.get(cid) === "rtc" && api.rtc ? api.rtc : loc).kick(cid),
    close: async () => { await loc.close(); if (api.rtc) await api.rtc.close(); }
  };
  (async () => {
    try {
      api.rtc = await (await import("./host.js")).createRtcHost({ ...wrap("rtc"), preferred: loc.code });
      api.code = api.rtc.code;
      api.kind = "dual";
      if (handlers.onOnline) handlers.onOnline(api.code);
    } catch (e) {
      console.warn("[net] online room unavailable, computer-only", e);
      if (handlers.onOnline) handlers.onOnline(null);
    }
  })();
  return api;
}

export async function connectClient(opts) {
  if (netMode() === "local") return (await import("./local.js")).connectLocalClient(opts);
  return (await import("./client.js")).connectRtcClient(opts);
}

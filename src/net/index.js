// Instalator: picks the transport — online room (WebRTC + RTDB) merged with a same-browser channel for the docked computer panel.

import { netMode } from "../shared/protocol.js";

export async function createHost(handlers) {
  const local = await import("./local.js");
  if (netMode() === "local") return local.createLocalHost(handlers);
  const via = new Map();
  const wrap = (tag) => ({
    onConnect: (cid) => { via.set(cid, tag); handlers.onConnect(cid); },
    onLeave: (cid, r) => { if (via.get(cid) === tag) via.delete(cid); handlers.onLeave(cid, r); },
    onMsg: (cid, m) => { via.set(cid, tag); handlers.onMsg(cid, m); },
    onStream: (cid, m) => handlers.onStream(cid, m)
  });
  let rtc = null;
  try {
    rtc = await (await import("./host.js")).createRtcHost(wrap("rtc"));
  } catch (e) {
    console.warn("[net] online room failed, computer-only", e);
  }
  const loc = await local.createLocalHost({ ...wrap("local"), code: rtc ? rtc.code : undefined });
  if (!rtc) return loc;
  const pick = (cid) => (via.get(cid) === "local" ? loc : rtc);
  return {
    code: rtc.code,
    kind: "dual",
    send: (cid, msg) => pick(cid).send(cid, msg),
    broadcast: (msg) => { rtc.broadcast(msg); loc.broadcast(msg); },
    stream: (cid, msg) => pick(cid).stream(cid, msg),
    mode: (cid) => pick(cid).mode(cid),
    kick: (cid) => pick(cid).kick(cid),
    close: async () => { await rtc.close(); await loc.close(); }
  };
}

export async function connectClient(opts) {
  if (netMode() === "local") return (await import("./local.js")).connectLocalClient(opts);
  return (await import("./client.js")).connectRtcClient(opts);
}

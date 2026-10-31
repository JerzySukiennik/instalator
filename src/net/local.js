// Instalator: same-browser transport over BroadcastChannel for tests and the built-in pad emulator.

import { makeRoomCode } from "./signaling.js";

const name = (code) => `instalator-local-${code}`;

export async function createLocalHost({ onConnect, onLeave, onMsg, onStream, code }) {
  code = (code || new URLSearchParams(location.search).get("room") || makeRoomCode()).toUpperCase();
  const bc = new BroadcastChannel(name(code));
  const peers = new Set();
  bc.onmessage = (e) => {
    const d = e.data;
    if (!d || d.k !== "c2h") return;
    if (d.kind === "hi") {
      const fresh = !peers.has(d.cid);
      peers.add(d.cid);
      bc.postMessage({ k: "h2c", to: d.cid, kind: "open" });
      if (fresh) onConnect(d.cid);
      return;
    }
    if (!peers.has(d.cid)) return;
    if (d.kind === "bye") { peers.delete(d.cid); onLeave(d.cid, "left"); return; }
    if (d.kind === "ev") onMsg(d.cid, d.m);
    if (d.kind === "in") onStream(d.cid, d.m);
  };
  bc.postMessage({ k: "h2c", to: "*", kind: "host-up" });
  return {
    code,
    kind: "local",
    send(cid, msg) { bc.postMessage({ k: "h2c", to: cid, kind: "ev", m: msg }); return true; },
    broadcast(msg) { peers.forEach((cid) => bc.postMessage({ k: "h2c", to: cid, kind: "ev", m: msg })); },
    stream(cid, msg) { bc.postMessage({ k: "h2c", to: cid, kind: "in", m: msg }); return true; },
    mode() { return "local"; },
    kick(cid) { peers.delete(cid); onLeave(cid, "kicked"); },
    async close() { bc.close(); }
  };
}

export async function connectLocalClient({ code, cid, onOpen, onMsg, onClose }) {
  const bc = new BroadcastChannel(name(String(code).toUpperCase()));
  let opened = false;
  const hello = () => bc.postMessage({ k: "c2h", cid, kind: "hi" });
  bc.onmessage = (e) => {
    const d = e.data;
    if (!d || d.k !== "h2c") return;
    if (d.kind === "host-up") { hello(); return; }
    if (d.to !== cid && d.to !== "*") return;
    if (d.kind === "open") { if (!opened) { opened = true; onOpen("local"); } return; }
    if (d.kind === "ev" || d.kind === "in") onMsg(d.m);
  };
  window.addEventListener("pagehide", () => bc.postMessage({ k: "c2h", cid, kind: "bye" }));
  hello();
  const retry = setInterval(() => { if (opened) clearInterval(retry); else hello(); }, 800);
  return {
    send(msg) { bc.postMessage({ k: "c2h", cid, kind: "ev", m: msg }); return true; },
    stream(msg) { bc.postMessage({ k: "c2h", cid, kind: "in", m: msg }); return true; },
    mode() { return opened ? "local" : "connecting"; },
    close() { bc.postMessage({ k: "c2h", cid, kind: "bye" }); bc.close(); clearInterval(retry); if (onClose) onClose("closed"); }
  };
}

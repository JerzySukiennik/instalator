// Instalator: picks the transport (WebRTC + RTDB, or local BroadcastChannel with ?net=local).

import { netMode } from "../shared/protocol.js";

export async function createHost(handlers) {
  if (netMode() === "local") return (await import("./local.js")).createLocalHost(handlers);
  try {
    return await (await import("./host.js")).createRtcHost(handlers);
  } catch (e) {
    console.warn("[net] online room failed, falling back to local", e);
    return (await import("./local.js")).createLocalHost(handlers);
  }
}

export async function connectClient(opts) {
  if (netMode() === "local") return (await import("./local.js")).connectLocalClient(opts);
  return (await import("./client.js")).connectRtcClient(opts);
}

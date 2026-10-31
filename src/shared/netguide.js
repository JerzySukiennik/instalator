// Instalator: network guide — the next step to get every device online, and the full list of patches that would do it.

import { BY_ID } from "./catalog.js";
import { portCount } from "./sim.js";

const COL = { wan: "#80868b", up: "#3e9b5f", ap: "#3f7fd6", cam: "#f3cf45", hub: "#eeeeee", other: "#8b6bd6" };

function used(S, uid, p) {
  return S.patches.some((x) => (x.a[0] === uid && x.a[1] === p) || (x.b[0] === uid && x.b[1] === p));
}

function freePort(S, d, from = 0, test = () => true, extra = new Set()) {
  const n = portCount(d);
  for (let i = from; i < n; i++) if (!used(S, d.uid, i) && !extra.has(`${d.uid}#${i}`) && test(i)) return i;
  return -1;
}

export function netPlan(S) {
  const inRack = (d) => d.place === "rack" || d.place === "shelf";
  const gw = S.devs.find((d) => inRack(d) && BY_ID[d.id]?.caps.includes("gateway"));
  const sws = S.devs.filter((d) => inRack(d) && BY_ID[d.id]?.caps.includes("switch"));
  const poeSw = sws.find((d) => BY_ID[d.id].ports?.poe) || null;
  const sw = poeSw || sws[0] || null;
  const ont = S.devs.find((d) => d.id === "ont");
  const links = [];
  const taken = new Set();
  const add = (a, b, color, why) => { links.push({ from: a, to: b, color, why }); taken.add(`${a[0]}#${a[1]}`); taken.add(`${b[0]}#${b[1]}`); };
  if (gw && ont && !used(S, gw.uid, 0) && !used(S, ont.uid, 0)) add([ont.uid, 0], [gw.uid, 0], COL.wan, "Internet: ONT → WAN bramki");
  const swLinked = sw && S.patches.some((p) => [p.a[0], p.b[0]].includes(sw.uid) && [p.a[0], p.b[0]].includes(gw?.uid));
  if (gw && sw && !swLinked) {
    const gp = freePort(S, gw, 1, () => true, taken);
    const up = (() => { const n = portCount(sw); for (let i = n - 1; i >= 0; i--) if (!used(S, sw.uid, i) && !taken.has(`${sw.uid}#${i}`)) return i; return -1; })();
    if (gp >= 0 && up >= 0) add([gw.uid, gp], [sw.uid, up], COL.up, "Bramka → switch");
  }
  const poeN = poeSw ? BY_ID[poeSw.id].ports.poe : 0;
  const runs = S.devs.filter((d) => d.run && d.run.pp && !used(S, d.run.pp, d.run.port)).sort((a, b) => a.run.port - b.run.port);
  for (const d of runs) {
    const it = BY_ID[d.id] || {};
    const needPoe = it.power === "poe" || d.id === "tablet-wall-mount";
    let tgt = null;
    if (needPoe && poeSw) { const p = freePort(S, poeSw, 0, (i) => i < poeN, taken); if (p >= 0) tgt = [poeSw.uid, p]; }
    if (!tgt && sw && !needPoe) { const p = freePort(S, sw, 0, () => true, taken); if (p >= 0) tgt = [sw.uid, p]; }
    if (!tgt && gw && !needPoe) { const p = freePort(S, gw, 1, () => true, taken); if (p >= 0) tgt = [gw.uid, p]; }
    if (tgt) add([d.run.pp, d.run.port], tgt, it.caps?.includes("camera") ? COL.cam : it.caps?.includes("ap") ? COL.ap : COL.other, `Kabel ze ściany: ${it.name}`);
  }
  const boxes = S.devs.filter((d) => inRack(d) && d !== gw && !sws.includes(d) && BY_ID[d.id]?.ports && !BY_ID[d.id].caps.includes("patch") && portCount(d) > 0 && !used(S, d.uid, 0));
  for (const d of boxes) {
    let tgt = null;
    if (sw) { const p = freePort(S, sw, poeSw ? 0 : 0, (i) => !poeSw || i >= 0, taken); if (p >= 0) tgt = [sw.uid, p]; }
    if (!tgt && gw) { const p = freePort(S, gw, 1, () => true, taken); if (p >= 0) tgt = [gw.uid, p]; }
    if (tgt) add([d.uid, 0], tgt, COL.hub, `Sieć dla: ${BY_ID[d.id].name}`);
  }
  return { gw, sw, poeSw, ont, links };
}

export function netStep(S, data) {
  const inv = (pred) => Object.keys(S.inv || {}).find((id) => S.inv[id] > 0 && BY_ID[id] && pred(BY_ID[id]));
  const placed = (pred) => S.devs.find((d) => (d.place === "rack" || d.place === "shelf") && BY_ID[d.id] && pred(BY_ID[d.id]));
  const runs = S.devs.filter((d) => d.run);
  const poeDevs = S.devs.filter((d) => BY_ID[d.id]?.power === "poe" && d.run);
  const rack = !!data?.rack;
  if (!placed((it) => it.caps.includes("gateway"))) {
    const have = inv((it) => it.caps.includes("gateway"));
    if (have && rack && BY_ID[have].where === "shelf" && !placed((it) => it.caps.includes("shelf"))) {
      const sh = inv((it) => it.caps.includes("shelf"));
      return sh ? { n: 1, text: "Zamontuj półkę 1U w szafie: stanie na niej bramka.", place: sh } : { n: 1, text: "Bramka stoi na półce. Kup półkę 1U do szafy (Sieć UniFi).", buy: "siec" };
    }
    return have ? { n: 1, text: `Zamontuj bramkę ${BY_ID[have].name} w ${rack ? "szafie" : "skrzynce"}.`, place: have } : { n: 1, text: "Kup bramkę UniFi: to serce sieci, daje internet całemu domowi.", buy: "siec" };
  }
  if (poeDevs.length && !placed((it) => it.caps.includes("switch") && it.ports?.poe)) {
    const have = inv((it) => it.caps.includes("switch") && it.ports?.poe);
    return have ? { n: 2, text: `Zamontuj switch ${BY_ID[have].name}: zasili kablem punkty Wi-Fi i kamery.`, place: have } : { n: 2, text: "Kup switch PoE: punkty Wi-Fi i kamery biorą prąd prosto z kabla sieciowego.", buy: "siec" };
  }
  if (rack && runs.length && !placed((it) => it.caps.includes("patch"))) {
    const have = inv((it) => it.caps.includes("patch"));
    return have ? { n: 3, text: "Zamontuj patch panel: tu kończą się kable ze ścian.", place: have } : { n: 3, text: "Kup patch panel: tam dochodzą kable ze ścian, każdy z podpisem pokoju.", buy: "siec" };
  }
  const shelfWait = inv((it) => it.where === "shelf" || it.where === "rack");
  const plan = netPlan(S);
  if (plan.links.length) {
    const l = plan.links[0];
    return { n: 4, text: `${l.why}. Przeciągnij kabel między świecącymi portami albo stuknij Podłącz.`, link: l, all: plan.links };
  }
  if (shelfWait) return { n: 5, text: `W skrzynce czeka ${BY_ID[shelfWait].name}. Zamontuj ${BY_ID[shelfWait].where === "shelf" ? "na półce" : "w szafie"}.`, place: shelfWait };
  return { n: 6, text: "Sieć gotowa. Wszystko, co trzeba, jest wpięte.", done: true };
}

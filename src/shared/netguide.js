// Instalator: network guide — the next step to get every device online, the patches that would do it, and fixes for power and wrong ports.

import { BY_ID } from "./catalog.js";
import { portCount, rackRoom, roomCircuit } from "./sim.js";

const COL = { wan: "#80868b", up: "#3e9b5f", ap: "#3f7fd6", cam: "#f3cf45", hub: "#eeeeee", other: "#8b6bd6" };

function used(S, uid, p) {
  return S.patches.some((x) => (x.a[0] === uid && x.a[1] === p) || (x.b[0] === uid && x.b[1] === p));
}

function patchAt(S, uid, p) {
  return S.patches.find((x) => (x.a[0] === uid && x.a[1] === p) || (x.b[0] === uid && x.b[1] === p));
}

function otherEnd(pt, uid, p) {
  return pt.a[0] === uid && pt.a[1] === p ? pt.b : pt.a;
}

function freePort(S, d, from = 0, test = () => true, extra = new Set()) {
  const n = portCount(d);
  for (let i = from; i < n; i++) if (!used(S, d.uid, i) && !extra.has(`${d.uid}#${i}`) && test(i)) return i;
  return -1;
}

const nameOf = (S, uid) => {
  const d = S.devs.find((x) => x.uid === uid);
  if (!d) return "urządzenia";
  if (d.id === "ont") return "ONT (światłowód)";
  return BY_ID[d.id]?.name || "urządzenia";
};

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
    if (sw) { const p = freePort(S, sw, 0, () => true, taken); if (p >= 0) tgt = [sw.uid, p]; }
    if (!tgt && gw) { const p = freePort(S, gw, 1, () => true, taken); if (p >= 0) tgt = [gw.uid, p]; }
    if (tgt) add([d.uid, 0], tgt, COL.hub, `Sieć dla: ${BY_ID[d.id].name}`);
  }
  return { gw, sw, poeSw, ont, links };
}

function powerWarn(S, data, gw) {
  if (!gw || !S.der || S.der.dev[gw.uid]?.pw) return null;
  const room = data ? rackRoom(data) : null;
  const c = room ? roomCircuit(data, room, "socket") : null;
  const roomName = data?.rooms.find((r) => r.id === room)?.name;
  const what = !S.panel?.main ? "główny wyłącznik, różnicówki i bezpieczniki" : c ? `bezpiecznik gniazdek${roomName ? ` (${roomName})` : ""} i jego różnicówkę` : "wszystkie bezpieczniki";
  return { text: `${data?.rack ? "Szafa" : "Skrzynka"} nie ma prądu, więc nic w niej nie świeci i Wi-Fi ma 0%. W rozdzielnicy włącz ${what}.`, goto: "panel" };
}

function wanFix(S, gw, ont) {
  if (!gw || !ont) return null;
  const pw0 = patchAt(S, gw.uid, 0);
  if (pw0) {
    const [ou, op] = otherEnd(pw0, gw.uid, 0);
    if (ou === ont.uid) return null;
    const lan = freePort(S, gw, 1);
    const ops = [{ unpatch: [gw.uid, 0] }];
    if (lan >= 0) ops.push({ patch: { from: [ou, op], to: [gw.uid, lan], color: pw0.color } });
    if (!used(S, ont.uid, 0)) ops.push({ patch: { from: [ont.uid, 0], to: [gw.uid, 0], color: COL.wan } });
    return { n: 4, text: `W porcie WAN bramki siedzi kabel od: ${nameOf(S, ou)}. WAN służy tylko do internetu z ONT, dlatego reszta sieci nie działa.`, fix: ops, link: lan >= 0 ? { from: [ou, op], to: [gw.uid, lan] } : null };
  }
  const po = patchAt(S, ont.uid, 0);
  if (po) {
    const [xu, xp] = otherEnd(po, ont.uid, 0);
    return { n: 4, text: `Internet z ONT jest wpięty w ${xu === gw.uid ? "zwykły port bramki" : nameOf(S, xu)}, a musi iść do portu WAN bramki.`, fix: [{ unpatch: [xu, xp] }, { patch: { from: [ont.uid, 0], to: [gw.uid, 0], color: COL.wan } }], link: { from: [ont.uid, 0], to: [gw.uid, 0] } };
  }
  return null;
}

function doctor(S, data, plan) {
  const der = S.der;
  if (!der) return null;
  const { gw, poeSw } = plan;
  const byUid = (uid) => S.devs.find((d) => d.uid === uid);
  const inRack = (d) => d.place === "rack" || d.place === "shelf";
  const sws = S.devs.filter((d) => inRack(d) && BY_ID[d.id]?.caps.includes("switch"));
  for (const sw of sws) {
    if (der.dev[sw.uid]?.net || !der.dev[sw.uid]?.pw || !gw) continue;
    const linkedTo = S.patches.filter((p) => p.a[0] === sw.uid || p.b[0] === sw.uid);
    if (!linkedTo.length && sw !== plan.sw) continue;
    const gp = freePort(S, gw, 1);
    const up = (() => { for (let i = portCount(sw) - 1; i >= 0; i--) if (!used(S, sw.uid, i)) return i; return -1; })();
    if (gp >= 0 && up >= 0) {
      const link = { from: [gw.uid, gp], to: [sw.uid, up], color: COL.up, why: `${BY_ID[sw.id].name} nie jest połączony z bramką` };
      return { n: 4, text: `${BY_ID[sw.id].name} nie ma połączenia z bramką, więc wszystko, co w nim siedzi, jest bez sieci i bez PoE.`, link, all: [link] };
    }
  }
  const poeN = poeSw ? BY_ID[poeSw.id].ports.poe : 0;
  for (const d of S.devs) {
    const it = BY_ID[d.id] || {};
    if (it.power !== "poe" || !d.run || !d.run.pp || der.dev[d.uid]?.pw) continue;
    const pt = patchAt(S, d.run.pp, d.run.port);
    if (!pt) continue;
    const [xu, xp] = otherEnd(pt, d.run.pp, d.run.port);
    const X = byUid(xu);
    const xit = BY_ID[X?.id] || {};
    const poePort = xit.caps?.includes("switch") && xp < (xit.ports?.poe || 0);
    if (!poePort) {
      if (!poeSw) return { n: 2, text: `${it.name} siedzi w porcie bez zasilania PoE (${nameOf(S, xu)}). Kup switch PoE: on daje prąd po kablu.`, buy: "siec" };
      const p = freePort(S, poeSw, 0, (i) => i < poeN);
      if (p < 0) return { n: 4, text: `${BY_ID[poeSw.id].name} nie ma wolnych portów PoE. Dokup drugi switch PoE.`, buy: "siec" };
      const why = xit.caps?.includes("gateway") ? "bramka nie daje prądu po kablu" : xit.caps?.includes("switch") ? "ten port nie ma błyskawicy" : "tam nie ma zasilania";
      return { n: 4, text: `${it.name} jest wpięty w ${nameOf(S, xu)}, ale ${why}. Przepnę go do portu PoE.`, fix: [{ unpatch: [xu, xp] }, { patch: { from: [d.run.pp, d.run.port], to: [poeSw.uid, p], color: pt.color } }], link: { from: [d.run.pp, d.run.port], to: [poeSw.uid, p] } };
    }
    if ((der.issues || []).some((x) => x.dev === d.uid && x.why === "poe-budget")) return { n: 4, text: `${xit.name} nie ma już mocy PoE dla: ${it.name}. Kup mocniejszy switch PoE.`, buy: "siec" };
  }
  const waiting = S.devs.filter((d) => d.run && !d.run.pp);
  if (waiting.length) return { n: 3, text: `${waiting.length === 1 ? "Kabel" : `${waiting.length} kable`} ze ścian nie ${waiting.length === 1 ? "ma" : "mają"} wolnego gniazda na patch panelu. Dokup drugi patch panel.`, buy: "siec" };
  const dark = S.devs.find((d) => d.run && d.run.pp && !(der.dev[d.uid]?.pw && der.dev[d.uid]?.net) && used(S, d.run.pp, d.run.port));
  if (dark) return { n: 4, text: `${BY_ID[dark.id]?.name || "Urządzenie"} nadal nie działa. Sprawdź jego kabel w szafie.` };
  return null;
}

export function netStep(S, data) {
  const inv = (pred) => Object.keys(S.inv || {}).find((id) => S.inv[id] > 0 && BY_ID[id] && pred(BY_ID[id]));
  const placed = (pred) => S.devs.find((d) => (d.place === "rack" || d.place === "shelf") && BY_ID[d.id] && pred(BY_ID[d.id]));
  const runs = S.devs.filter((d) => d.run);
  const poeDevs = S.devs.filter((d) => BY_ID[d.id]?.power === "poe" && d.run);
  const rack = !!data?.rack;
  const gw = placed((it) => it.caps.includes("gateway"));
  const warn = powerWarn(S, data, gw);
  const withWarn = (st) => (warn ? { ...st, warn } : st);
  if (!rack) {
    const big = inv((it) => it.where === "rack");
    if (big) {
      const alt = BY_ID[big].caps.includes("gateway") ? "UniFi Cloud Gateway Ultra albo Max" : BY_ID[big].caps.includes("switch") ? "UniFi Switch Lite 8 PoE" : "coś mniejszego";
      return withWarn({ n: 1, text: `${BY_ID[big].name} to sprzęt do szafy rack 19 cali, a tu jest mała skrzynka multimedialna i się nie zmieści. Zwróć go i weź ${alt}.`, refund: big });
    }
  }
  if (!gw) {
    const have = inv((it) => it.caps.includes("gateway") && (rack || it.where !== "rack"));
    if (have && rack && BY_ID[have].where === "shelf" && !placed((it) => it.caps.includes("shelf"))) {
      const sh = inv((it) => it.caps.includes("shelf"));
      return sh ? { n: 1, text: "Zamontuj półkę 1U w szafie: stanie na niej bramka.", place: sh } : { n: 1, text: "Bramka stoi na półce. Kup półkę 1U do szafy (Sieć UniFi).", buy: "siec" };
    }
    return have ? { n: 1, text: `Zamontuj bramkę ${BY_ID[have].name} w ${rack ? "szafie" : "skrzynce"}.`, place: have } : { n: 1, text: "Kup bramkę UniFi: to serce sieci, daje internet całemu domowi.", buy: "siec" };
  }
  if (poeDevs.length && !placed((it) => it.caps.includes("switch") && it.ports?.poe)) {
    const have = inv((it) => it.caps.includes("switch") && it.ports?.poe);
    return withWarn(have ? { n: 2, text: `Zamontuj switch ${BY_ID[have].name}: zasili kablem punkty Wi-Fi i kamery.`, place: have } : { n: 2, text: "Kup switch PoE: punkty Wi-Fi i kamery biorą prąd prosto z kabla sieciowego.", buy: "siec" });
  }
  if (rack && runs.length && !placed((it) => it.caps.includes("patch"))) {
    const have = inv((it) => it.caps.includes("patch"));
    return withWarn(have ? { n: 3, text: "Zamontuj patch panel: tu kończą się kable ze ścian.", place: have } : { n: 3, text: "Kup patch panel: tam dochodzą kable ze ścian, każdy z podpisem pokoju.", buy: "siec" });
  }
  const plan = netPlan(S);
  const wan = wanFix(S, gw, plan.ont);
  if (wan) return withWarn(wan);
  if (plan.links.length) {
    const l = plan.links[0];
    return withWarn({ n: 4, text: `${l.why}. Przeciągnij kabel między świecącymi portami albo stuknij Podłącz.`, link: l, all: plan.links });
  }
  const shelfWait = inv((it) => it.where === "shelf" || it.where === "rack");
  if (shelfWait) return withWarn({ n: 5, text: `W skrzynce czeka ${BY_ID[shelfWait].name}. Zamontuj ${BY_ID[shelfWait].where === "shelf" ? "na półce" : "w szafie"}.`, place: shelfWait });
  if (warn) return { n: 5, text: warn.text, goto: warn.goto };
  const fix = doctor(S, data, plan);
  if (fix) return fix;
  return { n: 6, text: "Sieć gotowa. Wszystko, co trzeba, jest wpięte i świeci.", done: true };
}

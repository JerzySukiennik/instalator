// Instalator: shared pieces of the phone task screens — frame, toolbox tray, device sheet, status words.

import { BY_ID, fmtZl, pairStatus } from "../../shared/catalog.js";
import { icon } from "../../shared/icons.js";
import { $, el, esc, haptic, sheet, toast } from "../ui.js";
import { catIcon } from "../plan.js";
import { openShop } from "./shop.js";
import { netPlan, netStep } from "../../shared/netguide.js";

export function frame(root, ctx, title, sub, h, opts = {}) {
  const solo = ctx.S.players.filter((p) => p.online).length <= 1;
  root.innerHTML = `${h.topBar(title, sub, { back: true })}<div class="body ${opts.flush ? "flush" : ""}"></div>${opts.noFoot ? "" : `<div class="foot"><button class="btn w sm shopb">${icon("cart", 20, 2)} Sklep</button>${opts.extra || ""}<button class="btn y endb">${solo ? "Gotowe" : "Koniec tury"}</button></div>`}`;
  $(".back", root).onclick = () => { haptic(); ctx.stream({ t: "ghost" }); ctx.closeTask(); };
  if ($(".shopb", root)) $(".shopb", root).onclick = () => openShop(ctx, opts.cats || null);
  if ($(".endb", root)) $(".endb", root).onclick = () => { ctx.stream({ t: "ghost" }); h.endTurn(); };
  return $(".body", root);
}

export function invList(ctx, test) {
  return Object.entries(ctx.S.inv || {}).filter(([id, n]) => n > 0 && BY_ID[id] && test(BY_ID[id], id)).map(([id, n]) => ({ id, n, it: BY_ID[id] }));
}

export function tray(host, ctx, items, sel, onPick, opts = {}) {
  host.innerHTML = `<div class="hint"><span>${esc(opts.hint || "Skrzynka z narzędziami")}</span><span>${items.reduce((s, x) => s + x.n, 0)} szt.</span></div><div class="scroller">${items.map((x) => `<button class="item ${sel === x.id ? "sel" : ""}" data-id="${x.id}"><span class="n">×${x.n}</span>${icon(catIcon(x.id), 26, 1.8)}<b>${esc(x.it.name)}</b></button>`).join("")}<button class="item shop">${icon("cart", 24, 2)}<b>Dokup w sklepie</b></button></div>`;
  host.querySelectorAll(".item[data-id]").forEach((b) => (b.onclick = () => { haptic(); onPick(b.dataset.id === sel ? null : b.dataset.id); }));
  $(".item.shop", host).onclick = () => openShop(ctx, opts.cats || null);
}

export function statusWord(ctx, d) {
  const st = ctx.S.der?.dev[d.uid];
  if (!st) return { t: "…", c: "idle" };
  if (!st.pw) return { t: st.why === "cable" || st.why === "poe" ? "brak zasilania PoE" : "brak prądu", c: "warn" };
  if (!st.net) return { t: st.why === "wifi-weak" ? "słabe Wi-Fi" : st.why === "wifi-none" ? "brak Wi-Fi" : "brak sieci", c: "warn" };
  if (BY_ID[d.id]?.hubs && !d.paired) return { t: "do sparowania", c: "idle" };
  return { t: "działa", c: "ok" };
}

export function whyText(ctx, d) {
  const st = ctx.S.der?.dev[d.uid];
  const it = BY_ID[d.id];
  if (!st) return "";
  if (!st.pw) {
    if (it.power === "poe") return d.run?.pp ? "Kabel dochodzi do patch panelu. W szafie wepnij ten port patchcordem do portu PoE w switchu." : "Kabel czeka na patch panel w szafie. Kup i zamontuj patch panel.";
    return "Ten obwód jest wyłączony w rozdzielnicy albo nie ma tu prądu.";
  }
  if (!st.net) {
    if (it.needsWifi) return "Za słabe Wi-Fi w tym miejscu. Dołóż punkt dostępowy w zadaniu Wi-Fi.";
    return "Urządzenie nie widzi sieci. Sprawdź połączenia w szafie rack.";
  }
  const plat = ctx.S.tablet?.platform;
  if (plat && it.hubs) {
    const ps = pairStatus(d.id, plat, new Set(ctx.S.devs.filter((x) => ctx.S.der.dev[x.uid]?.pw && ctx.S.der.dev[x.uid]?.net).map((x) => x.id)));
    if (!ps.ok && ps.why === "hub") return `Potrzebny mostek: ${ps.need.map((a) => a.map((h) => BY_ID[h]?.name || h).join(" albo ")).join(" / ")}.`;
    if (!ps.ok && ps.why === "platform") return "To urządzenie nie działa z wybranym systemem.";
  }
  if (it.hubs && !d.paired) return "Działa. Sparuj je z tabletem w zadaniu Tablet.";
  return "Wszystko gra.";
}

export function deviceSheet(ctx, d, extra) {
  const it = BY_ID[d.id];
  const sw = statusWord(ctx, d);
  sheet(it.name, (sc, s, close) => {
    sc.innerHTML = `<div class="row" style="margin-bottom:10px">${icon(catIcon(d.id), 30)}<div class="grow"><b>${esc(it.brand)}</b><span>${esc(it.desc || "")}</span></div><span class="stat ${sw.c}">${esc(sw.t)}</span></div>
      <p style="margin:0 0 14px;color:var(--ink2);line-height:1.4">${esc(whyText(ctx, d))}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${extra ? `<button class="btn y sm ex">${esc(extra.label)}</button>` : ""}<button class="btn w sm rm">${icon("undo", 18, 2)} Zdejmij</button></div>`;
    $(".rm", sc).onclick = () => { haptic(); ctx.send({ a: "uninstall", uid: d.uid }); close(); };
    if (extra) $(".ex", sc).onclick = () => { close(); extra.run(); };
  });
}

export function afterPoe(ctx, uid) {
  const d = ctx.S.devs.find((x) => x.uid === uid);
  if (!d || !d.run) return;
  const st = ctx.S.der?.dev[uid];
  if (st && st.pw && st.net) return;
  const plan = netPlan(ctx.S);
  const link = plan.links.find((l) => d.run.pp && l.from[0] === d.run.pp && l.from[1] === d.run.port);
  const chain = link ? plan.links.filter((l) => l === link || l.why.startsWith("Internet") || l.why.startsWith("Bramka")) : [];
  const step = netStep(ctx.S, ctx.B);
  const where = ctx.B.rack ? "szafy rack" : "skrzynki multimedialnej";
  sheet("Kabel poszedł w ścianie", (sc, s, close) => {
    sc.innerHTML = `<p style="margin:0 0 14px;color:var(--ink2);line-height:1.45">Przewód z <b>${esc(BY_ID[d.id].name)}</b> doszedł do ${where}${d.run.pp ? " i jest podpisany na patch panelu" : ""}. ${link ? "Teraz wystarczy wpiąć go patchcordem do portu PoE w switchu, wtedy dostanie prąd i internet." : `Żeby zadziałał: ${esc(step.text)}`}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${link ? `<button class="btn y now">${chain.length > 1 ? "Wepnij (z bramką i switchem)" : "Wepnij od razu"}</button>` : ""}<button class="btn w rk">Pokaż w szafie</button></div>`;
    if ($(".now", sc)) $(".now", sc).onclick = () => { close(); chain.forEach((l, i) => setTimeout(() => { haptic(true); ctx.send({ a: "patch", from: l.from, to: l.to, color: l.color }); }, i * 420)); setTimeout(() => toast("Wpięte! Dioda na switchu się świeci."), chain.length * 420); };
    $(".rk", sc).onclick = () => { close(); ctx.stream({ t: "ghost" }); ctx.openTask("rack"); };
  });
}

export function priceLine(id, n = 1) { return fmtZl(BY_ID[id].price * n); }

export { el };

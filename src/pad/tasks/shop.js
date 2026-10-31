// Instalator: the shop sheet — real products by category, platform badges, hub hints, quantity and buy.

import { CATALOG, CATEGORIES, BY_ID, platformBadges, fmtZl } from "../../shared/catalog.js";
import { icon } from "../../shared/icons.js";
import { $, esc, haptic, sheet } from "../ui.js";
import { catIcon } from "../plan.js";

const HIDDEN = new Set(["rack-9u", "rack-12u"]);
let lastCat = null;

function thumbHtml(id) {
  return `<img src="assets/thumbs/${id}.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{innerHTML:this.dataset.ic}))" data-ic='${icon(catIcon(id), 30, 1.7).replace(/'/g, "&#39;")}'>`;
}

export function openShop(ctx, cats) {
  const S = ctx.S;
  const first = cats && cats.length ? cats[0] : lastCat || "swiatlo";
  let cur = first;
  const qty = {};
  const plat = S.tablet?.platform || (S.job?.platform !== "any" ? S.job?.platform : null);
  const sh = sheet("Sklep", () => {});
  const ordered = cats ? [...cats, ...CATEGORIES.map((c) => c.id).filter((c) => !cats.includes(c))] : CATEGORIES.map((c) => c.id);
  sh.cats.classList.remove("hide");
  const drawCats = () => {
    sh.cats.innerHTML = ordered.map((id) => { const c = CATEGORIES.find((x) => x.id === id); return `<button data-c="${id}" class="${id === cur ? "on" : ""}">${icon(c.icon === "temp" ? "temp" : c.icon, 16, 2)}${esc(c.name)}</button>`; }).join("");
    sh.cats.querySelectorAll("button").forEach((b) => (b.onclick = () => { haptic(); cur = b.dataset.c; lastCat = cur; drawCats(); drawList(); sh.scroll.scrollTop = 0; }));
  };
  const drawList = () => {
    const S = ctx.S;
    const items = CATALOG.filter((d) => d.cat === cur && !HIDDEN.has(d.id));
    const left = S.budget.total - S.budget.spent;
    sh.scroll.innerHTML = `<div class="h" style="margin-top:0"><span>${plat ? `Klient: ${esc({ ha: "Home Assistant", apple: "Dom Apple", google: "Google Home" }[plat])}` : "System do wyboru przy tablecie"}</span><span>zostało ${fmtZl(left)}</span></div>` + items.map((d) => {
      const b = platformBadges(d.id);
      const n = qty[d.id] || 1;
      const owned = (S.inv[d.id] || 0);
      const need = d.hubs ? d.hubs.filter((h) => h.any.length && (!plat || h.p.includes(plat))).map((h) => h.any.map((x) => BY_ID[x]?.name.replace(/^(Philips Hue|Home Assistant|UniFi) /, "") || x).join(" lub ")) : [];
      return `<div class="prod">
        <div class="pic">${thumbHtml(d.id)}</div>
        <div><div class="brand">${esc(d.brand)}</div><b>${esc(d.name)}</b><p>${esc(d.desc || "")}</p>
          <div class="badges">${d.hubs ? ["ha", "apple", "google"].map((p) => `<span class="badge ${b[p] === "native" ? "ok" : b[p] === "bridge" ? "br" : "no"}">${{ ha: "HA", apple: "Apple", google: "Google" }[p]}${b[p] === "bridge" ? " przez HA" : ""}</span>`).join("") : ""}${d.power === "poe" ? `<span class="badge need">PoE</span>` : ""}${d.needsWifi ? `<span class="badge need">Wi-Fi</span>` : ""}${need.length ? `<span class="badge need">mostek: ${esc(need[0])}</span>` : ""}${owned ? `<span class="badge">masz ×${owned}</span>` : ""}</div>
        </div>
        <div class="bot"><span class="price">${fmtZl(d.price * n)}</span><div class="stepper"><button data-m="${d.id}">${icon("minus", 18, 2.4)}</button><b>${n}</b><button data-p="${d.id}">${icon("plus", 18, 2.4)}</button></div><button class="btn y sm" data-buy="${d.id}">Kup</button></div>
      </div>`;
    }).join("");
    sh.scroll.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { qty[b.dataset.m] = Math.max(1, (qty[b.dataset.m] || 1) - 1); haptic(); drawList(); }));
    sh.scroll.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => { qty[b.dataset.p] = Math.min(12, (qty[b.dataset.p] || 1) + 1); haptic(); drawList(); }));
    sh.scroll.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => {
      const id = b.dataset.buy;
      haptic(true);
      ctx.send({ a: "buy", id, n: qty[id] || 1 });
      b.textContent = "✓";
      setTimeout(() => { S.inv[id] = (S.inv[id] || 0) + (qty[id] || 1); qty[id] = 1; drawList(); }, 350);
    }));
  };
  drawCats();
  drawList();
  return sh;
}

// Instalator: in-game shop window — categories, search, product cards with real thumbnails, platform badges and fit warnings.

import { CATALOG, CATEGORIES, BY_ID, platformBadges, fmtZl } from "../shared/catalog.js";

const HIDDEN = new Set(["rack-9u", "rack-12u"]);
const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function whereText(d, media) {
  if (d.where === "rack") return media ? "Tylko do szafy rack 19 cali, tu jest skrzynka multimedialna" : "Montaż: w szafie rack (podejdź, E)";
  if (d.where === "shelf") return media ? "Montaż: w skrzynce multimedialnej (E)" : "Montaż: na półce w szafie rack (E)";
  if (d.where === "din") return "Montaż: na szynie w rozdzielnicy (E)";
  if (d.strip) return "Montaż: taśma LED, celownikiem na miejsce taśmy";
  if (d.caps.includes("tablet") || d.caps.includes("wallmount") || d.caps.includes("stand")) return "Montaż: tablet na ścianie albo stojaku";
  return `Montaż: celownikiem (${(d.mounts || []).join(", ") || "w pokoju"})`;
}

export function openShop(root, { S, data, send, onClose }) {
  let cat = CATEGORIES[0].id, query = "";
  const qty = {};
  const media = !data?.rack;
  const plat = S.tablet?.platform || (S.job?.platform !== "any" ? S.job?.platform : null);
  const w = document.createElement("div");
  w.className = "win";
  w.innerHTML = `<div class="box"><div class="head"><h2>Hurtownia</h2><input type="search" placeholder="Szukaj: Hue, kamera, switch, zamek…"><span class="sp"></span><span class="left"></span><button class="x">Zamknij (B)</button></div><div class="body"><div class="cats"></div><div class="grid"></div></div></div>`;
  root.appendChild(w);
  const inp = w.querySelector("input"), cats = w.querySelector(".cats"), grid = w.querySelector(".grid"), left = w.querySelector(".left");
  const close = () => { w.remove(); onClose && onClose(); };
  w.querySelector(".x").onclick = close;
  w.addEventListener("mousedown", (e) => { if (e.target === w) close(); });
  inp.addEventListener("input", () => { query = inp.value; draw(); });
  inp.addEventListener("keydown", (e) => e.stopPropagation());
  setTimeout(() => inp.focus(), 50);
  const drawCats = () => {
    cats.innerHTML = CATEGORIES.map((c) => `<button data-c="${c.id}" class="${c.id === cat && !query ? "on" : ""}">${esc(c.name)}</button>`).join("");
    cats.querySelectorAll("button").forEach((b) => (b.onclick = () => { cat = b.dataset.c; query = ""; inp.value = ""; draw(); }));
  };
  const draw = () => {
    drawCats();
    const words = norm(query).split(/\s+/).filter(Boolean);
    const hay = (d) => norm([d.brand, d.name, d.desc, ...(d.caps || [])].join(" "));
    const items = (words.length ? CATALOG.filter((d) => !HIDDEN.has(d.id) && words.every((x) => hay(d).includes(x))) : CATALOG.filter((d) => d.cat === cur() && !HIDDEN.has(d.id)));
    left.textContent = `zostało ${fmtZl(S.budget.total - S.budget.spent)}`;
    grid.innerHTML = items.map((d) => {
      const nofit = media && d.where === "rack";
      const b = platformBadges(d.id);
      const n = qty[d.id] || 1;
      return `<div class="prod ${nofit ? "dim" : ""}"><img src="assets/thumbs/${d.id}.png" alt="" onerror="this.style.visibility='hidden'">
        <span class="br">${esc(d.brand)}</span><b>${esc(d.name)}</b><p>${esc(d.desc || "")}</p><p><i>${esc(whereText(d, media))}</i></p>
        <div class="badges">${d.hubs ? ["ha", "apple", "google"].map((p) => `<span class="badge ${b[p] === "native" ? "ok" : b[p] === "bridge" ? "" : "no"}">${{ ha: "HA", apple: "Apple", google: "Google" }[p]}${b[p] === "bridge" ? " przez HA" : ""}</span>`).join("") : ""}${d.power === "poe" ? `<span class="badge">PoE</span>` : ""}${d.needsWifi ? `<span class="badge">Wi-Fi</span>` : ""}${S.inv[d.id] ? `<span class="badge ok">masz ×${S.inv[d.id]}</span>` : ""}${plat ? "" : ""}</div>
        <div class="row"><span class="price">${fmtZl(d.price * n)}</span><button class="btnp w" data-m="${d.id}">−</button><b>${n}</b><button class="btnp w" data-p="${d.id}">+</button>${nofit ? `<button class="btnp w" disabled>Nie pasuje</button>` : `<button class="btnp" data-buy="${d.id}">Kup</button>`}</div></div>`;
    }).join("") || `<p style="padding:1rem">Nic nie znalazłem. Spróbuj: hue, kamera, switch, czujnik, zamek, tablet.</p>`;
    grid.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { qty[b.dataset.m] = Math.max(1, (qty[b.dataset.m] || 1) - 1); draw(); }));
    grid.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => { qty[b.dataset.p] = Math.min(12, (qty[b.dataset.p] || 1) + 1); draw(); }));
    grid.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => { const id = b.dataset.buy; send({ a: "buy", id, n: qty[id] || 1 }); b.textContent = "✓"; qty[id] = 1; setTimeout(draw, 300); }));
  };
  const cur = () => cat;
  draw();
  return { el: w, close, refresh(newS) { S = newS; draw(); } };
}

export { BY_ID };

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

const MOUNT_PL = { ceiling: "sufit", wall: "ściana", outdoorWall: "elewacja", doorbell: "przy drzwiach wejściowych", socketE27: "oprawka E27", socketGU10: "oczko GU10", radiator: "kaloryfer", door: "drzwi", window: "okno", doorLock: "zamek drzwi", floor: "podłoga", surface: "blat lub półka", tv: "pod telewizorem", garage: "garaż", gate: "brama", socket: "gniazdko" };

function whereText(d, media) {
  if (d.where === "rack") return media ? "Tylko do szafy rack 19 cali. Tu jest skrzynka multimedialna, nie zmieści się." : "Montaż: zadanie Szafa rack";
  if (d.where === "shelf") return media ? "Montaż: skrzynka multimedialna" : "Montaż: półka w szafie rack";
  if (d.where === "din") return "Montaż: zadanie Rozdzielnica";
  if (d.strip) return `Montaż: taśma ${d.strip.map((k) => ({ tv: "za TV", kitchen: "pod szafki", bed: "za łóżko", cove: "pod sufitem", shelf: "na półce", desk: "przy biurku" }[k] || k)).join(", ")}`;
  if (d.caps.includes("tablet") || d.caps.includes("wallmount") || d.caps.includes("stand")) return "Montaż: zadanie Tablet";
  if (d.caps.includes("ap")) return `Montaż: zadanie Wi-Fi (${(d.mounts || []).map((m) => MOUNT_PL[m] || m).join(", ")})`;
  return `Montaż: ${(d.mounts || []).map((m) => MOUNT_PL[m] || m).join(", ") || "w pokoju"}`;
}

const CAP_WORDS = {
  ap: "wifi wi-fi ap punkt dostepowy internet zasieg", camera: "kamera monitoring cctv", doorbell: "dzwonek domofon wideodomofon", light: "swiatlo zarowka lampa oswietlenie led",
  color: "kolor rgb", strip: "tasma led pasek podswietlenie", tvlight: "telewizor tv", trv: "glowica kaloryfer grzejnik ogrzewanie termostat", thermostat: "termostat ogrzewanie piec",
  temp: "temperatura wilgotnosc czujnik", contact: "czujnik otwarcia drzwi okno kontaktron", motion: "czujnik ruchu obecnosci", presence: "obecnosc radar", leak: "zalanie woda czujnik",
  smoke: "dym pozar czujnik", lock: "zamek drzwi klucz", hub: "mostek centrala hub bramka", speaker: "glosnik muzyka audio", soundbar: "soundbar kino", vacuum: "odkurzacz robot sprzatanie",
  gate: "brama garaz przekaznik", ev: "ladowarka auto samochod tesla", weather: "pogoda stacja", plug: "gniazdko wtyczka", gateway: "bramka router internet", switch: "switch przelacznik poe porty",
  poe: "poe", nvr: "nagrywanie rejestrator dysk", patch: "patch panel keystone kable", ups: "ups zasilanie awaryjne bateria", relay: "przekaznik modul din shelly", energy: "prad licznik energia zuzycie",
  blinds: "rolety", tablet: "tablet ipad panel", wallmount: "uchwyt sciana", stand: "stojak podstawka", shelf: "polka", rack: "szafa rack", surge: "przepiecia burza ochrona"
};
const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");
const HAY = new Map(CATALOG.map((d) => [d.id, norm([d.brand, d.name, d.desc, CATEGORIES.find((c) => c.id === d.cat)?.name, ...(d.caps || []).map((c) => CAP_WORDS[c] || "")].join(" "))]));

export function openShop(ctx, cats) {
  const S = ctx.S;
  const first = cats && cats.length ? cats[0] : lastCat || "swiatlo";
  let cur = first;
  const qty = {};
  const plat = S.tablet?.platform || (S.job?.platform !== "any" ? S.job?.platform : null);
  const sh = sheet("Sklep", () => {});
  const ordered = cats ? [...cats, ...CATEGORIES.map((c) => c.id).filter((c) => !cats.includes(c))] : CATEGORIES.map((c) => c.id);
  sh.cats.classList.remove("hide");
  let query = "";
  const search = document.createElement("div");
  search.className = "searchbar";
  search.innerHTML = `${icon("search", 18, 2.2)}<input type="search" placeholder="Szukaj: Hue, kamera, switch, zamek…" autocomplete="off" enterkeyhint="search"><button class="clr hide">${icon("close", 16, 2.4)}</button>`;
  sh.cats.before(search);
  const inp = $("input", search), clr = $(".clr", search);
  inp.addEventListener("input", () => { query = inp.value; clr.classList.toggle("hide", !query); drawCats(); drawList(); sh.scroll.scrollTop = 0; });
  clr.onclick = () => { inp.value = ""; query = ""; clr.classList.add("hide"); drawCats(); drawList(); inp.focus(); };
  if (document.body.classList.contains("desk")) setTimeout(() => inp.focus(), 120);
  const drawCats = () => {
    sh.cats.innerHTML = ordered.map((id) => { const c = CATEGORIES.find((x) => x.id === id); return `<button data-c="${id}" class="${id === cur && !query ? "on" : ""}">${icon(c.icon === "temp" ? "temp" : c.icon, 16, 2)}${esc(c.name)}</button>`; }).join("");
    sh.cats.querySelectorAll("button").forEach((b) => (b.onclick = () => { haptic(); cur = b.dataset.c; lastCat = cur; if (query) { query = ""; inp.value = ""; clr.classList.add("hide"); } drawCats(); drawList(); sh.scroll.scrollTop = 0; }));
  };
  const drawList = () => {
    const S = ctx.S;
    const words = norm(query).split(/\s+/).filter(Boolean);
    const media = !ctx.B?.rack;
    const noFit = (d) => media && d.where === "rack";
    const items = (words.length ? CATALOG.filter((d) => !HIDDEN.has(d.id) && words.every((w) => HAY.get(d.id).includes(w))) : CATALOG.filter((d) => d.cat === cur && !HIDDEN.has(d.id))).sort((a, b) => noFit(a) - noFit(b));
    const left = S.budget.total - S.budget.spent;
    sh.scroll.innerHTML = (words.length && !items.length ? `<div class="row" style="margin-bottom:10px"><div class="grow"><b>Nic nie znalazłem dla „${esc(query)}”</b><span>Spróbuj: hue, kamera, switch, czujnik, zamek, tablet.</span></div></div>` : "") + `<div class="h" style="margin-top:0"><span>${words.length ? `Wyniki: ${items.length}` : plat ? `Klient: ${esc({ ha: "Home Assistant", apple: "Dom Apple", google: "Google Home" }[plat])}` : "System do wyboru przy tablecie"}</span><span>zostało ${fmtZl(left)}</span></div>` + items.map((d) => {
      const b = platformBadges(d.id);
      const n = qty[d.id] || 1;
      const owned = (S.inv[d.id] || 0);
      const need = d.hubs ? d.hubs.filter((h) => h.any.length && (!plat || h.p.includes(plat))).map((h) => h.any.map((x) => BY_ID[x]?.name.replace(/^Home Assistant /, "HA ").replace(/^(Philips Hue|UniFi) /, "") || x).join(" lub ")) : [];
      return `<div class="prod ${noFit(d) ? "dim" : ""}">
        <div class="pic">${thumbHtml(d.id)}</div>
        <div><div class="brand">${esc(d.brand)}</div><b>${esc(d.name)}</b><p>${esc(d.desc || "")}</p><p class="where ${noFit(d) ? "nofit" : ""}">${icon("drill", 13, 2)} ${esc(whereText(d, media))}</p>
          <div class="badges">${d.hubs ? ["ha", "apple", "google"].map((p) => `<span class="badge ${b[p] === "native" ? "ok" : b[p] === "bridge" ? "br" : "no"}">${{ ha: "HA", apple: "Apple", google: "Google" }[p]}${b[p] === "bridge" ? " przez HA" : ""}</span>`).join("") : ""}${d.power === "poe" ? `<span class="badge need">PoE</span>` : ""}${d.needsWifi ? `<span class="badge need">Wi-Fi</span>` : ""}${need.length ? `<span class="badge need">mostek: ${esc(need[0])}</span>` : ""}${owned ? `<span class="badge">masz ×${owned}</span>` : ""}</div>
        </div>
        <div class="bot"><span class="price">${fmtZl(d.price * n)}</span><div class="stepper"><button data-m="${d.id}">${icon("minus", 18, 2.4)}</button><b>${n}</b><button data-p="${d.id}">${icon("plus", 18, 2.4)}</button></div>${noFit(d) ? `<button class="btn w sm" disabled>Nie pasuje</button>` : `<button class="btn y sm" data-buy="${d.id}">Kup</button>`}</div>
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

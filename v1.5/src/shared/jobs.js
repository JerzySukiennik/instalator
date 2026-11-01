// Instalator: buildings meta, client personas, requirement templates and the 4-card job roll.

import { PLATFORMS } from "./catalog.js";

export const BUILDINGS_META = {
  kawalerka: { name: "Kawalerka na Mokotowie", short: "Kawalerka", place: "Warszawa, Mokotów", area: 35, budget: [5500, 9500], aps: 1, rack: "mediaBox" },
  dom: { name: "Dom pod Warszawą", short: "Dom", place: "Józefów", area: 130, budget: [16000, 30000], aps: 2, rack: "rack" },
  gzowo: { name: "Domek w Gzowie nad Narwią", short: "Gzowo", place: "Gzowo, gm. Pokrzywnica", area: 75, budget: [11000, 21000], aps: 2, rack: "rack" },
  willa: { name: "Willa w Konstancinie", short: "Willa", place: "Konstancin-Jeziorna", area: 280, budget: [42000, 80000], aps: 4, rack: "rack" }
};

export const KIND_NAME = {
  living: "salon", kitchen: "kuchnia", bath: "łazienka", wc: "WC", bed: "sypialnia", hall: "hol", tech: "pomieszczenie techniczne",
  garage: "garaż", balcony: "balkon", terrace: "taras", office: "gabinet", outdoor: "ogród"
};

export const ZONE_NAME = {
  entrance: "wejście", driveway: "podjazd", garden: "ogród", terrace: "taras", jetty: "pomost", gate: "brama", garage: "garaż", street: "ulica"
};

export const CARD_NAME = { camera: "kamera", light: "światła", climate: "ogrzewanie", energy: "prąd", lock: "zamek", scene: "sceny", network: "sieć", media: "muzyka" };

export const CLIENTS = [
  { id: "ola", name: "Pani Ola", age: 29, who: "programistka, kot Miś", buildings: ["kawalerka"], platform: "apple", look: { hair: "#3b2a20", top: "#7aa6c9", skin: "#f1c9a5", long: true }, hello: "Cześć! Chcę wracać do domu, który sam wie, że wróciłam. I widzieć, co robi Miś.", picks: ["color:living", "cam:living", "leak", "wifi:0.9", "lock", "dash:camera,light"] },
  { id: "kasia-bartek", name: "Kasia i Bartek", age: 31, who: "młoda para, dużo filmów", buildings: ["kawalerka", "dom"], platform: "google", look: { hair: "#c9a35a", top: "#e58f65", skin: "#eec4a0", long: true }, hello: "Wieczorami oglądamy filmy. Ma być klimat jak w kinie i dobre Wi-Fi wszędzie.", picks: ["tv", "color:living", "kitchen", "wifi:0.95", "audio:living", "dash:light,media"] },
  { id: "nowakowie", name: "Państwo Nowakowie", age: 42, who: "rodzina z dwójką dzieci", buildings: ["dom"], platform: "google", look: { hair: "#5a3d2b", top: "#5f8f6e", skin: "#e9bd98" }, hello: "Dzieci, pies, wieczny bieg. Chcemy widzieć, kto stoi przy furtce, i nie przepłacać za prąd.", picks: ["doorbell", "cam:driveway", "cam:garden", "heat:all", "smoke:bed", "energy", "tablet:wall", "dash:camera,climate,energy"] },
  { id: "zbigniew", name: "Pan Zbigniew", age: 67, who: "emeryt, majsterkowicz", buildings: ["dom", "gzowo"], platform: "ha", look: { hair: "#c9c9c9", top: "#8b6f4e", skin: "#efc3a1", beard: true }, hello: "Całe życie robiłem elektrykę. Chcę porządnie: opisana rozdzielnica, Home Assistant i ani jednego luźnego kabla.", picks: ["labels", "energy", "heat:all", "leak", "smoke:bed", "ups", "wifi:0.9", "dash:energy,climate,network"] },
  { id: "gzowo", name: "Ośrodek Gzowo", age: 0, who: "rodzinna działka nad Narwią", buildings: ["gzowo"], platform: "any", look: { hair: "#6b4a2f", top: "#3f6e4f", skin: "#ecc19c", long: true }, hello: "Domek stoi pusty w tygodniu. Chcemy widzieć bramę i pomost, mieć Wi-Fi nad wodą i grzać przed przyjazdem.", picks: ["cam:gate", "cam:jetty", "wifizone:jetty", "heat:all", "lock", "weather", "leak", "tablet:any", "dash:camera,climate"] },
  { id: "halina", name: "Pani Halina", age: 74, who: "babcia, mieszka sama", buildings: ["kawalerka", "dom"], platform: "google", look: { hair: "#e3e0dc", top: "#b36a7a", skin: "#f0c8aa" }, hello: "Wnuk mówi, że teraz wszystko się da. To proszę, żeby było prosto i bezpiecznie.", picks: ["smoke:all", "leak", "doorbell", "light:hall", "motion:hall", "tablet:wall", "dash:camera,light"] },
  { id: "marek", name: "Pan Marek", age: 52, who: "prezes firmy logistycznej", buildings: ["willa"], platform: "apple", look: { hair: "#2c2c2c", top: "#2f3e55", skin: "#e5b893" }, hello: "Dom ma działać jak biuro: kamery na wszystkim, nagrania na miejscu, auto ładuje się samo, a muzyka gra w każdym pokoju.", picks: ["cam:gate", "cam:driveway", "cam:garden", "cam:garage", "doorbell", "nvr", "ups", "ev", "gate", "blinds", "audio:living", "soundbar", "wifi:0.95", "tablet:wall", "dash:camera,light,climate,media"] },
  { id: "wisniewscy", name: "Dr Wiśniewska", age: 46, who: "lekarka, dużo dyżurów", buildings: ["willa", "dom"], platform: "ha", look: { hair: "#7a4a33", top: "#d9d4c7", skin: "#efc6a4", long: true }, hello: "Wracam po nocach. Brama ma się otwierać sama, w domu ma być ciepło, a robot ma posprzątać, zanim przyjadę.", picks: ["gate", "heat:all", "vacuum", "energy", "cam:driveway", "doorbell", "smoke:bed", "wifi:0.95", "tablet:any", "dash:camera,climate,energy"] }
];

export const REQ_COST = {
  power: 0, labels: 0, light: 160, color: 520, tv: 920, kitchen: 360, wifi: 1400, wifizone: 1000, cam: 700, doorbell: 1600, lock: 1550,
  heat: 430, leak: 200, smoke: 260, motion: 260, contact: 260, energy: 520, blinds: 700, audio: 1150, soundbar: 4900, vacuum: 6100,
  gate: 120, ev: 2700, weather: 800, nvr: 1600, ups: 1500, tablet: 3950, dash: 0
};

export function parsePick(pick) {
  const [type, arg] = pick.split(":");
  if (type === "dash") return { type, cards: arg.split(",") };
  if (type === "wifi") return { type, min: Number(arg) };
  if (type === "tablet") return { type, wall: arg === "wall" };
  if (type === "cam" || type === "wifizone") return { type, zone: arg };
  if (["light", "color", "audio", "motion"].includes(type)) return { type, kind: arg };
  if (type === "heat" || type === "smoke") return { type, kind: arg };
  return { type };
}

export function reqText(r) {
  const k = (x) => KIND_NAME[x] || x;
  switch (r.type) {
    case "power": return "Cały dom pod prądem";
    case "labels": return "Opisane obwody w rozdzielnicy";
    case "light": return `Inteligentne światło: ${k(r.kind)}`;
    case "color": return `Kolorowe światło: ${k(r.kind)}`;
    case "tv": return "Podświetlenie za telewizorem";
    case "kitchen": return "Taśma LED pod szafkami";
    case "wifi": return `Wi-Fi w całym domu (min. ${Math.round(r.min * 100)}%)`;
    case "wifizone": return `Wi-Fi: ${ZONE_NAME[r.zone] || r.zone}`;
    case "cam": return r.zone in ZONE_NAME ? `Kamera: ${ZONE_NAME[r.zone]}` : `Kamera: ${k(r.zone)}`;
    case "doorbell": return "Wideodomofon przy wejściu";
    case "lock": return "Zamek otwierany telefonem";
    case "heat": return r.kind === "all" ? "Ogrzewanie w każdym pokoju" : `Ogrzewanie: ${k(r.kind)}`;
    case "leak": return "Czujnik zalania w łazience";
    case "smoke": return r.kind === "all" ? "Czujniki dymu w pokojach" : "Czujniki dymu w sypialniach";
    case "motion": return `Czujnik ruchu: ${k(r.kind)}`;
    case "contact": return "Czujnik na drzwiach wejściowych";
    case "energy": return "Pomiar zużycia prądu";
    case "blinds": return "Rolety sterowane z tabletu";
    case "audio": return `Muzyka: ${k(r.kind)}`;
    case "soundbar": return "Kino domowe z soundbarem";
    case "vacuum": return "Robot sprzątający";
    case "gate": return "Brama otwierana z telefonu";
    case "ev": return "Ładowarka do auta w garażu";
    case "weather": return "Stacja pogody";
    case "nvr": return "Nagrania z kamer na miejscu";
    case "ups": return "Sieć działa bez prądu (UPS)";
    case "tablet": return r.wall ? "Tablet na ścianie" : "Tablet do sterowania domem";
    case "dash": return `Na tablecie: ${r.cards.map((c) => CARD_NAME[c] || c).join(", ")}`;
    default: return r.type;
  }
}

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function shuffle(a, r) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function makeJob(buildingId, r, forcedClient = null) {
  const meta = BUILDINGS_META[buildingId];
  const pool = CLIENTS.filter((c) => c.buildings.includes(buildingId));
  const client = forcedClient || pool[Math.floor(r() * pool.length)];
  const keep = client.picks.filter((p) => !p.startsWith("dash") && !p.startsWith("tablet"));
  const n = Math.min(keep.length, buildingId === "willa" ? 9 : buildingId === "kawalerka" ? 5 : 7);
  const chosen = shuffle(keep, r).slice(0, n);
  const tablet = client.picks.find((p) => p.startsWith("tablet")) || "tablet:any";
  const dash = client.picks.find((p) => p.startsWith("dash"));
  const reqs = [{ type: "power" }, ...chosen.map(parsePick), parsePick(tablet)];
  if (dash) reqs.push(parsePick(dash));
  let platform = client.platform;
  if (platform === "any") platform = ["ha", "apple", "google"][Math.floor(r() * 3)];
  if (r() < 0.25) platform = "any";
  const need = reqs.reduce((s, q) => s + (REQ_COST[q.type] || 0) * (q.kind === "all" ? 3 : 1), 0);
  const base = meta.aps * 900 + (buildingId === "willa" ? 6500 : buildingId === "kawalerka" ? 1300 : 3800);
  const lo = Math.max(meta.budget[0], (need + base) * 1.22);
  const budget = Math.round((lo + r() * Math.max(0, meta.budget[1] - lo) * 0.5) / 500) * 500;
  reqs.forEach((q, i) => { q.id = `r${i}`; q.text = reqText(q); });
  return {
    id: `${buildingId}-${client.id}-${Math.floor(r() * 1e6)}`,
    building: buildingId,
    buildingName: meta.name,
    place: meta.place,
    client: { id: client.id, name: client.name, age: client.age, who: client.who, look: client.look, hello: client.hello },
    platform,
    platformName: platform === "any" ? "dowolny system" : PLATFORMS[platform].name,
    budget,
    reqs
  };
}

export function rollJobs(seed) {
  const r = rng(seed);
  const order = ["kawalerka", "dom", "gzowo", "willa"];
  return order.map((b) => makeJob(b, r));
}

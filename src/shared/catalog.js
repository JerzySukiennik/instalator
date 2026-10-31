// Instalator: catalogue of real products (prices in zł, mounts, power, hubs, platform compatibility, capabilities).

const ALL = ["ha", "apple", "google"];
const HUE = [{ any: ["hue-bridge-pro"], p: ALL }, { any: ["ha-zbt2"], p: ["ha"] }];
const THREAD = (own) => [
  ...(own ? [{ any: own, p: ALL }] : []),
  { any: ["homepod-mini", "apple-tv-4k"], p: ["apple"] },
  { any: ["nest-hub", "google-tv-streamer"], p: ["google"] },
  { any: ["ha-zbt2"], p: ["ha"] }
];
const AQARA_ZB = [{ any: ["aqara-hub-m3"], p: ALL }, { any: ["ha-zbt2"], p: ["ha"] }];
const PROTECT = [{ any: ["ucg-max", "udm-pro-max", "unvr"], p: ["ha"] }, { any: ["ha-green"], p: ["apple", "google"], via: "Home Assistant" }];
const SHELLY = [{ any: [], p: ["ha"] }, { any: ["ha-green"], p: ["apple", "google"], via: "Home Assistant" }];
const WIFI = [{ any: [], p: ALL }];

export const CATEGORIES = [
  { id: "siec", name: "Sieć UniFi", icon: "net" },
  { id: "kamery", name: "Kamery", icon: "cam" },
  { id: "swiatlo", name: "Światło", icon: "bulb" },
  { id: "klimat", name: "Ogrzewanie", icon: "temp" },
  { id: "czujniki", name: "Czujniki i zamki", icon: "sensor" },
  { id: "rozdzielnica", name: "Rozdzielnica", icon: "din" },
  { id: "centrale", name: "Centrale i mostki", icon: "hub" },
  { id: "multimedia", name: "Multimedia", icon: "speaker" },
  { id: "dom", name: "Dom i ogród", icon: "home" },
  { id: "tablety", name: "Tablety", icon: "tablet" }
];

export const CATALOG = [
  { id: "ucg-ultra", brand: "Ubiquiti", name: "UniFi Cloud Gateway Ultra", cat: "siec", price: 529, where: "shelf", power: "mains", ports: { wan: 1, rj45: 4 }, caps: ["gateway"], desc: "Mała bramka z kontrolerem UniFi, idealna do mieszkania." },
  { id: "ucg-max", brand: "Ubiquiti", name: "UniFi Cloud Gateway Max", cat: "siec", price: 1449, where: "shelf", power: "mains", ports: { wan: 1, rj45: 4 }, caps: ["gateway", "nvr"], desc: "Bramka z miejscem na dysk NVMe, nagrywa kamery UniFi Protect." },
  { id: "udm-pro-max", brand: "Ubiquiti", name: "UniFi Dream Machine Pro Max", cat: "siec", price: 3149, where: "rack", u: 1, power: "mains", ports: { wan: 1, rj45: 8, sfp: 2 }, caps: ["gateway", "nvr"], desc: "Brama do szafy rack z ekranem dotykowym i dwoma dyskami na nagrania." },
  { id: "usw-flex-mini", brand: "Ubiquiti", name: "UniFi Switch Flex Mini", cat: "siec", price: 139, where: "shelf", power: "mains", ports: { rj45: 5 }, caps: ["switch"], desc: "Malutki switch na 5 portów, bez PoE." },
  { id: "usw-lite-8-poe", brand: "Ubiquiti", name: "UniFi Switch Lite 8 PoE", cat: "siec", price: 579, where: "shelf", power: "mains", ports: { rj45: 8, poe: 4 }, poeOut: 52, caps: ["switch", "poe"], desc: "8 portów, z czego 4 zasilają AP i kamery po kablu." },
  { id: "usw-pro-max-16-poe", brand: "Ubiquiti", name: "UniFi Switch Pro Max 16 PoE", cat: "siec", price: 2089, where: "rack", u: 1, power: "mains", ports: { rj45: 16, poe: 16, sfp: 2 }, poeOut: 180, etherlight: true, caps: ["switch", "poe"], desc: "16 portów PoE z Etherlighting: każdy kabel świeci kolorem sieci." },
  { id: "usw-pro-max-24-poe", brand: "Ubiquiti", name: "UniFi Switch Pro Max 24 PoE", cat: "siec", price: 4299, where: "rack", u: 1, power: "mains", ports: { rj45: 24, poe: 24, sfp: 2 }, poeOut: 400, etherlight: true, caps: ["switch", "poe"], desc: "Duży switch do szafy, 400 W PoE i ekran na froncie." },
  { id: "u7-lite", brand: "Ubiquiti", name: "UniFi U7 Lite", cat: "siec", price: 519, mounts: ["ceiling"], power: "poe", poe: 13, caps: ["ap"], wifi: { r: 9.5 }, desc: "Mały punkt dostępowy Wi-Fi 7 na sufit." },
  { id: "u7-pro", brand: "Ubiquiti", name: "UniFi U7 Pro", cat: "siec", price: 929, mounts: ["ceiling"], power: "poe", poe: 21, caps: ["ap"], wifi: { r: 12 }, desc: "Mocny punkt dostępowy Wi-Fi 7 z pasmem 6 GHz." },
  { id: "u7-pro-wall", brand: "Ubiquiti", name: "UniFi U7 Pro Wall", cat: "siec", price: 1079, mounts: ["wall"], power: "poe", poe: 21, caps: ["ap"], wifi: { r: 11.5 }, desc: "Wi-Fi 7 na ścianę, gdy nie da się wejść w sufit." },
  { id: "u7-outdoor", brand: "Ubiquiti", name: "UniFi U7 Outdoor", cat: "siec", price: 1079, mounts: ["outdoorWall"], power: "poe", poe: 16, caps: ["ap", "outdoor"], wifi: { r: 22, outdoor: true }, desc: "Wi-Fi na ogród, taras i pomost." },
  { id: "unvr", brand: "Ubiquiti", name: "UniFi Network Video Recorder", cat: "kamery", price: 1569, where: "rack", u: 1, power: "mains", ports: { rj45: 1 }, caps: ["nvr"], desc: "Rejestrator na 4 dyski, trzyma nagrania z wielu kamer." },
  { id: "g5-flex", brand: "Ubiquiti", name: "UniFi G5 Flex", cat: "kamery", price: 669, mounts: ["wall", "ceiling", "surface"], power: "poe", poe: 4, caps: ["camera"], cam: { fov: 100, range: 9 }, hubs: PROTECT, desc: "Mała kamera 2K do środka, na ścianę albo półkę." },
  { id: "g5-bullet", brand: "Ubiquiti", name: "UniFi G5 Bullet", cat: "kamery", price: 669, mounts: ["outdoorWall"], power: "poe", poe: 5, caps: ["camera", "outdoor"], cam: { fov: 100, range: 15 }, hubs: PROTECT, desc: "Kamera tubowa 2K na elewację, z podczerwienią." },
  { id: "g5-turret-ultra", brand: "Ubiquiti", name: "UniFi G5 Turret Ultra", cat: "kamery", price: 469, mounts: ["outdoorWall", "ceiling"], power: "poe", poe: 5, caps: ["camera", "outdoor"], cam: { fov: 100, range: 14 }, hubs: PROTECT, desc: "Kopułkowa kamera 2K, odporna na wandali." },
  { id: "g4-doorbell-pro", brand: "Ubiquiti", name: "UniFi G4 Doorbell Pro", cat: "kamery", price: 1579, mounts: ["doorbell"], power: "poe", poe: 6, caps: ["camera", "doorbell"], cam: { fov: 140, range: 6 }, hubs: PROTECT, desc: "Wideodomofon z drugą kamerą na paczki." },
  { id: "aqara-g5-pro", brand: "Aqara", name: "Aqara Camera Hub G5 Pro", cat: "kamery", price: 989, mounts: ["outdoorWall", "wall"], power: "poe", poe: 6, caps: ["camera", "outdoor"], cam: { fov: 110, range: 12 }, hubs: WIFI, desc: "Kamera z HomeKit Secure Video i Google Home, bez rejestratora." },
  { id: "patch-panel-24", brand: "Ubiquiti", name: "UniFi Keystone Patch Panel 24", cat: "siec", price: 359, where: "rack", u: 1, power: "none", ports: { rj45: 24 }, caps: ["patch"], desc: "Tu kończą się kable ze ścian, 24 gniazda keystone, każde podpisane." },
  { id: "brush-panel", brand: "Ubiquiti", name: "UniFi Brush Panel", cat: "siec", price: 185, where: "rack", u: 1, power: "none", caps: ["brush"], desc: "Szczotka na kable, porządek w szafie." },
  { id: "rack-shelf", brand: "Ubiquiti", name: "UniFi Rack Shelf 1U", cat: "siec", price: 229, where: "rack", u: 1, power: "none", caps: ["shelf"], desc: "Półka na bramkę, mostki i centrale." },
  { id: "pdu-pro", brand: "Lanberg", name: "Listwa PDU 19\" 1U, 8 gniazd", cat: "siec", price: 159, where: "rack", u: 1, power: "mains", caps: ["pdu"], desc: "Listwa zasilająca do szafy, porządek z wtyczkami." },
  { id: "ups-2u", brand: "Ubiquiti", name: "UniFi UPS 2U", cat: "siec", price: 1449, where: "rack", u: 2, power: "mains", caps: ["ups"], desc: "Zasilacz awaryjny 1500 VA: sieć i kamery działają przy braku prądu." },
  { id: "rack-9u", brand: "Lanberg", name: "Szafa rack 19\" 9U wisząca", cat: "siec", price: 479, where: "rackmount", power: "none", caps: ["rack"], u: 9, desc: "Szafa na ścianę dla domu." },
  { id: "rack-12u", brand: "Lanberg", name: "Szafa rack 19\" 12U wisząca", cat: "siec", price: 569, where: "rackmount", power: "none", caps: ["rack"], u: 12, desc: "Większa szafa do willi." },

  { id: "shelly-pro-4pm", brand: "Shelly", name: "Shelly Pro 4PM", cat: "rozdzielnica", price: 509, where: "din", mod: 2, power: "din", channels: 4, caps: ["relay", "energyPer"], hubs: SHELLY, desc: "4 kanały na szynę DIN: zwykłe obwody światła stają się smart." },
  { id: "shelly-pro-3em", brand: "Shelly", name: "Shelly Pro 3EM", cat: "rozdzielnica", price: 509, where: "din", mod: 2, power: "din", channels: 0, caps: ["energy"], hubs: SHELLY, desc: "Licznik energii na 3 fazy z przekładnikami, pokazuje zużycie całego domu." },
  { id: "shelly-pro-2pm", brand: "Shelly", name: "Shelly Pro 2PM", cat: "rozdzielnica", price: 429, where: "din", mod: 1, power: "din", channels: 2, caps: ["relay", "blinds"], hubs: SHELLY, desc: "2 kanały albo sterownik rolet." },
  { id: "shelly-pro-dimmer-2pm", brand: "Shelly", name: "Shelly Pro Dimmer 2PM", cat: "rozdzielnica", price: 369, where: "din", mod: 2, power: "din", channels: 2, caps: ["relay", "dimmer"], hubs: SHELLY, desc: "Ściemniacz na 2 obwody prosto z rozdzielnicy." },
  { id: "surge-t1t2", brand: "Hager", name: "Ogranicznik przepięć T1+T2", cat: "rozdzielnica", price: 1079, where: "din", mod: 4, power: "din", channels: 0, caps: ["surge"], desc: "Chroni całą elektronikę przed burzą." },
  { id: "shelly-1-gen4", brand: "Shelly", name: "Shelly 1 Gen4", cat: "dom", price: 99, mounts: ["gate", "garage"], power: "mains", caps: ["gate"], hubs: [{ any: [], p: ALL }], desc: "Przekaźnik do bramy albo garażu, Matter w środku." },
  { id: "shelly-plug-s", brand: "Shelly", name: "Shelly Plug S Gen3", cat: "dom", price: 79, mounts: ["socket"], power: "mains", caps: ["plug"], hubs: [{ any: [], p: ALL }], desc: "Inteligentne gniazdko z pomiarem prądu." },

  { id: "hue-e27", brand: "Philips Hue", name: "Hue White and Color Ambiance E27", cat: "swiatlo", price: 289, mounts: ["socketE27"], power: "mains", caps: ["light", "color"], hubs: HUE, desc: "Kolorowa żarówka, 16 milionów kolorów." },
  { id: "hue-gu10", brand: "Philips Hue", name: "Hue White and Color Ambiance GU10", cat: "swiatlo", price: 319, mounts: ["socketGU10"], power: "mains", caps: ["light", "color"], hubs: HUE, desc: "Kolorowe oczko do sufitu podwieszanego." },
  { id: "ikea-kajplats-e27", brand: "IKEA", name: "KAJPLATS żarówka LED E27 kolor", cat: "swiatlo", price: 59, mounts: ["socketE27"], power: "mains", caps: ["light", "color"], hubs: THREAD(["ikea-dirigera"]), desc: "Tania kolorowa żarówka Matter przez Thread." },
  { id: "hue-play-gradient", brand: "Philips Hue", name: "Hue Play gradient lightstrip 55\"", cat: "swiatlo", price: 869, strip: ["tv"], power: "mains", caps: ["light", "color", "strip", "tvlight"], hubs: HUE, desc: "Pasek za telewizor, kolory idą za obrazem." },
  { id: "hue-lightstrip-plus", brand: "Philips Hue", name: "Hue Lightstrip Plus 2 m", cat: "swiatlo", price: 329, strip: ["kitchen", "bed", "cove", "shelf", "desk"], power: "mains", caps: ["light", "color", "strip"], hubs: HUE, desc: "Taśma LED pod szafki, za łóżko albo na półkę." },
  { id: "govee-strip-m1", brand: "Govee", name: "Govee RGBIC LED Strip Light M1", cat: "swiatlo", price: 229, strip: ["tv", "kitchen", "bed", "cove", "shelf", "desk"], power: "mains", caps: ["light", "color", "strip", "rgbic"], hubs: WIFI, needsWifi: true, desc: "Taśma RGBIC z Matter: każdy kawałek świeci innym kolorem." },
  { id: "govee-floor-lamp-2", brand: "Govee", name: "Govee Floor Lamp 2", cat: "swiatlo", price: 649, mounts: ["floor"], power: "mains", caps: ["light", "color", "rgbic"], hubs: WIFI, needsWifi: true, desc: "Stojąca lampa RGBIC do kąta salonu." },
  { id: "hue-tap-dial", brand: "Philips Hue", name: "Hue Tap dial switch", cat: "swiatlo", price: 249, mounts: ["wall"], power: "battery", caps: ["switch"], hubs: HUE, desc: "Pokrętło na ścianę do jasności i scen." },

  { id: "tado-trv-x", brand: "tado°", name: "tado° Smart Radiator Thermostat X", cat: "klimat", price: 429, mounts: ["radiator"], power: "battery", caps: ["trv"], hubs: THREAD(["tado-bridge-x"]), desc: "Głowica na kaloryfer, każdy pokój ma swoją temperaturę." },
  { id: "tado-thermostat-x", brand: "tado°", name: "tado° Wired Smart Thermostat X", cat: "klimat", price: 389, mounts: ["wall"], power: "battery", caps: ["thermostat"], hubs: THREAD(["tado-bridge-x"]), desc: "Termostat na ścianę do pieca albo podłogówki." },
  { id: "aqara-temp", brand: "Aqara", name: "Aqara Temperature and Humidity Sensor T1", cat: "klimat", price: 89, mounts: ["wall", "surface"], power: "battery", caps: ["temp"], hubs: AQARA_ZB, desc: "Mały czujnik temperatury i wilgotności." },

  { id: "aqara-door-p2", brand: "Aqara", name: "Aqara Door and Window Sensor P2", cat: "czujniki", price: 139, mounts: ["door", "window"], power: "battery", caps: ["contact"], hubs: THREAD(["aqara-hub-m3"]), desc: "Wie, czy drzwi albo okno są otwarte." },
  { id: "aqara-motion-p2", brand: "Aqara", name: "Aqara Motion and Light Sensor P2", cat: "czujniki", price: 149, mounts: ["wall", "ceiling"], power: "battery", caps: ["motion"], hubs: THREAD(["aqara-hub-m3"]), desc: "Ruch i natężenie światła, zapala światło samo." },
  { id: "aqara-fp2", brand: "Aqara", name: "Aqara Presence Sensor FP2", cat: "czujniki", price: 359, mounts: ["wall", "ceiling"], power: "usb", caps: ["motion", "presence"], hubs: WIFI, needsWifi: true, desc: "Radar mmWave: widzi, że ktoś siedzi, nawet bez ruchu." },
  { id: "aqara-leak", brand: "Aqara", name: "Aqara Water Leak Sensor", cat: "czujniki", price: 99, mounts: ["floor"], power: "battery", caps: ["leak"], hubs: AQARA_ZB, desc: "Krzyczy, zanim woda zaleje sąsiadów." },
  { id: "aqara-smoke", brand: "Aqara", name: "Aqara Smart Smoke Detector", cat: "czujniki", price: 229, mounts: ["ceiling"], power: "battery", caps: ["smoke"], hubs: AQARA_ZB, desc: "Czujnik dymu z powiadomieniem na telefon." },
  { id: "nuki-ultra", brand: "Nuki", name: "Nuki Smart Lock Ultra", cat: "czujniki", price: 1549, mounts: ["doorLock"], power: "battery", caps: ["lock"], hubs: THREAD([]), desc: "Zamek otwierany telefonem, montaż bez wiercenia w drzwiach." },

  { id: "hue-bridge-pro", brand: "Philips Hue", name: "Hue Bridge Pro", cat: "centrale", price: 349, where: "shelf", mounts: ["surface"], power: "mains", ports: { rj45: 1 }, caps: ["hub"], desc: "Mostek do wszystkich lamp Hue." },
  { id: "ikea-dirigera", brand: "IKEA", name: "DIRIGERA hub", cat: "centrale", price: 379, where: "shelf", mounts: ["surface"], power: "mains", ports: { rj45: 1 }, caps: ["hub", "thread"], desc: "Centralka IKEA, mostek Matter i Thread." },
  { id: "aqara-hub-m3", brand: "Aqara", name: "Aqara Hub M3", cat: "centrale", price: 669, where: "shelf", mounts: ["surface", "wall"], power: "poe", poe: 5, caps: ["hub", "thread", "zigbee"], desc: "Centrala Aqara z Zigbee, Thread i Matter." },
  { id: "tado-bridge-x", brand: "tado°", name: "tado° Bridge X", cat: "centrale", price: 299, where: "shelf", mounts: ["surface"], power: "usb", caps: ["hub", "thread"], desc: "Mostek Thread dla głowic tado°." },
  { id: "ha-green", brand: "Home Assistant", name: "Home Assistant Green", cat: "centrale", price: 769, where: "shelf", mounts: ["surface"], power: "mains", ports: { rj45: 1 }, caps: ["hub", "controller:ha"], desc: "Serce Home Assistant: łączy wszystko ze wszystkim." },
  { id: "ha-zbt2", brand: "Home Assistant", name: "Home Assistant Connect ZBT-2", cat: "centrale", price: 199, where: "shelf", mounts: ["surface"], power: "usb", caps: ["hub", "zigbee", "thread"], desc: "Antena Zigbee i Thread do Home Assistant." },
  { id: "homepod-mini", brand: "Apple", name: "HomePod mini", cat: "multimedia", price: 549, mounts: ["surface"], power: "mains", caps: ["speaker", "controller:apple", "thread"], desc: "Głośnik i centrum Domu Apple z Thread." },
  { id: "apple-tv-4k", brand: "Apple", name: "Apple TV 4K (2026)", cat: "multimedia", price: 1499, mounts: ["surface"], power: "mains", ports: { rj45: 1 }, caps: ["controller:apple", "thread"], desc: "Centrum Domu Apple i router Thread pod telewizorem." },
  { id: "nest-hub", brand: "Google", name: "Google Nest Hub (2. gen.)", cat: "multimedia", price: 399, mounts: ["surface"], power: "mains", caps: ["speaker", "controller:google", "thread"], desc: "Ekran z Asystentem i centrum Google Home." },
  { id: "google-tv-streamer", brand: "Google", name: "Google TV Streamer", cat: "multimedia", price: 499, mounts: ["surface"], power: "mains", ports: { rj45: 1 }, caps: ["controller:google", "thread"], desc: "Przystawka do TV i centrum Google Home." },
  { id: "sonos-era-100", brand: "Sonos", name: "Sonos Era 100", cat: "multimedia", price: 999, mounts: ["surface"], power: "mains", caps: ["speaker"], hubs: WIFI, needsWifi: true, desc: "Głośnik do muzyki w każdym pokoju." },
  { id: "sonos-arc-ultra", brand: "Sonos", name: "Sonos Arc Ultra", cat: "multimedia", price: 4799, mounts: ["tv"], power: "mains", caps: ["speaker", "soundbar"], hubs: WIFI, needsWifi: true, desc: "Soundbar Dolby Atmos pod telewizor." },

  { id: "roborock-saros-10r", brand: "Roborock", name: "Roborock Saros 10R", cat: "dom", price: 5499, mounts: ["floor"], power: "mains", caps: ["vacuum"], hubs: WIFI, needsWifi: true, desc: "Robot sprzątający ze stacją, sam myje mopy." },
  { id: "tesla-wall-connector", brand: "Tesla", name: "Tesla Wall Connector (Gen 3)", cat: "dom", price: 2269, mounts: ["garage"], power: "mains", caps: ["ev"], hubs: [{ any: ["ha-green"], p: ALL, via: "Home Assistant" }], needsWifi: true, desc: "Ładowarka do auta w garażu, do 22 kW na trzech fazach." },
  { id: "netatmo-weather", brand: "Netatmo", name: "Netatmo Smart Weather Station", cat: "dom", price: 599, mounts: ["outdoorWall"], power: "mains", caps: ["weather"], hubs: WIFI, needsWifi: true, desc: "Stacja pogody: temperatura na zewnątrz i jakość powietrza." },

  { id: "ipad-a16", brand: "Apple", name: "iPad 11\" (A16)", cat: "tablety", price: 2199, caps: ["tablet"], os: "ipados", screen: 11, desc: "Najprostszy wybór na panel do domu." },
  { id: "ipad-mini", brand: "Apple", name: "iPad mini (A20 Pro)", cat: "tablety", price: 3499, caps: ["tablet"], os: "ipados", screen: 8.3, desc: "Mały panel z ekranem OLED, mieści się w każdym holu." },
  { id: "galaxy-tab-a9p", brand: "Samsung", name: "Galaxy Tab A9+", cat: "tablety", price: 799, caps: ["tablet"], os: "android", screen: 11, desc: "Tani Android, nie obsłuży Domu Apple." },
  { id: "tablet-wall-mount", brand: "iPort", name: "iPort CONNECT PRO WallStation", cat: "tablety", price: 1719, caps: ["wallmount"], poe: 15, desc: "Magnetyczny uchwyt ścienny zasilany po kablu sieciowym." },
  { id: "tablet-stand", brand: "iPort", name: "iPort CONNECT PRO BaseStation", cat: "tablety", price: 1629, caps: ["stand"], desc: "Magnetyczna podstawka na blat albo półkę." }
];

export const BY_ID = Object.fromEntries(CATALOG.map((d) => [d.id, d]));
export const item = (id) => BY_ID[id];
export const has = (id, cap) => !!(BY_ID[id] && BY_ID[id].caps.includes(cap));

export const PLATFORMS = {
  ha: { id: "ha", name: "Home Assistant", controllers: ["ha-green"], short: "HA" },
  apple: { id: "apple", name: "Dom Apple", controllers: ["homepod-mini", "apple-tv-4k"], short: "Apple" },
  google: { id: "google", name: "Google Home", controllers: ["nest-hub", "google-tv-streamer"], short: "Google" }
};

export const CABLE_PER_M = 4;
export const KEYSTONE = 18;
export const PATCHCORD = 12;

export function hubOptions(id, platform) {
  const d = BY_ID[id];
  if (!d || !d.hubs) return null;
  return d.hubs.filter((h) => h.p.includes(platform));
}

export function pairStatus(id, platform, installedIds) {
  const d = BY_ID[id];
  if (!d) return { ok: false, why: "unknown" };
  if (!d.hubs) return { ok: true };
  const opts = hubOptions(id, platform);
  if (!opts.length) return { ok: false, why: "platform", need: [] };
  for (const o of opts) {
    if (!o.any.length || o.any.some((h) => installedIds.has(h))) return { ok: true, via: o.via || null };
  }
  return { ok: false, why: "hub", need: opts.map((o) => o.any) };
}

export function platformBadges(id) {
  const d = BY_ID[id];
  const out = {};
  for (const p of ["ha", "apple", "google"]) {
    if (!d || !d.hubs) { out[p] = "native"; continue; }
    const o = hubOptions(id, p);
    out[p] = !o.length ? "no" : o.some((x) => !x.via) ? "native" : "bridge";
  }
  return out;
}

export function fmtZl(n) {
  const s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${s} zł`;
}

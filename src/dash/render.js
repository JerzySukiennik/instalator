// Instalator: tablet dashboard renderer in three real styles (Home Assistant, Apple Home, Google Home) for the TV texture and the phone designer.

import { BY_ID } from "../shared/catalog.js";
import { drawIcon } from "../shared/icons.js";

export const COLS = 4, ROWS = 3;

const KIND_ICON = { light: "bulb", camera: "cam", climate: "temp", energy: "energy", lock: "lock", scene: "scene", network: "net", media: "speaker", sensor: "sensor" };
export const KIND_LABEL = { light: "Światło", camera: "Kamera", climate: "Ogrzewanie", energy: "Prąd", lock: "Zamek", scene: "Scena", network: "Sieć", media: "Muzyka", sensor: "Czujnik" };

const F = {
  ha: "Roboto, 'Helvetica Neue', Arial, sans-serif",
  apple: "-apple-system, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif",
  google: "'Google Sans', 'Google Sans Text', 'Product Sans', Roboto, Arial, sans-serif"
};

const LAYOUT = {
  ha: { x: 92, y: 150, r: 12, gap: 12, right: 28, bottom: 26 },
  apple: { x: 262, y: 236, r: 22, gap: 14, right: 30, bottom: 26 },
  google: { x: 186, y: 236, r: 30, gap: 14, right: 66, bottom: 52 }
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); else ctx.rect(x, y, w, h);
}

export function gridRect(w, h, platform) {
  const L = LAYOUT[platform] || LAYOUT.ha;
  const gw = w - L.x - L.right, gh = h - L.y - L.bottom;
  const cw = (gw - L.gap * (COLS - 1)) / COLS, ch = (gh - L.gap * (ROWS - 1)) / ROWS;
  return { x: L.x, y: L.y, cw, ch, gap: L.gap, w: gw, h: gh };
}

export function cardRect(g, c) {
  return { x: g.x + c.x * (g.cw + g.gap), y: g.y + c.y * (g.ch + g.gap), w: c.w * g.cw + (c.w - 1) * g.gap, h: c.h * g.ch + (c.h - 1) * g.gap };
}

function devOf(snap, uid) { return uid ? snap.devs.find((d) => d.uid === uid) : null; }

function roomName(data, id) {
  const r = data?.rooms?.find((x) => x.id === id);
  return r ? r.name[0].toUpperCase() + r.name.slice(1) : id === "outdoor" ? "Na zewnątrz" : "";
}

function zoneName(data, d) {
  if (!d || !d.aim || !data?.zones) return null;
  let best = null, bd = 1e9;
  for (const z of data.zones) {
    const dx = z.pos[0] - d.pos[0], dz = z.pos[2] - d.pos[2];
    const dist = Math.hypot(dx, dz);
    const dot = (dx * d.aim[0] + dz * d.aim[2]) / (dist || 1);
    if (dot > 0.5 && dist < bd) { bd = dist; best = z; }
  }
  return best ? ({ entrance: "Wejście", driveway: "Podjazd", garden: "Ogród", terrace: "Taras", jetty: "Pomost", gate: "Brama", garage: "Garaż", street: "Ulica" }[best.kind] || null) : null;
}

const fmt = (n, d = 1) => n.toFixed(d).replace(".", ",");

export function cardInfo(snap, data, c) {
  const d = devOf(snap, c.dev);
  const it = d ? BY_ID[d.id] : null;
  const st = d && snap.der ? snap.der.dev[d.uid] : null;
  const live = !!(st && st.pw && st.net);
  let title = c.title || (d ? roomName(data, d.room) || it?.name : KIND_LABEL[c.kind]);
  let state = "", on = false, value = null;
  const bri = d?.bri ?? 0.85;
  switch (c.kind) {
    case "light": {
      on = d ? live && d.on !== false : true;
      if (d && it?.caps.includes("strip")) title = c.title || `${roomName(data, d.room)} taśma`;
      else if (d && d.place === "din") title = c.title || "Światła";
      state = !d ? "Wł." : !live ? "Niedostępne" : on ? `Wł. · ${Math.round(bri * 100)}%` : "Wył.";
      value = on ? bri : 0;
      break;
    }
    case "climate": on = !d || live; value = d?.temp ?? 21; state = on ? "Komfort" : "Niedostępne"; title = c.title || (d ? roomName(data, d.room) : "Ogrzewanie"); break;
    case "lock": on = live; state = live ? (d?.locked === false ? "Otwarte" : "Zamknięte") : "Niedostępne"; title = c.title || "Drzwi wejściowe"; break;
    case "camera": on = live; state = live ? "Na żywo" : "Offline"; title = c.title || zoneName(data, d) || (d ? roomName(data, d.room) : "Kamera"); break;
    case "energy": on = true; value = 0.42 + ((snap.devs || []).length % 7) * 0.13; state = `${fmt(value, 2)} kW`; title = c.title || "Zużycie prądu"; break;
    case "network": on = !!snap.der?.online; state = snap.der?.online ? `${(snap.devs || []).filter((x) => snap.der.dev[x.uid]?.net).length} urządzeń online` : "Brak internetu"; title = c.title || "Sieć UniFi"; break;
    case "scene": on = false; state = "Scena"; title = c.title || "Wieczór"; break;
    case "media": on = live; state = live ? "Gra · 40%" : d ? "Niedostępne" : "Nic nie gra"; title = c.title || (d ? `${it?.name.replace("Sonos ", "Sonos ")}` : "Muzyka"); break;
    case "sensor": on = live; state = live ? (it?.caps.includes("leak") ? "Sucho" : it?.caps.includes("smoke") ? "Brak dymu" : it?.caps.includes("contact") ? "Zamknięte" : "Brak ruchu") : "Niedostępne"; title = c.title || (d ? `${roomName(data, d.room)}` : "Czujnik"); break;
    default: break;
  }
  return { d, it, live, on, title, state, value, color: d?.color };
}

export function renderDash(ctx, w, h, snap, data, opts = {}) {
  const p = snap.tablet?.platform || "ha";
  const cards = opts.cards || snap.tablet?.dash?.cards || [];
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (p === "apple") appleChrome(ctx, w, h, snap);
  else if (p === "google") googleChrome(ctx, w, h, snap);
  else haChrome(ctx, w, h, snap);
  const g = gridRect(w, h, p);
  if (opts.grid) {
    ctx.strokeStyle = p === "apple" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.1)";
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const r = cardRect(g, { x, y, w: 1, h: 1 }); rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, LAYOUT[p].r); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  for (const c of cards) {
    const r = cardRect(g, c);
    const info = cardInfo(snap, data, c);
    ctx.save();
    if (p === "apple") appleTile(ctx, r, c, info, opts);
    else if (p === "google") googleTile(ctx, r, c, info, opts);
    else haTile(ctx, r, c, info, opts);
    ctx.restore();
    if (opts.selected === c.id) { ctx.strokeStyle = "#f3cf45"; ctx.lineWidth = 6; rr(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, LAYOUT[p].r + 4); ctx.stroke(); }
  }
  if (!cards.length && !opts.grid) {
    ctx.fillStyle = p === "apple" ? "rgba(255,255,255,0.8)" : "#5f6368";
    ctx.font = `500 24px ${F[p]}`;
    ctx.textAlign = "center";
    ctx.fillText("Dodaj kafelki na telefonie", g.x + g.w / 2, g.y + g.h / 2);
    ctx.textAlign = "left";
  }
  ctx.restore();
}

function haChrome(ctx, w, h, snap) {
  ctx.fillStyle = "#fafafa"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 64, h);
  ctx.fillStyle = "#e0e0e0"; ctx.fillRect(64, 0, 1, h);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(65, 0, w - 65, 64);
  ctx.fillStyle = "#e0e0e0"; ctx.fillRect(65, 64, w - 65, 1);
  ctx.strokeStyle = "#5f6368"; ctx.lineWidth = 2.4;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(20, 24 + i * 8); ctx.lineTo(44, 24 + i * 8); ctx.stroke(); }
  ctx.fillStyle = "rgba(3,169,244,0.14)"; rr(ctx, 8, 78, 48, 44, 10); ctx.fill();
  drawIcon(ctx, "plan", 20, 88, 24, "#039be5", 2);
  drawIcon(ctx, "home", 20, 140, 24, "#5f6368", 2);
  drawIcon(ctx, "bolt", 20, 192, 24, "#5f6368", 2);
  drawIcon(ctx, "hub", 20, h - 130, 24, "#5f6368", 2);
  ctx.fillStyle = "#03a9f4"; ctx.beginPath(); ctx.arc(32, h - 40, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = `500 15px ${F.ha}`; ctx.textAlign = "center"; ctx.fillText("TA", 32, h - 35); ctx.textAlign = "left";
  ctx.fillStyle = "#212121"; ctx.font = `400 24px ${F.ha}`; ctx.fillText("Dom", 92, 40);
  drawIcon(ctx, "plus", w - 148, 20, 24, "#424242", 2); drawIcon(ctx, "sensor", w - 104, 20, 24, "#424242", 2); drawIcon(ctx, "drill", w - 60, 20, 24, "#424242", 2);
  const temp = (snap.devs || []).find((d) => BY_ID[d.id]?.caps.includes("trv"));
  const badges = [[`${fmt(temp?.temp ?? 21.5)} °C`, "temp", "#e53935"], [`${54}%`, "sensor", "#1e88e5"], ["W domu", "home", "#5f6368"]];
  ctx.font = `500 15px ${F.ha}`;
  const widths = badges.map(([t]) => ctx.measureText(t).width + 52);
  let x = 92 + (w - 92 - 28 - widths.reduce((a, b) => a + b, 0) - 10 * (badges.length - 1)) / 2;
  badges.forEach(([t, ic, col], i) => {
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#e0e0e0"; ctx.lineWidth = 1; rr(ctx, x, 82, widths[i], 36, 18); ctx.fill(); ctx.stroke();
    drawIcon(ctx, ic, x + 12, 90, 20, col, 2);
    ctx.fillStyle = "#212121"; ctx.fillText(t, x + 38, 106);
    x += widths[i] + 10;
  });
  drawIcon(ctx, "living", 92, 124, 22, "#212121", 2);
  ctx.fillStyle = "#212121"; ctx.font = `500 18px ${F.ha}`; ctx.fillText("Ulubione", 122, 142);
}

function haTile(ctx, r, c, info, opts) {
  const col = { light: "#ffc107", climate: "#ff8100", lock: "#43a047", camera: "#039be5", energy: "#039be5", scene: "#5f6368", network: "#039be5", media: "#2196f3", sensor: "#039be5" }[c.kind] || "#039be5";
  if (c.kind === "camera") return camTile(ctx, r, info, opts, "ha");
  ctx.fillStyle = "#ffffff"; rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
  ctx.strokeStyle = "#e0e0e0"; ctx.lineWidth = 1; ctx.stroke();
  const big = r.h > 150;
  if (c.kind === "climate" && big) {
    const cx = r.x + r.w / 2, cy = r.y + r.h * 0.5, rad = Math.min(r.w, r.h) * 0.3;
    ctx.lineCap = "round"; ctx.lineWidth = 12;
    ctx.strokeStyle = "#ececec"; ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
    ctx.strokeStyle = info.on ? col : "#bdbdbd"; ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * ((info.value - 10) / 20))); ctx.stroke();
    ctx.fillStyle = "#212121"; ctx.textAlign = "center"; ctx.font = `400 40px ${F.ha}`; ctx.fillText(fmt(info.value), cx, cy + 12);
    ctx.font = `400 14px ${F.ha}`; ctx.fillStyle = "#727272"; ctx.fillText("°C · grzanie", cx, cy + 36);
    ctx.font = `500 16px ${F.ha}`; ctx.fillStyle = "#212121"; ctx.fillText(info.title, cx, r.y + 30);
    ctx.textAlign = "left";
    pmRow(ctx, r.x + 14, r.y + r.h - 54, r.w - 28, 40, "#f5f5f5", "#212121", `${fmt(info.value)} °C`, F.ha, 10);
    return;
  }
  const ix = r.x + 30, iy = r.y + 32;
  ctx.fillStyle = info.on ? hexA(c.kind === "light" && info.color ? info.color : col, 0.22) : "#f0f0f0";
  ctx.beginPath(); ctx.arc(ix, iy, 20, 0, Math.PI * 2); ctx.fill();
  drawIcon(ctx, KIND_ICON[c.kind] || "box", ix - 12, iy - 12, 24, info.on ? (c.kind === "light" && info.color ? darker(info.color) : col) : "#9e9e9e", 2);
  ctx.fillStyle = "#212121"; ctx.font = `500 16px ${F.ha}`; clipText(ctx, info.title, r.x + 60, r.y + 28, r.w - 72);
  ctx.fillStyle = "#727272"; ctx.font = `400 14px ${F.ha}`; clipText(ctx, info.state, r.x + 60, r.y + 48, r.w - 72);
  if (c.kind === "light" && r.h > 100) {
    const bx = r.x + 14, by = r.y + r.h - 56, bw = r.w - 28;
    ctx.fillStyle = hexA("#ffc107", 0.2); rr(ctx, bx, by, bw, 42, 10); ctx.fill();
    ctx.fillStyle = info.on ? "#ffc107" : "#e0e0e0"; rr(ctx, bx, by, Math.max(12, bw * (info.value || 0)), 42, 10); ctx.fill();
    ctx.fillStyle = "#fff"; rr(ctx, bx + Math.max(12, bw * (info.value || 0)) - 10, by + 10, 4, 22, 2); ctx.fill();
  }
  if (c.kind === "energy" && r.h > 100) spark(ctx, r.x + 14, r.y + r.h - 60, r.w - 28, 46, "#039be5");
  if (c.kind === "climate") pmRow(ctx, r.x + 14, r.y + r.h - 50, r.w - 28, 38, "#f5f5f5", "#212121", `${fmt(info.value)} °C`, F.ha, 10);
}

function appleChrome(ctx, w, h, snap) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#7d93a8"); g.addColorStop(0.42, "#a59377"); g.addColorStop(0.7, "#c68a4e"); g.addColorStop(1, "#7a4f2c");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const sun = ctx.createRadialGradient(w * 0.62, h * 0.82, 10, w * 0.62, h * 0.82, w * 0.55);
  sun.addColorStop(0, "rgba(255,214,150,0.75)"); sun.addColorStop(1, "rgba(255,214,150,0)");
  ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(42,52,60,0.62)"; ctx.fillRect(0, 0, 232, h);
  ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.font = `600 14px ${F.apple}`; ctx.fillText("18:24  pt 31 paź", 20, 26);
  ctx.fillText("100%", w - 62, 26);
  ctx.fillStyle = "rgba(255,255,255,0.18)"; rr(ctx, 14, 70, 204, 40, 12); ctx.fill();
  drawIcon(ctx, "home", 28, 78, 24, "#ffffff", 2);
  ctx.fillStyle = "#fff"; ctx.font = `500 17px ${F.apple}`; ctx.fillText("Dom", 64, 97);
  drawIcon(ctx, "scene", 28, 122, 24, "rgba(255,255,255,0.85)", 2);
  ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillText("Automatyzacja", 64, 141);
  ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = `600 13px ${F.apple}`; ctx.fillText("POMIESZCZENIA", 28, 192);
  ["Salon", "Kuchnia", "Sypialnia", "Hol"].forEach((t, i) => { ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = `500 16px ${F.apple}`; ctx.fillText(t, 28, 224 + i * 36); });
  ctx.fillStyle = "#ffffff"; ctx.font = `700 40px ${F.apple}`; ctx.fillText("Mój dom", 262, 96);
  const lights = (snap.devs || []).filter((d) => BY_ID[d.id]?.caps.includes("light") && d.on !== false && snap.der?.dev[d.uid]?.pw).length;
  const chips = [["temp", "Klimat", "20–22°", "#64d2ff"], ["bulb", "Światła", `${lights} wł.`, "#ffd60a"], ["lock", "Ochrona", "zamknięte", "#30d158"], ["speaker", "Głośniki", "1 gra", "#ffffff"], ["energy", "Prąd", "czysty", "#30d158"]];
  let x = 262;
  for (const [ic, a, b, col] of chips) {
    ctx.font = `600 13px ${F.apple}`;
    const tw = Math.max(ctx.measureText(a).width, ctx.measureText(b).width) + 46;
    ctx.fillStyle = "rgba(40,30,25,0.42)"; rr(ctx, x, 116, tw, 42, 21); ctx.fill();
    drawIcon(ctx, ic, x + 10, 126, 20, col, 2.2);
    ctx.fillStyle = "#fff"; ctx.fillText(a, x + 36, 134);
    ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `500 12px ${F.apple}`; ctx.fillText(b, x + 36, 150);
    x += tw + 8;
    if (x > w - 120) break;
  }
  ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.font = `600 21px ${F.apple}`; ctx.fillText("Ulubione", 262, 214);
  drawIcon(ctx, "chev", 352, 199, 18, "rgba(255,255,255,0.8)", 2.6);
}

function appleTile(ctx, r, c, info, opts) {
  if (c.kind === "camera") return camTile(ctx, r, info, opts, "apple");
  const col = { light: "#ffd60a", climate: "#ff9f0a", lock: "#30d158", energy: "#30d158", scene: "#ff9f0a", network: "#0a84ff", media: "#ffffff", sensor: "#64d2ff" }[c.kind] || "#0a84ff";
  const on = info.on || c.kind === "scene";
  ctx.fillStyle = on ? "rgba(246,244,240,0.94)" : "rgba(48,36,28,0.48)";
  rr(ctx, r.x, r.y, r.w, r.h, 22); ctx.fill();
  if (c.kind === "climate" && r.h > 150) {
    ctx.fillStyle = "#ff8c00"; ctx.font = `600 64px ${F.apple}`; ctx.fillText(`${Math.round(info.value)}°`, r.x + 20, r.y + 82);
    ctx.fillStyle = "#1c1c1e"; ctx.font = `600 17px ${F.apple}`; clipText(ctx, info.title, r.x + 20, r.y + r.h - 42, r.w - 34);
    ctx.fillStyle = "#6e6e73"; ctx.font = `500 15px ${F.apple}`; ctx.fillText("Grzanie do 22°", r.x + 20, r.y + r.h - 20);
    return;
  }
  const cx = r.x + 30, cy = r.y + (r.h > 110 ? 34 : r.h / 2);
  ctx.fillStyle = on ? (c.kind === "light" && info.color ? info.color : col) : "rgba(255,255,255,0.22)";
  ctx.beginPath(); ctx.arc(cx, cy, 19, 0, Math.PI * 2); ctx.fill();
  drawIcon(ctx, KIND_ICON[c.kind] || "box", cx - 11, cy - 11, 22, on ? (c.kind === "media" ? "#1c1c1e" : "#ffffff") : "rgba(255,255,255,0.75)", 2.2);
  const tx = r.h > 110 ? r.x + 18 : r.x + 60;
  const ty = r.h > 110 ? r.y + r.h - 38 : r.y + r.h / 2 - 3;
  ctx.fillStyle = on ? "#1c1c1e" : "#ffffff"; ctx.font = `600 16px ${F.apple}`; clipText(ctx, info.title, tx, ty, r.x + r.w - tx - 12);
  ctx.fillStyle = on ? "#6e6e73" : "rgba(255,255,255,0.7)"; ctx.font = `500 14px ${F.apple}`; clipText(ctx, c.kind === "light" && on ? `${Math.round((info.value || 0) * 100)}%` : info.state, tx, ty + 19, r.x + r.w - tx - 12);
}

function googleChrome(ctx, w, h, snap) {
  ctx.fillStyle = "#eef3f8"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1f1f1f"; ctx.font = `500 15px ${F.google}`; ctx.fillText("18:24", 22, 26);
  ctx.fillText("5G", w - 70, 26);
  const rail = [["home", "Dom", true], ["din", "Aktywność", false], ["scene", "Automatyzacje", false]];
  rail.forEach(([ic, t, on], i) => {
    const y = 300 + i * 92;
    if (on) { ctx.fillStyle = "#d3e3fd"; rr(ctx, 40, y - 4, 64, 34, 17); ctx.fill(); }
    drawIcon(ctx, ic, 60, y, 24, on ? "#041e49" : "#444746", 2);
    ctx.fillStyle = on ? "#041e49" : "#444746"; ctx.font = `${on ? 600 : 500} 13px ${F.google}`; ctx.textAlign = "center"; ctx.fillText(t, 72, y + 50); ctx.textAlign = "left";
  });
  ctx.fillStyle = "#ffffff"; rr(ctx, 152, 52, 560, 54, 27); ctx.fill();
  ctx.fillStyle = "#e9eef6"; ctx.beginPath(); ctx.arc(182, 79, 16, 0, Math.PI * 2); ctx.fill();
  drawIcon(ctx, "home", 172, 69, 20, "#444746", 2);
  ctx.fillStyle = "#444746"; ctx.font = `400 19px ${F.google}`; ctx.fillText("Zapytaj Dom", 212, 86);
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(w - 118, 79, 24, 0, Math.PI * 2); ctx.fill();
  drawIcon(ctx, "plus", w - 130, 67, 24, "#1f1f1f", 2.2);
  ctx.fillStyle = "#c2e7ff"; ctx.beginPath(); ctx.arc(w - 64, 79, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#041e49"; ctx.font = `600 16px ${F.google}`; ctx.textAlign = "center"; ctx.fillText("T", w - 64, 85); ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff"; rr(ctx, 152, 128, w - 152 - 40, h - 128 - 28, 30); ctx.fill();
  const chips = [["home", "Ulubione", true], ["plan", "Wszystko"], ["cam", "Kamery"], ["bulb", "Światła"], ["wifi", "Wi-Fi"], ["temp", "Klimat"]];
  let x = 186;
  ctx.font = `500 17px ${F.google}`;
  for (const [ic, t, on] of chips) {
    const tw = ctx.measureText(t).width + 62;
    ctx.fillStyle = on ? "#c2e7ff" : "#eef1f6"; rr(ctx, x, 152, tw, 50, 25); ctx.fill();
    drawIcon(ctx, ic, x + 16, 165, 22, on ? "#041e49" : "#444746", 2);
    ctx.fillStyle = on ? "#041e49" : "#444746"; ctx.fillText(t, x + 46, 183);
    x += tw + 10;
    if (x > w - 140) break;
  }
}

function googleTile(ctx, r, c, info, opts) {
  if (c.kind === "camera") return camTile(ctx, r, info, opts, "google");
  const pal = {
    light: ["#fde293", "#feefc3", "#3c2f00"], climate: ["#ffdad3", "#ffdad3", "#5c1400"], lock: ["#d3e3fd", "#d3e3fd", "#0842a0"], energy: ["#d3e3fd", "#d3e3fd", "#0842a0"],
    media: ["#d3e3fd", "#e8eefc", "#0842a0"], network: ["#e9eef6", "#e9eef6", "#1f1f1f"], scene: ["#e9eef6", "#e9eef6", "#1f1f1f"], sensor: ["#e9eef6", "#e9eef6", "#1f1f1f"]
  }[c.kind] || ["#e9eef6", "#e9eef6", "#1f1f1f"];
  const on = info.on && c.kind !== "network" && c.kind !== "scene" && c.kind !== "sensor";
  ctx.fillStyle = on ? pal[1] : "#eef1f6";
  rr(ctx, r.x, r.y, r.w, r.h, 30); ctx.fill();
  if (on && (c.kind === "light" || c.kind === "media")) {
    ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, 30); ctx.clip();
    ctx.fillStyle = pal[0]; ctx.fillRect(r.x, r.y, r.w * (c.kind === "light" ? Math.max(0.12, info.value || 0.5) : 0.42), r.h);
    ctx.restore();
  }
  const ink = on ? pal[2] : "#1f1f1f";
  if (c.kind === "climate" && r.h > 150) {
    ctx.fillStyle = "#ffdad3"; rr(ctx, r.x, r.y, r.w, r.h, 30); ctx.fill();
    drawIcon(ctx, "temp", r.x + 20, r.y + 22, 24, "#8c1d00", 2);
    ctx.fillStyle = "#5c1400"; ctx.font = `500 17px ${F.google}`; clipText(ctx, info.title, r.x + 52, r.y + 40, r.w - 70);
    ctx.textAlign = "center"; ctx.font = `500 64px ${F.google}`; ctx.fillStyle = "#5c1400"; ctx.fillText(`${Math.round(info.value)}`, r.x + r.w / 2, r.y + r.h * 0.5 + 14);
    ctx.font = `500 15px ${F.google}`; ctx.fillText(info.state, r.x + r.w / 2, r.y + r.h * 0.5 + 40);
    ctx.textAlign = "left";
    const bw = (r.w - 44) / 2;
    ctx.fillStyle = "#ffb4a1"; rr(ctx, r.x + 16, r.y + r.h - 64, bw, 48, 24); ctx.fill(); rr(ctx, r.x + 28 + bw, r.y + r.h - 64, bw, 48, 24); ctx.fill();
    drawIcon(ctx, "minus", r.x + 16 + bw / 2 - 12, r.y + r.h - 52, 24, "#5c1400", 2.4);
    drawIcon(ctx, "plus", r.x + 28 + bw * 1.5 - 12, r.y + r.h - 52, 24, "#5c1400", 2.4);
    return;
  }
  const cy = r.h > 130 ? r.y + 40 : r.y + r.h / 2;
  drawIcon(ctx, KIND_ICON[c.kind] || "box", r.x + 22, cy - 13, 26, ink, 2.1);
  const tx = r.x + 64;
  ctx.fillStyle = ink; ctx.font = `500 18px ${F.google}`; clipText(ctx, info.title, tx, cy - 3, r.w - (tx - r.x) - 18);
  ctx.font = `500 15px ${F.google}`; ctx.fillStyle = on ? ink : "#444746"; clipText(ctx, info.state.replace(" · ", " • "), tx, cy + 19, r.w - (tx - r.x) - 18);
  if (c.kind === "energy" && r.h > 130) spark(ctx, r.x + 20, r.y + r.h - 70, r.w - 40, 50, "#0842a0");
}

function camTile(ctx, r, info, opts, p) {
  const img = opts.camImages?.[info.d?.uid];
  const rad = LAYOUT[p].r;
  rr(ctx, r.x, r.y, r.w, r.h, rad);
  ctx.save(); ctx.clip();
  if (img && info.live) ctx.drawImage(img, r.x, r.y, r.w, r.h);
  else {
    const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    g.addColorStop(0, info.live ? "#8fa5b5" : "#3b3f42"); g.addColorStop(0.55, info.live ? "#7d8f62" : "#2d3033"); g.addColorStop(1, info.live ? "#59614a" : "#232527");
    ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
    if (!info.live) drawIcon(ctx, "cam", r.x + r.w / 2 - 20, r.y + r.h / 2 - 20, 40, "rgba(255,255,255,0.5)", 2);
  }
  const sh = ctx.createLinearGradient(0, r.y + r.h - 64, 0, r.y + r.h);
  sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = sh; ctx.fillRect(r.x, r.y + r.h - 64, r.w, 64);
  ctx.restore();
  if (p === "google") {
    if (info.live) { ctx.fillStyle = "#34a853"; ctx.beginPath(); ctx.arc(r.x + 26, r.y + 28, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#fff"; ctx.font = `500 17px ${F.google}`; ctx.fillText(info.live ? "Na żywo" : "Offline", r.x + 40, r.y + 34);
    ctx.font = `500 15px ${F.google}`; clipText(ctx, info.title, r.x + 20, r.y + r.h - 18, r.w - 40);
  } else if (p === "apple") {
    ctx.fillStyle = "#fff"; ctx.font = `600 14px ${F.apple}`; ctx.fillText(info.live ? "2 s" : "brak obrazu", r.x + 14, r.y + r.h - 16);
    ctx.font = `600 15px ${F.apple}`; ctx.textAlign = "right"; clipText(ctx, "", 0, 0, 0); ctx.fillText(info.title, r.x + r.w - 14, r.y + r.h - 16); ctx.textAlign = "left";
  } else {
    ctx.fillStyle = "#fff"; ctx.font = `500 16px ${F.ha}`; clipText(ctx, info.title, r.x + 14, r.y + r.h - 16, r.w - 28);
    if (info.live) { ctx.fillStyle = "rgba(0,0,0,0.45)"; rr(ctx, r.x + r.w - 92, r.y + 12, 80, 26, 13); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = `500 13px ${F.ha}`; ctx.fillText("NA ŻYWO", r.x + r.w - 80, r.y + 30); }
  }
}

function pmRow(ctx, x, y, w, h, bg, ink, label, font, r) {
  ctx.fillStyle = bg; rr(ctx, x, y, w, h, r); ctx.fill();
  drawIcon(ctx, "minus", x + 12, y + h / 2 - 11, 22, ink, 2.2);
  drawIcon(ctx, "plus", x + w - 34, y + h / 2 - 11, 22, ink, 2.2);
  ctx.fillStyle = ink; ctx.font = `500 16px ${font}`; ctx.textAlign = "center"; ctx.fillText(label, x + w / 2, y + h / 2 + 6); ctx.textAlign = "left";
}

function spark(ctx, x, y, w, h, col) {
  ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const v = 0.35 + 0.45 * Math.abs(Math.sin(i * 0.7 + 0.3)) * (0.6 + 0.4 * Math.sin(i * 0.23));
    const px = x + (w * i) / 24, py = y + h - v * h;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
  ctx.fillStyle = hexA(col, 0.12); ctx.fill();
}

function clipText(ctx, t, x, y, maxW) {
  t = String(t || "");
  if (!t) return;
  if (ctx.measureText(t).width <= maxW) { ctx.fillText(t, x, y); return; }
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  ctx.fillText(t + "…", x, y);
}

function hexA(hex, a) {
  const n = parseInt(String(hex).replace("#", "").slice(0, 6), 16) || 0;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function darker(hex) {
  const n = parseInt(String(hex).replace("#", "").slice(0, 6), 16) || 0;
  const f = 0.62;
  return `rgb(${Math.round(((n >> 16) & 255) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
}

export function cardKindsFor(id) {
  const it = BY_ID[id];
  if (!it) return [];
  const k = [];
  if (it.caps.includes("light") || it.caps.includes("relay")) k.push("light");
  if (it.caps.includes("camera")) k.push("camera");
  if (it.caps.includes("trv") || it.caps.includes("thermostat") || it.caps.includes("temp")) k.push("climate");
  if (it.caps.includes("lock")) k.push("lock");
  if (it.caps.includes("energy") || it.caps.includes("energyPer")) k.push("energy");
  if (it.caps.includes("speaker")) k.push("media");
  if (["leak", "smoke", "contact", "motion", "presence"].some((c) => it.caps.includes(c))) k.push("sensor");
  return [...new Set(k)];
}

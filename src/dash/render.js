// Instalator: tablet dashboard renderer in three real styles (Home Assistant, Apple Home, Google Home) for the TV texture and the phone designer.

import { BY_ID } from "../shared/catalog.js";
import { drawIcon } from "../shared/icons.js";

export const COLS = 4, ROWS = 3;

const KIND_ICON = { light: "bulb", camera: "cam", climate: "temp", energy: "energy", lock: "lock", scene: "scene", network: "net", media: "media", sensor: "sensor" };
export const KIND_LABEL = { light: "Światło", camera: "Kamera", climate: "Ogrzewanie", energy: "Prąd", lock: "Zamek", scene: "Scena", network: "Sieć", media: "Muzyka", sensor: "Czujnik" };

const STYLE = {
  ha: { name: "Home Assistant", bg: "#fafafa", font: "Roboto, 'Helvetica Neue', Arial, sans-serif", card: "#ffffff", line: "#e3e3e3", text: "#212121", sub: "#727272", r: 12, on: { light: "#ff9800", climate: "#ff8100", lock: "#43a047", camera: "#03a9f4", energy: "#03a9f4", scene: "#03a9f4", network: "#03a9f4", media: "#03a9f4", sensor: "#03a9f4" } },
  apple: { name: "Dom", font: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif", text: "#111", sub: "#6b6b70", r: 22, on: { light: "#ffcc00", climate: "#ff9500", lock: "#34c759", camera: "#0a84ff", energy: "#34c759", scene: "#ff9500", network: "#0a84ff", media: "#ff2d55", sensor: "#0a84ff" } },
  google: { name: "Google Home", bg: "#f3f6fc", font: "'Google Sans', 'Product Sans', Roboto, Arial, sans-serif", card: "#e5ebf4", text: "#1b1c1e", sub: "#5f6368", r: 24, on: { light: "#f9dcb8", climate: "#ffd7c2", lock: "#c6ecd0", camera: "#d3e3fd", energy: "#d3e3fd", scene: "#e9ddff", network: "#d3e3fd", media: "#ffd8e4", sensor: "#d3e3fd" } }
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

export function gridRect(w, h, platform) {
  const top = platform === "ha" ? 104 : platform === "apple" ? 150 : 128;
  const left = platform === "google" ? 104 : 32;
  const pad = 24, gap = platform === "apple" ? 18 : 16;
  const gw = w - left - pad, gh = h - top - pad;
  const cw = (gw - gap * (COLS - 1)) / COLS, ch = (gh - gap * (ROWS - 1)) / ROWS;
  return { x: left, y: top, cw, ch, gap, w: gw, h: gh };
}

export function cardRect(g, c) {
  return { x: g.x + c.x * (g.cw + g.gap), y: g.y + c.y * (g.ch + g.gap), w: c.w * g.cw + (c.w - 1) * g.gap, h: c.h * g.ch + (c.h - 1) * g.gap };
}

function devOf(snap, uid) { return uid ? snap.devs.find((d) => d.uid === uid) : null; }

function roomName(data, id) {
  const r = data?.rooms?.find((x) => x.id === id);
  return r ? r.name[0].toUpperCase() + r.name.slice(1) : id === "outdoor" ? "Na zewnątrz" : "";
}

export function cardInfo(snap, data, c) {
  const d = devOf(snap, c.dev);
  const it = d ? BY_ID[d.id] : null;
  const st = d && snap.der ? snap.der.dev[d.uid] : null;
  const live = !!(st && st.pw && st.net);
  let title = c.title || (d ? roomName(data, d.room) || it?.name : KIND_LABEL[c.kind]);
  let state = "", on = false;
  switch (c.kind) {
    case "light": on = live && d?.on !== false; state = !d ? "Wszystkie" : !live ? "Niedostępne" : on ? `${Math.round((d.bri ?? 0.85) * 100)}%` : "Wył."; break;
    case "climate": on = live; state = live ? `${(d?.temp ?? 21).toFixed(1).replace(".", ",")} °C` : "Niedostępne"; break;
    case "lock": on = live; state = live ? (d?.locked === false ? "Otwarte" : "Zamknięte") : "Niedostępne"; break;
    case "camera": on = live; state = live ? "Na żywo" : "Offline"; break;
    case "energy": on = true; state = `${(0.42 + (snap.devs.length % 7) * 0.13).toFixed(2).replace(".", ",")} kW`; title = c.title || "Zużycie prądu"; break;
    case "network": on = !!snap.der?.online; state = snap.der?.online ? `${snap.devs.filter((x) => snap.der.dev[x.uid]?.net).length} urządzeń` : "Brak internetu"; title = c.title || "Sieć UniFi"; break;
    case "scene": on = true; state = "Uruchom"; title = c.title || "Wieczór"; break;
    case "media": on = live; state = live ? "Gra muzyka" : "Niedostępne"; break;
    case "sensor": on = live; state = live ? (it?.caps.includes("leak") ? "Sucho" : it?.caps.includes("smoke") ? "OK" : it?.caps.includes("contact") ? "Zamknięte" : "Brak ruchu") : "Niedostępne"; break;
    default: break;
  }
  return { d, it, live, on, title, state, color: d?.color };
}

export function renderDash(ctx, w, h, snap, data, opts = {}) {
  const p = snap.tablet?.platform || "ha";
  const S = STYLE[p];
  const cards = opts.cards || snap.tablet?.dash?.cards || [];
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (p === "apple") {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#e9d9c4"); g.addColorStop(0.55, "#c9cfd6"); g.addColorStop(1, "#8fa7c2");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const r2 = ctx.createRadialGradient(w * 0.8, h * 0.1, 10, w * 0.8, h * 0.1, w * 0.6);
    r2.addColorStop(0, "rgba(255,240,215,0.7)"); r2.addColorStop(1, "rgba(255,240,215,0)");
    ctx.fillStyle = r2; ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = S.bg; ctx.fillRect(0, 0, w, h);
  }
  header(ctx, w, h, p, S, snap);
  const g = gridRect(w, h, p);
  if (opts.grid) {
    ctx.strokeStyle = p === "apple" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.09)";
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const r = cardRect(g, { x, y, w: 1, h: 1 }); rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, S.r); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  for (const c of cards) {
    const r = cardRect(g, c);
    drawCard(ctx, r, c, cardInfo(snap, data, c), p, S, opts);
  }
  if (!cards.length && !opts.grid) {
    ctx.fillStyle = S.sub;
    ctx.font = `500 26px ${S.font}`;
    ctx.textAlign = "center";
    ctx.fillText("Pulpit czeka na kafelki", w / 2, h / 2 + 20);
    ctx.textAlign = "left";
  }
  ctx.restore();
}

function header(ctx, w, h, p, S, snap) {
  const time = "18:24";
  if (p === "ha") {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, 64);
    ctx.fillStyle = "#e3e3e3"; ctx.fillRect(0, 64, w, 1);
    drawIcon(ctx, "home", 20, 18, 28, "#727272", 2);
    ctx.fillStyle = S.text; ctx.font = `400 26px ${S.font}`; ctx.fillText("Dom", 64, 42);
    const tabs = ["Przegląd", "Kamery", "Energia"];
    ctx.font = `500 17px ${S.font}`;
    let x = 200;
    tabs.forEach((t, i) => {
      ctx.fillStyle = i === 0 ? "#03a9f4" : S.sub;
      ctx.fillText(t.toUpperCase(), x, 40);
      const tw = ctx.measureText(t.toUpperCase()).width;
      if (i === 0) { ctx.fillRect(x - 8, 61, tw + 16, 3); }
      x += tw + 44;
    });
    ctx.fillStyle = S.text; ctx.font = `600 18px ${S.font}`; ctx.fillText("Salon i reszta domu", 32, 92);
  } else if (p === "apple") {
    ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.font = `600 17px ${S.font}`; ctx.fillText(time, 30, 30);
    ctx.font = `700 46px ${S.font}`; ctx.fillStyle = "#111"; ctx.fillText("Dom", 32, 92);
    const chips = [["temp", "Klimat"], ["bulb", "Światła"], ["lock", "Bezpieczeństwo"], ["cam", "Kamery"]];
    let x = 32;
    ctx.font = `600 16px ${S.font}`;
    for (const [ic, t] of chips) {
      const tw = ctx.measureText(t).width + 54;
      ctx.fillStyle = "rgba(255,255,255,0.62)"; rr(ctx, x, 106, tw, 34, 17); ctx.fill();
      drawIcon(ctx, ic, x + 12, 113, 20, "#222", 2);
      ctx.fillStyle = "#111"; ctx.fillText(t, x + 40, 129);
      x += tw + 10;
    }
  } else {
    ctx.fillStyle = "#e9eef6"; ctx.fillRect(0, 0, 84, h);
    ["home", "tablet", "scene", "sensor"].forEach((ic, i) => {
      if (i === 0) { ctx.fillStyle = "#c2e7ff"; rr(ctx, 14, 30 + i * 84, 56, 34, 17); ctx.fill(); }
      drawIcon(ctx, ic, 30, 35 + i * 84, 24, "#1b1c1e", 2);
    });
    ctx.fillStyle = S.text; ctx.font = `400 34px ${S.font}`; ctx.fillText("Dom", 104, 58);
    const tabs = ["Ulubione", "Urządzenia"];
    let x = 104;
    ctx.font = `500 16px ${S.font}`;
    tabs.forEach((t, i) => {
      const tw = ctx.measureText(t).width + 32;
      ctx.fillStyle = i === 0 ? "#c2e7ff" : "transparent";
      ctx.strokeStyle = "#c4c7c5";
      rr(ctx, x, 80, tw, 34, 9); if (i === 0) ctx.fill(); else ctx.stroke();
      ctx.fillStyle = S.text; ctx.fillText(t, x + 16, 102);
      x += tw + 10;
    });
  }
}

function drawCard(ctx, r, c, info, p, S, opts) {
  const camImg = opts.camImages?.[c.dev];
  ctx.save();
  if (c.kind === "camera") {
    rr(ctx, r.x, r.y, r.w, r.h, S.r);
    ctx.save(); ctx.clip();
    if (camImg) ctx.drawImage(camImg, r.x, r.y, r.w, r.h);
    else {
      const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      g.addColorStop(0, "#5d6b62"); g.addColorStop(0.6, "#7c8a6d"); g.addColorStop(1, "#4b4f45");
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      drawIcon(ctx, "cam", r.x + r.w / 2 - 22, r.y + r.h / 2 - 22, 44, "rgba(255,255,255,0.7)", 2);
    }
    const sh = ctx.createLinearGradient(0, r.y + r.h - 70, 0, r.y + r.h);
    sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = sh; ctx.fillRect(r.x, r.y + r.h - 70, r.w, 70);
    ctx.restore();
    ctx.fillStyle = "#fff"; ctx.font = `600 19px ${S.font}`; ctx.fillText(info.title, r.x + 16, r.y + r.h - 18);
    if (info.live) { ctx.fillStyle = p === "google" ? "#c2e7ff" : "#ff3b30"; rr(ctx, r.x + 14, r.y + 14, 86, 28, 14); ctx.fill(); ctx.fillStyle = p === "google" ? "#001d35" : "#fff"; ctx.font = `600 14px ${S.font}`; ctx.fillText(p === "ha" ? "NA ŻYWO" : "Na żywo", r.x + 26, r.y + 33); }
    ctx.restore();
    return;
  }
  const accent = S.on[c.kind] || "#03a9f4";
  if (p === "ha") {
    ctx.fillStyle = S.card; rr(ctx, r.x, r.y, r.w, r.h, S.r); ctx.fill();
    ctx.strokeStyle = S.line; ctx.lineWidth = 1; ctx.stroke();
    if (c.kind === "climate" && r.h > 160) { thermostat(ctx, r, info, S, accent); ctx.restore(); return; }
    const cx = r.x + 30, cy = r.y + 34;
    ctx.fillStyle = info.on ? hexA(accent, 0.2) : "#f0f0f0";
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
    drawIcon(ctx, KIND_ICON[c.kind] || "box", cx - 13, cy - 13, 26, info.on ? (c.kind === "light" && info.color ? info.color : accent) : "#8a8a8a", 2);
    ctx.fillStyle = S.text; ctx.font = `500 19px ${S.font}`; clipText(ctx, info.title, r.x + 64, r.y + 31, r.w - 80);
    ctx.fillStyle = S.sub; ctx.font = `400 16px ${S.font}`; clipText(ctx, info.state, r.x + 64, r.y + 54, r.w - 80);
    if (c.kind === "energy" && r.h > 110) bars(ctx, r, accent);
  } else if (p === "apple") {
    ctx.fillStyle = info.on ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.42)";
    rr(ctx, r.x, r.y, r.w, r.h, S.r); ctx.fill();
    const cx = r.x + 34, cy = r.y + 36;
    ctx.fillStyle = info.on ? accent : "rgba(120,120,128,0.35)";
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
    drawIcon(ctx, KIND_ICON[c.kind] || "box", cx - 12, cy - 12, 24, info.on ? "#fff" : "#3a3a3c", 2.2);
    ctx.fillStyle = "#111"; ctx.font = `600 19px ${S.font}`; clipText(ctx, info.title, r.x + 18, r.y + r.h - 40, r.w - 30);
    ctx.fillStyle = info.on ? "#3a3a3c" : "#5a5a60"; ctx.font = `500 16px ${S.font}`; clipText(ctx, info.state, r.x + 18, r.y + r.h - 18, r.w - 30);
    if (c.kind === "climate" && r.h > 160) { ctx.fillStyle = "#111"; ctx.font = `300 64px ${S.font}`; ctx.fillText(info.state.split(" ")[0], r.x + 18, r.y + r.h - 70); }
  } else {
    ctx.fillStyle = info.on ? accent : S.card;
    rr(ctx, r.x, r.y, r.w, r.h, S.r); ctx.fill();
    const cx = r.x + 34, cy = r.y + r.h / 2;
    drawIcon(ctx, KIND_ICON[c.kind] || "box", cx - 14, (r.h > 120 ? r.y + 34 : cy) - 14, 28, "#1b1c1e", 2);
    const tx = r.h > 120 ? r.x + 20 : r.x + 70;
    const ty = r.h > 120 ? r.y + r.h - 44 : cy - 4;
    ctx.fillStyle = S.text; ctx.font = `500 19px ${S.font}`; clipText(ctx, info.title, tx, ty, r.w - (tx - r.x) - 16);
    ctx.fillStyle = S.sub; ctx.font = `400 16px ${S.font}`; clipText(ctx, info.state, tx, ty + 22, r.w - (tx - r.x) - 16);
    if (c.kind === "climate" && r.h > 160) { ctx.fillStyle = S.text; ctx.font = `400 56px ${S.font}`; ctx.fillText(info.state.split(" ")[0] + "°", r.x + 20, r.y + r.h / 2 + 10); }
  }
  if (opts.selected === c.id) { ctx.strokeStyle = "#f3cf45"; ctx.lineWidth = 5; rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, S.r + 3); ctx.stroke(); }
  ctx.restore();
}

function thermostat(ctx, r, info, S, accent) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 8, rad = Math.min(r.w, r.h) * 0.32;
  ctx.lineCap = "round";
  ctx.lineWidth = 14; ctx.strokeStyle = "#eeeeee";
  ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
  ctx.strokeStyle = info.on ? accent : "#bdbdbd";
  ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI * 0.75, Math.PI * 1.7); ctx.stroke();
  ctx.fillStyle = S.text; ctx.textAlign = "center";
  ctx.font = `400 44px ${S.font}`; ctx.fillText(info.state.split(" ")[0], cx, cy + 10);
  ctx.font = `400 16px ${S.font}`; ctx.fillStyle = S.sub; ctx.fillText(info.title, cx, r.y + 30);
  ctx.textAlign = "left";
}

function bars(ctx, r, accent) {
  const n = 12, bw = (r.w - 40) / n;
  for (let i = 0; i < n; i++) {
    const v = 0.25 + 0.6 * Math.abs(Math.sin(i * 1.7 + 0.4));
    ctx.fillStyle = hexA(accent, 0.75);
    ctx.fillRect(r.x + 20 + i * bw + 2, r.y + r.h - 16 - v * (r.h - 90), bw - 4, v * (r.h - 90));
  }
}

function clipText(ctx, t, x, y, maxW) {
  t = String(t || "");
  if (ctx.measureText(t).width <= maxW) { ctx.fillText(t, x, y); return; }
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  ctx.fillText(t + "…", x, y);
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function cardKindsFor(id) {
  const it = BY_ID[id];
  if (!it) return [];
  const k = [];
  if (it.caps.includes("light")) k.push("light");
  if (it.caps.includes("camera")) k.push("camera");
  if (it.caps.includes("trv") || it.caps.includes("thermostat") || it.caps.includes("temp")) k.push("climate");
  if (it.caps.includes("lock")) k.push("lock");
  if (it.caps.includes("energy") || it.caps.includes("energyPer")) k.push("energy");
  if (it.caps.includes("speaker")) k.push("media");
  if (["leak", "smoke", "contact", "motion", "presence"].some((c) => it.caps.includes(c))) k.push("sensor");
  if (it.caps.includes("relay")) k.push("light");
  return k;
}

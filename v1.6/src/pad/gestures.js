// Instalator: physical micro-interactions on the phone — screw in, drill, peel, run a strip, spirit level, aim a camera, magnet snap.

import { el, $, haptic, esc } from "./ui.js";
import { drawIcon } from "../shared/icons.js";

const TXT = {
  screw: ["Wkręć!", "Kręć palcem w kółko, jak przy wkręcaniu."],
  drill: ["Wierć", "Przytrzymaj wiertarkę, aż przejdzie przez ścianę."],
  peel: ["Odklej folię", "Przeciągnij od prawej do lewej, żeby zdjąć taśmę klejącą."],
  strip: ["Przyklej taśmę", "Prowadź palcem od kropki do kropki."],
  level: ["Wypoziomuj", "Przechyl telefon albo przesuń bąbelek na środek i przytrzymaj."],
  aim: ["Ustaw kamerę", "Obracaj palcem wokół kamery. Telewizor pokazuje, co widzi."],
  snap: ["Przyłóż tablet", "Przeciągnij tablet do uchwytu. Magnes zrobi resztę."]
};

let orientationAsked = false;
export async function askOrientation() {
  if (orientationAsked) return;
  orientationAsked = true;
  try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission(); } catch (e) {}
}

export function runGesture(kind, opts = {}) {
  return new Promise((resolve) => {
    const [title, sub] = TXT[kind] || ["Montaż", ""];
    const o = el(`<div class="gest"><div class="gt"><b>${esc(opts.title || title)}</b><span>${esc(opts.sub || sub)}</span></div><div class="area"><canvas></canvas></div><div class="gb"><button class="btn w cancel">Anuluj</button>${kind === "aim" ? `<button class="btn y done">Gotowe</button>` : ""}</div></div>`);
    document.getElementById("app").appendChild(o);
    const cv = $("canvas", o), area = $(".area", o);
    const ctx = cv.getContext("2d");
    const dpr = Math.min(2, devicePixelRatio || 1);
    let W = 0, H = 0;
    const size = () => { const r = area.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    let done = false, p = 0, alive = true;
    const st = { a: null, acc: 0, hold: false, holdT: 0, peel: 0, drag: null, bub: { x: 0, y: 0 }, lvT: 0, aim: opts.aim0 ?? -Math.PI / 2, snap: { y: 0 }, lastTick: 0 };
    const finish = (ok) => {
      if (!alive) return;
      alive = false;
      window.removeEventListener("deviceorientation", onOri);
      if (ok) { haptic(true); setTimeout(() => o.remove(), 260); } else o.remove();
      resolve(ok ? { ok: true, aim: st.aim } : { ok: false });
    };
    $(".cancel", o).onclick = () => finish(false);
    if ($(".done", o)) $(".done", o).onclick = () => finish(true);
    const onOri = (e) => {
      if (kind === "level" && e.gamma != null) { st.bub.x = Math.max(-1, Math.min(1, e.gamma / 18)); st.bub.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); st.gyro = true; }
      if (kind === "aim" && e.alpha != null && opts.gyroAim) { st.aim = -((e.alpha * Math.PI) / 180); if (opts.onAim) opts.onAim(st.aim); }
    };
    window.addEventListener("deviceorientation", onOri);
    const cx = () => W / 2, cy = () => H * 0.46;
    cv.addEventListener("pointerdown", (e) => {
      cv.setPointerCapture(e.pointerId);
      const x = e.offsetX, y = e.offsetY;
      st.drag = { x, y, x0: x, y0: y };
      if (kind === "drill") st.hold = true;
      if (kind === "screw" || kind === "aim") st.a = Math.atan2(y - cy(), x - cx());
    });
    cv.addEventListener("pointermove", (e) => {
      if (!st.drag) return;
      const x = e.offsetX, y = e.offsetY;
      if (kind === "screw") {
        const a = Math.atan2(y - cy(), x - cx());
        let d = a - st.a;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        st.a = a;
        st.acc += Math.abs(d);
        p = Math.min(1, st.acc / (Math.PI * 4));
        if (st.acc - st.lastTick > Math.PI / 4) { st.lastTick = st.acc; haptic(); if (opts.onTick) opts.onTick(p); }
        if (p >= 1) finish(true);
      } else if (kind === "peel") {
        const dx = Math.max(0, st.drag.x0 - x);
        st.peel = Math.min(1, dx / (W * 0.6));
        p = st.peel;
        if (Math.floor(p * 8) > st.lastTick) { st.lastTick = Math.floor(p * 8); haptic(); }
        if (p >= 1) finish(true);
      } else if (kind === "strip") {
        const x0 = W * 0.12, x1 = W * 0.88;
        const prog = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
        if (prog > p && prog - p < 0.25 && Math.abs(y - cy()) < 70) { p = prog; if (Math.floor(p * 10) > st.lastTick) { st.lastTick = Math.floor(p * 10); haptic(); } }
        if (p >= 0.98) finish(true);
      } else if (kind === "level" && !st.gyro) {
        st.bub.x = Math.max(-1, Math.min(1, (x - cx()) / (W * 0.38)));
        st.bub.y = 0;
      } else if (kind === "aim") {
        st.aim = Math.atan2(y - cy(), x - cx());
        if (opts.onAim) opts.onAim(st.aim);
      } else if (kind === "snap") {
        st.snap.y = Math.max(0, Math.min(1, (y - st.drag.y0) / (H * 0.32)));
        if (st.snap.y > 0.92) { p = 1; finish(true); }
      }
    });
    const up = () => { st.drag = null; st.hold = false; if (kind === "snap" && p < 1) st.snap.y = 0; };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    let last = performance.now();
    const loop = (now) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (kind === "drill" && st.hold) {
        st.holdT += dt;
        p = Math.min(1, st.holdT / 1.4);
        if (Math.floor(st.holdT * 12) > st.lastTick) { st.lastTick = Math.floor(st.holdT * 12); haptic(); }
        if (p >= 1) finish(true);
      }
      if (kind === "level") {
        const c = Math.hypot(st.bub.x, st.bub.y) < 0.12;
        st.lvT = c ? st.lvT + dt : 0;
        p = Math.min(1, st.lvT / 0.8);
        if (c && Math.floor(st.lvT * 6) > st.lastTick) { st.lastTick = Math.floor(st.lvT * 6); haptic(); }
        if (!c) st.lastTick = 0;
        if (p >= 1) finish(true);
      }
      draw(ctx, kind, W, H, cx(), cy(), p, st, opts, now / 1000);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}

function ring(ctx, x, y, r, p, col = "#f3cf45") {
  ctx.lineWidth = 10; ctx.lineCap = "round";
  ctx.strokeStyle = "#2a2f33"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
}

function draw(ctx, kind, W, H, cx, cy, p, st, opts, t) {
  ctx.clearRect(0, 0, W, H);
  const R = Math.min(W, H) * 0.34;
  if (kind === "screw") {
    ring(ctx, cx, cy, R, p);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(st.acc);
    ctx.fillStyle = "#f5f2eb"; ctx.beginPath(); ctx.arc(0, 0, R * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#c9c3b6"; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(Math.cos(i) * R * 0.15, Math.sin(i) * R * 0.15); ctx.lineTo(Math.cos(i) * R * 0.5, Math.sin(i) * R * 0.5); ctx.stroke(); }
    ctx.restore();
    drawIcon(ctx, opts.icon || "bulb", cx - 22, cy - 22, 44, "#16191b", 2.2);
    hint(ctx, W, H, `${Math.round(p * 100)}%`);
  } else if (kind === "drill") {
    ring(ctx, cx, cy, R, p);
    ctx.fillStyle = st.hold ? "#f3cf45" : "#f5f2eb";
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.62, 0, Math.PI * 2); ctx.fill();
    const j = st.hold ? Math.sin(t * 90) * 2 : 0;
    drawIcon(ctx, "drill", cx - 34 + j, cy - 34, 68, "#16191b", 2);
    hint(ctx, W, H, st.hold ? "Wiercę…" : "Przytrzymaj");
  } else if (kind === "peel") {
    const w = W * 0.62, h = w * 0.62, x = cx - w / 2, y = cy - h / 2;
    ctx.fillStyle = "#f5f2eb"; rrect(ctx, x, y, w, h, 14); ctx.fill();
    drawIcon(ctx, opts.icon || "sensor", cx - 26, cy - 26, 52, "#16191b", 2);
    const pw = w * (1 - st.peel);
    ctx.fillStyle = "rgba(243,207,69,0.92)"; rrect(ctx, x + w - pw, y, pw, h, 14); ctx.fill();
    ctx.fillStyle = "#16191b"; ctx.font = "700 13px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
    if (pw > 60) ctx.fillText("← CIĄGNIJ", x + w - pw / 2, cy + 5);
    ctx.textAlign = "left";
  } else if (kind === "strip") {
    const x0 = W * 0.12, x1 = W * 0.88;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#2a2f33"; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.stroke();
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    ["#ff5c5c", "#ffb547", "#f3e85b", "#5fe08a", "#4ac7ff", "#8d6bff", "#ff5ec8"].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
    ctx.strokeStyle = g; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x0 + (x1 - x0) * p, cy); ctx.stroke();
    ctx.fillStyle = "#f3cf45"; ctx.beginPath(); ctx.arc(x0, cy, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#f5f2eb"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x1, cy, 14, 0, Math.PI * 2); ctx.stroke();
    hint(ctx, W, H, `${Math.round(p * 100)}%`);
  } else if (kind === "level") {
    const w = W * 0.82, h = 70, x = cx - w / 2, y = cy - h / 2;
    ctx.fillStyle = "#2a2f33"; rrect(ctx, x - 10, y - 10, w + 20, h + 20, 24); ctx.fill();
    ctx.fillStyle = "#b9d77a"; rrect(ctx, x, y, w, h, 18); ctx.fill();
    ctx.strokeStyle = "#16191b"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 34, y + 6); ctx.lineTo(cx - 34, y + h - 6); ctx.moveTo(cx + 34, y + 6); ctx.lineTo(cx + 34, y + h - 6); ctx.stroke();
    const bx = cx + st.bub.x * (w / 2 - 34), by = cy + st.bub.y * (h / 2 - 22);
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.ellipse(bx, by, 26, 20, 0, 0, Math.PI * 2); ctx.fill();
    ring(ctx, cx, cy + 130, 30, p, "#3e9b5f");
    hint(ctx, W, H, p > 0 ? "Trzymaj…" : st.gyro ? "Przechyl telefon" : "Przesuń bąbelek");
  } else if (kind === "aim") {
    const r = R * 1.15;
    ctx.fillStyle = "#1f2427"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#2f3539"; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.arc(cx, cy, (r * i) / 4, 0, Math.PI * 2); ctx.stroke(); }
    const half = ((opts.fov || 100) * Math.PI) / 360;
    ctx.fillStyle = "rgba(242,193,78,0.45)";
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, st.aim - half, st.aim + half); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f5f2eb"; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
    drawIcon(ctx, "cam", cx - 12, cy - 12, 24, "#16191b", 2);
    if (opts.targets) for (const tg of opts.targets) {
      const tx = cx + Math.cos(tg.a) * Math.min(r - 14, tg.d * (r / (opts.range || 12))), ty = cy + Math.sin(tg.a) * Math.min(r - 14, tg.d * (r / (opts.range || 12)));
      let da = Math.abs(((tg.a - st.aim + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      const seen = da < half && tg.d <= (opts.range || 12);
      ctx.fillStyle = seen ? "#3e9b5f" : "#80868b"; ctx.beginPath(); ctx.arc(tx, ty, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f5f2eb"; ctx.font = "700 11px 'IBM Plex Mono', monospace"; ctx.textAlign = "center"; ctx.fillText(tg.label.toUpperCase(), tx, ty - 14); ctx.textAlign = "left";
    }
  } else if (kind === "snap") {
    const mw = W * 0.5, mh = mw * 0.18;
    ctx.fillStyle = "#3a3f43"; rrect(ctx, cx - mw / 2, cy + H * 0.2, mw, mh, 8); ctx.fill();
    ctx.fillStyle = "#f3cf45"; ctx.font = "700 11px 'IBM Plex Mono', monospace"; ctx.textAlign = "center"; ctx.fillText("UCHWYT", cx, cy + H * 0.2 + mh / 2 + 4); ctx.textAlign = "left";
    const tw = W * 0.6, th = tw * 0.7;
    const ty = cy - H * 0.22 + st.snap.y * H * 0.32;
    ctx.fillStyle = "#101214"; rrect(ctx, cx - tw / 2, ty - th / 2, tw, th, 14); ctx.fill();
    ctx.fillStyle = "#e9eef6"; rrect(ctx, cx - tw / 2 + 8, ty - th / 2 + 8, tw - 16, th - 16, 8); ctx.fill();
    drawIcon(ctx, "home", cx - 18, ty - 18, 36, "#3f7fd6", 2);
    hint(ctx, W, H, "W dół ↓");
  }
}

function hint(ctx, W, H, t) {
  ctx.fillStyle = "#aeb4b8"; ctx.font = "600 15px 'IBM Plex Mono', monospace"; ctx.textAlign = "center";
  ctx.fillText(t, W / 2, H * 0.88);
  ctx.textAlign = "left";
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

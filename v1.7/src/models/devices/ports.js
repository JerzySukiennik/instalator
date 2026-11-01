// Instalator device models: shared port, slot and label helpers (RJ45/SFP holes with recessed cups, front-panel print, UniFi screens).
import * as THREE from 'three';
import { polyPts, rrPts } from './kit.js';
import { COL, labelMat, displayMat, roundRect, drawULogo } from './mat.js';

export function rectPts(cx, cy, w, h) {
  return polyPts([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]]);
}

export function rj45Pts(cx, cy, up = true, s = 1) {
  const w = 0.0116 * s, h = 0.0074 * s, nw = 0.0062 * s, nh = 0.0024 * s, H = h + nh;
  const yb = -H / 2;
  const raw = [[-w / 2, yb], [w / 2, yb], [w / 2, yb + h], [nw / 2, yb + h], [nw / 2, yb + H], [-nw / 2, yb + H], [-nw / 2, yb + h], [-w / 2, yb + h]];
  return polyPts(raw.map(([x, y]) => [cx + x, cy + (up ? y : -y)]));
}

export function cupGeo(pts, depth) {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth, bevelEnabled: false, curveSegments: 1, steps: 1 });
  g.translate(0, 0, -depth);
  const p = g.attributes.position.array;
  const out = [];
  for (let i = 0; i < p.length; i += 9) {
    if (Math.abs(p[i + 2]) < 1e-7 && Math.abs(p[i + 5]) < 1e-7 && Math.abs(p[i + 8]) < 1e-7) continue;
    out.push(p[i], p[i + 1], p[i + 2], p[i + 6], p[i + 7], p[i + 8], p[i + 3], p[i + 4], p[i + 5]);
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  return r;
}

export function dropFaces(geo, pred) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position.array;
  const out = [];
  for (let i = 0; i < p.length; i += 9) {
    const cx = (p[i] + p[i + 3] + p[i + 6]) / 3, cy = (p[i + 1] + p[i + 4] + p[i + 7]) / 3, cz = (p[i + 2] + p[i + 5] + p[i + 8]) / 3;
    if (!pred(cx, cy, cz)) out.push(...p.slice(i, i + 9));
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  return r;
}

export function openBox(w, h, d) {
  return dropFaces(new THREE.BoxGeometry(w, h, d), (x, y, z) => z > d / 2 - 1e-6);
}

export function cup(kit, pts, depth, z, wall, bottom, mat = 'matte') {
  kit.add(mat, wall, cupGeo(pts, depth).translate(0, 0, z), { face: (cx, cy, cz, nx, ny, nz) => (nz > 0.9 ? bottom : null) });
}

export function rj45(kit, x, y, z, o = {}) {
  const up = o.up ?? true;
  const pts = rj45Pts(x, y, up);
  cup(kit, pts, o.depth ?? 0.009, z, o.wall ?? COL.portWall, o.bottom ?? COL.portHole);
  const py = y + (up ? -1 : 1) * 0.0022;
  kit.quad(pinMat(), null, 0.0068, 0.0026, x, py, z - (o.depth ?? 0.009) + 0.0002);
  return pts;
}

export function sfp(kit, x, y, z, o = {}) {
  const w = o.w ?? 0.0142, h = o.h ?? 0.0098;
  const outer = rectPts(x, y, w, h);
  cup(kit, outer, 0.012, z, '#3b3e41', '#0d0e0f', 'metal');
  kit.box('metal', '#7d8186', x, y - h / 2 + 0.0012, z - 0.004, w - 0.002, 0.0008, 0.008);
  return outer;
}

export function pinMat() {
  return labelMat('rj45-pins', 64, 32, (ctx) => {
    ctx.clearRect(0, 0, 64, 32);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = '#d9b45a'; ctx.fillRect(2 + i * 7.7, 2, 4, 28); }
  }, { metal: 0.9, rough: 0.3 });
}

const PX = 5;

export function frontPrint(key, wm, hm, items, o = {}) {
  const W = Math.round(wm * 1000 * PX), H = Math.round(hm * 1000 * PX);
  return labelMat(key, W, H, (ctx) => {
    ctx.clearRect(0, 0, W, H);
    for (const it of items) {
      const x = it.x * 1000 * PX, y = H - it.y * 1000 * PX;
      if (it.rect) { ctx.fillStyle = it.color || '#9aa0a6'; roundRect(ctx, x, y - it.rect[1] * 1000 * PX, it.rect[0] * 1000 * PX, it.rect[1] * 1000 * PX, (it.r || 0.0004) * 1000 * PX); ctx.fill(); continue; }
      if (it.logo) { drawULogo(ctx, x, y, it.logo * 1000 * PX, it.color || '#8d939a'); continue; }
      if (it.dot) { ctx.fillStyle = it.color || '#333'; ctx.beginPath(); ctx.arc(x, y, it.dot * 1000 * PX, 0, Math.PI * 2); ctx.fill(); continue; }
      ctx.fillStyle = it.color || '#5c6168';
      ctx.font = `${it.weight || 500} ${(it.size || 0.0018) * 1000 * PX}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      ctx.textAlign = it.align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.t, x, y);
    }
  }, o);
}

export function printPlane(kit, mat, wm, hm, x0, y0, z) {
  kit.quad(mat, null, wm, hm, x0 + wm / 2, y0 + hm / 2, z);
}

export function uniScreen(kind, w = 256, h = 256) {
  const key = 'uniscreen-' + kind + w + 'x' + h;
  return displayMat(key, w, h, (ctx) => {
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.5, h * 0.55, 4, w * 0.5, h * 0.55, w * 0.7);
    g.addColorStop(0, '#0f1f3d');
    g.addColorStop(1, '#04060a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (kind === 'switch') {
      ctx.strokeStyle = '#2a3d5c'; ctx.lineWidth = w * 0.012;
      ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.12); ctx.lineTo(w * 0.5, h * 0.88); ctx.moveTo(w * 0.12, h * 0.5); ctx.lineTo(w * 0.88, h * 0.5); ctx.stroke();
      ctx.fillStyle = '#d9e4f2'; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, w * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9fb3cc'; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, w * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c7d3e3'; ctx.fillRect(w * 0.18, h * 0.16, w * 0.13, h * 0.11);
      ctx.fillStyle = '#4a9cff'; ctx.fillRect(w * 0.7, h * 0.15, w * 0.04, h * 0.12); ctx.fillRect(w * 0.76, h * 0.19, w * 0.04, h * 0.08);
      ctx.strokeStyle = '#4a9cff'; ctx.lineWidth = w * 0.02;
      ctx.beginPath(); ctx.arc(w * 0.24, h * 0.76, w * 0.05, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#3f8cff'; ctx.beginPath(); ctx.arc(w * 0.76, h * 0.76, w * 0.05, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'gateway') {
      ctx.fillStyle = '#e6edf7'; ctx.font = `600 ${h * 0.09}px Helvetica, Arial`; ctx.textAlign = 'center'; ctx.fillText('Network', w * 0.5, h * 0.2);
      ctx.strokeStyle = '#d0dbea'; ctx.lineWidth = w * 0.025; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.52, w * 0.17, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#4a9cff'; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.52, w * 0.09, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i === 0 ? '#e6edf7' : '#3b4a60'; ctx.beginPath(); ctx.arc(w * (0.36 + i * 0.056), h * 0.86, w * 0.016, 0, Math.PI * 2); ctx.fill(); }
    } else if (kind === 'pill') {
      ctx.fillStyle = '#0b1a3a'; ctx.fillRect(0, 0, w, h);
      const gr = ctx.createLinearGradient(0, h * 0.5, 0, h);
      gr.addColorStop(0, 'rgba(60,140,255,0.0)'); gr.addColorStop(1, 'rgba(60,140,255,0.55)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let i = 0; i <= 20; i++) ctx.lineTo(w * i / 20, h * (0.72 - 0.16 * Math.sin(i * 0.9) * Math.cos(i * 0.37)));
      ctx.lineTo(w, h); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = `600 ${h * 0.2}px Helvetica, Arial`; ctx.textAlign = 'left';
      ctx.fillText('Clients', w * 0.2, h * 0.3); ctx.textAlign = 'right'; ctx.font = `700 ${h * 0.22}px Helvetica, Arial`; ctx.fillText('32', w * 0.88, h * 0.3);
      ctx.textAlign = 'left'; ctx.font = `700 ${h * 0.24}px Helvetica, Arial`; ctx.fillText('452', w * 0.12, h * 0.68); ctx.fillText('234', w * 0.58, h * 0.68);
      ctx.fillStyle = '#7fb6ff'; ctx.font = `600 ${h * 0.13}px Helvetica, Arial`; ctx.fillText('Mbps', w * 0.33, h * 0.7); ctx.fillText('Mbps', w * 0.79, h * 0.7);
    } else if (kind === 'pdu') {
      ctx.fillStyle = '#1d5bd8'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(w * (0.3 + (i % 2) * 0.4), h * (0.3 + Math.floor(i / 2) * 0.4), w * 0.08, 0, Math.PI * 2); ctx.fill(); }
    } else {
      ctx.fillStyle = '#e6edf7'; ctx.font = `600 ${h * 0.12}px Helvetica, Arial`; ctx.textAlign = 'center'; ctx.fillText(kind, w * 0.5, h * 0.55);
    }
  });
}

export function uLogoMat(color = '#bfc3c7', bg = null) {
  return labelMat('ulogo-' + color, 128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, 128, 128); }
    drawULogo(ctx, 58, 70, 70, color);
  });
}

export { rrPts };

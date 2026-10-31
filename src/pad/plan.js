// Instalator: 2D floor plan on the phone — rooms, walls, furniture, mounts, devices, Wi-Fi heat, camera cones, pan and pinch.

import { BY_ID } from "../shared/catalog.js";
import { polyBounds, polyCentroid } from "../shared/geom.js";
import { drawIcon } from "../shared/icons.js";

const ROOM_FILL = { bath: "#e2ebec", wc: "#e2ebec", kitchen: "#f1e8d9", hall: "#ece6db", tech: "#e2e0dc", garage: "#dcdad5", balcony: "#e4e8dc", terrace: "#e4e8dc", outdoor: "#cfdcbd" };

export function catIcon(id) {
  const it = BY_ID[id];
  if (!it) return "box";
  const c = it.caps;
  if (c.includes("ap")) return "wifi";
  if (c.includes("camera")) return "cam";
  if (c.includes("light")) return "bulb";
  if (c.includes("trv") || c.includes("thermostat") || c.includes("temp")) return "temp";
  if (c.includes("lock")) return "lock";
  if (c.includes("speaker")) return "speaker";
  if (c.includes("hub") || c.includes("controller:ha")) return "hub";
  if (c.includes("tablet") || c.includes("wallmount") || c.includes("stand")) return "tablet";
  if (it.where === "din") return "din";
  if (it.where === "rack" || c.includes("gateway") || c.includes("switch")) return "net";
  if (c.includes("ev") || c.includes("plug")) return "plug";
  if (["leak", "smoke", "contact", "motion"].some((k) => c.includes(k))) return "sensor";
  return "box";
}

export class Plan {
  constructor(host, data) {
    this.host = host;
    this.data = data;
    this.cv = document.createElement("canvas");
    host.appendChild(this.cv);
    this.ctx = this.cv.getContext("2d");
    this.floor = 0;
    this.focus = null;
    this.mounts = [];
    this.devs = [];
    this.der = null;
    this.heat = null;
    this.cones = [];
    this.ghost = null;
    this.zones = false;
    this.spots = null;
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.t = 0;
    this.listeners = {};
    this.pointers = new Map();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.bind();
    this.resize();
    const tick = () => { if (!this.cv.isConnected) return; this.t += 1 / 60; if (this.anim) this.draw(); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  on(ev, fn) { this.listeners[ev] = fn; return this; }
  emit(ev, a) { if (this.listeners[ev]) this.listeners[ev](a); }

  resize() {
    const r = this.host.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    this.W = r.width; this.H = r.height;
    this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.fit();
    this.draw();
  }

  fit() {
    const rooms = this.data.rooms.filter((r) => r.floor === this.floor && (this.focus ? r.id === this.focus : r.kind !== "outdoor" || this.zones));
    const polys = rooms.map((r) => r.poly);
    if (this.zones) for (const z of this.data.zones || []) polys.push([[z.pos[0] - 2, z.pos[2] - 2], [z.pos[0] + 2, z.pos[2] + 2]]);
    if (!polys.length) return;
    const b = polyBounds(polys);
    const pad = this.focus ? 1.2 : 0.8;
    this.cx = (b.x0 + b.x1) / 2; this.cz = (b.z0 + b.z1) / 2;
    this.s = Math.min((this.W - 24) / (b.x1 - b.x0 + pad * 2), (this.H - 24) / (b.z1 - b.z0 + pad * 2));
    this.zoom = 1; this.pan = { x: 0, y: 0 };
  }

  set(o) {
    let refit = false;
    for (const [k, v] of Object.entries(o)) {
      if ((k === "floor" || k === "focus" || k === "zones") && this[k] !== v) refit = true;
      this[k] = v;
    }
    if (refit) this.fit();
    this.anim = !!(this.mounts.length || this.ghost || this.pulse);
    this.draw();
  }

  S(x, z) {
    const s = this.s * this.zoom;
    return [(x - this.cx) * s + this.W / 2 + this.pan.x, (z - this.cz) * s + this.H / 2 + this.pan.y];
  }

  Wd(px, py) {
    const s = this.s * this.zoom;
    return [(px - this.W / 2 - this.pan.x) / s + this.cx, (py - this.H / 2 - this.pan.y) / s + this.cz];
  }

  bind() {
    const c = this.cv;
    let down = null, moved = false, pinch0 = null, dragGhost = false;
    c.addEventListener("pointerdown", (e) => {
      c.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, [e.offsetX, e.offsetY]);
      moved = false;
      down = [e.offsetX, e.offsetY, this.pan.x, this.pan.y];
      dragGhost = false;
      if (this.ghost && this.pointers.size === 1) {
        const [gx, gy] = this.S(this.ghost.x, this.ghost.z);
        if (Math.hypot(gx - e.offsetX, gy - e.offsetY) < 54) dragGhost = true;
      }
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: this.zoom };
      }
    });
    c.addEventListener("pointermove", (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, [e.offsetX, e.offsetY]);
      if (this.pointers.size === 2 && pinch0) {
        const [a, b] = [...this.pointers.values()];
        this.zoom = Math.max(0.6, Math.min(4, pinch0.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0.d));
        moved = true;
        this.draw();
        return;
      }
      if (!down) return;
      const dx = e.offsetX - down[0], dy = e.offsetY - down[1];
      if (Math.hypot(dx, dy) > 6) moved = true;
      if (dragGhost) {
        const [x, z] = this.Wd(e.offsetX, e.offsetY - 30);
        this.ghost.x = x; this.ghost.z = z;
        this.emit("ghost", this.ghost);
        this.draw();
      } else if (moved && this.allowPan !== false) {
        this.pan.x = down[2] + dx; this.pan.y = down[3] + dy;
        this.draw();
      }
    });
    const up = (e) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) pinch0 = null;
      if (!down) return;
      if (dragGhost) { this.emit("ghostDrop", this.ghost); dragGhost = false; down = null; return; }
      if (!moved) this.tap(e.offsetX, e.offsetY);
      down = null;
    };
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", up);
  }

  tap(px, py) {
    const [x, z] = this.Wd(px, py);
    let best = null, bd = 30;
    for (const m of this.mounts) {
      const [sx, sy] = this.S(m.pos[0], m.pos[2]);
      const d = Math.hypot(sx - px, sy - py);
      if (d < bd) { bd = d; best = m; }
    }
    if (best) { this.emit("mount", best); return; }
    if (this.spots) for (const sp of this.spots) {
      const [sx, sy] = this.S(sp.pos[0], sp.pos[2]);
      if (Math.hypot(sx - px, sy - py) < 30) { this.emit("spot", sp); return; }
    }
    let dbest = null; bd = 26;
    for (const d of this.devs) {
      if (!d.pos || (d.floor ?? 0) !== this.floor || d.place === "rack" || d.place === "shelf" || d.place === "din" || d.place === "fixed") continue;
      const [sx, sy] = this.S(d.pos[0], d.pos[2]);
      const dd = Math.hypot(sx - px, sy - py);
      if (dd < bd) { bd = dd; dbest = d; }
    }
    if (dbest) { this.emit("device", dbest); return; }
    this.emit("tap", { x, z, floor: this.floor });
  }

  draw() {
    const g = this.ctx, d = this.data, s = this.s * this.zoom;
    if (!s) return;
    g.clearRect(0, 0, this.W, this.H);
    g.fillStyle = "#e0dbd0";
    g.fillRect(0, 0, this.W, this.H);
    const rooms = d.rooms.filter((r) => r.floor === this.floor);
    if (this.zones) {
      g.fillStyle = "#cfdcbd";
      g.fillRect(0, 0, this.W, this.H);
    }
    for (const r of rooms) {
      g.beginPath();
      r.poly.forEach(([x, z], i) => { const [a, b] = this.S(x, z); i ? g.lineTo(a, b) : g.moveTo(a, b); });
      g.closePath();
      const dim = this.focus && r.id !== this.focus;
      g.fillStyle = dim ? "#d5cfc4" : ROOM_FILL[r.kind] || "#f6f2ea";
      g.fill();
    }
    if (this.heat) this.drawHeat(this.heat);
    g.fillStyle = "rgba(120,110,95,0.22)";
    g.strokeStyle = "rgba(90,80,70,0.35)";
    g.lineWidth = 1;
    for (const f of d.furniture || []) {
      if ((f.floor ?? 0) !== this.floor) continue;
      const w = f.size[0] * s, h = f.size[2] * s;
      const [cx, cy] = this.S(f.pos[0], f.pos[2]);
      g.save(); g.translate(cx, cy); g.rotate(-(f.rot || 0));
      g.beginPath(); if (g.roundRect) g.roundRect(-w / 2, -h / 2, w, h, Math.min(6, w / 4, h / 4)); else g.rect(-w / 2, -h / 2, w, h);
      g.fill(); g.stroke(); g.restore();
    }
    this.drawWalls();
    g.font = "600 10px 'IBM Plex Mono', monospace";
    g.textAlign = "center";
    for (const r of rooms) {
      if (r.kind === "outdoor") continue;
      const [cx, cz] = polyCentroid(r.poly);
      const [a, b] = this.S(cx, cz);
      g.fillStyle = this.focus && r.id !== this.focus ? "rgba(0,0,0,0.25)" : "rgba(22,25,27,0.55)";
      g.fillText(r.name.toUpperCase(), a, b);
    }
    g.textAlign = "left";
    if (this.zones) for (const z of d.zones || []) {
      const [a, b] = this.S(z.pos[0], z.pos[2]);
      g.setLineDash([5, 4]); g.strokeStyle = "rgba(22,25,27,0.45)"; g.lineWidth = 1.5;
      g.beginPath(); g.arc(a, b, (z.r || 2) * s, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.fillStyle = "rgba(22,25,27,0.6)"; g.font = "700 10px 'IBM Plex Mono', monospace"; g.textAlign = "center";
      g.fillText(({ entrance: "WEJŚCIE", driveway: "PODJAZD", garden: "OGRÓD", terrace: "TARAS", jetty: "POMOST", gate: "BRAMA", garage: "GARAŻ", street: "ULICA" }[z.kind] || z.kind).toUpperCase(), a, b + 3);
      g.textAlign = "left";
    }
    for (const c of this.cones) this.drawCone(c);
    if (this.spots) for (const sp of this.spots) {
      if ((sp.floor ?? 0) !== this.floor) continue;
      const [a, b] = this.S(sp.pos[0], sp.pos[2]);
      const col = sp.rating === "good" ? "#3e9b5f" : sp.rating === "ok" ? "#d6912b" : "#80868b";
      g.fillStyle = col; g.beginPath(); g.arc(a, b, 15, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 3; g.stroke();
      drawIcon(g, "tablet", a - 9, b - 9, 18, "#fff", 2.2);
    }
    for (const dv of this.devs) this.drawDevice(dv);
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 5);
    for (const m of this.mounts) {
      if ((m.floor ?? 0) !== this.floor) continue;
      const [a, b] = this.S(m.pos[0], m.pos[2]);
      g.fillStyle = `rgba(243,207,69,${0.35 + pulse * 0.3})`;
      g.beginPath(); g.arc(a, b, 13 + pulse * 3, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#16191b"; g.beginPath(); g.arc(a, b, 5.5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#f3cf45"; g.lineWidth = 2.5; g.stroke();
    }
    if (this.ghost && (this.ghost.floor ?? 0) === this.floor) {
      const [a, b] = this.S(this.ghost.x, this.ghost.z);
      g.fillStyle = "rgba(22,25,27,0.85)"; g.beginPath(); g.arc(a, b, 22, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#f3cf45"; g.lineWidth = 3; g.stroke();
      drawIcon(g, catIcon(this.ghost.id), a - 12, b - 12, 24, "#f3cf45", 2.2);
      if (this.ghost.snap) { const [sa, sb] = this.S(this.ghost.snap.pos[0], this.ghost.snap.pos[2]); g.setLineDash([3, 3]); g.strokeStyle = "#16191b"; g.beginPath(); g.moveTo(a, b); g.lineTo(sa, sb); g.stroke(); g.setLineDash([]); }
    }
  }

  drawWalls() {
    const g = this.ctx, s = this.s * this.zoom;
    for (const w of this.data.walls) {
      if (w.floor !== this.floor) continue;
      const [ax, ay] = this.S(w.a[0], w.a[1]), [bx, by] = this.S(w.b[0], w.b[1]);
      const lw = Math.max(2.5, (w.thick || 0.15) * s);
      const ops = (w.openings || []).slice().sort((p, q) => p.t0 - q.t0);
      let t = 0;
      const seg = (t0, t1, style) => {
        const x0 = ax + (bx - ax) * t0, y0 = ay + (by - ay) * t0, x1 = ax + (bx - ax) * t1, y1 = ay + (by - ay) * t1;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1);
        if (style === "wall") { g.strokeStyle = w.exterior ? "#22272b" : "#3b4146"; g.lineWidth = lw; g.lineCap = "butt"; g.stroke(); }
        else if (style === "window") { g.strokeStyle = "#8fb8d8"; g.lineWidth = Math.max(2, lw * 0.45); g.stroke(); }
        else if (style === "glass") { g.strokeStyle = "#9cc6e4"; g.lineWidth = Math.max(2, lw * 0.6); g.stroke(); }
        else if (style === "door") {
          const len = Math.hypot(x1 - x0, y1 - y0);
          const ang = Math.atan2(y1 - y0, x1 - x0);
          g.strokeStyle = "rgba(59,65,70,0.6)"; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(ang - Math.PI / 2) * len, y0 + Math.sin(ang - Math.PI / 2) * len); g.stroke();
          g.beginPath(); g.arc(x0, y0, len, ang - Math.PI / 2, ang); g.stroke();
        }
      };
      for (const o of ops) { seg(t, o.t0, "wall"); seg(o.t0, o.t1, o.kind); t = o.t1; }
      seg(t, 1, "wall");
    }
  }

  drawHeat(h) {
    const g = this.ctx, s = this.s * this.zoom;
    const cw = h.cell * s + 0.6;
    for (let j = 0; j < h.nz; j++) for (let i = 0; i < h.nx; i++) {
      const v = h.v[j * h.nx + i];
      if (v < 0) continue;
      const [a, b] = this.S(h.x0 + i * h.cell, h.z0 + j * h.cell);
      g.fillStyle = v >= 0.42 ? "rgba(62,175,98,0.55)" : v >= 0.28 ? "rgba(128,196,84,0.5)" : v >= 0.18 ? "rgba(222,196,72,0.5)" : v > 0.05 ? "rgba(222,150,70,0.38)" : "rgba(110,110,110,0.25)";
      g.fillRect(a, b, cw, cw);
    }
  }

  drawCone(c) {
    if ((c.floor ?? 0) !== this.floor) return;
    const g = this.ctx, s = this.s * this.zoom;
    const [a, b] = this.S(c.pos[0], c.pos[2]);
    const ang = Math.atan2(c.dir[2], c.dir[0]);
    const half = (c.fov * Math.PI) / 360;
    g.fillStyle = c.live ? "rgba(242,193,78,0.35)" : "rgba(242,193,78,0.22)";
    g.beginPath(); g.moveTo(a, b); g.arc(a, b, c.range * s, ang - half, ang + half); g.closePath(); g.fill();
  }

  drawDevice(dv) {
    if (!dv.pos || (dv.floor ?? 0) !== this.floor || ["rack", "shelf", "din", "fixed"].includes(dv.place)) return;
    const g = this.ctx;
    const [a, b] = this.S(dv.pos[0], dv.pos[2]);
    const st = this.der?.dev[dv.uid];
    const ring = !st ? "#80868b" : st.pw && st.net ? (dv.paired || !BY_ID[dv.id]?.hubs ? "#3e9b5f" : "#3f7fd6") : st.pw ? "#d6912b" : "#80868b";
    g.fillStyle = "#fffdf9"; g.beginPath(); g.arc(a, b, 13, 0, Math.PI * 2); g.fill();
    g.strokeStyle = ring; g.lineWidth = 3; g.stroke();
    drawIcon(g, catIcon(dv.id), a - 8, b - 8, 16, "#16191b", 2);
  }
}

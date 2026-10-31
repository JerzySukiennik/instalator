// Instalator: TV sound — real recorded effects from assets/sfx (manifest-driven), loops for ambience, silent when missing.

const MAXD = { stamp: 0.55, bulb_screw: 1.1, peel_sticker: 0.8, rack_screw: 1.0, screwdriver: 0.9, cable_zip: 1.1, box_open: 0.9, payment: 0.6, car_arrive: 5, footsteps_wood: 3.6, doorbell_chime: 2.6, drill_short: 1.1, servo_whirr: 1.2, fan_hum: 2 };
const GAP = 0.14;

const GAIN = { house_door_close: 4, screwdriver: 3, stamp: 3, relay_click: 2.6, footsteps_wood: 2.4, spark: 2.4, peel_sticker: 2.4, pen_tick: 2, din_snap: 1.8, rj45_in: 1.6, rj45_out: 1.6, breaker_on: 1.5, breaker_off: 1.5, bulb_screw: 1.6 };

export class Audio {
  constructor() {
    this.ctx = null;
    this.buf = new Map();
    this.loops = new Map();
    this.man = {};
    this.vol = 0.9;
    this.ready = this.init();
  }

  async init() {
    try {
      const r = await fetch("assets/sfx/manifest.json", { cache: "no-store" });
      if (r.ok) this.man = await r.json();
    } catch (e) {}
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.vol;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  async load(name) {
    if (this.buf.has(name)) return this.buf.get(name);
    const e = this.man[name];
    if (!e || !this.ctx) return null;
    const p = fetch(`assets/sfx/${e.file}`).then((r) => r.arrayBuffer()).then((a) => this.ctx.decodeAudioData(a)).catch(() => null);
    this.buf.set(name, p);
    return p;
  }

  async play(name, { vol = 1, rate = 1, delay = 0, max = null } = {}) {
    await this.ready;
    if (!this.ctx || this.ctx.state !== "running") return;
    const b = await this.load(name);
    if (!b) return;
    const now = this.ctx.currentTime, at = now + delay;
    this.last = this.last || {};
    this.live = this.live || {};
    if (this.last[name] != null && Math.abs(at - this.last[name]) < GAP) return;
    if ((this.live[name] || 0) >= 2) return;
    this.last[name] = at;
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    src.playbackRate.value = rate * (0.97 + Math.random() * 0.06);
    const g = this.ctx.createGain();
    const v = vol * (GAIN[name] || 1);
    const dur = Math.min(b.duration, max ?? MAXD[name] ?? 1.6);
    g.gain.setValueAtTime(v, at);
    if (dur < b.duration) { g.gain.setValueAtTime(v, at + Math.max(0, dur - 0.12)); g.gain.linearRampToValueAtTime(0.0001, at + dur); }
    src.connect(g).connect(this.master);
    this.live[name] = (this.live[name] || 0) + 1;
    src.onended = () => { this.live[name] = Math.max(0, (this.live[name] || 1) - 1); };
    src.start(at);
    src.stop(at + dur + 0.02);
  }

  async loop(name, vol = 0.3) {
    await this.ready;
    if (!this.ctx || this.loops.has(name)) return;
    const b = await this.load(name);
    if (!b) return;
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    src.loop = true;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 2);
    src.connect(g).connect(this.master);
    src.start();
    this.loops.set(name, { src, g });
  }

  stopLoop(name) {
    const l = this.loops.get(name);
    if (!l || !this.ctx) return;
    l.g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.2);
    setTimeout(() => { try { l.src.stop(); } catch (e) {} }, 1400);
    this.loops.delete(name);
  }

  stopAllLoops() {
    for (const k of [...this.loops.keys()]) this.stopLoop(k);
  }
}

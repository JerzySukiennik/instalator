// Instalator: TV sound — real recorded effects from assets/sfx (manifest-driven), loops for ambience, silent when missing.

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

  async play(name, { vol = 1, rate = 1, delay = 0 } = {}) {
    await this.ready;
    if (!this.ctx || this.ctx.state !== "running") return;
    const b = await this.load(name);
    if (!b) return;
    const src = this.ctx.createBufferSource();
    src.buffer = b;
    src.playbackRate.value = rate * (0.96 + Math.random() * 0.08);
    const g = this.ctx.createGain();
    g.gain.value = vol * (GAIN[name] || 1);
    src.connect(g).connect(this.master);
    src.start(this.ctx.currentTime + delay);
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

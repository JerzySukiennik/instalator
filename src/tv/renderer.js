// Instalator: TV renderer — Rybna Wyspa look (AgX, soft sun shadows, hemisphere, fog, light bloom) with day/dusk/night.

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const MODES = {
  day: { sky: "#a9c4d8", hor: "#dfe3dc", hemiSky: "#e9f0f5", hemiGround: "#8a8467", hemi: 1.05, sun: "#fff1dc", sunI: 2.7, elev: 48, az: 35, exp: 1.12, fog: [70, 260], bloom: 0.22 },
  afternoon: { sky: "#a4bccf", hor: "#eadfcb", hemiSky: "#e7ebef", hemiGround: "#8a7c62", hemi: 0.92, sun: "#ffe0b2", sunI: 2.35, elev: 26, az: 228, exp: 1.12, fog: [70, 260], bloom: 0.3 },
  dusk: { sky: "#7f8db3", hor: "#f0b48a", hemiSky: "#c5c9e2", hemiGround: "#6b5a4c", hemi: 0.55, sun: "#ffb27a", sunI: 1.5, elev: 9, az: 250, exp: 1.18, fog: [60, 220], bloom: 0.42 },
  night: { sky: "#1a2338", hor: "#2d3a55", hemiSky: "#4b5b86", hemiGround: "#1c1a20", hemi: 0.28, sun: "#a9bde6", sunI: 0.32, elev: 38, az: 140, exp: 1.25, fog: [50, 190], bloom: 0.6 }
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.AgXToneMapping;
    r.toneMappingExposure = 1.12;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.localClippingEnabled = true;
    this.renderer = r;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.1, 600);
    this.camera.position.set(14, 12, 16);
    this.hemi = new THREE.HemisphereLight("#e9f0f5", "#8a8467", 1.05);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#fff1dc", 2.7);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.00035;
    this.sun.shadow.normalBias = 0.025;
    this.sun.shadow.radius = 3;
    this.scene.add(this.sun, this.sun.target);
    this.scene.fog = new THREE.Fog("#dfe3dc", 70, 260);
    this.scene.background = new THREE.Color("#a9c4d8");
    const pm = new THREE.PMREMGenerator(r);
    this.envMap = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    this.mode = "day";
    this.modeK = { ...MODES.day, sky: new THREE.Color(MODES.day.sky), hor: new THREE.Color(MODES.day.hor), hemiSky: new THREE.Color(MODES.day.hemiSky), hemiGround: new THREE.Color(MODES.day.hemiGround), sun: new THREE.Color(MODES.day.sun) };
    this.focus = new THREE.Vector3();
    this.frame = 18;
    this.maxPx = 2.2e6;
    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(960, 540), 0.22, 0.55, 0.92);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.resize();
    addEventListener("resize", () => this.resize());
    this.setMode("day", true);
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    const pr = Math.min(devicePixelRatio || 1, Math.sqrt(this.maxPx / (w * h)));
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.bloom.setSize(Math.round(w * pr / 2), Math.round(h * pr / 2));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setMode(name, instant = false) {
    this.mode = name;
    this.target = MODES[name];
    if (instant) this.blend(1);
  }

  blend(k) {
    const t = this.target, m = this.modeK;
    m.sky.lerp(new THREE.Color(t.sky), k);
    m.hor.lerp(new THREE.Color(t.hor), k);
    m.hemiSky.lerp(new THREE.Color(t.hemiSky), k);
    m.hemiGround.lerp(new THREE.Color(t.hemiGround), k);
    m.sun.lerp(new THREE.Color(t.sun), k);
    for (const key of ["hemi", "sunI", "elev", "exp", "bloom"]) m[key] += (t[key] - m[key]) * k;
    let da = ((t.az - m.az + 540) % 360) - 180;
    m.az += da * k;
    m.fog = [m.fog[0] + (t.fog[0] - m.fog[0]) * k, m.fog[1] + (t.fog[1] - m.fog[1]) * k];
    this.scene.background.copy(m.sky);
    this.scene.fog.color.copy(m.hor).lerp(m.sky, 0.35);
    this.scene.fog.near = m.fog[0];
    this.scene.fog.far = m.fog[1];
    this.hemi.color.copy(m.hemiSky);
    this.hemi.groundColor.copy(m.hemiGround);
    this.hemi.intensity = m.hemi;
    this.sun.color.copy(m.sun);
    this.sun.intensity = m.sunI;
    this.renderer.toneMappingExposure = m.exp;
    this.bloom.strength = m.bloom;
  }

  nightness() {
    return Math.max(0, Math.min(1, (1.6 - this.modeK.sunI) / 1.3));
  }

  placeSun() {
    const m = this.modeK;
    const el = (m.elev * Math.PI) / 180, az = (m.az * Math.PI) / 180;
    const d = 40;
    this.sun.position.set(this.focus.x + Math.cos(el) * Math.sin(az) * d, this.focus.y + Math.sin(el) * d, this.focus.z + Math.cos(el) * Math.cos(az) * d);
    this.sun.target.position.copy(this.focus);
    const s = this.sun.shadow.camera, f = this.frame;
    s.left = -f; s.right = f; s.top = f; s.bottom = -f; s.near = 1; s.far = 100;
    s.updateProjectionMatrix();
  }

  render(dt) {
    this.blend(Math.min(1, dt * 0.9));
    this.placeSun();
    this.composer.render(dt);
  }
}

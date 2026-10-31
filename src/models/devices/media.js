// Instalator device models: hubs and media (Home Assistant Green and Connect ZBT-2, HomePod mini, Apple TV 4K, Nest Hub, Google TV Streamer, Sonos Era 100 and Arc Ultra).
import * as THREE from 'three';
import { Kit, loftGeo, seLoop, rrLoop } from './kit.js';
import { CLEAR, labelMat, displayMat, canvasTex, lightMat, roundRect } from './mat.js';
import { topR, botR } from './unifi-desk.js';

function pattern(key, w, h, draw, rep) {
  const t = canvasTex(key, w, h, draw);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  return t;
}

const meshCache = new Map();
function patternMat(key, base, rough, draw, rep) {
  if (meshCache.has(key)) return meshCache.get(key);
  const m = new THREE.MeshStandardMaterial({ color: base, map: pattern(key, 64, 64, draw, rep), roughness: rough, metalness: 0, flatShading: true });
  m.name = 'dev-pattern';
  meshCache.set(key, m);
  return m;
}

const HA_COVER = new THREE.MeshStandardMaterial({ color: '#b9c4c9', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.34, depthWrite: false, flatShading: true });

function haGreen() {
  const kit = new Kit();
  const W = 0.112;
  kit.loft('satin', '#151617', 0, 0, 0, W, W, 0.012, 4, [[0.003, 0], [0.001, 0.0012], [0, 0.003], [0, 0.0125]], { face: (cx, cy, cz, nx, ny, nz) => (Math.abs(ny) < 0.5 && Math.floor((Math.abs(nx) > 0.5 ? cz : cx) / 0.0042) % 2 ? '#0a0a0b' : null) });
  kit.box('matte', '#1f3a2c', 0, 0.0135, 0, W - 0.012, 0.0016, W - 0.012);
  for (const [x, z, w, d, c] of [[-0.018, -0.012, 0.022, 0.022, '#1a1a1b'], [0.022, 0.016, 0.014, 0.01, '#232325'], [0.03, -0.028, 0.012, 0.012, '#1a1a1b'], [-0.03, 0.026, 0.018, 0.006, '#e9e9e7'], [-0.042, -0.04, 0.008, 0.008, '#c9a23a']]) kit.box('satin', c, x, 0.0152, z, w, 0.0018, d);
  for (const x of [-0.03, -0.012, 0.008, 0.028]) kit.box('metal', '#b9bcbf', x, 0.019, -W / 2 + 0.008, 0.013, 0.008, 0.014);
  const cover = loftGeo([[0, 0], [0, 0.0175], [0.0012, 0.0192], [0.003, 0.02]].map(([k, y]) => ({ y: 0.0125 + y, pts: rrLoop(W - 2 * k, W - 2 * k, 0.012 - k, 4) })));
  kit.add(HA_COVER, null, cover);
  kit.led('#33d17a', 'status', (m) => kit.cyl(m, null, 0.044, 0.0168, 0.044, 0.0011, 0.0006, { seg: 8 }), { intensity: 2 });
  const logo = labelMat('ha-logo', 128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 9; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(24, 104); ctx.lineTo(24, 58); ctx.lineTo(64, 20); ctx.lineTo(104, 58); ctx.lineTo(104, 104); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(64, 104); ctx.lineTo(64, 58); ctx.moveTo(64, 80); ctx.lineTo(82, 64); ctx.moveTo(64, 72); ctx.lineTo(46, 56); ctx.stroke();
    for (const [x, y] of [[64, 54], [86, 60], [42, 52]]) { ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke(); }
  });
  kit.quad(logo, null, 0.026, 0.026, 0, 0.0161, 0.004, { rx: -Math.PI / 2 });
  kit.port('lan', 'rj45', 0.008, 0.019, -W / 2);
  kit.port('power', 'power', 0.028, 0.019, -W / 2);
  return kit.build();
}

function zbt2() {
  const kit = new Kit();
  kit.loft('satin', '#f4f4f2', 0, 0, 0, 0.052, 0.052, 0.012, 4, [[0.002, 0], [0, 0.002], [0, 0.017], ...topR(0.021, 0.004, 3)]);
  kit.box('matte', '#2d2e30', 0, 0.0105, -0.0262, 0.009, 0.0035, 0.002, { r: 0.0012, seg: 2 });
  kit.lathe('satin', '#ececea', 0, 0.021, 0, [[0.0105, 0], [0.0095, 0.004], [0.0074, 0.006]], { seg: 20 });
  kit.cyl('satin', '#f1f1ef', 0, 0.021 + 0.006 + 0.032, 0, 0.0068, 0.064, { seg: 20 });
  kit.light('#c95cff', 'lamp', [0, 0.115, 0], (m) => kit.lathe(m, null, 0, 0, 0, [[0.0068, 0.091], [0.0068, 0.131], [0.0058, 0.1345], [0, 0.1355]], { seg: 20 }), { on: true, base: '#efe9f4', intensity: 1.6 });
  kit.ud.leds = [];
  kit.port('usb', 'power', 0, 0.01, -0.026);
  return kit.build();
}

function homepodMini() {
  const kit = new Kit();
  const R = 0.049, Hh = 0.0843, cy = Hh / 2 + 0.0004;
  const prof = [];
  const a0 = Math.asin(-(cy - 0.0016) / R), a1 = Math.asin((Hh - cy - 0.0016) / R);
  for (let i = 0; i <= 12; i++) { const a = a0 + (a1 - a0) * (i / 12); prof.push([Math.cos(a) * R, cy + Math.sin(a) * R]); }
  const mesh = patternMat('homepod-mesh', '#e9e9e7', 0.95, (ctx) => {
    ctx.fillStyle = '#efefed'; ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#a9aaab'; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(64, 64); ctx.moveTo(64, 0); ctx.lineTo(0, 64); ctx.stroke();
  }, [56, 14]);
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 36);
  kit.add(mesh, null, g);
  const rTop = prof[prof.length - 1][0], rBot = prof[0][0];
  kit.lathe('satin', '#d9d9d7', 0, 0, 0, [[0, 0], [rBot - 0.002, 0], [rBot, 0.0016]], { seg: 24 });
  kit.lathe('gloss', '#f2f2f2', 0, 0, 0, [[rTop, Hh - 0.0016], [rTop - 0.003, Hh - 0.0003], [0.026, Hh], [0.024, Hh]], { seg: 32 });
  const glow = new THREE.MeshStandardMaterial({ color: '#f4f4f6', roughness: 0.2, emissive: '#ffffff', emissiveIntensity: 1.3, emissiveMap: canvasTex('siri-glow', 128, 128, (ctx) => {
    const gr = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, '#202020'); gr.addColorStop(0.45, '#6a3cff'); gr.addColorStop(0.7, '#ff5fc8'); gr.addColorStop(0.86, '#45c8ff'); gr.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128);
  }), flatShading: true });
  glow.name = 'dev-light';
  const cg = new THREE.CircleGeometry(0.024, 32).rotateX(-Math.PI / 2).translate(0, Hh + 0.0001, 0);
  const cm = new THREE.Mesh(cg, glow);
  kit.extra.push(cm);
  kit.leds.push({ material: glow, role: 'glow', color: '#6a3cff' });
  return kit.build();
}

function appleLogo(color) {
  return labelMat('apple-logo-' + color, 128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(64, 44); ctx.bezierCurveTo(52, 34, 26, 38, 26, 68); ctx.bezierCurveTo(26, 92, 44, 114, 54, 114); ctx.bezierCurveTo(60, 114, 60, 110, 64, 110); ctx.bezierCurveTo(68, 110, 70, 114, 76, 114); ctx.bezierCurveTo(88, 114, 102, 92, 104, 80);
    ctx.bezierCurveTo(92, 74, 90, 56, 100, 48); ctx.bezierCurveTo(92, 36, 74, 36, 64, 44); ctx.fill();
    ctx.beginPath(); ctx.moveTo(64, 38); ctx.bezierCurveTo(64, 26, 72, 16, 84, 14); ctx.bezierCurveTo(84, 26, 76, 36, 64, 38); ctx.fill();
  }, { rough: 0.15 });
}

function appleTv() {
  const kit = new Kit();
  const W = 0.093, H = 0.031;
  kit.loft('satin', '#17171a', 0, 0, 0, W, W, 0.019, 5, [[0.003, 0], [0.0012, 0.0008], [0, 0.0026], [0, H - 0.0018], ...topR(H, 0.0018, 2)]);
  kit.loft('gloss', '#0b0b0d', 0, H - 0.0002, 0, W - 0.0036, W - 0.0036, 0.0172, 5, [[0, 0], [0.0006, 0.0003]]);
  kit.quad(appleLogo('#2a2a2e'), null, 0.026, 0.026, 0, H + 0.0002, 0, { rx: -Math.PI / 2 });
  kit.led('#ffffff', 'status', (m) => kit.box(m, null, 0, 0.012, W / 2 + 0.0001, 0.0014, 0.0008, 0.0003), { intensity: 0.8 });
  kit.port('lan', 'rj45', 0.01, 0.014, -W / 2);
  kit.port('power', 'power', -0.02, 0.014, -W / 2);
  return kit.build();
}

function nestScreen() {
  return displayMat('nest-hub-screen', 512, 300, (ctx, w, h) => {
    ctx.fillStyle = '#f5f6f8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5f6368'; ctx.font = '500 20px "Google Sans", Helvetica, Arial'; ctx.fillText('7:30 · Tue, Oct 9', 26, 40);
    ctx.fillStyle = '#202124'; ctx.font = '400 96px "Google Sans", Helvetica, Arial'; ctx.fillText('18°', 26, 150);
    ctx.fillStyle = '#5f6368'; ctx.font = '400 18px Helvetica, Arial'; ctx.fillText('Pogodnie', 166, 104);
    ['WT', 'ŚR', 'CZ'].forEach((d, i) => { ctx.fillStyle = '#5f6368'; ctx.font = '500 16px Helvetica, Arial'; ctx.fillText(d, 30 + i * 80, 214); ctx.fillStyle = '#fbbc04'; ctx.beginPath(); ctx.arc(42 + i * 80, 238, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3c4043'; ctx.fillText('19°', 30 + i * 80, 274); });
    ctx.fillStyle = '#ffffff'; roundRect(ctx, 290, 30, 196, 240, 14); ctx.fill();
    ctx.fillStyle = '#202124'; ctx.font = '500 18px Helvetica, Arial'; ctx.fillText('Dojazd', 310, 64);
    ctx.fillStyle = '#188038'; ctx.font = '500 20px Helvetica, Arial'; ctx.fillText('20 min', 310, 96);
    ctx.fillStyle = '#e8eaed'; ctx.fillRect(306, 118, 164, 130);
    ctx.strokeStyle = '#4285f4'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(320, 230); ctx.lineTo(360, 190); ctx.lineTo(400, 200); ctx.lineTo(450, 140); ctx.stroke();
  });
}

function nestHub() {
  const kit = new Kit();
  const fab = patternMat('nest-fabric', '#ffffff', 1, (ctx) => {
    ctx.fillStyle = '#e6e4e0'; ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 64; i += 4) for (let j = 0; j < 64; j += 4) { ctx.fillStyle = (i + j) % 8 ? '#d9d6d1' : '#efedea'; ctx.fillRect(i, j, 2, 2); }
  }, [18, 6]);
  const base = loftGeo([[0.008, 0], [0.002, 0.004], [0, 0.012], [0, 0.034], [0.008, 0.05], [0.02, 0.058]].map(([k, y]) => ({ y, pts: rrLoop(0.15 - 2 * k, 0.056 - 2 * k, 0.026 - k, 5) })));
  const uv = new Float32Array(base.attributes.position.count * 2);
  const p = base.attributes.position.array;
  for (let i = 0; i < uv.length / 2; i++) { uv[i * 2] = p[i * 3] * 8 + p[i * 3 + 2] * 3; uv[i * 2 + 1] = p[i * 3 + 1] * 12; }
  base.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  kit.add(fab, null, base.translate(0, 0, -0.012));
  kit.push(0, 0.022, 0.026, -0.27, 0, 0);
  kit.box('satin', '#f4f4f2', 0, 0.059, 0, 0.1774, 0.118, 0.0085, { r: 0.012, seg: 4 });
  kit.box('satin', '#ececea', 0, 0.06, 0.0044, 0.1774 - 0.01, 0.118 - 0.012, 0.0004, { r: 0.008, seg: 3 });
  kit.display(nestScreen(), 0.152, 0.089, 0, 0.06, 0.0048, { r: 0.004 });
  kit.box('glass', '#3a3b3f', 0.012, 0.113, 0.0047, 0.0026, 0.0026, 0.0003, { r: 0.0012, seg: 2 });
  kit.pop();
  kit.box('satin', '#efefed', 0.05, 0.059, -0.02, 0.012, 0.0028, 0.006, { r: 0.0012, seg: 2, axis: 'y' });
  kit.port('power', 'power', 0, 0.012, -0.036);
  return kit.build();
}

function tvStreamer() {
  const kit = new Kit();
  const W = 0.162, D = 0.091;
  const prof = [[0.006, 0], [0.002, 0.0012], [0, 0.0045], [0, 0.013], [0.0035, 0.0205], [0.0105, 0.0245], [0.02, 0.0258]];
  const g = loftGeo(prof.map(([k, y]) => ({ y, pts: seLoop(W - 2 * k, D - 2 * k, 2.6, 56) })));
  const p = g.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) { const t = (p[i] / W + 0.5); p[i + 1] *= 0.55 + 0.45 * Math.min(1, Math.max(0, 1.15 - t)); }
  g.rotateY(0);
  kit.add('satin', '#ece6dc', g);
  kit.led('#ffffff', 'status', (m) => kit.cyl(m, null, 0.072, 0.008, 0.012, 0.0009, 0.0004, { seg: 8 }), { intensity: 0.7 });
  kit.port('hdmi', 'rj45', -W / 2, 0.012, 0);
  return kit.build();
}

function era100() {
  const kit = new Kit();
  const W = 0.12, D = 0.1305, H = 0.1825;
  const grille = patternMat('sonos-grille-black', '#1b1b1d', 0.85, (ctx) => {
    ctx.fillStyle = '#1d1d1f'; ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#0c0c0d';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(8 + i * 16 + (j % 2) * 8, 8 + j * 16, 4, 0, Math.PI * 2); ctx.fill(); }
  }, [60, 46]);
  const body = loftGeo([[0.004, 0], [0.0012, 0.0012], [0, 0.0045], [0, H - 0.008]].map(([k, y]) => ({ y, pts: seLoop(W - 2 * k, D - 2 * k, 3.1, 52) })));
  const uv = new Float32Array(body.attributes.position.count * 2);
  const P = body.attributes.position.array;
  for (let i = 0; i < uv.length / 2; i++) { uv[i * 2] = (Math.atan2(P[i * 3 + 2], P[i * 3]) / (Math.PI * 2) + 0.5); uv[i * 2 + 1] = P[i * 3 + 1] / H; }
  body.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  kit.add(grille, null, body);
  kit.add('satin', '#202022', loftGeo([[0, H - 0.008], [0, H - 0.003], [0.0025, H - 0.0006], [0.005, H]].map(([k, y]) => ({ y, pts: seLoop(W - 2 * k, D - 2 * k, 3.1, 52) }))));
  kit.box('matte', '#0c0c0d', 0, H + 0.0001, 0.006, 0.05, 0.0006, 0.0055, { r: 0.0027, seg: 3, axis: 'y' });
  for (const x of [-0.034, 0.034]) kit.cyl('matte', '#3a3a3d', x, H + 0.0002, 0.006, 0.0016, 0.0004, { seg: 8 });
  kit.cyl('matte', '#3a3a3d', 0, H + 0.0002, -0.026, 0.0016, 0.0004, { seg: 8 });
  kit.led('#ffffff', 'status', (m) => kit.cyl(m, null, 0, H + 0.0002, 0.04, 0.0009, 0.0004, { seg: 8 }), { intensity: 1 });
  const logo = labelMat('sonos-word-dark', 256, 64, (ctx) => { ctx.clearRect(0, 0, 256, 64); ctx.fillStyle = '#4a4a4e'; ctx.font = '700 48px "Futura", "Avenir Next", Helvetica, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SONOS', 128, 34); });
  kit.quad(logo, null, 0.034, 0.0085, 0.044, H - 0.04, D / 2 * 0.86, { rz: -Math.PI / 2, ry: 0.55 });
  return kit.build();
}

function arcUltra() {
  const kit = new Kit();
  const W = 1.178, D = 0.11, H = 0.075;
  const grille = patternMat('sonos-grille-arc', '#1b1b1d', 0.85, (ctx) => {
    ctx.fillStyle = '#1d1d1f'; ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#0b0b0c';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(8 + i * 16 + (j % 2) * 8, 8 + j * 16, 4.5, 0, Math.PI * 2); ctx.fill(); }
  }, [420, 40]);
  const prof = [];
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI / 2; prof.push([0.034 - 0.034 * Math.cos(a), 0.034 + 0.034 * Math.sin(a)]); }
  prof.push([0, H - 0.026]);
  for (let i = 1; i <= 5; i++) { const a = (i / 5) * Math.PI / 2; prof.push([0.024 - 0.024 * Math.cos(a), H - 0.024 + 0.024 * Math.sin(a)]); }
  const g = loftGeo(prof.map(([k, y]) => ({ y, pts: rrLoop(W - 2 * k, D - 2 * k, 0.05 - k, 6) })));
  const uv = new Float32Array(g.attributes.position.count * 2);
  const P = g.attributes.position.array;
  for (let i = 0; i < uv.length / 2; i++) { uv[i * 2] = P[i * 3] / W + 0.5; uv[i * 2 + 1] = (P[i * 3 + 1] + P[i * 3 + 2] * 0.6) / 0.16; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  kit.add(grille, null, g);
  kit.box('satin', '#202022', 0, H - 0.0002, -0.012, 0.18, 0.0006, 0.034, { r: 0.012, seg: 3, axis: 'y' });
  kit.box('matte', '#0d0d0e', 0, H + 0.0002, -0.012, 0.07, 0.0005, 0.005, { r: 0.0024, seg: 2, axis: 'y' });
  kit.led('#ffffff', 'status', (m) => kit.cyl(m, null, 0, 0.047, D / 2 + 0.0002, 0.0009, 0.0006, { axis: 'z', seg: 8 }), { intensity: 0.9 });
  return kit.build();
}

export const MEDIA = {
  'ha-green': { mount: 'surface', family: 'hub', name: 'Home Assistant Green', build: haGreen, view: { el: 30 } },
  'ha-zbt2': { mount: 'surface', family: 'hub', name: 'Home Assistant Connect ZBT-2', build: zbt2 },
  'homepod-mini': { mount: 'surface', family: 'hub', name: 'Apple HomePod mini', build: homepodMini },
  'apple-tv-4k': { mount: 'surface', family: 'hub', name: 'Apple TV 4K', build: appleTv, view: { el: 34 } },
  'nest-hub': { mount: 'surface', family: 'hub', name: 'Google Nest Hub', build: nestHub, view: { yaw: 18, el: 12 } },
  'google-tv-streamer': { mount: 'surface', family: 'hub', name: 'Google TV Streamer', build: tvStreamer, view: { el: 30 } },
  'sonos-era-100': { mount: 'surface', family: 'hub', name: 'Sonos Era 100', build: era100 },
  'sonos-arc-ultra': { mount: 'surface', family: 'hub', name: 'Sonos Arc Ultra', build: arcUltra, view: { yaw: 22, el: 16 } },
};

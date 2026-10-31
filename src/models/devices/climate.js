// Instalator device models: climate (tado X radiator thermostat, Bridge X, Wireless Thermostat X) and the Aqara temperature sensor.
import * as THREE from 'three';
import { Kit, circPts } from './kit.js';
import { labelMat, displayMat } from './mat.js';
import { topR, botR } from './unifi-desk.js';

const TADO = '#f5f5f3';

function knurl(n, a, b) {
  return (cx, cy, cz) => (Math.floor(((Math.atan2(cy, cx) + Math.PI) / (Math.PI * 2)) * n) % 2 ? a : b);
}

function trvScreen() {
  return displayMat('tado-trv-screen', 192, 192, (ctx, w, h) => {
    ctx.fillStyle = '#060708';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#f2a33a';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      for (let t = 0; t <= 12; t++) { const y = 30 + t * 1.6, x = w / 2 + k * 9 + Math.sin(t / 12 * Math.PI * 2) * 2.6; if (t) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '500 64px "Avenir Next", Helvetica, Arial';
    ctx.fillText('20.0', w / 2, 112);
    ctx.font = '500 24px "Avenir Next", Helvetica, Arial';
    ctx.fillStyle = '#d9dde2';
    ctx.fillText('19.5°', w / 2 + 8, 150);
    ctx.strokeStyle = '#d9dde2'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(w / 2 - 34, 132); ctx.lineTo(w / 2 - 34, 146); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2 - 34, 148, 3.4, 0, Math.PI * 2); ctx.stroke();
  });
}

function trvX() {
  const kit = new Kit();
  kit.cyl('metal', '#b8bbbe', 0, 0, 0.009, 0.0228, 0.018, { axis: 'z', seg: 60, face: knurl(60, '#7f8286', '#d2d5d7') });
  kit.lathe('satin', TADO, 0, 0, 0, [[0.0226, 0.0178], [0.0262, 0.0195], [0.0279, 0.0235], [0.028, 0.058]], { seg: 40, axis: 'z' });
  kit.lathe('satin', TADO, 0, 0, 0, [[0.028, 0.058], [0.028, 0.0765], [0.0271, 0.0798], [0.0247, 0.0812], [0.0216, 0.0812]], { seg: 96, axis: 'z', face: knurl(96, '#dededb', TADO) });
  kit.lathe('glass', '#07080a', 0, 0, 0, [[0.0216, 0.0808], [0.0212, 0.0812], [0, 0.0814]], { seg: 32, axis: 'z' });
  const g = new THREE.CircleGeometry(0.0182, 32);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i));
  kit.display(trvScreen(), 0.0364, 0.0364, 0, 0, 0.0817, {});
  kit.ud.display.mesh.geometry.dispose();
  kit.ud.display.mesh.geometry = g.translate(0, 0, 0.0817);
  kit.ud.display.round = true;
  return kit.build();
}

function bridgeX() {
  const kit = new Kit();
  const W = 0.06, D = 0.036;
  kit.cyl('satin', '#ecebe8', 0, 0, -0.001, 0.018, 0.002, { axis: 'z', seg: 24 });
  for (const x of [-0.0095, 0.0095]) kit.cyl('metal', '#c4c6c9', x, 0, -0.0095, 0.0024, 0.019, { axis: 'z', seg: 10 });
  kit.loft('satin', TADO, 0, 0, 0, W, W, 0.012, 4, [[0.003, 0], ...botR(0, 0.003, 2), [0, D - 0.007], ...topR(D, 0.007, 4)], { axis: 'z' });
  const pm = labelMat('tado-bridgex-front', 256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = '#9aa0a5'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(98, 34); ctx.arcTo(158, 34, 158, 74, 18); ctx.arcTo(158, 74, 98, 74, 18); ctx.arcTo(98, 74, 98, 34, 18); ctx.arcTo(98, 34, 158, 34, 18); ctx.stroke();
    ctx.fillStyle = '#7d8388'; ctx.font = '600 22px Helvetica, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('WPS', 128, 55);
    ctx.lineWidth = 4; ctx.strokeStyle = '#9aa0a5';
    for (const r of [8, 15, 22]) { ctx.beginPath(); ctx.arc(128, 118, r, -Math.PI * 0.78, -Math.PI * 0.22); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(128, 150, 13, -Math.PI * 0.3, Math.PI * 1.3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(128, 134); ctx.lineTo(128, 150); ctx.stroke();
    ctx.fillStyle = '#9aa0a5'; ctx.font = '500 34px "Avenir Next", Helvetica, Arial'; ctx.fillText('tado°', 128, 222);
  });
  kit.quad(pm, null, 0.05, 0.05, 0, 0, D + 0.0002);
  kit.led('#ffffff', 'status', (m) => { for (let i = 0; i < 3; i++) kit.cyl(m, null, 0.0045 + i * 0.0035, 0.0045, D + 0.0001, 0.0006, 0.0004, { axis: 'z', seg: 8 }); }, { intensity: 1.2 });
  return kit.build();
}

function thermoDigits() {
  const m = displayMat('tado-thermox-digits', 160, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const glyph = { 2: ['11111', '00001', '00001', '11111', '10000', '10000', '11111'], 0: ['11111', '10001', '10001', '10001', '10001', '10001', '11111'] };
    const draw = (g, ox) => g.forEach((row, r) => [...row].forEach((c, k) => { if (c === '1') { ctx.beginPath(); ctx.arc(ox + k * 6.5, 56 + r * 6.5, 2.3, 0, Math.PI * 2); ctx.fill(); } }));
    ctx.fillStyle = '#c9ccd0';
    draw(glyph[2], 44); draw(glyph[0], 86);
    ctx.fillStyle = '#d7dadd';
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(72 + i * 7, 32 + j * 4 + (i % 2) * 2, 1.5, 0, Math.PI * 2); ctx.fill(); }
  });
  m.transparent = true;
  return m;
}

function thermostatX() {
  const kit = new Kit();
  const W = 0.09, D = 0.022;
  kit.loft('satin', TADO, 0, 0, 0, W, W, 0.014, 4, [[0.0018, 0], ...botR(0, 0.0018, 2), [0, D - 0.0045], ...topR(D, 0.0045, 4)], { axis: 'z' });
  kit.box('metal', '#c7c9cb', W / 2 - 0.016, W / 2 - 0.0002, D - 0.006, 0.01, 0.0008, 0.0035);
  const pm = labelMat('tado-thermox-front', 256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(200,203,206,0.95)'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(128, 120, 84, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#b5b9bd'; ctx.font = '500 20px "Avenir Next", Helvetica, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('tado°', 128, 236);
  }, { rough: 0.3 });
  kit.quad(pm, null, 0.082, 0.082, 0, 0, D + 0.0002);
  kit.display(thermoDigits(), 0.04, 0.04, 0, 0.003, D + 0.00035);
  return kit.build();
}

function aqaraTemp() {
  const kit = new Kit();
  const W = 0.036, D = 0.0105;
  kit.loft('satin', '#f6f6f4', 0, 0, 0, W, W, 0.0075, 4, [[0.0008, 0], [0, 0.0008], [0, D - 0.0032], ...topR(D, 0.0032, 3)], { axis: 'z' });
  const pm = labelMat('aqara-temp-front', 128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    ctx.strokeStyle = '#a9adb1'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(64, 72, 9, -Math.PI * 0.32, Math.PI * 1.32); ctx.lineTo(58, 34); ctx.arc(64, 34, 6, Math.PI, 0); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#a9adb1'; ctx.beginPath(); ctx.arc(64, 72, 5, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 3; i++) ctx.fillRect(74, 38 + i * 9, 7, 3);
  });
  kit.quad(pm, null, 0.022, 0.022, 0, 0.002, D + 0.00015);
  kit.led('#3d8bff', 'status', (m) => kit.cyl(m, null, 0, -0.0125, D - 0.0002, 0.00045, 0.0005, { axis: 'z', seg: 6 }), { intensity: 0.8 });
  return kit.build();
}

export const CLIMATE = {
  'tado-trv-x': { mount: 'radiator', family: 'climate', name: 'tado° Smart Radiator Thermostat X', build: trvX, view: { yaw: -38, el: 16 } },
  'tado-bridge-x': { mount: 'wall', family: 'climate', name: 'tado° Bridge X', build: bridgeX },
  'tado-thermostat-x': { mount: 'wall', family: 'climate', name: 'tado° Wireless Smart Thermostat X', build: thermostatX, view: { yaw: 12, el: 8 } },
  'aqara-temp': { mount: 'wall', family: 'climate', name: 'Aqara Temperature and Humidity Sensor', build: aqaraTemp },
};

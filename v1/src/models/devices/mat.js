// Instalator device models: shared palette (vertex-coloured surface classes, colours, LED/light/display/label factories, env-map hook).
import * as THREE from 'three';

const surf = (o) => new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, flatShading: true, ...o });

export const SURF = {
  matte: surf({ roughness: 0.7, metalness: 0 }),
  satin: surf({ roughness: 0.44, metalness: 0 }),
  gloss: surf({ roughness: 0.16, metalness: 0 }),
  metal: surf({ roughness: 0.4, metalness: 0.7 }),
  chrome: surf({ roughness: 0.2, metalness: 0.92 }),
  glass: surf({ roughness: 0.06, metalness: 0.1 }),
  rubber: surf({ roughness: 0.94, metalness: 0 }),
  fabric: surf({ roughness: 1, metalness: 0 }),
};
for (const [k, m] of Object.entries(SURF)) m.name = 'dev-' + k;

export const CLEAR = {
  glass: new THREE.MeshStandardMaterial({ color: '#dfe8ec', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false, flatShading: true }),
  smoke: new THREE.MeshStandardMaterial({ color: '#3a4046', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.42, depthWrite: false, flatShading: true }),
  frost: new THREE.MeshStandardMaterial({ color: '#f4f6f6', roughness: 0.5, metalness: 0, transparent: true, opacity: 0.55, depthWrite: false, flatShading: true }),
};

const ENV = { satin: 0.3, gloss: 0.55, metal: 1.0, chrome: 1.15, glass: 0.9 };

export function setDeviceEnvMap(tex, scale = 1) {
  for (const [k, v] of Object.entries(ENV)) {
    SURF[k].envMap = tex;
    SURF[k].envMapIntensity = v * scale;
    SURF[k].needsUpdate = true;
  }
  for (const m of Object.values(CLEAR)) { m.envMap = tex; m.envMapIntensity = 1.2 * scale; m.needsUpdate = true; }
}

export const COL = {
  uniWhite: '#f3f3f1',
  uniWhite2: '#e9e9e6',
  uniShadow: '#c9cacb',
  uniSilver: '#c6c9cc',
  uniSilverDark: '#a9adb1',
  uniSlot: '#2b2e31',
  black: '#19191b',
  graphite: '#2c2d30',
  charcoal: '#3a3b3e',
  portHole: '#0b0b0c',
  portWall: '#2a2b2d',
  jackWhite: '#e8e6df',
  gold: '#c9a54a',
  steel: '#9a9ea3',
  dinWhite: '#efeee9',
  dinGrey: '#d6d8d4',
  hueWhite: '#f6f5f1',
  appleWhite: '#f4f4f2',
  appleBlack: '#141416',
  glassBlack: '#0a0b0d',
  lensBlue: '#1b2433',
  copper: '#b87333',
  brass: '#b59a52',
};

export function ledMat(color = '#ffffff', intensity = 2.2) {
  const c = new THREE.Color(color);
  const m = new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(0.35), emissive: c, emissiveIntensity: intensity, roughness: 0.35, metalness: 0, flatShading: true });
  m.name = 'dev-led';
  m.userData.on = intensity;
  return m;
}

export function lightMat(color = '#ffd8a6', on = false, base = '#f4f2ee', o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: base, emissive: new THREE.Color(color), emissiveIntensity: on ? (o.intensity ?? 2.4) : 0, roughness: o.roughness ?? 0.55, metalness: 0, flatShading: o.flat ?? true, transparent: !!o.transparent, opacity: o.opacity ?? 1 });
  m.name = 'dev-light';
  m.userData.on = o.intensity ?? 2.4;
  return m;
}

const texCache = new Map();

export function canvasTex(key, w, h, draw) {
  if (texCache.has(key)) return texCache.get(key);
  const cv = typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx = cv.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

const labelCache = new Map();

export function labelMat(key, w, h, draw, o = {}) {
  const k = key + '|' + (o.metal ? 1 : 0) + (o.rough ?? '');
  if (labelCache.has(k)) return labelCache.get(k);
  const m = new THREE.MeshStandardMaterial({ map: canvasTex(key, w, h, draw), transparent: true, depthWrite: false, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  m.name = 'dev-label';
  labelCache.set(k, m);
  return m;
}

export function displayMat(key, w, h, draw) {
  const m = new THREE.MeshBasicMaterial({ map: canvasTex(key, w, h, draw), color: 0xffffff });
  m.name = 'dev-display';
  return m;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawULogo(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.2;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy - s * 0.42);
  ctx.lineTo(cx - s * 0.3, cy + s * 0.05);
  ctx.arc(cx, cy + s * 0.05, s * 0.3, Math.PI, 0, true);
  ctx.lineTo(cx + s * 0.3, cy - s * 0.1);
  ctx.stroke();
  const d = s * 0.1;
  for (const [x, y] of [[0.3, -0.42], [0.47, -0.5], [0.47, -0.3], [0.62, -0.42]]) ctx.fillRect(cx + s * x - d / 2, cy + s * y - d / 2, d, d);
  ctx.restore();
}

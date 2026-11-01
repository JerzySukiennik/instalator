// Instalator device models: entry point (MODEL_IDS, MODEL_INFO, buildDevice, buildStrip) over the per-family modules.
import * as THREE from 'three';
import { Kit } from './devices/kit.js';
import { labelMat } from './devices/mat.js';
import { RACK } from './devices/unifi-rack.js';
import { DESK } from './devices/unifi-desk.js';
import { AP } from './devices/unifi-ap.js';
import { CAM } from './devices/unifi-cam.js';
import { RACKS } from './devices/racks.js';
import { DIN } from './devices/din.js';
import { LIGHT } from './devices/lighting.js';
import { STRIPS } from './devices/strips.js';
import { CLIMATE } from './devices/climate.js';
import { SENSORS } from './devices/sensors.js';
import { MEDIA } from './devices/media.js';
import { OTHER } from './devices/other.js';
import { TABLETS } from './devices/tablets.js';

export { setDeviceEnvMap } from './devices/mat.js';

const ORDER = [
  'ucg-ultra', 'ucg-max', 'udm-pro-max', 'usw-flex-mini', 'usw-lite-8-poe', 'usw-pro-max-16-poe', 'usw-pro-max-24-poe', 'u7-pro', 'u7-lite', 'u7-pro-wall', 'u7-outdoor', 'g5-bullet', 'g5-turret-ultra', 'g5-flex', 'g4-doorbell-pro', 'unvr', 'patch-panel-24', 'brush-panel', 'pdu-pro', 'ups-2u', 'rack-shelf', 'rack-9u', 'rack-12u', 'media-box', 'ont',
  'shelly-pro-4pm', 'shelly-pro-3em', 'shelly-pro-2pm', 'shelly-pro-dimmer-2pm', 'surge-t1t2', 'main-switch', 'rcd', 'mcb-b10', 'mcb-b16', 'mcb-c20', 'panel-enclosure',
  'hue-e27', 'hue-gu10', 'hue-bridge-pro', 'hue-play-gradient', 'hue-lightstrip-plus', 'hue-tap-dial', 'govee-strip-m1', 'govee-floor-lamp-2', 'ikea-kajplats-e27', 'ikea-dirigera',
  'tado-trv-x', 'tado-bridge-x', 'tado-thermostat-x', 'aqara-temp',
  'aqara-hub-m3', 'aqara-door-p2', 'aqara-motion-p2', 'aqara-fp2', 'aqara-leak', 'aqara-smoke', 'nuki-ultra', 'aqara-g5-pro',
  'ha-green', 'ha-zbt2', 'homepod-mini', 'apple-tv-4k', 'nest-hub', 'google-tv-streamer', 'sonos-era-100', 'sonos-arc-ultra',
  'roborock-saros-10r', 'shelly-plug-s', 'shelly-1-gen4', 'tesla-wall-connector', 'netatmo-weather',
  'ipad-a16', 'ipad-mini', 'galaxy-tab-a9p', 'tablet-wall-mount', 'tablet-stand',
];

const REG = { ...DESK, ...RACK, ...AP, ...CAM, ...RACKS, ...DIN, ...LIGHT, ...STRIPS, ...CLIMATE, ...SENSORS, ...MEDIA, ...OTHER, ...TABLETS };

export const MODEL_IDS = ORDER.filter((id) => REG[id]);

export const MODEL_INFO = Object.fromEntries(Object.entries(REG).map(([id, d]) => [id, { family: d.family, mount: d.mount, name: d.name, strip: !!d.strip, bulb: !!d.bulb, view: d.view || null }]));

function fallback(id) {
  const kit = new Kit();
  kit.box('matte', '#d9dcdf', 0, 0.05, 0.05, 0.1, 0.1, 0.1, { r: 0.006, seg: 2 });
  const mat = labelMat('fallback-' + id, 256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#3a4148';
    ctx.font = '600 26px Helvetica, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const words = String(id).split('-');
    words.forEach((w, i) => ctx.fillText(w, 128, 128 + (i - (words.length - 1) / 2) * 32));
  });
  kit.quad(mat, null, 0.09, 0.09, 0, 0.05, 0.1003);
  return kit.build();
}

export function buildDevice(id, opts = {}) {
  const def = REG[id];
  let g;
  try {
    g = def ? def.build(opts) : fallback(id);
  } catch (e) {
    console.warn('buildDevice failed', id, e);
    g = fallback(id);
  }
  g.name = id;
  g.userData.id = id;
  g.userData.mount = g.userData.mount || (def ? def.mount : 'surface');
  return g;
}

export function buildStrip(id, points, opts = {}) {
  const def = REG[id];
  const pts = (points || []).map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2])));
  try {
    if (def && def.strip && pts.length >= 2) {
      const g = def.strip(pts, opts);
      g.name = id;
      g.userData.id = id;
      g.userData.mount = 'strip';
      return g;
    }
  } catch (e) {
    console.warn('buildStrip failed', id, e);
  }
  const g = new THREE.Group();
  g.name = id;
  g.userData = { id, mount: 'strip', leds: [], ports: [], size: [0, 0, 0], tris: 0 };
  return g;
}

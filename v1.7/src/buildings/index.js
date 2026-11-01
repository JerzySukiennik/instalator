// Instalator buildings: entry point, BUILDING_IDS and buildBuilding(id) for the four job buildings.

import * as THREE from 'three';
import { generate } from './generator.js';

export const BUILDING_IDS = ['kawalerka', 'dom', 'gzowo', 'willa'];

export const BUILDING_NAMES = {
  kawalerka: 'Kawalerka na Mokotowie',
  dom: 'Dom pod Warszawą',
  gzowo: 'Domek w Gzowie nad Narwią',
  willa: 'Willa w Konstancinie'
};

const specs = new Map();

async function specOf(id) {
  if (specs.has(id)) return specs.get(id);
  if (!BUILDING_IDS.includes(id)) throw new Error(`[buildings] unknown building id: ${id}`);
  const mod = await import(`./layouts/${id}.js`);
  specs.set(id, mod.default);
  return mod.default;
}

export async function buildBuilding(id, opts = {}) {
  let spec;
  try { spec = await specOf(id); } catch (e) { console.warn('[buildings] layout failed to load', id, e); spec = null; }
  const tries = spec ? [spec, { ...spec, site: null, roof: null }, { ...spec, site: null, roof: null, items: [], extra: null, stairs: [], railings: [] }] : [];
  for (const s of tries) {
    try {
      const b = generate(s, opts);
      b.group.userData.building = id;
      return b;
    } catch (e) {
      console.warn('[buildings] generate failed, simplifying', id, e);
    }
  }
  try { return fallback(id); } catch (e) { console.warn('[buildings] fallback failed', id, e); return bare(id); }
}

function bare(id) {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: '#e9e4da' });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 6), new THREE.MeshLambertMaterial({ color: '#c09468' }));
  floor.position.set(4, -0.05, 3);
  group.add(floor);
  const wallGroups = [];
  for (const [side, x, z, w, d] of [['N', 4, 0, 8, 0.3], ['S', 4, 6, 8, 0.3], ['W', 0, 3, 0.3, 6], ['E', 8, 3, 0.3, 6]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 2.7, d), mat.clone());
    m.position.set(x, 1.35, z);
    group.add(m);
    wallGroups.push({ mesh: m, floor: 0, side });
  }
  const q = [0, 0, 0, 1];
  const data = { id, name: BUILDING_NAMES[id] || id, area: 48, floors: [{ index: 0, y: 0, height: 2.7, name: 'Parter' }],
    rooms: [{ id: 'salon', name: 'Salon', floor: 0, kind: 'living', poly: [[0.15, 0.15], [7.85, 0.15], [7.85, 5.85], [0.15, 5.85]] }],
    walls: [], furniture: [], circuits: [{ id: 'L1', label: 'Światło', kind: 'light', rooms: ['salon'], breaker: 'B10' }, { id: 'G1', label: 'Gniazda', kind: 'socket', rooms: ['salon'], breaker: 'B16' }],
    mounts: [{ id: 'sufit-1', room: 'salon', floor: 0, kind: 'ceiling', pos: [4, 2.7, 3], normal: [0, -1, 0], quat: q, tags: [] }], strips: [], tabletSpots: [],
    panel: { room: 'salon', floor: 0, pos: [0.15, 1.6, 2], quat: [0, 0.707, 0, 0.707], rows: 2, slotsPerRow: 12 }, rack: null, mediaBox: { room: 'salon', floor: 0, pos: [0.15, 0.8, 3], quat: [0, 0.707, 0, 0.707] },
    wan: { room: 'salon', floor: 0, pos: [0.15, 0.4, 3.6], quat: [0, 0.707, 0, 0.707] }, entrance: { pos: [4, 0, -1], quat: q }, street: { pos: [4, 0, -8] },
    zones: [{ id: 'wejscie', kind: 'entrance', floor: 0, pos: [4, 0.5, -1.5], r: 2 }], camera: { target: [4, 1, 3], radius: 14 } };
  return { id, name: data.name, group, data, wallGroups, floorGroups: [{ group, floor: 0 }], fixtures: [], setDoorOpen() {} };
}

function fallback(id) {
  const fb = { id, name: BUILDING_NAMES[id] || id, floors: [{ index: 0, y: 0, height: 2.7, name: 'Parter' }], walls: [
    { id: 'n', floor: 0, a: [0, 0], b: [8, 0], t: 0.3, ext: true, open: [{ at: 3.5, w: 1.0, kind: 'door', entrance: true, head: 2.05 }] },
    { id: 's', floor: 0, a: [0, 6], b: [8, 6], t: 0.3, ext: true, open: [{ at: 2, w: 1.4, kind: 'window', sill: 0.85, head: 2.2 }] },
    { id: 'w', floor: 0, a: [0, 0], b: [0, 6], t: 0.3, ext: true },
    { id: 'e', floor: 0, a: [8, 0], b: [8, 6], t: 0.3, ext: true }
  ], rooms: [{ id: 'salon', name: 'Salon', kind: 'living', poly: [[0, 0], [8, 0], [8, 6], [0, 6]], floorFinish: { type: 'planks', color: '#c09468' } }],
  lights: [{ t: 'pendant', room: 'salon', x: 4, z: 3, circuit: 'L1' }],
  circuits: [{ id: 'L1', label: 'Światło', kind: 'light', rooms: ['salon'], breaker: 'B10' }, { id: 'G1', label: 'Gniazda', kind: 'socket', rooms: ['salon'], breaker: 'B16' }],
  panel: { room: 'salon', x: 0.15, z: 1.5, y: 1.6, rows: 2, slotsPerRow: 12 }, wan: { room: 'salon', x: 0.15, z: 2.5, y: 0.5 }, mediaBox: { room: 'salon', x: 0.15, z: 3.2, y: 0.8 },
  zones: [{ id: 'wejscie', kind: 'entrance', pos: [4, -1.5], r: 2 }], street: [4, 0, -8] };
  return generate(fb);
}

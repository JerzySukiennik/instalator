// Instalator buildings: entry point, BUILDING_IDS and buildBuilding(id) for the four job buildings.

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
  return fallback(id);
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

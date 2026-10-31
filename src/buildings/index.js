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
  const spec = await specOf(id);
  const b = generate(spec, opts);
  b.group.userData.building = id;
  return b;
}

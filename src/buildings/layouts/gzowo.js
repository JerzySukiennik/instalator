// Instalator buildings: Domek w Gzowie nad Narwią, the family summer house (real open space 12.4 x 8.4 m from Gzowo House) with a bedroom wing, deck, river and jetty.

import { C, shade, hash, rng, noise2, smooth, fbm } from '../geo.js';
import { P } from '../palette.js';
import { makeSite, lawnColor, jetty, boat, kayak } from '../exterior.js';

const PI = Math.PI, H = 2.72;
const MARBLE = { type: 'marble', color: '#5d6b61', dark: '#2f3a33', light: '#97a69a', vein: '#9a6a45', size: [1.2, 0.6], cell: 0.12, mat: 'satin' };
const OSB = { color: '#cfc6b5', flakes: { cols: ['#bcb09b', '#ddd5c6', '#a99c86', '#c9bfac', '#e4ddd0'], n: 105, joint: '#a1957f' } };

export default {
  id: 'gzowo',
  name: 'Domek w Gzowie nad Narwią',
  floors: [{ index: 0, y: 0, height: H, name: 'Parter', slab: 0.2 }],
  plinth: 0.55,
  plinthH: 0.38,
  topExtra: 0.3,
  palette: { facade: '#5b4a3c', plinth: '#4a4743', frame: '#2a2d31', glassFrame: '#1f2124', door: '#efece6', doorFrame: '#efece6', base: '#2a2d31', sill: '#d9d2c4', extDoor: '#2f3236', section: '#3f3a35', flashing: '#2a2d31' },
  facadeAt: (W, u, y) => (y < 0.0 ? '#4a4743' : null),
  walls: [
    { id: 'wN', floor: 0, a: [-9.72, -4.32], b: [6.32, -4.32], t: 0.24, ext: true, open: [
      { at: 1.12, w: 0.7, kind: 'window', sill: 1.45, head: 2.1 },
      { at: 13.37, w: 2.5, kind: 'window', sill: 1.27, head: 2.17, panes: 3 }
    ] },
    { id: 'wS', floor: 0, a: [-9.72, 4.32], b: [6.32, 4.32], t: 0.24, ext: true, open: [
      { id: 'sypialnia-taras', at: 0.72, w: 1.0, kind: 'glass', sill: 0, head: 2.2, panes: 1, slide: true },
      { at: 2.02, w: 1.0, kind: 'window', sill: 0.9, head: 2.2 },
      { id: 'przeszklenie', at: 3.52, w: 12.4, kind: 'glass', sill: 0, head: H, panes: 4, transom: false }
    ] },
    { id: 'wW', floor: 0, a: [-9.72, -4.32], b: [-9.72, 4.32], t: 0.24, ext: true, open: [
      { at: 2.82, w: 0.7, kind: 'window', sill: 1.4, head: 2.1 },
      { at: 6.22, w: 1.2, kind: 'window', sill: 0.9, head: 2.2 }
    ] },
    { id: 'wE', floor: 0, a: [6.32, -4.32], b: [6.32, 4.32], t: 0.24, ext: true, open: [
      { id: 'drzwi-wejsciowe', at: 4.12, w: 1.0, kind: 'door', head: 2.1, entrance: true, hinge: 'a', leafCol: '#2f3236' }
    ] },
    { id: 'wW2', floor: 0, a: [-6.32, -4.32], b: [-6.32, 4.32], t: 0.2, open: [{ id: 'drzwi-skrzydlo', at: 2.82, w: 0.9, kind: 'door', head: 2.05, hinge: 'a', swing: 1, angle: 85, leafCol: '#2f3236', frameCol: '#2a2d31', casingCol: '#2a2d31' }] },
    { id: 'k1', floor: 0, a: [-9.72, -2.54], b: [-6.32, -2.54], t: 0.12, open: [{ id: 'drzwi-schowek', at: 2.27, w: 0.9, kind: 'door', head: 2.05, hinge: 'a', swing: -1, angle: 80 }] },
    { id: 'k2', floor: 0, a: [-7.58, -2.54], b: [-7.58, 0.86], t: 0.1, open: [{ id: 'drzwi-lazienka', at: 0.94, w: 0.8, kind: 'door', head: 2.05, hinge: 'a', swing: 1, angle: 75 }] },
    { id: 'k3', floor: 0, a: [-9.72, 0.86], b: [-6.32, 0.86], t: 0.12, open: [{ id: 'drzwi-sypialnia', at: 2.27, w: 0.9, kind: 'door', head: 2.05, hinge: 'b', swing: 1, angle: 85 }] }
  ],
  rooms: [
    { id: 'salon', name: 'Salon (open space)', kind: 'living', poly: [[-6.32, -4.32], [3.2, -4.32], [3.2, -1.4], [6.32, -1.4], [6.32, 4.32], [-6.32, 4.32]], floorFinish: MARBLE, wall: OSB, accent: [{ wall: 'wE', color: '#3d4044' }], base: '#2a2d31', ceiling: { color: '#e3c08f' } },
    { id: 'kuchnia', name: 'Kuchnia', kind: 'kitchen', poly: [[3.2, -4.32], [6.32, -4.32], [6.32, -1.4], [3.2, -1.4]], floorFinish: MARBLE, wall: OSB, accent: [{ wall: 'wE', color: '#3d4044' }], base: '#2a2d31', ceiling: { color: '#e3c08f' } },
    { id: 'schowek', name: 'Schowek techniczny', kind: 'tech', poly: [[-9.72, -4.32], [-6.32, -4.32], [-6.32, -2.54], [-9.72, -2.54]], floorFinish: { type: 'concrete', color: '#9b978f' }, wall: '#e6e2da' },
    { id: 'korytarz', name: 'Korytarz', kind: 'hall', poly: [[-7.58, -2.54], [-6.32, -2.54], [-6.32, 0.86], [-7.58, 0.86]], floorFinish: { type: 'planks', color: '#a77d55', dir: 'z', w: 0.16, len: [1.0, 2.0] }, wall: '#ebe7df' },
    { id: 'lazienka', name: 'Łazienka', kind: 'bath', poly: [[-9.72, -2.54], [-7.58, -2.54], [-7.58, 0.86], [-9.72, 0.86]], floorFinish: { type: 'tiles', color: '#4f5550', size: [0.3, 0.6], grout: '#3c413d', vary: 0.04 }, wall: { color: '#ece9e2', tiles: { h: 2.1, color: '#e9e6df', size: [0.1, 0.1], grout: '#cfcac0', gap: 0.002 } } },
    { id: 'sypialnia', name: 'Sypialnia', kind: 'bed', poly: [[-9.72, 0.86], [-6.32, 0.86], [-6.32, 4.32], [-9.72, 4.32]], floorFinish: { type: 'planks', color: '#a77d55', dir: 'x', w: 0.16, len: [1.0, 2.0] }, wall: OSB, ceiling: { color: '#e3c08f' } },
    { id: 'taras', name: 'Taras', kind: 'terrace', poly: [[-9.72, 4.32], [6.32, 4.32], [6.32, 8.4], [-9.72, 8.4]], floorFinish: { type: 'deck', color: '#7c5a44', dir: 'x', w: 0.14, len: [2.4, 4.0], vary: 0.09, gap: 0.009 } }
  ],
  items: [
    { t: 'stove', room: 'salon', x: -4.6, z: -3.55, r: 0, toWall: 0.68 },
    { t: 'piano', room: 'salon', x: -2.4, z: -3.62, r: 0 },
    { t: 'tv', room: 'salon', x: -0.55, z: -4.2, r: 0, y: 1.38, inch: 72 },
    { t: 'gzowoShelf', room: 'salon', x: -0.9, z: -4.2, r: 0, y: 1.0, w: 3.9, tablet: -1.2 },
    { t: 'curtain', room: 'salon', x: 1.0, z: -4.2, r: 0, w: 0.72, h: 2.5, bottom: 0.04, pattern: 'check', panels: 1, panelW: 0.72, sheer: false, color: '#ecebe7' },
    { t: 'gzowoWardrobe', room: 'salon', x: 2.15, z: -3.9, r: 0 },
    { t: 'mirrorPanel', room: 'salon', x: 3.2, z: -4.2, r: 0, w: 0.9 },
    { t: 'kitchen', room: 'kuchnia', x: 4.9, z: -3.86, r: 0, d: 0.68, steel: true, upper: false, splash: false, mods: [{ t: 'drawers', w: 0.6 }, { t: 'base', w: 0.65 }, { t: 'sink', w: 0.6 }, { t: 'drawers', w: 0.65 }], clutter: ['boombox', 'redbottle', 'kettle', 'fruit'] },
    { t: 'kitchen', room: 'kuchnia', x: 5.4, z: -2.5, r: 0, d: 0.62, steel: true, upper: false, splash: false, mods: [{ t: 'drawers', w: 1.0, n: 4 }], clutter: ['dishrack'] },
    { t: 'blackShelving', room: 'kuchnia', x: 5.98, z: -1.85, r: -PI / 2, w: 0.8, d: 0.4, h: 1.9 },
    { t: 'gzowoSofa', room: 'salon', x: -2.2, z: 2.55, r: PI, w: 2.36, d: 0.92 },
    { t: 'plyTable', room: 'salon', x: 3.6, z: 1.3, r: 0 },
    { t: 'floorLamp', room: 'salon', x: 5.2, z: 2.6, r: 0, style: 'gzowo' },
    { t: 'pouf', room: 'salon', x: -0.6, z: 1.5, color: '#b9a28a' },
    { t: 'rug', room: 'salon', x: -2.2, z: 1.25, r: 0, w: 3.0, d: 2.2, color: '#d9d0c0', border: '#8a6e57', pattern: 'berber', seed: 5 },
    { t: 'sideTable', room: 'salon', x: -3.65, z: 2.55, r: 0, rad: 0.2, h: 0.5, top: '#d4ad7a', leg: '#1d1e20' },
    { t: 'tableLamp', room: 'salon', x: -3.65, z: 2.55, r: 0, y: 0.5, lampBody: '#1d1e20', shadeCol: '#efe6d6' },
    { t: 'box', room: 'salon', x: -5.25, z: -3.0, w: 0.5, d: 0.35, h: 0.32, color: '#6b4f38', noData: true },
    { t: 'plant', room: 'salon', x: -5.8, z: 3.75, kind: 'olive', s: 1.1, pot: '#2f3236' },
    { t: 'box', room: 'salon', x: 1.9, z: 0.2, w: 0.16, d: 0.1, h: 0.06, color: '#1d1e20', mat: 'matte', noData: true },

    { t: 'bed', room: 'sypialnia', x: -8.25, z: 1.98, r: 0, w: 1.6, l: 2.0, frame: '#a77d55', duvet: '#e6e1d6', throw: '#3f5f6f', deco: '#c97a5a' },
    { t: 'nightstand', room: 'sypialnia', x: -9.36, z: 1.13, r: 0, w: 0.4, d: 0.36, color: '#a77d55', top: '#a77d55' },
    { t: 'wardrobe', room: 'sypialnia', x: -6.71, z: 3.0, r: -PI / 2, w: 1.2, d: 0.58, h: 2.2, color: '#3b3d41', handles: 'long', handleCol: '#c9ccd1' },
    { t: 'rug', room: 'sypialnia', x: -8.25, z: 3.45, r: 0, w: 1.8, d: 0.9, color: '#d9cfbf', border: '#3f5f6f', pattern: 'stripes' },
    { t: 'curtain', room: 'sypialnia', x: -8.5, z: 4.2, r: PI, w: 1.2, h: 2.4, color: '#d9d2c4', sheer: false },

    { t: 'shower', room: 'lazienka', x: -9.15, z: -2.03, r: 0, w: 0.9, d: 0.9, glass: 'corner' },
    { t: 'toilet', room: 'lazienka', x: -9.6, z: -0.55, r: PI / 2, hung: true },
    { t: 'vanity', room: 'lazienka', x: -8.95, z: 0.8, r: PI, w: 0.7, d: 0.44, color: '#3b3d41' },
    { t: 'mirror', room: 'lazienka', x: -8.95, z: 0.8, r: PI, y: 1.1, w: 0.55, round: true, frame: '#2a2d31' },
    { t: 'washer', room: 'lazienka', x: -8.03, z: 0.52, r: PI },
    { t: 'towelRail', room: 'lazienka', x: -7.63, z: 0.0, r: -PI / 2, y: 0.3, w: 0.45, h: 1.0, towel: '#d9483b' },

    { t: 'coatHooks', room: 'korytarz', x: -6.42, z: 0.2, r: -PI / 2, y: 1.6, w: 0.7, n: 3, coats: ['#d9682f', '#2e3a4b', '#e3c25a'] },
    { t: 'bench', room: 'korytarz', x: -6.62, z: 0.2, r: -PI / 2, w: 0.8, d: 0.32, color: '#a77d55' },

    { t: 'shelfUnit', room: 'schowek', x: -9.1, z: -3.99, r: 0, w: 0.9, d: 0.4, h: 1.4, shelves: 3, boxCols: ['#e8792b', '#d9682f', '#3a5f9a', '#c9a77a', '#2f6b3a'] },
    { t: 'waterHeater', room: 'schowek', x: -7.9, z: -3.92, r: 0, h: 1.15 },
    { t: 'box', room: 'schowek', x: -8.55, z: -2.9, w: 0.55, d: 0.4, h: 0.3, color: '#e8792b', noData: true },
    { t: 'box', room: 'schowek', x: -8.55, z: -2.9, y: 0.3, w: 0.5, d: 0.36, h: 0.25, color: '#3a5f9a', noData: true },

    { t: 'gardenSet', room: 'taras', x: -3.6, z: 6.4, r: 0.1, color: '#5c4a3a' },
    { t: 'lounger', room: 'taras', x: 2.8, z: 6.5, r: -1.4 },
    { t: 'lounger', room: 'taras', x: 4.3, z: 6.6, r: -1.6, color: '#d9d2c4' },
    { t: 'grill', room: 'taras', x: 5.6, z: 7.7, r: 0 },
    { t: 'plant', room: 'taras', x: -6.0, z: 4.9, kind: 'ficus', s: 0.8, pot: '#5b4a3c' }
  ],
  lights: [
    { t: 'fan', room: 'salon', x: -1.0, z: 0.6, circuit: 'L1' },
    { t: 'pendant', room: 'salon', x: 3.05, z: 1.3, style: 'bare', drop: 1.05, circuit: 'L1' },
    { t: 'pendant', room: 'salon', x: 4.15, z: 1.3, style: 'bare', drop: 1.05, circuit: 'L1' },
    { t: 'onyx', room: 'salon', x: -0.2, z: -4.2, r: 0, y: 0.0, w: 11.4, circuit: 'L1' },
    { t: 'track', room: 'kuchnia', x: 4.85, z: -3.05, l: 1.9, n: 3, k: 0, circuit: 'L2' },
    { t: 'track', room: 'kuchnia', x: 4.85, z: -3.05, l: 1.9, n: 3, k: 1, circuit: 'L2' },
    { t: 'track', room: 'kuchnia', x: 4.85, z: -3.05, l: 1.9, n: 3, k: 2, circuit: 'L2' },
    { t: 'pendant', room: 'sypialnia', x: -8.0, z: 2.6, style: 'cage', drop: 0.6, circuit: 'L3' },
    { t: 'flush', room: 'lazienka', x: -8.6, z: -0.8, rad: 0.15, circuit: 'L2' },
    { t: 'flush', room: 'korytarz', x: -6.95, z: -0.8, circuit: 'L2' },
    { t: 'flush', room: 'schowek', x: -8.0, z: -3.4, circuit: 'L2' },
    { t: 'outdoor', room: 'kuchnia', x: 6.44, z: 1.25, r: PI / 2, y: 2.0, ext: true, style: 'cyl', circuit: 'L4' },
    { t: 'bollard', room: 'taras', x: -5.0, z: 8.2, circuit: 'L4' },
    { t: 'bollard', room: 'taras', x: 0.6, z: 8.2, circuit: 'L4' },
    { t: 'bollard', room: 'taras', x: 5.9, z: 8.2, circuit: 'L4' }
  ],
  circuits: [
    { id: 'L1', label: 'Światło salon (wiatrak, onyks, żarówki)', kind: 'light', rooms: ['salon'], breaker: 'B10' },
    { id: 'L2', label: 'Światło kuchnia, łazienka, korytarz, schowek', kind: 'light', rooms: ['kuchnia', 'lazienka', 'korytarz', 'schowek'], breaker: 'B10' },
    { id: 'L3', label: 'Światło sypialnia', kind: 'light', rooms: ['sypialnia'], breaker: 'B10' },
    { id: 'L4', label: 'Światło zewnętrzne, taras, pomost', kind: 'light', rooms: ['taras', 'kuchnia'], breaker: 'B10' },
    { id: 'G1', label: 'Gniazda salon', kind: 'socket', rooms: ['salon'], breaker: 'B16' },
    { id: 'G2', label: 'Gniazda kuchnia', kind: 'socket', rooms: ['kuchnia'], breaker: 'B16' },
    { id: 'G3', label: 'Gniazda sypialnia, korytarz', kind: 'socket', rooms: ['sypialnia', 'korytarz'], breaker: 'B16' },
    { id: 'G4', label: 'Gniazda łazienka, schowek', kind: 'socket', rooms: ['lazienka', 'schowek'], breaker: 'B16' },
    { id: 'K1', label: 'Płyta i piekarnik', kind: 'appliance', rooms: ['kuchnia'], breaker: 'C20' },
    { id: 'H1', label: 'Bojler i grzejniki', kind: 'heating', rooms: ['schowek', 'lazienka', 'sypialnia'], breaker: 'B16' },
    { id: 'Z1', label: 'Gniazda zewnętrzne, pomost', kind: 'socket', rooms: ['taras'], breaker: 'B16' }
  ],
  panel: { room: 'schowek', x: -6.42, z: -3.4, y: 1.62, nx: -1, nz: 0, rows: 2, slotsPerRow: 12 },
  rack: { room: 'schowek', x: -9.6, z: -3.25, y: 1.5, nx: 1, nz: 0, units: 9 },
  wan: { room: 'schowek', x: -9.6, z: -2.78, y: 0.5, nx: 1, nz: 0 },
  tablets: [
    { id: 'tablet-polka', room: 'salon', kind: 'surface', x: -2.1, z: -4.04, y: 1.09, r: 0, rating: 'good', why: 'Na długiej półce pod telewizorem: środek domu, gniazdko pod ręką, widać go z sofy i ze stołu. W przeszklonym salonie nie ma lepszej ściany.' },
    { id: 'tablet-wejscie', room: 'salon', kind: 'wall', x: 6.2, z: -1.0, nx: -1, nz: 0, y: 1.45, rating: 'ok', why: 'Przy drzwiach wejściowych na ciemnej ścianie, ale z dala od miejsc, gdzie się siedzi.' },
    { id: 'tablet-kominek', room: 'salon', kind: 'wall', x: -3.55, z: -4.2, nx: 0, nz: 1, y: 1.5, rating: 'poor', why: 'Między kominkiem a pianinem: od kominka bije gorąco, a ściana OSB jest pełna kabli od telewizora.' },
    { id: 'tablet-stol', room: 'salon', kind: 'wall', x: 6.2, z: 2.6, nx: -1, nz: 0, y: 1.45, rating: 'poor', why: 'Ciemna ściana przy stole: po południu słońce z przeszklenia świeci prosto w ekran.' },
    { id: 'tablet-korytarz', room: 'korytarz', kind: 'wall', x: -7.53, z: -1.95, nx: 1, nz: 0, y: 1.45, rating: 'ok', why: 'W korytarzu do sypialni: blisko szafki rack, ale nikt tu nie przechodzi w ciągu dnia.' }
  ],
  zones: [
    { id: 'strefa-wejscie', kind: 'entrance', pos: [7.5, -0.4, 0.3], r: 2 },
    { id: 'strefa-taras', kind: 'terrace', pos: [-0.5, 0.4, 6.4], r: 4 },
    { id: 'strefa-ogrod', kind: 'garden', pos: [-2.0, -0.6, 12.0], r: 5 },
    { id: 'strefa-pomost', kind: 'jetty', pos: [2.0, -0.7, 17.6], r: 2.5 },
    { id: 'strefa-brama', kind: 'gate', pos: [10.2, -0.45, -15.6], r: 2.5 },
    { id: 'strefa-podjazd', kind: 'driveway', pos: [10.0, -0.45, -7.0], r: 4 },
    { id: 'strefa-ulica', kind: 'street', pos: [10.0, -0.5, -22.0], r: 5 }
  ],
  extraMounts: [
    { id: 'brama-slupek', kind: 'gate', pos: [8.4, 0.75, -15.85], normal: [0, 0, 1], tags: ['gate', 'driveway'] },
    { id: 'pomost-slupek', kind: 'outdoorWall', pos: [2.75, -0.15, 15.95], normal: [0, 0, 1], tags: ['jetty', 'post'] },
    { id: 'drzewo-sosna', kind: 'outdoorWall', pos: [-12.6, 2.6, 9.2], normal: [0.6, 0, 0.8], tags: ['garden', 'tree'] }
  ],
  street: [10.0, -0.5, -22.0],
  approach: [[10.0, -0.5, -22.0], [10.2, -0.45, -16.0], [10.0, -0.45, -6.0], [7.6, -0.45, -1.0], [7.4, -0.2, 0.3]],
  views: { dollhouse: { az: 0.36, el: 0.74, dist: 0.86, target: [-1.0, 0.4, 0.4], sunAz: 40, sunEl: 47 }, wide: { az: 0.12, el: 0.5, dist: 1.42, target: [-0.5, 0.0, 7.5], sunAz: 40, sunEl: 47 }, close: { pos: [1.2, 1.55, 3.4], target: [-1.6, 1.35, -4.2], fov: 64 } },
  ceilingDecor(api, ceil) {
    const g = ceil[0];
    g.use('satin');
    const R = rng(7);
    for (let i = 0; i < 10; i++) for (let j = 0; j < 7; j++) {
      const x0 = -6.2 + i * 1.24, z0 = -4.2 + j * 1.2;
      g.face([[x0 + 0.004, H - 0.004, z0 + 0.004], [x0 + 1.236, H - 0.004, z0 + 0.004], [x0 + 1.236, H - 0.004, z0 + 1.196], [x0 + 0.004, H - 0.004, z0 + 1.196]], [x0, H + 1, z0], C('#e2bd8c').clone().multiplyScalar(0.94 + R() * 0.1));
    }
    g.use('matte');
    for (let i = 0; i < 5; i++) g.bx(-6.0, H - 0.06, -3.2 + i * 1.55 - 0.055, 6.0, H - 0.005, -3.2 + i * 1.55 + 0.055, C('#141517'));
  },
  site(api) { buildSite(api); },
  roof(api) { buildRoof(api); }
};

const bankZ = (x) => 17.5 + 1.4 * Math.sin(x * 0.045 + 0.6) + 0.7 * Math.sin(x * 0.13);
const FAR = 105;

function ground(x, z) {
  const zb = bankZ(x);
  if (z > FAR - 6) return -2.3 + 1.6 * smooth(FAR - 4, FAR + 3, z) + 0.6 * smooth(FAR + 3, FAR + 40, z) + (noise2(x * 0.04, z * 0.04, 5) - 0.5) * 0.8 * smooth(FAR + 4, FAR + 30, z);
  let h = -0.45;
  if (z > 8.6) h = -0.45 - 0.8 * smooth(8.6, zb - 2, z);
  if (z > zb - 2.5) h = Math.min(h, -1.25 - 1.0 * smooth(zb - 2.5, zb + 2.5, z));
  if (z < -16.5) h = -0.5 + (noise2(x * 0.05, z * 0.05, 3) - 0.5) * 0.4 * smooth(-18, -30, z);
  if (x < -23 || x > 19) h += (fbm(x * 0.04, z * 0.04, 2, 9) - 0.5) * 0.7 * smooth(19, 28, Math.abs(x + 2));
  return h;
}

function buildSite(api) {
  const S = makeSite(api, { ground });
  const g = S.g;
  const house = (x, z, p = 0.2) => x > -9.84 - p && x < 6.44 + p && z > -4.44 - p && z < 8.4 + p;
  const drive = (x, z) => x > 7.8 && x < 12.4 && z > -16.2 && z < -2.5;
  const path = (x, z) => x > 6.4 && x < 8.4 && z > -3.0 && z < 1.2;
  S.terrain({
    x0: -70, z0: -40, x1: 70, z1: 175, cell: 1.2,
    flat: (x, z) => house(x, z, 3),
    color: (x, z, y, out) => {
      lawnColor(x, z, out);
      const zb = bankZ(x);
      if (z > zb - 3 && z < zb + 3) out.lerp(C('#7a6a4f'), smooth(zb - 3, zb - 0.5, z));
      if (z > zb - 0.6 && z < FAR - 2) out.set('#5a4e3c');
      if (z > FAR - 4 && z < FAR + 1) out.set('#7a6a4f');
      if (drive(x, z) || path(x, z)) out.set('#a39b8b');
      if (z < -18.5 && z > -25.5) out.set('#9b9283');
      if (z > FAR + 2) out.lerp(C('#7c8f45'), 0.25);
      return out;
    },
    hole: (x, z) => x > -9.2 && x < 5.8 && z > -3.8 && z < 7.8
  });
  S.water({ x0: -120, z0: 10, x1: 120, z1: FAR + 2, y: -1.55, bankZ: 16.0, farZ: FAR - 1 });
  g.use('satin');
  g.bx(-9.84, -0.6, 4.44, 6.44, -0.045, 8.4, C('#5c4535'));
  for (let i = 0; i < 2; i++) g.bx(-1.5, -0.6, 8.4 + i * 0.32, 2.5, -0.2 - i * 0.18, 8.72 + i * 0.32, C('#7a5a42'), { top: C('#8a573c') });
  const gravel = { type: 'tiles', color: '#b0a796', size: [0.3, 0.3], grout: '#9a917f', vary: 0.12, gap: 0.05 };
  S.pave([7.8, -16.2, 12.4, -2.5], -0.43, gravel, 41);
  for (let i = 0; i < 6; i++) { g.use('satin'); g.cb(6.7 + (i % 2) * 0.5, -0.46, -2.6 + i * 0.6, 7.5 + (i % 2) * 0.5, -0.4, -2.15 + i * 0.6, 0.03, C('#9d978b')); }
  S.woodFence([-24, -16], [7.0, -16], { h: 1.25 });
  S.woodFence([13.5, -16], [19, -16], { h: 1.25 });
  S.woodFence([-24, -16], [-24, 21.5], { h: 1.25 });
  S.woodFence([19, -16], [19, 22.5], { h: 1.25 });
  S.swingGate([8.2, -16], [13.5, -16], { style: 'wood', h: 1.3 });
  S.swingGate([7.0, -16], [8.2, -16], { style: 'wood', h: 1.3, leaves: 1 });
  g.use('satin');
  g.bx(6.75, -0.45, -16.35, 6.95, 0.95, -16.15, C('#5b4636'));
  g.use('metal');
  g.bx(6.62, 0.55, -16.4, 7.08, 0.85, -16.18, C('#2d4a3a'));
  S.car(10.1, -8.0, PI + 0.05, { color: '#9aa0a6', kind: 'sedan' });
  jetty(S, 2.0, 15.6, 9.5, 1.6, -1.18);
  boat(S, 3.55, -1.62, 21.8, 0.08, '#4f6f62');
  kayak(S, -2.4, -1.3, 15.2, 1.35, '#d9682f');
  g.use('satin');
  for (const [x, z] of [[2.75, 15.9], [1.25, 15.9]]) g.cyl(x, -1.4, z, 0.07, 0.07, 1.25, 7, C('#5d4a36'));
  firePit(S, -6.0, 12.2);
  hammock(S, [-14.2, 3.2], [-10.9, 6.6]);
  const pines = [[-18, -10], [-15, 1.5], [-20, 12], [-11, -13], [3, -12.5], [-4, -13.5], [14.5, -12], [16, 3], [14.5, 11], [-14.2, 3.2], [-10.9, 6.6], [-21, 12.5], [17, 12.5], [-9, 13.5]];
  S.trees(pines.map(([x, z], i) => ['pine', x, z, 0.95 + hash(i, 4) * 0.35]));
  S.trees([['birch', -16, 13, 1.0], ['birch', 13.5, 13.5, 0.95], ['birch', 14.5, 8.5, 0.9], ['oak', -6, -11, 1.0], ['oak', 17, -4, 0.95], ['willow', -14.5, 17.0, 1.0], ['willow', 17, 17.5, 1.05], ['willow', 27, 19.0, 1.1], ['alder', -26, 24, 1.0], ['bush', -22, 6, 0.9], ['bush', 18, 9, 1.0]]);
  const R = rng(17);
  const far = [];
  for (let x = -110; x < 110; x += 3.2 + R() * 3) {
    const z = FAR + 4 + R() * 18, tp = R();
    far.push([tp < 0.4 ? 'alder' : tp < 0.65 ? 'willow' : tp < 0.85 ? 'pine' : 'birch', x, z, 0.8 + R() * 0.5]);
    if (R() < 0.5) far.push(['pine', x + R() * 3, FAR + 28 + R() * 25, 0.9 + R() * 0.4]);
  }
  S.trees(far);
  const reeds = [];
  for (let x = -60; x < 60; x += 1.1 + R() * 1.6) {
    if (x > -0.5 && x < 4.5) continue;
    if (noise2(x * 0.08, 3, 7) > 0.35) reeds.push(['reeds', x, bankZ(x) + 0.3 + R() * 1.4, 0.7 + R() * 0.5]);
    if (noise2(x * 0.07, 9, 7) > 0.3) reeds.push(['reeds', x + R(), FAR - 2.5 + R() * 1.5, 0.8 + R() * 0.5]);
  }
  S.trees(reeds);
  const lawn = (x, z) => x > -23.5 && x < 18.5 && z > -15.5 && z < bankZ(x) - 1.2 && !house(x, z, 0.4) && !drive(x, z) && !path(x, z) && Math.hypot(x + 6.0, z - 12.2) > 2.0;
  S.scatter(5600, lawn, 51, 0.85, 1.4, -24, -16, 19, 26);
  S.scatter(1600, (x, z) => (x < -24.5 || x > 19.5) && z < 20 && z > -18, 52, 0.85, 1.3, -50, -18, 45, 20);
  S.scatter(1500, (x, z) => z > FAR + 2 && z < FAR + 30, 53, 0.9, 1.4, -70, FAR, 70, FAR + 30);
  S.finish();
}

function firePit(S, x, z) {
  const g = S.g;
  const y = ground(x, z);
  g.use('matte');
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.blob(x + Math.cos(a) * 0.62, y + 0.1, z + Math.sin(a) * 0.62, 0.17, 0.12, 0.15, '#8a857c', i + 3, { detail: 0 }); }
  g.cyl(x, y + 0.01, z, 0.5, 0.5, 0.02, 12, C('#2b2622'));
  for (let i = 0; i < 4; i++) { const a = i * 0.8; g.line([x + Math.cos(a) * 0.3, y + 0.06, z + Math.sin(a) * 0.3], [x - Math.cos(a) * 0.25, y + 0.2, z - Math.sin(a) * 0.25], 0.05, '#4a3a2c', 6); }
  g.use('satin');
  for (const [dx, dz, r] of [[0, -1.9, 0], [1.9, 0.3, PI / 2.2], [-1.8, 0.6, -PI / 2.3]]) {
    g.at(x + dx, y, z + dz, r);
    g.at(0, 0.22, 0, 0, 0, PI / 2);
    g.cyl(0, -0.9, 0, 0.2, 0.2, 1.8, 9, C('#7a5d44'), { top: C('#c9a27a') });
    g.pop();
    g.pop();
  }
}

function hammock(S, a, b) {
  const g = S.g;
  const ya = ground(...a) + 1.5, yb = ground(...b) + 1.5;
  g.use('matte2');
  const n = 8;
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([a[0] + (b[0] - a[0]) * t, ya + (yb - ya) * t - Math.sin(t * Math.PI) * 0.7, a[1] + (b[1] - a[1]) * t]); }
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), nx = -dz / L * 0.45, nz = dx / L * 0.45;
  for (let i = 1; i < n - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    const c = i % 2 ? '#d9682f' : '#e8c27a';
    g.quad([p[0] - nx, p[1], p[2] - nz], [q[0] - nx, q[1], q[2] - nz], [q[0] + nx, q[1], q[2] + nz], [p[0] + nx, p[1], p[2] + nz], c);
  }
  g.use('matte');
  g.line([a[0], ya, a[1]], pts[1], 0.012, '#d8cfbf', 4);
  g.line([b[0], yb, b[1]], pts[n - 1], 0.012, '#d8cfbf', 4);
}

function buildRoof(api) {
  const g = new api.Geo();
  const top = H + 0.3;
  g.use('satin');
  g.bx(-10.1, top, -4.75, 6.8, top + 0.22, 9.2, C('#2c2e31'), { top: C('#3b3d40') });
  g.bx(-10.1, top - 0.06, 8.6, 6.8, top + 0.28, 9.2, C('#5b4a3c'));
  for (const x of [-9.6, -3.2, 2.8, 6.3]) g.bx(x - 0.07, -0.05, 8.55, x + 0.07, top, 8.69, C('#2a2d31'));
  g.bx(-4.7, top + 0.22, -3.7, -4.3, top + 1.2, -3.3, C('#2a2d31'));
  api.addGeo(g, api.roofGroup, { name: 'roof' });
}

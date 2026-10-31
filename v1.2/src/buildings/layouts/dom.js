// Instalator buildings: Dom pod Warszawą, a two-storey 130 m2 family house with garden, driveway and gate.

import { C, shade, hash, rng, noise2 } from '../geo.js';
import { P } from '../palette.js';
import { makeSite, lawnColor } from '../exterior.js';

const PI = Math.PI, Y1 = 2.95;
const OAK = { type: 'planks', color: '#b98d5f', dir: 'z', w: 0.19, len: [1.0, 2.1], vary: 0.07 };
const OAK1 = { type: 'planks', color: '#c29a6c', dir: 'x', w: 0.19, len: [1.0, 2.1], vary: 0.07 };
const STONE = { type: 'tiles', color: '#cfc8bc', size: [0.6, 0.6], grout: '#b3ac9f', vary: 0.035 };
const BATHF = { type: 'tiles', color: '#7d7a75', size: [0.6, 0.6], grout: '#66635f', vary: 0.03 };

export default {
  id: 'dom',
  name: 'Dom pod Warszawą',
  floors: [
    { index: 0, y: 0, height: 2.7, name: 'Parter', slab: 0.25 },
    { index: 1, y: Y1, height: 2.6, name: 'Piętro', slab: 0.25 }
  ],
  plinth: 0.55,
  plinthH: 0.42,
  topExtra: 0.3,
  palette: { facade: '#ece8e0', plinth: '#5e5c58', frame: '#3b3e43', door: '#f2f0ea', doorFrame: '#f3f1ec', base: '#f3f1ec', sill: '#efede8', extDoor: '#3b3e43', glassFrame: '#3b3e43', section: '#47423c', flashing: '#3b3e43' },
  facadeAt: (W, u, y) => (W.id === 'wN' && u > 2.75 && u < 4.65 && y > 0.4) ? '#8a6446' : null,
  walls: [
    { id: 'wN', floor: 0, a: [0, 0], b: [9.4, 0], t: 0.4, ext: true, uBreaks: [2.75, 4.65], open: [
      { at: 0.9, w: 0.9, kind: 'window', sill: 1.2, head: 2.1 },
      { id: 'drzwi-wejsciowe', at: 3.2, w: 1.0, kind: 'door', head: 2.15, entrance: true, hinge: 'a', leafCol: '#3b3e43' },
      { at: 6.7, w: 1.4, kind: 'window', sill: 1.05, head: 2.2 }
    ] },
    { id: 'wE', floor: 0, a: [9.4, 0], b: [9.4, 8.2], t: 0.4, ext: true, open: [
      { at: 1.4, w: 1.2, kind: 'window', sill: 0.9, head: 2.2 },
      { at: 4.5, w: 1.5, kind: 'window', sill: 0.85, head: 2.2 }
    ] },
    { id: 'wS', floor: 0, a: [0, 8.2], b: [9.4, 8.2], t: 0.4, ext: true, open: [
      { at: 0.9, w: 1.2, kind: 'window', sill: 0.85, head: 2.2 },
      { at: 3.5, w: 1.4, kind: 'window', sill: 0.85, head: 2.2 },
      { id: 'taras-drzwi', at: 5.8, w: 2.5, kind: 'glass', sill: 0, head: 2.25, panes: 2, slide: true }
    ] },
    { id: 'wW', floor: 0, a: [0, 0], b: [0, 8.2], t: 0.4, ext: true, open: [
      { at: 3.2, w: 0.6, kind: 'window', sill: 1.5, head: 2.1 },
      { at: 5.9, w: 1.2, kind: 'window', sill: 0.85, head: 2.2 }
    ] },
    { id: 'A', floor: 0, a: [3.0, 0], b: [3.0, 8.2], t: 0.2, open: [
      { id: 'drzwi-techniczne', at: 1.2, w: 0.9, kind: 'door', head: 2.05, hinge: 'a', swing: 1, angle: 75, style: 'panel' },
      { id: 'drzwi-wc', at: 3.1, w: 0.8, kind: 'door', head: 2.05, hinge: 'b', swing: 1, angle: 70, style: 'panel' },
      { id: 'drzwi-goscinny', at: 4.65, w: 0.9, kind: 'door', head: 2.05, hinge: 'b', swing: 1, angle: 85, style: 'panel' }
    ] },
    { id: 'B', floor: 0, a: [0, 2.56], b: [3.0, 2.56], t: 0.12 },
    { id: 'Cw', floor: 0, a: [0, 4.46], b: [3.0, 4.46], t: 0.12 },
    { id: 'D', floor: 0, a: [5.26, 0], b: [5.26, 5.66], t: 0.12, open: [{ id: 'drzwi-kuchnia', at: 0.55, w: 0.9, kind: 'door', head: 2.05, hinge: 'b', swing: -1, angle: 85, style: 'panel' }] },
    { id: 'E', floor: 0, a: [3.0, 5.66], b: [5.26, 5.66], t: 0.12, open: [{ id: 'drzwi-salon', at: 0.3, w: 0.9, kind: 'door', head: 2.05, hinge: 'a', swing: 1, style: 'glass', angle: 90 }] },

    { id: 'wN1', floor: 1, a: [0, 0], b: [9.4, 0], t: 0.4, ext: true, open: [
      { at: 0.9, w: 1.2, kind: 'window', sill: 0.9, head: 2.2 },
      { at: 3.5, w: 0.8, kind: 'window', sill: 1.0, head: 2.2 },
      { at: 6.6, w: 1.4, kind: 'window', sill: 0.85, head: 2.2 }
    ] },
    { id: 'wE1', floor: 1, a: [9.4, 0], b: [9.4, 8.2], t: 0.4, ext: true, open: [
      { at: 1.2, w: 1.2, kind: 'window', sill: 0.85, head: 2.2 },
      { at: 5.0, w: 1.4, kind: 'window', sill: 0.85, head: 2.2 }
    ] },
    { id: 'wS1', floor: 1, a: [0, 8.2], b: [9.4, 8.2], t: 0.4, ext: true, open: [
      { at: 0.8, w: 1.4, kind: 'window', sill: 0.85, head: 2.2 },
      { at: 3.75, w: 0.7, kind: 'window', sill: 1.3, head: 2.2 },
      { at: 6.4, w: 1.8, kind: 'window', sill: 0.85, head: 2.2 }
    ] },
    { id: 'wW1', floor: 1, a: [0, 0], b: [0, 8.2], t: 0.4, ext: true, open: [
      { at: 3.0, w: 0.8, kind: 'window', sill: 1.3, head: 2.2 },
      { at: 6.0, w: 1.2, kind: 'window', sill: 0.85, head: 2.2 }
    ] },
    { id: 'A1', floor: 1, a: [3.0, 0], b: [3.0, 8.2], t: 0.2, open: [
      { id: 'drzwi-gabinet', at: 0.65, w: 0.8, kind: 'door', head: 2.05, hinge: 'b', swing: 1, angle: 80, style: 'panel' },
      { id: 'drzwi-lazienka', at: 2.9, w: 0.8, kind: 'door', head: 2.05, hinge: 'b', swing: 1, angle: 75, style: 'panel' },
      { id: 'drzwi-zosia', at: 4.8, w: 0.8, kind: 'door', head: 2.05, hinge: 'b', swing: 1, angle: 85, style: 'panel' }
    ] },
    { id: 'B1', floor: 1, a: [0, 2.06], b: [3.0, 2.06], t: 0.12 },
    { id: 'C1', floor: 1, a: [0, 4.66], b: [3.0, 4.66], t: 0.12 },
    { id: 'D1', floor: 1, a: [5.26, 0], b: [5.26, 8.2], t: 0.12, open: [
      { id: 'drzwi-kuba', at: 0.35, w: 0.85, kind: 'door', head: 2.05, hinge: 'a', swing: -1, angle: 80, style: 'panel' },
      { id: 'drzwi-sypialnia', at: 4.5, w: 0.85, kind: 'door', head: 2.05, hinge: 'b', swing: -1, angle: 85, style: 'panel' },
      { id: 'drzwi-garderoba', at: 6.6, w: 0.8, kind: 'door', head: 2.05, hinge: 'b', swing: 1, angle: 70, style: 'panel' }
    ] },
    { id: 'E1', floor: 1, a: [5.26, 3.66], b: [9.4, 3.66], t: 0.12 },
    { id: 'F1', floor: 1, a: [3.0, 5.72], b: [5.26, 5.72], t: 0.12 }
  ],
  rooms: [
    { id: 'techniczne', name: 'Pomieszczenie techniczne', kind: 'tech', poly: [[0, 0], [3.0, 0], [3.0, 2.56], [0, 2.56]], floorFinish: { type: 'tiles', color: '#9a958d', size: [0.45, 0.45], grout: '#86817a', vary: 0.03 }, wall: '#e9e6df' },
    { id: 'wc', name: 'WC', kind: 'wc', poly: [[0, 2.56], [3.0, 2.56], [3.0, 4.46], [0, 4.46]], floorFinish: BATHF, wall: { color: '#ece8e1', tiles: { h: 1.35, color: '#e6e1d8', size: [0.3, 0.6], grout: '#cfc9bf' } } },
    { id: 'goscinny', name: 'Pokój gościnny', kind: 'bed', poly: [[0, 4.46], [3.0, 4.46], [3.0, 8.2], [0, 8.2]], floorFinish: OAK, wall: '#e6dfd2' },
    { id: 'hol', name: 'Hol', kind: 'hall', poly: [[3.0, 0], [5.26, 0], [5.26, 5.66], [3.0, 5.66]], floorFinish: STONE, wall: '#ebe6dd' },
    { id: 'kuchnia', name: 'Kuchnia', kind: 'kitchen', poly: [[5.26, 0], [9.4, 0], [9.4, 3.6], [5.26, 3.6]], floorFinish: STONE, wall: '#ece8e0' },
    { id: 'salon', name: 'Salon z jadalnią', kind: 'living', poly: [[3.0, 5.66], [5.26, 5.66], [5.26, 3.6], [9.4, 3.6], [9.4, 8.2], [3.0, 8.2]], floorFinish: OAK, wall: '#ebe5da', accent: [{ wall: 'D', color: '#c9b9a3' }] },
    { id: 'taras', name: 'Taras', kind: 'terrace', poly: [[4.6, 8.2], [9.9, 8.2], [9.9, 11.4], [4.6, 11.4]], floorFinish: { type: 'deck', color: '#8d6747', dir: 'x', w: 0.145, len: [2.0, 3.6], vary: 0.08 } },

    { id: 'gabinet', name: 'Gabinet', kind: 'office', floor: 1, poly: [[0, 0], [3.0, 0], [3.0, 2.06], [0, 2.06]], floorFinish: OAK1, wall: '#e4ddd0' },
    { id: 'lazienka', name: 'Łazienka', kind: 'bath', floor: 1, poly: [[0, 2.06], [3.0, 2.06], [3.0, 4.66], [0, 4.66]], floorFinish: BATHF, wall: { color: '#ece8e1', tiles: { h: 2.6, color: '#e2ddd4', size: [0.6, 0.3], grout: '#cbc4b8' } } },
    { id: 'pokoj-zosi', name: 'Pokój Zosi', kind: 'bed', floor: 1, poly: [[0, 4.66], [3.0, 4.66], [3.0, 8.2], [0, 8.2]], floorFinish: OAK1, wall: '#d9e4dc', accent: [{ wall: 'C1', color: '#e8cfc8' }] },
    { id: 'korytarz', name: 'Korytarz', kind: 'hall', floor: 1, poly: [[3.0, 0], [5.26, 0], [5.26, 1.55], [4.2, 1.55], [4.2, 4.4], [5.26, 4.4], [5.26, 5.72], [3.0, 5.72]], floorFinish: OAK1, wall: '#ebe6dd' },
    { id: 'garderoba', name: 'Garderoba', kind: 'hall', floor: 1, poly: [[3.0, 5.72], [5.26, 5.72], [5.26, 8.2], [3.0, 8.2]], floorFinish: OAK1, wall: '#ebe6dd', noOutlets: true },
    { id: 'pokoj-kuby', name: 'Pokój Kuby', kind: 'bed', floor: 1, poly: [[5.26, 0], [9.4, 0], [9.4, 3.66], [5.26, 3.66]], floorFinish: OAK1, wall: '#d3dde3', accent: [{ wall: 'E1', color: '#4a5a6e' }] },
    { id: 'sypialnia', name: 'Sypialnia', kind: 'bed', floor: 1, poly: [[5.26, 3.66], [9.4, 3.66], [9.4, 8.2], [5.26, 8.2]], floorFinish: OAK1, wall: '#e3dcd1', accent: [{ wall: 'E1', color: '#56634f' }] }
  ],
  voids: [{ floor: 1, x0: 4.2, z0: 1.55, x1: 5.2, z1: 4.4 }],
  stairs: [{ floor: 0, x: 4.7, z: 5.3, dir: [0, -1], w: 0.95, n: 15, run: 0.25, rail: -1, under: '#ece8e0', tread: '#b98d5f', riser: '#f1efea', stringer: '#f1efea', railCol: '#2c2f33' }],
  railings: [{ floor: 1, pts: [[4.2, 1.55], [4.2, 4.4], [5.2, 4.4]], col: '#2c2f33', top: '#b98d5f', spacing: 0.12 }],
  items: [
    { t: 'kitchen', room: 'kuchnia', x: 7.26, z: 0.5, r: 0, mods: [{ t: 'drawers', w: 0.6 }, { t: 'base', w: 0.6 }, { t: 'dw', w: 0.6 }, { t: 'sink', w: 0.8 }, { t: 'drawers', w: 0.68 }, { t: 'fridge', w: 0.6 }], uppers: [{ w: 0.6, t: 'cab' }, { w: 0.6, t: 'cab' }, { w: 0.6, t: 'none' }, { w: 0.8, t: 'none' }, { w: 0.68, t: 'glass' }, { w: 0.6, t: 'none' }], front: '#a5ae9a', carcass: '#e9e6df', worktop: '#c79f70', handle: 'bar', splashTiles: true, splashCol: '#efeee8', clutter: ['board', 'jar', 'dishrack', 'kettle', 'coffee'] },
    { t: 'island', room: 'kuchnia', x: 7.15, z: 2.35, r: 0, w: 2.2, d: 0.9, front: '#a5ae9a', worktop: '#ecebe6', hob: 0.45, stools: 3, stoolCol: '#c79f70' },
    { t: 'clock', room: 'kuchnia', x: 5.32, z: 2.4, r: PI / 2, y: 1.7, rad: 0.16 },
    { t: 'plant', room: 'kuchnia', x: 8.95, z: 3.3, kind: 'ficus', s: 0.85 },

    { t: 'sofa', room: 'salon', x: 8.6, z: 4.85, r: -PI / 2, w: 2.5, d: 0.95, chaise: 1, chaiseD: 1.65, color: '#a69d8f', pillows: ['#b5654a', '#e3dccf', '#5f6f5a', '#d9a441'], throw: '#5f6f5a' },
    { t: 'rug', room: 'salon', x: 7.3, z: 4.85, r: PI / 2, w: 2.4, d: 1.8, color: '#d8cfbf', border: '#8f6e55', pattern: 'border' },
    { t: 'coffeeTable', room: 'salon', x: 7.15, z: 4.75, r: PI / 2, w: 1.1, d: 0.6, top: '#b98d5f' },
    { t: 'tvStand', room: 'salon', x: 5.52, z: 4.65, r: PI / 2, w: 1.8, d: 0.4, tv: 55, color: '#f0eee9', wood: '#b98d5f' },
    { t: 'floorLamp', room: 'salon', x: 8.95, z: 3.85, r: -PI / 2, style: 'tripod', shadeCol: '#efe6d6' },
    { t: 'armchair', room: 'salon', x: 6.0, z: 7.2, r: PI * 0.8, color: '#5f6f5a', pillow: '#d9a441' },
    { t: 'plant', room: 'salon', x: 8.95, z: 7.7, kind: 'monstera', s: 1.05, pot: '#efebe3' },
    { t: 'diningTable', room: 'salon', x: 4.15, z: 6.9, r: PI / 2, w: 1.45, d: 0.85, chairs: 4, chair: 'wood', top: '#b98d5f', leg: '#b98d5f' },
    { t: 'sideboard', room: 'salon', x: 3.42, z: 6.9, r: PI / 2, w: 1.2, d: 0.42, h: 0.75, color: '#f0eee9', decor: false, noData: false },
    { t: 'picture', room: 'salon', x: 3.1, z: 6.9, r: PI / 2, y: 1.35, w: 0.9, h: 0.6, art: 'abstract', cols: ['#b5654a', '#d9a441', '#5f6f5a'] },
    { t: 'curtain', room: 'salon', x: 7.05, z: 8.0, r: PI, w: 2.8, h: 2.55, color: '#d9cfbf' },

    { t: 'shoeCabinet', room: 'hol', x: 3.26, z: 2.55, r: PI / 2, w: 0.9, d: 0.32 },
    { t: 'mirror', room: 'hol', x: 3.1, z: 2.55, r: PI / 2, y: 1.05, w: 0.55, h: 0.9, round: false, frame: '#b98d5f' },
    { t: 'coatHooks', room: 'hol', x: 3.1, z: 4.25, r: PI / 2, y: 1.65, w: 0.6, n: 3 },
    { t: 'rug', room: 'hol', x: 3.65, z: 3.0, r: PI / 2, w: 2.2, d: 0.7, color: '#8a7a68', border: '#5f5245', pattern: 'stripes' },

    { t: 'washer', room: 'techniczne', x: 0.52, z: 2.22, r: PI },
    { t: 'washer', room: 'techniczne', x: 0.52, z: 2.22, r: PI, y: 0.87, h: 0.82 },
    { t: 'utilitySink', room: 'techniczne', x: 1.25, z: 2.25, r: PI },
    { t: 'shelfUnit', room: 'techniczne', x: 2.4, z: 2.3, r: PI, w: 0.9, d: 0.4, h: 1.8 },
    { t: 'waterHeater', room: 'techniczne', x: 2.6, z: 0.52, r: PI, rad: 0.25, h: 1.4 },
    { t: 'boiler', room: 'techniczne', x: 2.0, z: 0.2, r: 0, y: 1.3 },
    { t: 'box', room: 'techniczne', x: 0.6, z: 0.5, w: 0.5, d: 0.4, h: 0.35, color: '#c9a77a', noData: true },

    { t: 'toilet', room: 'wc', x: 1.65, z: 2.62, r: 0, hung: true },
    { t: 'vanity', room: 'wc', x: 0.2, z: 3.5, r: PI / 2, w: 0.5, d: 0.36, color: '#f0eee9' },
    { t: 'mirror', room: 'wc', x: 0.2, z: 3.5, r: PI / 2, y: 1.12, w: 0.5, h: 0.3, noData: true },
    { t: 'towelRail', room: 'wc', x: 0.75, z: 4.4, r: PI, y: 0.35, w: 0.4, h: 0.8 },

    { t: 'bed', room: 'goscinny', x: 0.72, z: 5.63, r: 0, w: 0.9, l: 2.0, frame: '#c29a6c', duvet: '#dfe6e3', throw: '#b5654a' },
    { t: 'desk', room: 'goscinny', x: 1.65, z: 7.7, r: PI, w: 1.1, d: 0.55, chair: true, laptop: true, monitor: false },
    { t: 'wardrobe', room: 'goscinny', x: 2.6, z: 6.75, r: -PI / 2, w: 1.2, d: 0.58, h: 2.2, color: '#efebe4', handles: 'bar' },

    { t: 'desk', room: 'gabinet', x: 1.5, z: 0.5, r: 0, w: 1.3, d: 0.6, monitor: true, drawers: true, top: '#c29a6c', leg: '#2b2c2f' },
    { t: 'bookshelf', room: 'gabinet', x: 0.36, z: 1.25, r: PI / 2, w: 0.8, h: 2.0, color: '#f0eee9' },
    { t: 'plant', room: 'gabinet', x: 2.55, z: 1.7, kind: 'small', s: 1.6 },

    { t: 'bathtub', room: 'lazienka', x: 0.58, z: 3.35, r: PI / 2, w: 1.7, d: 0.75 },
    { t: 'vanity', room: 'lazienka', x: 1.95, z: 2.12, r: 0, w: 1.2, d: 0.48, double: true, color: '#b98d5f' },
    { t: 'mirror', room: 'lazienka', x: 1.95, z: 2.12, r: 0, y: 1.08, w: 1.1, h: 0.8 },
    { t: 'toilet', room: 'lazienka', x: 2.25, z: 4.6, r: PI, hung: true },
    { t: 'towelRail', room: 'lazienka', x: 1.3, z: 4.6, r: PI, y: 0.25, w: 0.5, h: 1.2, towel: '#c9b39a' },
    { t: 'laundry', room: 'lazienka', x: 2.6, z: 3.95, r: 0 },

    { t: 'bed', room: 'pokoj-zosi', x: 0.72, z: 6.92, r: PI, w: 0.9, l: 2.0, frame: '#f0ece6', duvet: '#efc6c1', pillow: '#f6f1ea', throw: '#d9e6dc', deco: '#e9a9a0' },
    { t: 'wardrobe', room: 'pokoj-zosi', x: 0.9, z: 5.02, r: 0, w: 1.2, d: 0.58, h: 2.0, color: '#f2efe9', handles: 'none' },
    { t: 'desk', room: 'pokoj-zosi', x: 2.6, z: 6.6, r: -PI / 2, w: 1.0, d: 0.55, monitor: false, laptop: false, top: '#f2efe9', leg: '#f2efe9', chairCol: '#e9a9a0' },
    { t: 'rug', room: 'pokoj-zosi', x: 1.65, z: 6.4, w: 1.4, round: true, color: '#f0d2cc', border: '#e9a9a0' },
    { t: 'toyBox', room: 'pokoj-zosi', x: 1.9, z: 7.7, r: PI, color: '#f2e2b8' },
    { t: 'beanbag', room: 'pokoj-zosi', x: 1.75, z: 5.4, color: '#a9c4b6' },

    { t: 'bed', room: 'pokoj-kuby', x: 8.7, z: 1.26, r: 0, w: 0.9, l: 2.0, frame: '#c29a6c', duvet: '#4a5a6e', pillow: '#f2efe8', throw: '#e3c25a' },
    { t: 'desk', room: 'pokoj-kuby', x: 7.3, z: 0.5, r: 0, w: 1.2, d: 0.6, monitor: true, top: '#c29a6c', leg: '#2b2c2f', chairCol: '#3a5f9a' },
    { t: 'wardrobe', room: 'pokoj-kuby', x: 5.61, z: 2.4, r: PI / 2, w: 1.2, d: 0.58, h: 2.1, color: '#ece9e3', handles: 'bar' },
    { t: 'bookshelf', room: 'pokoj-kuby', x: 8.6, z: 3.45, r: PI, w: 0.8, h: 1.6, shelves: 4, color: '#ece9e3' },
    { t: 'rug', room: 'pokoj-kuby', x: 7.0, z: 2.3, r: 0, w: 1.6, d: 1.2, color: '#c9d6de', border: '#3a5f9a', pattern: 'stripes' },
    { t: 'beanbag', room: 'pokoj-kuby', x: 6.4, z: 2.9, color: '#d9483b' },
    { t: 'picture', room: 'pokoj-kuby', x: 7.7, z: 3.6, r: PI, y: 1.25, w: 0.6, h: 0.85, art: 'photo', tone: '#2f4f74', frame: '#f2efe8' },

    { t: 'bed', room: 'sypialnia', x: 7.3, z: 4.8, r: 0, w: 1.6, l: 2.0, head: '#7f8a7a', duvet: '#ece6da', throw: '#b5654a', deco: '#56634f' },
    { t: 'nightstand', room: 'sypialnia', x: 6.17, z: 3.95, r: 0, color: '#efe9df', top: '#b98d5f' },
    { t: 'nightstand', room: 'sypialnia', x: 8.43, z: 3.95, r: 0, color: '#efe9df', top: '#b98d5f' },
    { t: 'dresser', room: 'sypialnia', x: 8.98, z: 7.05, r: -PI / 2, w: 0.9, color: '#efe9df', top: '#b98d5f' },
    { t: 'armchair', room: 'sypialnia', x: 5.85, z: 7.45, r: PI * 0.75, color: '#c9b9a3' },
    { t: 'rug', room: 'sypialnia', x: 7.3, z: 5.3, r: 0, w: 2.4, d: 1.7, color: '#e3dccd', border: '#9f8f7a', pattern: 'border' },
    { t: 'curtain', room: 'sypialnia', x: 7.3, z: 8.0, r: PI, w: 2.2, h: 2.5, color: '#9fa98f' },
    { t: 'plant', room: 'sypialnia', x: 5.6, z: 4.0, kind: 'olive', s: 0.75 },

    { t: 'wardrobe', room: 'garderoba', x: 3.41, z: 6.95, r: PI / 2, w: 2.1, d: 0.6, h: 2.3, color: '#ece9e3', doors: 4, handles: 'long', handleCol: '#2b2c2f' },
    { t: 'dresser', room: 'garderoba', x: 4.6, z: 7.8, r: PI, w: 0.8, d: 0.4 },
    { t: 'rug', room: 'korytarz', x: 3.65, z: 2.9, r: PI / 2, w: 2.4, d: 0.7, color: '#c9b9a3', border: '#8f6e55', pattern: 'stripes' },
    { t: 'picture', room: 'korytarz', x: 3.1, z: 2.0, r: PI / 2, y: 1.3, w: 0.5, h: 0.7, art: 'lines', frame: '#2b2c2f' },

    { t: 'canopy', room: 'hol', x: 3.7, z: -0.2, r: PI, y: 2.35, w: 1.9, d: 1.1, ext: true },
    { t: 'houseNumber', room: 'hol', x: 4.75, z: -0.2, r: PI, y: 1.75, ext: true },
    { t: 'gardenSet', room: 'taras', x: 6.6, z: 9.9, r: 0, umbrella: '#e9e2d4' },
    { t: 'grill', room: 'taras', x: 9.25, z: 10.8, r: 0 },
    { t: 'plant', room: 'taras', x: 9.5, z: 8.8, kind: 'olive', s: 0.9, pot: '#b5654a' }
  ],
  lights: [
    { t: 'flush', room: 'hol', x: 3.65, z: 1.3, circuit: 'L2' },
    { t: 'flush', room: 'hol', x: 3.65, z: 4.2, circuit: 'L2' },
    { t: 'pendant', room: 'kuchnia', x: 6.65, z: 2.35, style: 'dome', drop: 0.95, color: '#2b2c2f', circuit: 'L1' },
    { t: 'pendant', room: 'kuchnia', x: 7.65, z: 2.35, style: 'dome', drop: 0.95, color: '#2b2c2f', circuit: 'L1' },
    { t: 'downlight', room: 'kuchnia', x: 5.9, z: 0.95, circuit: 'L1' },
    { t: 'downlight', room: 'kuchnia', x: 8.55, z: 0.95, circuit: 'L1' },
    { t: 'pendant', room: 'salon', x: 7.2, z: 4.8, style: 'drum', drop: 0.8, color: '#e8dfcf', circuit: 'L1' },
    { t: 'pendant', room: 'salon', x: 4.15, z: 6.9, style: 'globe', drop: 0.85, circuit: 'L1' },
    { t: 'flush', room: 'wc', x: 1.5, z: 3.5, rad: 0.14, circuit: 'L2' },
    { t: 'flush', room: 'techniczne', x: 1.5, z: 1.3, circuit: 'L2' },
    { t: 'pendant', room: 'goscinny', x: 1.5, z: 6.3, style: 'cone', drop: 0.6, color: '#e8dfcf', circuit: 'L2' },
    { t: 'outdoor', room: 'hol', x: 2.45, z: -0.2, r: PI, y: 1.95, ext: true, circuit: 'L4' },
    { t: 'outdoor', room: 'taras', x: 5.45, z: 8.4, r: 0, y: 2.2, ext: true, circuit: 'L4' },
    { t: 'outdoor', room: 'taras', x: 8.65, z: 8.4, r: 0, y: 2.2, ext: true, circuit: 'L4' },

    { t: 'flush', room: 'korytarz', x: 3.65, z: 1.0, circuit: 'L3' },
    { t: 'flush', room: 'korytarz', x: 3.65, z: 4.9, circuit: 'L3' },
    { t: 'pendant', room: 'gabinet', x: 1.5, z: 1.05, style: 'cone', drop: 0.55, color: '#2b2c2f', circuit: 'L3' },
    { t: 'downlight', room: 'lazienka', x: 1.0, z: 2.8, circuit: 'L3' },
    { t: 'downlight', room: 'lazienka', x: 2.2, z: 2.8, circuit: 'L3' },
    { t: 'downlight', room: 'lazienka', x: 1.0, z: 3.95, circuit: 'L3' },
    { t: 'downlight', room: 'lazienka', x: 2.2, z: 3.95, circuit: 'L3' },
    { t: 'pendant', room: 'pokoj-zosi', x: 1.5, z: 6.4, style: 'drum', drop: 0.6, color: '#f0d2cc', circuit: 'L3' },
    { t: 'pendant', room: 'pokoj-kuby', x: 7.3, z: 1.9, style: 'drum', drop: 0.6, color: '#d6dde2', circuit: 'L3' },
    { t: 'pendant', room: 'sypialnia', x: 7.3, z: 5.9, style: 'drum', drop: 0.65, color: '#e8dfcf', circuit: 'L3' },
    { t: 'flush', room: 'garderoba', x: 4.15, z: 6.9, circuit: 'L3' }
  ],
  circuits: [
    { id: 'L1', label: 'Światło kuchnia, salon', kind: 'light', rooms: ['kuchnia', 'salon'], breaker: 'B10' },
    { id: 'L2', label: 'Światło hol, WC, techniczne, gościnny', kind: 'light', rooms: ['hol', 'wc', 'techniczne', 'goscinny'], breaker: 'B10' },
    { id: 'L3', label: 'Światło piętro', kind: 'light', rooms: ['korytarz', 'gabinet', 'lazienka', 'pokoj-zosi', 'pokoj-kuby', 'sypialnia', 'garderoba'], breaker: 'B10' },
    { id: 'L4', label: 'Światło zewnętrzne', kind: 'light', rooms: ['taras', 'hol'], breaker: 'B10' },
    { id: 'G1', label: 'Gniazda salon', kind: 'socket', rooms: ['salon', 'taras'], breaker: 'B16' },
    { id: 'G2', label: 'Gniazda kuchnia', kind: 'socket', rooms: ['kuchnia'], breaker: 'B16' },
    { id: 'G3', label: 'Gniazda hol, WC, techniczne, gościnny', kind: 'socket', rooms: ['hol', 'wc', 'techniczne', 'goscinny'], breaker: 'B16' },
    { id: 'G4', label: 'Gniazda piętro', kind: 'socket', rooms: ['korytarz', 'gabinet', 'pokoj-zosi', 'pokoj-kuby', 'sypialnia', 'garderoba'], breaker: 'B16' },
    { id: 'G5', label: 'Gniazda łazienka', kind: 'socket', rooms: ['lazienka'], breaker: 'B16' },
    { id: 'K1', label: 'Płyta indukcyjna', kind: 'appliance', rooms: ['kuchnia'], breaker: 'C20' },
    { id: 'K2', label: 'Zmywarka i lodówka', kind: 'appliance', rooms: ['kuchnia'], breaker: 'B16' },
    { id: 'P1', label: 'Pralka i suszarka', kind: 'appliance', rooms: ['techniczne'], breaker: 'B16' },
    { id: 'H1', label: 'Kocioł gazowy', kind: 'heating', rooms: ['techniczne'], breaker: 'B10' },
    { id: 'Z1', label: 'Gniazda zewnętrzne, brama', kind: 'socket', rooms: ['taras'], breaker: 'B16' }
  ],
  panel: { room: 'hol', x: 3.1, z: 0.62, y: 1.62, nx: 1, nz: 0, rows: 3, slotsPerRow: 18 },
  rack: { room: 'techniczne', x: 0.2, z: 1.3, y: 1.55, nx: 1, nz: 0, units: 9 },
  wan: { room: 'techniczne', x: 0.2, z: 0.55, y: 0.5, nx: 1, nz: 0 },
  tablets: [
    { id: 'tablet-hol', room: 'hol', kind: 'wall', x: 4.73, z: 0.2, nx: 0, nz: 1, y: 1.45, rating: 'good', why: 'W holu obok drzwi wejściowych: wychodząc, gasisz cały dom jednym dotknięciem, a kabel z szafy w technicznym biegnie krótko pod sufitem holu.' },
    { id: 'tablet-kuchnia', room: 'kuchnia', kind: 'wall', x: 5.32, z: 3.15, nx: 1, nz: 0, y: 1.45, rating: 'good', why: 'Ściana między kuchnią a salonem, z dala od okien, gniazdo tuż obok.' },
    { id: 'tablet-wyspa', room: 'kuchnia', kind: 'surface', x: 6.45, z: 2.25, y: 0.9, r: PI, rating: 'ok', why: 'Na wyspie pod ręką, ale stoi przy płycie i zbiera tłuszcz.' },
    { id: 'tablet-salon', room: 'salon', kind: 'wall', x: 9.2, z: 6.8, nx: -1, nz: 0, y: 1.45, rating: 'poor', why: 'Przy tarasie: słońce z okien odbija się w ekranie, zimna ściana zewnętrzna.' }
  ],
  zones: [
    { id: 'strefa-wejscie', kind: 'entrance', pos: [3.7, -0.15, -2.2], r: 2 },
    { id: 'strefa-podjazd', kind: 'driveway', pos: [12.2, -0.45, -3.5], r: 4.5 },
    { id: 'strefa-brama', kind: 'gate', pos: [11.4, -0.45, -8.3], r: 2.5 },
    { id: 'strefa-ogrod', kind: 'garden', pos: [6.0, -0.45, 18.0], r: 7 },
    { id: 'strefa-taras', kind: 'terrace', pos: [7.2, 0.4, 9.8], r: 2.5 },
    { id: 'strefa-ulica', kind: 'street', pos: [11.4, -0.5, -13.0], r: 5 }
  ],
  extraMounts: [
    { id: 'brama-slupek', kind: 'gate', pos: [9.3, -0.45 + 1.2, -8.05], normal: [0, 0, 1], tags: ['gate', 'driveway'] },
    { id: 'furtka-slupek', kind: 'gate', pos: [8.66, -0.45 + 1.3, -8.05], normal: [0, 0, 1], tags: ['wicket', 'intercom'] }
  ],
  street: [11.4, -0.5, -13.0],
  approach: [[11.4, -0.5, -13.0], [8.1, -0.45, -9.0], [8.1, -0.45, -2.6], [3.7, -0.45, -2.6], [3.7, 0, -0.9]],
  views: { dollhouse: { az: 0.62, el: 0.62, dist: 1.0, sunAz: 330, sunEl: 48 }, close: { pos: [8.6, 1.55, 6.9], target: [5.6, 1.0, 1.0], fov: 62 } },
  site(api) { buildSite(api); },
  roof(api) { buildRoof(api); }
};

function ground(x, z) {
  const inPlot = x > -7.2 && x < 18.2 && z > -8.2 && z < 30.2;
  if (inPlot) return -0.45;
  const n = (noise2(x * 0.05, z * 0.05, 11) - 0.5) * 0.6;
  const street = z < -8 && z > -17;
  return street ? -0.5 : -0.45 + n * Math.min(1, Math.max(0, (Math.min(Math.abs(x - 5), Math.abs(z - 11)) - 14) / 10));
}

function buildSite(api) {
  const S = makeSite(api, { ground });
  const g = S.g;
  const house = (x, z, pad = 0.25) => x > -0.2 - pad && x < 9.6 + pad && z > -0.2 - pad && z < 8.4 + pad;
  const drive = (x, z) => x > 9.4 && x < 14.6 && z > -8.2 && z < 3.2;
  const pathA = (x, z) => (x > 7.5 && x < 8.7 && z > -8.2 && z < -2.0) || (x > 3.0 && x < 8.7 && z > -3.1 && z < -1.9) || (x > 3.0 && x < 4.4 && z > -1.9 && z < -0.2);
  const terr = (x, z) => x > 4.4 && x < 10.1 && z > 8.2 && z < 11.6;
  const bed = (x, z) => (z > 8.4 && z < 9.3 && x > -0.2 && x < 4.3) || (x > -0.9 && x < -0.25 && z > 0.3 && z < 8.0);
  S.terrain({
    x0: -46, z0: -40, x1: 56, z1: 62, cell: 1.15,
    flat: (x, z) => x > -8 && x < 19 && z > -9 && z < 31,
    color: (x, z, y, out) => {
      lawnColor(x, z, out);
      if (bed(x, z)) out.set('#6b5440');
      if (z < -8.1 && z > -17.2) out.set('#8a8780');
      return out;
    },
    hole: (x, z) => x > 0.4 && x < 9.0 && z > 0.4 && z < 7.8
  });
  const PAV = { type: 'tiles', color: '#6d6b67', size: [0.2, 0.1], grout: '#5a5855', vary: 0.07, bond: 0.5 };
  S.pave([9.4, -8.2, 14.6, 3.2], -0.43, PAV, 21);
  S.pave([7.5, -8.2, 8.7, -3.1], -0.43, { ...PAV, color: '#8f8c86', grout: '#77746f' }, 22);
  S.pave([3.0, -3.1, 8.7, -1.9], -0.43, { ...PAV, color: '#8f8c86', grout: '#77746f' }, 23);
  g.use('satin');
  for (let i = 0; i < 3; i++) g.bx(3.0, -0.45, -1.9 + i * 0.35, 4.4, -0.3 + i * 0.15, -0.2, C(i % 2 ? '#a19d96' : '#aaa69f'), { top: C('#b3afa8') });
  g.bx(4.4, -0.45, 8.2, 10.1, -0.01, 11.6, C('#77746f'), { top: C('#6f6c67') });
  for (let i = 0; i < 2; i++) g.bx(5.6 + i * 0.0, -0.45, 11.6, 7.4, -0.3 + i * 0.0, 11.95 + i * 0.0, C('#9d9a93'));
  S.pave([-30, -17.2, 45, -10.8], -0.5, { type: 'flat', color: '#56595b' });
  S.pave([-30, -10.6, 45, -8.3], -0.45, { type: 'tiles', color: '#9d9a94', size: [0.3, 0.3], grout: '#85827d', vary: 0.04 }, 24);
  S.kerb([-30, -10.7], [45, -10.7], -0.48, 0.08);
  S.kerb([-30, -17.3], [45, -17.3], -0.48, 0.08);
  S.panelFence([-7, -8.2], [7.4, -8.2], { h: 1.4 });
  S.panelFence([14.8, -8.2], [18, -8.2], { h: 1.4 });
  S.panelFence([-7, -8.2], [-7, 30], { h: 1.4, base: 0.12, color: '#3d4a3a' });
  S.panelFence([18, -8.2], [18, 30], { h: 1.4, base: 0.12, color: '#3d4a3a' });
  S.panelFence([-7, 30], [18, 30], { h: 1.4, base: 0.12, color: '#3d4a3a' });
  S.swingGate([9.3, -8.2], [14.8, -8.2], { h: 1.45 });
  S.swingGate([7.4, -8.2], [8.85, -8.2], { h: 1.45, leaves: 1 });
  g.use('satin');
  g.bx(8.95, -0.45, -8.45, 9.25, 1.15, -8.0, C('#9d9a93'));
  g.use('metal');
  g.bx(8.98, 0.75, -8.47, 9.22, 1.0, -8.45, C('#2f3236'));
  g.bx(9.02, 0.85, -8.48, 9.18, 0.95, -8.47, C('#5d6b74'));
  g.bx(8.93, 0.3, -8.25, 9.27, 0.65, -7.9, C('#3b3e43'));
  S.item('trashBins', 15.8, -0.45, -7.4, PI, { cols: ['#2b2c2f', '#e3c25a', '#3f7fbf', '#4f8a4a'] });
  S.car(12.0, -3.4, PI, { color: '#aeb3b8', kind: 'suv' });
  S.item('trampoline', 12.5, -0.45, 21, 0, { rad: 1.7 });
  S.item('swing', 2.5, -0.45, 26.5, 0.15);
  S.item('sandbox', 0.8, -0.45, 14.0, 0.2);
  S.item('shed', -4.6, -0.45, 27.2, 0.0, { w: 2.6, d: 2.0 });
  S.item('lounger', 10.9, -0.45, 13.4, -0.5);
  for (const [x, z] of [[-3, 18], [2.5, 18]]) { g.use('metal'); g.cyl(x, -0.45, z, 0.03, 0.03, 1.9, 6, C('#9a9da1')); }
  g.use('matte');
  for (let i = 0; i < 4; i++) g.line([-3, 1.35 - i * 0.0, 18 + 0.0], [2.5, 1.35, 18], 0.004, C('#efefea'), 3);
  for (const [x, c] of [[-1.5, '#e9e4d8'], [-0.9, '#7d8fa8'], [0.2, '#c9785a'], [1.0, '#efe9dc']]) g.bx(x, 0.85, 17.99, x + 0.4, 1.33, 18.01, C(c));
  const trees = [];
  for (let z = -6.5; z < 29.5; z += 0.85) { trees.push(['thuja', -6.4, z, 0.85 + hash(z, 1) * 0.25]); if (z > 4 || z < -7) trees.push(['thuja', 17.4, z, 0.85 + hash(z, 2) * 0.25]); }
  for (let x = -5.6; x < 17; x += 0.9) trees.push(['thuja', x, 29.4, 0.9 + hash(x, 3) * 0.2]);
  S.trees(trees);
  S.trees([['apple', 3.5, 21.5, 1.0], ['apple', 7.5, 25.0, 0.9], ['birch', -3.8, 14.0, 1.0], ['birch', 15.0, 16.0, 0.95], ['maple', 13.5, 26.5, 1.0], ['spruce', -4.5, 22.0, 0.75], ['bush', 16.2, 9.0, 0.8], ['bush', -5.5, 5.0, 0.7], ['bush', -5.5, -5.5, 0.7]]);
  S.trees([['flowers', 0.5, 8.85, 1.0], ['flowers', 2.2, 8.85, 1.0], ['flowers', 3.6, 8.85, 0.9], ['flowers', -0.55, 1.5, 0.8], ['flowers', -0.55, 4.0, 0.8], ['flowers', -0.55, 6.5, 0.8], ['grasses', 10.6, 8.6, 1.0], ['grasses', 10.6, 7.0, 0.9], ['boxball', 2.6, -1.5, 0.8], ['boxball', 4.8, -1.5, 0.8]]);
  S.trees([['linden', -16, -12.5, 1.0], ['linden', 4, -12.8, 0.95], ['linden', 24, -12.6, 1.05], ['maple', -24, 12, 1.0], ['birch', 30, 18, 1.0], ['pine', -20, 30, 1.0], ['pine', 32, 30, 1.0], ['spruce', 26, -2, 0.9]]);
  S.house({ x: -19, z: 6, w: 10, d: 9, h: 5.6, roof: 'gable', color: '#e9e2d6', roofCol: '#8f4a35', r: 0 });
  S.house({ x: 31, z: 4, w: 11, d: 9, h: 3.2, roofH: 3.4, roof: 'gable', color: '#e2ddd5', roofCol: '#3d3f43', r: PI / 2 });
  S.house({ x: 2, z: -27, w: 10, d: 9, h: 5.4, roof: 'hip', color: '#ebe4d6', roofCol: '#6d5446', r: 0 });
  S.house({ x: 22, z: -26, w: 12, d: 10, h: 5.8, roof: 'gable', color: '#e7e7e2', roofCol: '#3d3f43', r: 0 });
  for (const x of [-12, 8, 28]) streetLamp(S, x, -10.1);
  S.car(-8, -13, PI / 2, { color: '#7a1f1f', kind: 'hatch' });
  const inLawn = (x, z) => x > -6.2 && x < 17.2 && z > -7.6 && z < 29 && !house(x, z, 0.6) && !drive(x, z) && !pathA(x, z) && !terr(x, z) && !bed(x, z) && !(Math.hypot(x - 0.8, z - 14) < 1.0) && !(x > -6 && x < -3 && z > 26);
  S.scatter(5200, inLawn, 31, 0.8, 1.35, -7, -8, 18, 30);
  S.scatter(1800, (x, z) => (x < -7.5 || x > 18.5 || z > 30.5) && Math.hypot(x - 5, z - 11) < 38, 32, 0.8, 1.3, -30, -8, 40, 50);
  S.finish();
}

function streetLamp(S, x, z) {
  const g = S.g;
  g.use('metal');
  g.cyl(x, -0.45, z, 0.08, 0.06, 0.4, 8, C('#3a3d42'));
  g.cyl(x, -0.05, z, 0.05, 0.035, 5.6, 6, C('#3a3d42'));
  g.line([x, 5.5, z], [x, 5.7, z - 0.9], 0.03, C('#3a3d42'), 5);
  g.bx(x - 0.15, 5.6, z - 1.15, x + 0.15, 5.7, z - 0.75, C('#3a3d42'));
  g.use('gloss');
  g.bx(x - 0.12, 5.58, z - 1.12, x + 0.12, 5.6, z - 0.78, C('#f2ead8'));
}

function buildRoof(api) {
  const g = new api.Geo();
  const base = 2.95 + 2.6 + 0.3, x0 = -0.75, x1 = 10.15, z0 = -0.8, z1 = 9.0, zr = 4.1, ridge = base + 3.4;
  const tile = C('#3d3f43');
  g.use('satin');
  for (const za of [z0, z1]) {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const zA = za + (zr - za) * t0, zB = za + (zr - za) * t1, yA = base - 0.12 + (ridge - base + 0.12) * t0, yB = base - 0.12 + (ridge - base + 0.12) * t1;
      const c = tile.clone().multiplyScalar(0.92 + (i % 2) * 0.08);
      g.face([[x0, yA, zA], [x1, yA, zA], [x1, yB + 0.03, zB], [x0, yB + 0.03, zB]], [4.7, base - 5, 4.1], c);
      g.face([[x0, yA - 0.04, zA], [x1, yA - 0.04, zA], [x1, yB - 0.04, zB], [x0, yB - 0.04, zB]], [4.7, base + 20, 4.1], C('#d9d2c4'));
    }
  }
  g.bx(x0 - 0.02, ridge - 0.05, zr - 0.14, x1 + 0.02, ridge + 0.12, zr + 0.14, C('#2f3135'));
  for (const x of [-0.2, 9.6]) g.face([[x, base, -0.2], [x, base, 8.4], [x, ridge - 0.1, zr]], [4.7, base, 4.1], C('#ece8e0'));
  for (const x of [-0.2, 9.6]) g.face([[x, base, -0.2], [x, base, 8.4], [x, ridge - 0.1, zr]], [x < 1 ? 9 : -9, base, 4.1], C('#ece8e0'));
  g.bx(1.0, ridge - 1.2, 2.8, 1.6, ridge + 0.9, 3.4, C('#7b7268'), { top: C('#4a4642') });
  g.use('metal');
  for (const z of [z0 - 0.06, z1 + 0.06]) g.line([x0, base - 0.18, z], [x1, base - 0.18, z], 0.07, C('#3b3e43'), 8);
  g.line([-0.6, base - 0.18, z0 - 0.06], [-0.6, -0.4, z0 - 0.06], 0.045, C('#3b3e43'), 6);
  g.line([10.0, base - 0.18, z1 + 0.06], [10.0, -0.4, z1 + 0.06], 0.045, C('#3b3e43'), 6);
  g.use('gloss');
  for (const [x, za] of [[2.0, z1], [7.0, z1]]) {
    const t = 0.35, zz = za + (zr - za) * t, yy = base - 0.12 + (ridge - base + 0.12) * t;
    g.face([[x - 0.4, yy + 0.06, zz], [x + 0.4, yy + 0.06, zz], [x + 0.4, yy + 0.06 + 0.5, zz + (zr - za) * 0.12], [x - 0.4, yy + 0.06 + 0.5, zz + (zr - za) * 0.12]], [x, base, 4.1], C('#3a4652'));
  }
  api.addGeo(g, api.roofGroup, { name: 'roof' });
}

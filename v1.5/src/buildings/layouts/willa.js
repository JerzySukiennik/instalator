// Instalator buildings: Willa w Konstancinie, a 280 m2 modern flat-roofed villa with a double EV garage, roof terrace, pool garden and sliding gate.

import { C, shade, hash, rng, noise2, smooth } from '../geo.js';
import { P } from '../palette.js';
import { makeSite, lawnColor } from '../exterior.js';

const PI = Math.PI, Y1 = 3.2;
const STONE = { type: 'tiles', color: '#d3cec6', size: [1.2, 0.6], grout: '#bdb8af', vary: 0.03, bond: 0.5 };
const HERR = { type: 'herringbone', color: '#b48a5e', w: 0.1, L: 0.6, vary: 0.07 };
const BATHF = { type: 'tiles', color: '#4f4c49', size: [1.2, 0.6], grout: '#3f3d3a', vary: 0.03 };
const BATHW = { color: '#efede9', tiles: { h: 2.8, color: '#e7e3dc', size: [1.2, 0.6], grout: '#d2cdc4' } };

export default {
  id: 'willa',
  name: 'Willa w Konstancinie',
  floors: [
    { index: 0, y: 0, height: 2.9, name: 'Parter', slab: 0.3 },
    { index: 1, y: Y1, height: 2.8, name: 'Piętro', slab: 0.3 }
  ],
  plinth: 0.35,
  plinthH: 0.2,
  topExtra: 0.3,
  radiators: false,
  palette: { facade: '#efede8', plinth: '#3f4145', frame: '#2c2f33', glassFrame: '#2c2f33', door: '#f1efea', doorFrame: '#f1efea', base: '#f1efea', sill: '#e6e3dd', extDoor: '#2c2f33', section: '#45403a', flashing: '#2c2f33', windowDark: true },
  facadeAt: (W, u, y) => (y > Y1 + 0.05 && (W.side === 'N' || W.side === 'S' || W.side === 'E') ? '#8e6a4b' : null),
  walls: [
    { id: 'wN', floor: 0, a: [0, 0], b: [19, 0], t: 0.45, ext: true, open: [
      { id: 'brama-garaz', at: 0.75, w: 4.8, kind: 'door', head: 2.3, garage: true, leaf: 'none' },
      { id: 'drzwi-wejsciowe', at: 7.4, w: 1.2, kind: 'door', head: 2.45, entrance: true, hinge: 'a', leafCol: '#2c2f33' },
      { at: 8.75, w: 0.6, kind: 'glass', sill: 0.05, head: 2.45, panes: 1 },
      { at: 10.6, w: 0.7, kind: 'window', sill: 1.55, head: 2.3 },
      { at: 12.5, w: 1.5, kind: 'window', sill: 0.85, head: 2.4 },
      { at: 15.6, w: 2.6, kind: 'window', sill: 1.05, head: 2.4, panes: 2 }
    ] },
    { id: 'wE', floor: 0, a: [19, 0], b: [19, 10.6], t: 0.45, ext: true, open: [
      { at: 3.4, w: 1.3, kind: 'window', sill: 1.05, head: 2.4 },
      { at: 6.0, w: 3.6, kind: 'glass', sill: 0.05, head: 2.75, panes: 3 }
    ] },
    { id: 'wS', floor: 0, a: [0, 10.6], b: [19, 10.6], t: 0.45, ext: true, open: [
      { at: 4.0, w: 1.2, kind: 'window', sill: 1.2, head: 2.4 },
      { id: 'przeszklenie', at: 7.4, w: 10.4, kind: 'glass', sill: 0.0, head: 2.75, panes: 5, slide: true }
    ] },
    { id: 'wW', floor: 0, a: [0, 0], b: [0, 10.6], t: 0.45, ext: true, open: [{ at: 2.4, w: 1.6, kind: 'window', sill: 1.5, head: 2.3 }] },
    { id: 'G', floor: 0, a: [6.3, 0], b: [6.3, 10.6], t: 0.25, open: [
      { id: 'drzwi-garaz', at: 1.0, w: 0.9, kind: 'door', head: 2.1, hinge: 'a', swing: -1, angle: 80 },
      { id: 'drzwi-pralnia', at: 7.0, w: 0.9, kind: 'door', head: 2.1, hinge: 'b', swing: 1, angle: 70 }
    ] },
    { id: 'GT', floor: 0, a: [0, 6.7], b: [6.3, 6.7], t: 0.2, open: [{ id: 'drzwi-techniczne', at: 1.2, w: 0.9, kind: 'door', head: 2.1, hinge: 'a', swing: 1, angle: 80 }] },
    { id: 'TL', floor: 0, a: [3.1, 6.7], b: [3.1, 10.6], t: 0.12 },
    { id: 'NB', floor: 0, a: [6.3, 4.3], b: [14.6, 4.3], t: 0.2, open: [
      { id: 'przejscie-hol', at: 1.7, w: 1.6, kind: 'arch', head: 2.4 },
      { id: 'drzwi-gabinet', at: 6.1, w: 0.9, kind: 'door', head: 2.2, hinge: 'a', swing: -1, style: 'glass', angle: 80 }
    ] },
    { id: 'HW', floor: 0, a: [10.0, 0], b: [10.0, 4.3], t: 0.12, open: [
      { id: 'drzwi-wc', at: 0.6, w: 0.8, kind: 'door', head: 2.1, hinge: 'a', swing: -1, angle: 70 },
      { id: 'drzwi-garderoba', at: 2.8, w: 0.9, kind: 'door', head: 2.1, hinge: 'b', swing: -1, angle: 80 }
    ] },
    { id: 'WCC', floor: 0, a: [10.0, 2.3], b: [11.9, 2.3], t: 0.12 },
    { id: 'CO', floor: 0, a: [11.9, 0], b: [11.9, 4.3], t: 0.12 },
    { id: 'OK', floor: 0, a: [14.6, 0], b: [14.6, 4.3], t: 0.15 },

    { id: 'wN1', floor: 1, a: [6.3, 0], b: [19, 0], t: 0.45, ext: true, open: [
      { at: 3.9, w: 1.6, kind: 'window', sill: 0.85, head: 2.4 },
      { at: 7.3, w: 0.8, kind: 'window', sill: 1.5, head: 2.3 },
      { at: 9.9, w: 1.6, kind: 'window', sill: 0.85, head: 2.4 }
    ] },
    { id: 'wE1', floor: 1, a: [19, 0], b: [19, 10.6], t: 0.45, ext: true, open: [
      { at: 1.4, w: 1.6, kind: 'window', sill: 0.85, head: 2.4 },
      { at: 6.6, w: 2.4, kind: 'window', sill: 0.6, head: 2.5, panes: 2 }
    ] },
    { id: 'wS1', floor: 1, a: [6.3, 10.6], b: [19, 10.6], t: 0.45, ext: true, open: [
      { at: 0.5, w: 2.1, kind: 'glass', sill: 0.05, head: 2.6, panes: 2 },
      { at: 3.5, w: 1.4, kind: 'window', sill: 1.3, head: 2.4 },
      { at: 7.6, w: 4.4, kind: 'glass', sill: 0.05, head: 2.6, panes: 3, slide: true }
    ] },
    { id: 'wW1', floor: 1, a: [6.3, 0], b: [6.3, 10.6], t: 0.45, ext: true, open: [
      { at: 1.0, w: 2.0, kind: 'glass', sill: 0.5, head: 2.5, panes: 2 },
      { id: 'drzwi-taras-gorny', at: 5.2, w: 1.0, kind: 'glass', sill: 0.0, head: 2.4, panes: 1, slide: true }
    ] },
    { id: 'GAL', floor: 1, a: [9.2, 0], b: [9.2, 10.6], t: 0.12, open: [
      { id: 'drzwi-pokoj-1', at: 1.6, w: 0.9, kind: 'door', head: 2.15, hinge: 'a', swing: -1, angle: 80 },
      { id: 'przejscie-korytarz', at: 4.52, w: 1.18, kind: 'arch', head: 2.4 }
    ] },
    { id: 'C1', floor: 1, a: [9.2, 4.46], b: [19, 4.46], t: 0.12, open: [
      { id: 'drzwi-lazienka-2', at: 4.2, w: 0.8, kind: 'door', head: 2.15, hinge: 'a', swing: -1, angle: 75 },
      { id: 'drzwi-pokoj-2', at: 6.4, w: 0.9, kind: 'door', head: 2.15, hinge: 'a', swing: -1, angle: 80 }
    ] },
    { id: 'C2', floor: 1, a: [9.2, 5.76], b: [19, 5.76], t: 0.12, open: [{ id: 'drzwi-sypialnia', at: 4.8, w: 0.9, kind: 'door', head: 2.15, hinge: 'b', swing: 1, angle: 85 }] },
    { id: 'R1', floor: 1, a: [12.96, 0], b: [12.96, 4.46], t: 0.12 },
    { id: 'R2', floor: 1, a: [15.06, 0], b: [15.06, 4.46], t: 0.12 },
    { id: 'R3', floor: 1, a: [11.66, 5.76], b: [11.66, 10.6], t: 0.12, open: [{ id: 'drzwi-garderoba-gorna', at: 0.5, w: 0.8, kind: 'door', head: 2.15, hinge: 'a', swing: -1, angle: 75 }] },
    { id: 'R4', floor: 1, a: [13.34, 5.76], b: [13.34, 10.6], t: 0.12, open: [{ id: 'przejscie-garderoba', at: 0.6, w: 0.85, kind: 'arch', head: 2.15 }] }
  ],
  rooms: [
    { id: 'garaz', name: 'Garaż', kind: 'garage', poly: [[0, 0], [6.3, 0], [6.3, 6.7], [0, 6.7]], floorFinish: { type: 'concrete', color: '#9a978f', cell: 0.5 }, wall: '#e7e5e0', noBase: true },
    { id: 'techniczne', name: 'Pomieszczenie techniczne', kind: 'tech', poly: [[0, 6.7], [3.1, 6.7], [3.1, 10.6], [0, 10.6]], floorFinish: { type: 'tiles', color: '#8d8a85', size: [0.6, 0.6], grout: '#77746f' }, wall: '#ebe9e4' },
    { id: 'pralnia', name: 'Pralnia i spiżarnia', kind: 'tech', poly: [[3.1, 6.7], [6.3, 6.7], [6.3, 10.6], [3.1, 10.6]], floorFinish: { type: 'tiles', color: '#b9b4ab', size: [0.6, 0.6], grout: '#a29d94' }, wall: '#ebe9e4' },
    { id: 'hol', name: 'Hol', kind: 'hall', poly: [[6.3, 0], [10.0, 0], [10.0, 4.3], [6.3, 4.3]], floorFinish: STONE, wall: '#ecebe7' },
    { id: 'wc', name: 'WC', kind: 'wc', poly: [[10.0, 0], [11.9, 0], [11.9, 2.3], [10.0, 2.3]], floorFinish: BATHF, wall: { color: '#ecebe7', tiles: { h: 1.25, color: '#55524e', size: [0.6, 0.3], grout: '#45423f' } } },
    { id: 'garderoba', name: 'Garderoba', kind: 'hall', poly: [[10.0, 2.3], [11.9, 2.3], [11.9, 4.3], [10.0, 4.3]], floorFinish: STONE, wall: '#ecebe7', noOutlets: true },
    { id: 'gabinet', name: 'Gabinet', kind: 'office', poly: [[11.9, 0], [14.6, 0], [14.6, 4.3], [11.9, 4.3]], floorFinish: HERR, wall: '#e3ddd3', accent: [{ wall: 'OK', color: '#55504a' }] },
    { id: 'kuchnia', name: 'Kuchnia', kind: 'kitchen', poly: [[14.6, 0], [19.0, 0], [19.0, 5.2], [14.6, 5.2]], floorFinish: STONE, wall: '#efede9' },
    { id: 'salon', name: 'Salon z jadalnią', kind: 'living', poly: [[6.3, 4.3], [14.6, 4.3], [14.6, 5.2], [19.0, 5.2], [19.0, 10.6], [6.3, 10.6]], floorFinish: HERR, wall: '#efede9', accent: [{ wall: 'NB', color: '#8a8682' }] },
    { id: 'taras', name: 'Taras', kind: 'terrace', poly: [[6.3, 10.6], [19.6, 10.6], [19.6, 13.6], [6.3, 13.6]], floorFinish: { type: 'tiles', color: '#c9c3b8', size: [1.2, 0.6], grout: '#aaa398', vary: 0.04 } },

    { id: 'galeria', name: 'Galeria', kind: 'hall', floor: 1, poly: [[6.3, 0], [9.2, 0], [9.2, 10.6], [6.3, 10.6], [6.3, 7.9], [7.6, 7.9], [7.6, 4.5], [6.3, 4.5]], floorFinish: HERR, wall: '#efede9' },
    { id: 'korytarz', name: 'Korytarz', kind: 'hall', floor: 1, poly: [[9.2, 4.46], [19, 4.46], [19, 5.76], [9.2, 5.76]], floorFinish: HERR, wall: '#efede9' },
    { id: 'pokoj-1', name: 'Pokój Antka', kind: 'bed', floor: 1, poly: [[9.2, 0], [12.96, 0], [12.96, 4.46], [9.2, 4.46]], floorFinish: HERR, wall: '#dfe3e3', accent: [{ wall: 'R1', color: '#3f4b57' }] },
    { id: 'lazienka-2', name: 'Łazienka dzieci', kind: 'bath', floor: 1, poly: [[12.96, 0], [15.06, 0], [15.06, 4.46], [12.96, 4.46]], floorFinish: BATHF, wall: BATHW },
    { id: 'pokoj-2', name: 'Pokój Mai', kind: 'bed', floor: 1, poly: [[15.06, 0], [19, 0], [19, 4.46], [15.06, 4.46]], floorFinish: HERR, wall: '#ece3dc', accent: [{ wall: 'R2', color: '#c9a99a' }] },
    { id: 'lazienka', name: 'Łazienka główna', kind: 'bath', floor: 1, poly: [[9.2, 5.76], [11.66, 5.76], [11.66, 10.6], [9.2, 10.6]], floorFinish: BATHF, wall: { color: '#efede9', tiles: { h: 2.8, color: '#e9e6e0', size: [1.2, 0.6], grout: '#d6d1c8' } } },
    { id: 'garderoba-2', name: 'Garderoba', kind: 'hall', floor: 1, poly: [[11.66, 5.76], [13.34, 5.76], [13.34, 10.6], [11.66, 10.6]], floorFinish: HERR, wall: '#efede9', noOutlets: true },
    { id: 'sypialnia', name: 'Sypialnia główna', kind: 'bed', floor: 1, poly: [[13.34, 5.76], [19, 5.76], [19, 10.6], [13.34, 10.6]], floorFinish: HERR, wall: '#e8e2d8', accent: [{ wall: 'C2', color: '#6c5a4b' }] },
    { id: 'taras-gorny', name: 'Taras na garażu', kind: 'terrace', floor: 1, poly: [[0, 0], [6.3, 0], [6.3, 10.6], [0, 10.6]], floorFinish: { type: 'deck', color: '#8e6a4b', dir: 'z', w: 0.14, len: [2.4, 4.0], vary: 0.08, gap: 0.008 } }
  ],
  voids: [{ floor: 1, x0: 6.525, z0: 4.5, x1: 7.6, z1: 7.9 }],
  stairs: [{ floor: 0, x: 7.02, z: 9.0, dir: [0, -1], w: 1.1, n: 17, run: 0.265, closed: false, stringers: [-1], rail: 1, railCol: '#2c2f33', tread: '#b48a5e', stringer: '#ecebe7' }],
  railings: [
    { floor: 1, pts: [[7.6, 4.5], [7.6, 7.9], [6.525, 7.9]], glass: true, col: '#2c2f33' },
    { floor: 1, pts: [[0.25, 0.25], [6.05, 0.25]], glass: true, col: '#2c2f33' },
    { floor: 1, pts: [[0.25, 0.25], [0.25, 10.35]], glass: true, col: '#2c2f33' },
    { floor: 1, pts: [[0.25, 10.35], [6.05, 10.35]], glass: true, col: '#2c2f33' }
  ],
  items: [
    { t: 'kitchen', room: 'kuchnia', x: 16.75, z: 0.525, r: 0, mods: [{ t: 'fridge', w: 0.6 }, { t: 'oven', w: 0.6, tall: true }, { t: 'drawers', w: 0.6 }, { t: 'sink', w: 0.9 }, { t: 'dw', w: 0.6 }, { t: 'drawers', w: 0.75 }], upper: false, splashCol: '#e9e6e0', front: '#2b2c2f', carcass: '#2b2c2f', worktop: '#e9e6e0', worktopMat: 'gloss', handle: 'groove', clutter: ['coffee', 'board', 'herbs', 'fruit'], tallH: 2.4 },
    { t: 'island', room: 'kuchnia', x: 16.75, z: 3.0, r: 0, w: 3.0, d: 1.0, front: '#2b2c2f', worktop: '#ece9e4', waterfall: true, hob: 0.75, stools: 4, stoolCol: '#8e6a4b', handle: 'groove' },
    { t: 'diningTable', room: 'salon', x: 16.4, z: 7.0, r: 0, w: 2.2, d: 1.0, chairs: 6, chair: 'black', top: '#6e4a33', leg: '#2b2c2f' },
    { t: 'sofa', room: 'salon', x: 11.0, z: 8.3, r: PI, w: 3.3, d: 1.0, chaise: -1, chaiseD: 1.8, chaiseW: 1.0, color: '#c4beb4', leg: '#2b2c2f', legH: 0.08, pillows: ['#6c5a4b', '#e6e1d8', '#8e6a4b', '#e6e1d8'] },
    { t: 'armchair', room: 'salon', x: 13.1, z: 6.6, r: -PI / 2 - 0.4, color: '#8d5a37', leg: '#2b2c2f' },
    { t: 'rug', room: 'salon', x: 11.0, z: 7.0, r: 0, w: 3.6, d: 2.6, color: '#d6d0c6', border: '#9c958a', pattern: 'border' },
    { t: 'coffeeTable', room: 'salon', x: 11.0, z: 6.85, r: 0, w: 1.3, d: 0.75, top: '#2b2c2f', leg: '#2b2c2f', h: 0.36 },
    { t: 'tvStand', room: 'salon', x: 11.0, z: 4.63, r: 0, w: 2.6, d: 0.42, h: 0.42, tv: 75, color: '#5c4030', wood: '#6e4a33', legs: false },
    { t: 'floorLamp', room: 'salon', x: 9.1, z: 9.2, r: 0.6, style: 'arc', color: '#2b2c2f' },
    { t: 'plant', room: 'salon', x: 18.25, z: 9.9, kind: 'ficus', s: 1.25, pot: '#3a3c40' },
    { t: 'plant', room: 'salon', x: 8.0, z: 5.0, kind: 'monstera', s: 1.0, pot: '#ece9e4' },
    { t: 'sideboard', room: 'salon', x: 18.55, z: 6.9, r: -PI / 2, w: 2.0, d: 0.45, h: 0.72, color: '#6e4a33', doors: 4 },

    { t: 'bench', room: 'hol', x: 9.75, z: 1.9, r: -PI / 2, w: 1.0, d: 0.36, color: '#6e4a33', cushion: '#c4beb4' },
    { t: 'mirror', room: 'hol', x: 9.94, z: 1.9, r: -PI / 2, y: 0.6, w: 0.7, h: 1.5, frame: '#2b2c2f' },
    { t: 'plant', room: 'hol', x: 6.8, z: 0.75, kind: 'olive', s: 1.0, pot: '#3a3c40' },
    { t: 'rug', room: 'hol', x: 8.0, z: 2.0, r: 0, w: 1.8, d: 1.2, color: '#8f8a83', border: '#5c5852', pattern: 'border' },
    { t: 'toilet', room: 'wc', x: 11.0, z: 0.225, r: 0, hung: true },
    { t: 'vanity', room: 'wc', x: 11.78, z: 1.6, r: -PI / 2, w: 0.5, d: 0.36, color: '#2b2c2f' },
    { t: 'mirror', room: 'wc', x: 11.84, z: 1.6, r: -PI / 2, y: 1.12, w: 0.45, round: true, frame: '#b89b5e', noData: true },
    { t: 'wardrobe', room: 'garderoba', x: 11.5, z: 3.3, r: -PI / 2, w: 1.8, d: 0.6, h: 2.4, doors: 3, color: '#ecebe7', handles: 'none' },
    { t: 'desk', room: 'gabinet', x: 13.25, z: 0.6, r: 0, w: 1.6, d: 0.7, monitor: true, drawers: true, top: '#6e4a33', leg: '#2b2c2f' },
    { t: 'bookshelf', room: 'gabinet', x: 14.32, z: 2.8, r: -PI / 2, w: 0.9, h: 2.2, color: '#2b2c2f', shelves: 6 },
    { t: 'armchair', room: 'gabinet', x: 12.5, z: 3.4, r: 0.6, color: '#8d5a37' },

    { t: 'car', room: 'garaz', x: 1.65, z: 3.4, r: PI, color: '#f0efeb', kind: 'suv' },
    { t: 'car', room: 'garaz', x: 4.75, z: 3.4, r: PI, color: '#30353b', kind: 'sedan' },
    { t: 'shelfUnit', room: 'garaz', x: 3.6, z: 6.35, r: PI, w: 1.6, d: 0.45, h: 2.0, shelves: 5 },
    { t: 'bike', room: 'garaz', x: 5.75, z: 5.4, r: 0.1, color: '#2f6b8a' },
    { t: 'workbench', room: 'garaz', x: 0.58, z: 5.6, r: PI / 2, w: 1.6, d: 0.6 },
    { t: 'heatPump', room: 'taras', x: 18.3, z: 12.6, r: PI, w: 1.0, h: 0.8 },
    { t: 'waterHeater', room: 'techniczne', x: 0.6, z: 9.95, r: 0, h: 1.9, rad: 0.3 },
    { t: 'waterHeater', room: 'techniczne', x: 1.3, z: 9.95, r: 0, h: 1.5, color: '#9ea2a6' },
    { t: 'shelfUnit', room: 'techniczne', x: 2.55, z: 10.1, r: PI, w: 0.8, d: 0.4, h: 1.8 },
    { t: 'washer', room: 'pralnia', x: 3.55, z: 10.08, r: PI },
    { t: 'washer', room: 'pralnia', x: 3.55, z: 10.08, r: PI, y: 0.87, h: 0.82 },
    { t: 'utilitySink', room: 'pralnia', x: 4.25, z: 10.1, r: PI },
    { t: 'shelfUnit', room: 'pralnia', x: 5.85, z: 8.7, r: -PI / 2, w: 1.8, d: 0.5, h: 2.1, shelves: 5, boxCols: ['#e9e4d8', '#c9a77a', '#d8d2c4', '#8a3b2f', '#e3c25a', '#f0eee9'] },

    { t: 'bed', room: 'pokoj-1', x: 10.5, z: 1.3, r: 0, w: 1.2, l: 2.0, frame: '#2b2c2f', duvet: '#3f4b57', throw: '#d9682f' },
    { t: 'desk', room: 'pokoj-1', x: 12.4, z: 3.3, r: -PI / 2, w: 1.4, d: 0.7, monitor: true, top: '#2b2c2f', leg: '#2b2c2f', chairCol: '#d9483b' },
    { t: 'wardrobe', room: 'pokoj-1', x: 9.56, z: 3.4, r: PI / 2, w: 1.4, d: 0.58, h: 2.4, color: '#ecebe7', handles: 'none' },
    { t: 'beanbag', room: 'pokoj-1', x: 11.2, z: 3.6, color: '#3f4b57' },
    { t: 'rug', room: 'pokoj-1', x: 11.0, z: 2.9, w: 1.4, round: true, color: '#9fb0bd', border: '#3f4b57' },
    { t: 'bathtub', room: 'lazienka-2', x: 14.0, z: 0.6, r: 0, w: 1.7, d: 0.75 },
    { t: 'vanity', room: 'lazienka-2', x: 14.7, z: 2.6, r: -PI / 2, w: 0.9, d: 0.46, color: '#6e4a33' },
    { t: 'mirror', room: 'lazienka-2', x: 14.94, z: 2.6, r: -PI / 2, y: 1.1, w: 0.8, h: 0.8, noData: true },
    { t: 'toilet', room: 'lazienka-2', x: 13.08, z: 3.4, r: PI / 2, hung: true },
    { t: 'towelRail', room: 'lazienka-2', x: 13.4, z: 4.4, r: PI, y: 0.3, w: 0.5, h: 1.1, towel: '#d9b9a0' },
    { t: 'bed', room: 'pokoj-2', x: 17.0, z: 1.28, r: 0, w: 1.4, l: 2.0, head: '#d8b9ae', duvet: '#f1e6df', throw: '#c9a99a', deco: '#e9a9a0' },
    { t: 'nightstand', room: 'pokoj-2', x: 18.45, z: 0.45, r: 0, color: '#f2efe9' },
    { t: 'desk', room: 'pokoj-2', x: 15.5, z: 3.0, r: PI / 2, w: 1.1, d: 0.55, monitor: false, laptop: true, top: '#f2efe9', leg: '#f2efe9', chairCol: '#e9a9a0' },
    { t: 'wardrobe', room: 'pokoj-2', x: 18.45, z: 3.4, r: -PI / 2, w: 1.4, d: 0.58, h: 2.4, color: '#f2efe9', handles: 'none' },
    { t: 'rug', room: 'pokoj-2', x: 17.0, z: 3.3, w: 1.3, round: true, color: '#efd0c8', border: '#c9a99a' },
    { t: 'toyBox', room: 'pokoj-2', x: 16.4, z: 4.05, r: PI, color: '#efe3cf' },

    { t: 'bed', room: 'sypialnia', x: 16.2, z: 6.95, r: 0, w: 1.8, l: 2.05, head: '#6c5a4b', duvet: '#efebe3', throw: '#8e6a4b', deco: '#c4beb4', headH: 1.15 },
    { t: 'nightstand', room: 'sypialnia', x: 14.92, z: 6.05, r: 0, color: '#6e4a33', top: '#6e4a33' },
    { t: 'nightstand', room: 'sypialnia', x: 17.48, z: 6.05, r: 0, color: '#6e4a33', top: '#6e4a33' },
    { t: 'armchair', room: 'sypialnia', x: 18.2, z: 9.7, r: -PI * 0.8, color: '#c4beb4' },
    { t: 'rug', room: 'sypialnia', x: 16.2, z: 7.5, r: 0, w: 2.8, d: 2.0, color: '#ddd6cb', border: '#8e8678', pattern: 'border' },
    { t: 'dresser', room: 'sypialnia', x: 13.65, z: 9.0, r: PI / 2, w: 1.2, color: '#6e4a33', top: '#6e4a33' },
    { t: 'plant', room: 'sypialnia', x: 13.75, z: 10.1, kind: 'olive', s: 0.9, pot: '#3a3c40' },
    { t: 'shower', room: 'lazienka', x: 9.75, z: 9.85, r: 0, w: 1.0, d: 1.2, glass: 'side' },
    { t: 'bathtub', room: 'lazienka', x: 10.6, z: 6.3, r: 0, w: 1.7, d: 0.8, panel: '#f6f5f2' },
    { t: 'vanity', room: 'lazienka', x: 11.55, z: 8.4, r: -PI / 2, w: 1.4, d: 0.5, double: true, color: '#6e4a33' },
    { t: 'mirror', room: 'lazienka', x: 11.6, z: 8.4, r: -PI / 2, y: 1.1, w: 1.3, h: 0.9, noData: true },
    { t: 'toilet', room: 'lazienka', x: 9.32, z: 7.9, r: PI / 2, hung: true },
    { t: 'towelRail', room: 'lazienka', x: 9.32, z: 8.9, r: PI / 2, y: 0.3, w: 0.5, h: 1.2, towel: '#c4beb4' },
    { t: 'wardrobe', room: 'garderoba-2', x: 11.98, z: 8.6, r: PI / 2, w: 2.8, d: 0.6, h: 2.5, doors: 5, color: '#ecebe7', handles: 'long', handleCol: '#2b2c2f' },
    { t: 'wardrobe', room: 'garderoba-2', x: 13.0, z: 8.6, r: -PI / 2, w: 2.8, d: 0.6, h: 2.5, doors: 5, color: '#ecebe7', handles: 'long', handleCol: '#2b2c2f' },
    { t: 'bench', room: 'galeria', x: 8.85, z: 2.4, r: -PI / 2, w: 1.2, d: 0.4, color: '#6e4a33' },
    { t: 'plant', room: 'galeria', x: 6.75, z: 9.9, kind: 'monstera', s: 0.9, pot: '#ece9e4' },
    { t: 'picture', room: 'galeria', x: 9.2, z: 9.0, r: -PI / 2, y: 1.2, w: 1.0, h: 0.7, art: 'abstract', cols: ['#8e6a4b', '#c4beb4', '#3f4b57'] },
    { t: 'lounger', room: 'taras-gorny', x: 2.2, z: 7.0, r: PI * 0.85, color: '#ece9e4' },
    { t: 'lounger', room: 'taras-gorny', x: 3.5, z: 7.2, r: PI * 0.8, color: '#ece9e4' },
    { t: 'plant', room: 'taras-gorny', x: 5.6, z: 9.7, kind: 'olive', s: 1.1, pot: '#3a3c40' },
    { t: 'gardenSet', room: 'taras', x: 9.0, z: 12.2, r: 0, color: '#3a3c40', umbrella: '#ece9e4' },
    { t: 'canopy', room: 'hol', x: 8.0, z: -0.225, r: PI, y: 2.65, w: 3.0, d: 1.4, ext: true, color: '#2c2f33', soffit: '#8e6a4b' },
    { t: 'houseNumber', room: 'hol', x: 6.9, z: -0.225, r: PI, y: 1.6, ext: true }
  ],
  lights: [
    { t: 'downlight', room: 'hol', x: 7.4, z: 1.2, color: '#2c2f33', circuit: 'L3' },
    { t: 'downlight', room: 'hol', x: 8.9, z: 1.2, color: '#2c2f33', circuit: 'L3' },
    { t: 'downlight', room: 'hol', x: 8.1, z: 3.3, color: '#2c2f33', circuit: 'L3' },
    { t: 'flush', room: 'wc', x: 10.95, z: 1.2, rad: 0.14, circuit: 'L3' },
    { t: 'flush', room: 'garderoba', x: 10.95, z: 3.3, circuit: 'L3' },
    { t: 'pendant', room: 'gabinet', x: 13.25, z: 1.6, style: 'dome', drop: 0.85, color: '#b89b5e', circuit: 'L3' },
    { t: 'pendant', room: 'kuchnia', x: 15.95, z: 3.0, style: 'globe', drop: 1.05, circuit: 'L2' },
    { t: 'pendant', room: 'kuchnia', x: 16.75, z: 3.0, style: 'globe', drop: 1.05, circuit: 'L2' },
    { t: 'pendant', room: 'kuchnia', x: 17.55, z: 3.0, style: 'globe', drop: 1.05, circuit: 'L2' },
    { t: 'downlight', room: 'kuchnia', x: 15.6, z: 1.0, color: '#2c2f33', circuit: 'L2' },
    { t: 'downlight', room: 'kuchnia', x: 17.9, z: 1.0, color: '#2c2f33', circuit: 'L2' },
    { t: 'pendant', room: 'salon', x: 15.9, z: 7.0, style: 'dome', drop: 1.15, color: '#2c2f33', circuit: 'L1' },
    { t: 'pendant', room: 'salon', x: 16.9, z: 7.0, style: 'dome', drop: 1.15, color: '#2c2f33', circuit: 'L1' },
    { t: 'downlight', room: 'salon', x: 9.6, z: 6.0, color: '#2c2f33', circuit: 'L1' },
    { t: 'downlight', room: 'salon', x: 12.4, z: 6.0, color: '#2c2f33', circuit: 'L1' },
    { t: 'downlight', room: 'salon', x: 9.6, z: 8.8, color: '#2c2f33', circuit: 'L1' },
    { t: 'downlight', room: 'salon', x: 12.4, z: 8.8, color: '#2c2f33', circuit: 'L1' },
    { t: 'flush', room: 'garaz', x: 1.6, z: 3.3, rad: 0.2, circuit: 'L4' },
    { t: 'flush', room: 'garaz', x: 4.7, z: 3.3, rad: 0.2, circuit: 'L4' },
    { t: 'flush', room: 'techniczne', x: 1.6, z: 8.6, circuit: 'L4' },
    { t: 'flush', room: 'pralnia', x: 4.7, z: 8.6, circuit: 'L4' },
    { t: 'outdoor', room: 'hol', x: 6.6, z: -0.225, r: PI, y: 2.2, ext: true, style: 'cyl', circuit: 'L7' },
    { t: 'outdoor', room: 'garaz', x: 5.9, z: -0.225, r: PI, y: 2.4, ext: true, style: 'cyl', circuit: 'L7' },
    { t: 'outdoor', room: 'taras', x: 6.9, z: 10.825, r: 0, y: 2.4, ext: true, style: 'cyl', circuit: 'L7' },
    { t: 'outdoor', room: 'taras', x: 18.2, z: 10.825, r: 0, y: 2.4, ext: true, style: 'cyl', circuit: 'L7' },

    { t: 'outdoor', room: 'taras-gorny', x: 6.075, z: 4.6, r: -PI / 2, y: 2.3, ext: true, style: 'cyl', circuit: 'L5' },
    { t: 'downlight', room: 'galeria', x: 8.4, z: 1.5, color: '#2c2f33', circuit: 'L5' },
    { t: 'downlight', room: 'galeria', x: 8.4, z: 6.2, color: '#2c2f33', circuit: 'L5' },
    { t: 'downlight', room: 'galeria', x: 8.4, z: 9.3, color: '#2c2f33', circuit: 'L5' },
    { t: 'downlight', room: 'korytarz', x: 12.0, z: 5.1, color: '#2c2f33', circuit: 'L5' },
    { t: 'downlight', room: 'korytarz', x: 16.0, z: 5.1, color: '#2c2f33', circuit: 'L5' },
    { t: 'pendant', room: 'pokoj-1', x: 11.0, z: 2.2, style: 'cone', drop: 0.6, color: '#3f4b57', circuit: 'L5' },
    { t: 'pendant', room: 'pokoj-2', x: 17.0, z: 2.3, style: 'drum', drop: 0.6, color: '#efd0c8', circuit: 'L5' },
    { t: 'downlight', room: 'lazienka-2', x: 14.0, z: 1.4, circuit: 'L5' },
    { t: 'downlight', room: 'lazienka-2', x: 14.0, z: 3.2, circuit: 'L5' },
    { t: 'pendant', room: 'sypialnia', x: 16.2, z: 8.1, style: 'drum', drop: 0.7, color: '#e6e1d8', circuit: 'L6' },
    { t: 'downlight', room: 'lazienka', x: 10.4, z: 6.8, circuit: 'L6' },
    { t: 'downlight', room: 'lazienka', x: 10.4, z: 9.2, circuit: 'L6' },
    { t: 'flush', room: 'garderoba-2', x: 12.5, z: 7.4, circuit: 'L6' }
  ],
  circuits: [
    { id: 'L1', label: 'Światło salon i jadalnia', kind: 'light', rooms: ['salon'], breaker: 'B10' },
    { id: 'L2', label: 'Światło kuchnia', kind: 'light', rooms: ['kuchnia'], breaker: 'B10' },
    { id: 'L3', label: 'Światło hol, WC, garderoba, gabinet', kind: 'light', rooms: ['hol', 'wc', 'garderoba', 'gabinet'], breaker: 'B10' },
    { id: 'L4', label: 'Światło garaż, techniczne, pralnia', kind: 'light', rooms: ['garaz', 'techniczne', 'pralnia'], breaker: 'B10' },
    { id: 'L5', label: 'Światło piętro: galeria, dzieci, łazienka', kind: 'light', rooms: ['galeria', 'korytarz', 'pokoj-1', 'pokoj-2', 'lazienka-2', 'taras-gorny'], breaker: 'B10' },
    { id: 'L6', label: 'Światło sypialnia główna z łazienką', kind: 'light', rooms: ['sypialnia', 'lazienka', 'garderoba-2'], breaker: 'B10' },
    { id: 'L7', label: 'Światło zewnętrzne, taras, basen', kind: 'light', rooms: ['taras', 'hol', 'garaz'], breaker: 'B10' },
    { id: 'G1', label: 'Gniazda salon', kind: 'socket', rooms: ['salon'], breaker: 'B16' },
    { id: 'G2', label: 'Gniazda kuchnia', kind: 'socket', rooms: ['kuchnia'], breaker: 'B16' },
    { id: 'G3', label: 'Gniazda hol, gabinet, WC, garderoba', kind: 'socket', rooms: ['hol', 'gabinet', 'wc', 'garderoba'], breaker: 'B16' },
    { id: 'G4', label: 'Gniazda piętro', kind: 'socket', rooms: ['galeria', 'korytarz', 'pokoj-1', 'pokoj-2', 'sypialnia', 'garderoba-2', 'taras-gorny'], breaker: 'B16' },
    { id: 'G5', label: 'Gniazda łazienki', kind: 'socket', rooms: ['lazienka', 'lazienka-2'], breaker: 'B16' },
    { id: 'G6', label: 'Gniazda garaż, techniczne, pralnia', kind: 'socket', rooms: ['garaz', 'techniczne', 'pralnia'], breaker: 'B16' },
    { id: 'K1', label: 'Płyta indukcyjna (3F)', kind: 'appliance', rooms: ['kuchnia'], breaker: 'C20' },
    { id: 'K2', label: 'Piekarnik i zmywarka', kind: 'appliance', rooms: ['kuchnia'], breaker: 'B16' },
    { id: 'P1', label: 'Pralka i suszarka', kind: 'appliance', rooms: ['pralnia'], breaker: 'B16' },
    { id: 'EV', label: 'Ładowarka EV w garażu (3F)', kind: 'appliance', rooms: ['garaz'], breaker: 'C20' },
    { id: 'H1', label: 'Pompa ciepła (3F)', kind: 'heating', rooms: ['techniczne'], breaker: 'C20' },
    { id: 'H2', label: 'Ogrzewanie podłogowe, sterowanie', kind: 'heating', rooms: ['techniczne'], breaker: 'B10' },
    { id: 'B1', label: 'Pompa basenowa', kind: 'appliance', rooms: ['taras'], breaker: 'B16' },
    { id: 'Z1', label: 'Gniazda zewnętrzne, brama', kind: 'socket', rooms: ['taras', 'garaz'], breaker: 'B16' }
  ],
  panel: { room: 'techniczne', x: 3.04, z: 8.3, y: 1.6, nx: -1, nz: 0, rows: 5, slotsPerRow: 18, phases: 3 },
  rack: { room: 'techniczne', x: 0.225, z: 7.75, y: 1.5, nx: 1, nz: 0, units: 12 },
  wan: { room: 'techniczne', x: 0.225, z: 8.8, y: 0.5, nx: 1, nz: 0 },
  tablets: [
    { id: 'tablet-hol', room: 'hol', kind: 'wall', x: 6.425, z: 2.6, nx: 1, nz: 0, y: 1.45, rating: 'good', why: 'W holu przy wejściu, ściana od garażu: kabel PoE z technicznego tuż za ścianą, widać go od drzwi.' },
    { id: 'tablet-kuchnia', room: 'kuchnia', kind: 'wall', x: 14.675, z: 2.2, nx: 1, nz: 0, y: 1.45, rating: 'good', why: 'Ściana kuchni od gabinetu: w środku domu, z dala od przeszkleń, gniazdo za ścianą.' },
    { id: 'tablet-wyspa', room: 'kuchnia', kind: 'surface', x: 15.6, z: 2.65, y: 0.9, r: PI, rating: 'ok', why: 'Na wyspie przy płycie: wygodnie, ale tablet stoi w zasięgu tłuszczu i wody.' },
    { id: 'tablet-salon', room: 'salon', kind: 'wall', x: 18.775, z: 5.6, nx: -1, nz: 0, y: 1.45, rating: 'poor', why: 'Obok przeszklenia na wschód: rano słońce wali prosto w ekran.' },
    { id: 'tablet-galeria', room: 'galeria', kind: 'wall', x: 9.14, z: 3.4, nx: -1, nz: 0, y: 1.45, rating: 'ok', why: 'Na piętrze przy schodach: dobre na noc, ale za daleko od wejścia na główny panel.' }
  ],
  zones: [
    { id: 'strefa-wejscie', kind: 'entrance', pos: [8.0, -0.2, -1.6], r: 2.2 },
    { id: 'strefa-podjazd', kind: 'driveway', pos: [3.2, -0.2, -6.0], r: 4.5 },
    { id: 'strefa-garaz', kind: 'garage', pos: [3.2, -0.2, -1.2], r: 2.6 },
    { id: 'strefa-brama', kind: 'gate', pos: [3.0, -0.2, -13.6], r: 3 },
    { id: 'strefa-ogrod', kind: 'garden', pos: [12.0, -0.2, 24.0], r: 8 },
    { id: 'strefa-taras', kind: 'terrace', pos: [12.5, 0.4, 12.2], r: 3 },
    { id: 'strefa-basen', kind: 'terrace', pos: [13.0, -0.2, 17.2], r: 4 },
    { id: 'strefa-ulica', kind: 'street', pos: [3.0, -0.25, -19.0], r: 6 }
  ],
  extraMounts: [
    { id: 'brama-slupek', kind: 'gate', pos: [-0.35, 1.0, -13.75], normal: [0, 0, -1], tags: ['gate', 'sliding'] },
    { id: 'furtka-slupek', kind: 'gate', pos: [6.55, 1.25, -13.75], normal: [0, 0, -1], tags: ['wicket', 'intercom'] },
    { id: 'garaz-ev', kind: 'garage', floor: 0, pos: [0.225, 1.25, 2.6], normal: [1, 0, 0], tags: ['ev', 'wall'], circuit: 'EV' },
    { id: 'garaz-ev-2', kind: 'garage', floor: 0, pos: [0.225, 1.25, 4.4], normal: [1, 0, 0], tags: ['ev', 'wall'], circuit: 'EV' },
    { id: 'garaz-brama', kind: 'garage', floor: 0, pos: [3.15, 2.55, 0.225], normal: [0, 0, 1], tags: ['opener', 'ceiling-front'], circuit: 'G6' },
    { id: 'pompa-ciepla', kind: 'boiler', floor: 0, pos: [17.8, 0.5, 12.25], normal: [0, 0, 1], tags: ['heatpump'], circuit: 'H1' }
  ],
  street: [3.0, -0.25, -19.0],
  walk: { spawn: { pos: [7.95, -15.3], dir: [0, 1] }, bounds: [-12.2, -20, 34.2, 35.6] },
  approach: [[3.0, -0.25, -19.0], [6.0, -0.2, -13.8], [8.0, -0.2, -6.0], [8.0, 0.0, -0.9]],
  outdoorAll: false,
  views: { dollhouse: { az: 0.42, el: 0.64, dist: 1.12, sunAz: 330, sunEl: 47 }, close: { pos: [13.5, 1.6, 9.6], target: [9.0, 1.2, 4.6], fov: 64 } },
  extra(api) {
    const g = api.stat[1];
    g.use('matte');
    g.bx(0.0, Y1 - 0.3, 0.0, 6.3, Y1 - 0.006, 10.6, C('#45403a'), { top: C('#6f6a63') });
    g.use('satin');
    g.bx(-0.05, Y1 - 0.3, -0.05, 6.3, Y1 + 0.06, 0.2, C('#efede8'));
    g.bx(-0.05, Y1 - 0.3, 10.4, 6.3, Y1 + 0.06, 10.65, C('#efede8'));
    g.bx(-0.05, Y1 - 0.3, 0.2, 0.2, Y1 + 0.06, 10.4, C('#efede8'));
  },
  site(api) { buildSite(api); },
  roof(api) { buildRoof(api); }
};

function ground(x, z) {
  const inPlot = x > -12.5 && x < 34.5 && z > -14.2 && z < 36;
  if (inPlot) return -0.2;
  if (z < -14 && z > -24) return -0.25;
  return -0.2 + (noise2(x * 0.05, z * 0.05, 4) - 0.5) * 0.7 * smooth(0, 10, Math.max(x - 34.5, -12.5 - x, z - 36, 0));
}

function buildSite(api) {
  const S = makeSite(api, { ground });
  const g = S.g;
  const house = (x, z, p = 0.2) => x > -0.225 - p && x < 19.225 + p && z > -0.225 - p && z < 10.825 + p;
  const drive = (x, z) => x > -0.6 && x < 6.0 && z > -14 && z < -0.2;
  const walk = (x, z) => x > 6.9 && x < 9.1 && z > -14 && z < -0.2;
  const deck = (x, z) => x > 6.3 && x < 20.6 && z > 10.6 && z < 21.6;
  const pool = (x, z) => x > 8 && x < 18 && z > 14.8 && z < 19.4;
  S.terrain({
    x0: -50, z0: -40, x1: 70, z1: 70, cell: 1.25,
    flat: (x, z) => x > -13 && x < 35 && z > -15 && z < 37,
    color: (x, z, y, out) => {
      lawnColor(x, z, out);
      if (z < -14.1 && z > -24) out.set('#8a8780');
      if ((x > 19.6 && x < 21.0 && z > -0.5 && z < 10.5) || (x > -2.2 && x < -0.6 && z > 0 && z < 10)) out.set('#6b5440');
      return out;
    },
    hole: (x, z) => (x > 0.4 && x < 18.6 && z > 0.4 && z < 10.2) || (x > 6.6 && x < 20.3 && z > 13.9 && z < 21.3)
  });
  const GRAN = { type: 'tiles', color: '#7b7975', size: [0.3, 0.15], grout: '#5f5d5a', vary: 0.06, bond: 0.5 };
  S.pave([-0.6, -14, 6.0, -0.2], -0.18, GRAN, 61);
  S.pave([6.9, -14, 9.1, -0.2], -0.18, { type: 'tiles', color: '#c9c3b8', size: [1.0, 0.5], grout: '#aaa398', vary: 0.04 }, 62);
  g.use('satin');
  g.bx(6.3, -0.2, 10.6, 20.6, -0.01, 13.6, C('#77746f'));
  S.walk([6.3, 10.6, 20.6, 13.6], -0.01);
  S.block2('pool', [8.05, 17.1], [17.95, 17.1], 4.5, -1.7, 0.4);
  const DECK = { type: 'tiles', color: '#d3cec6', size: [1.0, 0.5], grout: '#b9b4ab', vary: 0.03 };
  S.pave([6.3, 13.6, 20.6, 14.6], -0.18, DECK, 63);
  S.pave([6.3, 19.6, 20.6, 21.6], -0.18, DECK, 64);
  S.pave([6.3, 14.6, 7.8, 19.6], -0.18, DECK, 65);
  S.pave([18.2, 14.6, 20.6, 19.6], -0.18, DECK, 66);
  g.use('gloss');
  g.bx(8.0, -1.6, 14.8, 18.0, -0.2, 15.0, C('#d6dfe2'));
  g.bx(8.0, -1.6, 19.2, 18.0, -0.2, 19.4, C('#d6dfe2'));
  g.bx(8.0, -1.6, 15.0, 8.2, -0.2, 19.2, C('#d6dfe2'));
  g.bx(17.8, -1.6, 15.0, 18.0, -0.2, 19.2, C('#d6dfe2'));
  g.bx(8.2, -1.6, 15.0, 17.8, -1.4, 19.2, C('#b9cdd2'));
  for (let i = 0; i < 3; i++) g.bx(8.2, -1.4 + i * 0.3, 15.0, 8.6 + i * 0.0, -1.1 + i * 0.3, 16.2 - i * 0.0, C('#e2e9eb'));
  g.use('satin');
  g.bx(7.8, -0.2, 14.6, 18.2, -0.12, 14.85, C('#e6e2db'));
  g.bx(7.8, -0.2, 19.35, 18.2, -0.12, 19.6, C('#e6e2db'));
  g.bx(7.8, -0.2, 14.85, 8.05, -0.12, 19.35, C('#e6e2db'));
  g.bx(17.95, -0.2, 14.85, 18.2, -0.12, 19.35, C('#e6e2db'));
  const water = S.water({ x0: 8.2, z0: 15.0, x1: 17.8, z1: 19.2, y: -0.3, bankZ: 14.0, farZ: 200 });
  water.material.uniforms.uDeep.value.set('#2f8fa8');
  water.material.uniforms.uShallow.value.set('#5fb7c8');
  water.material.uniforms.uBank.value.set('#d6dfe2');
  water.material.uniforms.uTree.value.set('#b9cdd2');
  water.material.uniforms.uFlow.value = 0.02;
  for (let i = 0; i < 4; i++) S.item('lounger', 9.2 + i * 1.3, -0.18, 20.6, PI, { color: '#ece9e4' });
  S.item('gardenSet', 19.0, -0.18, 16.5, PI / 2, { color: '#3a3c40', umbrella: '#ece9e4' });
  const fence = (a, b) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), n = Math.max(1, Math.round(L / 2.4));
    for (let i = 0; i <= n; i++) { const t = i / n; g.use('satin'); g.box(a[0] + dx * t, 0.75, a[1] + dz * t, 0.25, 1.9, 0.25, C('#4a4b4e')); }
    g.use('satin');
    const yaw = Math.atan2(-dz, dx);
    g.at((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2, yaw);
    for (let k = 0; k < 11; k++) g.bx(-L / 2, -0.05 + k * 0.155, -0.03, L / 2, 0.06 + k * 0.155, 0.03, C('#8a6648').clone().multiplyScalar(0.92 + hash(k, L) * 0.14));
    g.pop();
    S.block2('fence', a, b, 0.25, -0.5, 1.7);
  };
  fence([-12.2, -13.9], [-1.0, -13.9]);
  fence([9.6, -13.9], [34.2, -13.9]);
  fence([-12.2, -13.9], [-12.2, 35.6]);
  fence([34.2, -13.9], [34.2, 35.6]);
  fence([-12.2, 35.6], [34.2, 35.6]);
  S.slidingGate([-1.0, -13.9], [6.3, -13.9], { h: 1.7, slat: '#8a6648', id: 'brama' });
  g.use('satin');
  g.bx(6.3, -0.2, -14.1, 6.75, 1.9, -13.7, C('#4a4b4e'));
  g.bx(9.15, -0.2, -14.1, 9.6, 1.9, -13.7, C('#4a4b4e'));
  g.use('metal');
  if (api.fpp) { g.bx(6.76, 0.0, -13.86, 6.84, 1.65, -11.5, C('#2f3236')); S.block2('gateLeaf', [6.8, -13.86], [6.8, -11.5], 0.1, -0.2, 1.65); }
  else g.bx(6.75, 0.0, -13.94, 9.15, 1.65, -13.86, C('#2f3236'));
  api.addGate?.({ id: 'furtka', kind: 'wicket', a: [6.75, -13.9], b: [9.15, -13.9], open: !!api.fpp, y: -0.2 });
  g.bx(6.42, 1.0, -14.12, 6.68, 1.5, -14.1, C('#1d1e20'));
  g.bx(6.45, 1.35, -14.13, 6.65, 1.45, -14.12, C('#3a4652'));
  g.bx(9.2, 0.3, -14.15, 9.55, 0.75, -14.1, C('#2c2f33'));
  S.car(3.0, -7.0, PI, { color: '#5d6873', kind: 'suv' });
  for (const [x, z] of [[-6.5, 16], [-6.5, 19.2], [-3.4, 16], [-3.4, 19.2]]) {
    g.use('satin');
    g.bx(x - 1.1, -0.2, z - 0.6, x + 1.1, 0.25, z - 0.52, C('#8a6648'));
    g.bx(x - 1.1, -0.2, z + 0.52, x + 1.1, 0.25, z + 0.6, C('#8a6648'));
    g.bx(x - 1.1, -0.2, z - 0.52, x - 1.02, 0.25, z + 0.52, C('#8a6648'));
    g.bx(x + 1.02, -0.2, z - 0.52, x + 1.1, 0.25, z + 0.52, C('#8a6648'));
    g.use('matte');
    g.bx(x - 1.02, -0.2, z - 0.52, x + 1.02, 0.2, z + 0.52, C('#5e4936'));
    for (let i = 0; i < 6; i++) g.blob(x - 0.8 + i * 0.32, 0.32, z + (i % 2 ? 0.18 : -0.18), 0.16, 0.13, 0.16, i % 3 ? '#6f9a45' : '#8fb04a', i + Math.round(x * 3 + z), { detail: 0 });
  }
  S.item('bench', -5.0, -0.2, 22.2, PI, { w: 1.4, color: '#8a6648' });
  S.trees([['birch', -9.5, 14.0, 1.0], ['birch', -8.0, 23.5, 0.95], ['apple', -2.5, 25.5, 0.9], ['bush', -10.5, 5.0, 0.9], ['bush', -10.0, 9.0, 0.8], ['grasses', -1.5, 13.5, 1.0], ['grasses', 0.2, 13.0, 0.9]]);
  S.trees([['birch', 22, 2, 1.0], ['birch', 24, 5, 0.9], ['birch', 23, -3, 1.05], ['maple', 28, 26, 1.1], ['maple', -6, 28, 1.0], ['pine', -9, 12, 1.0], ['pine', -8, 20, 1.05], ['pine', 31, 12, 1.0], ['linden', 30, -9, 1.0], ['spruce', -9, -9, 0.9], ['apple', 4, 27, 0.9], ['bush', -3, -11, 0.9], ['bush', 12, -11, 1.0], ['bush', 21.5, 13, 0.9]]);
  const deco = [];
  for (let z = 0.5; z < 10.2; z += 0.95) { deco.push(['grasses', 20.3, z, 0.9 + hash(z, 3) * 0.3]); deco.push(['boxball', -1.4, z, 0.7 + hash(z, 4) * 0.2]); }
  for (let x = 10.0; x < 18.6; x += 1.2) deco.push(['boxball', x, -1.4, 0.75]);
  S.trees(deco);
  S.trees([['linden', -20, -19, 1.0], ['linden', 8, -19.5, 0.95], ['linden', 30, -19, 1.05]]);
  S.house({ x: -30, z: 10, w: 16, d: 11, h: 6.4, roof: 'flat', color: '#efede8', r: 0 });
  S.house({ x: 52, z: 14, w: 14, d: 12, h: 6.0, roof: 'hip', color: '#e7e1d6', roofCol: '#4a4b4e', r: 0 });
  S.house({ x: 10, z: -34, w: 15, d: 11, h: 6.2, roof: 'flat', color: '#e9e6e0', r: 0 });
  const lawn = (x, z) => x > -11.8 && x < 33.8 && z > -13.5 && z < 35.2 && !house(x, z, 0.6) && !drive(x, z) && !walk(x, z) && !deck(x, z) && !(x > -7.8 && x < -2.1 && z > 15.2 && z < 20.0);
  S.scatter(6500, lawn, 71, 0.85, 1.35, -12, -14, 34, 36);
  S.finish();
}

function buildRoof(api) {
  const g = new api.Geo();
  const top = Y1 + 2.8 + 0.3;
  g.use('satin');
  g.bx(6.08, top - 0.05, -0.225, 19.225, top + 0.15, 10.825, C('#5a5853'), { top: C('#6a6862') });
  g.bx(6.08, top + 0.15, -0.225, 19.225, top + 0.65, 0.1, C('#efede8'));
  g.bx(6.08, top + 0.15, 10.5, 19.225, top + 0.65, 10.825, C('#efede8'));
  g.bx(6.08, top + 0.15, 0.1, 6.4, top + 0.65, 10.5, C('#efede8'));
  g.bx(18.9, top + 0.15, 0.1, 19.225, top + 0.65, 10.5, C('#efede8'));
  g.use('gloss');
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
    const x = 8.0 + i * 2.1, z = 1.6 + j * 2.6;
    g.at(x, top + 0.3, z, 0, -0.18);
    g.bx(-0.95, 0, -1.1, 0.95, 0.04, 1.1, C('#1f2a38'));
    g.pop();
  }
  g.use('matte');
  g.bx(14.0, top + 0.15, 7.0, 15.2, top + 0.6, 8.2, C('#9a9894'));
  api.addGeo(g, api.roofGroup, { name: 'roof' });
}

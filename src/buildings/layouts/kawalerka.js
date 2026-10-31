// Instalator buildings: Kawalerka na Mokotowie, a 36 m2 studio on the top floor of a 4-storey 1970s block, park to the south.

import * as THREE from 'three';
import { C, shade, hash, rng } from '../geo.js';
import { P } from '../palette.js';
import { makeSite, lawnColor } from '../exterior.js';
import { smooth, noise2 } from '../geo.js';

const Y = 9.2, H = 2.6, PI = Math.PI;
const OAK = { type: 'planks', color: '#c39a6b', dir: 'x', w: 0.19, len: [1.0, 2.0], vary: 0.07 };

export default {
  id: 'kawalerka',
  name: 'Kawalerka na Mokotowie',
  floors: [{ index: 0, y: Y, height: H, name: 'Mieszkanie (3. piętro)', slab: 0.22 }],
  plinth: 0,
  topExtra: 0.22,
  palette: { facade: '#e7e2d7', plinth: '#e7e2d7', frame: '#f4f4f1', door: '#f1efe9', doorFrame: '#f3f1ec', base: '#f3f1ec', sill: '#efede8', extDoor: '#5b4a3c', section: '#46413b' },
  walls: [
    { id: 'wN', floor: 0, a: [-0.2, -0.125], b: [6.7, -0.125], t: 0.25, ext: true, open: [{ id: 'drzwi-wejsciowe', at: 2.65, w: 1.0, kind: 'door', head: 2.05, entrance: true, hinge: 'a', leafCol: '#6b5442', frameCol: '#5a4636' }] },
    { id: 'wS', floor: 0, a: [-0.2, 5.7], b: [6.7, 5.7], t: 0.4, ext: true, open: [
      { at: 0.9, w: 1.8, kind: 'window', sill: 0.85, head: 2.3, panes: 2 },
      { id: 'balkon-drzwi', at: 4.5, w: 0.9, kind: 'glass', sill: 0, head: 2.3, panes: 1, slide: true, dark: false },
      { at: 5.4, w: 1.1, kind: 'window', sill: 0.85, head: 2.3, panes: 1 }
    ] },
    { id: 'wW', floor: 0, a: [-0.2, -0.125], b: [-0.2, 5.7], t: 0.4, ext: true },
    { id: 'wE', floor: 0, a: [6.7, -0.125], b: [6.7, 5.7], t: 0.2, ext: true },
    { id: 'p1', floor: 0, a: [-0.2, 2.06], b: [3.96, 2.06], t: 0.12, open: [{ id: 'drzwi-pokoj', at: 2.8, w: 0.9, kind: 'door', head: 2.05, hinge: 'b', swing: 1, style: 'glass', angle: 80 }] },
    { id: 'p2', floor: 0, a: [2.0, -0.125], b: [2.0, 2.06], t: 0.12, open: [{ id: 'drzwi-lazienka', at: 1.075, w: 0.8, kind: 'door', head: 2.05, hinge: 'b', swing: 1, angle: 70 }] },
    { id: 'p3', floor: 0, a: [3.96, -0.125], b: [3.96, 2.06], t: 0.12 }
  ],
  rooms: [
    { id: 'lazienka', name: 'Łazienka', kind: 'bath', poly: [[-0.2, -0.125], [2.0, -0.125], [2.0, 2.06], [-0.2, 2.06]], floorFinish: { type: 'tiles', color: '#5d5b58', size: [0.6, 0.6], grout: '#4a4846', vary: 0.03 }, wall: { color: '#ece8e1', tiles: { h: 2.6, color: '#d9d4cb', size: [0.6, 0.3], grout: '#c4beb4' } }, ceiling: { color: '#f4f2ee' } },
    { id: 'przedpokoj', name: 'Przedpokój', kind: 'hall', poly: [[2.0, -0.125], [3.96, -0.125], [3.96, 2.06], [2.0, 2.06]], floorFinish: { type: 'tiles', color: '#b7b0a5', size: [0.6, 0.6], grout: '#a19a8f', vary: 0.03 }, wall: '#e9e4da' },
    { id: 'aneks', name: 'Aneks kuchenny', kind: 'kitchen', poly: [[3.96, -0.125], [6.7, -0.125], [6.7, 2.06], [3.96, 2.06]], floorFinish: OAK, wall: '#ece8e1' },
    { id: 'pokoj', name: 'Pokój dzienny', kind: 'living', poly: [[-0.2, 2.06], [3.96, 2.06], [6.7, 2.06], [6.7, 5.7], [-0.2, 5.7]], floorFinish: OAK, wall: '#ece8e1', accent: [{ wall: 'wW', color: '#9ba68e' }] },
    { id: 'balkon', name: 'Balkon', kind: 'balcony', poly: [[3.9, 5.7], [6.8, 5.7], [6.8, 7.15], [3.9, 7.15]], floorFinish: { type: 'tiles', color: '#9a8f82', size: [0.3, 0.3], grout: '#7d756b', vary: 0.05 } }
  ],
  items: [
    { t: 'kitchen', room: 'aneks', x: 5.01, z: 0.3, r: 0, mods: [{ t: 'fridge', w: 0.6 }, { t: 'sink', w: 0.8 }, { t: 'drawers', w: 0.58 }], front: '#f1efea', worktop: '#b98a5c', handle: 'bar', splashTiles: true, splashCol: '#f4f2ed', clutter: ['board', 'kettle', 'herbs'], uppers: [{ w: 0.6, t: 'none' }, { w: 0.8, t: 'cab' }, { w: 0.58, t: 'open' }] },
    { t: 'kitchen', room: 'aneks', x: 6.3, z: 0.825, r: -PI / 2, mods: [{ t: 'drawers', w: 0.6 }, { t: 'dw', w: 0.45 }, { t: 'hob', w: 0.6 }], front: '#f1efea', worktop: '#b98a5c', handle: 'bar', splashTiles: true, splashCol: '#f4f2ed', clutter: ['coffee', 'fruit'], uppers: [{ w: 0.6, t: 'cab' }, { w: 0.45, t: 'cab' }, { w: 0.6, t: 'hood' }], hood: 'black' },
    { t: 'diningTable', room: 'aneks', x: 5.35, z: 2.8, r: 0.35, w: 0.8, round: true, chairs: 2, chair: 'eames', top: '#ece9e3', leg: '#c8a77e' },
    { t: 'bed', room: 'pokoj', x: 1.07, z: 3.92, r: PI / 2, w: 1.4, l: 2.0, head: '#7d8b74', duvet: '#e8e2d6', throw: '#c99a3b', deco: '#b9694c' },
    { t: 'nightstand', room: 'pokoj', x: 0.21, z: 2.92, r: PI / 2, w: 0.42, d: 0.36, color: '#efe9df', top: '#c39a6b' },
    { t: 'nightstand', room: 'pokoj', x: 0.21, z: 4.92, r: PI / 2, w: 0.42, d: 0.36, color: '#efe9df', top: '#c39a6b', books: false },
    { t: 'dresser', room: 'pokoj', x: 1.2, z: 2.35, r: 0, w: 0.9, color: '#efe9df', top: '#c39a6b' },
    { t: 'bookshelf', room: 'pokoj', x: 2.12, z: 2.27, r: 0, w: 0.76, h: 1.9, color: '#efece6' },
    { t: 'sofa', room: 'pokoj', x: 3.52, z: 3.72, r: PI / 2, w: 1.96, d: 0.92, color: '#8f9295', pillows: ['#c99a3b', '#e6dfd2', '#9ba68e'], throw: '#c7b8a3' },
    { t: 'rug', room: 'pokoj', x: 4.7, z: 3.72, r: PI / 2, w: 2.0, d: 1.45, color: '#e2d9ca', border: '#b9694c', pattern: 'berber' },
    { t: 'coffeeTable', room: 'pokoj', x: 4.72, z: 3.72, r: PI / 2, w: 0.9, d: 0.5, top: '#c39a6b' },
    { t: 'tvStand', room: 'pokoj', x: 6.41, z: 3.72, r: -PI / 2, w: 1.4, d: 0.38, color: '#f0eee9', wood: '#c39a6b' },
    { t: 'tv', room: 'pokoj', x: 6.6, z: 3.72, r: -PI / 2, y: 1.0, inch: 50 },
    { t: 'floorLamp', room: 'pokoj', x: 3.25, z: 5.05, r: PI / 2, style: 'arc' },
    { t: 'plant', room: 'pokoj', x: 3.35, z: 5.1, kind: 'monstera', s: 0.9, pot: '#e9e4da' },
    { t: 'plant', room: 'pokoj', x: 6.25, z: 2.55, kind: 'snake', pot: '#c47a55' },
    { t: 'picture', room: 'pokoj', x: 0.0, z: 3.92, r: PI / 2, y: 1.25, w: 0.9, h: 0.6, art: 'landscape', frame: '#c39a6b' },
    { t: 'picture', room: 'pokoj', x: 2.6, z: 5.5, r: PI, y: 1.35, w: 0.4, h: 0.5, art: 'abstract' },
    { t: 'clock', room: 'aneks', x: 4.02, z: 1.4, r: PI / 2, y: 1.75, r2: 0.14 },
    { t: 'curtain', room: 'pokoj', x: 1.6, z: 5.5, r: PI, y: 0.0, w: 2.0, h: 2.5, color: '#c9b9a0' },
    { t: 'curtain', room: 'pokoj', x: 5.42, z: 5.5, r: PI, y: 0.0, w: 2.3, h: 2.5, color: '#c9b9a0' },
    { t: 'wardrobe', room: 'przedpokoj', x: 3.6, z: 0.95, r: -PI / 2, w: 1.2, d: 0.58, h: 2.35, color: '#ece8e0', mirror: 0, handles: 'bar' },
    { t: 'coatHooks', room: 'przedpokoj', x: 2.0, z: 1.92, r: PI / 2, y: 1.6, w: 0.3, n: 2, coats: ['#2e3a4b', '#b9b2a6'] },
    { t: 'box', room: 'przedpokoj', x: 2.35, z: 0.18, w: 0.5, d: 0.3, h: 0.05, color: '#3a3d42', mat: 'matte', noData: true },
    { t: 'shower', room: 'lazienka', x: 0.45, z: 0.45, r: 0, w: 0.9, d: 0.9, glass: 'corner' },
    { t: 'washer', room: 'lazienka', x: 1.62, z: 0.3, r: 0 },
    { t: 'toilet', room: 'lazienka', x: 0.5, z: 2.0, r: PI, hung: true },
    { t: 'vanity', room: 'lazienka', x: 0.0, z: 1.45, r: PI / 2, w: 0.6, d: 0.44, color: '#c39a6b' },
    { t: 'mirrorCabinet', room: 'lazienka', x: 0.0, z: 1.45, r: PI / 2, y: 1.15, w: 0.6, h: 0.65 },
    { t: 'towelRail', room: 'lazienka', x: 1.3, z: 2.0, r: PI, y: 0.25, w: 0.45, h: 1.1, towel: '#9fb2b8' },
    { t: 'laundry', room: 'lazienka', x: 1.6, z: 1.72, r: 0 },
    { t: 'chair', room: 'balkon', x: 4.6, z: 6.75, r: PI * 0.85, style: 'black' },
    { t: 'sideTable', room: 'balkon', x: 5.2, z: 6.8, r: 0, r2: 0.2, h: 0.55, top: '#2b2c2f' },
    { t: 'plant', room: 'balkon', x: 6.45, z: 6.85, kind: 'olive', s: 0.8, pot: '#b5654a' },
    { t: 'plant', room: 'balkon', x: 6.45, z: 6.25, kind: 'small', s: 1.2, pot: '#b5654a' }
  ],
  lights: [
    { t: 'pendant', room: 'pokoj', x: 4.7, z: 3.72, style: 'drum', drop: 0.65, color: '#ece5d8', circuit: 'L1' },
    { t: 'pendant', room: 'pokoj', x: 1.1, z: 3.92, style: 'dome', drop: 0.55, color: '#1f2023', circuit: 'L1' },
    { t: 'downlight', room: 'aneks', x: 4.55, z: 0.8, circuit: 'L2' },
    { t: 'downlight', room: 'aneks', x: 5.35, z: 0.8, circuit: 'L2' },
    { t: 'downlight', room: 'aneks', x: 5.75, z: 1.45, circuit: 'L2' },
    { t: 'flush', room: 'przedpokoj', x: 2.95, z: 1.0, circuit: 'L2' },
    { t: 'flush', room: 'lazienka', x: 1.0, z: 1.05, r: 0.15, circuit: 'L2' },
    { t: 'outdoor', room: 'balkon', x: 5.32, z: 5.9, r: 0, y: 2.2, ext: true, style: 'cyl', circuit: 'L1' }
  ],
  circuits: [
    { id: 'L1', label: 'Światło pokój, balkon', kind: 'light', rooms: ['pokoj', 'balkon'], breaker: 'B10' },
    { id: 'L2', label: 'Światło kuchnia, przedpokój, łazienka', kind: 'light', rooms: ['aneks', 'przedpokoj', 'lazienka'], breaker: 'B10' },
    { id: 'G1', label: 'Gniazda pokój, balkon', kind: 'socket', rooms: ['pokoj', 'balkon'], breaker: 'B16' },
    { id: 'G2', label: 'Gniazda kuchnia', kind: 'socket', rooms: ['aneks'], breaker: 'B16' },
    { id: 'G3', label: 'Gniazda łazienka, przedpokój', kind: 'socket', rooms: ['lazienka', 'przedpokoj'], breaker: 'B16' },
    { id: 'K1', label: 'Płyta indukcyjna', kind: 'appliance', rooms: ['aneks'], breaker: 'C20' },
    { id: 'P1', label: 'Pralka i zmywarka', kind: 'appliance', rooms: ['lazienka', 'aneks'], breaker: 'B16' }
  ],
  panel: { room: 'przedpokoj', x: 2.06, z: 0.42, y: 1.62, nx: 1, nz: 0, rows: 2, slotsPerRow: 12 },
  mediaBox: { room: 'przedpokoj', x: 2.06, z: 0.42, y: 0.78, nx: 1, nz: 0 },
  wan: { room: 'przedpokoj', x: 2.06, z: 0.42, y: 0.3, nx: 1, nz: 0 },
  tablets: [
    { id: 'tablet-przedpokoj', room: 'przedpokoj', kind: 'wall', x: 2.3, z: 2.0, nx: 0, nz: -1, y: 1.45, rating: 'good', why: 'Przy wejściu, obok skrzynki multimedialnej: krótki kabel PoE, widać go od drzwi.' },
    { id: 'tablet-pokoj', room: 'pokoj', kind: 'wall', x: 3.76, z: 2.12, nx: 0, nz: 1, y: 1.4, rating: 'ok', why: 'Między salonem a kuchnią, ale tuż przy drzwiach i trzeba dociągnąć zasilanie.' },
    { id: 'tablet-blat', room: 'aneks', kind: 'surface', x: 5.55, z: 0.3, y: 0.9, r: 0, rating: 'ok', why: 'Na blacie pod ręką, ale łatwo go zachlapać przy zlewie.' },
    { id: 'tablet-lozko', room: 'pokoj', kind: 'wall', x: 0.0, z: 2.75, nx: 1, nz: 0, y: 1.4, rating: 'poor', why: 'Przy łóżku: daleko od wejścia, na zimnej ścianie szczytowej, kabel przez cały pokój.' }
  ],
  zones: [
    { id: 'strefa-wejscie', kind: 'entrance', floor: 0, pos: [2.95, Y + 0.5, -1.0], r: 2 },
    { id: 'strefa-balkon', kind: 'terrace', floor: 0, pos: [5.35, Y + 0.5, 6.5], r: 1.6 },
    { id: 'strefa-ulica', kind: 'street', floor: 0, pos: [3.0, 0.5, -16.0], r: 6 }
  ],
  street: [3.0, 0, -16.5],
  approach: [[3.0, 0, -16.5], [3.0, 0, -11], [3.2, 0.8, -6.8], [3.2, Y, -2.2], [2.95, Y, -0.8]],
  views: { dollhouse: { az: -0.42, el: 0.56, dist: 1.05, sunAz: 315, sunEl: 46 }, close: { pos: [1.2, Y + 1.55, 4.9], target: [6.2, Y + 1.0, 1.6], fov: 60 } },
  outdoorSkip: () => false,
  extra(api) {
    const g = api.stat[0];
    g.use('satin');
    g.bx(3.9, Y - 0.2, 5.9, 6.8, Y - 0.004, 7.15, C('#b9b5ad'), { top: C('#8f877c') });
    g.use('matte');
    g.bx(6.72, Y, 5.9, 6.8, Y + 1.8, 7.15, C('#c9c6be'));
    g.use('metal');
    g.line([3.92, Y + 1.0, 7.12], [6.78, Y + 1.0, 7.12], 0.022, C('#3a3d42'), 6);
    g.line([3.92, Y + 1.0, 5.92], [3.92, Y + 1.0, 7.12], 0.022, C('#3a3d42'), 6);
    for (let i = 0; i <= 14; i++) g.line([3.92 + i * 0.2, Y, 7.12], [3.92 + i * 0.2, Y + 1.0, 7.12], i % 7 === 0 ? 0.018 : 0.008, C('#3a3d42'), 4);
    for (let i = 0; i <= 6; i++) g.line([3.92, Y, 5.92 + i * 0.2], [3.92, Y + 1.0, 5.92 + i * 0.2], 0.008, C('#3a3d42'), 4);
  },
  site(api) {
    buildSite(api);
  }
};

function buildSite(api) {
  const S = makeSite(api, { ground: () => 0 });
  const g = S.g;
  const facade = C('#e7e2d7'), accent = C('#a7b39c'), base = C('#77736c');
  const win = (x0, x1, y0, y1, z, out) => {
    g.use('matte');
    g.bx(x0 - 0.06, y0 - 0.06, Math.min(z, z + out * 0.02), x1 + 0.06, y1 + 0.06, Math.max(z, z + out * 0.02), C('#f3f2ee'));
    const glass = hash(x0, y0, z) < 0.3 ? '#5f6d76' : '#3b4852';
    g.bx(x0, y0, Math.min(z, z + out * 0.028), x1, y1, Math.max(z, z + out * 0.028), C(glass));
    if (x1 - x0 > 1.2) g.bx((x0 + x1) / 2 - 0.035, y0, Math.min(z, z + out * 0.032), (x0 + x1) / 2 + 0.035, y1, Math.max(z, z + out * 0.032), C('#f3f2ee'));
    if (hash(x1, y1, z) < 0.35) g.bx(x0, y0 + (y1 - y0) * 0.5, Math.min(z, z + out * 0.03), x1, y1, Math.max(z, z + out * 0.03), C('#d9d1c2'));
    g.bx(x0 - 0.08, y0 - 0.1, Math.min(z, z + out * 0.07), x1 + 0.08, y0 - 0.05, Math.max(z, z + out * 0.07), C('#9a9c9f'));
  };
  const X0 = -0.4, X1 = 33.4, Z0 = -6.6, Z1 = 5.9, levels = [0.8, 3.6, 6.4];
  g.use('satin');
  g.bx(X0, -0.4, Z0, X1, Y - 0.22, Z1, facade, { top: C('#77736c') });
  g.bx(X0 - 0.03, -0.4, Z0 - 0.03, X1 + 0.03, 0.75, Z1 + 0.03, base);
  for (const yy of levels) {
    g.bx(X0 - 0.015, yy - 0.12, Z0 - 0.015, X1 + 0.015, yy + 0.02, Z1 + 0.015, shade(facade, 0.93));
  }
  const ctx = new THREE.Group();
  ctx.name = 'context';
  const cg = new (S.g.constructor)();
  cg.use('satin');
  cg.bx(6.8, Y - 0.22, Z0, X1, Y + 2.82, Z1, facade, { top: C('#57534e') });
  cg.bx(X0, Y - 0.22, Z0, 6.8, Y + 2.82, -0.25, facade, { top: C('#57534e') });
  cg.bx(X0 - 0.05, Y + 2.82, Z0 - 0.05, X1 + 0.05, Y + 3.22, Z0 + 0.25, shade(facade, 0.96), { top: C('#8a8780') });
  cg.bx(6.8, Y + 2.82, Z1 - 0.25, X1 + 0.05, Y + 3.22, Z1 + 0.05, shade(facade, 0.96), { top: C('#8a8780') });
  cg.bx(X1 - 0.25, Y + 2.82, Z0, X1 + 0.05, Y + 3.22, Z1, shade(facade, 0.96), { top: C('#8a8780') });
  cg.use('matte');
  for (const [x, z] of [[12, -2], [19, 1], [26, -3], [9, -4.5]]) {
    cg.bx(x - 0.3, Y + 2.82, z - 0.3, x + 0.3, Y + 3.5, z + 0.3, C('#9a9894'));
    cg.bx(x - 0.36, Y + 3.5, z - 0.36, x + 0.36, Y + 3.56, z + 0.36, C('#7f7d79'));
  }
  cg.use('metal');
  cg.line([15, Y + 2.82, -1], [15, Y + 5.2, -1], 0.025, C('#9a9da1'), 5);
  cg.line([14.4, Y + 4.8, -1], [15.6, Y + 4.8, -1], 0.015, C('#9a9da1'), 4);
  cg.line([14.6, Y + 4.4, -1], [15.4, Y + 4.4, -1], 0.015, C('#9a9da1'), 4);
  const fl = [...levels, Y];
  for (let f = 0; f < fl.length; f++) {
    const yy = fl[f];
    const wg = f === 3 ? cg : g;
    const owin = (x0, x1, y0, y1, z, out) => {
      const prev = g;
      void prev;
      wg.use('matte');
      wg.bx(x0 - 0.06, y0 - 0.06, Math.min(z, z + out * 0.02), x1 + 0.06, y1 + 0.06, Math.max(z, z + out * 0.02), C('#f3f2ee'));
      const glass = hash(x0, y0, z) < 0.3 ? '#5f6d76' : '#3b4852';
      wg.bx(x0, y0, Math.min(z, z + out * 0.028), x1, y1, Math.max(z, z + out * 0.028), C(glass));
      if (x1 - x0 > 1.2) wg.bx((x0 + x1) / 2 - 0.035, y0, Math.min(z, z + out * 0.032), (x0 + x1) / 2 + 0.035, y1, Math.max(z, z + out * 0.032), C('#f3f2ee'));
      if (hash(x1, y1, z) < 0.35) wg.bx(x0, y0 + (y1 - y0) * 0.5, Math.min(z, z + out * 0.03), x1, y1, Math.max(z, z + out * 0.03), C('#d9d1c2'));
      wg.bx(x0 - 0.08, y0 - 0.1, Math.min(z, z + out * 0.07), x1 + 0.08, y0 - 0.05, Math.max(z, z + out * 0.07), C('#9a9c9f'));
    };
    for (let k = 0; k < 4; k++) {
      const bx0 = 6.8 + k * 6.65;
      if (f < 3 || k >= 0) {
        if (f < 3 && k === 0) { }
        owin(bx0 + 0.9, bx0 + 2.7, yy + 0.85, yy + 2.3, Z1, 1);
        owin(bx0 + 5.4, bx0 + 6.5, yy + 0.85, yy + 2.3, Z1, 1);
        owin(bx0 + 4.5, bx0 + 5.4, yy, yy + 2.3, Z1, 1);
        balcony(wg, bx0 + 4.1, bx0 + 7.0, yy, Z1, k + f * 7);
      }
      owin(bx0 + 1.0, bx0 + 2.4, yy + 0.85, yy + 2.3, Z0, -1);
      owin(bx0 + 4.2, bx0 + 5.4, yy + 0.85, yy + 2.3, Z0, -1);
    }
    if (f < 3) {
      win(0.7, 2.5, yy + 0.85, yy + 2.3, Z1, 1);
      win(5.4, 6.5, yy + 0.85, yy + 2.3, Z1, 1);
      win(4.3, 5.2, yy, yy + 2.3, Z1, 1);
      balcony(g, 3.9, 6.8, yy, Z1, 50 + f);
      win(0.5, 1.6, yy + 0.85, yy + 2.3, Z0, -1);
    }
    if (f >= 0) {
      const sw = f === 3 ? cg : g;
      sw.use('matte');
      sw.bx(2.6, yy + 1.2, Z0 - 0.03, 3.8, yy + 2.3, Z0, C('#4a5862'));
      sw.bx(2.57, yy + 1.17, Z0 - 0.02, 3.83, yy + 2.33, Z0 + 0.001, C('#f3f2ee'));
    }
  }
  g.use('matte');
  g.bx(X0 - 0.05, 0.75, -1.5, X0 + 0.0, Y - 0.25, 1.5, accent);
  g.use('satin');
  g.bx(2.0, 2.6, Z0 - 1.6, 4.4, 2.8, Z0, C('#a9a59d'));
  g.use('matte');
  g.bx(2.45, 0.1, Z0 - 0.04, 3.95, 2.45, Z0 + 0.01, C('#2f3a42'));
  g.bx(2.5, 0.25, Z0 - 0.06, 3.9, 2.35, Z0 - 0.03, C('#6f8796'));
  g.use('satin');
  g.bx(1.9, -0.4, Z0 - 1.8, 4.5, 0.15, Z0, C('#a9a69f'));
  g.bx(1.9, -0.4, Z0 - 2.15, 4.5, 0.0, Z0 - 1.8, C('#a9a69f'));
  api.context = ctx;
  for (const key of ['satin', 'matte', 'metal']) {
    const geo = cg.geometry(key);
    if (!geo) continue;
    const m = new THREE.Mesh(geo, api.M[key === 'matte' ? 'site' : key]);
    m.castShadow = true;
    m.receiveShadow = true;
    ctx.add(m);
  }
  api.siteGroup.add(ctx);

  const pathZ = 9.5;
  const inPath = (x, z) => (Math.abs(z - pathZ) < 1.1 && x > -30 && x < 60) || (Math.abs(x - 15) < 1.0 && z > pathZ && z < 40) || (Math.abs(x + 6) < 1.0 && z > -14 && z < pathZ);
  const playground = (x, z) => Math.hypot(x - 16, z - 22) < 6;
  S.terrain({
    x0: -70, z0: -40, x1: 80, z1: 70, cell: 1.25,
    color: (x, z, y, out) => {
      lawnColor(x, z, out);
      if (playground(x, z)) out.set('#c9b48a');
      if (z < -8.5 && z > -23) out.set('#8d8a84');
      return out;
    },
    hole: (x, z) => x > X0 - 0.2 && x < X1 + 0.2 && z > Z0 - 0.2 && z < Z1 + 0.2
  });
  S.pave([-40, pathZ - 1.0, 60, pathZ + 1.0], 0.02, { type: 'tiles', color: '#a8a49c', size: [0.5, 0.5], grout: '#8b8781', vary: 0.04 }, 3);
  S.pave([14.0, pathZ + 1.0, 16.0, 38], 0.02, { type: 'tiles', color: '#a8a49c', size: [0.5, 0.5], grout: '#8b8781', vary: 0.04 }, 4);
  S.pave([-7.0, -8.8, -5.0, pathZ - 1.0], 0.02, { type: 'tiles', color: '#a8a49c', size: [0.5, 0.5], grout: '#8b8781', vary: 0.04 }, 5);
  S.pave([-40, -14.6, 60, -11.6], 0.02, { type: 'tiles', color: '#9d9a94', size: [0.2, 0.1], grout: '#7f7c77', vary: 0.05, bond: 0.5 }, 6);
  S.pave([1.6, -11.6, 4.8, Z0 - 2.15], 0.02, { type: 'tiles', color: '#9d9a94', size: [0.2, 0.1], grout: '#7f7c77', vary: 0.05, bond: 0.5 }, 7);
  S.pave([-40, -22, 60, -15.0], 0.0, { type: 'flat', color: '#55585a' });
  S.pave([-40, -11.6, 1.6, -8.8], 0.02, { type: 'tiles', color: '#8a8782', size: [0.2, 0.1], grout: '#6f6c68', vary: 0.04, bond: 0.5 }, 8);
  S.pave([4.8, -11.6, 60, -8.8], 0.02, { type: 'tiles', color: '#8a8782', size: [0.2, 0.1], grout: '#6f6c68', vary: 0.04, bond: 0.5 }, 9);
  S.kerb([-40, -15.0], [60, -15.0], 0.0);
  S.kerb([-40, -8.8], [60, -8.8], 0.0, 0.1);
  for (let i = 0; i < 12; i++) {
    const x = -24 + i * 3.4;
    if (Math.abs(x - 3) < 2.5) continue;
    g.use('matte');
    g.bx(x - 0.05, 0.021, -11.5, x + 0.05, 0.024, -9.0, C('#eeeeea'));
    if (hash(i, 7) < 0.62) S.car(x + 1.7, -10.2, PI * (hash(i, 3) < 0.5 ? 0 : 1), { color: ['#3d4f63', '#8a8d91', '#efeeea', '#5a2a2a', '#2b2c2f', '#6f7a5a'][i % 6], kind: i % 3 === 0 ? 'suv' : i % 3 === 1 ? 'hatch' : 'sedan' });
  }
  S.car(18, -19.5, PI / 2, { color: '#b3261e', kind: 'hatch' });
  for (const x of [-20, 0, 20, 40]) lamp(S, x, -12.2);
  for (const x of [-16, 6, 28, 46]) lamp(S, x, pathZ + 1.6);
  S.item('swing', 13.5, 0, 21, 0.3);
  S.item('sandbox', 18.5, 0, 23, 0);
  slide(S, 16.5, 19.5);
  for (const [x, z, r] of [[11.5, 24.5, 1.9], [20.5, 18.5, -0.9]]) bench(S, x, z, r);
  for (const x of [-12, 4.5, 22, 38]) bench(S, x, pathZ + 1.35, PI);
  g.use('satin');
  g.bx(-10, 0, -16.5 + 7.5, -7, 1.5, -16.5 + 9.4, C('#a9a59d'));
  S.trees([
    ['linden', -10, 16, 1.05], ['linden', 8, 21, 0.95], ['maple', 27, 15, 1.0], ['birch', 33, 21, 1.0], ['birch', 30, 26, 0.9],
    ['linden', -20, 26, 1.1], ['pine', -26, 12, 0.9], ['pine', -31, 18, 1.0], ['maple', 4, 33, 1.1], ['birch', 22, 31, 1.0],
    ['linden', 40, 12, 1.05], ['maple', 46, 24, 1.0], ['birch', -4, 27, 0.95], ['pine', 52, 4, 1.0], ['linden', -36, -2, 1.0],
    ['maple', -14, -24, 1.0], ['linden', 10, -25, 1.1], ['birch', 30, -26, 0.95], ['linden', 48, -24, 1.0],
    ['bush', -3, 13, 1.0], ['bush', 9.5, 13, 0.9], ['bush', 26, 13.5, 1.1], ['bush', 36, 13, 1.0], ['bush', -14, 13.2, 1.0],
    ['spruce', -24, -4, 0.9], ['birch', -22, 4, 0.9]
  ]);
  S.house({ x: 24, z: 44, w: 32, d: 12, h: 27, roof: 'flat', color: '#e2dccf', r: 0, door: false });
  S.house({ x: -40, z: 18, w: 12, d: 36, h: 14, roof: 'flat', color: '#dcd3c3', r: 0, door: false });
  S.house({ x: 62, z: -2, w: 12, d: 30, h: 14, roof: 'flat', color: '#e5e0d4', r: 0, door: false });
  S.house({ x: 16, z: -34, w: 40, d: 12, h: 14, roof: 'flat', color: '#ddd6c8', r: 0, door: false });
  S.scatter(5200, (x, z) => !inPath(x, z) && !playground(x, z) && z > Z1 + 0.6 && Math.hypot(x - 16, z - 10) < 60, 7, 0.8, 1.3, -40, Z1, 60, 55);
  S.scatter(900, (x, z) => (z < Z0 - 2.3 && z > -8.6 && !(x > 1.5 && x < 4.9)) || (x < X0 - 0.6 && x > -30 && z > -8.6 && z < 9) , 8, 0.8, 1.2, -30, -9, 50, 9);
  S.finish();
}

function balcony(g, x0, x1, y, z, seed) {
  g.use('satin');
  g.bx(x0, y - 0.2, z, x1, y - 0.02, z + 1.25, C('#b9b5ad'), { top: C('#8f877c') });
  g.use('matte');
  g.bx(x1 - 0.08, y - 0.02, z, x1, y + 1.8, z + 1.25, C('#c9c6be'));
  g.bx(x0 + 0.02, y - 0.02, z + 1.2, x1, y + 1.0, z + 1.25, C('#a7b39c'));
  g.bx(x0, y - 0.02, z, x0 + 0.05, y + 1.0, z + 1.25, C('#a7b39c'));
  g.use('metal');
  g.line([x0, y + 1.02, z + 1.23], [x1, y + 1.02, z + 1.23], 0.022, C('#3a3d42'), 6);
  const R = rng(seed + 3);
  g.use('matte');
  const k = R();
  if (k < 0.4) { g.blob(x0 + 0.5, y + 0.5, z + 0.6, 0.35, 0.45, 0.35, '#5d7a42', seed, { detail: 0 }); g.cyl(x0 + 0.5, y, z + 0.6, 0.18, 0.2, 0.3, 8, '#b5654a'); }
  else if (k < 0.7) { for (let i = 0; i < 4; i++) g.bx(x0 + 0.6 + i * 0.12, y + 0.8, z + 0.5, x0 + 0.68 + i * 0.12, y + 1.25, z + 0.52, ['#e9e4d8', '#7d8fa8', '#c9785a', '#efe9dc'][i]); g.use('metal'); g.line([x0 + 0.5, y + 1.26, z + 0.51], [x0 + 1.2, y + 1.26, z + 0.51], 0.008, C('#cfd2d5'), 4); }
  else { g.use('metal'); g.cyl(x0 + 0.7, y + 1.4, z + 0.1, 0.32, 0.32, 0.02, 14, C('#d9dcdf')); }
}

function lamp(S, x, z) {
  const g = S.g;
  g.use('metal');
  g.cyl(x, 0, z, 0.09, 0.07, 0.3, 8, C('#3a3d42'));
  g.cyl(x, 0.3, z, 0.05, 0.04, 4.2, 6, C('#3a3d42'));
  g.cyl(x, 4.5, z, 0.22, 0.12, 0.12, 10, C('#3a3d42'));
  g.use('gloss');
  g.cyl(x, 4.42, z, 0.18, 0.18, 0.08, 10, C('#f2ead8'));
}

function bench(S, x, z, r) {
  const g = S.g;
  g.use('satin');
  g.at(x, 0, z, r);
  for (let i = 0; i < 4; i++) g.bx(-0.9, 0.42, -0.2 + i * 0.1, 0.9, 0.46, -0.13 + i * 0.1, C('#8a6446'));
  for (let i = 0; i < 3; i++) g.bx(-0.9, 0.55 + i * 0.12, -0.27, 0.9, 0.63 + i * 0.12, -0.23, C('#8a6446'));
  g.use('metal');
  for (const s of [-0.75, 0.75]) { g.bx(s - 0.03, 0, -0.22, s + 0.03, 0.42, 0.15, C('#2f3236')); g.bx(s - 0.03, 0.42, -0.27, s + 0.03, 0.9, -0.22, C('#2f3236')); }
  g.pop();
}

function slide(S, x, z) {
  const g = S.g;
  g.use('satin');
  g.at(x, 0, z, 0.6);
  for (const sx of [-0.4, 0.4]) for (const sz of [-0.4, 0.4]) g.bx(sx - 0.05, 0, sz - 0.05, sx + 0.05, 1.9, sz + 0.05, C('#7a5a3c'));
  g.bx(-0.45, 1.2, -0.45, 0.45, 1.26, 0.45, C('#8a6446'));
  g.face([[-0.6, 0, 0.5], [-0.6, 0, -0.5], [-0.6 - 2.2, 0.0, -0.4], [-0.6 - 2.2, 0.0, 0.4]], [0, -1, 0], C('#3f7fbf'));
  g.at(-0.45, 1.2, 0, 0, 0, 0.52);
  g.bx(-2.6, -0.04, -0.3, 0, 0.0, 0.3, C('#3f7fbf'));
  g.bx(-2.6, 0.0, -0.32, 0, 0.12, -0.28, C('#2f6faf'));
  g.bx(-2.6, 0.0, 0.28, 0, 0.12, 0.32, C('#2f6faf'));
  g.pop();
  for (let i = 0; i < 5; i++) g.bx(0.42, 0.2 + i * 0.25, -0.3, 0.48, 0.24 + i * 0.25, 0.3, C('#d9483b'));
  g.face([[-0.45, 1.9, -0.5], [0.45, 1.9, -0.5], [0, 2.4, -0.5]], [0, 2, 0], C('#d9483b'));
  g.face([[-0.45, 1.9, 0.5], [0.45, 1.9, 0.5], [0, 2.4, 0.5]], [0, 2, 0], C('#d9483b'));
  g.face([[-0.5, 1.9, -0.5], [-0.5, 1.9, 0.5], [0, 2.4, 0.5], [0, 2.4, -0.5]], [0, 1, 0], C('#c63f33'));
  g.face([[0.5, 1.9, -0.5], [0.5, 1.9, 0.5], [0, 2.4, 0.5], [0, 2.4, -0.5]], [0, 1, 0], C('#c63f33'));
  g.pop();
}

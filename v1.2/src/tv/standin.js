// Instalator: tiny stand-in building (data + boxes) used until the real buildings load, and as a fallback.

import * as THREE from "three";

const H = 2.7, T = 0.18;

function data() {
  const rooms = [
    { id: "kuchnia", name: "kuchnia", kind: "kitchen", floor: 0, poly: [[-5, -4], [0, -4], [0, 0], [-5, 0]] },
    { id: "salon", name: "salon", kind: "living", floor: 0, poly: [[0, -4], [5, -4], [5, 0], [0, 0]] },
    { id: "lazienka", name: "łazienka", kind: "bath", floor: 0, poly: [[-5, 0], [-2.5, 0], [-2.5, 4], [-5, 4]] },
    { id: "hol", name: "hol", kind: "hall", floor: 0, poly: [[-2.5, 0], [0, 0], [0, 4], [-2.5, 4]] },
    { id: "sypialnia", name: "sypialnia", kind: "bed", floor: 0, poly: [[0, 0], [5, 0], [5, 4], [0, 4]] }
  ];
  const W = (a, b, ext, openings = []) => ({ floor: 0, a, b, thick: T, exterior: ext, openings });
  const walls = [
    W([-5, -4], [5, -4], true, [{ t0: 0.2, t1: 0.35, kind: "window", sill: 0.85, head: 2.1 }, { t0: 0.62, t1: 0.85, kind: "window", sill: 0.85, head: 2.1 }]),
    W([5, -4], [5, 4], true, [{ t0: 0.62, t1: 0.82, kind: "window", sill: 0.85, head: 2.1 }]),
    W([5, 4], [-5, 4], true, [{ t0: 0.53, t1: 0.62, kind: "door", sill: 0, head: 2.05 }, { t0: 0.18, t1: 0.36, kind: "window", sill: 0.85, head: 2.1 }]),
    W([-5, 4], [-5, -4], true, [{ t0: 0.6, t1: 0.75, kind: "window", sill: 0.85, head: 2.1 }]),
    W([0, -4], [0, 0], false, [{ t0: 0.55, t1: 0.95, kind: "door", sill: 0, head: 2.2 }]),
    W([-5, 0], [5, 0], false, [{ t0: 0.32, t1: 0.41, kind: "door", sill: 0, head: 2.05 }, { t0: 0.55, t1: 0.64, kind: "door", sill: 0, head: 2.05 }]),
    W([-2.5, 0], [-2.5, 4], false, [{ t0: 0.3, t1: 0.52, kind: "door", sill: 0, head: 2.05 }])
  ];
  const circuits = [
    { id: "L1", label: "Światło kuchnia, hol", kind: "light", rooms: ["kuchnia", "hol"], breaker: "B10" },
    { id: "L2", label: "Światło salon, sypialnia", kind: "light", rooms: ["salon", "sypialnia"], breaker: "B10" },
    { id: "L3", label: "Światło łazienka", kind: "light", rooms: ["lazienka"], breaker: "B10" },
    { id: "G1", label: "Gniazda kuchnia", kind: "socket", rooms: ["kuchnia"], breaker: "B16" },
    { id: "G2", label: "Gniazda salon, sypialnia", kind: "socket", rooms: ["salon", "sypialnia"], breaker: "B16" },
    { id: "G3", label: "Gniazda hol, łazienka", kind: "socket", rooms: ["hol", "lazienka"], breaker: "B16" }
  ];
  const q = (yaw) => { const o = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)); return [o.x, o.y, o.z, o.w]; };
  const mounts = [];
  const add = (m) => mounts.push({ tags: [], floor: 0, quat: [0, 0, 0, 1], normal: [0, -1, 0], ...m });
  const fixtures = [
    { id: "f-kuchnia", room: "kuchnia", circuit: "L1", pos: [-2.5, H - 0.55, -2] },
    { id: "f-salon", room: "salon", circuit: "L2", pos: [2.5, H - 0.55, -2] },
    { id: "f-lazienka", room: "lazienka", circuit: "L3", pos: [-3.75, H - 0.3, 2] },
    { id: "f-hol", room: "hol", circuit: "L1", pos: [-1.25, H - 0.3, 2] },
    { id: "f-sypialnia", room: "sypialnia", circuit: "L2", pos: [2.5, H - 0.55, 2] }
  ];
  for (const f of fixtures) add({ id: `s-${f.room}`, room: f.room, kind: "socketE27", pos: f.pos, fixture: f.id, circuit: f.circuit });
  for (const r of rooms) {
    const cx = (r.poly[0][0] + r.poly[2][0]) / 2, cz = (r.poly[0][1] + r.poly[2][1]) / 2;
    add({ id: `c-${r.id}-a`, room: r.id, kind: "ceiling", pos: [cx + 0.9, H, cz + 0.6] });
    add({ id: `c-${r.id}-b`, room: r.id, kind: "ceiling", pos: [cx - 0.9, H, cz - 0.6] });
  }
  add({ id: "w-hol-1", room: "hol", kind: "wall", pos: [-0.12, 1.45, 2.6], normal: [-1, 0, 0], quat: q(-Math.PI / 2) });
  add({ id: "w-salon-1", room: "salon", kind: "wall", pos: [4.88, 2.2, -1.5], normal: [-1, 0, 0], quat: q(-Math.PI / 2) });
  add({ id: "w-sypialnia-1", room: "sypialnia", kind: "wall", pos: [0.12, 2.2, 2.2], normal: [1, 0, 0], quat: q(Math.PI / 2) });
  add({ id: "w-kuchnia-1", room: "kuchnia", kind: "wall", pos: [-4.88, 2.2, -1], normal: [1, 0, 0], quat: q(Math.PI / 2) });
  add({ id: "rad-salon", room: "salon", kind: "radiator", pos: [3.2, 0.55, -3.8], normal: [0, 0, 1], quat: q(0) });
  add({ id: "rad-kuchnia", room: "kuchnia", kind: "radiator", pos: [-1.6, 0.55, -3.8], normal: [0, 0, 1], quat: q(0) });
  add({ id: "rad-sypialnia", room: "sypialnia", kind: "radiator", pos: [4.8, 0.55, 2.6], normal: [-1, 0, 0], quat: q(-Math.PI / 2) });
  add({ id: "rad-lazienka", room: "lazienka", kind: "radiator", pos: [-4.8, 0.55, 1.2], normal: [1, 0, 0], quat: q(Math.PI / 2) });
  add({ id: "door-ent", room: "hol", kind: "door", pos: [-0.55, 2.0, 3.9], normal: [0, 0, -1], quat: q(Math.PI), tags: ["entrance"] });
  add({ id: "lock-ent", room: "hol", kind: "doorLock", pos: [-0.95, 1.05, 3.88], normal: [0, 0, -1], quat: q(Math.PI) });
  add({ id: "win-salon", room: "salon", kind: "window", pos: [2.4, 1.9, -3.9], normal: [0, 0, 1], quat: q(0) });
  add({ id: "floor-lazienka", room: "lazienka", kind: "floor", pos: [-4.4, 0, 3.3], normal: [0, 1, 0] });
  add({ id: "floor-salon", room: "salon", kind: "floor", pos: [4.4, 0, -0.6], normal: [0, 1, 0] });
  add({ id: "surf-tv", room: "salon", kind: "surface", pos: [2.5, 0.5, -3.55], normal: [0, 1, 0], quat: q(0) });
  add({ id: "surf-kuchnia", room: "kuchnia", kind: "surface", pos: [-3.6, 0.9, -3.6], normal: [0, 1, 0], quat: q(0) });
  add({ id: "surf-nocna", room: "sypialnia", kind: "surface", pos: [4.4, 0.55, 0.5], normal: [0, 1, 0], quat: q(-Math.PI / 2) });
  add({ id: "tv-salon", room: "salon", kind: "tv", pos: [2.5, 1.0, -3.7], normal: [0, 0, 1], quat: q(0) });
  add({ id: "o-wejscie", room: "outdoor", kind: "outdoorWall", pos: [-2.1, 2.5, 4.1], normal: [0, 0, 1], quat: q(0) });
  add({ id: "o-ogrod", room: "outdoor", kind: "outdoorWall", pos: [5.1, 2.5, 2], normal: [1, 0, 0], quat: q(Math.PI / 2) });
  add({ id: "o-podjazd", room: "outdoor", kind: "outdoorWall", pos: [-5.1, 2.5, 3], normal: [-1, 0, 0], quat: q(-Math.PI / 2) });
  add({ id: "o-dzwonek", room: "outdoor", kind: "doorbell", pos: [-1.95, 1.3, 4.1], normal: [0, 0, 1], quat: q(0) });
  const strips = [
    { id: "st-tv", room: "salon", floor: 0, kind: "tv", points: [[1.7, 0.85, -3.75], [3.3, 0.85, -3.75], [3.3, 1.75, -3.75], [1.7, 1.75, -3.75], [1.7, 0.85, -3.75]] },
    { id: "st-kuchnia", room: "kuchnia", floor: 0, kind: "kitchen", points: [[-4.6, 1.45, -3.55], [-1.6, 1.45, -3.55]] },
    { id: "st-lozko", room: "sypialnia", floor: 0, kind: "bed", points: [[1.6, 0.95, 3.82], [3.6, 0.95, 3.82]] }
  ];
  const tabletSpots = [
    { id: "t-hol", room: "hol", floor: 0, kind: "wall", pos: [-0.1, 1.45, 1.4], quat: q(-Math.PI / 2), rating: "good", why: "Hol przy wejściu, ściana bez okna, kabel z szafy blisko." },
    { id: "t-kuchnia", room: "kuchnia", floor: 0, kind: "surface", pos: [-2.6, 0.92, -3.6], quat: q(0), rating: "ok", why: "Blat w kuchni, zawsze pod ręką." },
    { id: "t-salon", room: "salon", floor: 0, kind: "wall", pos: [4.9, 1.45, -2.6], quat: q(-Math.PI / 2), rating: "poor", why: "Pod oknem, słońce odbija się w ekranie." }
  ];
  return {
    id: "standin", name: "Dom testowy", area: 80, floors: [{ index: 0, y: 0, height: H, name: "Parter" }],
    rooms, walls, furniture: [
      { id: "sofa", kind: "sofa", floor: 0, room: "salon", pos: [2.5, 0, -0.9], rot: 0, size: [2.2, 0.8, 0.9] },
      { id: "tvstand", kind: "tvstand", floor: 0, room: "salon", pos: [2.5, 0, -3.6], rot: 0, size: [1.8, 0.5, 0.4] },
      { id: "bed", kind: "bed", floor: 0, room: "sypialnia", pos: [2.6, 0, 2.8], rot: 0, size: [1.6, 0.5, 2.0] },
      { id: "counter", kind: "counter", floor: 0, room: "kuchnia", pos: [-3.1, 0, -3.65], rot: 0, size: [3.6, 0.9, 0.6] }
    ],
    circuits, mounts, strips, tabletSpots, fixtures,
    panel: { room: "hol", floor: 0, pos: [-2.38, 1.5, 1.0], quat: q(Math.PI / 2), rows: 3, slotsPerRow: 12 },
    rack: { room: "hol", floor: 0, pos: [-2.3, 1.2, 3.0], quat: q(Math.PI / 2), units: 9 },
    mediaBox: null,
    wan: { room: "hol", floor: 0, pos: [-2.38, 0.4, 3.4], quat: q(Math.PI / 2) },
    entrance: { pos: [-1.2, 0, 4.6], quat: q(Math.PI) }, street: { pos: [-1, 0, 12] },
    zones: [
      { id: "z-wej", kind: "entrance", floor: 0, pos: [-1.2, 0.5, 5.2], r: 2 },
      { id: "z-ogrod", kind: "garden", floor: 0, pos: [8, 0.5, 2], r: 4 },
      { id: "z-podjazd", kind: "driveway", floor: 0, pos: [-8, 0.5, 6], r: 4 }
    ],
    camera: { target: [0, 1, 0], radius: 14 }
  };
}

export function buildStandin() {
  const d = data();
  const group = new THREE.Group();
  const wallGroups = [];
  const floorMat = new THREE.MeshLambertMaterial({ color: "#c9b79c" });
  for (const r of d.rooms) {
    const shape = new THREE.Shape(r.poly.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, r.kind === "bath" ? new THREE.MeshLambertMaterial({ color: "#d9dfe0" }) : floorMat);
    m.receiveShadow = true;
    group.add(m);
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ color: "#8fa86a" }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
  group.add(ground);
  const sides = {};
  const side = (w) => {
    if (!w.exterior) return "int";
    const mx = (w.a[0] + w.b[0]) / 2, mz = (w.a[1] + w.b[1]) / 2;
    return Math.abs(mx) > Math.abs(mz) * 1.2 ? (mx > 0 ? "E" : "W") : mz > 0 ? "S" : "N";
  };
  for (const w of d.walls) {
    const s = side(w);
    if (!sides[s]) {
      const mat = new THREE.MeshLambertMaterial({ color: w.exterior ? "#e9e4da" : "#f1ede6" });
      const grp = new THREE.Group();
      sides[s] = { grp, mat };
      group.add(grp);
      wallGroups.push({ mesh: grp, floor: 0, side: s, material: mat });
    }
    const { grp, mat } = sides[s];
    const ax = w.a[0], az = w.a[1], bx = w.b[0], bz = w.b[1];
    const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bz - az, bx - ax);
    const seg = (t0, t1, y0, y1) => {
      if (t1 - t0 <= 0.001 || y1 - y0 <= 0.001) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry((t1 - t0) * len, y1 - y0, w.thick), mat);
      const tm = (t0 + t1) / 2;
      m.position.set(ax + (bx - ax) * tm, (y0 + y1) / 2, az + (bz - az) * tm);
      m.rotation.y = -ang;
      m.castShadow = true; m.receiveShadow = true;
      grp.add(m);
    };
    let t = 0;
    const ops = (w.openings || []).slice().sort((a, b) => a.t0 - b.t0);
    for (const o of ops) {
      seg(t, o.t0, 0, H);
      seg(o.t0, o.t1, o.head, H);
      if (o.sill > 0) seg(o.t0, o.t1, 0, o.sill);
      t = o.t1;
    }
    seg(t, 1, 0, H);
  }
  const furnMat = new THREE.MeshLambertMaterial({ color: "#9a8a76" });
  for (const f of d.furniture) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(f.size[0], f.size[1], f.size[2]), furnMat);
    m.position.set(f.pos[0], f.size[1] / 2, f.pos[2]);
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
  }
  const fixtures = d.fixtures.map((f) => {
    const g = new THREE.Group();
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, H - f.pos[1], 4), new THREE.MeshLambertMaterial({ color: "#222" }));
    cord.position.y = (H - f.pos[1]) / 2;
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 10, 1, true), new THREE.MeshLambertMaterial({ color: "#3a3a3a", side: THREE.DoubleSide }));
    shade.position.y = 0.02;
    const emissive = new THREE.MeshStandardMaterial({ color: "#fff8ea", emissive: "#ffdca0", emissiveIntensity: 0 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), emissive);
    bulb.position.y = -0.06;
    g.add(cord, shade, bulb);
    g.position.set(...f.pos);
    group.add(g);
    return { id: f.id, room: f.room, circuit: f.circuit, kind: "pendant", object3d: g, emissive, bulb, lightPos: [f.pos[0], f.pos[1] - 0.1, f.pos[2]], socket: { kind: "socketE27", pos: f.pos, quat: [0, 0, 0, 1] } };
  });
  return { id: "standin", name: d.name, group, data: d, wallGroups, floorGroups: [{ group, floor: 0 }], fixtures, setDoorOpen() {} };
}

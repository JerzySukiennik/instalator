// Instalator: headless logic test of the shared game rules on a tiny fixture house (no browser, no three.js).
import { newState, reduce, startJob, tasksFor, snapshotFor, advanceTurn, activeCid } from "../../src/shared/game.js";
import { rollJobs, makeJob, rng, CLIENTS } from "../../src/shared/jobs.js";
import { derive, evaluate } from "../../src/shared/sim.js";
import { netStep } from "../../src/shared/netguide.js";

const q = [0, 0, 0, 1];
const data = {
  id: "fx", name: "Fixture", floors: [{ index: 0, y: 0, height: 2.7, name: "Parter" }],
  rooms: [
    { id: "salon", name: "salon", kind: "living", floor: 0, poly: [[0, -4], [5, -4], [5, 0], [0, 0]] },
    { id: "hol", name: "hol", kind: "hall", floor: 0, poly: [[-2.5, 0], [0, 0], [0, 4], [-2.5, 4]] },
    { id: "lazienka", name: "łazienka", kind: "bath", floor: 0, poly: [[-5, 0], [-2.5, 0], [-2.5, 4], [-5, 4]] },
    { id: "sypialnia", name: "sypialnia", kind: "bed", floor: 0, poly: [[0, 0], [5, 0], [5, 4], [0, 4]] }
  ],
  walls: [
    { floor: 0, a: [-5, -4], b: [5, -4], thick: 0.2, exterior: true, openings: [] },
    { floor: 0, a: [5, -4], b: [5, 4], thick: 0.2, exterior: true, openings: [] },
    { floor: 0, a: [5, 4], b: [-5, 4], thick: 0.2, exterior: true, openings: [{ t0: 0.5, t1: 0.6, kind: "door" }] },
    { floor: 0, a: [-5, 4], b: [-5, -4], thick: 0.2, exterior: true, openings: [] },
    { floor: 0, a: [-5, 0], b: [5, 0], thick: 0.12, exterior: false, openings: [{ t0: 0.3, t1: 0.4, kind: "door" }] }
  ],
  circuits: [
    { id: "L1", kind: "light", rooms: ["salon", "hol"], breaker: "B10" },
    { id: "L2", kind: "light", rooms: ["lazienka", "sypialnia"], breaker: "B10" },
    { id: "G1", kind: "socket", rooms: ["salon", "sypialnia"], breaker: "B16" },
    { id: "G2", kind: "socket", rooms: ["hol", "lazienka"], breaker: "B16" }
  ],
  mounts: [
    { id: "s-salon", room: "salon", floor: 0, kind: "socketE27", pos: [2.5, 2.2, -2], quat: q, circuit: "L1", fixture: "f1" },
    { id: "c-salon", room: "salon", floor: 0, kind: "ceiling", pos: [2.5, 2.7, -1], quat: q },
    { id: "c-hol", room: "hol", floor: 0, kind: "ceiling", pos: [-1.2, 2.7, 2], quat: q },
    { id: "c-syp", room: "sypialnia", floor: 0, kind: "ceiling", pos: [2.5, 2.7, 2], quat: q },
    { id: "rad-salon", room: "salon", floor: 0, kind: "radiator", pos: [3, 0.5, -3.8], quat: q },
    { id: "f-laz", room: "lazienka", floor: 0, kind: "floor", pos: [-4, 0, 3], quat: q },
    { id: "o-wej", room: "outdoor", floor: 0, kind: "outdoorWall", pos: [-1, 2.5, 4.1], normal: [0, 0, 1], quat: q },
    { id: "o-bell", room: "outdoor", floor: 0, kind: "doorbell", pos: [-0.4, 1.3, 4.1], normal: [0, 0, 1], quat: q }
  ],
  strips: [{ id: "st-tv", room: "salon", floor: 0, kind: "tv", points: [[2, 1, -3.9], [3, 1, -3.9]] }],
  tabletSpots: [{ id: "t-hol", room: "hol", floor: 0, kind: "wall", pos: [-0.1, 1.4, 1.5], quat: q, rating: "good" }],
  panel: { room: "hol", floor: 0, pos: [-2.4, 1.5, 1], quat: q, rows: 3, slotsPerRow: 12 },
  rack: { room: "hol", floor: 0, pos: [-2.3, 1.2, 3], quat: q, units: 9 },
  mediaBox: null, wan: { room: "hol", floor: 0, pos: [-2.4, 0.4, 3.4], quat: q },
  entrance: { pos: [-0.5, 0, 4.4], quat: q }, street: { pos: [-0.5, 0, 12] },
  zones: [{ id: "z1", kind: "entrance", floor: 0, pos: [-0.5, 0.5, 5.5], r: 2 }]
};

let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log("FAIL", msg); } else console.log("ok  ", msg); };
const s = newState();
reduce(s, "a", { a: "hello", name: "Tata" }, null);
reduce(s, "b", { a: "hello", name: "Jurek" }, null);
ok(s.players.length === 2 && s.players[0].host, "two players, first is host");
reduce(s, "a", { a: "start" }, null);
ok(s.phase === "board" && s.board.jobs.length === 4, "board with 4 jobs");
const job = makeJob("dom", rng(5), CLIENTS.find((c) => c.id === "nowakowie"));
job.platform = "ha";
startJob(s, job, data);
ok(tasksFor(job, data).some((t) => t.id === "panel"), "tasks include the panel");
ok(activeCid(s) === "a", "first turn is the host");
ok(reduce(s, "b", { a: "buy", id: "u7-pro" }, data).some((e) => e.nope), "non-active player is refused");
reduce(s, "a", { a: "endTurn" }, data);
ok(activeCid(s) === "b", "turn passes to the second player");
s.players[1].online = false;
advanceTurn(s);
ok(activeCid(s) === "a", "disconnect hands the turn back");
const A = (a) => reduce(s, "a", a, data);
A({ a: "breaker", key: "main", on: true }); A({ a: "breaker", key: "rcd0", on: true });
for (const c of data.circuits) A({ a: "breaker", key: `mcb:${c.id}`, on: true });
let der = derive(s, data);
ok(evaluate(s, data, der, job).find((r) => r.id === "r0").ok, "power requirement met");
ok(A({ a: "buy", id: "shelly-pro-4pm" }) && A({ a: "dinPut", id: "shelly-pro-4pm" }).some((e) => e.fx === "spark"), "DIN module with power on sparks");
for (const id of ["ucg-max", "usw-pro-max-16-poe", "patch-panel-24", "rack-shelf", "u7-pro", "u7-pro", "g4-doorbell-pro", "g5-bullet", "ha-green", "hue-bridge-pro", "hue-e27", "hue-play-gradient", "tado-trv-x", "tado-bridge-x", "aqara-leak", "aqara-hub-m3", "ipad-a16", "tablet-wall-mount", "aqara-smoke"]) A({ a: "buy", id });
A({ a: "rackPut", id: "patch-panel-24", u: 8 }); A({ a: "rackPut", id: "usw-pro-max-16-poe", u: 7 }); A({ a: "rackPut", id: "rack-shelf", u: 6 });
A({ a: "buy", id: "rack-shelf" }); A({ a: "rackPut", id: "rack-shelf", u: 5 });
for (const id of ["ucg-max", "ha-green", "hue-bridge-pro", "tado-bridge-x", "aqara-hub-m3"]) ok(!A({ a: "shelfPut", id }).some((e) => e.nope), `shelf ${id}`);
A({ a: "install", id: "u7-pro", mount: "c-salon" }); A({ a: "install", id: "u7-pro", mount: "c-hol" });
A({ a: "install", id: "g4-doorbell-pro", mount: "o-bell" });
A({ a: "install", id: "hue-e27", mount: "s-salon" }); A({ a: "strip", id: "hue-play-gradient", strip: "st-tv" });
A({ a: "install", id: "tado-trv-x", mount: "rad-salon" }); A({ a: "install", id: "aqara-leak", mount: "f-laz" });
A({ a: "install", id: "aqara-smoke", mount: "c-syp" });
const by = (id) => s.devs.filter((d) => d.id === id);
const gw = by("ucg-max")[0], sw = by("usw-pro-max-16-poe")[0], ont = by("ont")[0];
A({ a: "patch", from: [ont.uid, 0], to: [gw.uid, 0] });
A({ a: "patch", from: [gw.uid, 1], to: [sw.uid, 15] });
let port = 0;
for (const d of s.devs.filter((d) => d.run && d.run.pp)) A({ a: "patch", from: [sw.uid, port++], to: [d.run.pp, d.run.port] });
for (const id of ["ha-green", "hue-bridge-pro", "aqara-hub-m3"]) A({ a: "patch", from: [sw.uid, port++], to: [by(id)[0].uid, 0] });
der = derive(s, data);
ok(der.online, "internet through ONT → gateway");
ok(by("u7-pro").every((d) => der.dev[d.uid].pw && der.dev[d.uid].net), "both APs powered over PoE and online");
ok(der.cov > 0.8, `Wi-Fi coverage ${Math.round(der.cov * 100)}%`);
ok(der.dev[by("g4-doorbell-pro")[0].uid].net, "doorbell online");
const guide = () => netStep({ ...s, der: derive(s, data) }, data);
const apply = (st) => { for (const o of st.fix || []) o.unpatch ? A({ a: "unpatch", at: o.unpatch }) : A({ a: "patch", ...o.patch }); for (const l of st.all || []) A({ a: "patch", from: l.from, to: l.to, color: l.color }); };
ok(guide().done, `guide: network ready (${guide().text})`);
A({ a: "breaker", key: "main", on: false });
let gs = guide();
ok(gs.goto === "panel" && !gs.done, `guide: rack without power sends you to the panel (${gs.text})`);
A({ a: "breaker", key: "main", on: true });
const ap0 = by("u7-pro")[0];
A({ a: "unpatch", at: [ap0.run.pp, ap0.run.port] });
A({ a: "patch", from: [ap0.run.pp, ap0.run.port], to: [gw.uid, 2] });
gs = guide();
ok(!derive(s, data).dev[ap0.uid].pw && gs.fix, `guide: AP in a gateway port is dark, fix offered (${gs.text})`);
apply(gs);
ok(derive(s, data).dev[ap0.uid].pw && guide().done, "guide: Napraw moves the AP to a PoE port");
A({ a: "unpatch", at: [gw.uid, 1] }); A({ a: "unpatch", at: [ont.uid, 0] });
A({ a: "patch", from: [gw.uid, 0], to: [sw.uid, 15] });
ok(derive(s, data).cov === 0, "switch in the WAN port: Wi-Fi drops to 0%");
gs = guide();
ok(!!gs.fix, `guide: switch in the WAN port, fix offered (${gs.text})`);
for (let i = 0; i < 4 && !guide().done; i++) apply(guide());
der = derive(s, data);
ok(guide().done && der.online && der.cov > 0.8, `guide: fixed back to ${Math.round(der.cov * 100)}% and online`);
A({ a: "tabletSpot", spot: "t-hol" }); A({ a: "tabletMount", leveled: true });
A({ a: "tabletSpot", spot: "t-hol" });
ok(s.tablet.mount === null && s.tablet.dev, "re-placing the tablet on the same wall works");
A({ a: "tabletMount", leveled: true });
der = derive(s, data);
const pairable = s.devs.filter((d) => der.dev[d.uid]?.pairable).map((d) => d.uid);
A({ a: "pair", uids: pairable });
for (const id of ["hue-e27", "tado-trv-x", "aqara-leak", "hue-play-gradient", "aqara-smoke"]) ok(by(id)[0].paired, `${id} paired in HA (${JSON.stringify(der.dev[by(id)[0].uid])})`);
const cam = by("g4-doorbell-pro")[0];
A({ a: "dash", cards: [{ id: "a", kind: "camera", dev: cam.uid, x: 0, y: 0, w: 2, h: 1 }, { id: "b", kind: "climate", x: 3, y: 0, w: 1, h: 2 }, { id: "c", kind: "energy", x: 0, y: 1, w: 1, h: 1 }] });
der = derive(s, data);
const res = evaluate(s, data, der, job);
for (const r of job.reqs) { const st = res.find((x) => x.id === r.id); console.log(st.ok ? "  ✓" : "  ✗", r.text, st.ok ? "" : `(${st.hint})`); }
const snap = snapshotFor(s, data);
ok(JSON.stringify(snap).length < 200000, `snapshot ${Math.round(JSON.stringify(snap).length / 1024)} KB`);
A({ a: "handover" });
ok(s.phase === "handover" && s.review && s.review.stars > 0, `handover stars ${s.review.stars}`);
for (let i = 0; i < 200; i++) { const js = rollJobs(i * 977 + 3); for (const j of js) if (!(j.budget > 0 && j.reqs.length >= 3)) { fails++; console.log("FAIL job", j.id); } }
ok(true, "200 rolls produce valid jobs");
console.log(fails ? `\n${fails} FAILED` : "\nALL OK");
process.exit(fails ? 1 : 0);

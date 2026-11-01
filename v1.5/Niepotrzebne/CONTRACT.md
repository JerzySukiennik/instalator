# Instalator — module contracts

Read `SPEC.md` first. This file freezes the interfaces between parallel builders. Do not rename anything listed here; add, never remove. Units are metres, Y is up, three.js 0.187 (`import * as THREE from 'three'`, addons via `three/addons/`), ES modules, no build step, no comments in final code except a one-line header per file.

## Shared conventions
- Flat-shaded low poly (`flatShading: true`), `MeshStandardMaterial` (or `MeshLambertMaterial` for big static surfaces), real proportions, real colours. Each builder keeps its own material palette module and reuses material instances; merge static parts per material (`BufferGeometryUtils.mergeGeometries`) so one object = few draw calls.
- Emissive parts are separate materials so the game can switch them (`emissiveIntensity`).
- Everything casts/receives shadows where it matters (`castShadow`/`receiveShadow`), tiny parts don't cast.

## 1. Device models — owner: device builder
Entry: `src/models/devices.js`

```js
export const MODEL_IDS = [...];                 // every id below that has a model
export function buildDevice(id, opts = {}) {}   // -> THREE.Group, never throws (unknown id -> neutral labelled box)
export function buildStrip(id, points, opts) {} // LED strips along a path of THREE.Vector3 -> THREE.Group
```

Origin and orientation per mount kind (the game places the group with the mount's position + quaternion):
- `ceiling`: origin = centre of the attachment plane, device hangs along **-Y**.
- `wall`, `outdoorWall`, `doorbell`, `tabletWall`, `garage`: origin = wall surface behind the device, front faces **+Z**, up **+Y**.
- `surface`, `floor`: origin = bottom centre, front faces **+Z**.
- `din`: origin = centre of the DIN rail line on the back, width along **X** = modules x 17.5 mm, front faces **+Z**.
- `rack`: origin = bottom centre of the 19" front mounting plane (ears plane), body goes into **-Z**, front faces **+Z**, width across ears 482.6 mm, height = U x 44.45 mm.
- `socketE27`, `socketGU10`: origin = socket contact, bulb extends along **-Y**.
- `radiator`, `doorLock`, `door`, `window`: origin = attachment point, device extends along **+Z**.

`group.userData` hooks (fill what applies):
- `leds: [{ material, role: 'status'|'ring'|'port'|'display'|'glow', color }]`
- `light: { material, kind: 'bulb'|'strip'|'lamp', pos: [x,y,z] }` (light-emitting devices)
- `ports: [{ id, kind: 'rj45'|'sfp'|'wan'|'poe'|'power', pos: [x,y,z], led?: material }]` (front-face local coords, in order as printed on the real device)
- `display: { mesh, w, h }` (screens: UDM/USW Pro Max displays, tablets, Nest Hub; the game puts a CanvasTexture on `mesh.material.map`)
- `lens: { pos: [x,y,z], dir: [x,y,z], fov }` (cameras, doorbells)
- `size: [w,h,d]`

Viewer: `Niepotrzebne/tools/models.html?id=<id>` (single, turntable, neutral studio) and `?grid=1` (all models with labels), plus `node Niepotrzebne/tools/modelshot.mjs <id|all> <out.png>` (headless Chrome, real GPU).

### Device ids (priority order)
Network (UniFi): `ucg-ultra`, `ucg-max`, `udm-pro-max`, `usw-flex-mini`, `usw-lite-8-poe`, `usw-pro-max-16-poe`, `usw-pro-max-24-poe`, `u7-pro`, `u7-lite`, `u7-pro-wall`, `u7-outdoor`, `g5-bullet`, `g5-turret-ultra`, `g5-flex`, `g4-doorbell-pro`, `unvr`, `patch-panel-24`, `brush-panel`, `pdu-pro`, `ups-2u`, `rack-shelf`, `rack-9u` (wall rack cabinet), `rack-12u`, `media-box` (flush multimedia box), `ont` (operator fibre terminal).
Electrical (DIN): `shelly-pro-4pm`, `shelly-pro-3em`, `shelly-pro-2pm`, `shelly-pro-dimmer-2pm`, `surge-t1t2`, plus existing panel parts `main-switch`, `rcd`, `mcb-b10`, `mcb-b16`, `mcb-c20`, `panel-enclosure` (flush white board with transparent door, rows of DIN rail, parametric rows/slots).
Lighting: `hue-e27`, `hue-gu10`, `hue-bridge-pro`, `hue-play-gradient` (strip), `hue-lightstrip-plus` (strip), `hue-tap-dial`, `govee-strip-m1` (strip), `govee-floor-lamp-2`, `ikea-kajplats-e27`, `ikea-dirigera`.
Climate: `tado-trv-x`, `tado-bridge-x`, `tado-thermostat-x`, `aqara-temp`.
Sensors and security: `aqara-hub-m3`, `aqara-door-p2`, `aqara-motion-p2`, `aqara-fp2`, `aqara-leak`, `aqara-smoke`, `nuki-ultra`, `aqara-g5-pro`.
Hubs and media: `ha-green`, `ha-zbt2`, `homepod-mini`, `apple-tv-4k`, `nest-hub`, `google-tv-streamer`, `sonos-era-100`, `sonos-arc-ultra`.
Other: `roborock-saros-10r` (with dock), `shelly-plug-s`, `shelly-1-gen4`, `tesla-wall-connector`, `netatmo-weather`.
Tablets and mounts: `ipad-a16`, `ipad-mini`, `galaxy-tab-a9p`, `tablet-wall-mount` (magnetic PoE wall station), `tablet-stand` (magnetic stand).

## 2. Buildings — owner: building builder
Entry: `src/buildings/index.js`

```js
export const BUILDING_IDS = ['kawalerka', 'dom', 'gzowo', 'willa'];
export async function buildBuilding(id, opts = {}) {} // -> Building
```

```
Building = {
  id, name,
  group,                         // THREE.Group: structure, furniture, dumb fixtures, exterior surroundings
  data,                          // BuildingData, JSON-serialisable, sent to phones to draw the 2D plan
  wallGroups: [{ mesh, floor, side }],   // side 'N'|'E'|'S'|'W'|'int'; each has its OWN material instance (the game clips them for the cutaway)
  floorGroups: [{ group, floor }],       // per-floor content so upper floors can be hidden
  fixtures: [{ id, room, circuit, kind, object3d, emissive, lightPos: [x,y,z], socket: { kind: 'socketE27'|'socketGU10', pos, quat } | null }],
  setDoorOpen(id, open01) {}             // optional, entrance door for the handover
}
BuildingData = {
  id, name, area, floors: [{ index, y, height, name }],
  rooms: [{ id, name, floor, kind, poly: [[x,z], ...] }],      // kind: living|kitchen|bath|wc|bed|hall|tech|garage|balcony|terrace|office|outdoor
  walls: [{ floor, a: [x,z], b: [x,z], thick, exterior, openings: [{ t0, t1, kind: 'door'|'window'|'glass', sill, head }] }],
  furniture: [{ id, kind, floor, room, pos: [x,y,z], rot, size: [w,h,d] }],
  circuits: [{ id, label, kind: 'light'|'socket'|'appliance'|'heating', rooms: [...], breaker: 'B10'|'B16'|'C20' }],
  mounts: [{ id, room, floor, kind, pos: [x,y,z], normal: [x,y,z], quat: [x,y,z,w], circuit?, fixture?, tags: [] }],
  strips: [{ id, room, floor, kind: 'tv'|'kitchen'|'bed'|'cove'|'desk'|'shelf', points: [[x,y,z], ...] }],
  tabletSpots: [{ id, room, floor, kind: 'wall'|'surface', pos, quat, rating: 'good'|'ok'|'poor', why }],
  panel: { room, floor, pos, quat, rows, slotsPerRow },
  rack: { room, floor, pos, quat, units } | null,        // null for the flat (uses mediaBox)
  mediaBox: { room, floor, pos, quat } | null,
  wan: { room, floor, pos, quat },
  entrance: { pos, quat }, street: { pos }, camera: { target: [x,y,z], radius }
}
```

Mount kinds the buildings must provide (as many as make sense per room): `ceiling` (grid of points per room), `wall` (points along inner walls at 1.1 m and 2.2 m), `socketE27` / `socketGU10` (existing dumb fixtures — bulbs go there), `surface` (furniture tops), `floor`, `radiator` (valve point on each radiator, radiators under windows), `door` (inner door frames), `doorLock` (entrance door, inside), `window`, `outdoorWall` (facade points at 2.4-2.8 m, covering entrance, driveway, garden, jetty), `doorbell` (outside the entrance at 1.3 m), `tv` (behind the TV), `gate`, `garage`, `boiler`.
Every room has at least one dumb ceiling fixture on a lighting circuit, the TV wall has a TV, bedrooms have a bed, the kitchen has cabinets with an under-cabinet strip path.

Viewer: `Niepotrzebne/tools/buildings.html?id=<id>&view=dollhouse|plan|close` and `node Niepotrzebne/tools/buildshot.mjs <id> <out.png> [view]`.

## 3. Game modules — owner: lead
`src/shared/*` (protocol, catalog, jobs, requirements, coverage, state), `src/net/*`, `src/tv/*` (renderer, lighting, director, cutaway, HUD, close-ups, handover), `src/pad/*` (phone app), `src/dash/*` (dashboard renderers for Home Assistant / Apple Home / Google Home styles). Builders do not edit these.

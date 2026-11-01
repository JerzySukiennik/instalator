# Instalator FPP: contracts for builders

Jurek turned the game into a first-person computer game: each player on their own computer, online co-op in turns (one player works, the others walk and watch), WASD + mouse, crosshair interaction, hands holding tools, in-game panels for shop/list/tablet, Tab shows the old dollhouse map. Phones are gone. The lead writes the engine (`src/game/`), the builders deliver data and models.

Performance target stays: Intel MacBook Pro 2019 at 1080p, 60 fps, no visible hitches. Style stays: low-poly but realistic, like Rybna Wyspa and the current device models.

## Buildings (src/buildings, builder B2)

`buildBuilding(id, { fpp: true })` keeps the same return shape and adds:
- Ceilings and roof visible and correct when `fpp` is true (the dollhouse map still hides them; the lead toggles `ceilingGroups[i].group.visible` and `roof.group.visible`, so keep those handles). Pendants and ceiling fixtures attach to the ceiling.
- `data.walk = { spawn: { pos: [x, y, z], yaw }, eye: 1.65, stairs: [{ floor, from: [x, z], dir: [dx, dz], len, w, rise }], passable: [...] }`
  - `spawn` outside on the street or at the gate, facing the house. Kawalerka: on the landing in front of the flat door.
  - `stairs` one entry per flight, `from` = bottom edge centre, `dir` unit vector uphill, `rise` to the next floor; walkable as a ramp.
  - `passable` lists ids of door openings and gates a player can walk through (all interior doors, the entrance, garden gates).
- `obstacles` (already there) must cover everything a player should bump into at 0.05–1.8 m: furniture, kitchen islands, beds, cars, fences, trees, hedges, pool edge, jetty edges, railings. Thin decorative items can be skipped. Exterior walls of the block around the kawalerka do not need walking around; keep the player inside the flat plus landing.
- Doors: interior door leaves open by default in FPP so walking is smooth (or expose `setDoorOpen(id, open)` and the lead opens them).
- Eye-level quality: at 1.65 m everything is seen up close now. Skirting boards, door frames and handles, window sills, light switches and outlets on walls, ceiling lamps hanging from real ceilings, readable materials on floors and walls (procedural textures are fine), no z-fighting, no gaps at wall/floor/ceiling joints. Interiors must not be dark in daylight: light ceilings, window light, and a sensible ambient.
- Keep every existing data field (mounts, tabletSpots, circuits, panel, rack, zones, etc.) unchanged in meaning.

## Hands, tools, player avatar (src/models/fpp.js, builder B1)

- `buildHands({ sleeve: '#2f3e55', glove: '#2b2b2b', skin: '#e9bd98' })` returns a `THREE.Group` meant to be parented to the camera (camera looks down -Z, +Y up, units metres, hands sit about 0.25–0.55 m in front, right hand dominant). API on the group (`hands.userData.api`):
  - `setTool(id, deviceObj?)` with id in `none | drill | screwdriver | device | cable | label | tablet` (`device` holds the given Object3D, scaled to fit the hand; `cable` holds an RJ45 patch lead with a plug; `label` a label maker; `tablet` a tablet held in both hands).
  - `update(dt, { moving, sprint, look: [dx, dy], action: null | 'drill' | 'screw' | 'press' | 'place' | 'flip', k })` procedural animation: walk bob and sway, drill bit spin with recoil, screwdriver twist, press/push, place (reach forward), flip (finger flick). `k` is 0..1 progress for held actions.
  - Materials must render correctly with a separate near-plane camera layer (the lead renders hands in a second pass with depth cleared), so no reliance on scene shadows.
- `buildPlayer({ color: '#f28c28', name })` returns a low-poly installer for other players to see: cap or helmet in the player colour, hi-vis vest, work trousers, boots, tool belt. `userData.api.update(dt, { speed, pitch, holding })` animates walk cycle (rigid limbs are fine), head pitch, and shows a small held item.
- Budgets: hands + any tool under 6k triangles, avatar under 5k.

Report what you built, the API, and screenshots in `Niepotrzebne/shots/fpp/`. Use your own dev server port (8776 for B2, 8772 for B1), never 8771. Do not commit.

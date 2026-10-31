# Instalator — spec from the interview (2026-10-31)

A couch co-op web toy for Jurek's dad, who installs smart homes for real. Satisfying, never frustrating. More toy than full game.

## Platform
- **TV is the screen and the source of truth.** A laptop (Intel MacBook Pro 2019, Radeon Pro 5500M) drives the TV over HDMI at 1920x1080. Render budget: ~2.1 Mpx, 60 fps target, draw calls < 300, triangles < 1.5 M.
- **Phones are the tools.** 1-4 players join by QR + 4-letter room code (Jackbox style). iPhone XR Safari is the main phone, Android Chrome must work. Portrait.
- Transport: WebRTC DataChannels, Firebase RTDB (`gzowos-games`, europe-west1, anonymous auth, root `instalator/`) only for signaling + relay fallback. `?net=local` uses BroadcastChannel so a TV tab and pad tabs in one browser talk without Firebase (tests).
- Stack: three.js 0.187 ES modules from CDN, zero build. No physics engine needed.
- UI language: Polish. Real product names stay original. Prices in zł (approximate real Polish prices, 2026).

## Visual style
- Low-poly but realistic, **exactly the look of Jurek's game Rybna Wyspa** (`~/Downloads/Claude/Projects/Rybna Wyspa/`, screenshots in its `Niepotrzebne/shots/`): flat-shaded faceted geometry, no textures (or very subtle), muted natural palette, soft sun + hemisphere light, PCF soft shadows, AgX tone mapping (exposure ~1.1), light bloom on emissive LEDs and lamps, distance fog.
- Every device must look like the **real product** (UniFi, Philips Hue, Shelly, Aqara, tado°, Nuki, Sonos, iPad...). Recognisable silhouette, proportions, colours, LED placement, port layout.
- Buildings are shown as a **dollhouse cutaway**: no roof, walls facing the camera cut low, the TV camera is an automatic director (orbits, frames whatever the active player is doing, flies into close-ups of the panel, rack and tablet).

## Flow
1. **Lobby (TV):** title, QR, room code, joined players (name + colour). First phone = host.
2. **Rolling:** the TV deals **4 job cards** (animated). Card = building + client (persona) + budget + requirements + required platform (Home Assistant / Apple Home / Google Home / any). Phones vote, host can reroll. Most votes wins.
3. **Job:** camera flies into the almost empty building (furniture and dumb fixtures yes, smart devices no). **Power is off at the start** — the house is dark until someone flips the breakers.
4. **Turns: one turn = one task.** The active player picks a task card on the phone (Rozdzielnica, Szafa rack, Wi-Fi, a room, Tablet, Odbiór), does it on the phone while the TV shows everything, then ends the turn. Others watch, send reactions (pop on TV) and can ping a spot on the plan as a hint. Solo = always your turn. No timers.
5. **Handover (Odbiór):** callable any time, the checklist shows what's missing (no fail state). Cinematic on TV: day turns to dusk, the client arrives, walks to the tablet, checks requirements one by one (lights come on from the tablet, the camera feed shows on the tablet, the Wi-Fi heatmap flashes...). Review card: stars, quote, payment + bonus for unspent budget. Then free play ("Pobaw się domem": every phone becomes the dashboard, night, lights glow) and a beauty shot saved to a local portfolio. Then back to rolling.

## Buildings (4)
1. **Kawalerka na Mokotowie** — studio flat in a Warsaw block (~35 m²: main room, kitchenette, bathroom, hall, balcony). Small flush panel, no rack: a flush multimedia box in the hall. Budget ~5-9k zł.
2. **Dom pod Warszawą** — family house, 2 floors (~130 m²), garden, driveway, gate. Panel in the hall, 9U wall rack in the technical room. Budget ~15-30k zł.
3. **Domek w Gzowie nad Narwią** — the family's summer house: open-space living room + kitchen 12.4 x 8.4 m with full-height glazing to the terrace (OSB wall, marble floor, plywood ceiling on black rails, fireplace with flue, digital piano on an X stand, TV, long hanging shelf, sofa, plywood table on lime trestles, stainless kitchen), plus bedroom and bathroom, plot with fence + gate, river Narew with a jetty. Outdoor cameras and outdoor AP matter. The glazed open space has no good tablet wall → stand on the shelf. Budget ~10-20k zł.
4. **Willa w Konstancinie** — modern villa, flat roof, big glass, 2 floors (~280 m²), garage for 2 cars (EV charger), garden, gate, technical room with a 12U rack, big 3-phase panel. Budget ~40-80k zł.

## Systems
- **Shop** (phone): real products, real-ish PLN prices, badges for platform compatibility (HA / Apple Home / Google Home / Matter), PoE, hub requirements. Buying is instant, items land in the shared toolbox. Returns at full price until handover. Overspending allowed but costs stars.
- **Placement** (phone): 2D plan of the room/floor drawn from the same building data; mount points valid for the held device glow; tap one, then a short physical micro-interaction:
  - bulbs, tado° valves, Nuki: rotate gesture (screw in),
  - ceiling devices (AP, smoke, presence): hold to drill, tap to snap,
  - cameras: mount, then aim with the phone's gyroscope (drag fallback), FOV cone on TV,
  - LED strips: drag along the highlighted path, strip unrolls on TV,
  - stick-on sensors: swipe to peel the backing, tap to stick,
  - furniture devices (speakers, hubs, vacuum dock): tap.
- **Rozdzielnica** (electrical panel): power-on ritual (main switch, RCD, then each breaker with a swipe; rooms light up one by one on TV), label circuits, snap smart DIN modules (Shelly Pro 4PM / 3EM / 2PM / Dimmer 2PM) onto the rail, assign channels to circuits. Trying to install with power on = gentle spark + hint, no penalty. Neither full wiring nor fake toggles: DIN modules + flipping.
- **Szafa rack** (UniFi network): mount gear into U slots (gateway, PoE switch, patch panel, brush panel, NVR, UPS/PDU), cables inside walls run **automatically** with an animation from every PoE device to a labelled patch-panel port, then the player **patches by dragging** port to port (click, link LED, Etherlighting colour on Pro Max switches), then adopts devices in a UniFi-Network-like view. PoE budget is a light puzzle. A tidy rack earns a bonus.
- **Wi-Fi**: drag APs on the plan with a live coverage heatmap (like UniFi Design Center) on phone and TV. Requirement e.g. ≥ 90 % coverage.
- **Tablet**: buy a tablet, pick a spot. Good wall spots (central, power/PoE near, not facing glare) allow a wall mount; otherwise buy a magnetic stand for a counter/shelf. Mounting: spirit level with the phone's tilt + hold to drill + magnetic snap. Choose platform (**Home Assistant, Apple Home or Google Home**, or forced by the client), pair devices (scan animation), then **design the dashboard** on the phone in that platform's real visual style; the 3D tablet on the TV shows it live, camera cards show a live render from the 3D camera.
- **Handover scoring**: requirements met (main), budget, tidy rack, labelled circuits, tablet on a wall, extras.

## Gauntlet bar (Jurek chose "both at once" + real devices)
1. Blind A/B vs real Steam screenshots from matching shots: **Electrician Simulator** + its **Smart Devices** DLC (house, panel) and **Data Center** by Waseku (rack, cables); tablet screens vs the live **Home Assistant demo**, real **Apple Home** and **Google Home** screenshots. Ours must be picked blind.
2. Reference-free harsh critic: "Is this AAA, ready to go viral on Steam?" yes/no + 1-100 per category + 1-100 "how much AI slop". Must be yes.
3. Every device model identified blind from a lineup of real product photos.
Critics for models and visuals run on Opus.

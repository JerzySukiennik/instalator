# Instalator

A couch co-op web toy about outfitting homes with a real smart home. The TV shows the building as a low-poly 3D dollhouse; up to four phones join by QR code and become the tools. Take turns doing one job at a time: flip the breakers, snap Shelly modules onto the DIN rail, rack a UniFi network and patch it port to port, drag access points over a live Wi-Fi heatmap, screw in Hue bulbs, aim cameras, mount the tablet and design its dashboard in Home Assistant, Apple Home or Google Home style. Then the client walks in for the handover.

No phones? Click **Graj na tym komputerze** on the title screen and the tools dock next to the house.

## Run

Any static server from the project root, for example:

```
python3 Niepotrzebne/tools/devserver.py 8771 .
```

- `/` — the TV (laptop on the TV). Phones scan the QR code.
- `/?desk=1` — computer-only play with the tools panel docked on the right.
- `/?net=local&emu=1` — local test: TV plus an emulated phone in the same browser.
- `/?demo=dom&view=rack` — scripted install of a whole house, for screenshots (`view`: overview, night, rack, panel, tablet, wifi, outdoor, review, `kind:living`).

Stack: three.js 0.187 as ES modules from a CDN, no build step. Online rooms use WebRTC with Firebase Realtime Database for signalling.

## Credits

Real recorded sound effects from Freesound (CC0) and Kenney Interface Sounds (CC0). Two sounds are CC BY 4.0 by designerschoice: `magnet_snap` (freesound.org/s/852800) and `peel_sticker` (freesound.org/s/807636). See `assets/sfx/CREDITS.md`.

Product names belong to their owners (Ubiquiti, Philips Hue, Shelly, tado°, Aqara, Nuki, Sonos, Apple, Google, Home Assistant, IKEA, Govee, Roborock, Tesla, Netatmo, Hager, iPort, Lanberg, Samsung). This is a fan-made toy, not affiliated with any of them.

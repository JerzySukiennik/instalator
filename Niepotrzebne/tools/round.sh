#!/bin/zsh
# Instalator: capture one gauntlet round of shots (TV views, phone screens, dashboards, thumbnails) and build blind packs.
# usage: Niepotrzebne/tools/round.sh <round>
set -u
cd "$(dirname "$0")/../.."
R=${1:?round}
S=Niepotrzebne/gauntlet/shots/$R
P=Niepotrzebne/gauntlet/pack/$R
REF=Niepotrzebne/gauntlet/ref
mkdir -p $S $P/aaa
tv() { nice -n 10 node Niepotrzebne/tools/shot.mjs tv $S/tv-$1.png "$2" 2>&1 | grep -E "info|error|timeout" | tail -2; }
pad() { PWAIT=1800 nice -n 10 node Niepotrzebne/tools/shot.mjs pad $S/pad-$1.png "$2" "$3" 2>&1 | grep -E "error|timeout" | tail -2; }
tv overview-kawalerka "demo=kawalerka&view=overview&az=0.8"
tv overview-dom "demo=dom&view=overview&az=0.7"
tv overview-gzowo "demo=gzowo&view=overview&az=2.4"
tv overview-willa "demo=willa&view=overview&az=0.9"
tv night-dom "demo=dom&view=night&az=0.7"
tv night-willa "demo=willa&view=night&az=2.0"
tv rack-dom "demo=dom&view=rack"
tv rack-willa "demo=willa&view=rack"
tv panel-dom "demo=dom&view=panel"
tv tablet-dom "demo=dom&view=tablet&platform=ha"
tv living-dom "demo=dom&view=kind:living"
tv wifi-willa "demo=willa&view=wifi"
tv outdoor-gzowo "demo=gzowo&view=outdoor"
WAIT=9000 tv review-gzowo "demo=gzowo&view=review"
pad tasks "demo=dom&view=overview" ""
pad room "demo=dom&view=overview&stage=power" "window.__pad.send({a:'buy',id:'hue-e27',n:2}); window.__pad.openTask((window.__pad.S.tasks.find(t=>t.icon==='living')||{}).id); await new Promise(r=>setTimeout(r,900)); document.querySelector('.item[data-id=\"hue-e27\"]')?.click(); return 1"
pad panel "demo=dom&view=overview" "window.__pad.openTask('panel'); return 1"
pad rack "demo=dom&view=overview" "window.__pad.openTask('rack'); return 1"
pad wifi "demo=willa&view=overview" "window.__pad.send({a:'buy',id:'u7-pro',n:1}); window.__pad.openTask('wifi'); await new Promise(r=>setTimeout(r,900)); document.querySelector('.item[data-id=\"u7-pro\"]')?.click(); return 1"
pad dash "demo=dom&view=overview" "window.__pad.openTask('tablet'); await new Promise(r=>setTimeout(r,900)); document.querySelector('[data-s=\"dash\"]')?.click(); return 1"
pad shop "demo=dom&view=overview" "window.__pad.openTask('rack'); await new Promise(r=>setTimeout(r,700)); document.querySelector('.shopb')?.click(); return 1"
nice -n 10 node Niepotrzebne/tools/dashshot.mjs $S dom > /dev/null 2>&1
cp $S/*.png $P/aaa/ 2>/dev/null
python3 Niepotrzebne/tools/abpack.py $R house $S/tv-living-dom.png $REF/steam/electrician-smart/07.jpg $S/tv-overview-dom.png $REF/steam/electrician/07.jpg $S/tv-overview-willa.png $REF/steam/electrician-smart/05.jpg $S/tv-night-dom.png $REF/steam/electrician-smart-vr/05.jpg
python3 Niepotrzebne/tools/abpack.py $R rack $S/tv-rack-dom.png $REF/steam/datacenter/07.jpg $S/tv-rack-willa.png $REF/steam/datacenter/06.jpg
python3 Niepotrzebne/tools/abpack.py $R hud $S/tv-review-gzowo.png $REF/steam/electrician/06.jpg $S/tv-panel-dom.png $REF/steam/electrician-smart/08.jpg
python3 - "$S" "$REF" "$R" <<'PY'
import sys, os, subprocess
from PIL import Image
S, REF, R = sys.argv[1:4]
crops = {'google': (f'{REF}/ui/google-home/01.jpg', (147, 307, 2413, 1722)), 'apple': (f'{REF}/ui/apple-home/01.jpg', (700, 45, 1585, 955)), 'ha': (f'{REF}/ui/ha/01.png', None)}
args = []
for p, (src, box) in crops.items():
    im = Image.open(src).convert('RGB')
    if box: im = im.crop(box)
    dst = f'{S}/ref-dash-{p}.png'
    im.save(dst)
    args += [f'{S}/dash-{p}.png', dst]
subprocess.run(['python3', 'Niepotrzebne/tools/abpack.py', R, 'dash', *args])
PY
python3 Niepotrzebne/tools/idpack.py $R u7-pro u7-lite u7-pro-wall u7-outdoor g5-bullet g5-turret-ultra g5-flex g4-doorbell-pro ucg-ultra ucg-max udm-pro-max usw-lite-8-poe usw-pro-max-24-poe unvr shelly-pro-4pm shelly-pro-2pm hue-e27 hue-bridge-pro tado-trv-x nuki-ultra aqara-hub-m3 sonos-era-100 homepod-mini ipad-a16
ls $P

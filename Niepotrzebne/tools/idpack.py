# Instalator: device identification lineups for the gauntlet critic — our render vs 4 real photos (1 correct, 3 same-family decoys).
# usage: idpack.py <round> <id> [<id> ...]   (renders from assets/thumbs, photos from gauntlet/ref/devices)
import json, os, random, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
REF = os.path.join(ROOT, 'Niepotrzebne', 'gauntlet', 'ref', 'devices')
rnd, ids = sys.argv[1], sys.argv[2:]
out = os.path.join(ROOT, 'Niepotrzebne', 'gauntlet', 'pack', rnd, 'identify')
os.makedirs(out, exist_ok=True)
keyp = os.path.join(ROOT, 'Niepotrzebne', 'gauntlet', 'keys', f'{rnd}-identify.json')
os.makedirs(os.path.dirname(keyp), exist_ok=True)
photos = sorted(f for f in os.listdir(REF) if f.endswith('.jpg') and '-2' not in f)
pid = [f[:-4] for f in photos]
FAMILY = [('u7-', 'unifi-ap'), ('g5-', 'cam'), ('g4-', 'cam'), ('aqara-g5', 'cam'), ('usw-', 'switch'), ('ucg-', 'gw'), ('udm-', 'rack'), ('unvr', 'rack'), ('patch', 'rack'), ('pdu', 'rack'), ('ups', 'rack'), ('shelly-pro', 'din'), ('mcb', 'din'), ('rcd', 'din'), ('main-switch', 'din'), ('surge', 'din'), ('hue-', 'hue'), ('ikea', 'hue'), ('govee', 'hue'), ('aqara', 'aqara'), ('tado', 'tado'), ('nuki', 'aqara'), ('sonos', 'media'), ('homepod', 'media'), ('apple-tv', 'media'), ('nest', 'media'), ('google', 'media'), ('ha-', 'hub'), ('ipad', 'tab'), ('galaxy', 'tab'), ('tablet', 'tab')]
fam = lambda i: next((f for p, f in FAMILY if i.startswith(p)), 'other')
try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 34)
except Exception:
    font = ImageFont.load_default()
key = json.load(open(keyp)) if os.path.exists(keyp) else {}

def tile(path, size=420, bg=(255, 255, 255)):
    im = Image.open(path).convert('RGBA')
    im.thumbnail((size - 30, size - 30))
    t = Image.new('RGB', (size, size), bg)
    t.paste(im, ((size - im.width) // 2, (size - im.height) // 2), im)
    return t

for n, i in enumerate(ids, 1):
    if i not in pid or not os.path.exists(os.path.join(ROOT, 'assets', 'thumbs', f'{i}.png')):
        print('skip', i); continue
    same = [p for p in pid if p != i and fam(p) == fam(i)]
    other = [p for p in pid if p != i and p not in same]
    random.shuffle(same); random.shuffle(other)
    decoys = (same + other)[:3]
    opts = decoys + [i]
    random.shuffle(opts)
    W = 420
    sheet = Image.new('RGB', (W * 5 + 60, W + 90), (236, 232, 224))
    d = ImageDraw.Draw(sheet)
    sheet.paste(tile(os.path.join(ROOT, 'assets', 'thumbs', f'{i}.png'), W, (226, 222, 214)), (10, 70))
    d.text((20, 18), 'MODEL', fill=(20, 20, 20), font=font)
    for k, o in enumerate(opts):
        x = 60 + W * (k + 1)
        sheet.paste(tile(os.path.join(REF, f'{o}.jpg'), W), (x - 10, 70))
        d.text((x, 18), 'ABCD'[k], fill=(20, 20, 20), font=font)
    sheet.save(os.path.join(out, f'item{n:02d}.png'))
    key[f'item{n:02d}'] = {'id': i, 'answer': 'ABCD'[opts.index(i)], 'options': opts}
json.dump(key, open(keyp, 'w'), indent=1)
print('identify items', len(key), out)

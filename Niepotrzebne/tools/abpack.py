# Instalator: build blind A/B packs for the gauntlet critic (random X/Y, same size, no metadata, key kept apart).
# usage: abpack.py <round> <piece> <ours.png> <reference.jpg> [<ours2> <ref2> ...]
import json, os, random, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'gauntlet'))
rnd, piece, files = sys.argv[1], sys.argv[2], sys.argv[3:]
out = os.path.join(ROOT, 'pack', rnd, piece)
os.makedirs(out, exist_ok=True)
keyp = os.path.join(ROOT, 'keys', f'{rnd}.json')
os.makedirs(os.path.dirname(keyp), exist_ok=True)
key = json.load(open(keyp)) if os.path.exists(keyp) else {}

def norm(src, dst, size=(1600, 900)):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    tr = size[0] / size[1]
    if w / h > tr:
        nw = int(h * tr); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / tr); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im = im.resize(size, Image.LANCZOS)
    im.save(dst, 'PNG')

for i in range(0, len(files), 2):
    ours, ref = files[i], files[i + 1]
    pair = f'pair{i // 2 + 1}'
    flip = random.random() < 0.5
    x, y = (ours, ref) if flip else (ref, ours)
    norm(x, os.path.join(out, f'{pair}_X.png'))
    norm(y, os.path.join(out, f'{pair}_Y.png'))
    key[f'{piece}/{pair}'] = {'ours': 'X' if flip else 'Y'}
json.dump(key, open(keyp, 'w'), indent=1)
leak = [f for f in os.listdir(out) if any(t in f.lower() for t in ('ours', 'ref', 'steam', 'instalator'))]
print('pack', out, 'files', len(os.listdir(out)), 'leaks', leak)

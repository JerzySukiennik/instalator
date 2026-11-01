#!/usr/bin/env python3
"""Instalator SFX build: raw Freesound/Kenney files -> assets/sfx/<name>.mp3 (mono, 44.1 kHz, MP3 128k).

One-shots: silence trimmed at both ends, short fades so the cut never clicks.
Loops: seamless loop of M seconds, the tail blended into the head with an equal-power crossfade of X seconds.
Loudness: linear gain to -16 LUFS (EBU R128, ebur128 filter), capped so the true peak stays at or below -1 dBTP.
The cap steps down if MP3 encoding overshoots. Writes assets/sfx/manifest.json and CREDITS.md from the spec.

  python3 -I sfx_build.py spec.json [name ...]
"""
import json, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
WORK = os.path.join(ROOT, 'Niepotrzebne', 'audio-work', 'build')
OUT = os.path.join(ROOT, 'assets', 'sfx')
TARGET_LUFS = -16.0
PEAK_CEIL = -1.2
SR = 44100


def ffrun(args, loglevel='error'):
    cmd = ['ffmpeg', '-hide_banner', '-nostdin', '-y', '-loglevel', loglevel] + args
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f'ffmpeg failed: {" ".join(args)}\n{r.stderr[-800:]}')
    return r.stderr


def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                        '-of', 'default=nw=1:nk=1', path], capture_output=True, text=True)
    return float(r.stdout.strip())


def measure(path):
    err = ffrun(['-i', path, '-af', 'apad=pad_dur=1,ebur128=peak=true', '-f', 'null', '-'], loglevel='info')
    lufs = float(re.findall(r'I:\s+(-?[\d.]+)\s+LUFS', err)[-1])
    tp = float(re.search(r'Peak:\s+(-?[\d.]+)\s+dBFS', err.split('True peak:')[-1]).group(1))
    return lufs, tp


def build(name, spec):
    raw = os.path.join(WORK, f'{name}_raw.wav')
    ffrun(['-i', spec['src'], '-vn', '-ac', '1', '-ar', str(SR), '-c:a', 'pcm_f32le', raw])
    proc = os.path.join(WORK, f'{name}.wav')
    if spec['kind'] == 'loop':
        s, m, x = spec.get('start', 0.0), spec['M'], spec['X']
        fc = (f"[0:a]atrim=start={s}:end={s + m + x},asetpts=PTS-STARTPTS,asplit=2[a][b];"
              f"[a]atrim=start={m}:end={m + x},asetpts=PTS-STARTPTS[P];"
              f"[b]atrim=start=0:end={m},asetpts=PTS-STARTPTS[Q];"
              f"[P][Q]acrossfade=d={x}:c1=qsin:c2=qsin[out]")
        ffrun(['-i', raw, '-filter_complex', fc, '-map', '[out]', '-c:a', 'pcm_f32le', proc])
    else:
        ss, mx = spec.get('start', 0.0), spec.get('max')
        trim = (f"atrim=start={ss}" + (f":end={ss + mx}" if mx else '') + ','
                'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.01,areverse,'
                'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse')
        mid = os.path.join(WORK, f'{name}_trim.wav')
        ffrun(['-i', raw, '-af', trim, '-c:a', 'pcm_f32le', mid])
        d = duration(mid)
        ffrun(['-i', mid, '-af', f'afade=t=in:st=0:d=0.002,afade=t=out:st={max(0.0, d - 0.01):.4f}:d=0.01',
               '-c:a', 'pcm_f32le', proc])
    lufs_in, tp_in = measure(proc)
    out = os.path.join(OUT, f'{name}.mp3')
    gain = min(TARGET_LUFS - lufs_in, PEAK_CEIL - tp_in)
    for _ in range(8):
        ffrun(['-i', proc, '-af', f'volume={10 ** (gain / 20):.6f}', '-ar', str(SR), '-ac', '1',
               '-c:a', 'libmp3lame', '-b:a', '128k', out])
        lufs_out, tp_out = measure(out)
        if tp_out <= -1.0:
            break
        gain += PEAK_CEIL - tp_out
    return dict(dur=round(duration(out), 2), src_lufs=round(lufs_in, 2), src_tp=round(tp_in, 2),
                gain=round(gain, 2), lufs=round(lufs_out, 2), tp=round(tp_out, 2))


def write_metadata(spec):
    manifest = {}
    for name, s in spec.items():
        manifest[name] = {'file': f'{name}.mp3', 'license': s['license'], 'author': s['author'], 'source': s['source']}
    json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), ensure_ascii=False, indent=2)
    lines = ['# Sound credits', '',
             'Every file in this folder is CC0 1.0 (public domain) unless listed in the table below.',
             'Non-CC0 files need attribution, so their author, licence and link are listed here.', '']
    non = [(n, s) for n, s in spec.items() if s['license'] != 'CC0 1.0']
    if non:
        lines += ['| File | Author | Licence | Source |', '|---|---|---|---|']
        lines += [f"| {n}.mp3 | {s['author']} | {s['license']} | {s['source']} |" for n, s in non]
    else:
        lines.append('No CC BY files: all sounds are CC0 1.0, no attribution required.')
    lines.append('')
    open(os.path.join(OUT, 'CREDITS.md'), 'w').write('\n'.join(lines))


if __name__ == '__main__':
    spec = json.load(open(sys.argv[1]))
    only = sys.argv[2:]
    os.makedirs(WORK, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    for name, s in spec.items():
        if only and name not in only:
            continue
        print(f"{name:16} {build(name, s)}", flush=True)
    write_metadata(spec)
    print('manifest.json and CREDITS.md written')

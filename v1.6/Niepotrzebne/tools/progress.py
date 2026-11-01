# Instalator: update the live progress page data (progress.json).
# usage: progress.py phase "text" | piece <id> key=value ... | log "message"
import json, sys, time, pathlib
P = pathlib.Path(__file__).resolve().parent.parent / 'progress' / 'progress.json'
d = json.loads(P.read_text()) if P.exists() else {'phase': '', 'pieces': [], 'log': []}
now = time.strftime('%Y-%m-%dT%H:%M:%S%z')
cmd = sys.argv[1]
if cmd == 'phase':
    d['phase'] = sys.argv[2]
elif cmd == 'piece':
    pid = sys.argv[2]
    p = next((x for x in d['pieces'] if x['id'] == pid), None)
    if p is None:
        p = {'id': pid, 'name': pid, 'owner': '', 'status': 'todo', 'round': 0}
        d['pieces'].append(p)
    for kv in sys.argv[3:]:
        k, v = kv.split('=', 1)
        if k == 'shots':
            p['shots'] = [s for s in v.split(',') if s]
        elif k == 'round':
            p['round'] = int(v)
        else:
            p[k] = v
elif cmd == 'log':
    d['log'].append({'t': now, 'msg': sys.argv[2]})
    d['log'] = d['log'][-200:]
d['updated'] = now
P.write_text(json.dumps(d, ensure_ascii=False, indent=1))

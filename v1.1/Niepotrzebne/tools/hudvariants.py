# Instalator: build one HTML page with three HUD/phone style directions side by side over a real game frame (for Jurek to choose).
# usage: hudvariants.py <bg.png> <positions.json> <current-tv.png> <current-pad.png> <out.html>
import base64, io, json, sys
from PIL import Image

bg, posf, cur_tv, cur_pad, out = sys.argv[1:6]


def b64(path, size=None, fmt="JPEG", q=84):
    im = Image.open(path).convert("RGB")
    if size:
        im = im.resize(size, Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, fmt, quality=q) if fmt == "JPEG" else im.save(buf, fmt)
    return f"data:image/{fmt.lower()};base64," + base64.b64encode(buf.getvalue()).decode()


P = json.load(open(posf))


def pick(*keys):
    for k in keys:
        for name, v in P.items():
            if name == k or name.startswith(k):
                return v
    return [800, 450]


PANEL = pick("panel")
RACK = pick("rack")
GARDEN = pick("zone:driveway", "zone:garden")
TABLET = pick("tablet")
DONE = [pick("room:Kuchnia"), pick("room:WC"), pick("room:Salon"), pick("room:Hol:hall:0"), pick("room:Pokój gościnny"), pick("room:Taras")]

BG = b64(bg)
CUR_TV = b64(cur_tv, (1600, 900))
CUR_PAD = b64(cur_pad, None, "PNG")

html = r"""<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Instalator: kierunki HUD</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@500;600;700&family=Caveat:wght@600;700&family=Chakra+Petch:wght@600;700&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@500;700&family=Onest:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root { --page: #e9e7e1; --ink: #17191b; --mute: #5d6166; --line: #cfcac0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--page); color: var(--ink); font-family: Onest, system-ui, sans-serif; padding: 28px 16px 60px; }
.wrap { max-width: 1500px; margin: 0 auto; }
header h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; }
header p { color: var(--mute); font-size: 17px; margin-top: 6px; max-width: 900px; line-height: 1.45; }
section { margin-top: 44px; }
.sh { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
.sh .k { font-weight: 800; font-size: 15px; background: var(--ink); color: #fff; border-radius: 8px; padding: 4px 10px; }
.sh h2 { font-size: 28px; font-weight: 800; letter-spacing: -0.01em; }
.sh span { color: var(--mute); font-size: 16px; }
.row { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: start; }
@media (max-width: 860px) { .row { grid-template-columns: 1fr; } .row .ph { max-width: 300px; } }
.frame { position: relative; overflow: hidden; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.18); background: #000; }
.stage { position: absolute; left: 0; top: 0; transform-origin: 0 0; overflow: hidden; }
.tv .stage { width: 1600px; height: 900px; }
.ph .frame { border-radius: 34px; border: 8px solid #111; }
.ph .stage { width: 390px; height: 844px; }
.bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.cap { color: var(--mute); font-size: 14px; margin-top: 8px; line-height: 1.4; }
.cur img { width: 100%; display: block; }

/* ===== A: Protokół ===== */
.A { --paper: #eef1e8; --rule: #2f7a66; --pen: #1e3fae; --stamp: #5b3fa0; --print: #1c1f22; font-family: "IBM Plex Sans Condensed", sans-serif; color: var(--print); }
.A .clip { position: absolute; left: 30px; bottom: 26px; width: 430px; transform: rotate(-2deg); transform-origin: 0 100%; filter: drop-shadow(0 14px 22px rgba(0,0,0,.35)); }
.A .board { background: #b78a55; border-radius: 10px; padding: 34px 14px 14px; position: relative; }
.A .board::before { content: ""; position: absolute; left: 50%; top: -10px; width: 150px; height: 42px; transform: translateX(-50%); background: linear-gradient(#e1e4e8, #9aa1a9); border-radius: 8px 8px 14px 14px; box-shadow: inset 0 -3px 0 rgba(0,0,0,.25); }
.A .paper { background: var(--paper); padding: 16px 18px 14px; background-image: repeating-linear-gradient(to bottom, transparent 0 41px, rgba(47,122,102,.28) 41px 42px); background-position: 0 152px; }
.A .head { display: flex; justify-content: space-between; font-weight: 700; font-size: 17px; letter-spacing: .06em; color: var(--rule); border-bottom: 2px solid var(--rule); padding-bottom: 6px; }
.A .who { margin-top: 10px; font-size: 25px; font-weight: 700; }
.A .who span { display: block; font-size: 16px; font-weight: 500; color: #4b5257; }
.A .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
.A .field { border: 1.5px solid var(--rule); padding: 18px 10px 2px; position: relative; height: 66px; }
.A .field label { position: absolute; left: -1px; top: -1px; background: var(--rule); color: var(--paper); font-size: 12px; font-weight: 700; letter-spacing: .08em; padding: 1px 6px; }
.A .field i { font-family: Caveat, cursive; font-style: normal; font-weight: 700; font-size: 40px; color: var(--pen); line-height: 1; }
.A ol { list-style: none; margin-top: 14px; }
.A li { display: flex; align-items: center; gap: 12px; height: 42px; font-size: 21px; font-weight: 600; }
.A li em { margin-left: auto; font-style: normal; font-family: Caveat, cursive; font-size: 28px; color: var(--pen); }
.A .box { width: 26px; height: 26px; border: 2px solid var(--rule); flex: none; position: relative; }
.A li.tick { color: #6b7276; }
.A li.tick .txt { position: relative; }
.A li.tick .txt::after { content: ""; position: absolute; left: -2px; right: -4px; top: 52%; height: 3px; background: var(--pen); border-radius: 3px; transform: rotate(-1.2deg); }
.A .box svg { position: absolute; left: -4px; top: -10px; width: 36px; height: 36px; }
.A .done { margin-top: 8px; font-size: 17px; color: #4b5257; display: flex; justify-content: space-between; align-items: baseline; }
.A .done i { font-family: Caveat, cursive; font-style: normal; font-size: 30px; color: var(--pen); }
.A .tab { position: absolute; right: 30px; top: 26px; background: #f28c28; color: #1c1f22; border-radius: 6px 6px 0 0; padding: 8px 18px 6px; box-shadow: 0 8px 18px rgba(0,0,0,.28); }
.A .tab b { font-family: Caveat, cursive; font-size: 40px; line-height: .9; display: block; }
.A .tab small { font-size: 17px; font-weight: 600; letter-spacing: .04em; }
.A .stampx { position: absolute; left: 330px; bottom: 300px; width: 190px; height: 190px; border-radius: 50%; border: 6px solid var(--stamp); color: var(--stamp); display: grid; place-items: center; transform: rotate(-12deg); font-weight: 700; font-size: 30px; letter-spacing: .06em; opacity: .88; mix-blend-mode: multiply; text-align: center; line-height: 1; }
.A .stampx small { display: block; font-size: 15px; letter-spacing: .1em; margin-top: 6px; }
.Aph { background: #eef1e8; height: 100%; font-family: "IBM Plex Sans Condensed", sans-serif; color: #1c1f22; padding: 18px 16px; }
.Aph .top { border-bottom: 2px solid #2f7a66; padding-bottom: 8px; display: flex; justify-content: space-between; color: #2f7a66; font-weight: 700; font-size: 13px; letter-spacing: .08em; }
.Aph h3 { font-size: 26px; margin-top: 10px; }
.Aph .sub { color: #4b5257; font-size: 15px; }
.Aph .lab { margin-top: 16px; font-size: 13px; font-weight: 700; letter-spacing: .1em; color: #2f7a66; }
.Aph .r { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(47,122,102,.35); font-size: 18px; font-weight: 600; }
.Aph .r .b { width: 30px; height: 30px; border: 2px solid #2f7a66; flex: none; position: relative; }
.Aph .r .n { margin-left: auto; font-family: Caveat, cursive; font-size: 26px; color: #1e3fae; }
.Aph .r.hot { background: rgba(30,63,174,.07); margin: 0 -8px; padding: 10px 8px; }
.Aph .r.hot .n { color: #1e3fae; font-weight: 700; }
.Aph .r.ok { color: #6b7276; }
.Aph .r.ok .b::after { content: "✓"; position: absolute; inset: -10px -6px 0; font-family: Caveat, cursive; font-size: 40px; color: #1e3fae; line-height: 1; }
.Aph .sign { position: absolute; left: 16px; right: 16px; bottom: 26px; border-top: 2px solid #1c1f22; padding-top: 6px; font-size: 13px; letter-spacing: .08em; color: #4b5257; }
.Aph .sign b { position: absolute; right: 0; top: -44px; font-family: Caveat, cursive; font-size: 34px; color: #1e3fae; letter-spacing: 0; }

/* ===== B: Kontroler ===== */
.B { font-family: Onest, sans-serif; color: #e7ebf0; }
.B .bar { position: absolute; left: 0; right: 0; top: 0; height: 64px; background: rgba(16,20,26,.9); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 0 26px; border-bottom: 1px solid rgba(255,255,255,.08); }
.B .l { display: flex; align-items: center; gap: 12px; font-size: 25px; font-weight: 700; }
.B .l .badge { font-size: 15px; font-weight: 600; background: #1f2630; border: 1px solid rgba(255,255,255,.12); border-radius: 999px; padding: 4px 12px; color: #c8d0da; }
.B .m { display: flex; align-items: center; gap: 14px; }
.B .m .lab { font-size: 15px; color: #9aa6b2; font-weight: 600; }
.B .m b { font-family: "JetBrains Mono", monospace; font-size: 34px; font-weight: 700; }
.B .m .meter { width: 160px; height: 6px; border-radius: 3px; background: #2a323d; overflow: hidden; }
.B .m .meter i { display: block; height: 100%; width: 89%; background: #2d7ff9; }
.B .r { justify-self: end; display: flex; align-items: center; gap: 16px; }
.B .cnt { font-family: "JetBrains Mono", monospace; font-size: 32px; font-weight: 700; }
.B .cnt small { color: #7f8b97; font-size: 22px; }
.B .turn { display: flex; align-items: center; gap: 10px; background: #1f2630; border-radius: 999px; padding: 7px 16px 7px 8px; font-size: 21px; font-weight: 600; }
.B .turn i { width: 26px; height: 26px; border-radius: 50%; background: #f28c28; box-shadow: 0 0 0 3px rgba(242,140,40,.3); }
.B .pin { position: absolute; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; }
.B .pin span { background: rgba(16,20,26,.9); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 8px 14px; font-size: 21px; font-weight: 600; white-space: nowrap; display: flex; align-items: center; gap: 10px; }
.B .pin span small { font-family: "JetBrains Mono", monospace; color: #f5a524; font-size: 17px; }
.B .pin::after { content: ""; width: 2px; height: 26px; background: rgba(231,235,240,.6); }
.B .led { width: 14px; height: 14px; border-radius: 50%; flex: none; }
.B .led.am { background: #f5a524; box-shadow: 0 0 10px 3px rgba(245,165,36,.6); }
.B .led.gr { background: #34c77b; box-shadow: 0 0 8px 2px rgba(52,199,123,.6); }
.B .dot { position: absolute; transform: translate(-50%, -50%); width: 16px; height: 16px; border-radius: 50%; background: #34c77b; box-shadow: 0 0 0 4px rgba(16,20,26,.55), 0 0 12px 4px rgba(52,199,123,.55); }
.B svg.lines { position: absolute; inset: 0; pointer-events: none; }
.B .toast { position: absolute; left: 26px; bottom: 26px; display: flex; align-items: center; gap: 14px; background: rgba(16,20,26,.92); border: 1px solid rgba(255,255,255,.1); border-radius: 14px; padding: 14px 20px; font-size: 23px; font-weight: 600; }
.B .toast small { display: block; font-size: 15px; color: #9aa6b2; font-weight: 500; }
.Bph { background: #10141a; height: 100%; font-family: Onest, sans-serif; color: #e7ebf0; padding: 18px 14px; }
.Bph .t { display: flex; justify-content: space-between; align-items: center; }
.Bph h3 { font-size: 26px; font-weight: 700; }
.Bph .chip { font-family: "JetBrains Mono", monospace; font-size: 15px; background: #171c24; border-radius: 999px; padding: 5px 11px; }
.Bph .sub { color: #8d98a4; font-size: 15px; margin-top: 2px; }
.Bph .lab { margin: 18px 2px 8px; font-size: 14px; color: #8d98a4; font-weight: 600; }
.Bph .g { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.Bph .tile { background: #171c24; border-radius: 14px; padding: 12px 12px 12px 16px; position: relative; overflow: hidden; min-height: 92px; }
.Bph .tile::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--s, #34c77b); }
.Bph .tile b { display: block; font-size: 17px; font-weight: 600; margin-top: 8px; }
.Bph .tile small { color: #8d98a4; font-size: 13px; }
.Bph .tile .v { position: absolute; right: 12px; top: 12px; font-family: "JetBrains Mono", monospace; font-size: 14px; color: #c8d0da; }
.Bph .tile.hot { background: #1d2430; }
.Bph .led { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.Bph .go { position: absolute; left: 14px; right: 14px; bottom: 22px; height: 54px; border-radius: 14px; background: #2d7ff9; color: #fff; font-weight: 700; font-size: 18px; display: grid; place-items: center; }

/* ===== C: Skrzynka ===== */
.C { font-family: Barlow, sans-serif; color: #24282c; }
.C .tapes { position: absolute; left: 0; top: 36px; display: flex; flex-direction: column; gap: 12px; }
.C .tape { background: #f6f5ee; height: 48px; display: flex; align-items: center; gap: 12px; padding: 0 20px 0 26px; font-family: "Barlow Condensed", sans-serif; font-weight: 700; font-size: 27px; text-transform: uppercase; letter-spacing: .02em; box-shadow: 0 4px 0 rgba(0,0,0,.25); border-radius: 0 3px 3px 0; position: relative; width: max-content; }
.C .tape:nth-child(odd) { transform: rotate(-1deg); }
.C .tape:nth-child(even) { transform: rotate(.8deg); }
.C .tape::after { content: ""; position: absolute; right: -8px; top: 0; bottom: 0; width: 10px; background: linear-gradient(135deg, #f6f5ee 25%, transparent 25%) 0 0 / 10px 12px, linear-gradient(45deg, #f6f5ee 25%, transparent 25%) 0 0 / 10px 12px; }
.C .tape .pct { font-family: "Chakra Petch", sans-serif; font-size: 22px; color: #ff6b1a; }
.C .tape.peel { transform: rotate(9deg) translate(30px, 6px); opacity: .9; }
.C .tape.peel .ok { color: #3fb86b; }
.C .cone { position: absolute; transform: translate(-50%, -92%); width: 46px; filter: drop-shadow(0 6px 6px rgba(0,0,0,.4)); }
.C .belt { position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%); width: 980px; height: 112px; background: #24282c; border-radius: 22px; box-shadow: inset 0 2px 0 rgba(255,255,255,.10), inset 0 -5px 0 rgba(0,0,0,.4), 0 14px 28px rgba(0,0,0,.4); display: grid; grid-template-columns: 250px 1fr 120px; align-items: center; gap: 22px; padding: 0 26px; }
.C .belt i.s { position: absolute; width: 9px; height: 9px; border-radius: 50%; background: #5b6168; box-shadow: inset 0 1px 1px rgba(255,255,255,.2); }
.C .lcd { background: #b9c6a0; border-radius: 8px; box-shadow: inset 0 3px 6px rgba(0,0,0,.35), 0 0 0 2px #8e9a78; padding: 6px 14px; color: #24282c; }
.C .lcd small { font-family: "Barlow Condensed", sans-serif; font-weight: 700; font-size: 17px; letter-spacing: .08em; }
.C .lcd b { display: block; font-family: "Chakra Petch", sans-serif; font-size: 40px; line-height: 1; }
.C .task { display: flex; align-items: center; gap: 16px; }
.C .hol { width: 70px; height: 70px; border-radius: 16px; background: #ff6b1a; display: grid; place-items: center; box-shadow: inset 0 -5px 0 rgba(0,0,0,.25); }
.C .tt { background: #f6f5ee; font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 36px; padding: 2px 16px; transform: rotate(-1deg); text-transform: uppercase; }
.C .task small { display: block; color: #c6cbd0; font-family: "Barlow Condensed", sans-serif; font-weight: 700; letter-spacing: .1em; font-size: 18px; margin-top: 6px; }
.C .dial { width: 92px; height: 92px; border-radius: 50%; background: conic-gradient(#3fb86b 0 66%, #3a4046 66% 100%); display: grid; place-items: center; box-shadow: 0 0 0 4px #1b1e21; }
.C .dial div { width: 70px; height: 70px; border-radius: 50%; background: #24282c; display: grid; place-items: center; color: #f6f5ee; font-family: "Chakra Petch", sans-serif; font-size: 30px; font-weight: 700; }
.C .dial small { font-size: 17px; color: #9aa1a8; }
.C .slip { position: absolute; right: 30px; top: 30px; background: #f6f5ee; padding: 10px 18px; font-family: "Barlow Condensed", sans-serif; font-weight: 700; font-size: 25px; text-transform: uppercase; display: flex; gap: 12px; align-items: center; box-shadow: 0 4px 0 rgba(0,0,0,.25); transform: rotate(1.4deg); }
.C .slip i { width: 14px; height: 14px; border-radius: 50%; background: #3fb86b; box-shadow: 0 0 10px 2px rgba(63,184,107,.6); }
.Cph { background: #2b3035; height: 100%; font-family: Barlow, sans-serif; color: #f6f5ee; padding: 18px 14px; background-image: radial-gradient(rgba(0,0,0,.35) 2px, transparent 2.5px); background-size: 22px 22px; }
.Cph .lcd { background: #b9c6a0; color: #24282c; border-radius: 10px; padding: 8px 12px; box-shadow: inset 0 3px 6px rgba(0,0,0,.35), 0 0 0 2px #8e9a78; display: flex; justify-content: space-between; align-items: center; }
.Cph .lcd b { font-family: "Chakra Petch", sans-serif; font-size: 28px; }
.Cph .lcd small { font-family: "Barlow Condensed", sans-serif; font-weight: 700; letter-spacing: .08em; font-size: 14px; }
.Cph .lab { margin: 16px 0 8px; font-family: "Barlow Condensed", sans-serif; font-weight: 700; font-size: 16px; letter-spacing: .12em; color: #c6cbd0; }
.Cph .g { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.Cph .bin { background: #3a4046; border-radius: 14px; padding: 10px; box-shadow: inset 0 2px 0 rgba(255,255,255,.08), inset 0 -4px 0 rgba(0,0,0,.35); min-height: 96px; position: relative; }
.Cph .bin .tp { background: #f6f5ee; color: #24282c; font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 19px; text-transform: uppercase; padding: 1px 8px; display: inline-block; transform: rotate(-1deg); }
.Cph .bin small { display: block; margin-top: 10px; font-size: 14px; color: #c6cbd0; font-weight: 600; }
.Cph .bin .led { position: absolute; right: 10px; top: 12px; width: 12px; height: 12px; border-radius: 50%; }
.Cph .bin.hot { box-shadow: inset 0 0 0 3px #ff6b1a, inset 0 -4px 0 rgba(0,0,0,.35); }
.Cph .go { position: absolute; left: 14px; right: 14px; bottom: 22px; height: 64px; border-radius: 16px; background: #ff6b1a; color: #24282c; font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 26px; letter-spacing: .06em; display: grid; place-items: center; box-shadow: 0 6px 0 rgba(0,0,0,.35); }
</style>
</head>
<body>
<div class="wrap">
<header>
  <h1>Instalator: 3 kierunki wyglądu</h1>
  <p>Ten sam moment gry w każdym wariancie: dom pod Warszawą, tura Taty, 6 z 9 punktów z listy klienta. Po lewej telewizor, po prawej telefon. Wybierz literę (albo mieszankę, np. „B, ale taśmy z C”).</p>
</header>

<section>
  <div class="sh"><span class="k">A</span><h2>Protokół</h2><span>Papierowy protokół odbioru na podkładce: długopis, odhaczanie, fioletowa pieczątka „ODEBRANO”.</span></div>
  <div class="row">
    <div class="tv"><div class="frame" style="aspect-ratio:16/9"><div class="stage A">
      <img class="bg" src="__BG__" alt="">
      <div class="tab"><b>Tata</b><small>ROZDZIELNICA</small></div>
      <div class="clip"><div class="board"><div class="paper">
        <div class="head"><span>PROTOKÓŁ ODBIORU</span><span>NR 4927</span></div>
        <div class="who">Państwo Nowakowie<span>Dom pod Warszawą · Google Home</span></div>
        <div class="fields"><div class="field"><label>WYDANO</label><i>43 890 zł</i></div><div class="field"><label>ZOSTAŁO</label><i>5 610 zł</i></div></div>
        <ol>
          <li><span class="box"></span><span class="txt">Cały dom pod prądem</span><em>62%</em></li>
          <li><span class="box"></span><span class="txt">Kamera: podjazd</span></li>
          <li class="tick"><span class="box"><svg viewBox="0 0 36 36"><path d="M5 19 C9 22 11 26 13 30 C17 20 23 11 33 4" fill="none" stroke="#1e3fae" stroke-width="3.4" stroke-linecap="round"/></svg></span><span class="txt">Czujniki dymu w sypialniach</span></li>
          <li><span class="box"></span><span class="txt">Na tablecie: kamera, prąd</span></li>
        </ol>
        <div class="done"><span>zrobione</span><i>6 z 9</i></div>
      </div></div></div>
    </div></div>
    <p class="cap">TV: jedna podkładka w lewym dolnym rogu, środek kadru wolny. Gotowe punkty skreśla długopis i zwijają się do „zrobione 6 z 9”. Przy odbiorze na protokół spada pieczątka.</p></div>
    <div class="ph"><div class="frame" style="aspect-ratio:390/844"><div class="stage">
      <div class="Aph">
        <div class="top"><span>ZLECENIE NR 4927</span><span>6 / 9</span></div>
        <h3>Twoja tura, Tata</h3><div class="sub">Dom pod Warszawą · zostało 5 610 zł</div>
        <div class="lab">DO ZROBIENIA</div>
        <div class="r hot"><span class="b"></span>Rozdzielnica<span class="n">4 bez prądu</span></div>
        <div class="r"><span class="b"></span>Na zewnątrz<span class="n">kamera: podjazd</span></div>
        <div class="r"><span class="b"></span>Tablet<span class="n">pulpit</span></div>
        <div class="lab">ZROBIONE</div>
        <div class="r ok"><span class="b"></span>Szafa rack<span class="n">12/12</span></div>
        <div class="r ok"><span class="b"></span>Wi-Fi<span class="n">91%</span></div>
        <div class="r ok"><span class="b"></span>Kuchnia<span class="n">6/6</span></div>
        <div class="r ok"><span class="b"></span>Salon z jadalnią<span class="n">6/6</span></div>
        <div class="sign">PODPIS INSTALATORA: KONIEC TURY<b>Tata</b></div>
      </div>
    </div></div></div>
  </div>
</section>

<section>
  <div class="sh"><span class="k">B</span><h2>Kontroler</h2><span>Ciemny panel jak aplikacja UniFi albo Apple Home w nocy: diody, cienkie linie, liczby w mono.</span></div>
  <div class="row">
    <div class="tv"><div class="frame" style="aspect-ratio:16/9"><div class="stage B">
      <img class="bg" src="__BG__" alt="">
      <svg class="lines" viewBox="0 0 1600 900"><path d="M__GX__ __GY__ C __GX__ __MIDY__, __RX__ __MIDY__, __RX__ __RY__" fill="none" stroke="#2d7ff9" stroke-width="3" stroke-dasharray="8 7" opacity=".9"/></svg>
      __DONEDOTS__
      <div class="pin" style="left:__PX__px;top:__PY__px"><span><i class="led am"></i>Rozdzielnica<small>4 obwody bez prądu</small></span></div>
      <div class="pin" style="left:__GX__px;top:__GY__px"><span><i class="led am"></i>Kamera: podjazd</span></div>
      <div class="bar">
        <div class="l">Państwo Nowakowie<span class="badge">Google Home</span></div>
        <div class="m"><span class="lab">zostało</span><b>5 610 zł</b><div class="meter"><i></i></div></div>
        <div class="r"><div class="cnt">6<small>/9</small></div><div class="turn"><i></i>Tata · Rozdzielnica</div></div>
      </div>
      <div class="toast"><i class="led gr"></i><div>Czujniki dymu w sypialniach<small>z listy klienta</small></div></div>
    </div></div>
    <p class="cap">TV: cienki pasek u góry, a lista klienta to diody wiszące nad miejscami w domu (bursztynowa = do zrobienia, zielona = gotowe). Przy sieci od urządzenia do szafy rysuje się niebieska linia.</p></div>
    <div class="ph"><div class="frame" style="aspect-ratio:390/844"><div class="stage">
      <div class="Bph">
        <div class="t"><h3>Twoja tura</h3><span class="chip">6/9</span></div><div class="sub">Dom pod Warszawą · zostało 5 610 zł</div>
        <div class="lab">Do zrobienia</div>
        <div class="g">
          <div class="tile hot" style="--s:#f5a524"><span class="led" style="background:#f5a524"></span><span class="v">0/4</span><b>Rozdzielnica</b><small>4 obwody bez prądu</small></div>
          <div class="tile" style="--s:#f5a524"><span class="led" style="background:#f5a524"></span><span class="v">1/2</span><b>Na zewnątrz</b><small>kamera: podjazd</small></div>
          <div class="tile" style="--s:#f5a524"><span class="led" style="background:#f5a524"></span><b>Tablet</b><small>dodaj kafelki</small></div>
        </div>
        <div class="lab">Gotowe</div>
        <div class="g">
          <div class="tile"><span class="led" style="background:#34c77b"></span><span class="v">12/12</span><b>Szafa rack</b><small>online</small></div>
          <div class="tile"><span class="led" style="background:#34c77b"></span><span class="v">91%</span><b>Wi-Fi</b><small>zasięg</small></div>
          <div class="tile"><span class="led" style="background:#34c77b"></span><span class="v">6/6</span><b>Kuchnia</b><small>sparowane</small></div>
          <div class="tile"><span class="led" style="background:#34c77b"></span><span class="v">6/6</span><b>Salon</b><small>sparowane</small></div>
        </div>
        <div class="go">Zakończ turę</div>
      </div>
    </div></div></div>
  </div>
</section>

<section>
  <div class="sh"><span class="k">C</span><h2>Skrzynka</h2><span>Skrzynka narzędziowa z budowy: grafitowa guma, pomarańczowy spust, taśma z drukarki etykiet, wyświetlacz z miernika.</span></div>
  <div class="row">
    <div class="tv"><div class="frame" style="aspect-ratio:16/9"><div class="stage C">
      <img class="bg" src="__BG__" alt="">
      <svg class="cone" style="left:__PX__px;top:__PY__px" viewBox="0 0 46 56"><path d="M23 2 L38 46 H8 Z" fill="#ff6b1a"/><path d="M15 26 H31 L33.5 33 H12.5 Z" fill="#f6f5ee"/><rect x="2" y="46" width="42" height="8" rx="2" fill="#24282c"/></svg>
      <svg class="cone" style="left:__GX__px;top:__GY__px" viewBox="0 0 46 56"><path d="M23 2 L38 46 H8 Z" fill="#ff6b1a"/><path d="M15 26 H31 L33.5 33 H12.5 Z" fill="#f6f5ee"/><rect x="2" y="46" width="42" height="8" rx="2" fill="#24282c"/></svg>
      <div class="tapes">
        <div class="tape">Cały dom pod prądem <span class="pct">62%</span></div>
        <div class="tape">Kamera: podjazd</div>
        <div class="tape">Na tablecie: kamera, prąd</div>
        <div class="tape peel"><span class="ok">●</span>Czujniki dymu w sypialniach</div>
      </div>
      <div class="slip"><i></i>Tura: Tata</div>
      <div class="belt">
        <i class="s" style="left:12px;top:12px"></i><i class="s" style="right:12px;top:12px"></i><i class="s" style="left:12px;bottom:12px"></i><i class="s" style="right:12px;bottom:12px"></i>
        <div class="lcd"><small>ZOSTAŁO</small><b>5 610 zł</b></div>
        <div class="task"><div class="hol"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#24282c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M4 9h16M4 15h16M8 6v1.5M12 6v1.5M16 6v1.5"/></svg></div><div><div class="tt">Rozdzielnica</div><small>4 OBWODY BEZ PRĄDU</small></div></div>
        <div class="dial"><div>6<small>/9</small></div></div>
      </div>
    </div></div>
    <p class="cap">TV: pas narzędziowy na dole (budżet na wyświetlaczu z miernika), lista klienta to paski taśmy po lewej. Gotowy pasek odkleja się i spada, a w domu pomarańczowe pachołki pokazują, gdzie jest robota.</p></div>
    <div class="ph"><div class="frame" style="aspect-ratio:390/844"><div class="stage">
      <div class="Cph">
        <div class="lcd"><small>ZOSTAŁO</small><b>5 610 zł</b><small>6/9</small></div>
        <div class="lab">DO ZROBIENIA</div>
        <div class="g">
          <div class="bin hot"><span class="tp">Rozdzielnica</span><i class="led" style="background:#ff6b1a"></i><small>4 obwody bez prądu</small></div>
          <div class="bin"><span class="tp">Na zewnątrz</span><i class="led" style="background:#ff6b1a"></i><small>kamera: podjazd</small></div>
          <div class="bin"><span class="tp">Tablet</span><i class="led" style="background:#ff6b1a"></i><small>dodaj kafelki</small></div>
        </div>
        <div class="lab">GOTOWE</div>
        <div class="g">
          <div class="bin"><span class="tp">Szafa rack</span><i class="led" style="background:#3fb86b"></i><small>12/12 online</small></div>
          <div class="bin"><span class="tp">Wi-Fi</span><i class="led" style="background:#3fb86b"></i><small>zasięg 91%</small></div>
          <div class="bin"><span class="tp">Kuchnia</span><i class="led" style="background:#3fb86b"></i><small>6/6</small></div>
          <div class="bin"><span class="tp">Salon</span><i class="led" style="background:#3fb86b"></i><small>6/6</small></div>
        </div>
        <div class="go">GOTOWE · TRZYMAJ</div>
      </div>
    </div></div></div>
  </div>
</section>

<section class="cur">
  <div class="sh"><span class="k">0</span><h2>Obecny</h2><span>Dla porównania: tak jest teraz.</span></div>
  <div class="row">
    <div class="tv"><div class="frame"><img src="__CUR_TV__" alt=""></div></div>
    <div class="ph"><div class="frame"><img src="__CUR_PAD__" alt=""></div></div>
  </div>
</section>
</div>
<script>
function fit() {
  document.querySelectorAll(".frame").forEach((f) => {
    const s = f.querySelector(".stage");
    if (!s) return;
    const k = f.clientWidth / s.offsetWidth;
    s.style.transform = `scale(${k})`;
  });
}
addEventListener("resize", fit);
document.fonts && document.fonts.ready.then(fit);
fit();
</script>
</body>
</html>
"""

dots = "".join(f'<div class="dot" style="left:{x}px;top:{y}px"></div>' for x, y in DONE)
rep = {
    "__BG__": BG, "__CUR_TV__": CUR_TV, "__CUR_PAD__": CUR_PAD, "__DONEDOTS__": dots,
    "__PX__": str(PANEL[0]), "__PY__": str(PANEL[1]), "__GX__": str(GARDEN[0]), "__GY__": str(GARDEN[1]),
    "__RX__": str(RACK[0]), "__RY__": str(RACK[1]), "__MIDY__": str(min(GARDEN[1], RACK[1]) - 120),
}
for k, v in rep.items():
    html = html.replace(k, v)
open(out, "w").write(html)
print("wrote", out, len(html) // 1024, "KB", "panel", PANEL, "garden", GARDEN, "rack", RACK)

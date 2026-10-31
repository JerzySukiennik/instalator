// Instalator: phone app — joins the TV, mirrors the state and routes between lobby, voting, tasks, watching and free play.

import { connectClient } from "../net/index.js";
import { PROTO, REACTIONS } from "../shared/protocol.js";
import { fmtZl } from "../shared/catalog.js";
import { icon, avatar } from "../shared/icons.js";
import { $, el, esc, haptic, toast, confirmBox } from "./ui.js";
import { askOrientation } from "./gestures.js";
import { renderDash, gridRect, cardRect, cardInfo } from "../dash/render.js";

const q = new URLSearchParams(location.search);
const app = document.getElementById("app");
const room = (q.get("room") || "").toUpperCase();
const cid = (() => {
  try {
    const k = `instalator.cid.${room}`;
    let v = sessionStorage.getItem(k);
    if (!v || q.get("emu")) { v = `p${Math.random().toString(36).slice(2, 9)}`; if (!q.get("emu")) sessionStorage.setItem(k, v); }
    return v;
  } catch (e) { return `p${Math.random().toString(36).slice(2, 9)}`; }
})();

const ctx = {
  S: null, B: null, me: null, link: null, view: null, task: null, mounted: null, mountedKey: "",
  send(a) { if (this.link) this.link.send({ t: "act", ...a }); },
  stream(m) { if (this.link) this.link.stream(m); },
  openTask(id) { this.task = id; this.send({ a: "task", id }); route(true); },
  closeTask() { this.task = null; this.send({ a: "task", id: null }); route(true); },
  rerender() { route(true); }
};
window.__pad = ctx;

function savedName() { try { return localStorage.getItem("instalator.name") || ""; } catch (e) { return ""; } }

function joinView(err) {
  app.innerHTML = "";
  const v = el(`<div class="join">
    <span class="tape k" style="align-self:flex-start">pokój ${esc(room || "?")}</span>
    <h1>Instala&shy;tor</h1>
    <div style="color:var(--ink2);line-height:1.4">Twój telefon to narzędzia: wkręcasz, wiercisz, pstrykasz bezpieczniki i projektujesz tablet. Wszystko widać na telewizorze.</div>
    <input id="nm" maxlength="14" placeholder="Twoje imię" value="${esc(q.get("name") || savedName())}" autocomplete="off">
    <button class="btn y" id="go">Dołącz ${icon("plus", 20, 2.4)}</button>
    ${err ? `<div class="tape" style="background:var(--err);color:#fff">${esc(err)}</div>` : ""}
  </div>`);
  app.appendChild(v);
  const go = async () => {
    const name = $("#nm").value.trim() || "Gracz";
    try { localStorage.setItem("instalator.name", name); } catch (e) {}
    askOrientation();
    $("#go").disabled = true;
    $("#go").textContent = "Łączę…";
    connect(name);
  };
  $("#go").onclick = go;
  if (q.get("emu") && q.get("name")) setTimeout(go, 300);
}

async function connect(name) {
  try {
    ctx.link = await connectClient({
      code: room, cid,
      onOpen: () => ctx.send({ a: "hello", name, proto: PROTO }),
      onMsg,
      onClose: () => { ctx.link = null; joinView("Połączenie zerwane. Dołącz jeszcze raz."); }
    });
  } catch (e) {
    joinView(e.message === "room-not-found" ? "Nie ma takiego pokoju. Sprawdź kod na telewizorze." : "Nie udało się połączyć.");
  }
}

function onMsg(m) {
  if (m.t === "welcome") { ctx.me = m.you; haptic(); route(true); return; }
  if (m.t === "building") { ctx.B = m.data; route(true); return; }
  if (m.t === "state") {
    const prev = ctx.S;
    ctx.S = m.s;
    const mine = m.s.players.find((p) => p.cid === cid);
    if (mine) ctx.me = { ...ctx.me, ...mine };
    if (prev && prev.phase !== m.s.phase) { ctx.task = null; haptic(true); }
    if (prev && prev.active !== m.s.active && m.s.active === cid) { haptic(true); toast("Twoja tura! Wybierz zadanie."); ctx.task = null; }
    route(false);
    return;
  }
  if (m.t === "nope") { toast(m.text, true); return; }
  if (m.t === "fx") { if (ctx.mounted?.fx) ctx.mounted.fx(m.e); }
}

function isMyTurn() {
  const S = ctx.S;
  const online = S.players.filter((p) => p.online);
  return online.length <= 1 || S.active === cid;
}

function topBar(title, sub, opts = {}) {
  const S = ctx.S;
  const left = S.budget ? S.budget.total - S.budget.spent : 0;
  return `<div class="top">
    ${opts.back ? `<button class="iconbtn back">${icon("back", 22, 2.2)}</button>` : `<span class="me" style="background:${ctx.me?.color || "#ccc"}">${icon("drill", 18, 2)}</span>`}
    <div class="title"><b>${esc(title)}</b><span>${esc(sub || "")}</span></div>
    ${S.phase === "job" || S.phase === "play" ? `<div class="money ${left < 0 ? "over" : ""}"><small>zostało</small>${fmtZl(left)}</div>` : ""}
  </div>`;
}

function route(force) {
  const S = ctx.S;
  if (!S || !ctx.me) return;
  let key;
  if (S.phase === "lobby") key = "lobby";
  else if (S.phase === "board") key = "board";
  else if (S.phase === "job") key = !isMyTurn() ? "watch" : ctx.task ? `task:${ctx.task}` : "tasks";
  else if (S.phase === "handover") key = "handover";
  else if (S.phase === "review") key = "review";
  else key = "play";
  if (key.startsWith("task:") && !ctx.B) key = "tasks";
  if (!force && key === ctx.mountedKey && ctx.mounted?.update) { ctx.mounted.update(ctx); return; }
  if (ctx.mounted?.destroy) ctx.mounted.destroy();
  ctx.mounted = null;
  ctx.mountedKey = key;
  app.innerHTML = "";
  if (key === "lobby") lobbyView();
  else if (key === "board") boardView();
  else if (key === "tasks") tasksView();
  else if (key === "watch") watchView();
  else if (key === "handover") watchView(true);
  else if (key === "review") reviewView();
  else if (key === "play") playView();
  else taskView(ctx.task);
}

function lobbyView() {
  const S = ctx.S;
  app.innerHTML = `${topBar(ctx.me.name, ctx.me.host ? "Gospodarz" : "Gracz")}
    <div class="body">
      <div class="h">W pokoju ${esc(room)}</div>
      <div class="list">${S.players.map((p) => `<div class="row"><span class="me" style="width:30px;height:30px;border-radius:50%;background:${p.color};display:grid;place-items:center">${icon("drill", 16, 2)}</span><div class="grow"><b>${esc(p.name)}${p.cid === cid ? " (ty)" : ""}</b><span>${p.host ? "gospodarz" : p.online ? "gotowy" : "rozłączony"}</span></div></div>`).join("")}</div>
      <div class="h">Jak to działa</div>
      <div class="list">
        <div class="row">${icon("din", 24)}<div class="grow"><b>Gracie na zmianę</b><span>Jedna tura to jedno zadanie: rozdzielnica, rack, pokój albo tablet.</span></div></div>
        <div class="row">${icon("tablet", 24)}<div class="grow"><b>Telefon to narzędzia</b><span>Wkręcasz żarówki, wiercisz, patchujesz kable. Efekt widać na telewizorze.</span></div></div>
        <div class="row">${icon("star", 24)}<div class="grow"><b>Na końcu odbiór</b><span>Klient sprawdza listę. Nie da się przegrać.</span></div></div>
      </div>
    </div>
    <div class="foot">${ctx.me.host ? `<button class="btn y" id="start">Pokaż zlecenia ${icon("play", 18, 2)}</button>` : `<div class="tape" style="margin:auto">Czekamy, aż gospodarz wystartuje</div>`}</div>`;
  const st = $("#start");
  if (st) st.onclick = () => { haptic(); ctx.send({ a: "start" }); };
}

function boardView() {
  const S = ctx.S;
  const mine = S.board.votes[cid];
  app.innerHTML = `${topBar("Zlecenia", "Zagłosuj, które bierzecie")}
    <div class="body"><div class="vote">${S.board.jobs.map((j, i) => {
      const voters = Object.entries(S.board.votes).filter(([, x]) => x === i).map(([c]) => S.players.find((p) => p.cid === c)).filter(Boolean);
      return `<button class="vjob ${mine === i ? "mine" : ""}" data-i="${i}">${avatar(j.client.look, 46)}<div><b>${esc(j.buildingName)}</b><span>${esc(j.client.name)} · ${esc(j.platformName)} · ${j.reqs.length} wymagań</span></div><div><div class="m">${fmtZl(j.budget)}</div><div class="dots">${voters.map((p) => `<i style="background:${p.color}"></i>`).join("")}</div></div></button>`;
    }).join("")}</div></div>
    ${ctx.me.host ? `<div class="foot"><button class="btn w" id="reroll">Przelosuj</button><button class="btn y" id="pick">Bierzemy!</button></div>` : ""}`;
  app.querySelectorAll(".vjob").forEach((b) => (b.onclick = () => { haptic(); ctx.send({ a: "vote", i: Number(b.dataset.i) }); }));
  if ($("#reroll")) $("#reroll").onclick = () => { haptic(); ctx.send({ a: "reroll" }); };
  if ($("#pick")) $("#pick").onclick = () => { haptic(true); ctx.send({ a: "pick" }); };
  ctx.mounted = { update: () => route(true) };
}

function taskStatus(t) {
  const S = ctx.S;
  const reqs = S.job?.reqs || [];
  const st = (type) => reqs.filter((r) => type(r)).map((r) => S.reqs.find((x) => x.id === r.id));
  const map = {
    panel: (r) => ["power", "labels", "energy", "blinds"].includes(r.type),
    rack: (r) => ["nvr", "ups"].includes(r.type),
    wifi: (r) => ["wifi", "wifizone"].includes(r.type),
    tablet: (r) => ["tablet", "dash"].includes(r.type)
  };
  if (map[t.id]) { const a = st(map[t.id]); return { n: a.length, ok: a.filter((x) => x?.ok).length }; }
  return null;
}

function tasksView() {
  const S = ctx.S;
  const solo = S.players.filter((p) => p.online).length <= 1;
  const powerOff = !(S.panel?.main);
  const tasks = S.tasks || [];
  app.innerHTML = `${topBar(S.job.client.name, S.job.buildingName)}
    <div class="body">
      <div class="h"><span>${solo ? "Co robimy?" : "Twoja tura: wybierz jedno zadanie"}</span><span>${(S.reqs || []).filter((r) => r.ok).length}/${(S.reqs || []).length}</span></div>
      <div class="tasks">${tasks.map((t) => {
        const st = taskStatus(t);
        const hot = t.id === "panel" && powerOff;
        const done = st && st.n && st.ok === st.n;
        const sub = t.id === "panel" ? (powerOff ? "Prąd wyłączony. Zacznij tutaj!" : "Bezpieczniki, moduły Shelly") : t.id === "rack" ? "Bramka, switch, patchowanie" : t.id === "wifi" ? `Zasięg ${Math.round((S.der?.cov || 0) * 100)}%` : t.id === "tablet" ? (S.tablet?.mount ? "Projekt pulpitu" : "Kup, powieś, sparuj") : t.id === "handover" ? "Zawołaj klienta" : t.id === "outdoor" ? "Kamery, dzwonek, brama" : roomSub(t.room);
        return `<button class="task ${hot ? "hot" : ""} ${done ? "done" : ""} ${t.id === "handover" ? "wide" : ""}" data-id="${esc(t.id)}">${icon(t.icon || "home", 26, 1.9)}<div><b>${esc(t.name)}</b><br><small>${esc(sub)}</small></div></button>`;
      }).join("")}</div>
    </div>`;
  app.querySelectorAll(".task").forEach((b) => (b.onclick = () => { haptic(); ctx.openTask(b.dataset.id); }));
  ctx.mounted = { update: () => route(true) };
}

function roomSub(roomId) {
  const S = ctx.S;
  const n = S.devs.filter((d) => d.room === roomId && d.place !== "fixed").length;
  return n ? `${n} urządz.` : "Pusto";
}

function watchView(handover = false) {
  const S = ctx.S;
  const act = S.players.find((p) => p.cid === S.active);
  const t = (S.tasks || []).find((x) => x.id === S.turn?.task);
  app.innerHTML = `${topBar(ctx.me.name, handover ? "Odbiór" : "Kibicujesz")}
    <div class="body">
      <div class="watch card" style="background:var(--card);border-radius:18px;padding:16px;border:1px solid var(--line)">
        ${handover ? `<div class="tape y">odbiór u klienta</div><div class="who">Patrzcie na telewizor</div><div class="what">Klient sprawdza listę.</div>` : `<div class="tape">teraz robi</div><div class="who" style="color:${act?.color || "inherit"}">${esc(act?.name || "…")}</div><div class="what">${t ? esc(t.name) : "wybiera zadanie"}</div>`}
      </div>
      <div class="h">Reakcje na telewizorze</div>
      <div class="reacts">${REACTIONS.map((e) => `<button data-e="${e}">${e}</button>`).join("")}</div>
      <div class="h">Lista klienta</div>
      <div class="list">${(S.job?.reqs || []).map((r) => { const st = S.reqs.find((x) => x.id === r.id); return `<div class="row"><span class="chk ${st?.ok ? "on" : ""}">${st?.ok ? icon("check", 14, 3) : ""}</span><div class="grow"><b style="font-weight:600">${esc(r.text)}</b></div></div>`; }).join("")}</div>
    </div>`;
  app.querySelectorAll(".reacts button").forEach((b) => (b.onclick = () => { haptic(); ctx.send({ a: "react", e: b.dataset.e }); }));
  ctx.mounted = { update: () => route(true) };
}

function reviewView() {
  const S = ctx.S;
  const r = S.review;
  app.innerHTML = `${topBar("Odbiór", S.job.client.name)}
    <div class="body">
      <div class="bigtick">${"★".repeat(Math.floor(r.stars))}${r.stars % 1 ? "½" : ""}</div>
      <div class="list">
        <div class="row"><div class="grow"><b>Spełnione wymagania</b></div><b>${r.met}/${r.total}</b></div>
        <div class="row"><div class="grow"><b>Budżet</b><span>${r.left >= 0 ? "zostało" : "przekroczony"}</span></div><b>${fmtZl(Math.abs(r.left))}</b></div>
        <div class="row"><div class="grow"><b>Zapłata z napiwkiem</b></div><b>${fmtZl(r.pay)}</b></div>
      </div>
    </div>
    ${ctx.me.host ? `<div class="foot"><button class="btn w" id="next">Nowe zlecenie</button><button class="btn y" id="play">Pobaw się domem</button></div>` : `<div class="foot"><div class="tape" style="margin:auto">Gospodarz decyduje, co dalej</div></div>`}`;
  if ($("#next")) $("#next").onclick = () => ctx.send({ a: "next" });
  if ($("#play")) $("#play").onclick = () => ctx.send({ a: "play" });
  ctx.mounted = { update: () => route(true) };
}

function playView() {
  const S = ctx.S;
  app.innerHTML = `${topBar("Pobaw się domem", S.job?.client.name || "")}<div class="body flush"><div class="dashwrap"><canvas id="dash"></canvas></div><div class="h" style="margin:4px 14px">Stuknij kafelek, żeby sterować domem na telewizorze</div></div>${ctx.me.host ? `<div class="foot"><button class="btn w" id="next">Nowe zlecenie</button></div>` : ""}`;
  const cv = $("#dash");
  const W = 1180, H = 820;
  cv.width = W; cv.height = H;
  const paint = () => renderDash(cv.getContext("2d"), W, H, ctx.S, ctx.B);
  paint();
  cv.onclick = (e) => {
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    const g = gridRect(W, H, ctx.S.tablet.platform || "ha");
    for (const c of ctx.S.tablet.dash.cards) {
      const cr = cardRect(g, c);
      if (x >= cr.x && x <= cr.x + cr.w && y >= cr.y && y <= cr.y + cr.h) {
        haptic();
        const info = cardInfo(ctx.S, ctx.B, c);
        if (c.kind === "light") {
          const devs = c.dev ? [c.dev] : ctx.S.devs.filter((d) => d.paired && d.room === info.d?.room).map((d) => d.uid);
          const cols = ["#ffd9a0", "#ff6a3d", "#5aa9ff", "#b06bff", "#5fe08a"];
          for (const u of devs) { const d = ctx.S.devs.find((x) => x.uid === u); if (!d) continue; const on = d.on !== false; ctx.send({ a: "control", uid: u, on: !on, color: on ? d.color : cols[Math.floor(Math.random() * cols.length)] }); }
        } else if (c.kind === "lock" && c.dev) ctx.send({ a: "control", uid: c.dev, locked: !(info.d?.locked !== false) });
        else if (c.kind === "climate" && c.dev) ctx.send({ a: "control", uid: c.dev, temp: ((info.d?.temp ?? 21) >= 24 ? 18 : (info.d?.temp ?? 21) + 1) });
        break;
      }
    }
  };
  if ($("#next")) $("#next").onclick = () => ctx.send({ a: "next" });
  ctx.mounted = { update: () => paint() };
}

async function taskView(id) {
  const kind = id === "panel" ? "panel" : id === "rack" ? "rack" : id === "wifi" ? "wifi" : id === "tablet" ? "tablet" : id === "handover" ? "handover" : "room";
  const mod = await import(`./tasks/${kind}.js`);
  if (ctx.mountedKey !== `task:${id}`) return;
  app.innerHTML = "";
  ctx.mounted = mod.mount(app, ctx, id, { topBar, endTurn });
}

export async function endTurn() {
  const S = ctx.S;
  if (S.players.filter((p) => p.online).length <= 1) { ctx.closeTask(); return; }
  const ok = await confirmBox("Koniec tury?", "Telefon przejdzie do następnej osoby. Możesz wrócić do tego zadania w swojej kolejnej turze.", "Kończę turę");
  if (ok) { ctx.task = null; ctx.send({ a: "endTurn" }); }
}

if (!room) joinView("Zeskanuj kod QR z telewizora.");
else joinView();

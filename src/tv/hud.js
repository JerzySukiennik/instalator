// Instalator: TV overlay — lobby with QR, the job board, in-job HUD, toasts, reactions, handover and review.

import { icon, avatar } from "../shared/icons.js";
import { fmtZl, BY_ID } from "../shared/catalog.js";

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function qrSvg(text) {
  try {
    const q = window.qrcode(0, "M");
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch (e) {
    return `<div style="font:12px monospace">${esc(text)}</div>`;
  }
}

const REQ_ICON = { power: "bolt", labels: "din", light: "bulb", color: "bulb", tv: "bulb", kitchen: "bulb", wifi: "wifi", wifizone: "wifi", cam: "cam", doorbell: "cam", lock: "lock", heat: "temp", leak: "sensor", smoke: "sensor", motion: "sensor", contact: "sensor", energy: "energy", blinds: "home", audio: "speaker", soundbar: "speaker", vacuum: "home", gate: "outdoor", ev: "plug", weather: "outdoor", nvr: "net", ups: "bolt", tablet: "tablet", dash: "tablet" };

export class Hud {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div id="lobby" class="hide"></div>
      <div id="board" class="hide"></div>
      <div id="hud" class="hide">
        <div id="jobcard" class="card"></div>
        <div id="checklist" class="card"></div>
        <div id="turn"></div>
        <div id="mini" class="card"></div>
        <div id="taskbanner"></div>
      </div>
      <div id="handover" class="hide"></div>
      <div id="toasts"></div>
      <div id="reacts"></div>`;
    this.prevOk = new Set();
  }

  show(id) {
    for (const k of ["lobby", "board", "hud", "handover"]) $(`#${k}`, this.root).classList.toggle("hide", !id.includes(k));
  }

  lobby(s, code, url) {
    const el = $("#lobby", this.root);
    const key = `${code}|${url}|${document.body.classList.contains("desk")}|${s.players.map((p) => p.name + p.online + p.host).join(",")}`;
    if (el.dataset.key === key) return;
    el.dataset.key = key;
    el.innerHTML = `
      <div class="brand">
        <span class="tape k">smart home na zlecenie</span>
        <h1>Instalator</h1>
        <div class="sub"><span class="tape">UniFi</span><span class="tape">Hue</span><span class="tape">Shelly</span><span class="tape">tado°</span><span class="tape y">1–4 telefony</span></div>
        <div class="players">${s.players.map((p) => playerPill(p)).join("") || `<span class="tape">Czekam na pierwszy telefon…</span>`}</div>
        ${document.body.classList.contains("desk") ? "" : `<button class="tape y deskbtn click">🖱 Graj na tym komputerze, bez telefonu</button>`}
        ${resumeHtml()}
      </div>
      ${portfolioHtml()}
      <div class="join card">
        ${url ? `<div class="qr">${qrSvg(url)}</div><div class="code">${esc(code)}</div>
        <div class="hint">${s.players.length ? "Gospodarz startuje na telefonie." : "Zeskanuj telefonem. Pierwszy telefon zostaje gospodarzem."}</div>
        <div class="url">${esc(url.replace(/^https?:\/\//, ""))}</div>` : `<div class="qr off">${icon("wifi", 64, 1.6)}</div><div class="hint">Pokój online się łączy… Bez internetu grasz na tym komputerze.</div>`}
      </div>`;
  }

  board(s, thumbs) {
    const el = $("#board", this.root);
    const key = `${s.board.seed}|${s.board.rolls}`;
    if (el.dataset.key !== key) {
      el.dataset.key = key;
      el.innerHTML = `
        <div class="top"><h2>Zlecenia na dziś</h2><span class="tape y">${document.body.classList.contains("desk") ? "Wybierz w panelu po prawej" : "Głosujcie na telefonach"}</span></div>
        <div class="grid">${s.board.jobs.map((j, i) => jobCard(j, i, thumbs?.[j.building])).join("")}</div>
        <div class="foot"><span class="tape">${document.body.classList.contains("desk") ? "Przelosuj albo bierzemy" : "Gospodarz: przelosuj albo bierzemy"}</span></div>`;
      el.querySelectorAll(".money b").forEach((b, i) => {
        const target = s.board.jobs[i].budget;
        const t0 = performance.now() + 250 + i * 120;
        const tick = (now) => {
          const k = Math.max(0, Math.min(1, (now - t0) / 1300));
          const e = 1 - Math.pow(1 - k, 3);
          const v = k < 1 ? Math.round((target * e + (1 - e) * Math.random() * target) / 10) * 10 : target;
          b.textContent = fmtZl(v);
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }
    s.board.jobs.forEach((j, i) => {
      const v = $(`.job[data-i="${i}"] .votes`, el);
      if (!v) return;
      const voters = Object.entries(s.board.votes).filter(([, x]) => x === i).map(([cid]) => s.players.find((p) => p.cid === cid)).filter(Boolean);
      v.innerHTML = voters.map((p) => `<i style="background:${p.color}" title="${esc(p.name)}"></i>`).join("");
    });
  }

  setThumb(building, url) {
    document.querySelectorAll(`.job[data-b="${building}"] .thumb`).forEach((t) => { t.style.backgroundImage = `url(${url})`; });
  }

  pickJob(i) {
    const el = document.querySelector(`.job[data-i="${i}"]`);
    if (el) el.classList.add("win");
  }

  job(s, code, url, tasks) {
    const j = s.job;
    if (!j) return;
    const left = s.budget.total - s.budget.spent;
    const pct = Math.min(100, (s.budget.spent / Math.max(1, s.budget.total)) * 100);
    $("#jobcard", this.root).innerHTML = `
      ${avatar(j.client.look, 56)}
      <div><h3>${esc(j.client.name)}</h3><div class="meta">${esc(j.buildingName)} · ${esc(j.platformName)}</div></div>
      <div class="bud"><div class="budline"><span>wydane <b>${fmtZl(s.budget.spent)}</b></span><span>zostało <b>${fmtZl(left)}</b></span></div><div class="budbar ${left < 0 ? "over" : ""}"><i style="width:${pct}%"></i></div></div>`;
    const reqs = s.reqs || [];
    const done = reqs.filter((r) => r.ok).length;
    $("#checklist", this.root).innerHTML = `<h4><span>Lista klienta</span><span>${done}/${reqs.length}</span></h4><ul>${j.reqs.map((r) => {
      const st = reqs.find((x) => x.id === r.id) || {};
      const pop = st.ok && !this.prevOk.has(r.id) ? "pop" : "";
      return `<li class="${st.ok ? "ok" : ""} ${pop}"><span class="box">${st.ok ? icon("check", 14, 3) : ""}</span><span>${esc(r.text)}${!st.ok && st.p > 0 ? `<span class="pg"><i style="width:${Math.round(st.p * 100)}%"></i></span>` : ""}</span></li>`;
    }).join("")}</ul>`;
    const newly = reqs.filter((r) => r.ok && !this.prevOk.has(r.id));
    this.prevOk = new Set(reqs.filter((r) => r.ok).map((r) => r.id));
    const order = s.turn.order.map((c) => s.players.find((p) => p.cid === c)).filter((p) => p && p.online);
    const act = order[s.turn.i % Math.max(1, order.length)];
    const task = tasks.find((t) => t.id === s.turn.task);
    const solo = order.length <= 1;
    $("#turn", this.root).style.display = act ? "" : "none";
    $("#turn", this.root).innerHTML = act ? `
      <span class="dot" style="background:${act.color}">${icon("drill", 20, 2)}</span>
      <div><small>${solo ? "pracujesz" : "tura"}</small><b>${esc(act.name)}</b>${task ? ` · ${esc(task.name)}` : " · wybiera zadanie"}</div>
      ${solo ? "" : `<span class="next">${order.map((p) => `<i style="background:${p.color};opacity:${p === act ? 1 : 0.35}"></i>`).join("")}</span>`}` : "";
    const mini = $("#mini", this.root);
    mini.style.display = url ? "" : "none";
    if (url && mini.dataset.url !== url) { mini.dataset.url = url; mini.innerHTML = `<div class="qr">${qrSvg(url)}</div><div><b>${esc(code)}</b><span>dołącz w każdej chwili</span></div>`; }
    return newly;
  }

  achieve(text) {
    const a = document.createElement("div");
    a.className = "achieve";
    a.innerHTML = `<span class="ck">${icon("check", 26, 3)}</span><span><small>z listy klienta</small>${esc(text)}</span>`;
    this.root.appendChild(a);
    setTimeout(() => a.classList.add("out"), 2600);
    setTimeout(() => a.remove(), 3200);
  }

  banner(text) {
    const b = $("#taskbanner", this.root);
    b.innerHTML = `<span class="tape y">${esc(text)}</span>`;
  }

  toast(ic, html, kind = "") {
    const t = document.createElement("div");
    t.className = `toast ${kind}`;
    t.innerHTML = `${icon(ic, 22)}<span>${html}</span>`;
    const box = $("#toasts", this.root);
    box.appendChild(t);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => t.classList.add("out"), 3200);
    setTimeout(() => t.remove(), 3700);
  }

  react(p, e) {
    const r = document.createElement("div");
    r.className = "react";
    r.style.left = `${8 + Math.random() * 84}%`;
    r.innerHTML = `${esc(e)}<small style="background:${p.color}">${esc(p.name)}</small>`;
    $("#reacts", this.root).appendChild(r);
    setTimeout(() => r.remove(), 2800);
  }

  bubble(client, text) {
    const h = $("#handover", this.root);
    h.classList.remove("hide");
    h.innerHTML = text ? `<div class="bubble card">${avatar(client.look, 64)}<div><b>${esc(client.name)}</b>${esc(text)}</div></div>` : "";
  }

  review(s) {
    const r = s.review, j = s.job;
    if (!r) return;
    const h = $("#handover", this.root);
    h.classList.remove("hide");
    const stars = Array.from({ length: 5 }, (_, i) => `<span class="${r.stars >= i + 1 ? "" : r.stars >= i + 0.5 ? "half" : "off"}">${icon("star", 40, 0)}</span>`).join("").replace(/fill="none"/g, 'fill="currentColor"');
    const quote = r.stars >= 4.5 ? "Wszystko działa, a tablet to bajka. Polecę was znajomym." : r.stars >= 3.5 ? "Jest dobrze. Parę rzeczy bym jeszcze dorobił, ale da się żyć." : r.stars >= 2 ? "Hm. Spodziewałem się więcej za te pieniądze." : "Szczerze? Nie tak się umawialiśmy.";
    h.innerHTML = `<div id="review" class="card">
      <span class="stamp">${r.stars >= 3 ? "odebrane" : "do poprawki"}</span>
      <div style="display:flex;gap:1rem;align-items:center">${avatar(j.client.look, 72)}<div><h2>${esc(j.client.name)}</h2><div class="q">„${esc(quote)}”</div></div></div>
      <div class="stars">${stars}</div>
      <div class="rows">
        <span>Spełnione wymagania</span><b>${r.met}/${r.total}</b>
        <span>Budżet ${r.left >= 0 ? "zostało" : "przekroczony o"}</span><b>${fmtZl(Math.abs(r.left))}</b>
        <span>Zapłata z napiwkiem</span><b>${fmtZl(r.pay)}</b>
      </div>
      <div style="margin-top:1rem;text-align:center"><span class="tape y">Gospodarz: pobaw się domem albo nowe zlecenie</span></div>
    </div>`;
  }

  clearHandover() {
    const h = $("#handover", this.root);
    h.innerHTML = "";
    h.classList.add("hide");
  }
}

function resumeHtml() {
  try {
    const sv = JSON.parse(localStorage.getItem("instalator.save.v1") || "null");
    if (!sv || !sv.state?.job || Date.now() - sv.at > 3 * 86400e3) return "";
    const done = (sv.state.devs || []).filter((d) => d.place !== "fixed").length;
    return `<button class="tape resumebtn click">▶ Wznów: ${esc(sv.state.job.buildingName)} · ${esc(sv.state.job.client.name)} · ${done} urządz.</button>`;
  } catch (e) { return ""; }
}

function portfolioHtml() {
  let list = [];
  try { list = JSON.parse(localStorage.getItem("instalator.portfolio.v1") || "[]"); } catch (e) {}
  if (!list.length) return "";
  return `<div class="folio">${list.slice(0, 4).map((x) => `<div class="fo"><div class="ph" style="background-image:url(${x.shot})"></div><b>${esc(x.building)}</b><span>${"★".repeat(Math.floor(x.stars))}${x.stars % 1 ? "½" : ""} · ${esc(x.client)}</span></div>`).join("")}</div>`;
}

function playerPill(p) {
  return `<div class="pl ${p.online ? "" : "off"}"><span class="hat" style="background:${p.color}">${icon("drill", 18, 2)}</span>${esc(p.name)}${p.host ? `<span class="crown">gospodarz</span>` : ""}</div>`;
}

function jobCard(j, i, thumb) {
  const reqs = j.reqs.filter((r) => r.type !== "power");
  return `<div class="job card" data-i="${i}" data-b="${j.building}" style="animation-delay:${i * 0.12}s">
    <span class="pin"></span>
    <div class="no">Zlecenie nr ${String(4100 + ((j.id.length * 37 + i * 13) % 900)).padStart(4, "0")}</div>
    <div class="thumb" ${thumb ? `style="background-image:url(${thumb})"` : ""}></div>
    <h3>${esc(j.buildingName)}</h3>
    <div class="place">${esc(j.place)}</div>
    <div class="client">${avatar(j.client.look, 44)}<div><b>${esc(j.client.name)}</b><span>${esc(j.client.who)}</span></div></div>
    <div class="quote">„${esc(j.client.hello)}”</div>
    <ul>${reqs.slice(0, 6).map((r) => `<li>${icon(REQ_ICON[r.type] || "box", 16)}<span>${esc(r.text)}</span></li>`).join("")}${reqs.length > 6 ? `<li>${icon("plus", 16)}<span>i jeszcze ${reqs.length - 6}</span></li>` : ""}</ul>
    <div class="money"><b>${fmtZl(j.budget)}</b><span class="plat">${esc(j.platformName)}</span></div>
    <div class="votes"></div>
  </div>`;
}

export { esc };

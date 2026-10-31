// Instalator: rack task — mount UniFi gear into U slots, drag patch cables port to port, watch links come up, adopt devices.

import { BY_ID } from "../../shared/catalog.js";
import { portCount } from "../../shared/sim.js";
import { icon } from "../../shared/icons.js";
import { $, el, esc, haptic, toast, sheet } from "../ui.js";
import { frame, invList, tray } from "./common.js";

const COLORS = ["#3f7fd6", "#f3cf45", "#3e9b5f", "#eeeeee", "#8b6bd6", "#80868b"];

function short(ctx, d) {
  if (!d) return "";
  const it = BY_ID[d.id];
  const room = ctx.B.rooms.find((r) => r.id === d.room);
  const kind = it.caps.includes("ap") ? "AP" : it.caps.includes("doorbell") ? "DZWONEK" : it.caps.includes("camera") ? "KAM" : it.caps.includes("wallmount") ? "TABLET" : it.name.split(" ").pop().toUpperCase();
  return `${(room ? room.name : "zew").slice(0, 5).toUpperCase()} ${kind}`;
}

export function mount(root, ctx, taskId, h) {
  const media = !ctx.B.rack;
  const body = frame(root, ctx, media ? "Skrzynka multimedialna" : "Szafa rack", "Montuj sprzęt, potem przeciągaj kable", h, { cats: ["siec", "centrale", "kamery"] });
  let sel = null, color = COLORS[0];
  body.innerHTML = `<div class="h"><span id="inet"></span><span id="poe"></span></div><div class="rackwrap" style="position:relative"></div><div class="h">Kolor kabla<span class="colors"></span></div><div class="tray" style="border:0;background:none;padding:0;margin:0 -14px"></div><div class="h">UniFi: adopcja</div><div class="list adopt"></div>`;
  const wrap = $(".rackwrap", body), trayHost = $(".tray", body);
  const colorsHost = $(".colors", body);
  colorsHost.innerHTML = COLORS.map((c) => `<button data-c="${c}" style="background:${c}"></button>`).join("");
  colorsHost.querySelectorAll("button").forEach((b) => (b.onclick = () => { color = b.dataset.c; haptic(); colorsHost.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }));
  colorsHost.firstElementChild.classList.add("on");

  const patchAt = (uid, p) => ctx.S.patches.find((x) => (x.a[0] === uid && x.a[1] === p) || (x.b[0] === uid && x.b[1] === p));
  const runAt = (uid, p) => ctx.S.devs.find((d) => d.run && d.run.pp === uid && d.run.port === p);

  const portsHtml = (d, opts = {}) => {
    const it = BY_ID[d.id] || {};
    const n = portCount(d);
    const poe = it.ports?.poe || 0;
    const wan = it.ports?.wan || 0;
    let s = "";
    for (let i = 0; i < n; i++) {
      const pt = patchAt(d.uid, i);
      const run = runAt(d.uid, i);
      const lbl = d.id === "ont" ? "LAN" : wan && i === 0 ? "WAN" : run ? short(ctx, run) : opts.nums ? String(i + 1) : "";
      const etl = it.etherlight && pt ? `box-shadow:0 0 6px ${pt.color}` : "";
      const need = !pt && ((run && !it.caps?.includes("switch")) || (d.id === "ont") || (wan && i === 0) || (!it.caps?.includes("switch") && !it.caps?.includes("patch") && d.id !== "mb-keystone" && !wan && n === 1));
      s += `<span class="port ${pt ? "used" : ""} ${need ? "need" : ""} ${i - wan < poe && i >= wan ? "poe" : ""} ${pt && ctx.S.der?.dev[d.uid]?.pw ? "led" : ""}" data-uid="${d.uid}" data-p="${i}" style="${pt ? `--c:${pt.color};` : ""}${etl}"><span class="pl">${esc(lbl)}</span></span>`;
    }
    return s;
  };

  const draw = () => {
    const S = ctx.S;
    $("#inet", body).innerHTML = S.der?.online ? `<span class="tape" style="background:var(--ok);color:#fff">internet działa</span>` : `<span class="tape">brak internetu</span>`;
    const used = Object.entries(S.der?.poeUsed || {}).map(([u, w]) => `${w}/${BY_ID[S.devs.find((d) => d.uid === u)?.id]?.poeOut || 0} W`).join(" · ");
    $("#poe", body).textContent = used ? `PoE ${used}` : "";
    const ont = S.devs.find((d) => d.id === "ont");
    const rackDevs = S.devs.filter((d) => d.place === "rack");
    const shelfDevs = S.devs.filter((d) => d.place === "shelf");
    let html = `<div class="rackv">`;
    html += `<div class="ru" style="background:#3a3f44;border-radius:4px;margin-bottom:8px"><div class="rdev dark" style="inset:4px 40% 4px 4px"><span class="nm" style="color:#aeb4b8">ONT OPERATORA</span><div class="ports">${ont ? portsHtml(ont) : ""}</div></div></div>`;
    if (media) {
      const kb = S.devs.find((d) => d.id === "mb-keystone");
      html += `<div class="ru"><div class="rdev"><span class="nm">GNIAZDA Z MIESZKANIA</span><div class="ports">${kb ? portsHtml(kb) : ""}</div></div></div>`;
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">${shelfDevs.map((d) => `<div class="ru" style="height:58px"><div class="rdev" data-dev="${d.uid}"><span class="nm">${esc(BY_ID[d.id].name.replace("UniFi ", ""))}</span><div class="ports" style="margin-top:10px">${portsHtml(d)}</div></div></div>`).join("")}${shelfDevs.length < 6 ? `<div class="ru empty ${sel && BY_ID[sel].where === "shelf" ? "drop" : ""}" data-shelf="1" style="height:58px;justify-content:center;color:#8b9196;font-size:11px">${sel && BY_ID[sel].where === "shelf" ? "postaw tutaj" : "półka"}</div>` : ""}</div>`;
    } else {
      const units = ctx.B.rack.units || 9;
      const occ = new Map();
      for (const d of rackDevs) for (let k = 0; k < (BY_ID[d.id].u || 1); k++) occ.set(d.u + k, d);
      const selU = sel && BY_ID[sel].where === "rack" ? BY_ID[sel].u || 1 : 0;
      for (let u = units - 1; u >= 0; u--) {
        const d = occ.get(u);
        if (d && d.u !== u) continue;
        if (d) {
          const it = BY_ID[d.id];
          const n = it.u || 1;
          const dark = it.caps.includes("patch") || it.caps.includes("brush") || it.caps.includes("ups");
          let inner = "";
          const shelvesAsc = rackDevs.filter((x) => x.id === "rack-shelf").sort((a, b) => a.u - b.u);
          const k = shelvesAsc.indexOf(d);
          if (it.caps.includes("shelf")) inner = shelfDevs.slice(k * 3, k * 3 + 3).map((sd) => `<div style="flex:1;height:30px;margin-top:10px;background:#f6f6f4;border-radius:3px;display:flex;align-items:center;gap:2px;padding:0 3px;overflow:hidden" data-dev="${sd.uid}"><span style="font:700 6.5px var(--mono);color:#555;margin-right:2px">${esc(BY_ID[sd.id].name.replace(/^(UniFi|Home Assistant|Philips Hue|IKEA|Aqara|tado°) /, "").slice(0, 10))}</span>${portsHtml(sd)}</div>`).join("");
          else if (it.caps.includes("brush")) inner = `<div style="flex:1;height:10px;margin:0 20px;background:repeating-linear-gradient(90deg,#111 0 2px,#2c2c2c 2px 4px);border-radius:2px"></div>`;
          else inner = `<div class="ports" style="${it.caps.includes("patch") || (it.ports?.rj45 || 0) > 12 ? "max-width:72%;" : ""}">${portsHtml(d, { nums: it.caps.includes("switch") })}</div>`;
          html += `<div class="ru" style="height:${n * 44 + (n - 1) * 2}px"><span class="num">${u + 1}</span><div class="rdev ${dark ? "dark" : ""}" data-dev="${d.uid}"><span class="nm" ${dark ? 'style="color:#aeb4b8"' : ""}>${esc(it.name.replace("UniFi ", "").replace("Lanberg ", ""))}</span>${inner}</div></div>`;
        } else {
          let fits = selU > 0;
          for (let k = 0; k < selU && fits; k++) if (u - k < 0 || occ.has(u - k)) fits = false;
          html += `<div class="ru empty ${fits ? "drop" : ""}" data-u="${u - selU + 1}" ${fits ? "" : ""}><span class="num">${u + 1}</span></div>`;
        }
      }
    }
    html += `</div><svg class="cables"></svg>`;
    wrap.innerHTML = html;
    wrap.querySelectorAll(".ru.drop[data-u]").forEach((e) => (e.onclick = () => { haptic(true); ctx.send({ a: "rackPut", id: sel, u: Number(e.dataset.u) }); if ((ctx.S.inv[sel] || 1) <= 1) sel = null; }));
    wrap.querySelectorAll("[data-shelf]").forEach((e) => (e.onclick = () => { if (!sel) return; haptic(true); ctx.send({ a: "shelfPut", id: sel }); if ((ctx.S.inv[sel] || 1) <= 1) sel = null; }));
    drawCables();
    const items = invList(ctx, (it) => it.where === "rack" || it.where === "shelf");
    tray(trayHost, ctx, items, sel, (id) => {
      sel = id;
      if (id && BY_ID[id].where === "shelf" && !media) {
        if (ctx.S.devs.some((d) => d.id === "rack-shelf")) { haptic(true); ctx.send({ a: "shelfPut", id }); sel = null; }
        else toast("Najpierw zamontuj półkę 1U w szafie.");
      }
      draw();
    }, { cats: ["siec", "centrale"], hint: sel ? "Stuknij świecące miejsce w szafie" : "Sprzęt do szafy" });
    const un = S.devs.filter((d) => BY_ID[d.id]?.brand === "Ubiquiti" && S.der?.dev[d.uid]?.pw && BY_ID[d.id].power !== "none");
    $(".adopt", body).innerHTML = un.length ? un.map((d) => `<div class="row"><span class="chk ${d.adopted ? "on" : ""}">${d.adopted ? icon("check", 13, 3) : ""}</span><div class="grow"><b>${esc(BY_ID[d.id].name)}</b><span>${S.der.dev[d.uid].net ? (d.adopted ? "online" : "czeka na adopcję") : "brak połączenia"}</span></div>${!d.adopted && S.der.dev[d.uid].net ? `<button class="btn y sm" data-adopt="${d.uid}">Adoptuj</button>` : ""}</div>`).join("") : `<div class="row"><div class="grow"><span>Tu pojawią się urządzenia UniFi, gdy dostaną prąd i sieć.</span></div></div>`;
    $(".adopt", body).querySelectorAll("[data-adopt]").forEach((b) => (b.onclick = () => { haptic(true); b.textContent = "…"; setTimeout(() => ctx.send({ a: "adopt", uid: b.dataset.adopt }), 700); }));
  };

  const center = (uid, p) => {
    const e = wrap.querySelector(`.port[data-uid="${uid}"][data-p="${p}"]`);
    if (!e) return null;
    const r = e.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    return [r.left - w.left + r.width / 2, r.top - w.top + r.height / 2];
  };
  const cablePath = (a, b) => {
    const sag = Math.min(60, 14 + Math.abs(a[0] - b[0]) * 0.18 + Math.abs(a[1] - b[1]) * 0.1);
    return `M${a[0]},${a[1]} C${a[0]},${a[1] + sag} ${b[0]},${b[1] + sag} ${b[0]},${b[1]}`;
  };
  const drawCables = (live) => {
    const svg = $(".cables", wrap);
    if (!svg) return;
    svg.setAttribute("width", wrap.clientWidth);
    svg.setAttribute("height", wrap.clientHeight);
    let s = "";
    for (const p of ctx.S.patches) {
      const a = center(p.a[0], p.a[1]), b = center(p.b[0], p.b[1]);
      if (!a || !b) continue;
      s += `<path d="${cablePath(a, b)}" stroke="rgba(0,0,0,0.35)" stroke-width="6" fill="none" stroke-linecap="round"/><path d="${cablePath(a, b)}" stroke="${p.color}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    }
    if (live) s += `<path d="${cablePath(live.a, live.b)}" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="${live.hot ? "0" : "6 4"}"/><circle cx="${live.b[0]}" cy="${live.b[1]}" r="9" fill="${color}" stroke="#fff" stroke-width="2"/>`;
    svg.innerHTML = s;
  };

  let drag = null;
  wrap.addEventListener("pointerdown", (e) => {
    const p = e.target.closest(".port");
    if (!p) return;
    const uid = p.dataset.uid, port = Number(p.dataset.p);
    if (patchAt(uid, port)) {
      sheet("Wypiąć kabel?", (sc, s, close) => {
        sc.innerHTML = `<div style="display:flex;gap:10px"><button class="btn w n">Zostaw</button><button class="btn y ok">Wypnij</button></div>`;
        $(".n", sc).onclick = close;
        $(".ok", sc).onclick = () => { haptic(); ctx.send({ a: "unpatch", at: [uid, port] }); close(); };
      });
      return;
    }
    wrap.setPointerCapture(e.pointerId);
    const a = center(uid, port);
    drag = { uid, port, a, b: a };
    haptic();
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const w = wrap.getBoundingClientRect();
    drag.b = [e.clientX - w.left, e.clientY - w.top];
    const t = document.elementFromPoint(e.clientX, e.clientY)?.closest(".port");
    const hot = t && !(t.dataset.uid === drag.uid && Number(t.dataset.p) === drag.port) && !patchAt(t.dataset.uid, Number(t.dataset.p));
    wrap.querySelectorAll(".port.hot").forEach((x) => x.classList.remove("hot"));
    if (hot) { t.classList.add("hot"); if (drag.hot !== t) haptic(); drag.hot = t; drag.b = center(t.dataset.uid, Number(t.dataset.p)); } else drag.hot = null;
    drawCables({ a: drag.a, b: drag.b, hot });
  });
  const up = () => {
    if (!drag) return;
    const t = drag.hot;
    if (t) { haptic(true); ctx.send({ a: "patch", from: [drag.uid, drag.port], to: [t.dataset.uid, Number(t.dataset.p)], color }); }
    drag = null;
    drawCables();
  };
  wrap.addEventListener("pointerup", up);
  wrap.addEventListener("pointercancel", up);
  requestAnimationFrame(draw);
  return { update() { if (!drag) draw(); } };
}

// Instalator: handover task — what is still missing, with hints, and the button that calls the client.

import { icon } from "../../shared/icons.js";
import { fmtZl } from "../../shared/catalog.js";
import { $, esc, haptic, confirmBox } from "../ui.js";
import { frame } from "./common.js";

export function mount(root, ctx, taskId, h) {
  const body = frame(root, ctx, "Odbiór", "Klient sprawdzi wszystko po kolei", h, { noFoot: true });
  root.insertAdjacentHTML("beforeend", `<div class="foot"><button class="btn y call">${icon("handover", 20, 2)} Zawołaj klienta</button></div>`);
  const draw = () => {
    const S = ctx.S;
    const ok = S.reqs.filter((r) => r.ok).length;
    const left = S.budget.total - S.budget.spent;
    body.innerHTML = `<div class="row" style="margin-bottom:10px"><div class="grow"><b>${ok}/${S.reqs.length} wymagań spełnionych</b><span>${left >= 0 ? `zostało ${fmtZl(left)} budżetu` : `budżet przekroczony o ${fmtZl(-left)}`}</span></div></div>
      <div class="list">${S.job.reqs.map((r) => { const st = S.reqs.find((x) => x.id === r.id) || {}; return `<div class="row"><span class="chk ${st.ok ? "on" : ""}">${st.ok ? icon("check", 14, 3) : ""}</span><div class="grow"><b style="font-weight:600">${esc(r.text)}</b>${st.ok ? "" : `<span>${esc(st.hint || "")}</span>`}</div></div>`; }).join("")}</div>`;
  };
  $(".call", root).onclick = async () => {
    const S = ctx.S;
    const miss = S.reqs.filter((r) => !r.ok).length;
    const go = await confirmBox("Wołamy klienta?", miss ? `Brakuje jeszcze ${miss} rzeczy z listy. Klient i tak zapłaci, ale da mniej gwiazdek.` : "Wszystko zrobione. Czas na odbiór!", "Wołam");
    if (go) { haptic(true); ctx.send({ a: "handover" }); }
  };
  draw();
  return { update: draw };
}

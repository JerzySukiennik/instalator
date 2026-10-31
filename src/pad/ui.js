// Instalator: phone UI helpers — DOM building, toasts, bottom sheets, haptics.

export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

let hapticLabel = null;
export function haptic(strong = false) {
  try {
    if (navigator.vibrate) { navigator.vibrate(strong ? 22 : 8); return; }
    if (!hapticLabel) {
      hapticLabel = document.createElement("label");
      const inp = document.createElement("input");
      inp.type = "checkbox";
      inp.setAttribute("switch", "");
      hapticLabel.appendChild(inp);
      hapticLabel.style.cssText = "position:fixed;left:-99px;top:-99px;opacity:0";
      document.body.appendChild(hapticLabel);
    }
    hapticLabel.click();
  } catch (e) {}
}

let toastTimer = 0;
export function toast(text, err = false) {
  let t = $(".toastp");
  if (!t) { t = el(`<div class="toastp"></div>`); document.body.appendChild(t); }
  t.className = `toastp ${err ? "err" : ""}`;
  t.textContent = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), err ? 3200 : 2200);
  if (err) haptic(true);
}

export function sheet(title, build, onClose) {
  const s = el(`<div class="sheet"><div class="panel"><div class="grab"></div><div class="head"><h2>${esc(title)}</h2><button class="iconbtn x">✕</button></div><div class="cats hide"></div><div class="scroll"></div></div></div>`);
  const close = () => { s.remove(); if (onClose) onClose(); };
  s.addEventListener("click", (e) => { if (e.target === s) close(); });
  $(".x", s).onclick = close;
  document.getElementById("app").appendChild(s);
  build($(".scroll", s), s, close);
  return { el: s, close, scroll: $(".scroll", s), cats: $(".cats", s) };
}

export function confirmBox(title, text, yes, no = "Wróć") {
  return new Promise((res) => {
    const sh = sheet(title, (sc, s, close) => {
      sc.innerHTML = `<p style="margin:0 0 16px;line-height:1.4;color:var(--ink2)">${esc(text)}</p><div style="display:flex;gap:10px"><button class="btn w n">${esc(no)}</button><button class="btn y ok">${esc(yes)}</button></div>`;
      $(".n", sc).onclick = () => { close(); res(false); };
      $(".ok", sc).onclick = () => { close(); res(true); };
    }, () => res(false));
    return sh;
  });
}

// Instalator: routes the page to the TV app or the phone app.

const q = new URLSearchParams(location.search);
const touch = matchMedia("(pointer: coarse)").matches && Math.min(innerWidth, innerHeight) < 700;
const role = q.get("role") || (q.get("room") || touch ? "pad" : "tv");

function css(href) {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}

if (role === "tv") {
  css("css/tv.css");
  document.body.innerHTML = `<canvas id="tv"></canvas><div id="ui"></div>`;
  import("./tv/main.js");
} else {
  css("css/pad.css");
  document.body.innerHTML = `<div id="app"></div>`;
  import("./pad/main.js");
}

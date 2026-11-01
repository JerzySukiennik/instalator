// Instalator: routes the page to the first-person computer game (default) or the older TV / phone apps (?role=tv|pad).

const q = new URLSearchParams(location.search);
const role = q.get("role") || (q.get("room") ? "pad" : "game");

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
} else if (role === "pad") {
  css("css/pad.css");
  document.body.innerHTML = `<div id="app"></div>`;
  import("./pad/main.js");
} else {
  css("css/tv.css");
  css("css/game.css");
  document.body.innerHTML = `<canvas id="game"></canvas><div id="ui"></div><div id="gui"></div>`;
  import("./game/main.js");
}

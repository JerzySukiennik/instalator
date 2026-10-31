// Instalator: small stroke icon set (24 px grid) shared by the TV and the phones.

const P = {
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.6 16a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19.2" r="1.1" fill="currentColor"/>',
  cam: '<path d="M3 8.5h12.5v8H3zM15.5 11l5-2.8v8.6l-5-2.8"/><circle cx="7" cy="12.5" r="1.2"/>',
  din: '<rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M4 9h16M4 15h16M8 6v1.5M12 6v1.5M16 6v1.5M8 11.3v1.4M12 11.3v1.4"/>',
  net: '<rect x="3" y="4" width="18" height="5" rx="1"/><rect x="3" y="11" width="18" height="5" rx="1"/><path d="M6 6.5h.01M6 13.5h.01M9 6.5h6M9 13.5h6M12 16v4M8 20h8"/>',
  temp: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  sensor: '<rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="9" r="2.2"/><path d="M9.5 16h5"/>',
  hub: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  speaker: '<rect x="6" y="3" width="12" height="18" rx="2.5"/><circle cx="12" cy="14" r="3"/><circle cx="12" cy="7.5" r="1"/>',
  home: '<path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  tablet: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 16.5h.01"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5"/>',
  check: '<path d="m4.5 12.5 4.5 4.5L19.5 6.5"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  bolt: '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
  cart: '<path d="M3 4h2.5l2.2 11h10.6l2-8H7"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>',
  box: '<path d="m3.5 7.5 8.5-4 8.5 4v9l-8.5 4-8.5-4z"/><path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9"/>',
  plan: '<rect x="3.5" y="3.5" width="17" height="17" rx="1"/><path d="M3.5 12h7M10.5 3.5V9M14 12h6.5M14 12v8.5"/>',
  outdoor: '<path d="M4 20h16M7 20v-5.5M7 14.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zM14 20v-9l3.5-3 3.5 3v9"/>',
  handover: '<path d="M4 13.5 8 10l3 2 4-3.5 5 4.5"/><path d="M4 18h16M9 6.5h6"/>',
  living: '<path d="M4 11.5V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.5M3 18v-4.5a2 2 0 0 1 4 0V15h10v-1.5a2 2 0 0 1 4 0V18H3zM5 18v2M19 18v2"/>',
  kitchen: '<path d="M4 4h16v16H4zM4 10h16M8 6.5h.01M11 6.5h.01M15 13v4"/>',
  bath: '<path d="M4 12h16v2.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 14.5V12zM6 12V6a2 2 0 0 1 3.6-1.2M7 19l-1 2M17 19l1 2"/>',
  bed: '<path d="M3 18V7M3 13h18v5M21 18v-3a2 2 0 0 0-2-2H10v0M6 10.5h2.5"/>',
  hall: '<path d="M6 21V4h12v17M10 12.5h.01M3 21h18"/>',
  tech: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  garage: '<path d="M3 9 12 4l9 5v11H3zM6 20v-7h12v7M6 16h12"/>',
  office: '<path d="M4 18h16M6 18V9h12v9M9 9V6h6v3"/>',
  terrace: '<path d="M3 20h18M5 20v-7h14v7M3 13l9-7 9 7"/>',
  balcony: '<path d="M4 13h16v7H4zM8 13v7M12 13v7M16 13v7M7 13V5h10v8"/>',
  wc: '<path d="M7 4h7v6H7zM5 10h12a4 4 0 0 1-4 5H9a4 4 0 0 1-4-5zM9 15l-1 5h7l-1-5"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>',
  back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  chev: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  undo: '<path d="M9 7 4.5 11.5 9 16"/><path d="M5 11.5h9.5a5 5 0 0 1 0 10H11"/>',
  drill: '<path d="M4 9h10v5H8l-1 6H4zM14 10h3l3-1v4l-3-1h-3M8 14h2"/>',
  level: '<rect x="2.5" y="9" width="19" height="6" rx="2"/><path d="M10 9v6M14 9v6"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  energy: '<path d="M12 21a8 8 0 1 0-8-8"/><path d="M12 13l4-4M4 13h3"/>',
  scene: '<path d="M12 3v2M12 19v2M4.2 7l1.7 1M18.1 16l1.7 1M3 12h2M19 12h2M4.2 17l1.7-1M18.1 8l1.7-1"/><circle cx="12" cy="12" r="4"/>',
  media: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  climate: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  light: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  camera: '<path d="M3 8.5h12.5v8H3zM15.5 11l5-2.8v8.6l-5-2.8"/><circle cx="7" cy="12.5" r="1.2"/>',
  network: '<rect x="3" y="4" width="18" height="5" rx="1"/><rect x="3" y="11" width="18" height="5" rx="1"/><path d="M12 16v4M8 20h8"/>'
};

export const ICON_SRC = P;

export function iconPath2D(name) {
  const src = P[name] || P.box;
  const out = [];
  for (const m of src.matchAll(/<(path|circle|rect)([^>]*)\/>/g)) {
    const a = Object.fromEntries([...m[2].matchAll(/([a-z-]+)="([^"]*)"/g)].map((x) => [x[1], x[2]]));
    const fill = a.fill === "currentColor";
    let p;
    if (m[1] === "path") p = new Path2D(a.d);
    else if (m[1] === "circle") { p = new Path2D(); p.arc(+a.cx, +a.cy, +a.r, 0, Math.PI * 2); }
    else { p = new Path2D(); const r = +(a.rx || 0); if (p.roundRect) p.roundRect(+a.x, +a.y, +a.width, +a.height, r); else p.rect(+a.x, +a.y, +a.width, +a.height); }
    out.push({ p, fill });
  }
  return out;
}

export function drawIcon(ctx, name, x, y, size, color, stroke = 1.8) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = stroke;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of iconPath2D(name)) { if (s.fill) ctx.fill(s.p); else ctx.stroke(s.p); }
  ctx.restore();
}

export function icon(name, size = 24, stroke = 1.8) {
  const p = P[name] || P.box;
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

export function avatar(look = {}, size = 64) {
  const skin = look.skin || "#eec4a0", hair = look.hair || "#4a3426", top = look.top || "#6d8fb3";
  const longHair = look.long ? `<path d="M18 30c-1 10 1 20 4 24h20c3-4 5-14 4-24" fill="${hair}"/>` : "";
  const beard = look.beard ? `<path d="M24 34c1 7 4 10 8 10s7-3 8-10c-2 3-5 4-8 4s-6-1-8-4z" fill="${hair}"/>` : "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#e6e1d6"/>${longHair}<path d="M10 64c2-11 10-17 22-17s20 6 22 17z" fill="${top}"/><rect x="27" y="38" width="10" height="10" rx="3" fill="${skin}"/><ellipse cx="32" cy="29" rx="11" ry="12.5" fill="${skin}"/>${beard}<path d="M20.5 27c0-9 5-14 11.5-14s11.5 5 11.5 14c-2-5-6-7-11.5-7S22.5 22 20.5 27z" fill="${hair}"/><circle cx="28" cy="30" r="1.2" fill="#2a2522"/><circle cx="36" cy="30" r="1.2" fill="#2a2522"/></svg>`;
}

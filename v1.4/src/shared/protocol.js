// Instalator: wire protocol shared by the TV and the phones.

export const PROTO = 3;
export const GAME = "instalator";
export const CH = { EVENT: "ev", INPUT: "in" };
export const ROOM_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ";
export const ROOM_CODE_LEN = 4;
export const MAX_PLAYERS = 4;
export const CHUNK = 40000;

export const PLAYER_COLORS = ["#f2a541", "#3fa7d6", "#59c36a", "#b07cd8"];
export const PLAYER_COLOR_NAMES = ["pomarańczowy", "niebieski", "zielony", "fioletowy"];

export const REACTIONS = ["👍", "😂", "😮", "🔥", "👏", "🤔"];

export function netMode() {
  const q = new URLSearchParams(location.search);
  if (q.get("net")) return q.get("net");
  return "rtc";
}

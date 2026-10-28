// Helpers shared by every page.

export function el(tag, cls = "", text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export async function api(path, { method = "GET", data } = {}) {
  const res = await fetch(path, {
    method,
    headers: data !== undefined || method !== "GET" ? { "content-type": "application/json" } : {},
    body: data !== undefined ? JSON.stringify(data) : undefined,
    credentials: "same-origin",
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(out.error || "Something went wrong"), { status: res.status });
  return out;
}

let meCache;
export async function me() {
  if (meCache === undefined) {
    try { meCache = (await api("/api/auth")).user; } catch { meCache = null; }
  }
  return meCache;
}

export function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d` : new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const TONES = ["#b58b7a", "#8c9a86", "#9a8aa8", "#a89a7c", "#7f8f9e", "#b3867f"];
export function avatar(user, size = "") {
  const a = el("span", `avatar ${size}`.trim(), (user.name || user.username || "?").trim()[0].toUpperCase());
  let h = 0;
  for (const c of user.username || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  a.style.background = TONES[h % TONES.length];
  return a;
}

export function svg(name) {
  const paths = {
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    share: '<path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6"/>',
    more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bag: '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  };
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("fill", "none");
  s.setAttribute("stroke", "currentColor");
  s.setAttribute("stroke-width", "1.5");
  s.setAttribute("stroke-linecap", "round");
  s.setAttribute("stroke-linejoin", "round");
  s.setAttribute("aria-hidden", "true");
  s.innerHTML = paths[name];
  return s;
}

export function toast(text) {
  const t = el("div", "toast", text);
  document.body.append(t);
  setTimeout(() => t.classList.add("out"), 1800);
  setTimeout(() => t.remove(), 2300);
}

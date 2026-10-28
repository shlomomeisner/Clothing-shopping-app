const feed = document.getElementById("feed");
const tabs = document.getElementById("tabs");

let posts = [];
let filter = "all";
let hearts = new Set();
try { hearts = new Set(JSON.parse(localStorage.getItem("hearts") || "[]")); } catch {}

tabs.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  tabs.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
  filter = b.dataset.type;
  render();
});

load();

async function load() {
  try {
    const res = await fetch("/api/posts");
    posts = (await res.json()).posts || [];
  } catch {
    posts = [];
  }
  render();
}

function render() {
  const list = posts.filter((p) => filter === "all" || p.type === filter);
  feed.replaceChildren();

  if (!list.length) {
    const e = el("div", "empty");
    e.append(el("b", "", "nothing here yet ♡"), document.createTextNode("New drops are coming, check back soon."));
    feed.append(e);
    return;
  }
  list.forEach((p, i) => feed.append(postNode(p, i)));
}

function postNode(p, i) {
  const wrap = el("article", "post");
  wrap.style.animationDelay = `${Math.min(i, 6) * 60}ms`;

  wrap.append(el("span", "when", ago(p.createdAt)));
  if (p.note) wrap.append(el("p", "bubble", p.note));

  const a = el("a", "item");
  a.href = `/api/go?id=${encodeURIComponent(p.id)}`;
  a.target = "_blank";
  a.rel = "noopener sponsored";
  a.addEventListener("click", (e) => burst(e.clientX, e.clientY));

  const pic = el("div", "pic");
  if (p.image) {
    const img = el("img");
    img.src = p.image;
    img.alt = p.title;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => img.replaceWith(el("div", "fallback", p.title));
    pic.append(img);
  } else {
    pic.append(el("div", "fallback", p.title));
  }
  pic.append(el("span", "tag", `${p.type === "makeup" ? "💄" : "👗"} ${p.store}`));
  if (p.price) pic.append(el("span", "price", p.price));

  const heart = el("button", "heart" + (hearts.has(p.id) ? " on" : ""), hearts.has(p.id) ? "♥" : "♡");
  heart.type = "button";
  heart.setAttribute("aria-label", "Save");
  heart.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const on = !hearts.has(p.id);
    on ? hearts.add(p.id) : hearts.delete(p.id);
    heart.textContent = on ? "♥" : "♡";
    heart.classList.toggle("on", on);
    if (on) burst(e.clientX, e.clientY);
    try { localStorage.setItem("hearts", JSON.stringify([...hearts])); } catch {}
  });
  pic.append(heart);

  const info = el("div", "info");
  info.append(el("h3", "", p.title), el("span", "get", "Get it ♡"));

  a.append(pic, info);
  wrap.append(a);
  return wrap;
}

function burst(x, y) {
  const glyphs = ["✦", "♡", "✧", "♥"];
  for (let i = 0; i < 8; i++) {
    const s = el("span", "spark", glyphs[i % glyphs.length]);
    const ang = (Math.PI * 2 * i) / 8;
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty("--dx", `${Math.cos(ang) * 60}px`);
    s.style.setProperty("--dy", `${Math.sin(ang) * 60}px`);
    document.body.append(s);
    setTimeout(() => s.remove(), 850);
  }
}

function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d ago` : new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function el(tag, cls = "", text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

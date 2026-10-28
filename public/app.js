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
    e.append(el("b", "", "The edit is being curated."), document.createTextNode("New pieces arrive soon."));
    feed.append(e);
    return;
  }
  list.forEach((p, i) => feed.append(postNode(p, i)));
}

function postNode(p, i) {
  const wrap = el("article", i === 0 ? "post feature" : "post");
  wrap.style.animationDelay = `${Math.min(i, 8) * 70}ms`;

  const a = el("a", "item");
  a.href = `/api/go?id=${encodeURIComponent(p.id)}`;
  a.target = "_blank";
  a.rel = "noopener sponsored";

  const pic = el("div", "pic");
  if (p.image) {
    const img = el("img");
    img.src = p.image;
    img.alt = p.title;
    img.loading = i < 3 ? "eager" : "lazy";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => img.replaceWith(el("div", "fallback", p.title));
    pic.append(img);
  } else {
    pic.append(el("div", "fallback", p.title));
  }
  pic.append(heartButton(p.id));

  const info = el("div", "info");
  info.append(el("p", "store", p.store), el("h3", "", p.title));
  if (p.price) info.append(el("p", "price", p.price));
  if (p.note) info.append(el("p", "note", `“${p.note}”`));
  info.append(el("span", "shop", i === 0 ? "Shop the piece" : "Shop"));

  a.append(pic, info);
  wrap.append(a);
  return wrap;
}

function heartButton(id) {
  const b = el("button", "heart" + (hearts.has(id) ? " on" : ""));
  b.type = "button";
  b.setAttribute("aria-label", "Save");
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  b.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const on = !hearts.has(id);
    on ? hearts.add(id) : hearts.delete(id);
    b.classList.toggle("on", on);
    try { localStorage.setItem("hearts", JSON.stringify([...hearts])); } catch {}
  });
  return b;
}

function el(tag, cls = "", text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

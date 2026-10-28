import { el, api, me, ago, avatar, svg, toast } from "/common.js";

const reel = document.getElementById("reel");
const side = document.getElementById("side");

// /?user=name#postId opens one creator's posts at that post (from their profile)
const params = new URLSearchParams(location.search);
const onlyUser = params.get("user");
const startAt = location.hash.slice(1);

let offset = 0;
let done = false;
let loadingMore = false;
let saved = new Set();
try { saved = new Set(JSON.parse(localStorage.getItem("saved") || "[]")); } catch {}

init();

async function init() {
  const user = await me();
  if (user) {
    const plus = el("a", "icon-btn");
    plus.href = "/post";
    plus.setAttribute("aria-label", "New post");
    plus.append(svg("plus"));
    const prof = el("a", "icon-btn");
    prof.href = `/@${user.username}`;
    prof.setAttribute("aria-label", "Your profile");
    prof.append(avatar(user));
    side.append(plus, prof);
  } else {
    const join = el("a", "join caps", "Join");
    join.href = "/login";
    side.append(join);
  }

  reel.replaceChildren();
  await loadMore();
  if (startAt) document.getElementById(`p-${startAt}`)?.scrollIntoView();
}

async function loadMore() {
  if (done || loadingMore) return;
  loadingMore = true;
  try {
    const q = new URLSearchParams({ offset });
    if (onlyUser) q.set("user", onlyUser);
    const { posts } = await api(`/api/posts?${q}`);
    posts.forEach((p) => reel.append(slide(p)));
    offset += posts.length;
    if (posts.length < 12) {
      done = true;
      reel.append(endCard(offset === 0));
    }
  } catch {
    if (!offset) reel.append(endCard(true, "Couldn't load the feed. Pull to try again."));
    done = true;
  }
  loadingMore = false;
}

// Load the next page when someone nears the end
const watcher = new IntersectionObserver((entries) => {
  if (entries.some((e) => e.isIntersecting)) loadMore();
}, { root: reel, rootMargin: "200% 0px" });
new MutationObserver(() => {
  watcher.disconnect();
  const last = reel.querySelector(".slide:last-of-type");
  if (last) watcher.observe(last);
}).observe(reel, { childList: true });

function slide(p) {
  const s = el("article", "slide");
  s.id = `p-${p.id}`;

  const blur = el("div", "blur");
  blur.style.backgroundImage = `url("${p.photo}")`;
  const img = el("img", "photo");
  img.src = p.photo;
  img.alt = p.caption || `Outfit by @${p.user.username}`;
  img.loading = "lazy";
  img.decoding = "async";
  s.append(blur, img);

  const meta = el("div", "meta");
  const who = el("a", "who");
  who.href = `/@${p.user.username}`;
  const name = el("div");
  name.append(el("b", "", p.user.username), document.createTextNode(" "), el("span", "", `· ${ago(p.createdAt)}`));
  who.append(avatar(p.user), name);
  meta.append(who);
  if (p.caption) meta.append(el("p", "caption", p.caption));
  const shop = el("button", "shop-btn");
  shop.append(svg("bag"), document.createTextNode(`Shop the look · ${p.items.length}`));
  shop.addEventListener("click", () => openShop(p));
  meta.append(shop);

  const rail = el("div", "rail");
  const heart = el("button", saved.has(p.id) ? "on" : "");
  heart.setAttribute("aria-label", "Save");
  heart.append(svg("heart"));
  heart.addEventListener("click", () => {
    const on = !saved.has(p.id);
    on ? saved.add(p.id) : saved.delete(p.id);
    heart.classList.toggle("on", on);
    try { localStorage.setItem("saved", JSON.stringify([...saved])); } catch {}
  });
  const share = el("button");
  share.setAttribute("aria-label", "Share");
  share.append(svg("share"));
  share.addEventListener("click", () => sharePost(p));
  const more = el("button");
  more.setAttribute("aria-label", "More");
  more.append(svg("more"));
  more.addEventListener("click", () => openMore(p));
  rail.append(heart, share, more);

  s.append(meta, rail);
  return s;
}

function endCard(empty, text) {
  const e = el("section", "end");
  if (empty) {
    e.append(el("h2", "", "Nothing here yet."), el("p", "", text || "Post a look and tag what you're wearing. Anyone who loves it can shop it."));
  } else {
    e.append(el("h2", "", "You're all caught up."), el("p", "", "New looks are posted all day. Got one?"));
  }
  const cta = el("a", "btn", "Post a look");
  cta.href = "/post";
  e.append(cta);
  return e;
}

function openShop(p) {
  const { close, sheet } = openSheet();
  const head = el("header");
  const h = el("div");
  h.append(el("h3", "", "Shop the look"), el("p", "by", `As worn by @${p.user.username}`));
  const x = el("button", "icon-btn");
  x.setAttribute("aria-label", "Close");
  x.append(svg("close"));
  x.addEventListener("click", close);
  head.append(h, x);
  sheet.append(head);

  p.items.forEach((it, i) => {
    const a = el("a", "row");
    a.href = `/api/go?p=${encodeURIComponent(p.id)}&i=${i}`;
    a.target = "_blank";
    a.rel = "noopener sponsored";
    const t = el("div", "t");
    t.append(el("small", "", it.store), el("b", "", it.title));
    if (it.price) t.append(el("span", "", it.price));
    const go = el("span", "go", "Shop");
    go.append(svg("arrow"));
    a.append(el("span", "n", String(i + 1).padStart(2, "0")), t, go);
    sheet.append(a);
  });
  sheet.append(el("p", "fine", "Swoon may earn a commission when you shop through these links."));
}

function openMore(p) {
  const { close, sheet } = openSheet();
  const menu = el("div", "menu");
  const prof = el("a", "", `View @${p.user.username}`);
  prof.href = `/@${p.user.username}`;
  const rep = el("button", "", "Report this post");
  rep.addEventListener("click", async () => {
    close();
    try { await api("/api/report", { method: "POST", data: { id: p.id } }); toast("Thanks, we'll take a look"); } catch { toast("Couldn't send report"); }
  });
  const cancel = el("button", "", "Cancel");
  cancel.addEventListener("click", close);
  menu.append(prof, rep, cancel);
  sheet.append(menu);
}

function openSheet() {
  const scrim = el("div", "scrim");
  const sheet = el("div", "sheet");
  sheet.setAttribute("role", "dialog");
  sheet.append(el("div", "grab"));
  const close = () => { scrim.remove(); sheet.remove(); };
  scrim.addEventListener("click", close);
  document.body.append(scrim, sheet);
  return { close, sheet };
}

async function sharePost(p) {
  const url = `${location.origin}/?user=${encodeURIComponent(p.user.username)}#${p.id}`;
  try {
    if (navigator.share) await navigator.share({ title: `@${p.user.username} on Swoon`, url });
    else { await navigator.clipboard.writeText(url); toast("Link copied"); }
  } catch {}
}

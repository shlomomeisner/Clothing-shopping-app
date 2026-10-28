const feed = document.getElementById("feed");
const hero = document.getElementById("hero");
const form = document.getElementById("composer");
const input = document.getElementById("input");
const send = document.getElementById("send");

let history = [];
let busy = false;

document.getElementById("chips").addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") ask(e.target.textContent);
});
document.getElementById("reset").addEventListener("click", () => {
  history = [];
  feed.querySelectorAll(".msg").forEach((n) => n.remove());
  hero.hidden = false;
  input.focus();
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  ask(input.value);
});

async function ask(text) {
  text = text.trim();
  if (!text || busy) return;
  busy = true;
  send.disabled = true;
  input.value = "";
  hero.hidden = true;

  history.push({ role: "user", content: text });
  add(el("div", "msg user", text));
  const loading = add(loadingNode());

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");

    // Keep the picks in history so follow-ups ("cheaper", "in black") have context.
    const summary = data.picks.map((p) => `${p.name} (${p.retailerName}, ${p.price})`).join("; ");
    history.push({ role: "assistant", content: `${data.message}\nPicks: ${summary}` });

    loading.replaceWith(botNode(data));
  } catch (err) {
    history.pop();
    const n = el("div", "msg bot err");
    n.append(el("p", "text", err.message));
    loading.replaceWith(n);
  } finally {
    busy = false;
    send.disabled = false;
    input.focus();
    scrollDown();
  }
}

function botNode({ message, picks }) {
  const n = el("div", "msg bot");
  n.append(el("p", "text", message));
  if (picks.length) {
    const rail = el("div", "rail");
    picks.forEach((p, i) => rail.append(card(p, i)));
    n.append(rail);
  }
  return n;
}

function card(p, i) {
  const a = el("a", "card");
  a.href = `/api/go?r=${encodeURIComponent(p.retailer)}&q=${encodeURIComponent(p.query)}`;
  a.target = "_blank";
  a.rel = "noopener sponsored";
  a.style.animationDelay = `${i * 70}ms`;

  const sw = el("div", "swatch");
  sw.style.setProperty("--c", p.color);
  sw.style.setProperty("--fg", isLight(p.color) ? "#0b0b0a" : "#f2ede4");
  sw.append(el("span", "num", String(i + 1).padStart(2, "0")), el("span", "name", p.name));

  const meta = el("div", "meta");
  const row = el("div", "row");
  row.append(el("span", "store", p.retailerName), el("span", "price", p.price));
  const shop = el("span", "shop", "Shop it");
  shop.append(el("span", "", "→"));
  meta.append(row, el("p", "why", p.why), shop);

  a.append(sw, meta);
  return a;
}

function loadingNode() {
  const n = el("div", "msg bot");
  const dots = el("div", "typing");
  dots.append(el("i"), el("i"), el("i"));
  const rail = el("div", "rail");
  for (let i = 0; i < 3; i++) rail.append(el("div", "ghost"));
  n.append(dots, rail);
  return n;
}

function isLight(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

function el(tag, cls = "", text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function add(node) {
  feed.append(node);
  scrollDown();
  return node;
}

function scrollDown() {
  requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
}

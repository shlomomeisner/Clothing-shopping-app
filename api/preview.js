// POST /api/preview { url }  (admin)
// Best-effort: reads the product page's title, photo and price so you don't have to type them.
// Some stores block this; then just fill the fields in by hand.
import { isAdmin } from "../lib/auth.js";

export default async function handler(req, res) {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: "Wrong password" });
  }
  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  let url;
  try { url = new URL(b.url); } catch { return res.status(400).json({ error: "Bad link" }); }

  try {
    const page = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        accept: "text/html",
      },
      signal: AbortSignal.timeout(6000),
    });
    const html = (await page.text()).slice(0, 400000);
    const meta = (prop) => {
      const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
      const m = html.match(re);
      return m ? decode(m[1] || m[2]) : "";
    };
    const amount = meta("product:price:amount") || meta("og:price:amount");
    const currency = meta("product:price:currency") || meta("og:price:currency");
    res.status(200).json({
      title: meta("og:title").replace(/\s*[|–-]\s*(ASOS|ZARA.*|Sephora|Ulta.*)$/i, "").slice(0, 120),
      image: meta("og:image"),
      price: amount ? `${currency === "USD" || !currency ? "$" : currency + " "}${amount}` : "",
    });
  } catch {
    res.status(200).json({ title: "", image: "", price: "" });
  }
}

function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

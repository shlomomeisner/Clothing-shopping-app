import { RETAILERS } from "../lib/retailers.js";
import { toAffiliateUrl } from "../lib/affiliate.js";

// GET /api/go?r=<retailer>&q=<search query>
// Logs the click, then redirects to the retailer through the affiliate link.
export default function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const retailer = RETAILERS[url.searchParams.get("r")];
  const q = (url.searchParams.get("q") || "").slice(0, 200);

  if (!retailer || !q) return res.status(400).send("Bad link");

  const target = toAffiliateUrl(retailer.url(q));
  console.log(JSON.stringify({ event: "click", retailer: url.searchParams.get("r"), q, at: new Date().toISOString() }));

  res.statusCode = 302;
  res.setHeader("Location", target);
  res.setHeader("Cache-Control", "no-store");
  res.end();
}

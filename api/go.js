import { getPost, countClick } from "../lib/db.js";
import { toAffiliateUrl } from "../lib/affiliate.js";

// GET /api/go?id=<post id>
// Counts the tap, then sends the shopper to the store through your affiliate link.
export default async function handler(req, res) {
  const id = new URL(req.url, "http://x").searchParams.get("id");
  const post = id && (await getPost(id));
  if (!post) return res.status(404).send("That item isn't here anymore");

  await countClick(id).catch((e) => console.error(e));

  res.statusCode = 302;
  res.setHeader("Location", toAffiliateUrl(post.url));
  res.setHeader("Cache-Control", "no-store");
  res.end();
}

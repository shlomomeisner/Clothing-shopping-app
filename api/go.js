import { query } from "../lib/http.js";
import { getPost, addTap } from "../lib/posts.js";
import { toAffiliateUrl } from "../lib/affiliate.js";

// GET /api/go?p=<post id>&i=<item number>
// Counts the tap, then sends the shopper to the store through the affiliate link,
// tagged with the creator who posted it.
export default async function handler(req, res) {
  const q = query(req);
  const post = await getPost(q.get("p") || "");
  const i = parseInt(q.get("i") || "0", 10);
  const item = post?.items[i];
  if (!item) return res.status(404).send("That item isn't here anymore");

  await addTap(post.id, i).catch((e) => console.error(e));

  res.statusCode = 302;
  res.setHeader("Location", toAffiliateUrl(item.url, post.user));
  res.setHeader("Cache-Control", "no-store");
  res.end();
}

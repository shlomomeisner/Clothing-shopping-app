import { body, isJson, isAdmin, fail } from "../lib/http.js";
import { currentUser } from "../lib/users.js";
import { getPost, report } from "../lib/posts.js";
import { r } from "../lib/db.js";

// POST /api/report { id }          anyone can flag a post
// GET  /api/report                 list flagged posts (ADMIN_PASSWORD header)
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (!isAdmin(req)) return fail(res, 401, "Admin only");
      const flat = (await r("HGETALL", "reports")) || [];
      const out = [];
      for (let i = 0; i < flat.length; i += 2) out.push({ id: flat[i], ...JSON.parse(flat[i + 1]) });
      return res.status(200).json({ reports: out });
    }
    if (req.method !== "POST" || !isJson(req)) return fail(res, 405, "Not allowed");
    const post = await getPost(String(body(req).id || ""));
    if (!post) return fail(res, 404, "Post not found");
    const me = await currentUser(req);
    await report(post.id, me?.username);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    fail(res, 500, "Something went wrong");
  }
}

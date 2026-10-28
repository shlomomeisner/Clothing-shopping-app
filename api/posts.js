import { randomUUID } from "node:crypto";
import { isAdmin } from "../lib/auth.js";
import { listPosts, addPost, deletePost, getClicks } from "../lib/db.js";
import { storeFor } from "../lib/retailers.js";

// GET    /api/posts               public feed
// GET    /api/posts?stats=1       feed + click counts      (admin)
// POST   /api/posts               create a post            (admin)
// DELETE /api/posts?id=...        delete a post            (admin)
// Admin requests send the password in the x-admin-password header.
export default async function handler(req, res) {
  const q = new URL(req.url, "http://x").searchParams;

  try {
    if (req.method === "GET" && !q.get("stats")) {
      const posts = await listPosts();
      res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=60");
      return res.status(200).json({ posts: posts.map(publicView) });
    }

    if (!isAdmin(req)) return res.status(401).json({ error: "Wrong password" });

    if (req.method === "GET") {
      const [posts, clicks] = await Promise.all([listPosts(), getClicks()]);
      return res.status(200).json({ posts: posts.map((p) => ({ ...p, clicks: clicks[p.id] || 0 })) });
    }

    if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      let url;
      try { url = new URL(String(b.url).trim()); } catch { return res.status(400).json({ error: "Paste a valid product link" }); }
      if (url.protocol !== "https:") return res.status(400).json({ error: "Link must start with https://" });
      if (!b.title?.trim()) return res.status(400).json({ error: "Add a name for the item" });

      const post = {
        id: randomUUID().slice(0, 8),
        url: url.toString(),
        store: storeFor(url.toString()),
        title: String(b.title).trim().slice(0, 120),
        price: String(b.price || "").trim().slice(0, 20),
        image: /^https:\/\//.test(b.image || "") ? String(b.image).trim() : "",
        note: String(b.note || "").trim().slice(0, 280),
        type: b.type === "makeup" ? "makeup" : "outfit",
        createdAt: Date.now(),
      };
      await addPost(post);
      return res.status(201).json({ post });
    }

    if (req.method === "DELETE") {
      await deletePost(q.get("id"));
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// The public feed never exposes the raw store link; taps go through /api/go.
function publicView({ url, ...p }) {
  return p;
}


import { body, query, isJson, isAdmin, fail } from "../lib/http.js";
import { currentUser, getUser, publicUser } from "../lib/users.js";
import { createPost, getPost, listPosts, countPosts, deletePost, getTaps } from "../lib/posts.js";

// GET    /api/posts?offset=0                 everyone's posts, newest first
// GET    /api/posts?user=name&offset=0       one creator's posts (+ tap counts if it's you)
// GET    /api/posts?id=xyz                   one post
// POST   /api/posts { photo, caption, items: [{ url, title, price }] }   (signed in)
// DELETE /api/posts?id=xyz                   (the post's creator, or ADMIN_PASSWORD header)
export default async function handler(req, res) {
  const q = query(req);
  try {
    if (req.method === "GET") return await read(req, res, q);

    if (!isJson(req)) return fail(res, 415, "Send JSON");
    const me = await currentUser(req);

    if (req.method === "POST") {
      if (!me) return fail(res, 401, "Log in to post");
      try {
        const post = await createPost(me.username, body(req));
        return res.status(201).json({ post: view(post) });
      } catch (e) {
        return fail(res, 400, e.message);
      }
    }

    if (req.method === "DELETE") {
      const post = await getPost(q.get("id"));
      if (!post) return fail(res, 404, "Post not found");
      if (!isAdmin(req) && me?.username !== post.user) return fail(res, 403, "Not your post");
      await deletePost(post);
      return res.status(200).json({ ok: true });
    }

    fail(res, 405, "Not allowed");
  } catch (err) {
    console.error(err);
    fail(res, 500, err.message);
  }
}

async function read(req, res, q) {
  if (q.get("id")) {
    const post = await getPost(q.get("id"));
    if (!post) return fail(res, 404, "Post not found");
    const author = publicUser(await getUser(post.user));
    return res.status(200).json({ post: view(post, author) });
  }

  const offset = Math.max(0, parseInt(q.get("offset") || "0", 10) || 0);
  const username = (q.get("user") || "").toLowerCase();

  if (username) {
    const user = await getUser(username);
    if (!user) return fail(res, 404, "No one by that name");
    const [posts, total, me] = await Promise.all([listPosts({ user: username, offset }), countPosts(username), currentUser(req)]);
    const author = publicUser(user);
    const mine = me?.username === username;
    const taps = mine ? await getTaps(posts) : null;
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      user: author,
      total,
      mine,
      posts: posts.map((p) => view(p, author, taps)),
    });
  }

  const posts = await listPosts({ offset });
  const names = [...new Set(posts.map((p) => p.user))];
  const authors = Object.fromEntries(await Promise.all(names.map(async (n) => [n, publicUser(await getUser(n))])));
  res.setHeader("Cache-Control", "s-maxage=5, stale-while-revalidate=30");
  res.status(200).json({ posts: posts.map((p) => view(p, authors[p.user])) });
}

// What the browser sees. Store links stay server-side; buy taps go through /api/go.
function view(p, author, taps) {
  return {
    id: p.id,
    user: author || { username: p.user, name: p.user },
    caption: p.caption,
    photo: p.photo,
    createdAt: p.createdAt,
    items: p.items.map((it, i) => ({
      store: it.store,
      title: it.title,
      price: it.price,
      ...(taps ? { taps: taps[`${p.id}:${i}`] || 0 } : {}),
    })),
  };
}

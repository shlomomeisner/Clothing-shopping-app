import { randomBytes } from "node:crypto";
import { r } from "./db.js";
import { storeFor } from "./retailers.js";

const MAX_ITEMS = 10;
const MAX_PHOTO_BYTES = 900_000; // the posting page shrinks photos well under this

// Keys:
//   post (hash)          id -> post JSON
//   feed (zset)          all post ids by time
//   uposts:<user> (zset) one creator's post ids by time
//   img:<id>             photo, base64
//   taps (hash)          "<postId>:<itemIndex>" -> count

export async function createPost(username, input) {
  const photo = parsePhoto(input.photo);
  if (!photo) throw new Error("Add a photo (JPEG, PNG or WebP)");

  const items = (Array.isArray(input.items) ? input.items : []).slice(0, MAX_ITEMS).map(cleanItem).filter(Boolean);
  if (!items.length) throw new Error("Add at least one item with a link and a name");

  const id = randomBytes(6).toString("base64url");
  const post = {
    id,
    user: username,
    caption: String(input.caption || "").trim().slice(0, 500),
    photo: `/api/img?id=${id}&t=${photo.type}`,
    items,
    createdAt: Date.now(),
  };

  await r("SET", `img:${id}`, `${photo.type};${photo.data}`);
  await r("HSET", "post", id, JSON.stringify(post));
  await r("ZADD", "feed", post.createdAt, id);
  await r("ZADD", `uposts:${username}`, post.createdAt, id);
  return post;
}

export async function getPost(id) {
  const s = await r("HGET", "post", id);
  return s ? JSON.parse(s) : null;
}

// Newest first. `user` limits to one creator.
export async function listPosts({ user, offset = 0, limit = 12 } = {}) {
  const key = user ? `uposts:${user}` : "feed";
  const ids = await r("ZREVRANGE", key, offset, offset + limit - 1);
  if (!ids.length) return [];
  const raw = await r("HMGET", "post", ...ids);
  return raw.filter(Boolean).map((s) => JSON.parse(s));
}

export async function countPosts(user) {
  return r("ZCARD", `uposts:${user}`);
}

export async function deletePost(post) {
  await r("ZREM", "feed", post.id);
  await r("ZREM", `uposts:${post.user}`, post.id);
  await r("HDEL", "post", post.id);
  await r("DEL", `img:${post.id}`);
}

export async function getPhoto(id) {
  const s = await r("GET", `img:${id}`);
  if (!s) return null;
  const i = s.indexOf(";");
  return { type: s.slice(0, i), data: Buffer.from(s.slice(i + 1), "base64") };
}

export async function addTap(postId, index) {
  return r("HINCRBY", "taps", `${postId}:${index}`, 1);
}

// { "<postId>:<i>": n, ... } for the given posts
export async function getTaps(posts) {
  const fields = posts.flatMap((p) => p.items.map((_, i) => `${p.id}:${i}`));
  if (!fields.length) return {};
  const counts = await r("HMGET", "taps", ...fields);
  return Object.fromEntries(fields.map((f, i) => [f, Number(counts[i] || 0)]));
}

export async function report(postId, by) {
  await r("HSET", "reports", postId, JSON.stringify({ by: by || "anonymous", at: Date.now() }));
}

function parsePhoto(dataUrl) {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  if (m[2].length * 0.75 > MAX_PHOTO_BYTES) throw new Error("Photo is too big");
  return { type: m[1], data: m[2] };
}

function cleanItem(it) {
  let url;
  try { url = new URL(String(it?.url || "").trim()); } catch { return null; }
  if (url.protocol !== "https:") return null;
  const title = String(it.title || "").trim().slice(0, 100);
  if (!title) return null;
  return { url: url.toString(), store: storeFor(url.toString()), title, price: String(it.price || "").trim().slice(0, 20) };
}

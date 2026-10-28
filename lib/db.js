// Storage for posts and click counts.
//
// On Vercel: connect an Upstash Redis database (Vercel → Storage → Upstash),
// which sets KV_REST_API_URL / KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL / _TOKEN).
// Locally with neither set: saves to data/db.json.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const FILE = new URL("../data/db.json", import.meta.url);

async function redis(...cmd) {
  const res = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function loadFile() {
  try { return JSON.parse(await readFile(FILE, "utf8")); } catch { return { posts: [], clicks: {} }; }
}
async function saveFile(db) {
  if (process.env.VERCEL) throw new Error("No database connected. Add Upstash Redis in Vercel → Storage.");
  await mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await writeFile(FILE, JSON.stringify(db, null, 2));
}

// Newest first.
export async function listPosts() {
  if (URL_) {
    const ids = await redis("ZREVRANGE", "posts", 0, 199);
    if (!ids.length) return [];
    const raw = await redis("HMGET", "post", ...ids);
    return raw.filter(Boolean).map((s) => JSON.parse(s));
  }
  return (await loadFile()).posts.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getPost(id) {
  if (URL_) {
    const s = await redis("HGET", "post", id);
    return s ? JSON.parse(s) : null;
  }
  return (await loadFile()).posts.find((p) => p.id === id) || null;
}

export async function addPost(post) {
  if (URL_) {
    await redis("HSET", "post", post.id, JSON.stringify(post));
    await redis("ZADD", "posts", post.createdAt, post.id);
    return;
  }
  const db = await loadFile();
  db.posts.push(post);
  await saveFile(db);
}

export async function deletePost(id) {
  if (URL_) {
    await redis("ZREM", "posts", id);
    await redis("HDEL", "post", id);
    return;
  }
  const db = await loadFile();
  db.posts = db.posts.filter((p) => p.id !== id);
  await saveFile(db);
}

export async function countClick(id) {
  if (URL_) return redis("HINCRBY", "clicks", id, 1);
  const db = await loadFile();
  db.clicks[id] = (db.clicks[id] || 0) + 1;
  await saveFile(db).catch(() => {});
}

export async function getClicks() {
  if (URL_) {
    const flat = (await redis("HGETALL", "clicks")) || [];
    const out = {};
    for (let i = 0; i < flat.length; i += 2) out[flat[i]] = Number(flat[i + 1]);
    return out;
  }
  return (await loadFile()).clicks;
}

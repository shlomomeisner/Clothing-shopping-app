// Key-value storage with Redis commands.
//
// On Vercel: add Upstash Redis (Vercel → Storage), which sets KV_REST_API_URL / KV_REST_API_TOKEN
// (or UPSTASH_REDIS_REST_URL / _TOKEN). Locally with neither set, a small Redis stand-in
// saves everything to data/kv.json, so the same code runs in both places.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export async function r(...cmd) {
  if (!URL_) {
    if (process.env.VERCEL) throw new Error("No database connected. Add Upstash Redis in Vercel → Storage.");
    return local(cmd.map(String));
  }
  const res = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(cmd.map(String)),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

// ---- local stand-in (dev only) ----
const FILE = new URL("../data/kv.json", import.meta.url);
let mem = null;
let queue = Promise.resolve();

async function local(cmd) {
  const run = queue.then(async () => {
    if (!mem) {
      try { mem = JSON.parse(await readFile(FILE, "utf8")); } catch { mem = { s: {}, h: {}, z: {} }; }
    }
    const out = exec(cmd);
    await mkdir(new URL("../data/", import.meta.url), { recursive: true });
    await writeFile(FILE, JSON.stringify(mem));
    return out;
  });
  queue = run.catch(() => {});
  return run;
}

function exec([op, key, ...a]) {
  const { s, h, z } = mem;
  switch (op.toUpperCase()) {
    case "GET": return s[key] ?? null;
    case "SET": {
      if (a.includes("NX") && key in s) return null;
      s[key] = a[0];
      return "OK";
    }
    case "DEL": { const had = key in s || key in h || key in z; delete s[key]; delete h[key]; delete z[key]; return had ? 1 : 0; }
    case "HGET": return h[key]?.[a[0]] ?? null;
    case "HSET": { h[key] ??= {}; for (let i = 0; i < a.length; i += 2) h[key][a[i]] = a[i + 1]; return 1; }
    case "HDEL": { const had = h[key] && a[0] in h[key]; if (had) delete h[key][a[0]]; return had ? 1 : 0; }
    case "HMGET": return a.map((f) => h[key]?.[f] ?? null);
    case "HINCRBY": { h[key] ??= {}; h[key][a[0]] = String(Number(h[key][a[0]] || 0) + Number(a[1])); return Number(h[key][a[0]]); }
    case "HGETALL": return Object.entries(h[key] || {}).flat();
    case "ZADD": { z[key] ??= {}; z[key][a[1]] = Number(a[0]); return 1; }
    case "ZREM": { const had = z[key] && a[0] in z[key]; if (had) delete z[key][a[0]]; return had ? 1 : 0; }
    case "ZCARD": return Object.keys(z[key] || {}).length;
    case "ZREVRANGE": {
      const ids = Object.entries(z[key] || {}).sort((x, y) => y[1] - x[1]).map(([m]) => m);
      return ids.slice(Number(a[0]), Number(a[1]) + 1);
    }
    default: throw new Error(`local db: ${op} not supported`);
  }
}

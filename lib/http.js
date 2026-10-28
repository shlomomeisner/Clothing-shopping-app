import { timingSafeEqual } from "node:crypto";
// Small helpers shared by the API routes.

export function body(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === "string") { try { return JSON.parse(b); } catch { return {}; } }
  return b;
}

export function query(req) {
  return new URL(req.url, "http://x").searchParams;
}

// Writes need a JSON content type. Browsers can't send that cross-site without
// permission, which blocks forged form posts (CSRF) along with the SameSite cookie.
export function isJson(req) {
  return String(req.headers["content-type"] || "").startsWith("application/json");
}

export function fail(res, status, error) {
  return res.status(status).json({ error });
}


// Site owner override (ADMIN_PASSWORD in the x-admin-password header), for removing posts.
export function isAdmin(req) {
  const want = process.env.ADMIN_PASSWORD;
  if (!want) return false;
  const a = Buffer.from(String(req.headers["x-admin-password"] || ""));
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

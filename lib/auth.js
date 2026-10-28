import { timingSafeEqual } from "node:crypto";

// Admin requests send ADMIN_PASSWORD in the x-admin-password header.
export function isAdmin(req) {
  const want = process.env.ADMIN_PASSWORD;
  if (!want) return false;
  const a = Buffer.from(String(req.headers["x-admin-password"] || ""));
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

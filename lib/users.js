import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { r } from "./db.js";

const scrypt = promisify(_scrypt);
const SESSION_DAYS = 30;

export const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

export async function createUser({ username, name, password }) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)).toString("hex");
  const user = { username, name: name || username, bio: "", salt, hash, createdAt: Date.now() };
  const ok = await r("SET", `user:${username}`, JSON.stringify(user), "NX");
  return ok ? user : null; // null = username taken
}

export async function getUser(username) {
  const s = await r("GET", `user:${username}`);
  return s ? JSON.parse(s) : null;
}

export async function checkPassword(user, password) {
  const got = await scrypt(password, user.salt, 64);
  return timingSafeEqual(got, Buffer.from(user.hash, "hex"));
}

export function publicUser(u) {
  return u && { username: u.username, name: u.name, bio: u.bio };
}

// ---- sessions (httpOnly cookie "sid") ----

export async function startSession(res, username) {
  const token = randomBytes(32).toString("base64url");
  await r("SET", `session:${token}`, username, "EX", SESSION_DAYS * 86400);
  res.setHeader("Set-Cookie", cookie(token, SESSION_DAYS * 86400));
}

export async function endSession(req, res) {
  const token = sid(req);
  if (token) await r("DEL", `session:${token}`);
  res.setHeader("Set-Cookie", cookie("", 0));
}

// Returns the signed-in user, or null.
export async function currentUser(req) {
  const token = sid(req);
  if (!token) return null;
  const username = await r("GET", `session:${token}`);
  return username ? getUser(username) : null;
}

function sid(req) {
  const m = String(req.headers.cookie || "").match(/(?:^|;\s*)sid=([^;]+)/);
  return m ? m[1] : null;
}

function cookie(value, maxAge) {
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `sid=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

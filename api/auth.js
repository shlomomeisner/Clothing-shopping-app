import { body, isJson, fail } from "../lib/http.js";
import { USERNAME_RE, createUser, getUser, checkPassword, startSession, endSession, currentUser, publicUser } from "../lib/users.js";

// GET  /api/auth                                    -> { user } (null if signed out)
// POST /api/auth { action: "signup", username, name, password }
// POST /api/auth { action: "login", username, password }
// POST /api/auth { action: "logout" }
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ user: publicUser(await currentUser(req)) });
    }
    if (req.method !== "POST" || !isJson(req)) return fail(res, 405, "Not allowed");

    const b = body(req);
    const username = String(b.username || "").trim().toLowerCase().replace(/^@/, "");
    const password = String(b.password || "");

    if (b.action === "logout") {
      await endSession(req, res);
      return res.status(200).json({ ok: true });
    }

    if (b.action === "signup") {
      if (!USERNAME_RE.test(username)) return fail(res, 400, "Username: 3–20 letters, numbers, dots or underscores");
      if (password.length < 8) return fail(res, 400, "Password needs at least 8 characters");
      const user = await createUser({ username, name: String(b.name || "").trim().slice(0, 40), password });
      if (!user) return fail(res, 409, "That username is taken");
      await startSession(res, username);
      return res.status(201).json({ user: publicUser(user) });
    }

    if (b.action === "login") {
      const user = USERNAME_RE.test(username) && (await getUser(username));
      if (!user || !(await checkPassword(user, password))) return fail(res, 401, "Wrong username or password");
      await startSession(res, username);
      return res.status(200).json({ user: publicUser(user) });
    }

    fail(res, 400, "Unknown action");
  } catch (err) {
    console.error(err);
    fail(res, 500, "Something went wrong");
  }
}

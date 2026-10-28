// Local dev server, no dependencies: `npm run dev` → http://localhost:3000
// On Vercel this file isn't used; /api/* and /public deploy automatically (see vercel.json).
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import auth from "./api/auth.js";
import posts from "./api/posts.js";
import img from "./api/img.js";
import go from "./api/go.js";
import preview from "./api/preview.js";
import report from "./api/report.js";

const routes = { "/api/auth": auth, "/api/posts": posts, "/api/img": img, "/api/go": go, "/api/preview": preview, "/api/report": report };
const pages = { "/": "index.html", "/login": "login.html", "/post": "post.html" };
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
const PUBLIC = new URL("./public/", import.meta.url).pathname;

http
  .createServer(async (req, res) => {
    const { pathname } = new URL(req.url, "http://x");

    // Vercel-style helpers
    res.status = (c) => ((res.statusCode = c), res);
    res.json = (o) => (res.setHeader("content-type", "application/json"), res.end(JSON.stringify(o)));
    res.send = (s) => res.end(s);

    if (routes[pathname]) {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      req.body = raw;
      try {
        return await routes[pathname](req, res);
      } catch (e) {
        console.error(e);
        return res.status(500).end();
      }
    }

    const name = pages[pathname] || (pathname.startsWith("/@") ? "u.html" : pathname);
    const file = normalize(join(PUBLIC, name));
    if (!file.startsWith(PUBLIC)) return res.status(403).end();
    try {
      const data = await readFile(file);
      res.setHeader("content-type", types[extname(file)] || "application/octet-stream");
      res.end(data);
    } catch {
      res.status(404).end("Not found");
    }
  })
  .listen(process.env.PORT || 3000, () => console.log(`swoon running on http://localhost:${process.env.PORT || 3000}`));

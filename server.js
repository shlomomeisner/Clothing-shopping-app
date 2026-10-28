// Local dev server, no dependencies: `node server.js` → http://localhost:3000
// On Vercel this file isn't used; /api/* and /public deploy automatically.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import chat from "./api/chat.js";
import go from "./api/go.js";

const routes = { "/api/chat": chat, "/api/go": go };
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png" };
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
      try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      return routes[pathname](req, res);
    }

    const file = normalize(join(PUBLIC, pathname === "/" ? "index.html" : pathname));
    if (!file.startsWith(PUBLIC)) return res.status(403).end();
    try {
      const body = await readFile(file);
      res.setHeader("content-type", types[extname(file)] || "application/octet-stream");
      res.end(body);
    } catch {
      res.status(404).end("Not found");
    }
  })
  .listen(process.env.PORT || 3000, () => console.log(`Rack running on http://localhost:${process.env.PORT || 3000}`));

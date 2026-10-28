import { query } from "../lib/http.js";
import { getPhoto } from "../lib/posts.js";

// GET /api/img?id=xyz  -> the post's photo. Photos never change, so browsers and the CDN cache them for good.
export default async function handler(req, res) {
  const photo = await getPhoto(query(req).get("id") || "");
  if (!photo) {
    res.statusCode = 404;
    return res.end();
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", `image/${photo.type}`);
  res.setHeader("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
  res.end(photo.data);
}

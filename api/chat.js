import { getPicks } from "../lib/stylist.js";

// POST /api/chat  { messages: [{ role, content }] }  ->  { message, picks }
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const messages = (body.messages || [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Send at least one user message" });
  }

  try {
    res.status(200).json(await getPicks(messages));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "The stylist hit a snag. Try again." });
  }
}

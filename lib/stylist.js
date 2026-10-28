import { RETAILERS, RETAILER_KEYS } from "./retailers.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

const SYSTEM = `You are Rack, a sharp, warm personal stylist in a shopping chat.
The shopper tells you what they want. You reply with a short, confident message (1-3 sentences, no lists)
and 3-6 specific pieces they can shop right now.
Rules:
- Respect budget, size, occasion and style cues. If something is vague, make a good call instead of asking.
- Each piece is a concrete item (e.g. "relaxed wide-leg linen trouser"), not a category.
- "query" is what you'd type into the retailer's search box to find it. Keep it short and specific.
- Spread picks across retailers that fit the price point.
- "color" is a hex for the item's main color.
- Never invent exact prices; give a realistic range like "$40-70".`;

const TOOL = {
  name: "show_picks",
  description: "Reply to the shopper and show the pieces you picked.",
  input_schema: {
    type: "object",
    properties: {
      message: { type: "string" },
      picks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            why: { type: "string", description: "One short line on why it works." },
            price: { type: "string" },
            retailer: { type: "string", enum: RETAILER_KEYS },
            query: { type: "string" },
            color: { type: "string" },
          },
          required: ["name", "why", "price", "retailer", "query", "color"],
        },
      },
    },
    required: ["message", "picks"],
  },
};

// messages: [{ role: "user" | "assistant", content: string }]
export async function getPicks(messages) {
  if (!process.env.ANTHROPIC_API_KEY) return demoPicks(messages);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: messages.slice(-12),
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const call = data.content.find((b) => b.type === "tool_use");
  if (!call) throw new Error("No picks returned");
  return clean(call.input);
}

function clean({ message, picks }) {
  return {
    message: String(message || ""),
    picks: (picks || [])
      .filter((p) => RETAILERS[p.retailer] && p.query)
      .slice(0, 6)
      .map((p) => ({
        name: p.name,
        why: p.why,
        price: p.price,
        retailer: p.retailer,
        retailerName: RETAILERS[p.retailer].name,
        query: p.query,
        color: /^#[0-9a-f]{3,8}$/i.test(p.color) ? p.color : "#2a2a2a",
      })),
  };
}

// Used when no API key is set, so the UI works out of the box.
function demoPicks() {
  return clean({
    message: "Clean, easy, a little expensive-looking. Start here. (Demo picks — connect the AI for real ones.)",
    picks: [
      { name: "Heavyweight boxy tee", why: "Holds its shape, layers under everything.", price: "$20-35", retailer: "uniqlo", query: "heavyweight boxy t-shirt", color: "#ece6da" },
      { name: "Wide-leg pleated trouser", why: "Relaxed but still sharp.", price: "$50-90", retailer: "zara", query: "wide leg pleated trousers", color: "#3b3a36" },
      { name: "Suede chore jacket", why: "The piece people ask about.", price: "$120-200", retailer: "nordstrom", query: "suede chore jacket", color: "#8a5a3c" },
      { name: "Chunky leather loafer", why: "Dresses up the whole fit.", price: "$80-150", retailer: "asos", query: "chunky leather loafers", color: "#1b1b1b" },
    ],
  });
}

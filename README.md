# Rack

An AI stylist in a chat. Shoppers describe what they want ("first date, under $150"), Rack replies with specific pieces, and every **Shop it** link is an affiliate link, so you earn commission when they buy.

## How it works

```
shopper ──► /api/chat ──► Claude picks 3–6 pieces (name, retailer, search query, price range, color)
                │
                ▼
        product cards in the chat
                │  tap "Shop it"
                ▼
         /api/go  ── logs the click ──► affiliate link ──► retailer
```

- `public/` — the chat UI (plain HTML/CSS/JS, no build step)
- `api/chat.js` — sends the conversation to Claude, returns picks
- `api/go.js` — click tracking + redirect through the affiliate link
- `lib/retailers.js` — which stores Rack can link to
- `lib/affiliate.js` — turns store URLs into commission links

## Run it locally

```bash
cp .env.example .env   # add your keys (optional — runs in demo mode without them)
npm run dev            # http://localhost:3000
```

No dependencies to install. Needs Node 20+.

## Deploy

1. Import this repo at vercel.com/new.
2. Add the environment variables from `.env.example` in the Vercel project settings.
3. Deploy. `/public` serves the site and `/api` runs as serverless functions.

## Getting paid

| Variable | Where to get it | Covers |
| --- | --- | --- |
| `SKIMLINKS_ID` | Apply at Skimlinks (publisher account) | Nordstrom, ASOS, Zara, H&M, SSENSE, Uniqlo and thousands more, depending on each merchant's program |
| `AMAZON_TAG` | Amazon Associates | Amazon |

Until these are set, links go straight to the store and earn nothing. Commission rates and which merchants are covered depend on the networks, so check them once you're approved.

Keep the "We may earn a commission" line visible. The FTC requires that disclosure.

## Next up

- Real product feeds (Rakuten, Awin, CJ) so cards link to exact products with photos and live prices
- Store clicks in a database instead of logs, to see what converts
- Save looks and share them

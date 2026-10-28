# swoon ✦

A shopping feed of hand-picked outfits and makeup. You post the finds, people tap **Get it ♡**, and when they buy you earn the commission.

```
you (/admin) ── paste a product link ──► post shows up in the feed
                                               │  shopper taps "Get it"
                                               ▼
                                   /api/go ── counts the tap ──► your affiliate link ──► ASOS / Zara / Sephora / Ulta
```

## Pages

- `/` — the feed shoppers see. Filter by All / Outfits / Makeup, save favorites with ♡.
- `/admin` — where you post. Paste a link, tap **Grab photo & details** (fills in the name, photo and price when the store allows it), add a caption, post. It also shows how many taps each item got.

## Files

- `public/` — the site (plain HTML/CSS/JS, no build step)
- `api/posts.js` — list, create and delete posts
- `api/go.js` — counts the tap and redirects through the affiliate link
- `api/preview.js` — reads a product page's title, photo and price
- `lib/affiliate.js` — turns store links into commission links
- `lib/db.js` — storage (Upstash Redis on Vercel, a local file in dev)

## Run it locally

```bash
cp .env.example .env   # set ADMIN_PASSWORD
npm run dev            # http://localhost:3000 and /admin
```

No dependencies to install. Needs Node 20+.

## Go live

1. Import this repo at vercel.com/new.
2. In the Vercel project, open **Storage** and add **Upstash Redis**. That connects the database automatically.
3. Under **Settings → Environment Variables**, add `ADMIN_PASSWORD`, plus your affiliate IDs once approved.
4. Redeploy. Post your first drop at `yoursite.vercel.app/admin`.

## Getting paid

| Variable | Where to get it |
| --- | --- |
| `SKIMLINKS_ID` | Apply for a Skimlinks publisher account. It converts links for thousands of stores at once. |
| `AMAZON_TAG` | Amazon Associates, if you ever post Amazon items |

Until these are set, links still work but go straight to the store and earn nothing. Commission rates, and whether a given store (ASOS, Zara, Sephora, Ulta) pays, depend on each store's program in the network. Check this once you're approved. Some stores also run their own programs on Rakuten, Impact or Awin.

Keep the "We may earn a commission" line visible. The FTC requires that disclosure.

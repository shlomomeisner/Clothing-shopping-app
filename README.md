# Swoon

Shop what people are wearing. Anyone can sign up, post outfit photos throughout the day, and tag every piece in the look. Viewers scroll a full-screen feed, tap **Shop the look**, and buy straight from the store. Every buy link runs through your affiliate account, so you earn the commission.

```
creator ── posts a photo + tags items (links to ASOS, Zara, Sephora, Ulta…)
                    │
                    ▼
        full-screen feed, newest first
                    │  viewer taps "Shop the look" → an item
                    ▼
/api/go ── counts the tap ──► affiliate link (tagged with the creator) ──► store
```

## Pages

| Page | What it is |
| --- | --- |
| `/` | The feed. One look per screen, swipe up for the next. Save, share, report. |
| `/login` | Sign up or log in (username + password). |
| `/post` | New look: add a photo from the phone, a caption, and links to each item. |
| `/@username` | A creator's profile: their looks in a grid. On your own profile you also see shop taps per look and can delete looks. |

## How the money works

- Buy links use **your** affiliate IDs (`SKIMLINKS_ID`, `AMAZON_TAG`). You earn on every sale from every creator.
- Each link is tagged with the creator's username (Skimlinks `xcust`), so your Skimlinks reports show which creator drove each sale. That's what you'll use if you pay creators a share later.
- Until the IDs are set, links still work but go straight to the store and earn nothing.
- Whether a store pays, and how much, depends on that store's program in the network. Check ASOS, Zara, Sephora and Ulta once you're approved.
- Keep the commission disclosure visible. The FTC requires it.

## Go live

1. Import this repo at vercel.com/new.
2. In the Vercel project, open **Storage** and add **Upstash Redis**. It connects automatically.
3. Under **Settings → Environment Variables**, add `ADMIN_PASSWORD`, plus your affiliate IDs once approved.
4. Redeploy, open the site, and sign up.

## Run it locally

```bash
npm run dev    # http://localhost:3000
```

No dependencies to install. Needs Node 20+. Data saves to `data/kv.json`.

## Moderation

Anyone can report a post from its ••• menu. To review reports and remove posts, call the API with your owner password in the `x-admin-password` header:

- `GET /api/report` lists reported posts
- `DELETE /api/posts?id=<post id>` removes any post

## Code

- `public/` — the pages (plain HTML/CSS/JS, no build step). `common.js` holds shared helpers.
- `api/auth.js` — sign up, log in, log out (passwords hashed with scrypt, httpOnly session cookie)
- `api/posts.js` — feed, profiles, create and delete looks
- `api/img.js` — serves photos (cached forever by the CDN)
- `api/go.js` — counts the tap, redirects through the affiliate link
- `api/preview.js` — fills in an item's name and price from its link, when the store allows it
- `api/report.js` — report a post; list reports
- `lib/db.js` — Upstash Redis, with a local stand-in for development

## Known limits of this first version

- Photos are stored in Redis, about 200–400 KB each. Upstash's free tier fits roughly a thousand looks. Moving photos to Vercel Blob or S3 is the next step after that.
- No following, likes count, comments, or password reset yet.
- No in-app review queue for reports yet (API only).

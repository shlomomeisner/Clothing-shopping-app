// Turns a plain retailer URL into one that earns commission.
//
// SKIMLINKS_ID  - Skimlinks publisher ID. Converts links for most retailers.
// AMAZON_TAG    - Amazon Associates tag (Amazon isn't covered by Skimlinks).
//
// With neither set, links go straight to the retailer (no commission yet).
export function toAffiliateUrl(url, env = process.env) {
  const host = new URL(url).hostname;

  if (host.endsWith("amazon.com")) {
    if (!env.AMAZON_TAG) return url;
    const u = new URL(url);
    u.searchParams.set("tag", env.AMAZON_TAG);
    return u.toString();
  }

  if (env.SKIMLINKS_ID) {
    return `https://go.skimresources.com/?id=${encodeURIComponent(env.SKIMLINKS_ID)}&xs=1&url=${encodeURIComponent(url)}`;
  }

  return url;
}

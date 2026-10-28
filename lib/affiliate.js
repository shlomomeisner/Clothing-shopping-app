// Turns a plain store URL into one that earns commission.
//
// SKIMLINKS_ID  - your Skimlinks publisher ID. Converts links for most stores.
// AMAZON_TAG    - Amazon Associates tag (Amazon isn't covered by Skimlinks).
//
// `creator` is the username of whoever posted the item. It's sent to Skimlinks as
// xcust, so your Skimlinks reports show which creator drove each sale.
// With no IDs set, links go straight to the store (no commission yet).
export function toAffiliateUrl(url, creator = "", env = process.env) {
  const host = new URL(url).hostname;

  if (host.endsWith("amazon.com")) {
    if (!env.AMAZON_TAG) return url;
    const u = new URL(url);
    u.searchParams.set("tag", env.AMAZON_TAG);
    return u.toString();
  }

  if (env.SKIMLINKS_ID) {
    const xcust = creator ? `&xcust=${encodeURIComponent(creator)}` : "";
    return `https://go.skimresources.com/?id=${encodeURIComponent(env.SKIMLINKS_ID)}&xs=1&url=${encodeURIComponent(url)}${xcust}`;
  }

  return url;
}

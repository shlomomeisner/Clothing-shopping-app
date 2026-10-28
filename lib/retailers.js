// Known stores, matched by the product link's domain.
const STORES = [
  { key: "asos", name: "ASOS", domain: "asos.com" },
  { key: "zara", name: "Zara", domain: "zara.com" },
  { key: "sephora", name: "Sephora", domain: "sephora.com" },
  { key: "ulta", name: "Ulta", domain: "ulta.com" },
];

// Returns the store name for a product URL ("ASOS"), or a tidy domain for anything else.
export function storeFor(url) {
  const host = new URL(url).hostname.replace(/^www\d*\./, "");
  const hit = STORES.find((s) => host === s.domain || host.endsWith("." + s.domain));
  return hit ? hit.name : host;
}

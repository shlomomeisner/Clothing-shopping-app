// Retailers the stylist can link to. Each builds a search URL for an item query.
// Links are converted to affiliate links in lib/affiliate.js.
export const RETAILERS = {
  nordstrom: { name: "Nordstrom", url: (q) => `https://www.nordstrom.com/sr?keyword=${encodeURIComponent(q)}` },
  asos: { name: "ASOS", url: (q) => `https://www.asos.com/us/search/?q=${encodeURIComponent(q)}` },
  zara: { name: "Zara", url: (q) => `https://www.zara.com/us/en/search?searchTerm=${encodeURIComponent(q)}` },
  uniqlo: { name: "Uniqlo", url: (q) => `https://www.uniqlo.com/us/en/search?q=${encodeURIComponent(q)}` },
  hm: { name: "H&M", url: (q) => `https://www2.hm.com/en_us/search-results.html?q=${encodeURIComponent(q)}` },
  ssense: { name: "SSENSE", url: (q) => `https://www.ssense.com/en-us/search?q=${encodeURIComponent(q)}` },
  amazon: { name: "Amazon", url: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
};

export const RETAILER_KEYS = Object.keys(RETAILERS);

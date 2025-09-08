// Build a Zillow /homes/..._rb/ URL from an address, with a few heuristics:
// - strip unit suffixes (Apt/Unit/Suite/Ste/# etc.)
// - USPS-abbreviate trailing street suffix ("Street"→"St", "Road"→"Rd", ...)
// - try city variants without directional/neighborhood words (e.g., "West Raynham" → "Raynham")
export function toSlug(x: string) {
  return (x || "").trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

const STREET_ABBREV: Record<string, string> = {
  street: "St", avenue: "Ave", road: "Rd", drive: "Dr", lane: "Ln",
  court: "Ct", circle: "Cir", boulevard: "Blvd", place: "Pl", terrace: "Ter",
  highway: "Hwy", parkway: "Pkwy", way: "Way", trail: "Trl",
  square: "Sq", commons: "Cmns"
};

const CITY_DIR_WORDS = new Set(["north","south","east","west","n","s","e","w","nw","ne","sw","se"]);
const CITY_NEIGHBORHOODS = new Set(["center","village","heights","landing","falls"]);

function stripUnit(address: string) {
  return address.replace(/\b(?:apt|apartment|unit|suite|ste|fl|floor)\.?\s*#?\s*\w+$/i, "").trim();
}
function abbrevStreetSuffix(address: string) {
  const parts = address.trim().split(/\s+/);
  if (!parts.length) return address;
  const last = parts[parts.length - 1].toLowerCase();
  const abbr = STREET_ABBREV[last];
  if (abbr) parts[parts.length - 1] = abbr;
  return parts.join(" ");
}
function capWords(s: string) {
  return s.replace(/\b\w+/g, (w) => w[0].toUpperCase() + w.slice(1));
}
function normalizeCityVariants(city: string) {
  const tokens = (city || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const noDirectional = tokens.filter(t => !CITY_DIR_WORDS.has(t)).join(" ");
  const noNeighborhood = tokens.filter(t => !CITY_NEIGHBORHOODS.has(t)).join(" ");
  const uniq = new Set<string>([
    capWords(city.trim()),
    capWords(noDirectional || city),
    capWords(noNeighborhood || city),
  ]);
  return Array.from(uniq);
}

export function buildZillowUrl(args: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}) {
  const address = (args.address ?? "").trim();
  const city    = (args.city ?? "").trim();
  const state   = (args.state ?? "").trim().toUpperCase();
  const zip     = (args.zip ?? "").trim();
  if (!address || !city || !state || !zip) return null;

  const addr = abbrevStreetSuffix(stripUnit(address));
  const cityVariants = normalizeCityVariants(city);

  // Primary pick: USPS-abbrev address + city with directional/neighborhood terms removed
  const bestCity = cityVariants[1] || cityVariants[0];
  const path = `${toSlug(addr)}-${toSlug(bestCity)}-${toSlug(state)}-${toSlug(zip)}_rb/`;
  return `https://www.zillow.com/homes/${path}`;
}

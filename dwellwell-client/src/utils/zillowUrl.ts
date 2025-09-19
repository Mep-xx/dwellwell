// dwellwell-client/src/utils/zillowUrl.ts

/**
 * Robust Zillow URL builder (default).
 * Generates: https://www.zillow.com/homes/<encoded full address>_rb/
 *
 * This format behaves like a search query and is far less brittle than
 * handcrafted slugs that try to mimic Zillow’s canonical paths.
 */

export type ZillowAddress = {
  address?: string | null;
  apartment?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

/** --- Helpers you already had (kept here for optional "pretty" mode) --- */

export function toSlug(x: string) {
  return (x || "").trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

const STREET_ABBREV: Record<string, string> = {
  street: "St", avenue: "Ave", road: "Rd", drive: "Dr", lane: "Ln",
  court: "Ct", circle: "Cir", boulevard: "Blvd", place: "Pl", terrace: "Ter",
  highway: "Hwy", parkway: "Pkwy", way: "Way", trail: "Trl",
  square: "Sq", commons: "Cmns",
};

const CITY_DIR_WORDS = new Set(["north","south","east","west","n","s","e","w","nw","ne","sw","se"]);
const CITY_NEIGHBORHOODS = new Set(["center","village","heights","landing","falls"]);

function stripUnit(address: string) {
  // remove trailing unit tokens like "Apt 3B", "Unit #2", "Suite 10"
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

/** Pretty (brittle) slug builder, exposed for optional use. */
export function buildZillowPrettySlug(args: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): string | null {
  const address = (args.address ?? "").trim();
  const city    = (args.city ?? "").trim();
  const state   = (args.state ?? "").trim().toUpperCase();
  const zip     = (args.zip ?? "").trim();
  if (!address || !city || !state || !zip) return null;

  const addr = abbrevStreetSuffix(stripUnit(address));
  const cityVariants = normalizeCityVariants(city);
  const bestCity = cityVariants[1] || cityVariants[0];

  const path = `${toSlug(addr)}-${toSlug(bestCity)}-${toSlug(state)}-${toSlug(zip)}_rb/`;
  return `https://www.zillow.com/homes/${path}`;
}

/** Robust builder (default export). */
export function buildZillowUrl(input: ZillowAddress): string | null {
  const address = (input.address ?? "").trim();
  const apartment = (input.apartment ?? "").trim();
  const city = (input.city ?? "").trim();
  const state = (input.state ?? "").trim();
  const zip = (input.zip ?? "").trim();

  if (!address || !city || !state || !zip) return null;

  // Keep unit in the query string — Zillow usually ignores it, but it won’t hurt.
  const line1 = [address, apartment].filter(Boolean).join(" ");
  const query = `${line1}, ${city}, ${state} ${zip}`.replace(/\s+/g, " ").trim();

  // Example: https://www.zillow.com/homes/123%20Main%20St,%20Austin,%20TX%2078701_rb/
  const encoded = encodeURIComponent(query);
  return `https://www.zillow.com/homes/${encoded}_rb/`;
}
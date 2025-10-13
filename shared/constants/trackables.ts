// shared/constants/trackables.ts

// ---------------------------------------------------------------------------
// Categories (labels shown to users)
// ---------------------------------------------------------------------------
export const CATEGORY_OPTIONS = [
  { value: "appliance", label: "Appliance" },
  { value: "hvac", label: "HVAC" },
  { value: "water", label: "Water / Plumbing" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "heating", label: "Heating" },
  { value: "cooling", label: "Cooling" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "outdoor", label: "Outdoor" },
  { value: "safety", label: "Safety" },
  { value: "general", label: "General" },
  { value: "electronics", label: "Electronics" },
  { value: "computing", label: "Computing" },
  { value: "entertainment", label: "Entertainment" },
  { value: "lighting", label: "Lighting" },
  { value: "cleaning", label: "Cleaning" },
  { value: "tools", label: "Tools" },
  { value: "furniture", label: "Furniture" },
] as const;

export type CategoryValue = typeof CATEGORY_OPTIONS[number]["value"];

// ---------------------------------------------------------------------------
// Types per category (values are the canonical keys sent to/returned from API)
// ---------------------------------------------------------------------------
export const TYPE_BY_CATEGORY: Record<string, { value: string; label: string }[]> = {
  appliance: [
    { value: "dishwasher", label: "Dishwasher" },
    { value: "refrigerator", label: "Refrigerator" },          
    { value: "range-oven", label: "Range / Oven" },
    { value: "microwave", label: "Microwave" },
    { value: "washer", label: "Washer" },
    { value: "dryer", label: "Dryer" },
    { value: "water-heater", label: "Water Heater" },
    { value: "water-softener", label: "Water Softener" },
    { value: "dehumidifier", label: "Dehumidifier" },
    { value: "air-purifier", label: "Air Purifier" },
    { value: "garbage-disposal", label: "Garbage Disposal" },
    { value: "range-hood", label: "Range Hood" },
  ],
  hvac: [
    { value: "furnace", label: "Furnace" },
    { value: "boiler", label: "Boiler" },
    { value: "central-ac", label: "Central A/C" },
    { value: "heat-pump", label: "Heat Pump" },
    { value: "mini-split", label: "Mini Split" },
    { value: "window-ac", label: "Window A/C" },
    { value: "portable-ac", label: "Portable A/C" },
    { value: "dehumidifier", label: "Dehumidifier" },
    { value: "humidifier", label: "Humidifier" },
    { value: "air-purifier", label: "Air Purifier" },
    { value: "radiant-heat", label: "Radiant Heat" },
    { value: "thermostat", label: "Thermostat" },
  ],
  kitchen: [
    { value: "coffee-maker", label: "Coffee Maker" },
    { value: "espresso-machine", label: "Espresso Machine" },
    { value: "kettle", label: "Kettle" },
    { value: "toaster", label: "Toaster" },
    { value: "blender", label: "Blender" },
    { value: "garbage-disposal", label: "Garbage Disposal" },
    { value: "range-hood", label: "Range Hood" },
    { value: "sink-faucet", label: "Sink / Faucet" },
    { value: "countertop", label: "Countertop" },
    { value: "cabinetry", label: "Cabinetry" },
  ],
  bathroom: [
    { value: "toilet", label: "Toilet" },
    { value: "shower-tub", label: "Shower / Tub" },
    { value: "bath-faucet", label: "Sink / Faucet" },
    { value: "exhaust-fan", label: "Exhaust Fan" },
    { value: "vanity", label: "Vanity / Cabinet" },
  ],
  heating: [
    { value: "furnace", label: "Furnace" },
    { value: "boiler", label: "Boiler" },
    { value: "space-heater", label: "Space Heater" },
    { value: "radiant-heat", label: "Radiant Heat" },
    { value: "fireplace", label: "Fireplace" },
  ],
  cooling: [
    { value: "central-ac", label: "Central A/C" },
    { value: "heat-pump", label: "Heat Pump" },
    { value: "mini-split", label: "Mini Split" },
    { value: "window-ac", label: "Window A/C" },
    { value: "portable-ac", label: "Portable A/C" },
    { value: "dehumidifier", label: "Dehumidifier" },
    { value: "humidifier", label: "Humidifier" },
    { value: "air-purifier", label: "Air Purifier" },
  ],
  plumbing: [
    { value: "main-shutoff", label: "Main Shutoff Valve" },
    { value: "sump-pump", label: "Sump Pump" },
    { value: "well-pump", label: "Well Pump" },
    { value: "septic", label: "Septic System" },
    { value: "water-filter", label: "Water Filter" },
  ],
  electrical: [
    { value: "panel", label: "Electrical Panel" },
    { value: "generator", label: "Generator" },
    { value: "smoke-co", label: "Smoke/CO Detector" },
    { value: "outlets-switches", label: "Outlets / Switches" },
    { value: "doorbell", label: "Doorbell" },
    { value: "thermostat", label: "Thermostat" },
    { value: "ceiling-fan", label: "Ceiling Fan" },
  ],
  outdoor: [
    { value: "lawn-mower", label: "Lawn Mower" },
    { value: "sprinkler-system", label: "Sprinkler System" },
    { value: "grill", label: "Grill" },
    { value: "deck-patio", label: "Deck / Patio" },
    { value: "fence-gate", label: "Fence / Gate" },
    { value: "snow-blower", label: "Snow Blower" },
    { value: "pressure-washer", label: "Pressure Washer" },
  ],
  safety: [
    { value: "fire-extinguisher", label: "Fire Extinguisher" },
    { value: "alarm-system", label: "Alarm / Security System" },
    { value: "radon-system", label: "Radon Mitigation" },
    { value: "first-aid", label: "First Aid Kit" },
  ],
  general: [
    { value: "tool", label: "Tool" },
    { value: "window", label: "Window" },
    { value: "door", label: "Door" },
    { value: "flooring", label: "Flooring" },
    { value: "paint", label: "Paint / Finish" },
    { value: "other", label: "Other" },
  ],
  electronics: [
    { value: "smart-speaker", label: "Smart Speaker" },
    { value: "router", label: "Router" },
    { value: "modem", label: "Modem" },
    { value: "camera", label: "Camera" },
    { value: "drone", label: "Drone" },
    { value: "e-reader", label: "E-Reader" },
    { value: "smart-display", label: "Smart Display" },
  ],
  computing: [
    { value: "laptop", label: "Laptop" },
    { value: "desktop", label: "Desktop" },
    { value: "tablet", label: "Tablet" },
    { value: "printer", label: "Printer" },
    { value: "nas", label: "NAS" },
    { value: "ups", label: "UPS" },
  ],
  entertainment: [
    { value: "television", label: "Television" },
    { value: "projector", label: "Projector" },
    { value: "soundbar", label: "Soundbar" },
    { value: "av-receiver", label: "AV Receiver" },
    { value: "game-console", label: "Game Console" },
    { value: "streaming-device", label: "Streaming Device" },
  ],
  lighting: [
    { value: "light-fixture", label: "Light Fixture" },
    { value: "smart-bulb", label: "Smart Bulb" },
    { value: "lamp", label: "Lamp" },
  ],
  cleaning: [
    { value: "vacuum", label: "Vacuum" },
    { value: "robot-vacuum", label: "Robot Vacuum" },
    { value: "steam-cleaner", label: "Steam Cleaner" },
    { value: "carpet-cleaner", label: "Carpet Cleaner" },
  ],
  tools: [
    { value: "drill", label: "Drill" },
    { value: "saw", label: "Saw" },
    { value: "multitool", label: "Multi-tool" },
    { value: "air-compressor", label: "Air Compressor" },
    { value: "toolbox", label: "Toolbox" },
  ],
  furniture: [
    { value: "desk", label: "Desk" },
    { value: "chair", label: "Chair" },
    { value: "sofa", label: "Sofa" },
    { value: "bed", label: "Bed" },
    { value: "shelving", label: "Shelving" },
  ],
  water: [
    { value: "water-heater", label: "Water Heater" },
    { value: "water-softener", label: "Water Softener" },
    { value: "main-shutoff", label: "Main Shutoff Valve" },
    { value: "sump-pump", label: "Sump Pump" },
    { value: "well-pump", label: "Well Pump" },
    { value: "septic", label: "Septic System" },
    { value: "water-filter", label: "Water Filter" },
  ],
};

export function getTypeOptions(category: string | null | undefined) {
  return TYPE_BY_CATEGORY[String(category || "general")] ?? [];
}

// ---------------------------------------------------------------------------
// Helpers: pretty labels + robust normalization of AI/free-text input
// ---------------------------------------------------------------------------
const ALL_TYPES: { value: string; label: string }[] = Object.values(TYPE_BY_CATEGORY).flat();
const TYPE_LABEL_BY_VALUE = new Map(ALL_TYPES.map((t) => [t.value, t.label]));

export function getTypeLabel(value?: string | null) {
  if (!value) return undefined;
  return TYPE_LABEL_BY_VALUE.get(value) ?? capitalizeWords(value.replace(/[-_]/g, " "));
}

const CANONICAL_CATEGORY = new Set(CATEGORY_OPTIONS.map((c) => c.value));

export function normalizeCategory(input?: string | null): CategoryValue | "general" {
  if (!input) return "general";
  const s = input.toLowerCase();
  // a few common aliases from AI
  if (s === "hvac") return "hvac";
  if (s === "water" || s.includes("plumb")) return "water";
  if (CANONICAL_CATEGORY.has(s as CategoryValue)) return s as CategoryValue;
  return "general";
}

/** Normalize type to one of the canonical keys we use. Corrects common misspellings. */
export function normalizeType(input?: string | null): string {
  if (!input) return "";
  let s = input.toLowerCase().trim();

  // Fix the big one you saw:
  if (s.includes("refridg")) s = "refrigerator";

  // Try direct match on canonical values.
  if (ALL_TYPES.some((t) => t.value === s)) return s;

  // Try match on labels.
  const byLabel = ALL_TYPES.find((t) => t.label.toLowerCase() === s);
  if (byLabel) return byLabel.value;

  // Try loose match (remove punctuation / spaces)
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  const sN = norm(s);
  const loose = ALL_TYPES.find((t) => norm(t.label) === sN || norm(t.value) === sN);
  if (loose) return loose.value;

  return s; // fall back to user input; UI will still pretty-print it
}

function capitalizeWords(s: string) {
  return s.replace(/\b\w+/g, (w) => w[0].toUpperCase() + w.slice(1));
}

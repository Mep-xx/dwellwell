//shared/constants/homeOptions.ts
export const BOILER_TYPES = [
  "None",
  "Steam",
  "Hot Water",
  "Combi",
  "Electric",
  "Forced Air Furnace",
  "Heat Pump",
  "Other",
] as const;

export const ROOF_TYPES = [
  "Asphalt Shingle",
  "Metal",
  "Tile",
  "Slate",
  "Wood Shake",
  "Rubber (EPDM)",
  "TPO",
  "Other",
] as const;

export const SIDING_TYPES = [
  "Vinyl",
  "Wood",
  "Fiber Cement",
  "Brick",
  "Stone",
  "Stucco",
  "Aluminum",
  "Other",
] as const;

export const FEATURE_SUGGESTIONS = [
  "Fireplace",
  "Hardwood Floors",
  "Fenced Yard",
  "Deck/Patio",
  "Central Air",
  "Granite Counters",
  "Stainless Appliances",
  "Solar Panels",
  "Irrigation System",
  "Workshop",
  "EV Charger",
] as const;

export type BoilerType = (typeof BOILER_TYPES)[number];
export type RoofType = (typeof ROOF_TYPES)[number];
export type SidingType = (typeof SIDING_TYPES)[number];

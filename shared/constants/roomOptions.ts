// shared/constants/roomOptions.ts
// Friendly, human-readable option sets for RoomDetail fields.
// Keep values aligned with Prisma enums. Use labels for UI.

// ---------------- Surfaces ----------------

export const FLOORING_TYPES = [
  { value: "carpet",   label: "Carpet",     icon: "🧶" },
  { value: "hardwood", label: "Hardwood",   icon: "🪵" },
  { value: "laminate", label: "Laminate",   icon: "🪑" },
  { value: "tile",     label: "Tile",       icon: "🧱" },
  { value: "vinyl",    label: "Vinyl",      icon: "🎞️" },
  { value: "stone",    label: "Stone",      icon: "🪨" },
  { value: "concrete", label: "Concrete",   icon: "🧩" },
  { value: "other",    label: "Other",      icon: "❓" },
] as const;

export const WALL_FINISHES = [
  { value: "painted_drywall", label: "Painted Drywall", icon: "🎨" },
  { value: "wallpaper",       label: "Wallpaper",       icon: "🧻" },
  { value: "wood_paneling",   label: "Wood Paneling",   icon: "🪵" },
  { value: "plaster",         label: "Plaster",         icon: "🧱" },
  { value: "other",           label: "Other",           icon: "❓" },
] as const;

export const CEILING_TYPES = [
  { value: "drywall",        label: "Drywall",        icon: "🧱" },
  { value: "drop_ceiling",   label: "Drop Ceiling",   icon: "🧩" },
  { value: "exposed_beams",  label: "Exposed Beams",  icon: "🪵" },
  { value: "skylight",       label: "Skylight",       icon: "🌤️" },
  { value: "other",          label: "Other",          icon: "❓" },
] as const;

// ---------------- Openings ----------------

export const WINDOW_TYPES = [
  { value: "none",        label: "None",          icon: "🚫" },
  { value: "single_hung", label: "Single-hung",   icon: "🪟" },
  { value: "double_hung", label: "Double-hung",   icon: "🪟" },
  { value: "casement",    label: "Casement",      icon: "🪟" },
  { value: "awning",      label: "Awning",        icon: "🪟" },
  { value: "bay",         label: "Bay",           icon: "🪟" },
  { value: "slider",      label: "Slider",        icon: "🪟" },
  { value: "fixed",       label: "Fixed",         icon: "🪟" },
  { value: "skylight",    label: "Skylight",      icon: "🌤️" },
  { value: "other",       label: "Other",         icon: "❓" },
] as const;

// ---------------- Lighting ----------------

export const CEILING_FIXTURES = [
  { value: "none",            label: "None",               icon: "🚫" },
  { value: "flushmount",      label: "Flush Mount",        icon: "💡" },
  { value: "chandelier",      label: "Chandelier",         icon: "🕯️" },
  { value: "fan_only",        label: "Ceiling Fan (No Light)", icon: "🌀" },
  { value: "fan_with_light",  label: "Ceiling Fan + Light",    icon: "🌀💡" },
  { value: "recessed",        label: "Recessed",           icon: "🕳️" },
  { value: "track",           label: "Track",              icon: "📏" },
  { value: "mixed",           label: "Mixed",              icon: "🧩" },
] as const;

// ---------------- Types ----------------

export type FlooringType    = (typeof FLOORING_TYPES)[number]["value"];
export type WallFinish      = (typeof WALL_FINISHES)[number]["value"];
export type CeilingType     = (typeof CEILING_TYPES)[number]["value"];
export type WindowType      = (typeof WINDOW_TYPES)[number]["value"];
export type CeilingFixture  = (typeof CEILING_FIXTURES)[number]["value"];

// ---------------- Helpers ----------------

/** Alphabetize by label for consistent UX (without mutating the source). */
export function sortByLabel<T extends { label: string }>(arr: readonly T[]): T[] {
  return [...arr].sort((a, b) => a.label.localeCompare(b.label));
}

/** Quick map for value -> label lookups */
export function buildLabelMap<T extends { value: string; label: string }>(arr: readonly T[]) {
  return Object.fromEntries(arr.map(o => [o.value, o.label])) as Record<string, string>;
}

export const FLOORING_LABELS       = buildLabelMap(FLOORING_TYPES);
export const WALL_FINISH_LABELS    = buildLabelMap(WALL_FINISHES);
export const CEILING_TYPE_LABELS   = buildLabelMap(CEILING_TYPES);
export const WINDOW_TYPE_LABELS    = buildLabelMap(WINDOW_TYPES);
export const CEILING_FIXTURE_LABELS= buildLabelMap(CEILING_FIXTURES);

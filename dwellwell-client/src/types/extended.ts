// dwellwell-client/src/types/extended.ts
import type { Home } from "@shared/types/home";

/**
 * Client-side extension of Home to include meta fields we use in the UI.
 * (We keep this local so we don't have to change your shared schema right now.)
 */
export type HomeMetaExtras = {
  features?: string[];               // e.g., ["Deck", "Fireplace"]
  hasCentralAir?: boolean;
  hasBaseboard?: boolean;
  hasHeatPump?: boolean;
  boilerType?: string | null;
  roofType?: string | null;
  sidingType?: string | null;
  architecturalStyle?: string | null;
};

export type HomeWithMeta = Home & HomeMetaExtras;

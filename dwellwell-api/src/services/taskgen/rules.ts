//dwellwell-api/src/services/taskgen/rules.ts
import type { TaskCriticality, TaskType } from "@prisma/client";

/**
 * Lightweight rule schema:
 * - key: unique key for the template + dedupe.
 * - when: predicate receives a data bag (home/room/detail/trackable).
 * - template: TaskTemplate fields to ensure (or update).
 * - toUserTask: derives instance fields that are dynamic per user/context.
 */

export type RuleContext = {
  home?: any;
  room?: any & { detail?: any | null };
  trackable?: any;
};

export type TemplateSeed = {
  title: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  category?: string;
  recurrenceInterval: string; // e.g., "monthly", "2 months", "weekly", "yearly"
  taskType?: TaskType;        // default GENERAL
  criticality?: TaskCriticality; // default "medium"
  canDefer?: boolean;
  deferLimitDays?: number;
  estimatedTimeMinutes?: number;
  estimatedCost?: number;
  canBeOutsourced?: boolean;
  steps?: string[];
  equipmentNeeded?: string[];
  resources?: any; // Json
};

export type Rule = {
  key: string; // machine key: determines template identity AND user-task dedupe
  scope: "home" | "room" | "trackable";
  when: (ctx: RuleContext) => boolean;
  template: TemplateSeed;
  toUserTask?: (ctx: RuleContext) => Partial<{
    title: string; description: string; itemName: string; location: string;
  }>;
};

/** -------- HOME RULES (example: roof / gutters) -------- */
export const homeRules: Rule[] = [
  {
    key: "home_roof_inspect_semiannual",
    scope: "home",
    when: ({ home }) => !!home?.roofType,
    template: {
      title: "Inspect roof & flashings",
      description: "Walk the perimeter, scan for damage, and check flashing & vents.",
      category: "Exterior",
      icon: "🏠",
      recurrenceInterval: "6 months",
      criticality: "medium",
      estimatedTimeMinutes: 30,
      steps: ["Walk perimeter", "Inspect shingles/metal", "Check flashing & vents"],
    },
    toUserTask: ({ home }) => ({
      location: home?.address ?? "",
    }),
  },
  {
    key: "home_clean_gutters_quarterly",
    scope: "home",
    when: ({ home }) => (home?.features || []).includes("gutters") || home?.roofType != null,
    template: {
      title: "Clean gutters",
      description: "Remove debris and flush downspouts.",
      category: "Exterior",
      icon: "🧹",
      recurrenceInterval: "3 months",
      criticality: "medium",
      estimatedTimeMinutes: 45,
      steps: ["Scoop debris", "Flush downspouts"],
    },
  },
];

/** -------- ROOM RULES (examples: bedroom basics, flooring: carpet) -------- */
export const roomRules: Rule[] = [
  {
    key: "room_bedroom_rotate_mattress_quarterly",
    scope: "room",
    when: ({ room }) => (room?.type || "").toLowerCase() === "bedroom",
    template: {
      title: "Rotate mattress",
      description: "Rotate 180° to distribute wear.",
      category: "Bedroom",
      icon: "🛏️",
      recurrenceInterval: "3 months",
      criticality: "low",
      estimatedTimeMinutes: 10,
      steps: ["Strip bed", "Rotate 180°", "Remake bed"],
    },
  },
  {
    key: "room_flooring_carpet_vacuum_weekly",
    scope: "room",
    when: ({ room }) => (room?.detail?.flooring || "").toLowerCase() === "carpet",
    template: {
      title: "Vacuum carpet",
      description: "Quick vacuum pass to reduce dust and wear.",
      category: "Flooring",
      icon: "🧽",
      recurrenceInterval: "weekly",
      criticality: "low",
      estimatedTimeMinutes: 15,
    },
  },
];

/** -------- TRACKABLE RULES (generic; e.g., dishwasher) -------- */
export const trackableRules: Rule[] = [
  {
    key: "trackable_dishwasher_clean_cycle_monthly",
    scope: "trackable",
    when: ({ trackable }) => (trackable?.kind || trackable?.type || "").toLowerCase() === "dishwasher",
    template: {
      title: "Run dishwasher cleaning cycle",
      description: "Use a dishwasher cleaner on a hot cycle to remove buildup.",
      category: "Kitchen",
      icon: "🍽️",
      recurrenceInterval: "monthly",
      criticality: "medium",
      estimatedTimeMinutes: 5,
      steps: ["Empty dishwasher", "Place cleaner per instructions", "Run hottest cleaning/clean cycle"],
    },
    toUserTask: ({ trackable }) => ({ itemName: trackable?.userDefinedName ?? "Dishwasher" }),
  },
  {
    key: "trackable_dishwasher_clean_filter_bimonthly",
    scope: "trackable",
    when: ({ trackable }) => (trackable?.kind || trackable?.type || "").toLowerCase() === "dishwasher",
    template: {
      title: "Clean dishwasher filter",
      description: "Remove, rinse, and reinstall the filter.",
      category: "Kitchen",
      icon: "🧼",
      recurrenceInterval: "2 months",
      criticality: "medium",
      estimatedTimeMinutes: 10,
      steps: ["Remove lower rack and filter", "Rinse and brush debris", "Reinstall securely"],
    },
    toUserTask: ({ trackable }) => ({ itemName: trackable?.userDefinedName ?? "Dishwasher" }),
  },
];

/** -------- MODEL-SPECIFIC EXAMPLES (post-enrichment) -------- */
export const trackableModelRules: Rule[] = [
  {
    key: "trackable_bosch_shxm78z55n_replace_ultrafine_filter_semiannual",
    scope: "trackable",
    when: ({ trackable }) =>
      (trackable?.kind || trackable?.type || "").toLowerCase() === "dishwasher" &&
      (trackable?.brand || "").toLowerCase() === "bosch" &&
      (trackable?.model || "").toUpperCase() === "SHXM78Z55N",
    template: {
      title: "Replace Bosch UltraFine filter",
      description: "For Bosch SHXM78Z55N; replace every 6 months (OEM part).",
      category: "Kitchen",
      icon: "🧩",
      recurrenceInterval: "6 months",
      criticality: "medium",
      estimatedTimeMinutes: 15,
      steps: ["Remove filter assembly", "Swap UltraFine element (OEM)", "Reinstall, test run"],
    },
    toUserTask: ({ trackable }) => ({ itemName: trackable?.userDefinedName ?? "Dishwasher" }),
  },
];

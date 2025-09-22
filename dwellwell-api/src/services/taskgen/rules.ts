// dwellwell-api/src/services/taskgen/rules.ts
import type { TaskCriticality, TaskType } from "@prisma/client";

/**
 * What a template “seed” looks like. These get persisted/updated in TaskTemplate.
 */
export type TemplateSeed = {
  title: string;
  description?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  recurrenceInterval: string; // e.g., "7 days", "1 month", "3 months", "6 months", "1 year"
  taskType?: TaskType | "GENERAL";
  criticality?: TaskCriticality | "low" | "medium" | "high";

  canDefer?: boolean;
  deferLimitDays?: number;
  estimatedTimeMinutes?: number;
  estimatedCost?: number;
  canBeOutsourced?: boolean;

  steps?: string[];
  equipmentNeeded?: string[];
  resources?: any;
};

/**
 * Context available to a rule.
 */
export type RuleContext = {
  home?: {
    id: string;
    userId: string;
    hasCentralAir?: boolean | null;
    hasHeatPump?: boolean | null;
    hasBaseboard?: boolean | null;
    roofType?: string | null;
    sidingType?: string | null;
    architecturalStyle?: string | null;
  };
  room?: {
    id: string;
    name: string;
    type: string;
    detail?: {
      hasSmokeDetector?: boolean | null;
      hasCoDetector?: boolean | null;
      hasCeilingFan?: boolean | null;
      recessedLightCount?: number | null;
      hasGfci?: boolean | null;
    } | null;
  };
  trackable?: {
    id: string;
    brand?: string | null;
    model?: string | null;
    kind?: string | null;
    category?: string | null;
  } | null;
};

export type Rule = {
  key: string;
  scope: "home" | "room" | "trackable";
  template: TemplateSeed;
  when: (ctx: RuleContext) => boolean;
  toUserTask?: (ctx: RuleContext) => Partial<{
    title: string;
    description: string;
    itemName: string;
    location: string | null;
  }>;
};

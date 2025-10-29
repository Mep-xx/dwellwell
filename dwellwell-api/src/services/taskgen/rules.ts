// Avoid Prisma.$Enums here; keep it portable via string unions.
export type TemplateSeed = {
  title: string;
  description?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  recurrenceInterval: string;
  taskType?: "GENERAL" | string;
  criticality?: "low" | "medium" | "high" | string;

  canDefer?: boolean;
  deferLimitDays?: number;
  estimatedTimeMinutes?: number;
  estimatedCost?: number;
  canBeOutsourced?: boolean;

  steps?: string[];
  equipmentNeeded?: string[];
  resources?: any;
};

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

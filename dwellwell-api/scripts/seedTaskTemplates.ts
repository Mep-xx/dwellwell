/* scripts/seedTaskTemplates.ts
   Seed a broad library of TaskTemplates + generic ApplianceCatalog links.

   Run:
     npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seedTaskTemplates.ts
   or add to package.json:
     "scripts": { "seed:templates": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' scripts/seedTaskTemplates.ts" }
*/

import { PrismaClient, TaskType, TaskCriticality, TemplateState } from "@prisma/client";
const prisma = new PrismaClient();

/** Light-weight template type (mirrors a subset of TaskTemplate) */
type Seed = {
  key: string;                         // stable unique-ish key for idempotence
  title: string;
  description?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  recurrenceInterval: string;          // e.g., "1 month", "6 months", "1 year", "seasonal"
  taskType?: TaskType;                 // default GENERAL
  criticality?: TaskCriticality;       // default medium
  canDefer?: boolean;                  // default true
  deferLimitDays?: number;             // default 0
  estimatedTimeMinutes?: number;       // default 30
  estimatedCost?: number;              // default 0
  canBeOutsourced?: boolean;           // default false
  steps?: string[];
  equipmentNeeded?: string[];
  resources?: any;
};

async function ensureTemplate(s: Seed) {
  const existing = await prisma.taskTemplate.findFirst({
    where: {
      title: s.title,
      category: s.category ?? null,
      recurrenceInterval: s.recurrenceInterval,
    },
  });

  if (existing) {
    // light-touch update – only fill if empty so admin edits persist
    return prisma.taskTemplate.update({
      where: { id: existing.id },
      data: {
        description: existing.description ?? s.description ?? undefined,
        icon: existing.icon ?? s.icon ?? undefined,
        imageUrl: existing.imageUrl ?? s.imageUrl ?? undefined,
        taskType: existing.taskType ?? s.taskType ?? "GENERAL",
        criticality: existing.criticality ?? s.criticality ?? "medium",
        canDefer: existing.canDefer ?? (s.canDefer ?? true),
        deferLimitDays: existing.deferLimitDays ?? (s.deferLimitDays ?? 0),
        estimatedTimeMinutes: existing.estimatedTimeMinutes ?? (s.estimatedTimeMinutes ?? 30),
        estimatedCost: existing.estimatedCost ?? (s.estimatedCost ?? 0),
        canBeOutsourced: existing.canBeOutsourced ?? (s.canBeOutsourced ?? false),
        steps: (existing.steps?.length ? existing.steps : (s.steps ?? [])) as any,
        equipmentNeeded: (existing.equipmentNeeded?.length ? existing.equipmentNeeded : (s.equipmentNeeded ?? [])) as any,
        resources: (existing as any).resources ?? s.resources ?? undefined,
        state: existing.state ?? TemplateState.VERIFIED,
        changelog: existing.changelog ?? `system-key:${s.key}`,
      },
    });
  }

  return prisma.taskTemplate.create({
    data: {
      title: s.title,
      description: s.description ?? null,
      icon: s.icon ?? null,
      imageUrl: s.imageUrl ?? null,
      category: s.category ?? null,
      recurrenceInterval: s.recurrenceInterval,
      taskType: s.taskType ?? "GENERAL",
      criticality: s.criticality ?? "medium",
      canDefer: s.canDefer ?? true,
      deferLimitDays: s.deferLimitDays ?? 0,
      estimatedTimeMinutes: s.estimatedTimeMinutes ?? 30,
      estimatedCost: s.estimatedCost ?? 0,
      canBeOutsourced: s.canBeOutsourced ?? false,
      steps: (s.steps ?? []) as any,
      equipmentNeeded: (s.equipmentNeeded ?? []) as any,
      resources: s.resources ?? undefined,
      version: 1,
      state: "VERIFIED",
      changelog: `system-key:${s.key}`,
    },
  });
}

/** ———————————————————————————————————————— */
/** Template library (add as many as you like) */
/** ———————————————————————————————————————— */

const HOME_EXTERIOR: Seed[] = [
  {
    key: "home_clean_gutters_quarterly",
    title: "Clean gutters",
    description: "Remove debris and flush downspouts.",
    icon: "🧹",
    category: "Exterior",
    recurrenceInterval: "3 months",
    criticality: "medium",
    estimatedTimeMinutes: 45,
    steps: ["Scoop debris", "Flush downspouts"],
  },
  {
    key: "home_roof_inspect_semiannual",
    title: "Inspect roof & flashings",
    description: "Walk the perimeter, scan for damage, and check flashing & vents.",
    icon: "🏠",
    category: "Exterior",
    recurrenceInterval: "6 months",
    criticality: "medium",
    estimatedTimeMinutes: 30,
    steps: ["Walk perimeter", "Inspect shingles/metal", "Check flashing & vents"],
  },
  {
    key: "home_foundation_walk_quarterly",
    title: "Check foundation & grading",
    description: "Look for cracks, standing water, and negative grading toward the house.",
    icon: "🧱",
    category: "Exterior",
    recurrenceInterval: "3 months",
    criticality: "medium",
    estimatedTimeMinutes: 20,
  },
  {
    key: "home_ext_caulk_annual",
    title: "Inspect exterior caulk & sealants",
    description: "Check around windows/doors and siding joints; touch up as needed.",
    icon: "🧴",
    category: "Exterior",
    recurrenceInterval: "1 year",
    criticality: "medium",
    estimatedTimeMinutes: 60,
  },
  {
    key: "home_downspout_extenders_annual",
    title: "Verify downspout extensions",
    description: "Ensure runoff is directed 6+ feet from the foundation.",
    icon: "💧",
    category: "Exterior",
    recurrenceInterval: "1 year",
    criticality: "high",
    estimatedTimeMinutes: 10,
  },
];

const SAFETY: Seed[] = [
  {
    key: "safety_test_smoke_detectors_monthly",
    title: "Test smoke detectors",
    icon: "🚨",
    category: "Safety",
    recurrenceInterval: "1 month",
    criticality: "high",
    estimatedTimeMinutes: 10,
  },
  {
    key: "safety_replace_detector_batteries_semiannual",
    title: "Replace detector batteries",
    icon: "🔋",
    category: "Safety",
    recurrenceInterval: "6 months",
    criticality: "high",
    estimatedTimeMinutes: 15,
  },
  {
    key: "safety_check_fire_extinguishers_quarterly",
    title: "Check fire extinguishers",
    icon: "🧯",
    category: "Safety",
    recurrenceInterval: "3 months",
    criticality: "high",
    estimatedTimeMinutes: 5,
  },
];

const SEASONAL: Seed[] = [
  {
    key: "seasonal_winterize_outdoor_faucets_annual",
    title: "Winterize outdoor faucets",
    icon: "❄️",
    category: "Seasonal",
    recurrenceInterval: "1 year",
    criticality: "high",
    estimatedTimeMinutes: 20,
    steps: ["Close interior shutoffs", "Open exterior faucets", "Attach covers if available"],
  },
  {
    key: "seasonal_hvac_filter_seasonal",
    title: "Replace HVAC filter",
    icon: "🪭",
    category: "HVAC",
    recurrenceInterval: "3 months",
    criticality: "high",
    estimatedTimeMinutes: 10,
  },
  {
    key: "seasonal_dryervent_clean_annual",
    title: "Deep-clean dryer vent",
    icon: "🌬️",
    category: "Laundry",
    recurrenceInterval: "1 year",
    criticality: "high",
    estimatedTimeMinutes: 45,
  },
];

const LAWN_GARDEN: Seed[] = [
  {
    key: "lawn_mow_weekly",
    title: "Mow lawn",
    icon: "🌱",
    category: "Lawn",
    recurrenceInterval: "1 week",
    criticality: "medium",
    estimatedTimeMinutes: 45,
  },
  {
    key: "lawn_grub_control_annual",
    title: "Apply grub control",
    icon: "🐛",
    category: "Lawn",
    recurrenceInterval: "1 year",
    criticality: "high",
    estimatedTimeMinutes: 30,
  },
  {
    key: "lawn_fertilize_seasonal",
    title: "Fertilize lawn",
    icon: "🧪",
    category: "Lawn",
    recurrenceInterval: "3 months",
    criticality: "medium",
    estimatedTimeMinutes: 30,
  },
];

const ROOMS_BEDROOM: Seed[] = [
  {
    key: "room_bedroom_rotate_mattress_quarterly",
    title: "Rotate mattress",
    icon: "🛏️",
    category: "Bedroom",
    recurrenceInterval: "3 months",
    criticality: "low",
    estimatedTimeMinutes: 10,
    description: "Rotate 180° to distribute wear.",
    steps: ["Strip bed", "Rotate 180°", "Remake bed"],
  },
  {
    key: "room_bedroom_dust_fan_monthly",
    title: "Dust ceiling fan",
    icon: "🧹",
    category: "Bedroom",
    recurrenceInterval: "1 month",
    criticality: "low",
    estimatedTimeMinutes: 10,
  },
];

const ROOMS_BATHROOM: Seed[] = [
  {
    key: "room_bathroom_clean_grout_quarterly",
    title: "Scrub grout & reseal spots",
    icon: "🧼",
    category: "Bathroom",
    recurrenceInterval: "3 months",
    criticality: "medium",
    estimatedTimeMinutes: 45,
  },
  {
    key: "room_bathroom_flush_traps_quarterly",
    title: "Flush rarely used traps",
    icon: "🚰",
    category: "Bathroom",
    recurrenceInterval: "3 months",
    criticality: "low",
    estimatedTimeMinutes: 5,
  },
];

const ROOMS_KITCHEN: Seed[] = [
  {
    key: "room_kitchen_clean_rangehood_quarterly",
    title: "Clean range hood & filter",
    icon: "🫧",
    category: "Kitchen",
    recurrenceInterval: "3 months",
    criticality: "medium",
    estimatedTimeMinutes: 20,
  },
];

const LAUNDRY_ROOM: Seed[] = [
  {
    key: "laundry_washer_tub_clean_monthly",
    title: "Run washer tub clean",
    icon: "🧺",
    category: "Laundry",
    recurrenceInterval: "1 month",
    criticality: "medium",
    estimatedTimeMinutes: 30,
  },
  {
    key: "laundry_dryer_clean_lint_every_use",
    title: "Clean lint trap",
    icon: "🔥",
    category: "Laundry",
    recurrenceInterval: "After Every Use",
    criticality: "high",
    canDefer: false,
    estimatedTimeMinutes: 1,
  },
];

const HOT_TUB: Seed[] = [
  {
    key: "hottub_test_water_weekly",
    title: "Test water chemistry",
    icon: "🧪",
    category: "Home",
    recurrenceInterval: "1 week",
    criticality: "high",
    estimatedTimeMinutes: 5,
  },
  {
    key: "hottub_drain_refill_quad",
    title: "Drain and refill",
    icon: "💧",
    category: "Home",
    recurrenceInterval: "4 months",
    criticality: "high",
    estimatedTimeMinutes: 120,
  },
];

/** Appliance-type templates (used for ApplianceCatalog links) */
const APPLIANCE_TEMPLATES: Record<string, Seed[]> = {
  Dishwasher: [
    {
      key: "appliance_dishwasher_clean_filter_monthly",
      title: "Clean filter",
      description: "Remove and rinse filter to prevent clogs and odors.",
      icon: "🧼",
      category: "Appliances",
      recurrenceInterval: "1 month",
      criticality: "medium",
      estimatedTimeMinutes: 10,
      steps: ["Remove filter", "Rinse thoroughly", "Reinstall"],
    },
    {
      key: "appliance_dishwasher_vinegar_cycle_quarterly",
      title: "Run vinegar cycle",
      description: "Run a hot cycle with white vinegar to remove buildup.",
      icon: "🍋",
      category: "Appliances",
      recurrenceInterval: "3 months",
      criticality: "low",
      estimatedTimeMinutes: 15,
    },
    {
      key: "appliance_dishwasher_inspect_spray_arms_semiannual",
      title: "Inspect spray arms",
      description: "Check for blockages; clean out debris/calcium.",
      icon: "🛠️",
      category: "Appliances",
      recurrenceInterval: "6 months",
      criticality: "medium",
      estimatedTimeMinutes: 10,
    },
  ],
  Refrigerator: [
    {
      key: "appliance_fridge_vacuum_coils_semiannual",
      title: "Vacuum condenser coils",
      description: "Dust reduces efficiency; clean behind/under unit.",
      icon: "🧯",
      category: "Appliances",
      recurrenceInterval: "6 months",
      criticality: "high",
      estimatedTimeMinutes: 15,
    },
    {
      key: "appliance_fridge_clean_gaskets_quarterly",
      title: "Clean door seals",
      description: "Wipe gaskets to maintain proper seal.",
      icon: "🚪",
      category: "Appliances",
      recurrenceInterval: "3 months",
      criticality: "medium",
      estimatedTimeMinutes: 5,
    },
  ],
  Washer: [
    {
      key: "appliance_washer_tub_clean_monthly",
      title: "Run tub clean cycle",
      description: "Run with cleaner or bleach to prevent odors.",
      icon: "🧺",
      category: "Appliances",
      recurrenceInterval: "1 month",
      criticality: "medium",
      estimatedTimeMinutes: 30,
    },
  ],
  Dryer: [
    {
      key: "appliance_dryer_clean_lint_every_use",
      title: "Clean lint trap",
      description: "Remove lint after every load to reduce fire risk.",
      icon: "🔥",
      category: "Appliances",
      recurrenceInterval: "After Every Use",
      criticality: "high",
      canDefer: false,
      estimatedTimeMinutes: 1,
    },
    {
      key: "appliance_dryer_inspect_vent_semiannual",
      title: "Inspect dryer vent",
      description: "Check and clear external vent for blockages.",
      icon: "🌬️",
      category: "Appliances",
      recurrenceInterval: "6 months",
      criticality: "high",
      estimatedTimeMinutes: 15,
      canBeOutsourced: true,
    },
  ],
  Oven: [
    {
      key: "appliance_oven_self_clean_quarterly",
      title: "Run self-clean cycle",
      description: "Use oven's self clean to burn off residue.",
      icon: "🔥",
      category: "Appliances",
      recurrenceInterval: "3 months",
      criticality: "medium",
      estimatedTimeMinutes: 120,
    },
  ],
  Microwave: [
    {
      key: "appliance_microwave_clean_monthly",
      title: "Clean interior",
      description: "Wipe interior with vinegar/water solution.",
      icon: "📡",
      category: "Appliances",
      recurrenceInterval: "1 month",
      criticality: "low",
      estimatedTimeMinutes: 5,
    },
  ],
};

/** ———————————————————————————————————————— */
/** Generic ApplianceCatalog helpers & links          */
/** ———————————————————————————————————————— */

type GenericCatalogSeed = { type: string; brand: string; model: string; category: string };

const GENERIC_CATALOG: GenericCatalogSeed[] = [
  { type: "dishwasher", brand: "Generic", model: "Dishwasher", category: "Appliances" },
  { type: "refrigerator", brand: "Generic", model: "Refrigerator", category: "Appliances" },
  { type: "washer", brand: "Generic", model: "Washer", category: "Appliances" },
  { type: "dryer", brand: "Generic", model: "Dryer", category: "Appliances" },
  { type: "oven", brand: "Generic", model: "Oven", category: "Appliances" },
  { type: "microwave", brand: "Generic", model: "Microwave", category: "Appliances" },
];

async function ensureCatalog(c: GenericCatalogSeed) {
  let row = await prisma.applianceCatalog.findFirst({
    where: { brand: c.brand, model: c.model },
  });
  if (!row) {
    row = await prisma.applianceCatalog.create({
      data: {
        brand: c.brand,
        model: c.model,
        type: c.type,
        category: c.category,
      },
    });
  }
  return row;
}

async function linkTemplatesToCatalog(catalogId: string, templates: string[]) {
  // templates are seeded by `key`; we lookup by (title, category, recurrenceInterval) via changelog suffix
  const tpls = await prisma.taskTemplate.findMany({
    where: {
      changelog: { in: templates.map((k) => `system-key:${k}`) },
      state: "VERIFIED",
    },
  });

  for (const t of tpls) {
    const exists = await prisma.applianceTaskTemplate.findFirst({
      where: { applianceCatalogId: catalogId, taskTemplateId: t.id },
    });
    if (!exists) {
      await prisma.applianceTaskTemplate.create({
        data: { applianceCatalogId: catalogId, taskTemplateId: t.id },
      });
    }
  }
}

/** ———————————————————————————————————————— */
/** Main                                            */
/** ———————————————————————————————————————— */

async function main() {
  const allSeeds: Seed[] = [
    ...HOME_EXTERIOR,
    ...SAFETY,
    ...SEASONAL,
    ...LAWN_GARDEN,
    ...ROOMS_BEDROOM,
    ...ROOMS_BATHROOM,
    ...ROOMS_KITCHEN,
    ...LAUNDRY_ROOM,
    ...HOT_TUB,
    // Flatten appliance template seeds too so they exist regardless of catalog
    ...Object.values(APPLIANCE_TEMPLATES).flat(),
  ];

  console.log(`Seeding ${allSeeds.length} task templates…`);
  const results = [];
  for (const s of allSeeds) {
    const tpl = await ensureTemplate(s);
    results.push(tpl);
  }
  console.log(`Upserted ${results.length} templates.`);

  console.log("Ensuring generic ApplianceCatalog rows + links…");
  for (const c of GENERIC_CATALOG) {
    const cat = await ensureCatalog(c);
    const seedsForType = APPLIANCE_TEMPLATES[
      c.model as keyof typeof APPLIANCE_TEMPLATES
    ] ?? [];
    await linkTemplatesToCatalog(cat.id, seedsForType.map((s) => s.key));
    console.log(`Linked ${seedsForType.length} templates to ${c.brand} ${c.model}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

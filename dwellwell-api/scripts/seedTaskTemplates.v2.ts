// scripts/seedTaskTemplates.v2.ts
// Run:
//   npm run seed:templates
//
// Notes:
// - Idempotent via changelog = `system-key:<key>`
// - Uses YOUR room types (Laundry Room, Library / Study, etc.)

import { PrismaClient, TaskType, TaskCriticality, TemplateState } from "@prisma/client";
import { ROOM_TYPES as APP_ROOM_TYPES } from "../../shared/constants/roomTypes";

const prisma = new PrismaClient();

type Seed = {
  key: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  recurrenceInterval: string;
  taskType?: TaskType;
  criticality?: TaskCriticality;
  canDefer?: boolean;
  deferLimitDays?: number;
  estimatedTimeMinutes?: number;
  estimatedCost?: number;
  canBeOutsourced?: boolean;
  steps?: string[];
  equipmentNeeded?: string[];
  resources?: Record<string, any>;
};

async function ensureTemplate(s: Seed) {
  const existing = await prisma.taskTemplate.findFirst({
    where: { changelog: `system-key:${s.key}` },
  });

  if (existing) {
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

/** ===== Helper bits ===== */

const ROOM_TYPES = APP_ROOM_TYPES;

function keySlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function mkSeed(p: Omit<Seed, "key"> & { key?: string }): Seed {
  const k = p.key ?? `${keySlug(p.category ?? "home")}_${keySlug(p.title)}_${keySlug(p.recurrenceInterval)}`;
  return { key: k, ...p };
}

function roomPattern(
  rooms: string[],
  patternTitle: string,
  base: Omit<Seed, "title" | "category" | "key"> & { titlePrefix?: string }
): Seed[] {
  return rooms.map((r) =>
    mkSeed({
      title: base.titlePrefix ? `${base.titlePrefix} ${patternTitle}` : patternTitle,
      category: r,
      recurrenceInterval: base.recurrenceInterval,
      taskType: base.taskType,
      criticality: base.criticality ?? "low",
      canDefer: base.canDefer,
      deferLimitDays: base.deferLimitDays,
      estimatedTimeMinutes: base.estimatedTimeMinutes ?? 10,
      estimatedCost: base.estimatedCost,
      canBeOutsourced: base.canBeOutsourced,
      steps: base.steps,
      equipmentNeeded: base.equipmentNeeded,
      icon: base.icon ?? "🧹",
      description: base.description,
      resources: base.resources,
    })
  );
}

/** ===== Generators ===== */

function baseRoomHygiene(): Seed[] {
  const common = (title: string, every: string, minutes = 10, icon = "🧹", desc?: string) =>
    roomPattern(ROOM_TYPES, title, { recurrenceInterval: every, estimatedTimeMinutes: minutes, icon, criticality: "low", description: desc });

  return [
    ...common("Dust horizontal surfaces", "1 month"),
    ...common("Vacuum/mop floors", "1 month", 15, "🧽"),
    ...common("Wipe baseboards/trim", "3 months", 15, "🧼"),
    ...common("Clean light switches/plates", "3 months", 5, "🔌"),
    ...common("Inspect for pests or droppings", "1 month", 5, "🐜", "Corners, under sinks, behind furniture."),
    ...common("Check window/door drafts & weatherstripping", "1 year", 10, "🌬️"),
    ...common("Wash interior windows", "6 months", 20, "🪟"),
    ...common("Test outlets with a lamp/phone charger", "1 year", 10, "🔌"),
  ];
}

// Room-specific sets (you can expand any time)
function bathroomSet(): Seed[] {
  const cat = "Bathroom";
  return [
    mkSeed({ category: cat, title: "Descale showerhead", recurrenceInterval: "3 months", icon: "🚿", estimatedTimeMinutes: 15, description: "Soak in vinegar to restore spray." }),
    mkSeed({ category: cat, title: "Deep-clean grout", recurrenceInterval: "6 months", icon: "🧽", estimatedTimeMinutes: 45 }),
    mkSeed({ category: cat, title: "Replace shower curtain liner", recurrenceInterval: "3 months", icon: "🧴", estimatedTimeMinutes: 10 }),
    mkSeed({ category: cat, title: "Clean sink P-trap", recurrenceInterval: "1 year", icon: "🛠️", estimatedTimeMinutes: 20 }),
    mkSeed({ category: cat, title: "Check toilet flapper & supply line", recurrenceInterval: "6 months", icon: "🚽", estimatedTimeMinutes: 10 }),
    mkSeed({ category: cat, title: "Sanitize high-touch surfaces", recurrenceInterval: "2 weeks", icon: "🧼", estimatedTimeMinutes: 10 }),
  ];
}
function kitchenSet(): Seed[] {
  const cat = "Kitchen";
  return [
    mkSeed({ category: cat, title: "Clean garbage disposal (ice/lemon/baking soda)", recurrenceInterval: "1 month", icon: "🌀", estimatedTimeMinutes: 10 }),
    mkSeed({ category: cat, title: "Deodorize sink drain", recurrenceInterval: "1 month", icon: "🧪", estimatedTimeMinutes: 5 }),
    mkSeed({ category: cat, title: "Pull & clean behind refrigerator", recurrenceInterval: "6 months", icon: "🧯", estimatedTimeMinutes: 20 }),
    mkSeed({ category: cat, title: "Clean stove underside & sides", recurrenceInterval: "6 months", icon: "🍳", estimatedTimeMinutes: 20 }),
    mkSeed({ category: cat, title: "Descale kettle/coffee maker", recurrenceInterval: "3 months", icon: "☕", estimatedTimeMinutes: 15 }),
    mkSeed({ category: cat, title: "Pantry purge & wipe shelves", recurrenceInterval: "3 months", icon: "🥫", estimatedTimeMinutes: 30 }),
    mkSeed({ category: cat, title: "Check fridge/freezer temps (37°F/0°F)", recurrenceInterval: "1 month", icon: "🧊", estimatedTimeMinutes: 5 }),
  ];
}
function bedroomSet(): Seed[] {
  const cat = "Bedroom";
  return [
    mkSeed({ category: cat, title: "Wash pillows (or replace inserts)", recurrenceInterval: "3 months", icon: "🛏️", estimatedTimeMinutes: 30 }),
    mkSeed({ category: cat, title: "Vacuum mattress & under bed", recurrenceInterval: "1 month", icon: "🧹", estimatedTimeMinutes: 15 }),
    mkSeed({ category: cat, title: "Flip mattress (if flippable)", recurrenceInterval: "6 months", icon: "🔁", estimatedTimeMinutes: 10 }),
    mkSeed({ category: cat, title: "Rotate seasonal clothes", recurrenceInterval: "6 months", icon: "👚", estimatedTimeMinutes: 30 }),
  ];
}
function livingRoomSet(): Seed[] {
  const cat = "Living Room";
  return [
    mkSeed({ category: cat, title: "Vacuum upholstery & cushions", recurrenceInterval: "1 month", icon: "🛋️", estimatedTimeMinutes: 20 }),
    mkSeed({ category: cat, title: "Clean TV/screen & dust media area", recurrenceInterval: "1 month", icon: "📺", estimatedTimeMinutes: 10 }),
    mkSeed({ category: cat, title: "Rearrange furniture (prevent dents/fade)", recurrenceInterval: "6 months", icon: "🧭", estimatedTimeMinutes: 20 }),
    mkSeed({ category: cat, title: "Fireplace ash cleanout (in season)", recurrenceInterval: "1 week", icon: "🔥", estimatedTimeMinutes: 10 }),
  ];
}
function laundrySet(): Seed[] {
  const cat = "Laundry Room";
  return [
    mkSeed({ category: cat, title: "Inspect washer hoses & replace if bulging", recurrenceInterval: "1 year", icon: "🪢", estimatedTimeMinutes: 10, criticality: "high" }),
    mkSeed({ category: cat, title: "Clean washer inlet screens", recurrenceInterval: "1 year", icon: "🚰", estimatedTimeMinutes: 20 }),
    mkSeed({ category: cat, title: "Level/balance washer", recurrenceInterval: "6 months", icon: "🛠️", estimatedTimeMinutes: 15 }),
  ];
}
function basementSet(): Seed[] {
  const cat = "Basement";
  return [
    mkSeed({ category: cat, title: "Run dehumidifier / clean filter", recurrenceInterval: "1 month", icon: "💧", estimatedTimeMinutes: 10 }),
    mkSeed({ category: cat, title: "Check for efflorescence/leaks", recurrenceInterval: "3 months", icon: "🧱", estimatedTimeMinutes: 10 }),
    mkSeed({ category: cat, title: "Test sump pump", recurrenceInterval: "6 months", icon: "🕳️", estimatedTimeMinutes: 10, steps: ["Lift float or pour water into pit", "Verify discharge outdoors"] }),
  ];
}
function garageSet(): Seed[] {
  const cat = "Garage";
  return [
    mkSeed({ category: cat, title: "Clean door tracks & lube rollers", recurrenceInterval: "6 months", icon: "🚪", estimatedTimeMinutes: 15, canBeOutsourced: true }),
    mkSeed({ category: cat, title: "Test auto-reverse safety", recurrenceInterval: "6 months", icon: "⚠️", estimatedTimeMinutes: 5, criticality: "high" }),
    mkSeed({ category: cat, title: "Sweep & declutter floor zones", recurrenceInterval: "1 month", icon: "🧹", estimatedTimeMinutes: 15 }),
  ];
}
function atticSet(): Seed[] {
  const cat = "Attic";
  return [
    mkSeed({ category: cat, title: "Inspect insulation & ventilation", recurrenceInterval: "1 year", icon: "🪵", estimatedTimeMinutes: 20 }),
    mkSeed({ category: cat, title: "Check for pests/nests", recurrenceInterval: "6 months", icon: "🐭", estimatedTimeMinutes: 10 }),
    mkSeed({ category: cat, title: "Scan for roof leaks after rain", recurrenceInterval: "3 months", icon: "🌧️", estimatedTimeMinutes: 10 }),
  ];
}

/** Whole-home systems */
function hvacSet(): Seed[] {
  const cat = "HVAC";
  return [
    mkSeed({ category: cat, title: "Service visit (professional inspection)", recurrenceInterval: "1 year", icon: "🧑‍🔧", estimatedTimeMinutes: 60, canBeOutsourced: true, criticality: "high" }),
    mkSeed({ category: cat, title: "Clean outdoor unit fins & clear debris", recurrenceInterval: "6 months", icon: "🪣", estimatedTimeMinutes: 20 }),
    mkSeed({ category: cat, title: "Flush condensate line (bleach/vinegar)", recurrenceInterval: "3 months", icon: "🧪", estimatedTimeMinutes: 10 }),
    mkSeed({ category: cat, title: "Vacuum registers & returns", recurrenceInterval: "3 months", icon: "🌀", estimatedTimeMinutes: 15 }),
  ];
}
function plumbingSet(): Seed[] {
  const cat = "Plumbing";
  return [
    mkSeed({ category: cat, title: "Drain water heater sediment", recurrenceInterval: "1 year", icon: "🔥", estimatedTimeMinutes: 45, canBeOutsourced: true }),
    mkSeed({ category: cat, title: "Test T&P relief valve", recurrenceInterval: "1 year", icon: "🧰", estimatedTimeMinutes: 10, criticality: "high" }),
    mkSeed({ category: cat, title: "Check for leaks under sinks", recurrenceInterval: "1 month", icon: "🚰", estimatedTimeMinutes: 5 }),
    mkSeed({ category: cat, title: "Exercise main shutoff valve", recurrenceInterval: "1 year", icon: "🚱", estimatedTimeMinutes: 5 }),
  ];
}
function electricalSet(): Seed[] {
  const cat = "Electrical";
  return [
    mkSeed({ category: cat, title: "Test GFCI/AFCI", recurrenceInterval: "3 months", icon: "⚡", estimatedTimeMinutes: 10, criticality: "high" }),
    mkSeed({ category: cat, title: "Visual panel inspection (labels, rust, smells)", recurrenceInterval: "1 year", icon: "🧲", estimatedTimeMinutes: 10, canBeOutsourced: true }),
    mkSeed({ category: cat, title: "Replace smoke/CO units at end-of-life", recurrenceInterval: "10 years", icon: "🚨", estimatedTimeMinutes: 15, criticality: "high" }),
  ];
}
function exteriorSet(): Seed[] {
  const cat = "Exterior";
  return [
    mkSeed({ category: cat, title: "Pressure-wash siding (gentle settings)", recurrenceInterval: "1 year", icon: "🧽", estimatedTimeMinutes: 60, canBeOutsourced: true }),
    mkSeed({ category: cat, title: "Inspect deck boards/rails/fasteners", recurrenceInterval: "1 year", icon: "🪵", estimatedTimeMinutes: 30 }),
    mkSeed({ category: cat, title: "Seal/stain deck", recurrenceInterval: "2 years", icon: "🧴", estimatedTimeMinutes: 120, canBeOutsourced: true }),
    mkSeed({ category: cat, title: "Clean and realign downspouts", recurrenceInterval: "6 months", icon: "💧", estimatedTimeMinutes: 15 }),
  ];
}
function windowsDoorsSet(): Seed[] {
  const cat = "Windows/Doors";
  return [
    mkSeed({ category: cat, title: "Lubricate hinges & locks", recurrenceInterval: "1 year", icon: "🛠️", estimatedTimeMinutes: 10 }),
    mkSeed({ category: cat, title: "Clean and re-caulk exterior trim", recurrenceInterval: "1 year", icon: "🧴", estimatedTimeMinutes: 60, canBeOutsourced: true }),
    mkSeed({ category: cat, title: "Replace door sweeps/weatherstripping", recurrenceInterval: "1 year", icon: "🌬️", estimatedTimeMinutes: 15 }),
  ];
}
function deckPatioSet(): Seed[] {
  const cat = "Deck/Patio";
  return [
    mkSeed({ category: cat, title: "Sweep debris and clear gaps", recurrenceInterval: "1 month", icon: "🧹", estimatedTimeMinutes: 10 }),
    mkSeed({ category: cat, title: "Check railings & steps for wobble", recurrenceInterval: "6 months", icon: "🪛", estimatedTimeMinutes: 10 }),
  ];
}
function yardSet(): Seed[] {
  const cat = "Yard";
  return [
    mkSeed({ category: cat, title: "Edge beds & refresh mulch", recurrenceInterval: "1 year", icon: "🪴", estimatedTimeMinutes: 60 }),
    mkSeed({ category: cat, title: "Prune shrubs/trees (non-flowering)", recurrenceInterval: "1 year", icon: "✂️", estimatedTimeMinutes: 45, canBeOutsourced: true }),
    mkSeed({ category: cat, title: "Aerate & overseed lawn", recurrenceInterval: "1 year", icon: "🌱", estimatedTimeMinutes: 60, canBeOutsourced: true }),
  ];
}
function pestSet(): Seed[] {
  const cat = "Pest";
  return [
    mkSeed({ category: cat, title: "Perimeter inspection & seal gaps", recurrenceInterval: "1 month", icon: "🕳️", estimatedTimeMinutes: 15 }),
    mkSeed({ category: cat, title: "Set/inspect traps where activity noted", recurrenceInterval: "1 week", icon: "🐭", estimatedTimeMinutes: 5 }),
  ];
}
function roofSet() {
  
}
function seasonalSet(): Seed[] {
  const cat = "Seasonal";
  return [
    mkSeed({ category: cat, title: "Spring: test sump, clean gutters, tune mower", recurrenceInterval: "1 year", icon: "🌼", estimatedTimeMinutes: 90, resources: { bundle: ["sump", "gutters", "mower"] } }),
    mkSeed({ category: cat, title: "Fall: blow out sprinklers, winterize faucets", recurrenceInterval: "1 year", icon: "🍂", estimatedTimeMinutes: 60, criticality: "high" }),
    mkSeed({ category: cat, title: "Winter: clear dryer vent, salt/sand on hand", recurrenceInterval: "1 year", icon: "❄️", estimatedTimeMinutes: 30 }),
    mkSeed({ category: cat, title: "Summer: inspect deck & outdoor play gear", recurrenceInterval: "1 year", icon: "☀️", estimatedTimeMinutes: 30 }),
  ];
}

/** Appliances you already seed elsewhere; included to ensure existence */
const APPLIANCE_TEMPLATES: Seed[] = [
  mkSeed({ key: "appliance_dishwasher_clean_filter_monthly", title: "Clean filter", icon: "🧼", category: "Appliances", recurrenceInterval: "1 month", estimatedTimeMinutes: 10, description: "Remove and rinse filter to prevent clogs and odors." }),
  mkSeed({ key: "appliance_dishwasher_vinegar_cycle_quarterly", title: "Run vinegar cycle", icon: "🍋", category: "Appliances", recurrenceInterval: "3 months", estimatedTimeMinutes: 15 }),
  mkSeed({ key: "appliance_dishwasher_inspect_spray_arms_semiannual", title: "Inspect spray arms", icon: "🛠️", category: "Appliances", recurrenceInterval: "6 months", estimatedTimeMinutes: 10 }),
  mkSeed({ key: "appliance_fridge_vacuum_coils_semiannual", title: "Vacuum condenser coils", icon: "🧯", category: "Appliances", recurrenceInterval: "6 months", estimatedTimeMinutes: 15, criticality: "high" }),
  mkSeed({ key: "appliance_fridge_clean_gaskets_quarterly", title: "Clean door seals", icon: "🚪", category: "Appliances", recurrenceInterval: "3 months", estimatedTimeMinutes: 5 }),
  mkSeed({ key: "appliance_washer_tub_clean_monthly", title: "Run tub clean cycle", icon: "🧺", category: "Appliances", recurrenceInterval: "1 month", estimatedTimeMinutes: 30 }),
  mkSeed({ key: "appliance_dryer_clean_lint_every_use", title: "Clean lint trap", icon: "🔥", category: "Appliances", recurrenceInterval: "After Every Use", estimatedTimeMinutes: 1, canDefer: false, criticality: "high" }),
  mkSeed({ key: "appliance_dryer_inspect_vent_semiannual", title: "Inspect dryer vent", icon: "🌬️", category: "Appliances", recurrenceInterval: "6 months", estimatedTimeMinutes: 15, criticality: "high", canBeOutsourced: true }),
  mkSeed({ key: "appliance_oven_self_clean_quarterly", title: "Run self-clean cycle", icon: "🔥", category: "Appliances", recurrenceInterval: "3 months", estimatedTimeMinutes: 120 }),
  mkSeed({ key: "appliance_microwave_clean_monthly", title: "Clean interior", icon: "📡", category: "Appliances", recurrenceInterval: "1 month", estimatedTimeMinutes: 5 }),
];

async function main() {
  const generated: Seed[] = [
    ...baseRoomHygiene(),
    ...bathroomSet(),
    ...kitchenSet(),
    ...bedroomSet(),
    ...livingRoomSet(),
    ...laundrySet(),
    ...basementSet(),
    ...garageSet(),
    ...atticSet(),
    ...hvacSet(),
    ...plumbingSet(),
    ...electricalSet(),
    ...exteriorSet(),
    ...deckPatioSet(),
    ...yardSet(),
    ...pestSet(),
//    ...roofSet(),
    ...windowsDoorsSet(),
    ...seasonalSet(),
    ...APPLIANCE_TEMPLATES,
  ];

  console.log(`Seeding ${generated.length} task templates…`);
  let count = 0;
  for (const s of generated) {
    await ensureTemplate(s);
    count++;
  }
  console.log(`Upserted ${count} templates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


// dwellwell-api/src/lib/seed.ts
/**
 * Seed ApplianceCatalog + TaskTemplates + Kind→Template links
 *
 * Run with ts-node or package script:
 *   ts-node src/lib/seed.ts
 *   # or
 *   npm run seed
 *
 * Idempotency:
 * - ApplianceCatalog: @@unique([brand, model]) upsert
 * - TaskTemplate: (title, category, recurrenceInterval) findFirst + update/create
 * - TrackableKindTaskTemplate: @@unique([kind, taskTemplateId]) upsert
 */

import { PrismaClient, Prisma, TaskType } from '@prisma/client';
import { ApplianceCatalog } from './mockApplianceCatalog';

const prisma = new PrismaClient();

/** -----------------------------------------
 * Helpers
 * ----------------------------------------*/
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function systemKeyForTemplate(t: {
  title: string;
  recurrenceInterval: string;
  category?: string | null;
}) {
  return `system-key:seed.ts:${slugify(t.title)}:${slugify(
    t.recurrenceInterval,
  )}:${slugify(t.category ?? 'none')}`;
}

/** -----------------------------------------
 * Seed ApplianceCatalog with brand/model entries.
 * ----------------------------------------*/
async function seedApplianceCatalog() {
  for (const appliance of ApplianceCatalog) {
    await prisma.applianceCatalog.upsert({
      where: {
        // composite unique from your schema: @@unique([brand, model], name: "brand_model")
        brand_model: {
          brand: appliance.brand,
          model: appliance.model,
        },
      },
      update: {},
      create: {
        brand: appliance.brand,
        model: appliance.model,
        type: appliance.type,
        category: appliance.category,
        notes: appliance.notes || '',
        imageUrl: appliance.imageUrl || null,
      },
    });
  }
  console.log('✅ Seeded ApplianceCatalog');
}

/** -----------------------------------------
 * Insert/update TaskTemplates available globally
 * (room-based and brand-agnostic trackable-based).
 *
 * Uses (title, category, recurrenceInterval) for idempotency
 * and stamps changelog with a system key.
 * ----------------------------------------*/
async function seedTaskTemplates() {
  // NOTE: Normalize room categories to match ROOM_TYPES exactly for room-scoping:
  // "Bathroom", "Living Room", "Bedroom", etc.
  const templates = [
    // ------------------------
    // Room-based examples (normalized categories)
    // ------------------------
    {
      title: 'Clean Bathroom Mirror',
      description: 'Wipe down mirrors with glass cleaner.',
      recurrenceInterval: 'weekly',
      criticality: 'low', // string enum in your schema
      canDefer: true,
      deferLimitDays: 7,
      estimatedTimeMinutes: 5,
      estimatedCost: 0,
      canBeOutsourced: false,
      category: 'Bathroom',
      icon: '🪞',
      taskType: TaskType.GENERAL,
      steps: ['Spray cleaner', 'Wipe with cloth'],
      equipmentNeeded: ['Glass cleaner', 'Microfiber cloth'],
      resources: [],
    },
    {
      title: 'Vacuum Living Room Carpet',
      description: 'Vacuum carpet to remove dirt and dust.',
      recurrenceInterval: 'weekly',
      criticality: 'medium',
      canDefer: true,
      deferLimitDays: 7,
      estimatedTimeMinutes: 15,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'Living Room',
      icon: '🧹',
      taskType: TaskType.GENERAL,
      steps: ['Move furniture as needed', 'Vacuum thoroughly'],
      equipmentNeeded: ['Vacuum'],
      resources: [],
    },
    {
      title: 'Inspect Caulking and Grout',
      description: 'Check for cracks or mold in caulking and grout in the bathroom.',
      recurrenceInterval: '3 months',
      criticality: 'medium',
      canDefer: true,
      deferLimitDays: 14,
      estimatedTimeMinutes: 10,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'Bathroom',
      icon: '🧴',
      taskType: TaskType.GENERAL,
      steps: [
        'Visually inspect shower, tub, and sink areas',
        'Note any cracking or mold',
        'Clean small areas or schedule re-caulking if needed',
      ],
      equipmentNeeded: ['Flashlight', 'Cleaning cloth'],
      resources: [],
    },
    {
      title: 'Wipe Down Bathroom Walls',
      description: 'Clean humidity residue and potential mold buildup on bathroom walls.',
      recurrenceInterval: 'monthly',
      criticality: 'low',
      canDefer: true,
      deferLimitDays: 14,
      estimatedTimeMinutes: 15,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'Bathroom',
      icon: '🧼',
      taskType: TaskType.GENERAL,
      steps: [
        'Mix water and mild detergent',
        'Wipe down tiled and painted wall surfaces',
        'Dry with a clean towel',
      ],
      equipmentNeeded: ['Bucket', 'Sponge', 'Mild cleaner'],
      resources: [],
    },
    {
      title: 'Clean Bathroom Vent',
      description: 'Dust and clean the exhaust fan grill to maintain airflow.',
      recurrenceInterval: '3 months',
      criticality: 'medium',
      canDefer: true,
      deferLimitDays: 30,
      estimatedTimeMinutes: 10,
      estimatedCost: 0,
      canBeOutsourced: false,
      category: 'Bathroom',
      icon: '🌀',
      taskType: TaskType.GENERAL,
      steps: [
        'Turn off the fan',
        'Remove the vent cover',
        'Wipe or vacuum dust buildup',
        'Reattach the cover',
      ],
      equipmentNeeded: ['Screwdriver', 'Vacuum', 'Cloth'],
      resources: [],
    },
    {
      title: 'Dust Ceiling Fan or Light Fixture',
      description: 'Remove dust buildup from bedroom ceiling fixtures.',
      recurrenceInterval: 'monthly',
      criticality: 'low',
      canDefer: true,
      deferLimitDays: 7,
      estimatedTimeMinutes: 10,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'Bedroom',
      icon: '💡',
      taskType: TaskType.GENERAL,
      steps: [
        'Use duster or microfiber cloth to remove dust from fan blades or lights',
        'Vacuum fallen debris if needed',
      ],
      equipmentNeeded: ['Duster', 'Ladder', 'Vacuum'],
      resources: [],
    },

    // ------------------------
    // Trackable-based: generic / brand-agnostic (home-scoped categories)
    // ------------------------
    {
      title: 'Clean Dishwasher Filter',
      description: 'Remove and rinse the dishwasher filter to prevent clogging.',
      recurrenceInterval: '3 months',
      criticality: 'medium',
      canDefer: true,
      deferLimitDays: 30,
      estimatedTimeMinutes: 15,
      estimatedCost: 0,
      canBeOutsourced: false,
      category: 'appliance',
      icon: '🧼',
      taskType: TaskType.GENERAL,
      steps: [
        'Remove the bottom rack',
        'Twist and pull out the filter',
        'Rinse under hot water',
        'Replace the filter and lock it back in',
      ],
      equipmentNeeded: ['Sponge', 'Old toothbrush'],
      resources: [{ label: 'How to clean a dishwasher filter', url: 'https://example.com/clean-dishwasher' }],
    },
    {
      title: 'Change HVAC Filter',
      description: 'Replace the air filter to ensure efficient airflow.',
      recurrenceInterval: '3 months',
      criticality: 'high',
      canDefer: false,
      deferLimitDays: 0,
      estimatedTimeMinutes: 10,
      estimatedCost: 20,
      canBeOutsourced: false,
      category: 'appliance',
      icon: '🌬️',
      taskType: TaskType.GENERAL,
      steps: [
        'Turn off the HVAC system',
        'Remove old filter',
        'Insert new filter facing airflow direction arrows',
      ],
      equipmentNeeded: ['New air filter', 'Gloves'],
      resources: [{ label: 'Filter Sizing Guide', url: 'https://example.com/hvac-filters' }],
    },
    {
      title: 'Clean Dishwasher Spray Arms',
      description: 'Clear mineral buildup in spray arm holes for proper spray pattern.',
      recurrenceInterval: '6 months',
      criticality: 'medium',
      canDefer: true,
      deferLimitDays: 30,
      estimatedTimeMinutes: 15,
      estimatedCost: 0,
      canBeOutsourced: false,
      category: 'appliance',
      icon: '🚿',
      taskType: TaskType.GENERAL,
      steps: [
        'Remove lower and upper spray arms (check your manual)',
        'Use toothpick to clear clogged holes',
        'Rinse and reinstall',
      ],
      equipmentNeeded: ['Toothpick', 'Small brush'],
      resources: [],
    },
    {
      title: 'Descale Dishwasher',
      description: 'Run a descaling cycle to remove limescale and odors.',
      recurrenceInterval: '3 months',
      criticality: 'low',
      canDefer: true,
      deferLimitDays: 30,
      estimatedTimeMinutes: 5,
      estimatedCost: 10,
      canBeOutsourced: false,
      category: 'appliance',
      icon: '🧪',
      taskType: TaskType.GENERAL,
      steps: ['Empty machine', 'Add descaler per label', 'Run hot cycle'],
      equipmentNeeded: ['Dishwasher descaler'],
      resources: [],
    },
    {
      title: 'Refill Dishwasher Rinse Aid',
      description: 'Keeps dishes spot-free and improves drying.',
      recurrenceInterval: '1 month',
      criticality: 'low',
      canDefer: true,
      deferLimitDays: 14,
      estimatedTimeMinutes: 2,
      estimatedCost: 5,
      canBeOutsourced: false,
      category: 'appliance',
      icon: '🫗',
      taskType: TaskType.GENERAL,
      steps: ['Open rinse-aid compartment', 'Fill to line', 'Close securely'],
      equipmentNeeded: ['Rinse aid'],
      resources: [],
    },
    {
      title: 'Clean Refrigerator Condenser Coils',
      description: 'Vacuum or brush dust from coils to maintain efficiency.',
      recurrenceInterval: '6 months',
      criticality: 'high',
      canDefer: false,
      deferLimitDays: 0,
      estimatedTimeMinutes: 20,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'appliance',
      icon: '❄️',
      taskType: TaskType.GENERAL,
      steps: ['Unplug fridge', 'Access coils (rear or toe-kick)', 'Vacuum/brush thoroughly', 'Restore power'],
      equipmentNeeded: ['Vacuum', 'Coil brush'],
      resources: [],
    },
    {
      title: 'Replace Refrigerator Water Filter',
      description: 'Keeps water/ice clean and flow steady.',
      recurrenceInterval: '6 months',
      criticality: 'medium',
      canDefer: true,
      deferLimitDays: 30,
      estimatedTimeMinutes: 10,
      estimatedCost: 45,
      canBeOutsourced: false,
      category: 'appliance',
      icon: '🚰',
      taskType: TaskType.GENERAL,
      steps: [
        'Locate filter housing',
        'Replace with compatible filter',
        'Run 1–2 gallons to purge air/carbon fines',
      ],
      equipmentNeeded: ['Compatible filter'],
      resources: [],
    },
    {
      title: 'Run Drum Clean Cycle',
      description: 'Prevents odor and residue; use washer cleaner or hot cycle.',
      recurrenceInterval: '1 month',
      criticality: 'medium',
      canDefer: true,
      deferLimitDays: 14,
      estimatedTimeMinutes: 5,
      estimatedCost: 5,
      canBeOutsourced: false,
      category: 'appliance',
      icon: '🫧',
      taskType: TaskType.GENERAL,
      steps: ['Empty drum', 'Add cleaner per label', 'Run Drum Clean/Sanitize cycle'],
      equipmentNeeded: ['Washing machine cleaner'],
      resources: [],
    },
    {
      title: 'Clean Washer Inlet Screens',
      description: 'Remove and rinse inlet filters to restore water flow.',
      recurrenceInterval: '6 months',
      criticality: 'medium',
      canDefer: true,
      deferLimitDays: 30,
      estimatedTimeMinutes: 15,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'appliance',
      icon: '🚿',
      taskType: TaskType.GENERAL,
      steps: ['Turn off water supply', 'Disconnect hoses', 'Remove and rinse inlet screens', 'Reinstall; check for leaks'],
      equipmentNeeded: ['Pliers', 'Towel'],
      resources: [],
    },
    {
      title: 'Clean Dryer Vent Duct',
      description: 'Reduce fire risk by clearing lint from the duct to the exterior.',
      recurrenceInterval: '3 months',
      criticality: 'high',
      canDefer: false,
      deferLimitDays: 0,
      estimatedTimeMinutes: 30,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'safety',
      icon: '🔥',
      taskType: TaskType.GENERAL,
      steps: [
        'Unplug dryer',
        'Detach vent duct',
        'Brush/vacuum lint thoroughly to outside hood',
        'Reattach and test airflow',
      ],
      equipmentNeeded: ['Dryer vent brush', 'Vacuum'],
      resources: [],
    },
    {
      title: 'Replace OTR Microwave Charcoal Filter',
      description: 'If not ducted outdoors, the recirculating charcoal filter needs replacement.',
      recurrenceInterval: '12 months',
      criticality: 'low',
      canDefer: true,
      deferLimitDays: 60,
      estimatedTimeMinutes: 10,
      estimatedCost: 20,
      canBeOutsourced: false,
      category: 'kitchen',
      icon: '🍽️',
      taskType: TaskType.GENERAL,
      steps: ['Open grill', 'Swap filter', 'Reset filter indicator if present'],
      equipmentNeeded: ['Correct charcoal filter'],
      resources: [],
    },
    {
      title: 'Flush Water Heater Tank (full)',
      description: 'Drains sediment to extend life and improve efficiency.',
      recurrenceInterval: '12 months',
      criticality: 'medium',
      canDefer: true,
      deferLimitDays: 60,
      estimatedTimeMinutes: 60,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'plumbing',
      icon: '🚿',
      taskType: TaskType.GENERAL,
      steps: ['Turn off fuel/power', 'Attach hose; drain until clear', 'Refill and relight/restore power'],
      equipmentNeeded: ['Garden hose', 'Bucket'],
      resources: [],
    },
    {
      title: 'Test T&P Relief Valve',
      description: 'Lift test lever to ensure valve operates and reseats.',
      recurrenceInterval: '12 months',
      criticality: 'high',
      canDefer: false,
      deferLimitDays: 0,
      estimatedTimeMinutes: 5,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'safety',
      icon: '🧯',
      taskType: TaskType.GENERAL,
      steps: ['Place bucket', 'Lift lever briefly', 'Verify discharge & reseal'],
      equipmentNeeded: ['Bucket', 'Gloves'],
      resources: [],
    },
  ];

  for (const tpl of templates) {
    const selector = {
      title: tpl.title,
      recurrenceInterval: tpl.recurrenceInterval,
      category: tpl.category ?? null,
    };

    const existing = await prisma.taskTemplate.findFirst({
      where: selector,
      select: { id: true, changelog: true },
    });

    // Cast enum-like fields cautiously to handle Prisma version differences
    const data: any = {
      ...tpl,
      taskType: tpl.taskType ?? TaskType.GENERAL,
      criticality: tpl.criticality ?? 'medium',
      state: 'VERIFIED',
      changelog: existing?.changelog ?? systemKeyForTemplate(selector),
    };

    if (existing) {
      await prisma.taskTemplate.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.taskTemplate.create({
        data: { ...data, version: 1 },
      });
    }
  }

  console.log('✅ Seeded TaskTemplates (idempotent)');
}

/** -----------------------------------------
 * Map generic "kinds" to TaskTemplates so Quick Add can
 * attach tasks immediately via TrackableKindTaskTemplate.
 * ----------------------------------------*/
async function linkKindTemplates() {
  // helper to get template id by (title, recurrenceInterval, category)
  const getTplId = async (
    title: string,
    recurrenceInterval: string,
    category?: string | null,
  ) =>
    (
      await prisma.taskTemplate.findFirst({
        where: { title, recurrenceInterval, category: category ?? null },
        select: { id: true },
      })
    )?.id ?? null;

  const pairs: Array<{
    kind: string;
    title: string;
    recurrenceInterval: string;
    category?: string | null;
  }> = [
    // dishwasher
    { kind: 'dishwasher', title: 'Clean Dishwasher Filter', recurrenceInterval: '3 months', category: 'appliance' },
    { kind: 'dishwasher', title: 'Clean Dishwasher Spray Arms', recurrenceInterval: '6 months', category: 'appliance' },
    { kind: 'dishwasher', title: 'Descale Dishwasher', recurrenceInterval: '3 months', category: 'appliance' },
    { kind: 'dishwasher', title: 'Refill Dishwasher Rinse Aid', recurrenceInterval: '1 month', category: 'appliance' },

    // refrigerator
    { kind: 'refrigerator', title: 'Clean Refrigerator Condenser Coils', recurrenceInterval: '6 months', category: 'appliance' },
    { kind: 'refrigerator', title: 'Replace Refrigerator Water Filter', recurrenceInterval: '6 months', category: 'appliance' },

    // washer / dryer
    { kind: 'washing_machine', title: 'Run Drum Clean Cycle', recurrenceInterval: '1 month', category: 'appliance' },
    { kind: 'washing_machine', title: 'Clean Washer Inlet Screens', recurrenceInterval: '6 months', category: 'appliance' },
    { kind: 'dryer', title: 'Clean Dryer Vent Duct', recurrenceInterval: '3 months', category: 'safety' },

    // microwave (OTR)
    { kind: 'microwave', title: 'Replace OTR Microwave Charcoal Filter', recurrenceInterval: '12 months', category: 'kitchen' },

    // water heater
    { kind: 'water_heater', title: 'Flush Water Heater Tank (full)', recurrenceInterval: '12 months', category: 'plumbing' },
    { kind: 'water_heater', title: 'Test T&P Relief Valve', recurrenceInterval: '12 months', category: 'safety' },

    // hvac
    { kind: 'hvac', title: 'Change HVAC Filter', recurrenceInterval: '3 months', category: 'appliance' },
  ];

  for (const p of pairs) {
    const tplId = await getTplId(p.title, p.recurrenceInterval, p.category ?? null);
    if (!tplId) continue;

    await prisma.trackableKindTaskTemplate.upsert({
      // Prisma synthesizes a unique where-input for @@unique([kind, taskTemplateId])
      where: { kind_taskTemplateId: { kind: p.kind, taskTemplateId: tplId } },
      update: {},
      create: { kind: p.kind, category: p.category ?? null, taskTemplateId: tplId },
    });
  }

  console.log('✅ Linked TrackableKindTaskTemplate mappings');
}

/** -----------------------------------------
 * Main
 * ----------------------------------------*/
async function main() {
  await seedApplianceCatalog();
  await seedTaskTemplates();
  await linkKindTemplates();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

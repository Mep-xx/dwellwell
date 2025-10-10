//dwellwell-api/src/lib/seed.ts
import { PrismaClient, TaskType, TaskCriticality } from '@prisma/client';
import { ApplianceCatalog } from './mockApplianceCatalog';

const prisma = new PrismaClient();

/**
 * Seed ApplianceCatalog with brand/model entries.
 */
async function seedApplianceCatalog() {
  for (const appliance of ApplianceCatalog) {
    await prisma.applianceCatalog.upsert({
      where: {
        // composite unique from your schema: @@unique([brand, model])
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

/**
 * Insert/update TaskTemplates that we want available globally
 * (room-based and brand-agnostic trackable-based).
 *
 * Note: title is not unique in your schema, so we findFirst by title and update.
 */
async function seedTaskTemplates() {
  const templates = [
    // ------------------------
    // Room-based examples
    // ------------------------
    {
      title: 'Clean Bathroom Mirror',
      description: 'Wipe down mirrors with glass cleaner.',
      recurrenceInterval: 'weekly',
      criticality: TaskCriticality.low,
      canDefer: true,
      deferLimitDays: 7,
      estimatedTimeMinutes: 5,
      estimatedCost: 0,
      canBeOutsourced: false,
      category: 'bathroom',
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
      criticality: TaskCriticality.medium,
      canDefer: true,
      deferLimitDays: 7,
      estimatedTimeMinutes: 15,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'living room',
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
      criticality: TaskCriticality.medium,
      canDefer: true,
      deferLimitDays: 14,
      estimatedTimeMinutes: 10,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'bathroom',
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
      criticality: TaskCriticality.low,
      canDefer: true,
      deferLimitDays: 14,
      estimatedTimeMinutes: 15,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'bathroom',
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
      criticality: TaskCriticality.medium,
      canDefer: true,
      deferLimitDays: 30,
      estimatedTimeMinutes: 10,
      estimatedCost: 0,
      canBeOutsourced: false,
      category: 'bathroom',
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
      criticality: TaskCriticality.low,
      canDefer: true,
      deferLimitDays: 7,
      estimatedTimeMinutes: 10,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'bedroom',
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
    // Trackable-based: generic / brand-agnostic
    // ------------------------
    {
      title: 'Clean Dishwasher Filter',
      description: 'Remove and rinse the dishwasher filter to prevent clogging.',
      recurrenceInterval: '3 months',
      criticality: TaskCriticality.medium,
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
      criticality: TaskCriticality.high,
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

    // --- Additional generic dishwasher care ---
    {
      title: 'Clean Dishwasher Spray Arms',
      description: 'Clear mineral buildup in spray arm holes for proper spray pattern.',
      recurrenceInterval: '6 months',
      criticality: TaskCriticality.medium,
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
      criticality: TaskCriticality.low,
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
      criticality: TaskCriticality.low,
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

    // --- Refrigerator ---
    {
      title: 'Clean Refrigerator Condenser Coils',
      description: 'Vacuum or brush dust from coils to maintain efficiency.',
      recurrenceInterval: '6 months',
      criticality: TaskCriticality.high,
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
      criticality: TaskCriticality.medium,
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

    // --- Washing Machine ---
    {
      title: 'Run Drum Clean Cycle',
      description: 'Prevents odor and residue; use washer cleaner or hot cycle.',
      recurrenceInterval: '1 month',
      criticality: TaskCriticality.medium,
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
      criticality: TaskCriticality.medium,
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

    // --- Dryer ---
    {
      title: 'Clean Dryer Vent Duct',
      description: 'Reduce fire risk by clearing lint from the duct to the exterior.',
      recurrenceInterval: '3 months',
      criticality: TaskCriticality.high,
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

    // --- Microwave (OTR) ---
    {
      title: 'Replace OTR Microwave Charcoal Filter',
      description: 'If not ducted outdoors, the recirculating charcoal filter needs replacement.',
      recurrenceInterval: '12 months',
      criticality: TaskCriticality.low,
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

    // --- Water Heater (tank) ---
    {
      title: 'Flush Water Heater Tank (full)',
      description: 'Drains sediment to extend life and improve efficiency.',
      recurrenceInterval: '12 months',
      criticality: TaskCriticality.medium,
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
      criticality: TaskCriticality.high,
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
    const existing = await prisma.taskTemplate.findFirst({
      where: { title: tpl.title },
      select: { id: true },
    });

    if (existing) {
      await prisma.taskTemplate.update({
        where: { id: existing.id },
        data: tpl,
      });
    } else {
      await prisma.taskTemplate.create({ data: tpl });
    }
  }

  console.log('✅ Seeded TaskTemplates');
}

/**
 * Map generic "kinds" to TaskTemplates so Quick Add can attach tasks
 * immediately via TrackableKindTaskTemplate.
 */
async function linkKindTemplates() {
  // helper to get template id by title
  const getTplId = async (title: string) =>
    (await prisma.taskTemplate.findFirst({ where: { title }, select: { id: true } }))?.id ?? null;

  const pairs: Array<{ kind: string; title: string; category?: string | null }> = [
    // dishwasher
    { kind: 'dishwasher', title: 'Clean Dishwasher Filter' },
    { kind: 'dishwasher', title: 'Clean Dishwasher Spray Arms' },
    { kind: 'dishwasher', title: 'Descale Dishwasher' },
    { kind: 'dishwasher', title: 'Refill Dishwasher Rinse Aid' },

    // refrigerator
    { kind: 'refrigerator', title: 'Clean Refrigerator Condenser Coils' },
    { kind: 'refrigerator', title: 'Replace Refrigerator Water Filter' },

    // washer / dryer
    { kind: 'washing_machine', title: 'Run Drum Clean Cycle' },
    { kind: 'washing_machine', title: 'Clean Washer Inlet Screens' },
    { kind: 'dryer', title: 'Clean Dryer Vent Duct' },

    // microwave (OTR)
    { kind: 'microwave', title: 'Replace OTR Microwave Charcoal Filter' },

    // water heater
    { kind: 'water_heater', title: 'Flush Water Heater Tank (full)' },
    { kind: 'water_heater', title: 'Test T&P Relief Valve' },

    // hvac
    { kind: 'hvac', title: 'Change HVAC Filter' },
  ];

  for (const p of pairs) {
    const tplId = await getTplId(p.title);
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

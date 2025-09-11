// prisma/seed.ts
import { PrismaClient, TaskType, TaskCriticality } from '@prisma/client';
import { ApplianceCatalog } from './mockApplianceCatalog'; // <-- ESM import

const prisma = new PrismaClient();

async function seedApplianceCatalog() {
  for (const appliance of ApplianceCatalog) {
    await prisma.applianceCatalog.upsert({
      where: {
        // uses @@unique([brand, model]) from your schema
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

async function seedTaskTemplates() {
  const templates = [
    // ---- Room-based tasks ----
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

    // ---- Trackable-based tasks ----
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
  ];

  // Because `title` isn’t unique in your schema, we can’t use `upsert({ where: { title }})`.
  // Do a safe find-or-create/update instead.
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

async function main() {
  await seedApplianceCatalog();
  await seedTaskTemplates();
}

main()
  .catch((e) => {
    console.error(e);
    // `process` is typed once @types/node is installed
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

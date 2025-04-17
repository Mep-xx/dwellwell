import { PrismaClient, TaskType } from '@prisma/client';
const { ApplianceCatalog } = require('./mockApplianceCatalog');

const prisma = new PrismaClient();

async function seedApplianceCatalog() {
  for (const appliance of ApplianceCatalog) {
    await prisma.applianceCatalog.upsert({
      where: {
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
        imageUrl: appliance.image || null,
      },
    });
  }
  console.log('✅ Seeded ApplianceCatalog');
}

async function seedTaskTemplates() {
  const templates = [
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
      category: 'kitchen',
      icon: '🧼',
      taskType: TaskType.GENERAL,
      steps: [
        'Remove the bottom rack',
        'Twist and pull out the filter',
        'Rinse under hot water',
        'Replace the filter and lock it back in',
      ],
      equipmentNeeded: ['Sponge', 'Old toothbrush'],
      resources: [
        { label: 'How to clean a dishwasher filter', url: 'https://example.com/clean-dishwasher' },
      ],
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
      category: 'heating',
      icon: '🌬️',
      taskType: TaskType.GENERAL,
      steps: [
        'Turn off the HVAC system',
        'Remove old filter',
        'Insert new filter facing airflow direction arrows',
      ],
      equipmentNeeded: ['New air filter', 'Gloves'],
      resources: [
        { label: 'Filter Sizing Guide', url: 'https://example.com/hvac-filters' },
      ],
    },
    {
      title: 'Flush Water Heater',
      description: 'Drain and flush sediment from your water heater.',
      recurrenceInterval: 'yearly',
      criticality: 'high',
      canDefer: true,
      deferLimitDays: 60,
      estimatedTimeMinutes: 45,
      estimatedCost: 0,
      canBeOutsourced: true,
      category: 'plumbing',
      icon: '🚿',
      taskType: TaskType.GENERAL,
      steps: [
        'Turn off power/gas to heater',
        'Connect hose to drain valve',
        'Open drain and flush until clear',
        'Close drain, refill, and restore power',
      ],
      equipmentNeeded: ['Garden hose', 'Bucket', 'Gloves'],
      resources: [
        { label: 'How to flush your heater', url: 'https://example.com/water-heater-flush' },
      ],
    },
  ];

  for (const template of templates) {
    await prisma.taskTemplate.create({ data: template });
  }

  console.log('✅ Seeded TaskTemplates');
}

async function main() {
  await seedApplianceCatalog();
  await seedTaskTemplates();
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

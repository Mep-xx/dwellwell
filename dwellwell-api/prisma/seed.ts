import { PrismaClient } from '@prisma/client';
const { ApplianceCatalog } = require('./mockApplianceCatalog');


const prisma = new PrismaClient();

async function seedUsers() {
  const user = await prisma.user.upsert({
    where: { email: 'test@dwellwell.io' },
    update: {},
    create: {
      id: '7534594a-dc3c-4e02-a017-06e9443a6035',
      email: 'test@dwellwell.io',
      password: 'test123', // ⚠️ hash this in production
    },
  });
  console.log('✅ Seeded test user');
}

async function seedApplianceCatalog() {
  for (const appliance of ApplianceCatalog) {
    await prisma.applianceCatalog.upsert({
      where: { model: appliance.model },
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

async function main() {
  await seedUsers();
  await seedApplianceCatalog();
  // Add more seed functions here as needed
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

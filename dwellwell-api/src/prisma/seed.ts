import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@dwellwell.io' },
    update: {},
    create: {
      id: '7534594a-dc3c-4e02-a017-06e9443a6035',
      email: 'test@dwellwell.io',
      password: 'test123', // ⚠️ In production, always hash passwords
    },
  });

  console.log('Seeded user:', user);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
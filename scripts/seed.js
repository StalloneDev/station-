const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function main() {
  console.log('Seeding products...');
  const essence = await prisma.product.upsert({
    where: { name: 'Essence' },
    update: {},
    create: { name: 'Essence' },
  });

  const gasoil = await prisma.product.upsert({
    where: { name: 'Gasoil' },
    update: {},
    create: { name: 'Gasoil' },
  });

  console.log('Seeding stations...');
  const stations = [
    'FIDJROSSE/JENN SERVICE',
    'STATION ABOMEY-CALAVI',
    'STATION COTONOU CENTRE',
    'STATION PORTO-NOVO'
  ];

  for (const name of stations) {
    await prisma.station.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    require('fs').writeFileSync('seed-error.txt', e.message || String(e));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

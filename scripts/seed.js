const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function main() {
  console.log('Seeding products...');
  await prisma.product.upsert({
    where: { name: 'Essence' },
    update: {},
    create: { name: 'Essence' },
  });

  await prisma.product.upsert({
    where: { name: 'Gasoil' },
    update: {},
    create: { name: 'Gasoil' },
  });

  const stationsToDelete = [
    'FIDJROSSE/JENN SERVICE',
    'STATION ABOMEY-CALAVI',
    'STATION COTONOU CENTRE',
    'STATION PORTO-NOVO'
  ];

  console.log('Deleting obsolete stations if they exist...');
  for (const name of stationsToDelete) {
    const s = await prisma.station.findUnique({ where: { name } });
    if (s) {
      // delete states first if needed
      await prisma.dailyState.deleteMany({ where: { stationId: s.id } });
      await prisma.station.delete({ where: { name } });
    }
  }

  const stations = [
    'MRS AKPAKPA/JENN SERVICE',
    'MRS FIDJROSSE/JENN SERVICE',
    'CORLAY FIDJROSSE/IMPERIAL GROUP',
    'MRS STE RITA/ ISHOLA SERVICES ET FILS',
    'CORLAY VEDOKO/ GESTION DIRECTE',
    'CORLAY GODOMEY/AGICOP',
    'MRS COCOTOMEY/ JENN SERVICES',
    'MRS PARAKOU 1/ JENN SERVICE',
    'MRS CALAVI KPOTA/ JENN SERVICE',
    'MRS TANGUIETA/ ISHOLA SERVICE',
    'MRS OUIDAH/ GD',
    'MRS PARAKOU2/ KASAANF SARL',
    'CORLAY ARCONVILLE/SITRAC',
    'MRS DASSA/ ISHOLA SERVICE'
  ];

  console.log('Seeding new stations...');
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

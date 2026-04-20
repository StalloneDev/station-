const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const stationMapping = {
  'MRS AKPAKPA/JENN SERVICE': 'akpakpa114',
  'MRS FIDJROSSE/JENN SERVICE': 'fidjrosse214',
  'CORLAY FIDJROSSE/IMPERIAL GROUP': 'fidjrosse314',
  'MRS STE RITA/ ISHOLA SERVICES ET FILS': 'sterita414',
  'CORLAY VEDOKO/ GESTION DIRECTE': 'vedoko514',
  'CORLAY GODOMEY/AGICOP': 'godomey614',
  'MRS COCOTOMEY/ JENN SERVICES': 'cocotomey714',
  'MRS PARAKOU 1/ JENN SERVICE': 'parakou814',
  'MRS CALAVI KPOTA/ JENN SERVICE': 'kpota914',
  'MRS TANGUIETA/ ISHOLA SERVICE': 'tanguieta1014',
  'MRS OUIDAH/ GD': 'ouidah1114',
  'MRS PARAKOU2/ KASAANF SARL': 'kasaanf1214',
  'CORLAY ARCONVILLE/SITRAC': 'arconville1314',
  'MRS DASSA/ ISHOLA SERVICE': 'dassa1414'
}

async function main() {
  const adminPass = await bcrypt.hash('MrsCorlay2026', 10)

  // Upsert Administrateur (keep generic admin)
  await prisma.user.upsert({
    where: { username: 'Administrateur' },
    update: { passwordHash: adminPass, role: 'admin' },
    create: { username: 'Administrateur', passwordHash: adminPass, role: 'admin' },
  })

  // Delete generic Gestionnaire
  const oldManager = await prisma.user.findUnique({ where: { username: 'Gestionnaire' } })
  if (oldManager) {
    await prisma.user.delete({ where: { username: 'Gestionnaire' } })
  }

  // Create or Update Managers per station
  for (const [stationName, password] of Object.entries(stationMapping)) {
    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.upsert({
      where: { username: stationName },
      update: { passwordHash, role: 'manager' },
      create: { username: stationName, passwordHash, role: 'manager' },
    })
  }

  console.log('Seed: Utilisateurs (Admin + Managers par station) créés avec succès.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

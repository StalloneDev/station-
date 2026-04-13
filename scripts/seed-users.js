const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminPass = await bcrypt.hash('MrsCorlay2026', 10)
  const managerPass = await bcrypt.hash('superviseur', 10)

  // Upsert Administrateur
  await prisma.user.upsert({
    where: { username: 'Administrateur' },
    update: { passwordHash: adminPass, role: 'admin' },
    create: { username: 'Administrateur', passwordHash: adminPass, role: 'admin' },
  })

  // Upsert Gestionnaire
  await prisma.user.upsert({
    where: { username: 'Gestionnaire' },
    update: { passwordHash: managerPass, role: 'manager' },
    create: { username: 'Gestionnaire', passwordHash: managerPass, role: 'manager' },
  })

  console.log('Seed: Utilisateurs créés avec succès.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

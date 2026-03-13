import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('senha123', 12)

  await prisma.user.upsert({
    where: { email: 'perito@demo.com' },
    update: {},
    create: {
      email: 'perito@demo.com',
      name: 'Matheus Perito',
      passwordHash: hash,
      role: 'perito',
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Admin',
      passwordHash: hash,
      role: 'admin',
    },
  })

  console.log('Seed concluido: perito@demo.com / admin@demo.com — senha: senha123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('senha123', 12)
  const hashMm = await bcrypt.hash('123456', 10)

  await prisma.user.upsert({
    where: { email: 'mmbonassi@gmail.com' },
    update: {},
    create: {
      email: 'mmbonassi@gmail.com',
      name: 'M. Bonassi',
      passwordHash: hashMm,
      role: 'perito',
    },
  })

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

  // ─── Usuários demo de parceiros ───────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'escritorio@demo.perix.com.br' },
    update: {},
    create: {
      email: 'escritorio@demo.perix.com.br',
      name: 'Carvalho & Menezes Advocacia',
      passwordHash: hash,
      role: 'parceiro',
    },
  })

  await prisma.user.upsert({
    where: { email: 'seguradora@demo.perix.com.br' },
    update: {},
    create: {
      email: 'seguradora@demo.perix.com.br',
      name: 'Caixa Seguradora RJ',
      passwordHash: hash,
      role: 'parceiro',
    },
  })

  await prisma.user.upsert({
    where: { email: 'originador@demo.perix.com.br' },
    update: {},
    create: {
      email: 'originador@demo.perix.com.br',
      name: 'Rio Perícias Originações',
      passwordHash: hash,
      role: 'parceiro',
    },
  })

  console.log('=== Seed concluido ===')
  console.log('mmbonassi@gmail.com   — 123456  — perito')
  console.log('perito@demo.com       — senha123 — perito')
  console.log('admin@demo.com        — senha123 — admin')
  console.log('escritorio@demo.perix.com.br — senha123 — parceiro')
  console.log('seguradora@demo.perix.com.br — senha123 — parceiro')
  console.log('originador@demo.perix.com.br — senha123 — parceiro')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'

function createPrismaClient(): PrismaClient {
  // Produção (Vercel + Turso): usa o adapter libSQL
  // As vars só existem no Vercel; localmente usa SQLite
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const libsqlClient = require('@libsql/client')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const adapterModule = require('@prisma/adapter-libsql')
    const PrismaLibSql = adapterModule.PrismaLibSql ?? adapterModule.default?.PrismaLibSql
    const libsql = libsqlClient.createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    return new PrismaClient({ adapter: new PrismaLibSql(libsql) })
  }

  // Dev local: SQLite file (DATABASE_URL=file:./dev.db)
  return new PrismaClient()
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

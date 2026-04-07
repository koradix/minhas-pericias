import { PrismaClient } from '@prisma/client'

// Lazy singleton — instanciado apenas na primeira chamada.
// Evita que DATABASE_URL ausente quebre o module-load em rotas que importam
// este arquivo mas não fazem queries (ex: signup page render, edge routes).
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrisma(): PrismaClient {
  return new PrismaClient()
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrisma()
    }
    const value = (globalForPrisma.prisma as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function'
      ? (value as Function).bind(globalForPrisma.prisma)
      : value
  },
})

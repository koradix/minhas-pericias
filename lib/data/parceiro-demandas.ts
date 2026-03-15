import { prisma } from '@/lib/prisma'

export async function getDemandas(userId: string) {
  return prisma.demandaParceiro.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDemandaById(id: string, userId: string) {
  return prisma.demandaParceiro.findFirst({
    where: { id, userId },
  })
}

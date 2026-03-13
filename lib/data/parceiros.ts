import { prisma } from '@/lib/prisma'

export async function getParceiros() {
  return prisma.parceiro.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function getParceiroById(id: string) {
  return prisma.parceiro.findUnique({ where: { id } })
}

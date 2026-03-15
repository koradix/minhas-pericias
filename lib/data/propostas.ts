import { prisma } from '@/lib/prisma'

export async function getPropostas(userId: string) {
  return prisma.proposta.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

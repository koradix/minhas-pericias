import { prisma } from '@/lib/prisma'

export async function getPropostaByPericia(pericoId: string, userId: string) {
  return prisma.propostaHonorarios.findUnique({
    where: { pericoId_userId: { pericoId, userId } },
  })
}

import { prisma } from '@/lib/prisma'

export async function getEnderecoOverride(
  pericoId: string,
  userId: string,
): Promise<string | null> {
  const row = await prisma.periciaEnderecoOverride.findUnique({
    where: { pericoId_userId: { pericoId, userId } },
  })
  return row?.endereco ?? null
}

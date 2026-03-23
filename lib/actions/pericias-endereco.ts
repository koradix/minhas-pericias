'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updatePericiaEndereco(
  pericoId: string,
  endereco: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const userId = session.user.id
  const value = endereco.trim()

  await prisma.periciaEnderecoOverride.upsert({
    where: { pericoId_userId: { pericoId, userId } },
    create: { pericoId, userId, endereco: value },
    update: { endereco: value },
  })

  revalidatePath(`/pericias/${pericoId}`)
  return { ok: true }
}

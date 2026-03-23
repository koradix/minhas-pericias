'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Valid one-step forward transitions
const VALID_NEXT: Record<string, string> = {
  nomeado:      'aguardando',
  aguardando:   'em_andamento',
  em_andamento: 'concluida',
}

export async function updatePericiaStatus(
  pericoId: string,
  currentStatus: string,
): Promise<{ ok: boolean; newStatus?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const newStatus = VALID_NEXT[currentStatus]
  if (!newStatus) return { ok: false, error: 'Transição inválida' }

  await prisma.periciaStatusOverride.upsert({
    where:  { pericoId_userId: { pericoId, userId: session.user.id } },
    create: { pericoId, userId: session.user.id, status: newStatus },
    update: { status: newStatus },
  })

  revalidatePath('/pericias/kanban')
  revalidatePath(`/pericias/${pericoId}`)

  return { ok: true, newStatus }
}

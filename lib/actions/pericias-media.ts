'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * Gets (or creates) a RotaPericia for a given pericoId,
 * then creates a new Checkpoint for this visit session.
 * Returns the checkpointId to open in the media panel.
 */
export async function criarCheckpointParaPericia(pericoId: string): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const peritoId = session.user.id

  // Find existing rota — pericoId column may not exist in production DB yet
  let rota = null
  try {
    rota = await prisma.rotaPericia.findFirst({
      where: { pericoId, peritoId, status: 'em_andamento' },
    })
  } catch {
    // pericoId column not yet migrated — skip lookup, always create
  }

  if (!rota) {
    // Try with pericoId first, fallback without it if column is missing in production
    try {
      rota = await prisma.rotaPericia.create({
        data: { peritoId, pericoId, titulo: `Vistoria — processo ${pericoId}`, status: 'em_andamento' },
      })
    } catch {
      rota = await prisma.rotaPericia.create({
        data: { peritoId, titulo: `Vistoria — processo ${pericoId}`, status: 'em_andamento' },
      })
    }
  }

  // Create a new checkpoint for this capture session (timestamped)
  const agora = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const checkpoint = await prisma.checkpoint.create({
    data: {
      rotaId: rota.id,
      ordem: 1,
      titulo: `Registro ${agora}`,
      status: 'chegou',
    },
  })

  return checkpoint.id
}

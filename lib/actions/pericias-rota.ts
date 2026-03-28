'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export interface CriarRotaResult {
  ok: boolean
  message: string
  rotaId?: string
  checkpointId?: string
}

export async function criarRotaDaPericia(
  periciaId: string,
  endereco: string,
): Promise<CriarRotaResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  const userId = session.user.id

  try {
    const pericia = await prisma.pericia.findUnique({
      where: { id: periciaId },
      select: { peritoId: true, assunto: true },
    })
    if (!pericia || pericia.peritoId !== userId) {
      return { ok: false, message: 'Péricia não encontrada' }
    }

    const enderecoTrimmed = endereco.trim()
    if (!enderecoTrimmed) return { ok: false, message: 'Informe o endereço da vistoria' }

    // Create a RotaPericia for this péricia
    const rota = await prisma.rotaPericia.create({
      data: {
        peritoId: userId,
        titulo: pericia.assunto,
        status: 'em_andamento',
        pericoId: periciaId,
      },
    })

    // Create the single checkpoint with the address
    const checkpoint = await prisma.checkpoint.create({
      data: {
        rotaId: rota.id,
        periciaId,
        ordem: 1,
        titulo: 'Vistoria',
        endereco: enderecoTrimmed,
        status: 'pendente',
      },
    })

    // Update péricia status to em_andamento
    await prisma.pericia.update({
      where: { id: periciaId },
      data: { status: 'em_andamento' },
    })

    revalidatePath(`/pericias/${periciaId}`)
    return { ok: true, message: 'Rota criada.', rotaId: rota.id, checkpointId: checkpoint.id }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Erro ao criar rota' }
  }
}

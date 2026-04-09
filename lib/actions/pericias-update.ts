'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface DadosPericia {
  assunto?: string
  vara?: string
  partes?: string
  endereco?: string
  prazo?: string
  valorHonorarios?: number | null
  tags?: string[]
}

export async function atualizarDadosPericia(
  periciaId: string,
  dados: DadosPericia,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autorizado' }

  const pericia = await prisma.pericia.findUnique({
    where: { id: periciaId },
    select: { peritoId: true },
  })
  if (!pericia || pericia.peritoId !== session.user.id) {
    return { ok: false, error: 'Perícia não encontrada' }
  }

  await prisma.pericia.update({
    where: { id: periciaId },
    data: {
      ...(dados.assunto   !== undefined ? { assunto:  dados.assunto.trim()  } : {}),
      ...(dados.vara      !== undefined ? { vara:     dados.vara.trim() || null   } : {}),
      ...(dados.partes    !== undefined ? { partes:   dados.partes.trim() || null } : {}),
      ...(dados.endereco  !== undefined ? { endereco: dados.endereco.trim() || null } : {}),
      ...(dados.prazo     !== undefined ? { prazo:    dados.prazo.trim() || null   } : {}),
      ...(dados.valorHonorarios !== undefined ? { valorHonorarios: dados.valorHonorarios } : {}),
      ...(dados.tags !== undefined ? { tags: JSON.stringify(dados.tags) } : {}),
    },
  })

  revalidatePath(`/pericias/${periciaId}`)
  return { ok: true }
}

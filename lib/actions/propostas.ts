'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function enviarProposta(data: {
  demandaId: string
  demandaTitulo: string
  peritoId: string
  peritoNome: string
  mensagem?: string
  valorProposto?: number
}): Promise<{ id: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error('Não autenticado')

  const proposta = await prisma.proposta.create({
    data: {
      demandaId: data.demandaId,
      demandaTitulo: data.demandaTitulo,
      peritoId: data.peritoId,
      peritoNome: data.peritoNome,
      mensagem: data.mensagem,
      valorProposto: data.valorProposto,
      userId,
      status: 'enviada',
    },
  })
  return { id: proposta.id }
}

export async function atualizarStatusProposta(id: string, status: string) {
  await prisma.proposta.update({
    where: { id },
    data: { status },
  })
}

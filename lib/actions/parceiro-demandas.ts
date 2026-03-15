'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export type DemandaActionState = {
  errors?: { titulo?: string[]; tipo?: string[]; cidade?: string[]; uf?: string[] }
  message?: string
}

export async function createDemanda(
  _prevState: DemandaActionState,
  formData: FormData,
): Promise<DemandaActionState> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { message: 'Não autenticado' }

  const titulo = (formData.get('titulo') as string | null)?.trim() ?? ''
  const tipo = (formData.get('tipo') as string | null)?.trim() ?? ''
  const cidade = (formData.get('cidade') as string | null)?.trim() ?? ''
  const uf = (formData.get('uf') as string | null)?.trim() ?? ''
  const descricao = (formData.get('descricao') as string | null)?.trim() || undefined
  const valorRaw = formData.get('valor') as string | null
  const prazo = (formData.get('prazo') as string | null)?.trim() || undefined

  const errors: DemandaActionState['errors'] = {}
  if (!titulo) errors.titulo = ['Título é obrigatório']
  if (!tipo) errors.tipo = ['Especialidade é obrigatória']
  if (!cidade) errors.cidade = ['Cidade é obrigatória']
  if (!uf) errors.uf = ['UF é obrigatória']
  if (Object.keys(errors).length > 0) return { errors }

  await prisma.demandaParceiro.create({
    data: {
      titulo,
      tipo,
      cidade,
      uf,
      descricao,
      valor: parseFloat(valorRaw ?? '0') || 0,
      prazo,
      userId,
    },
  })

  redirect('/parceiro/demandas')
}

export async function deleteDemanda(id: string) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return

  await prisma.demandaParceiro.deleteMany({ where: { id, userId } })
  redirect('/parceiro/demandas')
}

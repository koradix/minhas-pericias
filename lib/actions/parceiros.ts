'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export type ParceiroActionState = {
  errors?: {
    nome?: string[]
  }
  message?: string
}

export async function createParceiro(
  _prevState: ParceiroActionState,
  formData: FormData
): Promise<ParceiroActionState> {
  const nome = (formData.get('nome') as string | null)?.trim()

  if (!nome) {
    return { errors: { nome: ['Nome é obrigatório'] } }
  }

  const parceiro = await prisma.parceiro.create({
    data: {
      nome,
      tipo: (formData.get('tipo') as string) || 'outro',
      email: (formData.get('email') as string | null) || null,
      telefone: (formData.get('telefone') as string | null) || null,
      cidade: (formData.get('cidade') as string | null) || null,
      estado: (formData.get('estado') as string | null) || null,
      observacoes: (formData.get('observacoes') as string | null) || null,
      status: (formData.get('status') as string) || 'ativo',
    },
  })

  revalidatePath('/parceiros')
  redirect(`/parceiros/${parceiro.id}`)
}

export async function updateParceiro(
  id: string,
  _prevState: ParceiroActionState,
  formData: FormData
): Promise<ParceiroActionState> {
  const nome = (formData.get('nome') as string | null)?.trim()

  if (!nome) {
    return { errors: { nome: ['Nome é obrigatório'] } }
  }

  await prisma.parceiro.update({
    where: { id },
    data: {
      nome,
      tipo: (formData.get('tipo') as string) || 'outro',
      email: (formData.get('email') as string | null) || null,
      telefone: (formData.get('telefone') as string | null) || null,
      cidade: (formData.get('cidade') as string | null) || null,
      estado: (formData.get('estado') as string | null) || null,
      observacoes: (formData.get('observacoes') as string | null) || null,
      status: (formData.get('status') as string) || 'ativo',
    },
  })

  revalidatePath('/parceiros')
  revalidatePath(`/parceiros/${id}`)
  redirect(`/parceiros/${id}`)
}

export async function deleteParceiro(id: string) {
  await prisma.parceiro.delete({ where: { id } })
  revalidatePath('/parceiros')
  redirect('/parceiros')
}

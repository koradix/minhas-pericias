'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { SaveEscritaProfileInput } from '@/lib/types/escrita-profile'

type Result = { ok: true } | { ok: false; error: string }

export async function saveEscritaProfile(input: SaveEscritaProfileInput): Promise<Result> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const userId = session.user.id

  const data = {
    tom: input.tom,
    estruturaLaudo: JSON.stringify(input.estruturaLaudo),
    estruturaProposta: JSON.stringify(input.estruturaProposta),
    templatesFavoritos: JSON.stringify(input.templatesFavoritos),
    expressoes: JSON.stringify(input.expressoes),
    palavrasEvitar: JSON.stringify(input.palavrasEvitar),
    abreviaturas: JSON.stringify(input.abreviaturas),
    estiloConc: input.estiloConc,
    formulaFecho: input.formulaFecho,
    notasIA: input.notasIA,
    contextoRegional: input.contextoRegional,
  }

  try {
    await prisma.peritoEscritaProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao salvar perfil de escrita' }
  }

  revalidatePath('/perfil/escrita')
  revalidatePath('/perfil')
  return { ok: true }
}

export async function resetEscritaProfile(): Promise<Result> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    await prisma.peritoEscritaProfile.deleteMany({ where: { userId: session.user.id } })
  } catch {}

  revalidatePath('/perfil/escrita')
  return { ok: true }
}

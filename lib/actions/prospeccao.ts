'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type RegistrarVisitaInput = {
  varaId: string
  dataVisita: string
  resultado: string
  anotacoes?: string
  juizEncontrado?: string
  contatoNome?: string
  contatoRole?: string
  contatoEmail?: string
  contatoFotoUrl?: string
  emailEnviadoEm?: string
  followUpEm?: string
}

export async function registrarVisita(
  input: RegistrarVisitaInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autorizado' }

  const vara = await prisma.varaPublica.findUnique({ where: { id: input.varaId } })
  if (!vara) return { ok: false, error: 'Vara não encontrada' }

  const visita = await prisma.prospeccaoVisita.create({
    data: {
      peritoId: session.user.id,
      varaId: input.varaId,
      comarca: vara.comarca,
      varaNome: vara.varaNome,
      tribunal: vara.tribunal,
      uf: vara.uf,
      dataVisita: new Date(input.dataVisita),
      resultado: input.resultado,
      anotacoes: input.anotacoes ?? null,
      juizEncontrado: input.juizEncontrado ?? null,
      contatoNome: input.contatoNome ?? null,
      contatoRole: input.contatoRole ?? null,
      contatoEmail: input.contatoEmail ?? null,
      contatoFotoUrl: input.contatoFotoUrl ?? null,
      emailEnviadoEm: input.emailEnviadoEm ? new Date(input.emailEnviadoEm) : null,
      followUpEm: input.followUpEm ? new Date(input.followUpEm) : null,
    },
  })

  revalidatePath('/prospeccao')
  return { ok: true, id: visita.id }
}

export async function marcarEmailEnviado(
  visitaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autorizado' }

  const visita = await prisma.prospeccaoVisita.findUnique({ where: { id: visitaId } })
  if (!visita || visita.peritoId !== session.user.id) {
    return { ok: false, error: 'Visita não encontrada' }
  }

  await prisma.prospeccaoVisita.update({
    where: { id: visitaId },
    data: { emailEnviadoEm: new Date() },
  })

  revalidatePath('/prospeccao')
  return { ok: true }
}

export async function deletarVisita(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autorizado' }

  const visita = await prisma.prospeccaoVisita.findUnique({ where: { id } })
  if (!visita || visita.peritoId !== session.user.id) {
    return { ok: false, error: 'Visita não encontrada' }
  }

  await prisma.prospeccaoVisita.delete({ where: { id } })
  revalidatePath('/prospeccao')
  return { ok: true }
}

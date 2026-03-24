'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export interface VaraManageItem {
  id: string
  tribunalSigla: string
  tribunalNome: string
  varaNome: string
  uf: string | null
  enderecoTexto: string | null
  totalNomeacoes: number
}

export async function getMinhasVaras(): Promise<VaraManageItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const rows = await prisma.tribunalVara.findMany({
    where: { peritoId: session.user.id, ativa: true },
    orderBy: [{ tribunalSigla: 'asc' }, { varaNome: 'asc' }],
    select: {
      id: true,
      tribunalSigla: true,
      tribunalNome: true,
      varaNome: true,
      uf: true,
      enderecoTexto: true,
      totalNomeacoes: true,
    },
  })
  return rows
}

export async function updateVaraEndereco(
  id: string,
  enderecoTexto: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    await prisma.tribunalVara.update({
      where: { id, peritoId: session.user.id },
      data: { enderecoTexto: enderecoTexto.trim() || null },
    })
    revalidatePath('/configuracoes/varas')
    revalidatePath('/rotas/prospeccao')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
  }
}

export async function addVaraManual(input: {
  tribunalSigla: string
  varaNome: string
  uf: string
  enderecoTexto: string
}): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const sigla = input.tribunalSigla.trim().toUpperCase()
  const nome = input.varaNome.trim()
  const uf = input.uf.trim().toUpperCase()
  const endereco = input.enderecoTexto.trim()

  if (!sigla || !nome || !uf) return { ok: false, error: 'Preencha tribunal, vara e UF' }

  try {
    await prisma.tribunalVara.upsert({
      where: {
        peritoId_tribunalSigla_varaNome: {
          peritoId: session.user.id,
          tribunalSigla: sigla,
          varaNome: nome,
        },
      },
      create: {
        peritoId: session.user.id,
        tribunalSigla: sigla,
        tribunalNome: sigla,
        varaNome: nome,
        uf,
        enderecoTexto: endereco || null,
        ativa: true,
      },
      update: {
        uf,
        enderecoTexto: endereco || null,
        ativa: true,
      },
    })
    revalidatePath('/configuracoes/varas')
    revalidatePath('/rotas/prospeccao')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
  }
}

export async function desativarVara(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    await prisma.tribunalVara.update({
      where: { id, peritoId: session.user.id },
      data: { ativa: false },
    })
    revalidatePath('/configuracoes/varas')
    revalidatePath('/rotas/prospeccao')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao remover' }
  }
}

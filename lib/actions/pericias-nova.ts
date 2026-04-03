'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface CriarPericiaResult {
  ok: boolean
  message: string
  periciaId?: string
}

export async function criarPericiaManual(formData: FormData): Promise<CriarPericiaResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }
  const userId = session.user.id

  const processo = (formData.get('processo') as string | null)?.trim()
  const assunto  = (formData.get('assunto')  as string | null)?.trim()

  if (!processo) return { ok: false, message: 'Número do processo é obrigatório' }
  if (!assunto)  return { ok: false, message: 'Assunto é obrigatório' }

  const tribunal = (formData.get('tribunal') as string | null)?.trim() || 'Manual'
  const vara     = (formData.get('vara')     as string | null)?.trim() || null
  const tipo     = (formData.get('tipo')     as string | null)?.trim() || 'A classificar'
  const partes   = (formData.get('partes')   as string | null)?.trim() || null
  const endereco = (formData.get('endereco') as string | null)?.trim() || null
  const prazo    = (formData.get('prazo')    as string | null)?.trim() || null

  try {
    const count = await prisma.pericia.count({ where: { peritoId: userId } })
    const numero = `PRC-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const pericia = await prisma.pericia.create({
      data: {
        peritoId: userId,
        numero,
        assunto,
        tipo,
        processo,
        vara,
        partes,
        endereco,
        prazo: prazo || null,
        status: 'planejada',
      },
    })

    // Upsert processo for completeness (allows linking to nomeacoes later)
    await prisma.processo.upsert({
      where: { numeroProcesso: processo },
      update: { tribunal, orgaoJulgador: vara ?? undefined },
      create: {
        numeroProcesso: processo,
        tribunal,
        orgaoJulgador: vara,
        classe: null,
        dataDistribuicao: null,
        dataUltimaAtu: new Date().toISOString().split('T')[0],
        partes: partes ? JSON.stringify([{ nome: partes, tipo: 'Partes' }]) : '[]',
      },
    }).catch(() => {}) // non-fatal

    revalidatePath('/pericias')
    return { ok: true, message: `Perícia ${numero} criada.`, periciaId: pericia.id }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Erro ao criar perícia' }
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// ── Status ────────────────────────────────────────────────────────────────────

export type PropostaStatus = 'rascunho' | 'gerada' | 'enviada'

export async function updatePropostaStatus(
  pericoId: string,
  status: PropostaStatus,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  await prisma.propostaHonorarios.updateMany({
    where: { pericoId, userId },
    data:  { status },
  })

  revalidatePath(`/pericias/${pericoId}/proposta`)
  revalidatePath(`/pericias/${pericoId}/proposta/preview`)

  return { ok: true }
}

// ── Upsert ────────────────────────────────────────────────────────────────────

export type PropostaActionState = {
  ok?: boolean
  errors?: {
    peritoNome?: string[]
    descricaoServicos?: string[]
  }
  message?: string
}

export async function upsertPropostaHonorarios(
  _prevState: PropostaActionState,
  formData: FormData,
): Promise<PropostaActionState> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, message: 'Não autenticado' }

  // ── Process context (hidden fields from form) ────────────────────────────────
  const pericoId       = (formData.get('pericoId')       as string | null)?.trim() ?? ''
  const pericoNumero   = (formData.get('pericoNumero')   as string | null)?.trim() ?? ''
  const pericoAssunto  = (formData.get('pericoAssunto')  as string | null)?.trim() ?? ''
  const pericoProcesso = (formData.get('pericoProcesso') as string | null)?.trim() ?? ''
  const pericoVara     = (formData.get('pericoVara')     as string | null)?.trim() ?? ''
  const pericoPartes   = (formData.get('pericoPartes')   as string | null)?.trim() ?? ''

  // ── Proposal fields ──────────────────────────────────────────────────────────
  const peritoNome         = (formData.get('peritoNome')         as string | null)?.trim() ?? ''
  const peritoQualificacao = (formData.get('peritoQualificacao') as string | null)?.trim() ?? ''
  const dataProposta       = (formData.get('dataProposta')       as string | null)?.trim() ?? ''
  const descricaoServicos  = (formData.get('descricaoServicos')  as string | null)?.trim() ?? ''
  const prazoEstimado      = (formData.get('prazoEstimado')      as string | null)?.trim() ?? ''
  const observacoes        = (formData.get('observacoes')        as string | null)?.trim() ?? ''

  const valorRaw           = formData.get('valorHonorarios')  as string | null
  const deslocamentoRaw    = formData.get('custoDeslocamento') as string | null
  const horasRaw           = formData.get('horasTecnicas')    as string | null
  const complexidadeNota   = (formData.get('complexidadeNota') as string | null)?.trim() ?? ''

  // ── Validation ───────────────────────────────────────────────────────────────
  const errors: PropostaActionState['errors'] = {}
  if (!peritoNome)        errors.peritoNome        = ['Nome do perito é obrigatório']
  if (!descricaoServicos) errors.descricaoServicos  = ['Descrição dos serviços é obrigatória']
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  // ── Persist ──────────────────────────────────────────────────────────────────
  const data = {
    pericoId,
    pericoNumero,
    pericoAssunto,
    pericoProcesso,
    pericoVara,
    pericoPartes,
    peritoNome,
    peritoQualificacao,
    dataProposta,
    descricaoServicos,
    prazoEstimado,
    observacoes,
    valorHonorarios:    valorRaw        ? parseFloat(valorRaw)     : null,
    custoDeslocamento:  deslocamentoRaw ? parseFloat(deslocamentoRaw) : null,
    horasTecnicas:      horasRaw        ? parseFloat(horasRaw)     : null,
    complexidadeNota,
    userId,
    status: 'rascunho',
  }

  await prisma.propostaHonorarios.upsert({
    where:  { pericoId_userId: { pericoId, userId } },
    create: data,
    update: {
      peritoNome,
      peritoQualificacao,
      dataProposta,
      descricaoServicos,
      prazoEstimado,
      observacoes,
      valorHonorarios:   valorRaw        ? parseFloat(valorRaw)        : null,
      custoDeslocamento: deslocamentoRaw ? parseFloat(deslocamentoRaw) : null,
      horasTecnicas:     horasRaw        ? parseFloat(horasRaw)        : null,
      complexidadeNota,
    },
  })

  revalidatePath(`/pericias/${pericoId}/proposta`)

  return { ok: true }
}

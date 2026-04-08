'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FeeProposalData {
  // Process snapshot
  numeroProcesso:     string
  tribunal:           string
  vara:               string
  assunto:            string
  partes:             string
  tipoPericia:        string
  endereco:           string
  quesitos:           string[]
  // Perito
  peritoNome:         string
  peritoQualificacao: string
  // Content
  descricaoServicos:  string
  resumoTecnico:      string
  metodologia:        string
  fasesEstimadas:     string[]
  horasEstimadas:     number | null
  despesasPrevistas:  string
  valorHonorarios:    number | null
  custoDeslocamento:  number | null
  prazoEntrega:       string
  condicoesPagamento: string
  observacoes:        string
  riscosEPendencias:  string[]
  complexidade:       string
  dataProposta:       string
  // Control
  templateId:         string | null
  iaModel:            string
  iaRawOutput:        string
  status:             'rascunho' | 'gerada' | 'enviada' | 'aceita'
}

export interface FeeProposalRow extends FeeProposalData {
  id:          string
  periciaId:   string
  userId:      string
  versaoAtual: number
  criadoEm:   string
  atualizadoEm: string
  template:    { id: string; nome: string; nomeArquivo: string } | null
}

export interface FeeProposalVersionRow {
  id:        string
  versao:    number
  iaModel:   string
  criadoEm: string
  snapshot:  FeeProposalData
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function rowToData(r: {
  numeroProcesso: string; tribunal: string; vara: string; assunto: string
  partes: string; tipoPericia: string; endereco: string; quesitos: string
  peritoNome: string; peritoQualificacao: string; descricaoServicos: string
  resumoTecnico: string; metodologia: string; fasesEstimadas: string
  horasEstimadas: number | null; despesasPrevistas: string
  valorHonorarios: number | null; custoDeslocamento: number | null
  prazoEntrega: string; condicoesPagamento: string; observacoes: string
  riscosEPendencias: string; complexidade: string; dataProposta: string
  templateId: string | null; iaModel: string; iaRawOutput: string
  status: string
}): FeeProposalData {
  return {
    ...r,
    quesitos:         tryParse<string[]>(r.quesitos,         []),
    fasesEstimadas:   tryParse<string[]>(r.fasesEstimadas,   []),
    riscosEPendencias: tryParse<string[]>(r.riscosEPendencias, []),
    status: r.status as FeeProposalData['status'],
  }
}

function tryParse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) as T } catch { return fallback }
}

// ─── GET ────────────────────────────────────────────────────────────────────────

export async function getFeeProposal(
  periciaId: string,
  userId: string,
): Promise<FeeProposalRow | null> {
  try {
    const row = await prisma.feeProposal.findUnique({
      where:   { periciaId_userId: { periciaId, userId } },
      include: { template: { select: { id: true, nome: true, nomeArquivo: true } } },
    })
    if (!row) return null
    return {
      ...rowToData(row),
      id:          row.id,
      periciaId:   row.periciaId,
      userId:      row.userId,
      versaoAtual: row.versaoAtual,
      criadoEm:   row.criadoEm.toISOString(),
      atualizadoEm: row.atualizadoEm.toISOString(),
      template:    row.template,
    }
  } catch { return null }
}

export async function getFeeProposalVersions(
  periciaId: string,
  userId: string,
): Promise<FeeProposalVersionRow[]> {
  try {
    const proposal = await prisma.feeProposal.findUnique({
      where: { periciaId_userId: { periciaId, userId } },
      select: { id: true },
    })
    if (!proposal) return []

    const rows = await prisma.feeProposalVersion.findMany({
      where:   { proposalId: proposal.id },
      orderBy: { versao: 'desc' },
    })
    return rows.map((r) => ({
      id:      r.id,
      versao:  r.versao,
      iaModel: r.iaModel,
      criadoEm: r.criadoEm.toISOString(),
      snapshot: tryParse<FeeProposalData>(r.snapshot, {} as FeeProposalData),
    }))
  } catch { return [] }
}

// ─── UPSERT ─────────────────────────────────────────────────────────────────────

export type UpsertFeeProposalResult =
  | { ok: true; proposalId: string; versao: number }
  | { ok: false; error: string }

export async function upsertFeeProposal(
  periciaId: string,
  data: FeeProposalData,
): Promise<UpsertFeeProposalResult> {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  // Authorization check
  try {
    const pericia = await prisma.pericia.findUnique({
      where:  { id: periciaId },
      select: { peritoId: true },
    })
    if (!pericia || pericia.peritoId !== userId) {
      return { ok: false, error: 'Perícia não encontrada ou sem permissão' }
    }
  } catch {
    return { ok: false, error: 'Erro ao verificar perícia' }
  }

  const dbData = {
    numeroProcesso:     data.numeroProcesso,
    tribunal:           data.tribunal,
    vara:               data.vara,
    assunto:            data.assunto,
    partes:             data.partes,
    tipoPericia:        data.tipoPericia,
    endereco:           data.endereco,
    quesitos:           JSON.stringify(data.quesitos),
    peritoNome:         data.peritoNome,
    peritoQualificacao: data.peritoQualificacao,
    descricaoServicos:  data.descricaoServicos,
    resumoTecnico:      data.resumoTecnico,
    metodologia:        data.metodologia,
    fasesEstimadas:     JSON.stringify(data.fasesEstimadas),
    horasEstimadas:     data.horasEstimadas,
    despesasPrevistas:  data.despesasPrevistas,
    valorHonorarios:    data.valorHonorarios,
    custoDeslocamento:  data.custoDeslocamento,
    prazoEntrega:       data.prazoEntrega,
    condicoesPagamento: data.condicoesPagamento,
    observacoes:        data.observacoes,
    riscosEPendencias:  JSON.stringify(data.riscosEPendencias),
    complexidade:       data.complexidade,
    dataProposta:       data.dataProposta,
    templateId:         data.templateId,
    iaModel:            data.iaModel,
    iaRawOutput:        data.iaRawOutput,
    status:             data.status,
  }

  try {
    const existing = await prisma.feeProposal.findUnique({
      where:  { periciaId_userId: { periciaId, userId } },
      select: { id: true, versaoAtual: true },
    })

    if (existing && data.status === 'gerada') {
      // Save version snapshot before overwriting
      await prisma.feeProposalVersion.create({
        data: {
          proposalId: existing.id,
          versao:     existing.versaoAtual,
          snapshot:   JSON.stringify(data),
          iaModel:    data.iaModel,
        },
      })
    }

    const nextVersao = existing ? existing.versaoAtual + (data.status === 'gerada' ? 1 : 0) : 1

    const proposal = await prisma.feeProposal.upsert({
      where:  { periciaId_userId: { periciaId, userId } },
      create: { periciaId, userId, versaoAtual: 1, ...dbData },
      update: { versaoAtual: nextVersao, ...dbData },
      select: { id: true, versaoAtual: true },
    })

    revalidatePath(`/pericias/${periciaId}`)
    return { ok: true, proposalId: proposal.id, versao: proposal.versaoAtual }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao salvar proposta'
    console.error('[upsertFeeProposal]', msg)
    return { ok: false, error: msg }
  }
}

// ─── ACEITAR ────────────────────────────────────────────────────────────────────

export async function aceitarProposta(
  periciaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    const proposal = await prisma.feeProposal.findUnique({
      where:  { periciaId_userId: { periciaId, userId } },
      select: { id: true, valorHonorarios: true },
    })
    if (!proposal) return { ok: false, error: 'Proposta não encontrada' }

    await prisma.feeProposal.update({
      where: { id: proposal.id },
      data:  { status: 'aceita' },
    })

    // Sincroniza valor no campo da perícia para uso nos relatórios financeiros
    if (proposal.valorHonorarios != null) {
      await prisma.pericia.update({
        where: { id: periciaId },
        data:  { valorHonorarios: proposal.valorHonorarios },
      })
    }

    revalidatePath(`/pericias/${periciaId}`)
    revalidatePath('/financeiro')
    revalidatePath('/recebimentos')
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return { ok: false, error: msg }
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────────

export async function deleteFeeProposal(
  periciaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    const row = await prisma.feeProposal.findUnique({
      where:  { periciaId_userId: { periciaId, userId } },
      select: { id: true },
    })
    if (!row) return { ok: false, error: 'Proposta não encontrada' }

    await prisma.feeProposalVersion.deleteMany({ where: { proposalId: row.id } })
    await prisma.feeProposal.delete({ where: { id: row.id } })

    revalidatePath(`/pericias/${periciaId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao excluir' }
  }
}

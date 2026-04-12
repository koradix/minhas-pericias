'use server'

/**
 * Judit — Server actions.
 *
 * Fluxo principal (CPF):
 *   1. Busca processos por CPF na Judit
 *   2. Filtra: só processos onde o perito é nomeado (PERITO/keywords)
 *   3. Cria NomeacaoCitacao (NAO Pericia) → aparece na lista de nomeações
 *   4. Perito cria perícia manualmente pelo botão existente
 *
 * Fluxo perícia (CNJ):
 *   1. Busca processo por CNJ
 *   2. Sincroniza movimentações e anexos na perícia existente
 */

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { isJuditReady, juditLog, juditConfig } from '@/lib/integrations/judit/config'
import { judit } from '@/lib/integrations/judit/service'
import type { JuditFetchResult } from '@/lib/integrations/judit/service'
import { formatPartesString } from '@/lib/integrations/judit/mappers'
import { JUDIT_SOURCE } from '@/lib/integrations/judit/constants'
import type {
  NormalizedLawsuit,
  CpfSearchSyncResult,
  AttachmentDownloadResult,
} from '@/lib/integrations/judit/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface JuditSyncResult {
  ok: boolean
  message: string
  periciaId?: string
  requestId?: string
  created?: boolean
  movementsCount?: number
  attachmentsCount?: number
}

// ─── Filtro: só processos com nomeação de perito ────────────────────────────
// Roles que indicam que o perito foi NOMEADO (não que é parte no processo)
const PERITO_ROLES = ['PERITO', 'PERITA', 'EXPERT', 'ASSISTENTE TÉCNICO', 'ASSISTENTE TECNICO']
// Roles que DESCARTAM (perito é parte pessoal, não profissional)
const PARTE_PESSOAL_ROLES = ['AUTOR', 'AUTORA', 'REQUERENTE', 'RÉU', 'REU', 'REQUERIDO', 'REQUERIDA']
// Keywords em movimentações que indicam nomeação de perito
const PERITO_STEP_KEYWORDS = ['perit', 'expert', 'nomea.*perit', 'designa.*perit', 'laudo pericial']

function isNomeacaoRelevante(n: NormalizedLawsuit, peritoNome: string | null, peritoCpf: string | null): boolean {
  // 1. Perito aparece EXPLICITAMENTE como PERITO/PERITA nas partes
  const hasPeritoPart = n.partes.some((p) =>
    PERITO_ROLES.some((r) => p.tipo.toUpperCase().includes(r))
  )
  if (hasPeritoPart) return true

  // 2. Se perito aparece como PARTE PESSOAL (autor, réu, requerente) → DESCARTAR
  if (peritoNome || peritoCpf) {
    const cleanCpf = peritoCpf?.replace(/\D/g, '') ?? ''
    const nomeUpper = peritoNome?.toUpperCase() ?? ''

    const isPartePessoal = n.partes.some((p) => {
      const matchIdentity = (
        (cleanCpf && p.documento?.replace(/\D/g, '') === cleanCpf) ||
        (nomeUpper && p.nome.toUpperCase().includes(nomeUpper))
      )
      if (!matchIdentity) return false
      // Se é parte pessoal (autor, réu), NÃO é nomeação
      return PARTE_PESSOAL_ROLES.some((r) => p.tipo.toUpperCase().includes(r))
    })
    if (isPartePessoal) return false
  }

  // 3. Movimentações mencionam "perito" + nome do perito juntos
  if (peritoNome) {
    const nomeUpper = peritoNome.toUpperCase()
    const hasNomeacaoInSteps = n.movimentacoes.some((m) => {
      const text = (m.descricao + ' ' + (m.tipo ?? '')).toUpperCase()
      return text.includes('PERIT') && text.includes(nomeUpper)
    })
    if (hasNomeacaoInSteps) return true
  }

  // 4. Movimentações mencionam nomeação de perito (genérico)
  const hasPeritStep = n.movimentacoes.some((m) => {
    const text = (m.descricao + ' ' + (m.tipo ?? '')).toLowerCase()
    return PERITO_STEP_KEYWORDS.some((kw) => new RegExp(kw).test(text))
  })
  if (hasPeritStep) return true

  return false
}

// ─── Criar NomeacaoCitacao (NAO Pericia) ────────────────────────────────────

async function upsertCitacaoFromJudit(
  peritoId: string,
  normalized: NormalizedLawsuit,
): Promise<{ citacaoId: string; created: boolean }> {
  const cnj = normalized.cnj
  const externalId = `judit_${cnj.replace(/\D/g, '')}`

  const existing = await prisma.nomeacaoCitacao.findUnique({
    where: { peritoId_externalId: { peritoId, externalId } },
  })

  if (existing) {
    juditLog(`Citacao ja existe: ${existing.id} (CNJ: ${cnj})`)
    return { citacaoId: existing.id, created: false }
  }

  const partesStr = formatPartesString(normalized.partes)
  const snippet = [
    normalized.classe,
    normalized.assunto,
    `Partes: ${partesStr}`,
    normalized.juiz ? `Juiz: ${normalized.juiz}` : '',
  ].filter(Boolean).join(' — ')

  const citacao = await prisma.nomeacaoCitacao.create({
    data: {
      peritoId,
      externalId,
      diarioSigla: normalized.tribunal || 'JUDIT',
      diarioNome: `${normalized.tribunal} — ${normalized.vara}`,
      diarioData: normalized.dataDistribuicao ? new Date(normalized.dataDistribuicao) : new Date(),
      snippet: snippet.slice(0, 1000),
      numeroProcesso: cnj,
      linkCitacao: '',
      fonte: JUDIT_SOURCE,
      status: 'pendente',
    },
  })

  juditLog(`Citacao criada: ${citacao.id} (CNJ: ${cnj})`)
  return { citacaoId: citacao.id, created: true }
}

// ─── Sync movimentações (para perícia existente) ────────────────────────────

async function syncMovements(periciaId: string, normalized: NormalizedLawsuit): Promise<number> {
  let count = 0
  for (const mov of normalized.movimentacoes) {
    const externalId = mov.externalId ?? `${mov.data}_${mov.descricao.slice(0, 50)}`
    await prisma.processMovement.upsert({
      where: { periciaId_source_externalId: { periciaId, source: JUDIT_SOURCE, externalId } },
      create: {
        periciaId, source: JUDIT_SOURCE, externalId,
        eventDate: new Date(mov.data), type: mov.tipo,
        description: mov.descricao, content: mov.conteudo,
      },
      update: { description: mov.descricao, content: mov.conteudo, type: mov.tipo },
    })
    count++
  }
  return count
}

// ─── Sync anexos metadata (para perícia existente) ──────────────────────────

async function syncAttachments(periciaId: string, normalized: NormalizedLawsuit): Promise<number> {
  let count = 0
  for (const anexo of normalized.anexos) {
    await prisma.processAttachment.upsert({
      where: { periciaId_source_externalId: { periciaId, source: JUDIT_SOURCE, externalId: anexo.externalId } },
      create: {
        periciaId, source: JUDIT_SOURCE, externalId: anexo.externalId,
        name: anexo.nome, type: anexo.tipo, mimeType: anexo.mimeType,
        isPublic: anexo.isPublic, downloadAvailable: anexo.downloadAvailable,
        url: anexo.url, sizeBytes: anexo.tamanhoBytes,
        publishedAt: anexo.data ? new Date(anexo.data) : null,
        downloadStatus: 'pending',
      },
      update: { name: anexo.nome, type: anexo.tipo, downloadAvailable: anexo.downloadAvailable, url: anexo.url },
    })
    count++
  }
  return count
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Buscar nomeações por CPF → cria NomeacaoCitacao ────────────────────────

export async function fetchAndSyncByCpf(cpf: string): Promise<CpfSearchSyncResult> {
  const empty: CpfSearchSyncResult = {
    ok: false, message: '', cpf, totalProcessos: 0, processosComCnj: 0,
    processosSemCnj: 0, periciasCriadas: 0, periciasAtualizadas: 0,
    movimentacoesSincronizadas: 0, anexosSincronizados: 0, periciaIds: [],
  }

  if (!isJuditReady()) return { ...empty, message: 'Judit nao habilitada' }

  const session = await auth()
  if (!session?.user?.id) return { ...empty, message: 'Nao autenticado' }

  const cleanCpf = cpf.replace(/\D/g, '')
  if (cleanCpf.length !== 11) return { ...empty, message: 'CPF invalido (11 digitos)' }

  // Buscar nome do perito para filtrar
  const perfil = await prisma.peritoPerfil.findUnique({
    where: { userId: session.user.id },
    select: { cpf: true },
  })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  })

  try {
    const result = await judit.fetchProcessesByCpf(cleanCpf)

    if (!result) return { ...empty, message: 'Erro ao consultar Judit' }
    if (result.status === 'timeout') return { ...empty, message: `Timeout (id: ${result.requestId})`, requestId: result.requestId }
    if (result.status === 'failed') return { ...empty, message: `Falhou (id: ${result.requestId})`, requestId: result.requestId }

    const totalProcessos = result.normalized.length
    if (totalProcessos === 0) {
      return { ...empty, ok: true, message: `Nenhum processo para CPF ${cleanCpf}`, requestId: result.requestId }
    }

    juditLog(`CPF ${cleanCpf}: ${totalProcessos} processos, filtrando nomeações...`)

    // Filtrar: só processos relevantes (perito nomeado)
    const relevantes = result.normalized.filter((n) =>
      isNomeacaoRelevante(n, user?.name ?? null, perfil?.cpf ?? cleanCpf)
    )

    juditLog(`${relevantes.length} nomeações relevantes de ${totalProcessos} processos`)

    let criadas = 0
    let jaExistiam = 0
    let skippedNoCnj = 0
    const seenCnj = new Set<string>()

    for (const n of relevantes) {
      if (!n.cnj || n.cnj.trim().length < 10) { skippedNoCnj++; continue }
      const deduKey = n.cnj.replace(/\D/g, '')
      if (seenCnj.has(deduKey)) continue
      seenCnj.add(deduKey)

      const { created } = await upsertCitacaoFromJudit(session.user.id, n)
      if (created) criadas++
      else jaExistiam++
    }

    return {
      ok: true,
      message: `${totalProcessos} processos encontrados, ${relevantes.length} com nomeação, ${criadas} novas citações criadas`,
      requestId: result.requestId,
      cpf: cleanCpf,
      totalProcessos,
      processosComCnj: relevantes.length - skippedNoCnj,
      processosSemCnj: skippedNoCnj,
      periciasCriadas: criadas,
      periciasAtualizadas: jaExistiam,
      movimentacoesSincronizadas: 0,
      anexosSincronizados: 0,
      periciaIds: [],
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    juditLog('fetchAndSyncByCpf error:', msg)
    return { ...empty, message: `Erro: ${msg}` }
  }
}

// ─── Buscar por CNJ → sync pericias existente ──────────────────────────────

export async function fetchAndSyncByCnj(
  cnj: string,
  options?: { withAttachments?: boolean },
): Promise<JuditSyncResult> {
  if (!isJuditReady()) return { ok: false, message: 'Judit nao habilitada' }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Nao autenticado' }

  try {
    const result = await judit.fetchProcessByCnj(cnj, {
      withAttachments: options?.withAttachments ?? false,
    })
    if (!result) return { ok: false, message: 'Erro ao consultar Judit' }
    if (result.status === 'timeout') return { ok: false, message: 'Timeout', requestId: result.requestId }
    if (result.status === 'failed') return { ok: false, message: 'Falhou', requestId: result.requestId }
    if (result.normalized.length === 0) return { ok: false, message: 'Nenhum dado', requestId: result.requestId }

    const n = result.normalized[0]

    // Buscar pericia existente com esse CNJ
    const pericia = await prisma.pericia.findFirst({
      where: { peritoId: session.user.id, processo: cnj },
    })

    if (!pericia) {
      return { ok: false, message: 'Nenhuma perícia encontrada com esse CNJ. Crie a perícia primeiro.' }
    }

    // Atualizar dados da pericia
    const partesStr = formatPartesString(n.partes)
    await prisma.pericia.update({
      where: { id: pericia.id },
      data: {
        assunto: n.assunto || pericia.assunto,
        vara: n.vara || pericia.vara,
        partes: partesStr || pericia.partes,
        atualizadoEm: new Date(),
      },
    })

    const movementsCount = await syncMovements(pericia.id, n)
    const attachmentsCount = await syncAttachments(pericia.id, n)

    return {
      ok: true,
      message: `Sincronizado: ${movementsCount} movimentações, ${attachmentsCount} anexos`,
      periciaId: pericia.id,
      requestId: result.requestId,
      movementsCount,
      attachmentsCount,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    juditLog('fetchAndSyncByCnj error:', msg)
    return { ok: false, message: `Erro: ${msg}` }
  }
}

// ─── Re-sync pericias existente ─────────────────────────────────────────────

export async function syncPericia(periciaId: string): Promise<JuditSyncResult> {
  if (!isJuditReady()) return { ok: false, message: 'Judit nao habilitada' }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Nao autenticado' }

  const pericia = await prisma.pericia.findUnique({ where: { id: periciaId } })
  if (!pericia || pericia.peritoId !== session.user.id) return { ok: false, message: 'Pericia nao encontrada' }
  if (!pericia.processo) return { ok: false, message: 'Sem CNJ' }

  return fetchAndSyncByCnj(pericia.processo, { withAttachments: false })
}

// ─── Download de anexos ─────────────────────────────────────────────────────

export async function downloadPericiaAttachments(periciaId: string): Promise<AttachmentDownloadResult> {
  const empty: AttachmentDownloadResult = {
    ok: false, message: '', periciaId,
    totalAnexos: 0, jaExistiam: 0, baixados: 0, falharam: 0, apenasMetadata: 0,
  }

  if (!isJuditReady()) return { ...empty, message: 'Judit nao habilitada' }
  if (!juditConfig.useAttachments) return { ...empty, message: 'Download desabilitado (JUDIT_USE_ATTACHMENTS=false)' }

  const session = await auth()
  if (!session?.user?.id) return { ...empty, message: 'Nao autenticado' }

  const pericia = await prisma.pericia.findUnique({ where: { id: periciaId } })
  if (!pericia || pericia.peritoId !== session.user.id) return { ...empty, message: 'Pericia nao encontrada' }
  if (!pericia.processo) return { ...empty, message: 'Pericia sem CNJ — nao e possivel baixar anexos' }

  // ─── Passo 1: Re-request com with_attachments para Judit capturar os arquivos
  juditLog(`Download attachments: re-sync CNJ ${pericia.processo} com with_attachments=true`)
  const syncResult = await fetchAndSyncByCnj(pericia.processo, { withAttachments: true })
  if (!syncResult.ok) {
    juditLog(`Re-sync falhou: ${syncResult.message}`)
    // Continua mesmo se falhou — tenta baixar o que ja tem
  }

  // ─── Passo 2: Buscar anexos pendentes (inclui unavailable)
  const attachments = await prisma.processAttachment.findMany({
    where: {
      periciaId,
      source: JUDIT_SOURCE,
      downloadStatus: { in: ['pending', 'failed', 'unavailable'] },
    },
  })

  if (attachments.length === 0) {
    const total = await prisma.processAttachment.count({ where: { periciaId, source: JUDIT_SOURCE } })
    const downloaded = await prisma.processAttachment.count({ where: { periciaId, source: JUDIT_SOURCE, downloadStatus: 'downloaded' } })
    return { ...empty, ok: true, message: `Nenhum pendente (${downloaded}/${total} baixados)`, totalAnexos: total, jaExistiam: downloaded }
  }

  // ─── Passo 3: Baixar cada anexo via endpoint lawsuits
  let baixados = 0, falharam = 0, apenasMetadata = 0

  for (const att of attachments) {
    // Construir URL: /lawsuits/{cnj}/{instance}/attachments/{attachmentId}
    const downloadUrl = att.url ?? judit.buildAttachmentUrl(pericia.processo, 1, att.externalId)

    // Pular anexos marcados como nao disponiveis pelo provedor
    if (!att.downloadAvailable) {
      await prisma.processAttachment.update({ where: { id: att.id }, data: { downloadStatus: 'unavailable', downloadError: 'Nao disponivel no provedor', url: downloadUrl } })
      apenasMetadata++
      continue
    }

    try {
      const result = await judit.downloadAttachment(downloadUrl)
      if (!result) {
        await prisma.processAttachment.update({ where: { id: att.id }, data: { downloadStatus: 'failed', downloadError: 'Resposta vazia (arquivo nao capturado pela Judit)', url: downloadUrl } })
        falharam++
        continue
      }

      await prisma.processAttachment.update({
        where: { id: att.id },
        data: { url: downloadUrl, mimeType: result.contentType, sizeBytes: result.buffer.length, downloadStatus: 'downloaded', downloadedAt: new Date(), downloadError: null },
      })
      baixados++
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      await prisma.processAttachment.update({ where: { id: att.id }, data: { downloadStatus: 'failed', downloadError: errMsg.slice(0, 500), url: downloadUrl } })
      falharam++
    }
  }

  const totalAnexos = await prisma.processAttachment.count({ where: { periciaId, source: JUDIT_SOURCE } })
  const jaExistiam = await prisma.processAttachment.count({ where: { periciaId, source: JUDIT_SOURCE, downloadStatus: 'downloaded' } })

  return { ok: true, message: `${baixados} baixados, ${falharam} falharam, ${apenasMetadata} sem arquivo`, periciaId, totalAnexos, jaExistiam, baixados, falharam, apenasMetadata }
}


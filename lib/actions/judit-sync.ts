'use server'

/**
 * Judit — Server actions para sincronizar dados Judit → DB.
 *
 * Fluxos:
 *   fetchAndSyncByCnj(cnj)   — busca 1 processo por CNJ
 *   fetchAndSyncByCpf(cpf)   — busca N processos por CPF
 *   syncPericia(periciaId)   — re-sync de pericia existente
 *   downloadPericiaAttachments(periciaId) — baixa anexos reais
 *
 * Isolado do Escavador. Protegido por feature flag.
 * Deduplicacao: CNJ + peritoId (campo Pericia.processo).
 */

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { put } from '@vercel/blob'
import { isJuditReady, juditLog } from '@/lib/integrations/judit/config'
import { juditConfig } from '@/lib/integrations/judit/config'
import { judit } from '@/lib/integrations/judit/service'
import type { JuditFetchResult } from '@/lib/integrations/judit/service'
import { formatPartesString } from '@/lib/integrations/judit/mappers'
import { JUDIT_SOURCE } from '@/lib/integrations/judit/constants'
import type {
  NormalizedLawsuit,
  CpfSearchSyncResult,
  AttachmentDownloadResult,
} from '@/lib/integrations/judit/types'

// ─── Shared result type for single-process sync ─────────────────────────────

export interface JuditSyncResult {
  ok: boolean
  message: string
  periciaId?: string
  requestId?: string
  created?: boolean
  movementsCount?: number
  attachmentsCount?: number
}

// ─── Upsert pericia (strong dedup by CNJ + peritoId) ────────────────────────

async function upsertPericiaFromJudit(
  peritoId: string,
  normalized: NormalizedLawsuit,
): Promise<{ periciaId: string; created: boolean }> {
  const cnj = normalized.cnj

  // Dedup: busca por CNJ exato no campo processo
  const existing = await prisma.pericia.findFirst({
    where: { peritoId, processo: cnj },
  })

  const partesStr = formatPartesString(normalized.partes)

  if (existing) {
    await prisma.pericia.update({
      where: { id: existing.id },
      data: {
        assunto: normalized.assunto || existing.assunto,
        vara: normalized.vara || existing.vara,
        partes: partesStr || existing.partes,
        atualizadoEm: new Date(),
      },
    })
    juditLog(`Pericia atualizada: ${existing.id} (CNJ: ${cnj})`)
    return { periciaId: existing.id, created: false }
  }

  const pericia = await prisma.pericia.create({
    data: {
      peritoId,
      numero: cnj.replace(/[^\d]/g, '').slice(0, 20) || cnj.slice(0, 20),
      assunto: normalized.assunto || `Processo ${cnj}`,
      tipo: normalized.classe || 'Perícia Judicial',
      processo: cnj,
      vara: normalized.vara || null,
      partes: partesStr || null,
      status: 'processo_importado',
      tags: JSON.stringify([JUDIT_SOURCE]),
    },
  })
  juditLog(`Pericia criada: ${pericia.id} (CNJ: ${cnj})`)
  return { periciaId: pericia.id, created: true }
}

// ─── Sync movimentacoes ─────────────────────────────────────────────────────

async function syncMovements(
  periciaId: string,
  normalized: NormalizedLawsuit,
): Promise<number> {
  let count = 0
  for (const mov of normalized.movimentacoes) {
    const externalId = mov.externalId ?? `${mov.data}_${mov.descricao.slice(0, 50)}`

    await prisma.processMovement.upsert({
      where: {
        periciaId_source_externalId: {
          periciaId,
          source: JUDIT_SOURCE,
          externalId,
        },
      },
      create: {
        periciaId,
        source: JUDIT_SOURCE,
        externalId,
        eventDate: new Date(mov.data),
        type: mov.tipo,
        description: mov.descricao,
        content: mov.conteudo,
        rawJson: null,
      },
      update: {
        description: mov.descricao,
        content: mov.conteudo,
        type: mov.tipo,
      },
    })
    count++
  }
  juditLog(`Movimentacoes sincronizadas: ${count} para pericia ${periciaId}`)
  return count
}

// ─── Sync anexos (metadata) ─────────────────────────────────────────────────

async function syncAttachments(
  periciaId: string,
  normalized: NormalizedLawsuit,
): Promise<number> {
  let count = 0
  for (const anexo of normalized.anexos) {
    await prisma.processAttachment.upsert({
      where: {
        periciaId_source_externalId: {
          periciaId,
          source: JUDIT_SOURCE,
          externalId: anexo.externalId,
        },
      },
      create: {
        periciaId,
        source: JUDIT_SOURCE,
        externalId: anexo.externalId,
        name: anexo.nome,
        type: anexo.tipo,
        mimeType: anexo.mimeType,
        isPublic: anexo.isPublic,
        downloadAvailable: anexo.downloadAvailable,
        url: anexo.url,
        sizeBytes: anexo.tamanhoBytes,
        publishedAt: anexo.data ? new Date(anexo.data) : null,
        downloadStatus: 'pending',
      },
      update: {
        name: anexo.nome,
        type: anexo.tipo,
        downloadAvailable: anexo.downloadAvailable,
        url: anexo.url,
      },
    })
    count++
  }
  juditLog(`Anexos sincronizados (metadata): ${count} para pericia ${periciaId}`)
  return count
}

// ─── Sync completo de 1 processo normalizado ────────────────────────────────

async function syncOneProcess(
  peritoId: string,
  normalized: NormalizedLawsuit,
): Promise<{ periciaId: string; created: boolean; movCount: number; attCount: number }> {
  const { periciaId, created } = await upsertPericiaFromJudit(peritoId, normalized)
  const movCount = await syncMovements(periciaId, normalized)
  const attCount = await syncAttachments(periciaId, normalized)
  return { periciaId, created, movCount, attCount }
}

// ─── Helper: processar resultado multi-processo ─────────────────────────────

async function syncFetchResult(
  peritoId: string,
  result: JuditFetchResult,
): Promise<{
  periciaIds: string[]
  created: number
  updated: number
  movTotal: number
  attTotal: number
  skippedNoCnj: number
}> {
  let created = 0
  let updated = 0
  let movTotal = 0
  let attTotal = 0
  let skippedNoCnj = 0
  const periciaIds: string[] = []

  // Consolidar por CNJ para evitar duplicidade quando multiplas instancias
  // do mesmo processo aparecem
  const seenCnj = new Set<string>()

  for (const n of result.normalized) {
    // Validar CNJ
    if (!n.cnj || n.cnj.trim().length < 10) {
      juditLog(`Processo sem CNJ confiavel, pulando: ${JSON.stringify({ assunto: n.assunto, tribunal: n.tribunal })}`)
      skippedNoCnj++
      continue
    }

    // Consolidar: se ja vimos esse CNJ nesta batch, pular (evita duplicidade)
    const deduKey = n.cnj.replace(/\D/g, '')
    if (seenCnj.has(deduKey)) {
      juditLog(`CNJ duplicado na mesma batch, pulando: ${n.cnj}`)
      continue
    }
    seenCnj.add(deduKey)

    const r = await syncOneProcess(peritoId, n)
    periciaIds.push(r.periciaId)
    if (r.created) created++
    else updated++
    movTotal += r.movCount
    attTotal += r.attCount
  }

  return { periciaIds, created, updated, movTotal, attTotal, skippedNoCnj }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Buscar por CNJ ─────────────────────────────────────────────────────────

export async function fetchAndSyncByCnj(cnj: string): Promise<JuditSyncResult> {
  if (!isJuditReady()) {
    return { ok: false, message: 'Judit nao esta habilitada (JUDIT_ENABLED=false)' }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, message: 'Nao autenticado' }
  }

  try {
    const result = await judit.fetchProcessByCnj(cnj)

    if (!result) {
      return { ok: false, message: 'Erro ao consultar Judit' }
    }
    if (result.status === 'timeout') {
      return { ok: false, message: `Request timeout (id: ${result.requestId})`, requestId: result.requestId }
    }
    if (result.status === 'failed') {
      return { ok: false, message: `Request falhou (id: ${result.requestId})`, requestId: result.requestId }
    }
    if (result.normalized.length === 0) {
      return { ok: false, message: 'Nenhum dado retornado pela Judit', requestId: result.requestId }
    }

    const { periciaIds, created, movTotal, attTotal } = await syncFetchResult(session.user.id, result)

    return {
      ok: true,
      message: created > 0 ? 'Pericia criada via Judit' : 'Pericia atualizada via Judit',
      periciaId: periciaIds[0],
      requestId: result.requestId,
      created: created > 0,
      movementsCount: movTotal,
      attachmentsCount: attTotal,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    juditLog('fetchAndSyncByCnj error:', msg)
    return { ok: false, message: `Erro: ${msg}` }
  }
}

// ─── Buscar por CPF ─────────────────────────────────────────────────────────

export async function fetchAndSyncByCpf(cpf: string): Promise<CpfSearchSyncResult> {
  const empty: CpfSearchSyncResult = {
    ok: false, message: '', cpf, totalProcessos: 0, processosComCnj: 0,
    processosSemCnj: 0, periciasCriadas: 0, periciasAtualizadas: 0,
    movimentacoesSincronizadas: 0, anexosSincronizados: 0, periciaIds: [],
  }

  if (!isJuditReady()) {
    return { ...empty, message: 'Judit nao esta habilitada (JUDIT_ENABLED=false)' }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { ...empty, message: 'Nao autenticado' }
  }

  const cleanCpf = cpf.replace(/\D/g, '')
  if (cleanCpf.length !== 11) {
    return { ...empty, message: 'CPF invalido (deve ter 11 digitos)' }
  }

  try {
    const result = await judit.fetchProcessesByCpf(cleanCpf)

    if (!result) {
      return { ...empty, message: 'Erro ao consultar Judit' }
    }
    if (result.status === 'timeout') {
      return { ...empty, message: `Request timeout (id: ${result.requestId})`, requestId: result.requestId }
    }
    if (result.status === 'failed') {
      return { ...empty, message: `Request falhou (id: ${result.requestId})`, requestId: result.requestId }
    }

    const totalProcessos = result.normalized.length

    if (totalProcessos === 0) {
      return {
        ...empty,
        ok: true,
        message: `Nenhum processo encontrado para CPF ${cleanCpf}`,
        requestId: result.requestId,
      }
    }

    juditLog(`CPF ${cleanCpf}: ${totalProcessos} processos encontrados`)

    const sync = await syncFetchResult(session.user.id, result)

    return {
      ok: true,
      message: `CPF ${cleanCpf}: ${totalProcessos} processos encontrados, ${sync.created} pericias criadas, ${sync.updated} atualizadas`,
      requestId: result.requestId,
      cpf: cleanCpf,
      totalProcessos,
      processosComCnj: totalProcessos - sync.skippedNoCnj,
      processosSemCnj: sync.skippedNoCnj,
      periciasCriadas: sync.created,
      periciasAtualizadas: sync.updated,
      movimentacoesSincronizadas: sync.movTotal,
      anexosSincronizados: sync.attTotal,
      periciaIds: sync.periciaIds,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    juditLog('fetchAndSyncByCpf error:', msg)
    return { ...empty, message: `Erro: ${msg}` }
  }
}

// ─── Re-sync pericia existente ──────────────────────────────────────────────

export async function syncPericia(periciaId: string): Promise<JuditSyncResult> {
  if (!isJuditReady()) {
    return { ok: false, message: 'Judit nao esta habilitada' }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, message: 'Nao autenticado' }
  }

  const pericia = await prisma.pericia.findUnique({ where: { id: periciaId } })
  if (!pericia || pericia.peritoId !== session.user.id) {
    return { ok: false, message: 'Pericia nao encontrada' }
  }

  if (!pericia.processo) {
    return { ok: false, message: 'Pericia nao tem numero de processo (CNJ)' }
  }

  return fetchAndSyncByCnj(pericia.processo)
}

// ─── Download real dos anexos ───────────────────────────────────────────────

export async function downloadPericiaAttachments(periciaId: string): Promise<AttachmentDownloadResult> {
  const empty: AttachmentDownloadResult = {
    ok: false, message: '', periciaId,
    totalAnexos: 0, jaExistiam: 0, baixados: 0, falharam: 0, apenasMetadata: 0,
  }

  if (!isJuditReady()) {
    return { ...empty, message: 'Judit nao esta habilitada' }
  }
  if (!juditConfig.useAttachments) {
    return { ...empty, message: 'Download de anexos desabilitado (JUDIT_USE_ATTACHMENTS=false)' }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { ...empty, message: 'Nao autenticado' }
  }

  const pericia = await prisma.pericia.findUnique({ where: { id: periciaId } })
  if (!pericia || pericia.peritoId !== session.user.id) {
    return { ...empty, message: 'Pericia nao encontrada' }
  }

  // Buscar anexos pendentes ou que falharam (retry)
  const attachments = await prisma.processAttachment.findMany({
    where: {
      periciaId,
      source: JUDIT_SOURCE,
      downloadStatus: { in: ['pending', 'failed'] },
    },
  })

  if (attachments.length === 0) {
    // Contar os ja baixados
    const total = await prisma.processAttachment.count({ where: { periciaId, source: JUDIT_SOURCE } })
    const downloaded = await prisma.processAttachment.count({ where: { periciaId, source: JUDIT_SOURCE, downloadStatus: 'downloaded' } })
    return {
      ...empty,
      ok: true,
      message: `Nenhum anexo pendente (${downloaded}/${total} ja baixados)`,
      totalAnexos: total,
      jaExistiam: downloaded,
    }
  }

  let baixados = 0
  let falharam = 0
  let apenasMetadata = 0

  for (const att of attachments) {
    // Sem URL = apenas metadata
    if (!att.url) {
      await prisma.processAttachment.update({
        where: { id: att.id },
        data: { downloadStatus: 'unavailable', downloadError: 'Sem URL de download' },
      })
      apenasMetadata++
      continue
    }

    // Ja tem blob = ja baixou antes (safety check)
    if (att.blobUrl && att.downloadStatus !== 'failed') {
      apenasMetadata++
      continue
    }

    try {
      const result = await judit.downloadAttachment(att.url)

      if (!result) {
        await prisma.processAttachment.update({
          where: { id: att.id },
          data: { downloadStatus: 'failed', downloadError: 'Download retornou vazio ou indisponivel' },
        })
        falharam++
        continue
      }

      // Inferir extensao do mime type
      const ext = mimeToExt(result.contentType)
      const safeName = (result.fileName ?? att.name ?? 'documento').replace(/[^a-zA-Z0-9._-]/g, '_')
      const pathname = `judit-attachments/${periciaId}/${att.externalId}/${safeName}${ext ? `.${ext}` : ''}`

      // Upload para Vercel Blob
      const blob = await put(pathname, result.buffer, {
        access: 'public',
        contentType: result.contentType,
        addRandomSuffix: false,
      })

      await prisma.processAttachment.update({
        where: { id: att.id },
        data: {
          blobUrl: blob.url,
          blobPathname: blob.pathname,
          mimeType: result.contentType,
          sizeBytes: result.buffer.length,
          downloadStatus: 'downloaded',
          downloadedAt: new Date(),
          downloadError: null,
        },
      })

      juditLog(`Anexo baixado: ${att.name} → ${blob.url} (${result.buffer.length} bytes)`)
      baixados++
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      await prisma.processAttachment.update({
        where: { id: att.id },
        data: { downloadStatus: 'failed', downloadError: errMsg.slice(0, 500) },
      })
      juditLog(`Erro ao baixar anexo ${att.id}: ${errMsg}`)
      falharam++
    }
  }

  const totalAnexos = await prisma.processAttachment.count({ where: { periciaId, source: JUDIT_SOURCE } })
  const jaExistiam = await prisma.processAttachment.count({ where: { periciaId, source: JUDIT_SOURCE, downloadStatus: 'downloaded' } })

  return {
    ok: true,
    message: `Download concluido: ${baixados} baixados, ${falharam} falharam, ${apenasMetadata} sem URL`,
    periciaId,
    totalAnexos,
    jaExistiam,
    baixados,
    falharam,
    apenasMetadata,
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'text/html': 'html',
    'text/plain': 'txt',
  }
  return map[mime.split(';')[0].trim()] ?? ''
}

'use server'

/**
 * Carregar Autos via Judit — só download.
 *
 * 1. Sync pericia com with_attachments=true (Judit crawls os PDFs do tribunal)
 * 2. Baixa os PDFs prontos (status: done) e salva URL no banco
 *
 * A análise IA é uma etapa separada (plano pago).
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isJuditReady, juditLog } from '@/lib/integrations/judit/config'
import { judit } from '@/lib/integrations/judit/service'
import { JUDIT_SOURCE } from '@/lib/integrations/judit/constants'
import { fetchAndSyncByCnj } from './judit-sync'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CarregarAutosResult {
  ok: boolean
  message: string
  periciaId: string
  fase: 'sync' | 'download' | 'concluido'
  anexosBaixados: number
  totalAnexos: number
}

// ─── Action principal ───────────────────────────────────────────────────────

export async function carregarAutosJudit(periciaId: string): Promise<CarregarAutosResult> {
  const empty: CarregarAutosResult = {
    ok: false, message: '', periciaId,
    fase: 'sync', anexosBaixados: 0, totalAnexos: 0,
  }

  if (!isJuditReady()) return { ...empty, message: 'Judit nao habilitada' }

  const session = await auth()
  if (!session?.user?.id) return { ...empty, message: 'Nao autenticado' }

  const pericia = await prisma.pericia.findUnique({ where: { id: periciaId } })
  if (!pericia || pericia.peritoId !== session.user.id) return { ...empty, message: 'Pericia nao encontrada' }
  if (!pericia.processo) return { ...empty, message: 'Pericia sem numero de processo (CNJ)' }

  const cnj = pericia.processo

  // ─── Fase 1: Sync com with_attachments ──────────────────────────────────

  juditLog(`[carregar-autos] Fase 1: sync CNJ ${cnj} com with_attachments=true`)
  const syncResult = await fetchAndSyncByCnj(cnj, { withAttachments: true })
  if (!syncResult.ok) {
    return { ...empty, fase: 'sync', message: `Sync falhou: ${syncResult.message}` }
  }

  // ─── Fase 2: Baixar PDFs que estao prontos ──────────────────────────────

  juditLog('[carregar-autos] Fase 2: baixando documentos...')
  const pendentes = await prisma.processAttachment.findMany({
    where: {
      periciaId,
      source: JUDIT_SOURCE,
      downloadStatus: { in: ['pending', 'failed', 'unavailable'] },
    },
  })

  let baixados = 0
  for (const att of pendentes) {
    const downloadUrl = att.url ?? judit.buildAttachmentUrl(cnj, 1, att.externalId)
    try {
      const result = await judit.downloadAttachment(downloadUrl)
      if (!result) {
        await prisma.processAttachment.update({
          where: { id: att.id },
          data: { downloadStatus: 'failed', downloadError: 'Resposta vazia', url: downloadUrl },
        })
        continue
      }
      await prisma.processAttachment.update({
        where: { id: att.id },
        data: {
          url: downloadUrl,
          mimeType: result.contentType,
          sizeBytes: result.buffer.length,
          downloadStatus: 'downloaded',
          downloadedAt: new Date(),
          downloadError: null,
        },
      })
      baixados++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await prisma.processAttachment.update({
        where: { id: att.id },
        data: { downloadStatus: 'failed', downloadError: msg.slice(0, 500), url: downloadUrl },
      })
    }
  }

  const totalAnexos = await prisma.processAttachment.count({
    where: { periciaId, source: JUDIT_SOURCE },
  })
  const jaDownloaded = await prisma.processAttachment.count({
    where: { periciaId, source: JUDIT_SOURCE, downloadStatus: 'downloaded' },
  })

  juditLog(`[carregar-autos] Concluido: ${baixados} novos, ${jaDownloaded}/${totalAnexos} total`)

  return {
    ok: true,
    fase: 'concluido',
    message: `${jaDownloaded} de ${totalAnexos} documentos disponíveis`,
    periciaId,
    anexosBaixados: baixados,
    totalAnexos,
  }
}

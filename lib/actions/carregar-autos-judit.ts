'use server'

/**
 * Carregar Autos via Judit — FLUXO ASYNC.
 *
 * Fase 1: Cria request na Judit (instantâneo, <2s)
 * Fase 2: Cliente faz polling do status (GET /request-status)
 * Fase 3: Quando completed, sync dados no banco
 *
 * NÃO faz polling no servidor — evita timeout na Vercel.
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isJuditReady, juditLog } from '@/lib/integrations/judit/config'
import { judit } from '@/lib/integrations/judit/service'
import { JUDIT_SOURCE } from '@/lib/integrations/judit/constants'
import { normalizeLawsuit } from '@/lib/integrations/judit/mappers'
import type { JuditResponsesPage } from '@/lib/integrations/judit/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CarregarAutosResult {
  ok: boolean
  message: string
  periciaId: string
  fase: 'request_criado' | 'ja_pendente' | 'sync_ok' | 'erro'
  requestId?: string
  anexosBaixados?: number
  totalAnexos?: number
}

// ─── Fase 1: Criar request (instantâneo) ────────────────────────────────────

export async function iniciarCarregamento(periciaId: string): Promise<CarregarAutosResult> {
  const empty: CarregarAutosResult = { ok: false, message: '', periciaId, fase: 'erro' }

  if (!isJuditReady()) return { ...empty, message: 'Judit não habilitada' }

  const session = await auth()
  if (!session?.user?.id) return { ...empty, message: 'Não autenticado' }

  const pericia = await prisma.pericia.findUnique({ where: { id: periciaId } })
  if (!pericia || pericia.peritoId !== session.user.id) return { ...empty, message: 'Perícia não encontrada' }
  if (!pericia.processo) return { ...empty, message: 'Perícia sem número de processo (CNJ)' }

  // Se já tem request pendente recente (<1h), retorna ele
  if (pericia.juditRequestId && pericia.juditRequestAt) {
    const age = Date.now() - pericia.juditRequestAt.getTime()
    if (age < 60 * 60 * 1000) {
      return {
        ok: true, periciaId, fase: 'ja_pendente',
        message: 'Request já em andamento',
        requestId: pericia.juditRequestId,
      }
    }
  }

  // Criar request na Judit (instantâneo — não faz polling)
  try {
    const req = await judit.createRequest('lawsuit_cnj', pericia.processo, { withAttachments: true })
    juditLog(`[carregar-autos] Request criado: ${req.request_id}`)

    // Salvar request ID na perícia
    await prisma.pericia.update({
      where: { id: periciaId },
      data: { juditRequestId: req.request_id, juditRequestAt: new Date() },
    })

    return {
      ok: true, periciaId, fase: 'request_criado',
      message: 'Sincronizando com o tribunal...',
      requestId: req.request_id,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    juditLog(`[carregar-autos] Erro: ${msg}`)
    return { ...empty, message: `Erro: ${msg}` }
  }
}

// ─── Fase 3: Sync dados após completed ──────────────────────────────────────

export async function sincronizarDados(periciaId: string): Promise<CarregarAutosResult> {
  const empty: CarregarAutosResult = { ok: false, message: '', periciaId, fase: 'erro' }

  const session = await auth()
  if (!session?.user?.id) return { ...empty, message: 'Não autenticado' }

  const pericia = await prisma.pericia.findUnique({ where: { id: periciaId } })
  if (!pericia || pericia.peritoId !== session.user.id) return { ...empty, message: 'Perícia não encontrada' }
  if (!pericia.juditRequestId) return { ...empty, message: 'Nenhum request pendente' }

  // Buscar responses da Judit
  try {
    let page = 1
    let totalPages = 1
    let totalAnexos = 0

    do {
      const resp: JuditResponsesPage = await judit.getResponses(pericia.juditRequestId, page)
      totalPages = resp.all_pages_count ?? 1

      for (const item of resp.page_data ?? []) {
        if (!item.response_data?.code) continue
        const normalized = normalizeLawsuit(item.response_data)

        // Atualizar dados da perícia
        if (page === 1) {
          const partesStr = normalized.partes
            .filter(p => !['ADVOGADO', 'ADVOGADA'].includes(p.tipo.toUpperCase()))
            .map(p => `${p.tipo.toUpperCase()}: ${p.nome}`)
            .join(' × ')

          await prisma.pericia.update({
            where: { id: periciaId },
            data: {
              assunto: normalized.assunto || pericia.assunto,
              vara: normalized.vara || pericia.vara,
              partes: partesStr || pericia.partes,
            },
          })
        }

        // Sync movimentações
        for (const mov of normalized.movimentacoes) {
          const externalId = mov.externalId ?? `${mov.data}_${mov.descricao.slice(0, 50)}`
          await prisma.processMovement.upsert({
            where: { periciaId_source_externalId: { periciaId, source: JUDIT_SOURCE, externalId } },
            create: { periciaId, source: JUDIT_SOURCE, externalId, eventDate: new Date(mov.data), type: mov.tipo, description: mov.descricao },
            update: { description: mov.descricao, type: mov.tipo },
          }).catch(() => {})
        }

        // Sync anexos
        for (const anexo of normalized.anexos) {
          const url = pericia.processo
            ? judit.buildAttachmentUrl(pericia.processo, 1, anexo.externalId)
            : null
          await prisma.processAttachment.upsert({
            where: { periciaId_source_externalId: { periciaId, source: JUDIT_SOURCE, externalId: anexo.externalId } },
            create: {
              periciaId, source: JUDIT_SOURCE, externalId: anexo.externalId,
              name: anexo.nome, type: anexo.tipo, mimeType: anexo.mimeType,
              isPublic: anexo.isPublic, downloadAvailable: anexo.downloadAvailable,
              url, downloadStatus: anexo.downloadAvailable ? 'downloaded' : 'pending',
              publishedAt: anexo.data ? new Date(anexo.data) : null,
            },
            update: { name: anexo.nome, downloadAvailable: anexo.downloadAvailable, url },
          }).catch(() => {})
          totalAnexos++
        }
      }
      page++
    } while (page <= totalPages)

    const totalDB = await prisma.processAttachment.count({ where: { periciaId, source: JUDIT_SOURCE } })

    return {
      ok: true, periciaId, fase: 'sync_ok',
      message: `${totalDB} documentos sincronizados`,
      totalAnexos: totalDB,
      anexosBaixados: totalAnexos,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ...empty, message: `Erro sync: ${msg}` }
  }
}

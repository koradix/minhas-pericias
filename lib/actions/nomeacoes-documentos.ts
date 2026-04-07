'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { radar } from '@/lib/services/radar'
import { EscavadorService } from '@/lib/services/escavador'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuscarDocumentosResult =
  | { ok: true; novos: number; total: number; suportado: boolean; atualizacaoSolicitada?: boolean }
  | { ok: false; error: string }

export type ProcessoDocumentoRow = {
  id: string
  escavadorDocId: number | null
  chaveV2: string | null
  nome: string
  tipo: string | null
  dataPublicacao: string | null
  urlPublica: string | null
  paginas: number | null
  baixado: boolean
  blobUrl: string | null
}

// ─── Action 1 — Buscar e persistir documentos do processo via Escavador ──────
//
// Fluxo v2 (preferencial):
//   1. solicitar-atualizacao com documentos_publicos=1 (aciona robôs async)
//   2. listar documentos-publicos (pode retornar lista se já processado)
//
// Fluxo v1 (fallback se v2 retornar vazio):
//   Usa escavadorId numérico via endpoint legado

export async function buscarDocumentosNomeacao(
  nomeacaoId: string,
): Promise<BuscarDocumentosResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    const nomeacao = await prisma.nomeacao.findUnique({
      where: { id: nomeacaoId },
      include: { processo: true },
    })
    if (!nomeacao || nomeacao.peritoId !== userId) {
      return { ok: false, error: 'Nomeação não encontrada' }
    }

    const escavador = radar as EscavadorService
    const cnj = nomeacao.processo.numeroProcesso

    // ── Passo 1 — Solicitar atualização v2 (aciona robôs para buscar docs) ──
    const atualizacao = await escavador.solicitarAtualizacaoV2(cnj, { documentos_publicos: true })
    if (!atualizacao.ok) {
      console.warn('[nomeacoes-documentos] solicitar-atualizacao falhou:', atualizacao.message)
    }

    // ── Passo 2 — Listar documentos públicos v2 ──────────────────────────────
    const docsV2 = await escavador.listarDocumentosPublicosV2(cnj)

    let novos = 0

    if (docsV2.length > 0) {
      // Persistir documentos v2
      for (const doc of docsV2) {
        try {
          const existing = await prisma.processoDocumento.findFirst({
            where: { processoId: nomeacao.processoId, chaveV2: doc.key },
          })
          if (!existing) {
            await prisma.processoDocumento.create({
              data: {
                processoId:     nomeacao.processoId,
                chaveV2:        doc.key,
                nome:           doc.nome,
                tipo:           doc.tipo ?? null,
                dataPublicacao: doc.data ? new Date(doc.data) : null,
                urlPublica:     doc.url ?? null,
                paginas:        doc.paginas ?? null,
              },
            })
            novos++
          }
        } catch { /* skip duplicates */ }
      }
    } else {
      // ── Fallback v1 ─────────────────────────────────────────────────────────
      let escavadorId = nomeacao.processo.escavadorId
      if (!escavadorId) {
        const proc = await escavador.buscarProcesso(cnj, nomeacao.processo.tribunal)
        if (proc?.id) {
          escavadorId = proc.id
          await prisma.processo.update({ where: { id: nomeacao.processoId }, data: { escavadorId } })
        }
      }
      if (escavadorId) {
        const docsV1 = await escavador.listarDocumentos(escavadorId)
        for (const doc of docsV1) {
          try {
            const existing = await prisma.processoDocumento.findUnique({
              where: { processoId_escavadorDocId: { processoId: nomeacao.processoId, escavadorDocId: doc.id } },
            })
            if (!existing) {
              await prisma.processoDocumento.create({
                data: {
                  processoId:     nomeacao.processoId,
                  escavadorDocId: doc.id,
                  nome:           doc.nome,
                  tipo:           doc.tipo ?? null,
                  dataPublicacao: doc.data ? new Date(doc.data) : null,
                  urlPublica:     doc.url ?? null,
                  paginas:        doc.paginas ?? null,
                },
              })
              novos++
            }
          } catch { /* skip */ }
        }
      }
    }

    const total = await prisma.processoDocumento.count({ where: { processoId: nomeacao.processoId } })
    return {
      ok: true,
      novos,
      total,
      suportado: docsV2.length > 0 || novos > 0,
      // Se solicitar-atualizacao ok mas lista ainda vazia, robôs estão processando
      atualizacaoSolicitada: atualizacao.ok && docsV2.length === 0 && total === 0,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao buscar documentos' }
  }
}

// ─── Action 2 — Listar documentos salvos para uma nomeação ───────────────────

export async function listarDocumentosNomeacao(
  nomeacaoId: string,
): Promise<ProcessoDocumentoRow[]> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return []

  try {
    const nomeacao = await prisma.nomeacao.findUnique({
      where: { id: nomeacaoId },
      select: { peritoId: true, processoId: true },
    })
    if (!nomeacao || nomeacao.peritoId !== userId) return []

    const rows = await prisma.processoDocumento.findMany({
      where: { processoId: nomeacao.processoId },
      orderBy: { dataPublicacao: 'desc' },
    })

    return rows.map((r) => ({
      id:             r.id,
      escavadorDocId: r.escavadorDocId,
      chaveV2:        r.chaveV2,
      nome:           r.nome,
      tipo:           r.tipo,
      dataPublicacao: r.dataPublicacao ? r.dataPublicacao.toISOString().split('T')[0] : null,
      urlPublica:     r.urlPublica,
      paginas:        r.paginas,
      baixado:        r.baixado,
      blobUrl:        r.blobUrl,
    }))
  } catch {
    return []
  }
}

'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { radar } from '@/lib/services/radar'
import { EscavadorService } from '@/lib/services/escavador'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuscarDocumentosResult =
  | { ok: true; novos: number; total: number; suportado: boolean }
  | { ok: false; error: string }

export type ProcessoDocumentoRow = {
  id: string
  escavadorDocId: number
  nome: string
  tipo: string | null
  dataPublicacao: string | null
  urlPublica: string | null
  paginas: number | null
  baixado: boolean
  blobUrl: string | null
}

// ─── Action 1 — Buscar e persistir documentos do processo via Escavador ──────

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

    // Passo 1 — resolve o escavadorId se ainda não temos
    let escavadorId = nomeacao.processo.escavadorId
    if (!escavadorId) {
      const proc = await escavador.buscarProcesso(
        nomeacao.processo.numeroProcesso,
        nomeacao.processo.tribunal,
      )
      if (proc?.id) {
        escavadorId = proc.id
        await prisma.processo.update({
          where: { id: nomeacao.processoId },
          data: { escavadorId },
        })
      }
    }

    if (!escavadorId) {
      return { ok: false, error: 'Processo não encontrado no Escavador para este tribunal' }
    }

    // Passo 2 — lista documentos
    const docs = await escavador.listarDocumentos(escavadorId)

    if (docs.length === 0) {
      return { ok: true, novos: 0, total: 0, suportado: false }
    }

    let novos = 0
    for (const doc of docs) {
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

    const total = await prisma.processoDocumento.count({ where: { processoId: nomeacao.processoId } })
    return { ok: true, novos, total, suportado: true }
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

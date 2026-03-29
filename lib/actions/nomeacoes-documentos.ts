'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { radar } from '@/lib/services/radar'
import { EscavadorService } from '@/lib/services/escavador'

// ─── Busca e persiste documentos de um processo aceito ───────────────────────
// Chamada automaticamente quando o perito aceita a nomeação.
// Apenas armazena metadados; download sob demanda.

export type BuscarDocumentosResult =
  | { ok: true; novos: number }
  | { ok: false; error: string }

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

    const escavadorId = nomeacao.processo.escavadorId
    if (!escavadorId) {
      return { ok: false, error: 'ID Escavador do processo não disponível' }
    }

    const escavador = radar as EscavadorService
    const docs = await escavador.listarDocumentos(escavadorId)

    if (docs.length === 0) return { ok: true, novos: 0 }

    let novos = 0
    for (const doc of docs) {
      try {
        await prisma.processoDocumento.upsert({
          where: {
            processoId_escavadorDocId: {
              processoId: nomeacao.processoId,
              escavadorDocId: doc.id,
            },
          },
          create: {
            processoId: nomeacao.processoId,
            escavadorDocId: doc.id,
            nome: doc.nome,
            tipo: doc.tipo ?? null,
            dataPublicacao: doc.data ? new Date(doc.data) : null,
            urlPublica: doc.url ?? null,
            paginas: doc.paginas ?? null,
          },
          update: {
            nome: doc.nome,
            tipo: doc.tipo ?? null,
            urlPublica: doc.url ?? null,
            paginas: doc.paginas ?? null,
          },
        })
        novos++
      } catch {
        // Skip individual doc errors
      }
    }

    return { ok: true, novos }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao buscar documentos' }
  }
}

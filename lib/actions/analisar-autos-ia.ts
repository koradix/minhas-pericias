'use server'

/**
 * Analisar Autos com IA — analisa PDFs carregados manualmente.
 * A lógica principal de análise está em /api/nomeacoes/upload.
 */

import { auth } from '@/auth'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnalisarAutosResult {
  ok: boolean
  message: string
  docsAnalisados: number
}

// ─── Action ─────────────────────────────────────────────────────────────────

export async function analisarAutosIA(
  periciaId: string,
  _attachmentIds?: string[],
): Promise<AnalisarAutosResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autenticado', docsAnalisados: 0 }

  // Análise de PDFs agora é feita via upload direto (/api/nomeacoes/upload)
  return {
    ok: false,
    message: 'Use o upload de documentos na aba Resumo para análise com IA.',
    docsAnalisados: 0,
  }
}

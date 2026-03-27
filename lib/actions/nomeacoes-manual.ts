'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ai } from '@/lib/ai'

export interface RegistrarManualResult {
  ok: boolean
  message: string
  nomeacaoId?: string
}

export async function registrarNomeacaoManual(
  formData: FormData,
): Promise<RegistrarManualResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }
  const userId = session.user.id

  const file    = formData.get('arquivo') as File | null
  const tribunal = (formData.get('tribunal') as string | null) ?? 'TJRJ'
  const numeroRaw = (formData.get('numeroProcesso') as string | null)?.trim() || null

  // Validate file if provided
  if (file && file.size > 0) {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) return { ok: false, message: 'Apenas PDF ou DOCX são aceitos' }
    if (file.size > 40 * 1024 * 1024) return { ok: false, message: 'Arquivo muito grande (máx 40 MB)' }
  }

  try {
    // ── AI extraction (stub — real provider will read the file) ──────────────
    const textoInput = file?.name ?? numeroRaw ?? tribunal
    const extracted = await ai.extractProcessData({ textoOuNomeArquivo: textoInput })
    const summary   = await ai.generateProcessSummary({ dadosExtraidos: extracted })

    // ── Upsert Processo ──────────────────────────────────────────────────────
    const numeroProcesso = extracted.numeroProcesso ?? numeroRaw ?? `MAN-${Date.now()}`
    const partes = JSON.stringify(
      [
        extracted.autor ? { nome: extracted.autor, tipo: 'Autor' } : null,
        extracted.reu   ? { nome: extracted.reu,   tipo: 'Réu'   } : null,
      ].filter(Boolean),
    )

    const processo = await prisma.processo.upsert({
      where:  { numeroProcesso },
      update: { atualizadoEm: new Date() },
      create: {
        numeroProcesso,
        tribunal:        extracted.tribunal ?? tribunal,
        classe:          null,
        assunto:         extracted.assunto,
        orgaoJulgador:   extracted.vara,
        dataDistribuicao: null,
        dataUltimaAtu:   new Date().toISOString().split('T')[0],
        partes,
      },
    })

    // ── Upsert Nomeacao ──────────────────────────────────────────────────────
    const fileHasContent = file && file.size > 0
    const nomeacao = await prisma.nomeacao.upsert({
      where:  { peritoId_processoId: { peritoId: userId, processoId: processo.id } },
      update: {
        nomeArquivo:    fileHasContent ? file.name    : undefined,
        tamanhoBytes:   fileHasContent ? file.size    : undefined,
        mimeType:       fileHasContent ? file.type    : undefined,
        extractedData:  JSON.stringify(extracted),
        processSummary: JSON.stringify(summary),
        status:         'pronta_para_pericia',
      },
      create: {
        peritoId:       userId,
        processoId:     processo.id,
        status:         'pronta_para_pericia',
        scoreMatch:     100,
        nomeArquivo:    fileHasContent ? file.name  : null,
        tamanhoBytes:   fileHasContent ? file.size  : null,
        mimeType:       fileHasContent ? file.type  : null,
        extractedData:  JSON.stringify(extracted),
        processSummary: JSON.stringify(summary),
      },
    })

    revalidatePath('/nomeacoes')
    return { ok: true, message: 'Nomeação registrada.', nomeacaoId: nomeacao.id }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Erro ao registrar' }
  }
}

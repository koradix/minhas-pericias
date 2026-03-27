'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ai } from '@/lib/ai'
import type { ExtractProcessDataOutput } from '@/lib/ai/types'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/ai/prompt-mestre-resumo'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NomeacaoIntakeResult {
  ok: boolean
  message: string
  periciaId?: string
  periciaNumero?: string
}

export interface ResumoNomeacao {
  resumoCurto: string
  objetoDaPericia: string
  pontosRelevantes: string[]
  necessidadesDeCampo: string[]
}

// ─── Action 1 — Upload de documento ──────────────────────────────────────────

export async function uploadDocumentoNomeacao(
  nomeacaoId: string,
  formData: FormData,
): Promise<NomeacaoIntakeResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  const file = formData.get('arquivo') as File | null
  if (!file || file.size === 0) return { ok: false, message: 'Selecione um arquivo' }

  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowed.includes(file.type)) return { ok: false, message: 'Apenas PDF ou DOCX são aceitos' }
  if (file.size > 40 * 1024 * 1024) return { ok: false, message: 'Arquivo muito grande (máx 40MB)' }

  try {
    const n = await prisma.nomeacao.findUnique({
      where: { id: nomeacaoId },
      select: { peritoId: true },
    })
    if (!n || n.peritoId !== session.user.id) return { ok: false, message: 'Nomeação não encontrada' }

    await prisma.nomeacao.update({
      where: { id: nomeacaoId },
      data: {
        nomeArquivo: file.name,
        tamanhoBytes: file.size,
        mimeType: file.type,
        status: 'documentos_enviados',
      },
    })

    revalidatePath(`/nomeacoes/${nomeacaoId}`)
    return { ok: true, message: `"${file.name}" registrado.` }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Erro ao salvar' }
  }
}

// ─── Action 2 — Extrair dados do processo ─────────────────────────────────────

export async function extrairDadosNomeacao(
  nomeacaoId: string,
): Promise<NomeacaoIntakeResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  try {
    const n = await prisma.nomeacao.findUnique({
      where: { id: nomeacaoId },
      select: { peritoId: true, nomeArquivo: true, processo: true },
    })
    if (!n || n.peritoId !== session.user.id) return { ok: false, message: 'Nomeação não encontrada' }

    // Build input text: prefer uploaded filename, fall back to process metadata
    const textoInput =
      n.nomeArquivo ??
      [n.processo.assunto, n.processo.classe, n.processo.numeroProcesso]
        .filter(Boolean)
        .join(' — ')

    const dados = await ai.extractProcessData({ textoOuNomeArquivo: textoInput, intakeId: nomeacaoId })

    // Enrich with known processo fields when stub returns generic values
    const enriched: ExtractProcessDataOutput = {
      ...dados,
      numeroProcesso: dados.numeroProcesso ?? n.processo.numeroProcesso,
      vara: dados.vara ?? n.processo.orgaoJulgador ?? null,
      tribunal: dados.tribunal ?? n.processo.tribunal,
      assunto: dados.assunto ?? n.processo.assunto ?? null,
    }

    await prisma.nomeacao.update({
      where: { id: nomeacaoId },
      data: { extractedData: JSON.stringify(enriched), status: 'resumo_pendente' },
    })

    revalidatePath(`/nomeacoes/${nomeacaoId}`)
    return { ok: true, message: 'Dados extraídos.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Erro na extração' }
  }
}

// ─── Action 3 — Gerar resumo (usa prompt-mestre-resumo) ──────────────────────

export async function gerarResumoNomeacao(
  nomeacaoId: string,
): Promise<NomeacaoIntakeResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  try {
    const n = await prisma.nomeacao.findUnique({
      where: { id: nomeacaoId },
      select: { peritoId: true, extractedData: true },
    })
    if (!n || n.peritoId !== session.user.id) return { ok: false, message: 'Nomeação não encontrada' }
    if (!n.extractedData) return { ok: false, message: 'Execute "Extrair dados" primeiro.' }

    const dadosExtraidos = JSON.parse(n.extractedData) as ExtractProcessDataOutput

    // Build text from extracted data to feed the master prompt
    const textoProcesso = [
      dadosExtraidos.numeroProcesso && `Processo: ${dadosExtraidos.numeroProcesso}`,
      dadosExtraidos.tribunal       && `Tribunal: ${dadosExtraidos.tribunal}`,
      dadosExtraidos.vara           && `Vara: ${dadosExtraidos.vara}`,
      dadosExtraidos.autor          && `Autor: ${dadosExtraidos.autor}`,
      dadosExtraidos.reu            && `Réu: ${dadosExtraidos.reu}`,
      dadosExtraidos.tipoPericia    && `Tipo de perícia: ${dadosExtraidos.tipoPericia}`,
      dadosExtraidos.assunto        && `Assunto: ${dadosExtraidos.assunto}`,
      dadosExtraidos.endereco       && `Local da vistoria: ${dadosExtraidos.endereco}`,
      dadosExtraidos.quesitos.length > 0 &&
        `Quesitos:\n${dadosExtraidos.quesitos.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
    ].filter(Boolean).join('\n')

    let processSummary: string

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const anthropic = new Anthropic({ apiKey })
        const res = await anthropic.messages.create({
          model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildUserPrompt(textoProcesso) }],
        })
        const raw = res.content[0]?.type === 'text' ? res.content[0].text : '{}'
        // Extrai JSON de possível bloco markdown
        const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        processSummary = match ? match[1].trim() : raw.trim()
      } catch (err) {
        console.error('[intake] Anthropic error:', err instanceof Error ? err.message : err)
        const resumo = await ai.generateProcessSummary({ dadosExtraidos })
        processSummary = JSON.stringify(resumo)
      }
    } else {
      // Fallback: stub provider
      const resumo = await ai.generateProcessSummary({ dadosExtraidos })
      processSummary = JSON.stringify(resumo)
    }

    await prisma.nomeacao.update({
      where: { id: nomeacaoId },
      data: { processSummary, status: 'pronta_para_pericia' },
    })

    revalidatePath(`/nomeacoes/${nomeacaoId}`)
    return { ok: true, message: 'Resumo gerado.' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Erro ao gerar resumo' }
  }
}

// ─── Action 4 — Criar péricia a partir da nomeação ────────────────────────────

export async function criarPericiaDeNomeacao(
  nomeacaoId: string,
): Promise<NomeacaoIntakeResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  try {
    const n = await prisma.nomeacao.findUnique({
      where: { id: nomeacaoId },
      select: {
        peritoId: true, periciaId: true, nomeArquivo: true,
        extractedData: true, processSummary: true,
        processo: true,
      },
    })
    if (!n || n.peritoId !== session.user.id) return { ok: false, message: 'Nomeação não encontrada' }

    // Already has a péricia
    if (n.periciaId) return { ok: true, message: 'Péricia já criada.', periciaId: n.periciaId }

    // Requires at least a document upload OR extracted data
    if (!n.nomeArquivo && !n.extractedData)
      return { ok: false, message: 'Envie o documento do processo antes de criar a perícia.' }

    // Sequential número: PRC-YYYY-NNN
    const count = await prisma.pericia.count({ where: { peritoId: session.user.id } })
    const numero = `PRC-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    // Build péricia fields — use extracted data when available, fall back to processo
    let assunto: string
    let tipo: string
    let vara: string | null
    let processoNum: string
    let partesStr: string | null
    let endereco: string | null
    let prazo: string | null = null

    if (n.extractedData) {
      const d = JSON.parse(n.extractedData) as ExtractProcessDataOutput
      assunto = d.assunto ?? n.processo.assunto ?? 'Perícia judicial'
      tipo = d.tipoPericia ?? 'Engenharia Civil'
      vara = d.vara ?? n.processo.orgaoJulgador ?? null
      processoNum = d.numeroProcesso ?? n.processo.numeroProcesso
      partesStr = [d.autor, d.reu].filter(Boolean).join(' × ') || null
      endereco = d.endereco ?? null
      // Use stub card only when AI data is available (purely local call)
      const card = await ai.createPericiaCardFromProcess({
        dadosExtraidos: d, peritoId: session.user.id, intakeId: nomeacaoId,
      })
      prazo = card.prazo ?? null
    } else {
      // No extraction yet — build directly from processo (no AI call)
      assunto = n.processo.assunto ?? n.processo.classe ?? 'Perícia judicial'
      tipo = 'A classificar'
      vara = n.processo.orgaoJulgador ?? null
      processoNum = n.processo.numeroProcesso
      partesStr = null
      endereco = null
    }

    const pericia = await prisma.pericia.create({
      data: {
        peritoId: session.user.id,
        numero,
        assunto,
        tipo,
        processo: processoNum,
        vara,
        partes: partesStr,
        endereco,
        prazo,
        status: 'processo_importado',
      },
    })

    // Link péricia back to nomeação and advance status
    await prisma.nomeacao.update({
      where: { id: nomeacaoId },
      data: { periciaId: pericia.id, status: 'em_andamento' },
    })

    revalidatePath(`/nomeacoes/${nomeacaoId}`)
    revalidatePath('/nomeacoes')
    revalidatePath('/pericias')

    return { ok: true, message: `Péricia ${numero} criada.`, periciaId: pericia.id, periciaNumero: numero }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Erro ao criar péricia' }
  }
}

// ─── Action 5 — Atualizar endereço da vistoria ────────────────────────────────

export async function atualizarEnderecoVistoria(
  nomeacaoId: string,
  endereco: string,
): Promise<{ ok: boolean; message: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }

  try {
    const n = await prisma.nomeacao.findUnique({
      where: { id: nomeacaoId },
      select: { peritoId: true, processSummary: true },
    })
    if (!n || n.peritoId !== session.user.id) return { ok: false, message: 'Nomeação não encontrada' }

    let summary: Record<string, unknown> = {}
    if (n.processSummary) {
      try { summary = JSON.parse(n.processSummary) as Record<string, unknown> } catch {}
    }

    summary.enderecoVistoria = endereco.trim() || null

    // Also update localPericia.enderecoCompleto for consistency
    if (typeof summary.localPericia === 'object' && summary.localPericia !== null) {
      (summary.localPericia as Record<string, unknown>).enderecoCompleto = endereco.trim() || null
    }

    await prisma.nomeacao.update({
      where: { id: nomeacaoId },
      data: { processSummary: JSON.stringify(summary) },
    })

    revalidatePath(`/nomeacoes/${nomeacaoId}`)
    return { ok: true, message: 'Endereço atualizado' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Erro ao salvar endereço' }
  }
}

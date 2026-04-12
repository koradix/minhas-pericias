'use server'

/**
 * Analisar Autos com IA — pega PDFs já baixados (via Judit) e gera resumo.
 * Seleciona automaticamente os documentos mais relevantes.
 * Não precisa de upload manual.
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { juditLog } from '@/lib/integrations/judit/config'
import { judit } from '@/lib/integrations/judit/service'
import { JUDIT_SOURCE } from '@/lib/integrations/judit/constants'
import { SYSTEM_PROMPT_V2, buildPdfUserPromptV2 } from '@/lib/ai/prompt-mestre-resumo'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnalisarAutosResult {
  ok: boolean
  message: string
  docsAnalisados: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const MAX_PDFS = 5
const MAX_BYTES_TOTAL = 25 * 1024 * 1024

/** Documentos prioritários para resumo — por nome */
function prioridade(nome: string): number {
  const n = nome.toLowerCase()
  if (n.includes('inicial') || (n.includes('peti') && !n.includes('interc'))) return 1
  if (n.includes('contestac') || n.includes('contestaç')) return 2
  if (n.includes('decisao') || n.includes('decisão') || n.includes('despacho') || n.includes('saneador')) return 3
  if (n.includes('replica') || n.includes('réplica')) return 4
  if (n.includes('sentenc') || n.includes('sentenç')) return 5
  if (n.includes('laudo')) return 6
  if (n.includes('quesito')) return 7
  // Baixa prioridade — docs de prova, certidões etc
  if (n.includes('comprovante') || n.includes('certid') || n.includes('procura') || n.includes('intimaç') || n.includes('intimac')) return 50
  return 20
}

function extractJson(text: string): string {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (block) return block[1].trim()
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return obj[0]
  return text.trim()
}

// ─── Action ─────────────────────────────────────────────────────────────────

export async function analisarAutosIA(periciaId: string): Promise<AnalisarAutosResult> {
  const empty: AnalisarAutosResult = { ok: false, message: '', docsAnalisados: 0 }

  const session = await auth()
  if (!session?.user?.id) return { ...empty, message: 'Nao autenticado' }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ...empty, message: 'ANTHROPIC_API_KEY nao configurada' }

  const pericia = await prisma.pericia.findUnique({ where: { id: periciaId } })
  if (!pericia || pericia.peritoId !== session.user.id) return { ...empty, message: 'Pericia nao encontrada' }
  if (!pericia.processo) return { ...empty, message: 'Pericia sem CNJ' }

  // Buscar anexos downloaded (PDF)
  const attachments = await prisma.processAttachment.findMany({
    where: {
      periciaId,
      source: JUDIT_SOURCE,
      downloadStatus: 'downloaded',
    },
  })

  const pdfAtts = attachments
    .filter(a => (a.mimeType ?? a.type ?? '').includes('pdf'))
    .sort((a, b) => prioridade(a.name) - prioridade(b.name))
    .slice(0, MAX_PDFS)

  if (pdfAtts.length === 0) {
    return { ...empty, message: 'Nenhum PDF disponivel. Clique "Carregar Documentos" primeiro.' }
  }

  // Baixar PDFs do servidor (proxy com api-key)
  juditLog(`[analisar-ia] Baixando ${pdfAtts.length} PDFs para analise...`)
  const pdfs: { nome: string; buffer: Buffer }[] = []
  let totalBytes = 0

  for (const att of pdfAtts) {
    if (totalBytes >= MAX_BYTES_TOTAL) break
    const url = att.url ?? judit.buildAttachmentUrl(pericia.processo, 1, att.externalId)
    try {
      const result = await judit.downloadAttachment(url)
      if (!result || result.buffer.length === 0) continue
      pdfs.push({ nome: att.name, buffer: result.buffer })
      totalBytes += result.buffer.length
    } catch {
      continue
    }
  }

  if (pdfs.length === 0) {
    return { ...empty, message: 'Nenhum PDF pode ser lido do provedor' }
  }

  juditLog(`[analisar-ia] Enviando ${pdfs.length} PDFs (${(totalBytes / 1024 / 1024).toFixed(1)}MB) para Claude...`)

  // Montar content com documentos
  const docBlocks: Anthropic.MessageParam['content'] = []
  for (const pdf of pdfs) {
    docBlocks.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: pdf.buffer.toString('base64') },
    } as Anthropic.DocumentBlockParam)
  }

  const contexto = [
    `Processo: ${pericia.processo}`,
    pericia.vara ? `Vara: ${pericia.vara}` : '',
    pericia.assunto ? `Assunto: ${pericia.assunto}` : '',
    `Documentos analisados: ${pdfs.map(p => p.nome).join(', ')}`,
  ].filter(Boolean).join('\n')

  docBlocks.push({ type: 'text', text: buildPdfUserPromptV2(contexto) })

  try {
    const anthropic = new Anthropic({ apiKey })
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001'

    const res = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      system: SYSTEM_PROMPT_V2,
      messages: [{ role: 'user', content: docBlocks }],
    })

    const raw = res.content[0]?.type === 'text' ? res.content[0].text : '{}'
    let analise: Record<string, unknown> = {}
    try {
      analise = JSON.parse(extractJson(raw))
    } catch {
      juditLog('[analisar-ia] JSON parse error:', raw.substring(0, 200))
      return { ...empty, message: 'IA retornou formato invalido' }
    }

    // Salvar — upsert Processo + Nomeacao com processSummary
    const tribunal = (analise.operacional as Record<string, unknown>)?.tribunal as string
      ?? pericia.vara?.match(/TJ[A-Z]{2}|TRT\d+/)?.[0]
      ?? 'TJRJ'

    const processo = await prisma.processo.upsert({
      where: { numeroProcesso: pericia.processo },
      update: { tribunal, atualizadoEm: new Date() },
      create: { numeroProcesso: pericia.processo, tribunal },
    })

    await prisma.nomeacao.upsert({
      where: { peritoId_processoId: { peritoId: session.user.id, processoId: processo.id } },
      update: {
        processSummary: JSON.stringify(analise),
        periciaId: pericia.id,
        status: 'pronta_para_pericia',
      },
      create: {
        peritoId: session.user.id,
        processoId: processo.id,
        periciaId: pericia.id,
        status: 'pronta_para_pericia',
        scoreMatch: 100,
        nomeArquivo: `analise-ia-${pericia.processo}`,
        processSummary: JSON.stringify(analise),
      },
    })

    // Atualizar pericia com dados extraídos
    const op = analise.operacional as Record<string, unknown> | undefined
    if (op) {
      await prisma.pericia.update({
        where: { id: periciaId },
        data: {
          assunto: (op.tipoPericia as string) || pericia.assunto,
          vara: (op.vara as string) || pericia.vara,
        },
      })
    }

    return {
      ok: true,
      message: `${pdfs.length} documentos analisados com sucesso`,
      docsAnalisados: pdfs.length,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    juditLog('[analisar-ia] Erro:', msg)
    return { ...empty, message: `Erro na analise: ${msg.slice(0, 200)}` }
  }
}

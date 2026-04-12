'use server'

/**
 * Carregar Autos via Judit — fluxo completo.
 *
 * 1. Sync pericia com with_attachments=true (Judit crawls os PDFs do tribunal)
 * 2. Baixa os PDFs prontos (status: done) para buffer
 * 3. Envia os PDFs mais relevantes para Claude analisar
 * 4. Salva o processSummary na Nomeacao vinculada à perícia
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { isJuditReady, juditLog } from '@/lib/integrations/judit/config'
import { judit } from '@/lib/integrations/judit/service'
import { JUDIT_SOURCE } from '@/lib/integrations/judit/constants'
import { fetchAndSyncByCnj } from './judit-sync'
import { SYSTEM_PROMPT_V2, buildPdfUserPromptV2 } from '@/lib/ai/prompt-mestre-resumo'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CarregarAutosResult {
  ok: boolean
  message: string
  periciaId: string
  fase: 'sync' | 'download' | 'analise' | 'salvo'
  anexosBaixados: number
  anexosAnalisados: number
  temAnalise: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const MAX_PDFS_PARA_IA = 8
const MAX_BYTES_POR_PDF = 15 * 1024 * 1024
const MAX_BYTES_TOTAL = 30 * 1024 * 1024

/** Prioridade de documentos — petição e decisão são mais importantes */
function prioridadeDocumento(nome: string): number {
  const n = nome.toLowerCase()
  if (n.includes('inicial') || n.includes('peticao') || n.includes('petição')) return 1
  if (n.includes('contestacao') || n.includes('contestação')) return 2
  if (n.includes('replica') || n.includes('réplica')) return 3
  if (n.includes('decisao') || n.includes('decisão') || n.includes('despacho')) return 4
  if (n.includes('sentenca') || n.includes('sentença')) return 5
  if (n.includes('laudo')) return 6
  if (n.includes('quesito')) return 7
  return 10
}

function extractJson(text: string): string {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (block) return block[1].trim()
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return obj[0]
  return text.trim()
}

// ─── Action principal ───────────────────────────────────────────────────────

export async function carregarAutosJudit(periciaId: string): Promise<CarregarAutosResult> {
  const empty: CarregarAutosResult = {
    ok: false, message: '', periciaId,
    fase: 'sync', anexosBaixados: 0, anexosAnalisados: 0, temAnalise: false,
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

  juditLog('[carregar-autos] Fase 2: baixando PDFs...')
  const pendentes = await prisma.processAttachment.findMany({
    where: {
      periciaId,
      source: JUDIT_SOURCE,
      downloadStatus: { in: ['pending', 'failed', 'unavailable'] },
      downloadAvailable: true,
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
      // Salvar direto no registro (sem Vercel Blob por ora — analise usa buffer)
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
  juditLog(`[carregar-autos] ${baixados} PDFs baixados`)

  // ─── Fase 3: Selecionar PDFs e enviar para Claude ───────────────────────

  juditLog('[carregar-autos] Fase 3: preparando PDFs para analise IA...')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      ...empty, ok: true, fase: 'download',
      message: `${baixados} docs baixados, mas ANTHROPIC_API_KEY nao configurada`,
      anexosBaixados: baixados, anexosAnalisados: 0, temAnalise: false,
    }
  }

  // Buscar todos os anexos downloaded que sao PDF
  const downloadedAtts = await prisma.processAttachment.findMany({
    where: {
      periciaId,
      source: JUDIT_SOURCE,
      downloadStatus: 'downloaded',
    },
    orderBy: { capturedAt: 'asc' },
  })

  const pdfAtts = downloadedAtts
    .filter(a => (a.mimeType ?? a.type ?? '').includes('pdf'))
    .sort((a, b) => prioridadeDocumento(a.name) - prioridadeDocumento(b.name))

  if (pdfAtts.length === 0) {
    return {
      ...empty, ok: true, fase: 'download',
      message: `${baixados} docs baixados, mas nenhum PDF disponivel para analise`,
      anexosBaixados: baixados, anexosAnalisados: 0, temAnalise: false,
    }
  }

  // Baixar buffers dos PDFs selecionados (até MAX_PDFS_PARA_IA)
  const pdfsParaAnalise: { nome: string; buffer: Buffer }[] = []
  let totalBytes = 0

  for (const att of pdfAtts.slice(0, MAX_PDFS_PARA_IA)) {
    if (totalBytes >= MAX_BYTES_TOTAL) break

    const downloadUrl = att.url ?? judit.buildAttachmentUrl(cnj, 1, att.externalId)
    try {
      const result = await judit.downloadAttachment(downloadUrl)
      if (!result || result.buffer.length === 0) continue
      if (result.buffer.length > MAX_BYTES_POR_PDF) continue

      pdfsParaAnalise.push({ nome: att.name, buffer: result.buffer })
      totalBytes += result.buffer.length
    } catch {
      continue
    }
  }

  if (pdfsParaAnalise.length === 0) {
    return {
      ...empty, ok: true, fase: 'download',
      message: `${baixados} docs baixados, mas nenhum PDF pode ser lido`,
      anexosBaixados: baixados, anexosAnalisados: 0, temAnalise: false,
    }
  }

  juditLog(`[carregar-autos] Enviando ${pdfsParaAnalise.length} PDFs (${(totalBytes / 1024 / 1024).toFixed(1)}MB) para Claude...`)

  // Montar message content com os PDFs
  const docBlocks: Anthropic.MessageParam['content'] = []
  for (const pdf of pdfsParaAnalise) {
    docBlocks.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: pdf.buffer.toString('base64') },
    } as Anthropic.DocumentBlockParam)
  }

  const contexto = [
    `Tribunal: ${pericia.vara?.match(/TJ[A-Z]{2}|TRT\d+/)?.[0] ?? 'TJRJ'}`,
    `Processo: ${cnj}`,
    pericia.assunto ? `Assunto: ${pericia.assunto}` : '',
    `Documentos: ${pdfsParaAnalise.map(p => p.nome).join(', ')}`,
  ].filter(Boolean).join('\n')

  docBlocks.push({
    type: 'text',
    text: buildPdfUserPromptV2(contexto),
  })

  try {
    const anthropic = new Anthropic({ apiKey })
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20241022'

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
      juditLog('[carregar-autos] JSON parse error:', raw.substring(0, 200))
    }

    // ─── Fase 4: Salvar resultado ─────────────────────────────────────────

    juditLog('[carregar-autos] Fase 4: salvando analise...')

    // Upsert Processo
    const tribunal = (analise.operacional as Record<string, unknown>)?.tribunal as string
      ?? pericia.vara?.match(/TJ[A-Z]{2}|TRT\d+/)?.[0]
      ?? 'TJRJ'

    const processo = await prisma.processo.upsert({
      where: { numeroProcesso: cnj },
      update: { tribunal, atualizadoEm: new Date() },
      create: { numeroProcesso: cnj, tribunal, classe: null, dataDistribuicao: null },
    })

    // Upsert Nomeacao com processSummary
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
        nomeArquivo: `judit-autos-${cnj}`,
        processSummary: JSON.stringify(analise),
      },
    })

    // Atualizar dados da pericia se extraídos
    const op = analise.operacional as Record<string, unknown> | undefined
    if (op) {
      await prisma.pericia.update({
        where: { id: periciaId },
        data: {
          assunto: (op.tipoPericia as string) || pericia.assunto,
          vara: (op.vara as string) || pericia.vara,
          atualizadoEm: new Date(),
        },
      })
    }

    return {
      ok: true,
      fase: 'salvo',
      message: `${pdfsParaAnalise.length} documentos analisados com sucesso`,
      periciaId,
      anexosBaixados: baixados,
      anexosAnalisados: pdfsParaAnalise.length,
      temAnalise: true,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    juditLog('[carregar-autos] Erro na analise:', msg)
    return {
      ...empty, ok: false, fase: 'analise',
      message: `Docs baixados, mas erro na analise IA: ${msg}`,
      anexosBaixados: baixados, anexosAnalisados: 0, temAnalise: false,
    }
  }
}

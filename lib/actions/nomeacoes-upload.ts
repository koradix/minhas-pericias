'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, buildUserPrompt, buildPdfUserPrompt } from '@/lib/ai/prompt-mestre-resumo'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegistrarNomeacaoResult {
  ok: boolean
  message?: string
  nomeacaoId?: string
  preview?: {
    numeroProcesso: string
    tribunal: string | null
    assunto: string | null
    vara: string | null
    autor: string | null
    reu: string | null
    complexidade: string | null
    pontoControvertido: string | null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractJson(text: string): string {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (block) return block[1].trim()
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return obj[0]
  return text.trim()
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function registrarNomeacao(formData: FormData): Promise<RegistrarNomeacaoResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, message: 'Não autorizado' }
  const userId = session.user.id

  const file     = formData.get('arquivo') as File | null
  const tribunal = (formData.get('tribunal') as string | null) ?? 'TJRJ'
  const numeroRaw = (formData.get('numeroProcesso') as string | null)?.trim() || null

  if (!file || file.size === 0) return { ok: false, message: 'Arquivo obrigatório' }

  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (!allowed.includes(file.type)) return { ok: false, message: 'Apenas PDF ou DOCX são aceitos' }
  if (file.size > 40 * 1024 * 1024) return { ok: false, message: 'Arquivo muito grande (máx 40 MB)' }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, message: 'ANTHROPIC_API_KEY não configurada' }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contexto = `Tribunal: ${tribunal}${numeroRaw ? `\nNúmero: ${numeroRaw}` : ''}`

  let analise: Record<string, unknown> = {}

  try {
    const anthropic = new Anthropic({ apiKey })
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5'

    let userContent: Anthropic.MessageParam['content']

    if (file.type === 'application/pdf') {
      const mbSize = (buffer.length / 1024 / 1024).toFixed(1)
      console.log(`[registrar] PDF: ${file.name} | ${mbSize}MB | model: ${model}`)

      const { PDFDocument } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const totalPaginas = pdfDoc.getPageCount()
      console.log(`[registrar] pdf-lib: ${totalPaginas} páginas`)

      const MAX_PDF_BYTES = 15 * 1024 * 1024
      const MAX_PAGINAS = 40
      let maxPags = Math.min(totalPaginas, MAX_PAGINAS)
      let pdfParaEnviar: Buffer = buffer

      if (totalPaginas <= maxPags && buffer.length <= MAX_PDF_BYTES) {
        pdfParaEnviar = buffer
      } else {
        while (maxPags > 0) {
          const novoPdf = await PDFDocument.create()
          const indices = Array.from({ length: maxPags }, (_, i) => i)
          const copias = await novoPdf.copyPages(pdfDoc, indices)
          copias.forEach(p => novoPdf.addPage(p))
          pdfParaEnviar = Buffer.from(await novoPdf.save())
          if (pdfParaEnviar.length <= MAX_PDF_BYTES) break
          console.log(`[registrar] PDF ainda grande (${(pdfParaEnviar.length / 1024 / 1024).toFixed(1)}MB / ${maxPags} págs), reduzindo...`)
          maxPags = Math.floor(maxPags * 0.6)
          if (maxPags < 1) maxPags = 1
        }
      }

      userContent = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: pdfParaEnviar.toString('base64') },
        } as Anthropic.DocumentBlockParam,
        { type: 'text', text: buildPdfUserPrompt(contexto) },
      ]
    } else {
      const textoDocx = buffer.toString('utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      userContent = buildUserPrompt(
        textoDocx.length > 100
          ? textoDocx
          : `Arquivo: ${file.name}\nTribunal: ${tribunal}${numeroRaw ? `\nNúmero: ${numeroRaw}` : ''}`
      )
    }

    const res = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    const raw = res.content[0]?.type === 'text' ? res.content[0].text : '{}'
    try {
      analise = JSON.parse(extractJson(raw))
    } catch {
      console.error('[registrar] JSON parse error — raw:', raw.substring(0, 200))
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[registrar] Anthropic error:', msg)
    return { ok: false, message: `Erro na análise IA: ${msg}` }
  }

  // ── Salva no banco ───────────────────────────────────────────────────────────

  const numeroProcesso = (analise.numeroProcesso as string | null) ?? numeroRaw ?? `MAN-${Date.now()}`
  const partes = JSON.stringify([
    analise.autor ? { nome: analise.autor, tipo: 'Autor' } : null,
    analise.reu   ? { nome: analise.reu,   tipo: 'Réu'   } : null,
  ].filter(Boolean))

  try {
    const processoFields = {
      tribunal:      (analise.tribunal as string | null) ?? tribunal,
      assunto:       (analise.resumoProcesso as Record<string, string> | null)?.tipoAcao ?? null,
      orgaoJulgador: (analise.vara as string | null) ?? null,
      dataUltimaAtu: new Date().toISOString().split('T')[0],
      partes,
    }

    const processo = await prisma.processo.upsert({
      where:  { numeroProcesso },
      update: { ...processoFields, atualizadoEm: new Date() },
      create: { numeroProcesso, classe: null, dataDistribuicao: null, ...processoFields },
    })

    const extractedData = JSON.stringify({
      numeroProcesso,
      autor:       analise.autor ?? null,
      reu:         analise.reu ?? null,
      vara:        analise.vara ?? null,
      tribunal:    analise.tribunal ?? tribunal,
      assunto:     (analise.resumoProcesso as Record<string, string> | null)?.tipoAcao ?? null,
      quesitos:    (analise.nomeacaoDespacho as Record<string, unknown> | null)?.quesitos ?? [],
      endereco:    analise.enderecoVistoria ?? null,
      tipoPericia: analise.tipoPericia ?? null,
    })

    const nomeacao = await prisma.nomeacao.upsert({
      where:  { peritoId_processoId: { peritoId: userId, processoId: processo.id } },
      update: {
        nomeArquivo:    file.name,
        tamanhoBytes:   file.size,
        mimeType:       file.type,
        extractedData,
        processSummary: JSON.stringify(analise),
        status:         'pronta_para_pericia',
      },
      create: {
        peritoId:       userId,
        processoId:     processo.id,
        status:         'pronta_para_pericia',
        scoreMatch:     100,
        nomeArquivo:    file.name,
        tamanhoBytes:   file.size,
        mimeType:       file.type,
        extractedData,
        processSummary: JSON.stringify(analise),
      },
    })

    const nd = analise.nomeacaoDespacho as Record<string, unknown> | null
    const ah = analise.aceiteHonorarios as Record<string, unknown> | null

    return {
      ok: true,
      nomeacaoId: nomeacao.id,
      preview: {
        numeroProcesso,
        tribunal:           processoFields.tribunal,
        assunto:            processoFields.assunto,
        vara:               processoFields.orgaoJulgador,
        autor:              (analise.autor as string | null) ?? null,
        reu:                (analise.reu   as string | null) ?? null,
        complexidade:       (ah?.complexidade as string | null) ?? null,
        pontoControvertido: (nd?.determinacaoJuiz as string | null) ?? null,
      },
    }
  } catch (err) {
    console.error('[registrar] DB error:', err)
    return { ok: false, message: err instanceof Error ? err.message : 'Erro ao salvar no banco' }
  }
}

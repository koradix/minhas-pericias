import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { del, get as blobGet } from '@vercel/blob'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  SYSTEM_PROMPT_V2,
  buildUserPromptV2,
  buildPdfUserPromptV2,
} from '@/lib/ai/prompt-mestre-resumo'

export const maxDuration = 60

function extractJson(text: string): string {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (block) return block[1].trim()
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return obj[0]
  return text.trim()
}

// ─── Route handler ────────────────────────────────────────────────────────────
//
// Aceita JSON: { blobUrl, fileName, fileSize, mimeType, tribunal, numero }
// O arquivo já está no Vercel Blob — nunca passa pela função serverless.
// Isso resolve o limite de 4.5 MB do Vercel Hobby.

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Não autorizado' }, { status: 401 })
  }
  const userId = session.user.id

  const contentType = request.headers.get('content-type') ?? ''
  let fileName: string
  let fileSize: number
  let mimeType: string
  let tribunal: string
  let numeroRaw: string | null
  let buffer: Buffer
  let blobUrl: string | null = null
  let periciaIdRaw: string | null = null
  let forceProvider: 'claude' | 'gemini' | null = null

  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  if (contentType.includes('multipart/form-data')) {
    // ── Dev: arquivo enviado direto como FormData (sem Vercel Blob) ───────────
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ ok: false, message: 'Arquivo não encontrado' }, { status: 400 })

    mimeType = file.type
    if (!allowed.includes(mimeType)) {
      return NextResponse.json({ ok: false, message: 'Apenas PDF ou DOCX são aceitos' }, { status: 400 })
    }

    fileName     = file.name
    fileSize     = file.size
    tribunal     = (formData.get('tribunal') as string) ?? 'TJRJ'
    numeroRaw    = (formData.get('numero') as string | null) || null
    periciaIdRaw = (formData.get('periciaId') as string | null) || null
    buffer       = Buffer.from(await file.arrayBuffer())
  } else {
    // ── Prod: recebe blobUrl em JSON ─────────────────────────────────────────
    const body = await request.json() as {
      blobUrl:   string
      fileName:  string
      fileSize:  number
      mimeType:  string
      tribunal:  string
      numero?:   string | null
      periciaId?: string | null
      provider?: 'claude' | 'gemini'
    }

    blobUrl      = body.blobUrl
    fileName     = body.fileName
    fileSize     = body.fileSize
    mimeType     = body.mimeType
    tribunal     = body.tribunal
    numeroRaw    = body.numero ?? null
    periciaIdRaw = body.periciaId ?? null
    forceProvider = body.provider ?? null

    if (!blobUrl) {
      return NextResponse.json({ ok: false, message: 'blobUrl obrigatório' }, { status: 400 })
    }
    if (!allowed.includes(mimeType)) {
      return NextResponse.json({ ok: false, message: 'Apenas PDF ou DOCX são aceitos' }, { status: 400 })
    }

    // ── Download do Blob (privado via SDK) ───────────────────────────────────
    try {
      const result = await blobGet(blobUrl, { access: 'private' })
      if (!result || result.statusCode !== 200 || !result.stream) throw new Error('Blob não encontrado')
      const reader = result.stream.getReader()
      const parts: Uint8Array[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        parts.push(value)
      }
      buffer = Buffer.concat(parts.map(p => Buffer.from(p)))
    } catch (err) {
      await del(blobUrl).catch(() => {})
      return NextResponse.json(
        { ok: false, message: `Erro ao baixar arquivo: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 },
      )
    }
  }

  const contexto = `Tribunal: ${tribunal}${numeroRaw ? `\nNúmero: ${numeroRaw}` : ''}`
  let analise: Record<string, unknown> = {}

  // ── Prepara PDF (truncado a 20 páginas) ───────────────────────────────────
  let pdfParaEnviar: Buffer = buffer
  if (mimeType === 'application/pdf') {
    const mbSize = (buffer.length / 1024 / 1024).toFixed(1)
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
    const totalPaginas = pdfDoc.getPageCount()
    console.log(`[upload] PDF: ${fileName} | ${mbSize}MB | ${totalPaginas} páginas`)
    const MAX_PAGINAS = 20
    if (totalPaginas > MAX_PAGINAS) {
      const novoPdf = await PDFDocument.create()
      const indices = Array.from({ length: MAX_PAGINAS }, (_, i) => i)
      const copias = await novoPdf.copyPages(pdfDoc, indices)
      copias.forEach((p) => novoPdf.addPage(p))
      pdfParaEnviar = Buffer.from(await novoPdf.save())
      console.log(`[upload] PDF truncado: ${(pdfParaEnviar.length / 1024 / 1024).toFixed(1)}MB`)
    }
  }

  // ── Retorna true se o erro Anthropic é de rate limit / crédito ────────────
  function isRateLimitOrCredit(err: unknown): boolean {
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
    return msg.includes('rate_limit') || msg.includes('rate limit') ||
      msg.includes('429') || msg.includes('credit') || msg.includes('overloaded') ||
      msg.includes('529') || msg.includes('quota')
  }

  // ── Call Anthropic ────────────────────────────────────────────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  let anthropicOk = false

  if (anthropicKey && forceProvider !== 'gemini') {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey })
      const model = 'claude-haiku-4-5-20251001'
      let userContent: Anthropic.MessageParam['content']

      if (mimeType === 'application/pdf') {
        userContent = [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfParaEnviar.toString('base64') },
          } as Anthropic.DocumentBlockParam,
          { type: 'text', text: buildPdfUserPromptV2(contexto) },
        ]
      } else {
        const textoDocx = buffer.toString('utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        console.log(`[upload] DOCX: ${fileName} | texto: ${textoDocx.length} chars`)
        userContent = buildUserPromptV2(
          textoDocx.length > 100
            ? textoDocx
            : `Arquivo: ${fileName}\nTribunal: ${tribunal}${numeroRaw ? `\nNúmero: ${numeroRaw}` : ''}`
        )
      }

      const res = await anthropic.messages.create({
        model,
        max_tokens: 8000,
        system: SYSTEM_PROMPT_V2,
        messages: [{ role: 'user', content: userContent }],
      })
      const raw = res.content[0]?.type === 'text' ? res.content[0].text : '{}'
      console.log(`[upload] Claude raw (primeiros 500 chars):\n${raw.substring(0, 500)}`)
      analise = JSON.parse(extractJson(raw))
      console.log('[upload] Claude OK — chaves:', Object.keys(analise).join(', '))
      anthropicOk = true
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[upload] Claude falhou (${isRateLimitOrCredit(err) ? 'rate_limit/credit' : 'erro'}): ${msg}`)
      if (!isRateLimitOrCredit(err)) {
        // Erro não-recuperável (ex: JSON parse, payload inválido) — não tenta Gemini
        if (blobUrl) await del(blobUrl).catch(() => {})
        return NextResponse.json({ ok: false, message: `Erro na análise IA: ${msg}` }, { status: 500 })
      }
      // Rate limit / crédito → cai no fallback Gemini abaixo
    }
  }

  // ── Fallback: Google Gemini ───────────────────────────────────────────────
  if (!anthropicOk) {
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      if (blobUrl) await del(blobUrl).catch(() => {})
      const msg = forceProvider === 'gemini'
        ? 'GEMINI_API_KEY não configurada'
        : 'IA indisponível: sem créditos Claude e GEMINI_API_KEY não configurada'
      return NextResponse.json(
        { ok: false, message: msg },
        { status: 500 },
      )
    }

    try {
      console.log('[upload] Usando fallback Gemini Flash…')
      const genAI = new GoogleGenerativeAI(geminiKey)
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: SYSTEM_PROMPT_V2,
      })

      let geminiResult
      if (mimeType === 'application/pdf') {
        geminiResult = await geminiModel.generateContent([
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfParaEnviar.toString('base64'),
            },
          },
          buildPdfUserPromptV2(contexto),
        ])
      } else {
        const textoDocx = buffer.toString('utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        const prompt = buildUserPromptV2(
          textoDocx.length > 100
            ? textoDocx
            : `Arquivo: ${fileName}\nTribunal: ${tribunal}${numeroRaw ? `\nNúmero: ${numeroRaw}` : ''}`
        )
        geminiResult = await geminiModel.generateContent(
          typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
        )
      }

      const raw = geminiResult.response.text()
      console.log(`[upload] Gemini raw (primeiros 500 chars):\n${raw.substring(0, 500)}`)
      analise = JSON.parse(extractJson(raw))
      console.log('[upload] Gemini OK — chaves:', Object.keys(analise).join(', '))
    } catch (err) {
      if (blobUrl) await del(blobUrl).catch(() => {})
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[upload] ❌ Gemini fallback error:', msg)
      return NextResponse.json(
        { ok: false, message: `Erro na análise IA (fallback): ${msg}` },
        { status: 500 },
      )
    }
  }

  // Blob processado — deletar para economizar espaço
  if (blobUrl) await del(blobUrl).catch(() => {})

  // ── Extract fields — v2 and v1 both handled ───────────────────────────────
  const isV2   = analise.analysis_version === '2.0'
  const op     = isV2 ? (analise.operacional as Record<string, unknown>) : null
  const nd2    = op ? (op.nomeacaoDespacho as Record<string, unknown> | null) : null
  const ah2    = op ? (op.aceiteHonorarios as Record<string, unknown> | null) : null
  const pt     = isV2 ? (analise.partes as Record<string, unknown>) : null

  const autorStr  = isV2 ? (pt?.autor as string | null) ?? null : (analise.autor as string | null) ?? null
  const reuStr    = isV2 ? (pt?.reu   as string | null) ?? null : (analise.reu   as string | null) ?? null
  const varaStr   = isV2 ? (op?.vara  as string | null) ?? null : (analise.vara  as string | null) ?? null
  const tribStr   = isV2 ? (op?.tribunal as string | null) ?? tribunal : (analise.tribunal as string | null) ?? tribunal
  const tipoAcao  = isV2
    ? ((analise.tipo_processo as Record<string, string | null>)?.natureza ?? (analise.tipo_processo as Record<string, string | null>)?.classe ?? null)
    : (analise.resumoProcesso as Record<string, string> | null)?.tipoAcao ?? null
  const quesitos  = isV2
    ? ((nd2?.quesitos as string[] | undefined) ?? [])
    : ((analise.nomeacaoDespacho as Record<string, unknown> | null)?.quesitos as string[] | undefined) ?? []
  const enderecoStr = isV2
    ? (op?.enderecoVistoria as string | null) ?? null
    : (analise.enderecoVistoria as string | null) ?? null
  const tipoPericia = isV2
    ? (op?.tipoPericia as string | null) ?? null
    : (analise.tipoPericia as string | null) ?? null

  // ── Upsert Processo + Nomeacao ─────────────────────────────────────────────
  const numeroProcesso = isV2
    ? (op?.numeroProcesso as string | null) ?? numeroRaw ?? `MAN-${Date.now()}`
    : (analise.numeroProcesso as string | null) ?? numeroRaw ?? `MAN-${Date.now()}`

  const partes = JSON.stringify([
    autorStr ? { nome: autorStr, tipo: 'Autor' } : null,
    reuStr   ? { nome: reuStr,   tipo: 'Réu'   } : null,
  ].filter(Boolean))

  try {
    const processoFields = {
      tribunal:      tribStr,
      assunto:       tipoAcao,
      orgaoJulgador: varaStr,
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
      autor:       autorStr,
      reu:         reuStr,
      vara:        varaStr,
      tribunal:    tribStr,
      assunto:     tipoAcao,
      quesitos,
      endereco:    enderecoStr,
      tipoPericia,
    })

    const nomeacao = await prisma.nomeacao.upsert({
      where:  { peritoId_processoId: { peritoId: userId, processoId: processo.id } },
      update: {
        nomeArquivo:    fileName,
        tamanhoBytes:   fileSize,
        mimeType,
        extractedData,
        processSummary: JSON.stringify(analise),
        status:         'pronta_para_pericia',
        ...(periciaIdRaw ? { periciaId: periciaIdRaw } : {}),
      },
      create: {
        peritoId:       userId,
        processoId:     processo.id,
        status:         'pronta_para_pericia',
        scoreMatch:     100,
        nomeArquivo:    fileName,
        tamanhoBytes:   fileSize,
        mimeType,
        extractedData,
        processSummary: JSON.stringify(analise),
        ...(periciaIdRaw ? { periciaId: periciaIdRaw } : {}),
      },
    })

    return NextResponse.json({
      ok: true,
      nomeacaoId: nomeacao.id,
      preview: {
        numeroProcesso,
        tribunal:           processoFields.tribunal,
        assunto:            processoFields.assunto,
        vara:               processoFields.orgaoJulgador,
        autor:              autorStr,
        reu:                reuStr,
        complexidade:       (ah2?.complexidade as string | null) ?? null,
        pontoControvertido: isV2
          ? (analise.ponto_controvertido as Record<string, string | null>)?.resumo ?? null
          : (nd2?.determinacaoJuiz as string | null) ?? null,
      },
    })
  } catch (err) {
    console.error('[upload] DB error:', err)
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : 'Erro ao salvar no banco' },
      { status: 500 },
    )
  }
}

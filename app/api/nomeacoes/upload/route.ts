import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, buildUserPrompt, buildPdfUserPrompt } from '@/lib/ai/prompt-mestre-resumo'

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

    fileName  = file.name
    fileSize  = file.size
    tribunal  = (formData.get('tribunal') as string) ?? 'TJRJ'
    numeroRaw = (formData.get('numero') as string | null) || null
    buffer    = Buffer.from(await file.arrayBuffer())
  } else {
    // ── Prod: recebe blobUrl em JSON ─────────────────────────────────────────
    const body = await request.json() as {
      blobUrl:  string
      fileName: string
      fileSize: number
      mimeType: string
      tribunal: string
      numero?:  string | null
    }

    blobUrl   = body.blobUrl
    fileName  = body.fileName
    fileSize  = body.fileSize
    mimeType  = body.mimeType
    tribunal  = body.tribunal
    numeroRaw = body.numero ?? null

    if (!blobUrl) {
      return NextResponse.json({ ok: false, message: 'blobUrl obrigatório' }, { status: 400 })
    }
    if (!allowed.includes(mimeType)) {
      return NextResponse.json({ ok: false, message: 'Apenas PDF ou DOCX são aceitos' }, { status: 400 })
    }

    // ── Download do Blob ─────────────────────────────────────────────────────
    try {
      const res = await fetch(blobUrl, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      buffer = Buffer.from(await res.arrayBuffer())
    } catch (err) {
      await del(blobUrl).catch(() => {})
      return NextResponse.json(
        { ok: false, message: `Erro ao baixar arquivo: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 },
      )
    }
  }

  // ── Call Anthropic ─────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    if (blobUrl) await del(blobUrl).catch(() => {})
    return NextResponse.json({ ok: false, message: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
  }

  const contexto = `Tribunal: ${tribunal}${numeroRaw ? `\nNúmero: ${numeroRaw}` : ''}`
  let analise: Record<string, unknown> = {}

  try {
    const anthropic = new Anthropic({ apiKey })
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5'
    let userContent: Anthropic.MessageParam['content']

    if (mimeType === 'application/pdf') {
      const mbSize = (buffer.length / 1024 / 1024).toFixed(1)
      console.log(`[upload] PDF: ${fileName} | ${mbSize}MB | model: ${model}`)

      const { PDFDocument } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const totalPaginas = pdfDoc.getPageCount()
      console.log(`[upload] pdf-lib: ${totalPaginas} páginas`)

      const MAX_PAGINAS = 40
      let pdfParaEnviar: Buffer

      if (totalPaginas <= MAX_PAGINAS) {
        pdfParaEnviar = buffer
      } else {
        console.log(`[upload] Extraindo páginas 1-${MAX_PAGINAS} de ${totalPaginas}`)
        const novoPdf = await PDFDocument.create()
        const indices = Array.from({ length: MAX_PAGINAS }, (_, i) => i)
        const copias = await novoPdf.copyPages(pdfDoc, indices)
        copias.forEach((p) => novoPdf.addPage(p))
        pdfParaEnviar = Buffer.from(await novoPdf.save())
        console.log(`[upload] PDF extraído: ${(pdfParaEnviar.length / 1024 / 1024).toFixed(1)}MB`)
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
      console.log(`[upload] DOCX: ${fileName} | texto: ${textoDocx.length} chars`)
      userContent = buildUserPrompt(
        textoDocx.length > 100
          ? textoDocx
          : `Arquivo: ${fileName}\nTribunal: ${tribunal}${numeroRaw ? `\nNúmero: ${numeroRaw}` : ''}`
      )
    }

    const res = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    const raw = res.content[0]?.type === 'text' ? res.content[0].text : '{}'
    console.log(`[upload] Claude raw (primeiros 500 chars):\n${raw.substring(0, 500)}`)
    try {
      analise = JSON.parse(extractJson(raw))
      console.log('[upload] Parsed OK — chaves:', Object.keys(analise).join(', '))
    } catch (parseErr) {
      console.error('[upload] ❌ JSON parse error:', parseErr instanceof Error ? parseErr.message : parseErr)
    }
  } catch (err) {
    if (blobUrl) await del(blobUrl).catch(() => {})
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload] ❌ Anthropic API error:', msg)
    return NextResponse.json({ ok: false, message: `Erro na análise IA: ${msg}` }, { status: 500 })
  }

  // Blob processado — deletar para economizar espaço
  if (blobUrl) await del(blobUrl).catch(() => {})

  // ── Upsert Processo + Nomeacao ─────────────────────────────────────────────
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
        nomeArquivo:    fileName,
        tamanhoBytes:   fileSize,
        mimeType,
        extractedData,
        processSummary: JSON.stringify(analise),
        status:         'pronta_para_pericia',
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
      },
    })

    const nd = analise.nomeacaoDespacho as Record<string, unknown> | null
    const ah = analise.aceiteHonorarios as Record<string, unknown> | null

    return NextResponse.json({
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
    })
  } catch (err) {
    console.error('[upload] DB error:', err)
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : 'Erro ao salvar no banco' },
      { status: 500 },
    )
  }
}

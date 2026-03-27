import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, buildUserPrompt, buildPdfUserPrompt } from '@/lib/ai/prompt-mestre-resumo'

// Route segment config (App Router) — aumenta timeout da função Vercel para 60s
export const maxDuration = 60

/** Extrai JSON de texto que pode conter bloco markdown ```json``` ou texto antes/depois */
function extractJson(text: string): string {
  // 1. Markdown code block
  const block = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (block) return block[1].trim()
  // 2. JSON object anywhere in the text
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return obj[0]
  return text.trim()
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Não autorizado' }, { status: 401 })
  }
  const userId = session.user.id

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, message: 'Erro ao ler o arquivo enviado' }, { status: 400 })
  }

  const file = formData.get('arquivo') as File | null
  const tribunal = (formData.get('tribunal') as string | null) ?? 'TJRJ'
  const numeroRaw = (formData.get('numeroProcesso') as string | null)?.trim() || null

  // ── Validate file ──────────────────────────────────────────────────────────
  if (!file || file.size === 0) {
    return NextResponse.json({ ok: false, message: 'Arquivo obrigatório' }, { status: 400 })
  }
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ ok: false, message: 'Apenas PDF ou DOCX são aceitos' }, { status: 400 })
  }
  if (file.size > 40 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: 'Arquivo muito grande (máx 40 MB)' }, { status: 400 })
  }

  // ── Call Anthropic ─────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, message: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let analise: Record<string, unknown> = {}
  try {
    const anthropic = new Anthropic({ apiKey })
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5'

    let userContent: Anthropic.MessageParam['content']

    const mbSize = (buffer.length / 1024 / 1024).toFixed(1)
    const contexto = `Tribunal: ${tribunal}${numeroRaw ? `\nNúmero: ${numeroRaw}` : ''}`

    if (file.type === 'application/pdf') {
      console.log(`[upload] PDF: ${file.name} | ${mbSize}MB | model: ${model}`)

      // Usa pdf-lib para ler o PDF e extrair primeiras páginas se necessário
      const { PDFDocument } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const totalPaginas = pdfDoc.getPageCount()
      console.log(`[upload] pdf-lib: ${totalPaginas} páginas`)

      // Extrai só as primeiras 40 páginas (onde fica o despacho de nomeação)
      const MAX_PAGINAS = 40
      let pdfParaEnviar: Buffer

      if (totalPaginas <= MAX_PAGINAS) {
        pdfParaEnviar = buffer
      } else {
        console.log(`[upload] Extraindo páginas 1-${MAX_PAGINAS} de ${totalPaginas}`)
        const novoPdf = await PDFDocument.create()
        const indices = Array.from({ length: MAX_PAGINAS }, (_, i) => i)
        const copias = await novoPdf.copyPages(pdfDoc, indices)
        copias.forEach(p => novoPdf.addPage(p))
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
      console.log(`[upload] DOCX: ${file.name} | texto: ${textoDocx.length} chars`)
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
    console.log(`[upload] Claude raw (primeiros 500 chars):\n${raw.substring(0, 500)}`)
    try {
      analise = JSON.parse(extractJson(raw))
      console.log('[upload] Parsed OK — chaves:', Object.keys(analise).join(', '))
      console.log('[upload] numeroProcesso:', analise.numeroProcesso, '| tribunal:', analise.tribunal, '| autor:', analise.autor)
    } catch (parseErr) {
      console.error('[upload] ❌ JSON parse error:', parseErr instanceof Error ? parseErr.message : parseErr)
      console.error('[upload] Texto completo do modelo:', raw)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload] ❌ Anthropic API error:', msg)
    return NextResponse.json({ ok: false, message: `Erro na análise IA: ${msg}` }, { status: 500 })
  }

  // ── Upsert Processo ────────────────────────────────────────────────────────
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
      create: {
        numeroProcesso,
        classe:           null,
        dataDistribuicao: null,
        ...processoFields,
      },
    })

    const extractedData = JSON.stringify({
      numeroProcesso,
      autor:          analise.autor ?? null,
      reu:            analise.reu ?? null,
      vara:           analise.vara ?? null,
      tribunal:       analise.tribunal ?? tribunal,
      assunto:        (analise.resumoProcesso as Record<string, string> | null)?.tipoAcao ?? null,
      quesitos:       (analise.nomeacaoDespacho as Record<string, unknown> | null)?.quesitos ?? [],
      endereco:       analise.enderecoVistoria ?? null,
      tipoPericia:    analise.tipoPericia ?? null,
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

    const nomeacaoDespacho = analise.nomeacaoDespacho as Record<string, unknown> | null
    const aceiteHonorarios = analise.aceiteHonorarios as Record<string, unknown> | null

    const preview = {
      numeroProcesso,
      tribunal:           processoFields.tribunal,
      assunto:            processoFields.assunto,
      vara:               processoFields.orgaoJulgador,
      autor:              (analise.autor as string | null) ?? null,
      reu:                (analise.reu   as string | null) ?? null,
      complexidade:       (aceiteHonorarios?.complexidade as string | null) ?? null,
      pontoControvertido: (nomeacaoDespacho?.determinacaoJuiz as string | null) ?? null,
    }

    return NextResponse.json({ ok: true, nomeacaoId: nomeacao.id, preview })
  } catch (err) {
    console.error('[upload] DB error:', err)
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : 'Erro ao salvar no banco' },
      { status: 500 },
    )
  }
}

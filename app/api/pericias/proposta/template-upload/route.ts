import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { get as blobGet } from '@vercel/blob'
import { saveProposalTemplate } from '@/lib/actions/proposal-template'
import { detectTags } from '@/lib/services/docx-engine'

export const maxDuration = 30

// After the client uploads chunks + assembles via /api/upload-chunk + /api/upload-assemble,
// it calls this endpoint with the resulting blobUrl to:
//  1. Download the assembled DOCX from Blob
//  2. Detect template tags via docxtemplater dry-run
//  3. Persist metadata to ProposalTemplate table
//  4. Return templateId + tags to client

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json() as {
    blobUrl:      string
    nomeArquivo:  string
    tamanhoBytes: number
    nome:         string
    descricao?:   string
  }

  if (!body.blobUrl || !body.nomeArquivo || !body.nome) {
    return NextResponse.json({ ok: false, error: 'blobUrl, nomeArquivo e nome são obrigatórios' }, { status: 400 })
  }

  if (body.tamanhoBytes > 5 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: 'Template muito grande (máx. 5 MB)' }, { status: 400 })
  }

  const ext = body.nomeArquivo.split('.').pop()?.toLowerCase()
  if (ext !== 'docx') {
    return NextResponse.json({ ok: false, error: 'Apenas arquivos .docx são aceitos como template' }, { status: 400 })
  }

  // Download to detect tags
  let buffer: Buffer
  try {
    const result = await blobGet(body.blobUrl, { access: 'private' })
    if (!result || result.statusCode !== 200 || !result.stream) throw new Error('Blob inacessível')
    const reader = result.stream.getReader()
    const parts: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      parts.push(value)
    }
    buffer = Buffer.concat(parts.map((p) => Buffer.from(p)))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: `Erro ao baixar template: ${msg}` }, { status: 500 })
  }

  // Dry-run tag detection via engine
  const detectResult = await detectTags(buffer)
  const uniqueTags   = detectResult.ok ? detectResult.tags : []
  if (!detectResult.ok) {
    console.warn('[template-upload] tag detection failed:', detectResult.message)
    // Non-fatal — proceed with empty tags
  }

  // Persist
  const result = await saveProposalTemplate({
    blobUrl:      body.blobUrl,
    nomeArquivo:  body.nomeArquivo,
    tamanhoBytes: body.tamanhoBytes,
    nome:         body.nome,
    descricao:    body.descricao,
    tagsDetected: uniqueTags,
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    templateId:   result.templateId,
    tagsDetected: uniqueTags,
  })
}

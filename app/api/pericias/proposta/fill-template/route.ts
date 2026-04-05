import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { get as blobGet } from '@vercel/blob'
import { getTemplateBlobUrl } from '@/lib/actions/proposal-template'
import { fillTemplate } from '@/lib/services/docx-engine'

export const maxDuration = 30

interface FillTemplateBody {
  templateId: string
  data: Record<string, string>
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const userId = session.user.id

  let body: FillTemplateBody
  try {
    body = await req.json() as FillTemplateBody
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { templateId, data } = body
  if (!templateId || !data) {
    return NextResponse.json({ error: 'templateId e data são obrigatórios' }, { status: 400 })
  }

  // Authorize + resolve blob URL (never exposed to client)
  const blobUrl = await getTemplateBlobUrl(templateId, userId)
  if (!blobUrl) {
    return NextResponse.json({ error: 'Template não encontrado ou sem permissão' }, { status: 404 })
  }

  // Download template from private Vercel Blob
  let buffer: Buffer
  try {
    const result = await blobGet(blobUrl, { access: 'private' })
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error('Blob não encontrado ou inacessível')
    }
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
    console.error('[fill-template] download failed:', msg)
    return NextResponse.json({ error: `Erro ao baixar template: ${msg}` }, { status: 500 })
  }

  // Render via engine (handles currency formatting + nullGetter internally)
  const result = await fillTemplate(buffer, data)
  if (!result.ok) {
    console.error('[fill-template] engine error:', result.message)
    const status = result.code === 'CORRUPT_TEMPLATE' ? 422 : 500
    return NextResponse.json({ error: result.message }, { status })
  }

  const safeName = `proposta-${(data.numeroProcesso ?? 'proposta').replace(/[^a-zA-Z0-9-]/g, '-')}.docx`

  return new NextResponse(result.buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${safeName}"`,
    },
  })
}

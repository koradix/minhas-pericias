import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export const maxDuration = 30

function formatBRL(v: number | null | undefined): string {
  if (v == null) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const formData = await req.formData()
  const templateFile = formData.get('template') as File | null
  const dataRaw      = formData.get('data') as string | null

  if (!templateFile || !dataRaw) {
    return NextResponse.json({ error: 'template e data são obrigatórios' }, { status: 400 })
  }

  const mimeType = templateFile.type
  const isDocx =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    templateFile.name.endsWith('.docx')

  if (!isDocx) {
    return NextResponse.json({ error: 'Apenas arquivos .docx são suportados como modelo' }, { status: 400 })
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(dataRaw) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Campo data não é JSON válido' }, { status: 400 })
  }

  // Build tag values available in the template
  const tagData: Record<string, string> = {
    numeroProcesso:    String(data.numeroProcesso ?? ''),
    tribunal:          String(data.tribunal ?? ''),
    vara:              String(data.vara ?? ''),
    assunto:           String(data.assunto ?? ''),
    autor:             String(data.autor ?? ''),
    tipoPericia:       String(data.tipoPericia ?? ''),
    endereco:          String(data.endereco ?? ''),
    peritoNome:        String(data.peritoNome ?? ''),
    peritoQual:        String(data.peritoQual ?? ''),
    descricaoServicos: String(data.descricaoServicos ?? ''),
    valorHonorarios:   formatBRL(data.valorHonorarios as number | null),
    custoDeslocamento: formatBRL(data.custoDeslocamento as number | null),
    prazoEstimado:     String(data.prazoEstimado ?? ''),
    observacoes:       String(data.observacoes ?? ''),
    hoje:              String(data.hoje ?? new Date().toLocaleDateString('pt-BR')),
  }

  try {
    const PizZip      = (await import('pizzip')).default
    const Docxtemplater = (await import('docxtemplater')).default

    const buffer = Buffer.from(await templateFile.arrayBuffer())
    const zip    = new PizZip(buffer)
    const doc    = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks:    true,
    })

    doc.render(tagData)

    const out = doc.getZip().generate({ type: 'nodebuffer', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })

    return new NextResponse(out as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="proposta-preenchida.docx"`,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[fill-template]', msg)
    // Common docxtemplater error: tag not found in template — give helpful message
    if (msg.includes('tag') || msg.includes('Unclosed')) {
      return NextResponse.json(
        { error: `Erro no modelo: ${msg}. Verifique se as tags usam o formato {{tagName}}.` },
        { status: 422 },
      )
    }
    return NextResponse.json({ error: `Erro ao preencher modelo: ${msg}` }, { status: 500 })
  }
}

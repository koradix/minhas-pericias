// ─── Download de documento do Escavador ──────────────────────────────────────
// Proxy server-side — baixa o PDF do Escavador e devolve ao browser como stream.
// Evita CORS e mantém o token do Escavador seguro no servidor.
//
// GET /api/nomeacoes/doc-download?docId=<processoDocumento.id>

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { radar } from '@/lib/services/radar'
import { EscavadorService } from '@/lib/services/escavador'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const userId = session.user.id

  const docId = request.nextUrl.searchParams.get('docId')
  if (!docId) {
    return NextResponse.json({ error: 'docId obrigatório' }, { status: 400 })
  }

  // Verifica que o documento pertence a uma nomeação do usuário
  const doc = await prisma.processoDocumento.findUnique({
    where: { id: docId },
    include: { processo: { include: { nomeacoes: { where: { peritoId: userId } } } } },
  }).catch(() => null)

  if (!doc || doc.processo.nomeacoes.length === 0) {
    return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
  }

  try {
    const escavador = radar as EscavadorService
    const cnj = doc.processo.numeroProcesso
    let buffer: Buffer

    if (doc.chaveV2) {
      // v2 — usa CNJ + chaveV2
      buffer = await escavador.downloadDocumentoV2(cnj, doc.chaveV2, doc.urlPublica ?? undefined)
    } else if (doc.escavadorDocId != null && doc.processo.escavadorId != null) {
      // v1 — usa escavadorId numérico
      buffer = await escavador.downloadDocumento(doc.processo.escavadorId, doc.escavadorDocId, doc.urlPublica)
    } else {
      return NextResponse.json({ error: 'Identificador do documento não disponível' }, { status: 404 })
    }

    const safeName = doc.nome.replace(/[^a-zA-Z0-9._\- ]/g, '_').replace(/\s+/g, '_') + '.pdf'

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[doc-download]', msg)
    return NextResponse.json({ error: `Erro ao baixar documento: ${msg}` }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { gerarLaudoDocx, type LaudoDocxInput } from '@/lib/services/laudo-docx'
import { getMidiasByPericiaId } from '@/lib/data/checkpoint-media'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let input: LaudoDocxInput & { periciaId?: string }
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Se vier periciaId, busca fotos do banco — evita receber data URIs no body
  if (input.periciaId) {
    try {
      const midias = await getMidiasByPericiaId(input.periciaId, session.user.id)
      input.fotos = midias
        .filter((m) => m.tipo === 'foto' && m.url)
        .map((m) => ({ url: m.url!, descricao: m.descricao ?? '' }))
    } catch (err) {
      console.error('[laudo/exportar] erro ao buscar mídias:', err)
    }
  }

  try {
    const buffer = await gerarLaudoDocx(input)

    return new NextResponse(new Uint8Array(buffer) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Laudo_Pericial_${input.processo?.replace(/\//g, '-') ?? 'rascunho'}.docx"`,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg.slice(0, 200) }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { gerarLaudoDocx, type LaudoDocxInput } from '@/lib/services/laudo-docx'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let input: LaudoDocxInput
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
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

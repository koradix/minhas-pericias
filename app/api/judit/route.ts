import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isJuditReady } from '@/lib/integrations/judit/config'
import { judit } from '@/lib/integrations/judit/service'

/**
 * GET /api/judit?cnj=0807074-02.2024.8.19.0075
 * Testa a consulta de processo via Judit (rota legada de debug).
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  if (!isJuditReady()) {
    return NextResponse.json({ error: 'Judit não habilitada. Configure JUDIT_ENABLED=true e JUDIT_API_KEY.' }, { status: 503 })
  }

  const cnj = req.nextUrl.searchParams.get('cnj')
  if (!cnj) {
    return NextResponse.json({ error: 'Parâmetro cnj obrigatório' }, { status: 400 })
  }

  try {
    const result = await judit.fetchProcessByCnj(cnj)
    return NextResponse.json({ ok: true, data: result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg.slice(0, 300) }, { status: 500 })
  }
}

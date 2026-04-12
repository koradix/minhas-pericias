/**
 * POST /api/integrations/judit/carregar-autos
 *
 * Fluxo completo: sync com attachments → download PDFs → analise IA → salvar.
 *
 * Body: { "periciaId": "..." }
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isJuditReady } from '@/lib/integrations/judit/config'
import { carregarAutosJudit } from '@/lib/actions/carregar-autos-judit'

export async function POST(req: Request) {
  if (!isJuditReady()) {
    return NextResponse.json(
      { ok: false, message: 'Judit integration is disabled' },
      { status: 503 },
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 403 })
  }

  let body: { periciaId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  const periciaId = body.periciaId?.trim()
  if (!periciaId) {
    return NextResponse.json({ ok: false, message: 'Field "periciaId" is required' }, { status: 400 })
  }

  const result = await carregarAutosJudit(periciaId)
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}

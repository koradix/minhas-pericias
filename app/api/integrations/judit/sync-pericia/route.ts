/**
 * POST /api/integrations/judit/sync-pericia
 *
 * Re-sincroniza uma pericia existente pela Judit.
 * Consulta novamente pelo CNJ e atualiza dados, movimentacoes e anexos.
 *
 * Body: { "periciaId": "..." }
 *
 * Response:
 *   200 — sync result
 *   400 — periciaId ausente
 *   403 — nao autenticado
 *   503 — Judit desabilitada
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isJuditReady } from '@/lib/integrations/judit/config'
import { syncPericia } from '@/lib/actions/judit-sync'

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

  const result = await syncPericia(periciaId)
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}

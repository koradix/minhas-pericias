/**
 * POST /api/integrations/judit/fetch-by-cnj
 *
 * Cria request por CNJ na Judit, faz polling, normaliza, cria/atualiza pericia.
 * Protegido por JUDIT_ENABLED.
 *
 * Body: { "cnj": "0000123-45.2024.8.19.0001" }
 *
 * Response:
 *   200 — { ok, message, periciaId, requestId, created, movementsCount, attachmentsCount }
 *   400 — cnj ausente
 *   403 — nao autenticado
 *   503 — Judit desabilitada
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isJuditReady } from '@/lib/integrations/judit/config'
import { fetchAndSyncByCnj } from '@/lib/actions/judit-sync'

export const maxDuration = 120

export async function POST(req: Request) {
  if (!isJuditReady()) {
    return NextResponse.json(
      { ok: false, message: 'Judit integration is disabled (JUDIT_ENABLED=false)' },
      { status: 503 },
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 403 })
  }

  let body: { cnj?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  const cnj = body.cnj?.trim()
  if (!cnj) {
    return NextResponse.json({ ok: false, message: 'Field "cnj" is required' }, { status: 400 })
  }

  const result = await fetchAndSyncByCnj(cnj)
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}

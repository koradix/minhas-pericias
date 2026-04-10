/**
 * GET /api/integrations/judit/request-status?requestId=xxx
 *
 * Consulta status de uma request na Judit.
 *
 * Query: ?requestId=xxx
 *
 * Response:
 *   200 — { request_id, status, ... }
 *   400 — requestId ausente
 *   403 — nao autenticado
 *   503 — Judit desabilitada
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isJuditReady } from '@/lib/integrations/judit/config'
import { judit } from '@/lib/integrations/judit/service'

export async function GET(req: Request) {
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

  const url = new URL(req.url)
  const requestId = url.searchParams.get('requestId')?.trim()

  if (!requestId) {
    return NextResponse.json({ ok: false, message: 'Query param "requestId" is required' }, { status: 400 })
  }

  try {
    const status = await judit.getRequestStatus(requestId)
    return NextResponse.json({ ok: true, ...status })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, message: msg }, { status: 422 })
  }
}

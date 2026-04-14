/**
 * POST /api/integrations/judit/carregar-autos
 *
 * Fase 1: Cria request na Judit (instantâneo).
 * NÃO faz polling — o cliente faz polling do status.
 *
 * Body: { "periciaId": "...", "action": "iniciar" | "sync" }
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isJuditReady } from '@/lib/integrations/judit/config'
import { iniciarCarregamento, sincronizarDados } from '@/lib/actions/carregar-autos-judit'

export const maxDuration = 60

export async function POST(req: Request) {
  if (!isJuditReady()) {
    return NextResponse.json({ ok: false, message: 'Judit disabled' }, { status: 503 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 403 })
  }

  let body: { periciaId?: string; action?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const periciaId = body.periciaId?.trim()
  if (!periciaId) {
    return NextResponse.json({ ok: false, message: '"periciaId" required' }, { status: 400 })
  }

  const action = body.action ?? 'iniciar'

  if (action === 'sync') {
    const result = await sincronizarDados(periciaId)
    return NextResponse.json(result, { status: result.ok ? 200 : 422 })
  }

  const result = await iniciarCarregamento(periciaId)
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}

/**
 * POST /api/pericias/analisar-autos
 *
 * Analisa PDFs já baixados (via Judit) com IA.
 * Body: { "periciaId": "..." }
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analisarAutosIA } from '@/lib/actions/analisar-autos-ia'

export const maxDuration = 120

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 403 })
  }

  let body: { periciaId?: string; attachmentIds?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const periciaId = body.periciaId?.trim()
  if (!periciaId) {
    return NextResponse.json({ ok: false, message: '"periciaId" required' }, { status: 400 })
  }

  const result = await analisarAutosIA(periciaId, body.attachmentIds)
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}

/**
 * POST /api/integrations/judit/fetch-by-cpf
 *
 * Pesquisa processos por CPF na Judit.
 * Cria/atualiza pericias, sincroniza movimentacoes e anexos.
 *
 * Body: { "cpf": "123.456.789-00" }
 *
 * Response detalhada com contadores.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isJuditReady } from '@/lib/integrations/judit/config'
import { fetchAndSyncByCpf } from '@/lib/actions/judit-sync'

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

  let body: { cpf?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  const cpf = body.cpf?.trim()
  if (!cpf) {
    return NextResponse.json({ ok: false, message: 'Field "cpf" is required' }, { status: 400 })
  }

  const result = await fetchAndSyncByCpf(cpf)
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}

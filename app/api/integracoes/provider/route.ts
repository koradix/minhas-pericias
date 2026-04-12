/**
 * POST /api/integracoes/provider
 * Salva a preferência de provedor de API do usuário.
 * Body: { "provider": "escavador" | "judit" | "both" | "manual" }
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  let body: { provider?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const provider = body.provider?.trim()
  if (!provider || !['escavador', 'judit', 'both', 'manual'].includes(provider)) {
    return NextResponse.json({ ok: false, message: 'Provider inválido' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { apiProvider: provider },
  })

  return NextResponse.json({ ok: true })
}

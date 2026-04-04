// ─── Upload de chunk individual ───────────────────────────────────────────────
// Recebe um pedaço do arquivo (< 4MB) e armazena como blob temporário.
// Não tem CORS — browser → mesmo domínio → serverless → Vercel Blob CDN (server-side).
// Chamado N vezes para arquivos grandes (N = ceil(fileSize / 3MB)).

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/auth'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Não autorizado' }, { status: 401 })
  }

  const sessionId = request.headers.get('x-session') ?? ''
  const index     = request.headers.get('x-index')   ?? '0'
  const total     = request.headers.get('x-total')   ?? '1'

  if (!sessionId) {
    return NextResponse.json({ ok: false, message: 'x-session obrigatório' }, { status: 400 })
  }

  if (!request.body) {
    return NextResponse.json({ ok: false, message: 'Corpo vazio' }, { status: 400 })
  }

  try {
    const chunkName = `tmp/${sessionId}/chunk-${index.padStart(4, '0')}-of-${total}`
    const blob = await put(chunkName, request.body, {
      access: 'public',
      contentType: 'application/octet-stream',
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    return NextResponse.json({ ok: true, chunkUrl: blob.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload-chunk]', msg)
    return NextResponse.json({ ok: false, message: `Erro ao salvar chunk: ${msg}` }, { status: 500 })
  }
}

// ─── Upload proxy (Edge runtime) ──────────────────────────────────────────────
//
// O browser envia o arquivo para este endpoint no mesmo domínio (sem CORS).
// O Edge function faz stream para o Vercel Blob server-side.
//
// Por que Edge e não Serverless?
//   - Serverless Hobby: limite de 4.5MB no corpo da requisição
//   - Edge: sem limite de body (streaming), até 25 MB de resposta
//
// Uso:
//   const res = await fetch('/api/upload', {
//     method: 'POST',
//     headers: { 'x-filename': 'doc.pdf', 'Content-Type': 'application/pdf' },
//     body: file,
//   })
//   const { url } = await res.json()

import { type NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { getToken } from 'next-auth/jwt'

export const runtime = 'edge'
export const maxDuration = 60

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export async function POST(request: NextRequest) {
  // Edge-compatible auth via JWT cookie
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  if (!token?.sub) {
    return Response.json({ ok: false, message: 'Não autorizado' }, { status: 401 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  const mimeBase = contentType.split(';')[0].trim()

  if (!ALLOWED_TYPES.includes(mimeBase)) {
    return Response.json(
      { ok: false, message: 'Apenas PDF ou DOCX são aceitos' },
      { status: 400 },
    )
  }

  const rawName = request.headers.get('x-filename') ?? 'documento'
  // Sanitiza o nome para não conter caracteres problemáticos na URL do Blob
  const filename = rawName.replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 200)

  if (!request.body) {
    return Response.json({ ok: false, message: 'Corpo vazio' }, { status: 400 })
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
      contentType: mimeBase,
      addRandomSuffix: true,
    })

    return Response.json({ ok: true, url: blob.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload/edge]', msg)
    return Response.json({ ok: false, message: `Erro ao salvar arquivo: ${msg}` }, { status: 500 })
  }
}

// ─── Montagem dos chunks em arquivo final ─────────────────────────────────────
// Baixa todos os chunk blobs (privados), concatena em memória, salva como blob final.
// Deleta os chunks temporários.

import { NextRequest, NextResponse } from 'next/server'
import { put, get, del } from '@vercel/blob'
import { auth } from '@/auth'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json() as {
    chunkUrls: string[]
    filename:  string
    mimeType:  string
  }

  const { chunkUrls, filename, mimeType } = body
  if (!chunkUrls?.length || !filename || !mimeType) {
    return NextResponse.json({ ok: false, message: 'chunkUrls, filename e mimeType são obrigatórios' }, { status: 400 })
  }

  try {
    // Baixa e concatena todos os chunks via SDK (suporta blobs privados)
    const buffers: Buffer[] = []
    for (const url of chunkUrls) {
      const result = await get(url, { access: 'private' })
      if (!result || result.statusCode !== 200 || !result.stream) {
        throw new Error(`Falha ao baixar chunk: ${url}`)
      }
      const reader = result.stream.getReader()
      const parts: Uint8Array[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        parts.push(value)
      }
      buffers.push(Buffer.concat(parts.map(p => Buffer.from(p))))
    }

    const finalBuffer = Buffer.concat(buffers)
    console.log(`[upload-assemble] ${chunkUrls.length} chunks → ${(finalBuffer.length / 1024 / 1024).toFixed(1)} MB`)

    const safeName = filename.replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 200)
    const blob = await put(safeName, finalBuffer, {
      access: 'private',
      contentType: mimeType,
      addRandomSuffix: true,
    })

    // Deleta chunks (fire-and-forget)
    del(chunkUrls).catch((e) => console.warn('[upload-assemble] del chunks:', e))

    return NextResponse.json({ ok: true, url: blob.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload-assemble]', msg)
    return NextResponse.json({ ok: false, message: `Erro ao montar arquivo: ${msg}` }, { status: 500 })
  }
}

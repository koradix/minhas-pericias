// ─── Montagem dos chunks em arquivo final ─────────────────────────────────────
// Baixa todos os chunk blobs, concatena em memória, salva como blob final.
// Deleta os chunks temporários.
// Chamado uma vez depois que todos os chunks foram enviados.

import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
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
    // Download e concatena todos os chunks (server-side, sem limite de tamanho)
    const buffers: Buffer[] = []
    for (const url of chunkUrls) {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Falha ao baixar chunk: ${url} (HTTP ${res.status})`)
      buffers.push(Buffer.from(await res.arrayBuffer()))
    }

    const finalBuffer = Buffer.concat(buffers)
    console.log(`[upload-assemble] ${chunkUrls.length} chunks → ${(finalBuffer.length / 1024 / 1024).toFixed(1)} MB`)

    // Salva arquivo final
    const safeName = filename.replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 200)
    const blob = await put(safeName, finalBuffer, {
      access: 'public',
      contentType: mimeType,
      addRandomSuffix: true,
    })

    // Deleta chunks temporários (fire-and-forget)
    del(chunkUrls).catch((e) => console.warn('[upload-assemble] del chunks:', e))

    return NextResponse.json({ ok: true, url: blob.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload-assemble]', msg)
    return NextResponse.json({ ok: false, message: `Erro ao montar arquivo: ${msg}` }, { status: 500 })
  }
}

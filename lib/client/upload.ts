// ─── Chunked upload helper ────────────────────────────────────────────────────
// Divide o arquivo em pedaços de 3MB e envia cada um via POST ao mesmo domínio.
// Sem CORS, sem limite de tamanho. Funciona no Vercel Hobby.

const CHUNK_SIZE = 3 * 1024 * 1024 // 3 MB por chunk — abaixo do limite Serverless de 4.5 MB

export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const sessionId  = crypto.randomUUID()
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const chunkUrls: string[] = []

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end   = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    const res = await fetch('/api/upload-chunk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'x-session':    sessionId,
        'x-index':      String(i),
        'x-total':      String(totalChunks),
        'x-filename':   file.name,
      },
      body: chunk,
    })

    const json = await res.json() as { ok: boolean; chunkUrl?: string; message?: string }
    if (!json.ok || !json.chunkUrl) throw new Error(json.message ?? 'Falha ao enviar parte do arquivo')
    chunkUrls.push(json.chunkUrl)

    // 0-85% para o upload, 85-100% para montagem
    onProgress?.(Math.round(((i + 1) / totalChunks) * 85))
  }

  // Monta arquivo final server-side
  const res = await fetch('/api/upload-assemble', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chunkUrls, filename: file.name, mimeType: file.type }),
  })

  const json = await res.json() as { ok: boolean; url?: string; message?: string }
  if (!json.ok || !json.url) throw new Error(json.message ?? 'Falha ao montar arquivo')

  onProgress?.(100)
  return json.url
}

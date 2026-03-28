import { type NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { auth } from '@/auth'

// Autoriza uploads diretos do browser para Vercel Blob.
// O arquivo NÃO passa pela função serverless — vai direto para o CDN.
// Isso resolve o limite de 4.5 MB do Vercel Hobby para payloads de serverless.

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => {
        if (!session?.user?.id) throw new Error('Não autorizado')
        return {
          allowedContentTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50 MB
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        }
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('[blob] Upload concluído:', blob.url)
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao autorizar upload' },
      { status: 400 },
    )
  }
}

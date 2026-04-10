import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export const maxDuration = 60

// ─── Input / Output ──────────────────────────────────────────────────────────

interface TranscribeInput {
  midiaId: string
  audioBase64: string // data:audio/webm;base64,...
}

interface TranscribeOutput {
  ok: boolean
  texto?: string       // transcrição bruta
  textoPericial?: string // reformulado em linguagem pericial
  error?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function base64ToBuffer(dataUri: string): { buffer: Buffer; mimeType: string } {
  const match = dataUri.match(/^data:(audio\/[^;]+);base64,(.+)$/)
  if (!match) throw new Error('Formato base64 inválido')
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

// ─── Whisper transcription ───────────────────────────────────────────────────

async function transcreverComWhisper(buffer: Buffer, mimeType: string): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) throw new Error('OPENAI_API_KEY não configurada')

  const ext = mimeType === 'audio/webm' ? 'webm' : mimeType === 'audio/mp4' ? 'mp4' : 'webm'
  const fileName = `audio.${ext}`

  const formData = new FormData()
  const blob = new Blob([buffer as BlobPart], { type: mimeType })
  formData.append('file', blob, fileName)
  formData.append('model', 'whisper-1')
  formData.append('language', 'pt')
  formData.append('response_format', 'text')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: formData,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Whisper error ${res.status}: ${errText.slice(0, 200)}`)
  }

  return (await res.text()).trim()
}

// ─── Claude reformulation ────────────────────────────────────────────────────

async function reformularPericial(transcricao: string): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return transcricao // fallback: devolve bruta

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `Você é assistente de um perito judicial. Receba uma transcrição de áudio gravada durante vistoria e reformule em linguagem técnica/jurídica adequada para laudo pericial.

REGRAS:
1. Mantenha TODOS os fatos, medidas, observações e detalhes técnicos.
2. Corrija erros de fala e organize em frases claras.
3. Use tom impessoal e formal (terceira pessoa: "verificou-se", "constatou-se").
4. Mantenha conciso — não adicione informações que não existam na transcrição.
5. Retorne APENAS o texto reformulado, sem explicações.`,
      messages: [{ role: 'user', content: `Transcrição do áudio:\n\n${transcricao}` }],
    }),
  })

  if (!res.ok) return transcricao // fallback

  const body = await res.json()
  return body?.content?.[0]?.text?.trim() ?? transcricao
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<TranscribeOutput>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  let input: TranscribeInput
  try {
    input = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 })
  }

  if (!input.audioBase64 || !input.midiaId) {
    return NextResponse.json({ ok: false, error: 'midiaId e audioBase64 são obrigatórios' }, { status: 400 })
  }

  try {
    // 1. Decode base64
    const { buffer, mimeType } = base64ToBuffer(input.audioBase64)

    // Validate size (~1min webm ≈ 500KB-1MB, cap at 2MB)
    if (buffer.length > 2 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: 'Áudio excede o limite de 2MB (~1 minuto)' }, { status: 400 })
    }

    // 2. Whisper → texto bruto
    const texto = await transcreverComWhisper(buffer, mimeType)

    if (!texto || texto.length < 3) {
      return NextResponse.json({ ok: false, error: 'Não foi possível transcrever o áudio. Tente gravar novamente.' }, { status: 422 })
    }

    // 3. Claude → linguagem pericial
    const textoPericial = await reformularPericial(texto)

    return NextResponse.json({ ok: true, texto, textoPericial })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[transcribe]', msg)
    return NextResponse.json({ ok: false, error: msg.slice(0, 200) }, { status: 500 })
  }
}

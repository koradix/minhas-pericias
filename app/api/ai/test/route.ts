import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST() {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY não configurada' }, { status: 500 })
  }

  try {
    const client = new OpenAI({ apiKey: key })
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Responda apenas: OK' }],
      max_tokens: 5,
    })
    const reply = res.choices[0]?.message?.content?.trim() ?? ''
    return NextResponse.json({ ok: true, reply, model: res.model, provider: 'openai' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    const status = msg.includes('401') || msg.includes('Incorrect API') ? 401 : 500
    return NextResponse.json({ ok: false, error: msg }, { status })
  }
}

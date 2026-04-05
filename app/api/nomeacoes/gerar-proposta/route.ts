import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export const maxDuration = 60

export interface GerarPropostaInput {
  numeroProcesso: string
  tribunal:       string
  vara:           string
  assunto:        string
  autor:          string
  tipoPericia:    string
  quesitos:       string[]
  endereco:       string
  peritoNome:     string
  peritoQual:     string
}

function buildPrompt(d: GerarPropostaInput): string {
  const quesitosList = d.quesitos.length
    ? d.quesitos.map((q, i) => `  ${i + 1}. ${q}`).join('\n')
    : '  [quesitos não disponíveis]'

  return `Você é um perito judicial experiente no Brasil. Gere o conteúdo de uma proposta de honorários periciais profissional e completa com base nos dados abaixo.

DADOS DO PROCESSO:
- Número: ${d.numeroProcesso}
- Tribunal: ${d.tribunal}
- Vara/Órgão: ${d.vara || '[não informado]'}
- Assunto/Tipo de ação: ${d.assunto || '[não informado]'}
- Parte (Autor/Requerente): ${d.autor || '[não informado]'}
- Tipo de Perícia: ${d.tipoPericia || '[não informado]'}
- Endereço para vistoria: ${d.endereco || '[a definir]'}

QUESITOS:
${quesitosList}

PERITO:
- Nome: ${d.peritoNome || '[preencher]'}
- Qualificação: ${d.peritoQual || '[preencher]'}

Retorne um JSON com exatamente esta estrutura (sem markdown, sem texto fora do JSON):
{
  "descricaoServicos": "Descrição técnica e profissional dos serviços periciais, metodologia, escopo, diligências previstas. Mínimo 3 parágrafos.",
  "valorHonorarios": 5000,
  "custoDeslocamento": 500,
  "prazoEstimado": "30 dias úteis após acesso aos autos",
  "observacoes": "Condições, ressalvas, forma de pagamento, reajuste, etc.",
  "complexidadeNota": "Alta / Média / Baixa — justificativa de 1 linha"
}

Regras:
- Use linguagem formal e técnica compatível com padrão TJRJ/TRT/JFRJ
- O valor de honorários deve ser uma estimativa realista baseada na complexidade da perícia (tipo, quesitos, deslocamento)
- Não invente dados do processo — use apenas o que foi fornecido
- descricaoServicos deve ser texto rico em parágrafos separados por \\n\\n
- Retorne somente o objeto JSON válido, sem blocos de código`
}

async function gerarComClaude(prompt: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : '{}'
}

async function gerarComGemini(prompt: string): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

function extractJson(text: string): string {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (block) return block[1].trim()
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return obj[0]
  return text.trim()
}

function isRateLimit(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return msg.includes('rate_limit') || msg.includes('rate limit') ||
    msg.includes('429') || msg.includes('credit') || msg.includes('overloaded') ||
    msg.includes('529') || msg.includes('quota')
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json() as GerarPropostaInput
  const prompt = buildPrompt(body)

  let raw = ''
  let usedModel = ''

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      raw = await gerarComClaude(prompt)
      usedModel = 'claude'
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[gerar-proposta] Claude falhou: ${msg}`)
      if (!isRateLimit(err)) {
        return NextResponse.json({ ok: false, error: `Erro Claude: ${msg}` }, { status: 500 })
      }
      // fallthrough to Gemini
    }
  }

  if (!raw) {
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      return NextResponse.json({ ok: false, error: 'IA indisponível: sem créditos' }, { status: 503 })
    }
    try {
      raw = await gerarComGemini(prompt)
      usedModel = 'gemini'
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[gerar-proposta] Gemini falhou: ${msg}`)
      return NextResponse.json({ ok: false, error: `Erro Gemini: ${msg}` }, { status: 500 })
    }
  }

  try {
    const parsed = JSON.parse(extractJson(raw))
    console.log(`[gerar-proposta] OK via ${usedModel}`)
    return NextResponse.json({ ok: true, ...parsed })
  } catch {
    console.error('[gerar-proposta] JSON parse falhou. Raw:', raw.substring(0, 300))
    return NextResponse.json({ ok: false, error: 'Resposta da IA não é JSON válido' }, { status: 500 })
  }
}

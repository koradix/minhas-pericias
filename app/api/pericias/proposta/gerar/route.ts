import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export const maxDuration = 60

// ─── Input ────────────────────────────────────────────────────────────────────

export interface GerarPropostaInput {
  // Process data
  numeroProcesso:       string
  tribunal:             string
  vara:                 string
  comarca:              string | null
  tipoAcao:             string
  objetoPericia:        string
  areaTecnica:          string
  quesitos:             string[]
  autor:                string | null
  reu:                  string | null
  valorCausa:           number | null
  // Analysis
  complexidade:         string
  estrategia:           string
  justificativas:       string[]
  enderecoVistoria:     string | null
  necessitaDeslocamento: boolean
  custosLogisticos:     string | null
  prazoAceite:          string | null
  prazoLaudo:           string | null
  tipoVistoria:         string
  equipamentos:         string[]
  riscosTecnicos:       string[]
  riscosJuridicos:      string[]
  informacoesFaltando:  string[]
  // Perito
  peritoNome:           string
  peritoQualificacao:   string
}

// ─── Output schema (matches user-specified JSON structure) ───────────────────

export interface GerarPropostaOutput {
  proposal_version: '1.0'
  language:         'pt-BR'
  processo: {
    numero:        string | null
    vara:          string | null
    comarca:       string | null
    autor:         string | null
    reu:           string | null
    valor_da_causa: number | null
  }
  pericia: {
    objeto:        string | null
    resumo_tecnico: string
    complexidade:  string | null
    local_previsto: string | null
    prazos_relevantes: Array<{ descricao: string; data: string | null }>
  }
  metodologia: {
    texto_base: string
    etapas:     string[]
  }
  estimativa: {
    fases: Array<{ nome: string; descricao: string; horas_estimadas: number | null }>
    despesas: Array<{
      tipo:                  string
      descricao:             string
      quantidade:            number | null
      valor_unitario_sugerido: number | null
    }>
  }
  condicoes: {
    prazo_entrega_dias: number | null
    forma_pagamento:    string | null
    observacoes:        string[]
  }
  texto_documento: {
    titulo:      string
    abertura:    string
    escopo:      string
    metodologia: string
    custos:      string
    condicoes:   string
    fechamento:  string
  }
  qa: {
    campos_faltantes:    string[]
    riscos:              string[]
    checagens_realizadas: string[]
  }
}

// ─── System prompt (user-specified) ──────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um assistente especializado em estruturar propostas de honorários periciais no Brasil.

Sua função NÃO é gerar um arquivo Word e NÃO é inventar layout.
Sua única função é retornar um JSON válido, completo, consistente e rastreável, para que o backend gere um documento .docx a partir de um template.

Regras obrigatórias:
1. Retorne apenas JSON válido.
2. Não escreva markdown.
3. Não invente fatos.
4. Se um dado não estiver disponível, use null.
5. Sempre separe claramente: dados do processo, escopo da perícia, metodologia, estimativa de esforço, despesas, condições, pendências.
6. O texto deve ser profissional, objetivo, claro e utilizável em proposta de honorários.
7. Não faça cálculo final fechado se não houver informação suficiente.
8. Sempre aponte campos faltantes e riscos.`

function buildUserPrompt(input: GerarPropostaInput): string {
  const analysis = {
    objeto:                input.objetoPericia,
    areaTecnica:           input.areaTecnica,
    complexidade:          input.complexidade,
    estrategia:            input.estrategia,
    justificativas:        input.justificativas,
    quesitos:              input.quesitos,
    tipoVistoria:          input.tipoVistoria,
    equipamentos:          input.equipamentos,
    enderecoVistoria:      input.enderecoVistoria,
    necessitaDeslocamento: input.necessitaDeslocamento,
    custosLogisticos:      input.custosLogisticos,
    prazoAceite:           input.prazoAceite,
    prazoLaudo:            input.prazoLaudo,
    riscosTecnicos:        input.riscosTecnicos,
    riscosJuridicos:       input.riscosJuridicos,
    informacoesFaltando:   input.informacoesFaltando,
  }

  const pericia = {
    numero:   input.numeroProcesso,
    tribunal: input.tribunal,
    vara:     input.vara,
    comarca:  input.comarca,
    autor:    input.autor,
    reu:      input.reu,
    valorCausa: input.valorCausa,
    tipoAcao: input.tipoAcao,
  }

  const preferences = {
    peritoNome:         input.peritoNome,
    peritoQualificacao: input.peritoQualificacao,
  }

  return `Baseie-se estritamente nos dados abaixo.

Schema exato de saída (retorne SOMENTE este JSON, sem texto adicional):
{
  "proposal_version": "1.0",
  "language": "pt-BR",
  "processo": { "numero": "string|null", "vara": "string|null", "comarca": "string|null", "autor": "string|null", "reu": "string|null", "valor_da_causa": "number|null" },
  "pericia": { "objeto": "string|null", "resumo_tecnico": "string", "complexidade": "string|null", "local_previsto": "string|null", "prazos_relevantes": [{"descricao":"string","data":"string|null"}] },
  "metodologia": { "texto_base": "string", "etapas": ["string"] },
  "estimativa": { "fases": [{"nome":"string","descricao":"string","horas_estimadas":"number|null"}], "despesas": [{"tipo":"string","descricao":"string","quantidade":"number|null","valor_unitario_sugerido":"number|null"}] },
  "condicoes": { "prazo_entrega_dias": "number|null", "forma_pagamento": "string|null", "observacoes": ["string"] },
  "texto_documento": { "titulo":"string","abertura":"string","escopo":"string","metodologia":"string","custos":"string","condicoes":"string","fechamento":"string" },
  "qa": { "campos_faltantes":["string"],"riscos":["string"],"checagens_realizadas":["string"] }
}

ANALISE_DA_IA=${JSON.stringify(analysis, null, 2)}

DADOS_DA_PERICIA=${JSON.stringify(pericia, null, 2)}

PREFERENCIAS_DO_USUARIO=${JSON.stringify(preferences, null, 2)}`
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateOutput(o: unknown): o is GerarPropostaOutput {
  if (typeof o !== 'object' || o === null) return false
  const r = o as Record<string, unknown>
  return (
    typeof r.proposal_version === 'string' &&
    typeof r.language         === 'string' &&
    typeof r.processo         === 'object' && r.processo !== null &&
    typeof r.pericia          === 'object' && r.pericia  !== null &&
    typeof r.metodologia      === 'object' && r.metodologia !== null &&
    typeof r.estimativa       === 'object' && r.estimativa  !== null &&
    typeof r.condicoes        === 'object' && r.condicoes   !== null &&
    typeof r.texto_documento  === 'object' && r.texto_documento !== null &&
    typeof r.qa               === 'object' && r.qa          !== null &&
    typeof (r.pericia as Record<string, unknown>).resumo_tecnico === 'string' &&
    typeof (r.metodologia as Record<string, unknown>).texto_base === 'string'
  )
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

// ─── AI callers ───────────────────────────────────────────────────────────────

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 6000,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userPrompt }],
  })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : '{}'
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
  const model = genAI.getGenerativeModel({
    model:             'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  })
  const result = await model.generateContent(userPrompt)
  return result.response.text()
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  let input: GerarPropostaInput
  try {
    input = await req.json() as GerarPropostaInput
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido' }, { status: 400 })
  }

  const userPrompt = buildUserPrompt(input)
  let raw     = ''
  let iaModel = ''

  // ── Claude (primary) ──────────────────────────────────────────────────────
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      raw     = await callClaude(SYSTEM_PROMPT, userPrompt)
      iaModel = 'claude-haiku-4-5-20251001'
    } catch (err) {
      console.warn('[gerar-proposta] Claude falhou:', err instanceof Error ? err.message : err)
      if (!isRateLimit(err)) {
        return NextResponse.json(
          { ok: false, error: `Erro Claude: ${err instanceof Error ? err.message : String(err)}` },
          { status: 500 },
        )
      }
    }
  }

  // ── Gemini (fallback) ─────────────────────────────────────────────────────
  if (!raw) {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'IA indisponível: sem créditos e sem GEMINI_API_KEY' },
        { status: 503 },
      )
    }
    try {
      raw     = await callGemini(SYSTEM_PROMPT, userPrompt)
      iaModel = 'gemini-2.0-flash'
    } catch (err) {
      console.error('[gerar-proposta] Gemini falhou:', err instanceof Error ? err.message : err)
      return NextResponse.json(
        { ok: false, error: `Erro Gemini: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 },
      )
    }
  }

  // ── Parse + Validate ──────────────────────────────────────────────────────
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJson(raw))
  } catch {
    console.error('[gerar-proposta] JSON parse falhou. Raw (300):', raw.substring(0, 300))
    return NextResponse.json(
      { ok: false, error: 'Resposta da IA não é JSON válido' },
      { status: 500 },
    )
  }

  if (!validateOutput(parsed)) {
    console.error('[gerar-proposta] Output inválido:', JSON.stringify(parsed).substring(0, 400))
    return NextResponse.json(
      { ok: false, error: 'Output da IA não passou na validação de campos obrigatórios' },
      { status: 500 },
    )
  }

  console.log(`[gerar-proposta] OK via ${iaModel}`)

  return NextResponse.json({
    ok:         true,
    iaModel,
    iaRawOutput: raw,
    ...parsed,
  })
}

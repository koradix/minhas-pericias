// ─── Anthropic Provider ───────────────────────────────────────────────────────
// Implements AIProvider using the official Anthropic SDK.
// Activated by setting AI_PROVIDER=anthropic in .env.local
// Requires ANTHROPIC_API_KEY in environment — never hardcoded.

import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider } from '../provider'
import type {
  ExtractProcessDataInput,   ExtractProcessDataOutput,
  GenerateProcessSummaryInput, GenerateProcessSummaryOutput,
  CreatePericiaCardInput,    CreatePericiaCardOutput,
  GenerateFeeProposalInput,  GenerateFeeProposalOutput,
  GenerateReportDraftInput,  GenerateReportDraftOutput,
} from '../types'

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('[AI/Anthropic] ANTHROPIC_API_KEY não configurada')
  return new Anthropic({ apiKey: key })
}

/** Extrai JSON de texto que pode conter bloco markdown ```json``` */
function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  return match ? match[1].trim() : text.trim()
}

async function jsonCompletion<T>(
  system: string,
  userContent: string,
  fallback: T,
): Promise<T> {
  const client = getClient()
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: userContent }],
    })
    const raw = res.content[0]?.type === 'text' ? res.content[0].text : '{}'
    return JSON.parse(extractJson(raw)) as T
  } catch (err) {
    console.error('[AI/Anthropic] Erro:', err instanceof Error ? err.message : err)
    return fallback
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const anthropicProvider: AIProvider = {
  name: 'anthropic',

  // ── extractProcessData ────────────────────────────────────────────────────

  async extractProcessData(input: ExtractProcessDataInput): Promise<ExtractProcessDataOutput> {
    const fallback: ExtractProcessDataOutput = {
      numeroProcesso: null, autor: null, reu: null, vara: null,
      tribunal: null, assunto: null, quesitos: [], endereco: null, tipoPericia: null,
    }
    return jsonCompletion<ExtractProcessDataOutput>(
      'Você é um assistente jurídico especializado em perícias judiciais brasileiras. ' +
      'Extraia informações estruturadas de textos de processos judiciais. ' +
      'Retorne APENAS JSON válido, sem texto adicional.',
      `Extraia as informações do processo judicial abaixo.\n\nTEXTO:\n${input.textoOuNomeArquivo}\n\n` +
      'Retorne JSON com exatamente estes campos:\n' +
      '{"numeroProcesso":"número CNJ ou null","autor":"nome do autor ou null",' +
      '"reu":"nome do réu ou null","vara":"nome da vara ou null",' +
      '"tribunal":"sigla do tribunal ou null","assunto":"assunto ou null",' +
      '"quesitos":["quesitos ao perito"],"endereco":"endereço da vistoria ou null",' +
      '"tipoPericia":"tipo de perícia ou null"}',
      fallback,
    )
  },

  // ── generateProcessSummary ────────────────────────────────────────────────

  async generateProcessSummary(input: GenerateProcessSummaryInput): Promise<GenerateProcessSummaryOutput> {
    const d = input.dadosExtraidos
    const fallback: GenerateProcessSummaryOutput = {
      resumoCurto: '', objetoDaPericia: '', pontosRelevantes: [], necessidadesDeCampo: [],
    }
    return jsonCompletion<GenerateProcessSummaryOutput>(
      'Você é um assistente jurídico especializado em perícias judiciais brasileiras. ' +
      'Gere resumos técnicos em português brasileiro para peritos judiciais. ' +
      'Retorne APENAS JSON válido.',
      `Gere um resumo técnico do processo para o perito.\n\n` +
      `Processo: ${d.numeroProcesso ?? '—'} | ${d.tribunal ?? '—'} | ${d.vara ?? '—'}\n` +
      `Partes: ${d.autor ?? '—'} × ${d.reu ?? '—'}\n` +
      `Tipo: ${d.tipoPericia ?? '—'} | Local: ${d.endereco ?? '—'}\n` +
      `Quesitos: ${d.quesitos.join(' | ') || '—'}\n\n` +
      'Retorne JSON:\n' +
      '{"resumoCurto":"resumo em 2-3 frases","objetoDaPericia":"1-2 parágrafos",' +
      '"pontosRelevantes":["3-5 pontos"],"necessidadesDeCampo":["3-4 necessidades"]}',
      fallback,
    )
  },

  // ── createPericiaCardFromProcess ──────────────────────────────────────────

  async createPericiaCardFromProcess(input: CreatePericiaCardInput): Promise<CreatePericiaCardOutput> {
    const d = input.dadosExtraidos
    const fallback: CreatePericiaCardOutput = {
      titulo: d.assunto ?? 'Perícia Judicial', tipoPericia: d.tipoPericia ?? 'A classificar',
      prazo: null, endereco: d.endereco, statusInicial: 'planejada',
    }
    return jsonCompletion<CreatePericiaCardOutput>(
      'Você é um assistente jurídico. Retorne APENAS JSON válido.',
      `Crie um card de perícia.\nProcesso: ${d.numeroProcesso ?? '—'} | Assunto: ${d.assunto ?? '—'}\n` +
      `Tipo: ${d.tipoPericia ?? '—'} | Local: ${d.endereco ?? '—'}\n\n` +
      'Retorne JSON:\n' +
      '{"titulo":"título curto (máx 80 chars)","tipoPericia":"tipo específico",' +
      '"prazo":"DD/MM/YYYY (30 dias a partir de hoje) ou null",' +
      '"endereco":"endereço ou null","statusInicial":"planejada"}',
      fallback,
    )
  },

  // ── generateFeeProposalDraft ──────────────────────────────────────────────

  async generateFeeProposalDraft(input: GenerateFeeProposalInput): Promise<GenerateFeeProposalOutput> {
    const d = input.dadosExtraidos
    const valor = input.valorSugerido ?? 4500
    const fallback: GenerateFeeProposalOutput = { introducao: '', escopo: '', honorarios: '', condicoes: '' }
    return jsonCompletion<GenerateFeeProposalOutput>(
      'Você é um assistente jurídico especializado em perícias judiciais brasileiras. ' +
      'Redija propostas de honorários em linguagem técnica e formal. Retorne APENAS JSON válido.',
      `Redija proposta de honorários periciais.\n` +
      `Perito: ${input.peritoNome} | Processo: ${d.numeroProcesso ?? '—'}\n` +
      `Tipo: ${d.tipoPericia ?? '—'} | Valor: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
      'Retorne JSON:\n' +
      '{"introducao":"parágrafo de apresentação","escopo":"serviços periciais",' +
      '"honorarios":"valor e condições de pagamento","condicoes":"prazo e condições gerais"}',
      fallback,
    )
  },

  // ── generateReportDraft ───────────────────────────────────────────────────

  async generateReportDraft(input: GenerateReportDraftInput): Promise<GenerateReportDraftOutput> {
    const d = input.dadosExtraidos
    const r = input.resumo
    const fallback: GenerateReportDraftOutput = {
      identificacao: '', objeto: '', metodologia: '', analise: '', conclusao: '',
    }
    return jsonCompletion<GenerateReportDraftOutput>(
      'Você é um perito judicial sênior. Redija laudos periciais seguindo CPC/2015 e NBR aplicáveis. ' +
      'Retorne APENAS JSON válido.',
      `Gere rascunho de laudo pericial.\n` +
      `Processo: ${d.numeroProcesso ?? '—'} | ${d.tribunal ?? '—'} | ${d.vara ?? '—'}\n` +
      `Objeto: ${r.objetoDaPericia}\n` +
      `Quesitos: ${d.quesitos.map((q, i) => `${i + 1}. ${q}`).join(' | ')}\n\n` +
      'Retorne JSON:\n' +
      '{"identificacao":"cabeçalho com dados do processo","objeto":"objeto da perícia",' +
      '"metodologia":"metodologia técnica adotada","analise":"análise com placeholders para dados de campo",' +
      '"conclusao":"conclusão com respostas em branco"}',
      fallback,
    )
  },
}

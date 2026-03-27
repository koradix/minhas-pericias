// ─── OpenAI Provider ──────────────────────────────────────────────────────────
// Implements AIProvider using the official OpenAI SDK.
// Activated by setting AI_PROVIDER=openai in .env.local
// Requires OPENAI_API_KEY in environment — never hardcoded.

import OpenAI from 'openai'
import type { AIProvider } from '../provider'
import type {
  ExtractProcessDataInput,   ExtractProcessDataOutput,
  GenerateProcessSummaryInput, GenerateProcessSummaryOutput,
  CreatePericiaCardInput,    CreatePericiaCardOutput,
  GenerateFeeProposalInput,  GenerateFeeProposalOutput,
  GenerateReportDraftInput,  GenerateReportDraftOutput,
} from '../types'

// ─── Client singleton ─────────────────────────────────────────────────────────

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('[AI/OpenAI] OPENAI_API_KEY não configurada')
  return new OpenAI({ apiKey: key })
}

async function jsonCompletion<T>(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  fallback: T,
  model = 'gpt-4o-mini',
): Promise<T> {
  const client = getClient()
  try {
    const res = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages,
      temperature: 0.2,
    })
    const raw = res.choices[0]?.message?.content ?? '{}'
    return JSON.parse(raw) as T
  } catch (err) {
    console.error('[AI/OpenAI] Erro na chamada:', err instanceof Error ? err.message : err)
    return fallback
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const openaiProvider: AIProvider = {
  name: 'openai',

  // ── extractProcessData ────────────────────────────────────────────────────

  async extractProcessData(input: ExtractProcessDataInput): Promise<ExtractProcessDataOutput> {
    const fallback: ExtractProcessDataOutput = {
      numeroProcesso: null, autor: null, reu: null, vara: null,
      tribunal: null, assunto: null, quesitos: [], endereco: null, tipoPericia: null,
    }

    return jsonCompletion<ExtractProcessDataOutput>(
      [
        {
          role: 'system',
          content:
            'Você é um assistente jurídico especializado em perícias judiciais brasileiras. ' +
            'Extraia informações estruturadas de textos de processos judiciais. ' +
            'Retorne APENAS JSON válido, sem texto adicional.',
        },
        {
          role: 'user',
          content:
            `Extraia as informações do texto/documento do processo judicial abaixo.\n\n` +
            `TEXTO:\n${input.textoOuNomeArquivo}\n\n` +
            `Retorne JSON com exatamente estes campos:\n` +
            `{\n` +
            `  "numeroProcesso": "número CNJ (NNNNNNN-DD.AAAA.J.TT.OOOO) ou null",\n` +
            `  "autor": "nome do autor/requerente ou null",\n` +
            `  "reu": "nome do réu/requerido ou null",\n` +
            `  "vara": "nome da vara ou órgão julgador ou null",\n` +
            `  "tribunal": "sigla do tribunal (ex: TJRJ, TJSP, TRT-2) ou null",\n` +
            `  "assunto": "assunto principal do processo ou null",\n` +
            `  "quesitos": ["cada quesito formulado ao perito — lista de strings"],\n` +
            `  "endereco": "endereço físico do local da vistoria/perícia ou null",\n` +
            `  "tipoPericia": "tipo de perícia (ex: Engenharia Civil, Trabalhista, Contábil) ou null"\n` +
            `}`,
        },
      ],
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
      [
        {
          role: 'system',
          content:
            'Você é um assistente jurídico especializado em perícias judiciais brasileiras. ' +
            'Gere resumos técnicos objetivos em português brasileiro para peritos judiciais.',
        },
        {
          role: 'user',
          content:
            `Gere um resumo técnico do processo abaixo para o perito judicial.\n\n` +
            `DADOS DO PROCESSO:\n` +
            `- Número: ${d.numeroProcesso ?? '—'}\n` +
            `- Autor: ${d.autor ?? '—'} | Réu: ${d.reu ?? '—'}\n` +
            `- Tribunal: ${d.tribunal ?? '—'} | Vara: ${d.vara ?? '—'}\n` +
            `- Assunto: ${d.assunto ?? '—'}\n` +
            `- Tipo de perícia: ${d.tipoPericia ?? '—'}\n` +
            `- Local da vistoria: ${d.endereco ?? '—'}\n` +
            `- Quesitos (${d.quesitos.length}): ${d.quesitos.join(' | ') || '—'}\n\n` +
            `Retorne JSON com exatamente estes campos:\n` +
            `{\n` +
            `  "resumoCurto": "resumo em 2-3 frases do processo e da perícia",\n` +
            `  "objetoDaPericia": "descrição do objeto da perícia em 1-2 parágrafos",\n` +
            `  "pontosRelevantes": ["3 a 5 pontos relevantes para o perito"],\n` +
            `  "necessidadesDeCampo": ["3 a 4 necessidades para a vistoria de campo"]\n` +
            `}`,
        },
      ],
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
      [
        {
          role: 'system',
          content: 'Você é um assistente jurídico. Gere dados para criação de card de perícia. Retorne APENAS JSON válido.',
        },
        {
          role: 'user',
          content:
            `Crie um card de perícia com base nos dados abaixo.\n\n` +
            `Processo: ${d.numeroProcesso ?? '—'} | Assunto: ${d.assunto ?? '—'} | Tipo: ${d.tipoPericia ?? '—'}\n` +
            `Local: ${d.endereco ?? '—'} | Quesitos: ${d.quesitos.length}\n\n` +
            `Retorne JSON:\n` +
            `{\n` +
            `  "titulo": "título curto da perícia (máx 80 caracteres)",\n` +
            `  "tipoPericia": "tipo de perícia específico",\n` +
            `  "prazo": "data sugerida no formato DD/MM/YYYY (30 dias a partir de hoje) ou null",\n` +
            `  "endereco": "endereço do local ou null",\n` +
            `  "statusInicial": "planejada"\n` +
            `}`,
        },
      ],
      fallback,
    )
  },

  // ── generateFeeProposalDraft ──────────────────────────────────────────────

  async generateFeeProposalDraft(input: GenerateFeeProposalInput): Promise<GenerateFeeProposalOutput> {
    const d = input.dadosExtraidos
    const valor = input.valorSugerido ?? 4500
    const fallback: GenerateFeeProposalOutput = { introducao: '', escopo: '', honorarios: '', condicoes: '' }

    return jsonCompletion<GenerateFeeProposalOutput>(
      [
        {
          role: 'system',
          content:
            'Você é um assistente jurídico especializado em perícias judiciais brasileiras. ' +
            'Redija propostas de honorários periciais em linguagem técnica e formal.',
        },
        {
          role: 'user',
          content:
            `Redija uma proposta de honorários periciais com base nos dados abaixo.\n\n` +
            `Perito: ${input.peritoNome} — ${input.peritoQualificacao ?? 'Perito Judicial'}\n` +
            `Processo: ${d.numeroProcesso ?? '—'} | Tribunal: ${d.tribunal ?? '—'} | Vara: ${d.vara ?? '—'}\n` +
            `Tipo: ${d.tipoPericia ?? '—'} | Quesitos: ${d.quesitos.length} | Local: ${d.endereco ?? '—'}\n` +
            `Valor sugerido: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
            `Retorne JSON com 4 seções em português formal:\n` +
            `{\n` +
            `  "introducao": "parágrafo de apresentação do perito e identificação do processo",\n` +
            `  "escopo": "descrição dos serviços periciais (vistoria, análise, laudo, quesitos)",\n` +
            `  "honorarios": "valor, forma e prazo de pagamento",\n` +
            `  "condicoes": "prazo de entrega e condições gerais"\n` +
            `}`,
        },
      ],
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
      [
        {
          role: 'system',
          content:
            'Você é um perito judicial sênior. Redija estruturas de laudo pericial em português técnico e formal, ' +
            'seguindo as normas do CPC/2015 e NBR aplicáveis.',
        },
        {
          role: 'user',
          content:
            `Gere um rascunho de laudo pericial com base nos dados abaixo.\n\n` +
            `Processo: ${d.numeroProcesso ?? '—'} | ${d.tribunal ?? '—'} | ${d.vara ?? '—'}\n` +
            `Autor: ${d.autor ?? '—'} | Réu: ${d.reu ?? '—'}\n` +
            `Tipo: ${d.tipoPericia ?? '—'} | Local: ${d.endereco ?? '—'}\n` +
            `Objeto: ${r.objetoDaPericia}\n` +
            `Quesitos: ${d.quesitos.map((q, i) => `${i + 1}. ${q}`).join(' | ')}\n` +
            `${input.observacoesPerito ? `\nObservações do perito: ${input.observacoesPerito}` : ''}\n\n` +
            `Retorne JSON:\n` +
            `{\n` +
            `  "identificacao": "cabeçalho com dados do processo e partes",\n` +
            `  "objeto": "objeto da perícia",\n` +
            `  "metodologia": "metodologia técnica adotada",\n` +
            `  "analise": "análise técnica com placeholders para dados de campo",\n` +
            `  "conclusao": "conclusão com resposta aos quesitos (em branco para preenchimento)"\n` +
            `}`,
        },
      ],
      fallback,
    )
  },
}

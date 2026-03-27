// ─── Stub AI Provider ─────────────────────────────────────────────────────────
// Returns deterministic, realistic mock data.
// Preserves the exact response shape a real provider will return.
// Replace this file (or add a new provider) when connecting a live AI API.

import type { AIProvider } from '../provider'
import type {
  ExtractProcessDataInput,   ExtractProcessDataOutput,
  GenerateProcessSummaryInput, GenerateProcessSummaryOutput,
  CreatePericiaCardInput,    CreatePericiaCardOutput,
  GenerateFeeProposalInput,  GenerateFeeProposalOutput,
  GenerateReportDraftInput,  GenerateReportDraftOutput,
} from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Deterministically derive a tipo from filename/text keywords */
function inferTipoPericia(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('imovel') || t.includes('imóvel') || t.includes('apartamento') || t.includes('terreno')) return 'Imobiliária'
  if (t.includes('hidra') || t.includes('vazam') || t.includes('tubulac')) return 'Hidráulica'
  if (t.includes('eletric') || t.includes('elétric') || t.includes('instalac')) return 'Elétrica'
  if (t.includes('trabalh') || t.includes('laboral') || t.includes('trt')) return 'Trabalhista'
  if (t.includes('contab') || t.includes('financ') || t.includes('balanc')) return 'Contábil'
  if (t.includes('medic') || t.includes('médic') || t.includes('saúde')) return 'Médica'
  if (t.includes('psico') || t.includes('dano moral')) return 'Psicológica'
  if (t.includes('grafot') || t.includes('assinatura') || t.includes('document')) return 'Grafotécnica'
  if (t.includes('ambie') || t.includes('ambient')) return 'Ambiental'
  return 'Engenharia Civil'
}

/** Return today + offset days as "DD/MM/YYYY" */
function prazoFrom(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('pt-BR')
}

// ─── Stub implementation ──────────────────────────────────────────────────────

export const stubProvider: AIProvider = {
  name: 'stub',

  // ── extractProcessData ────────────────────────────────────────────────────

  async extractProcessData(
    input: ExtractProcessDataInput,
  ): Promise<ExtractProcessDataOutput> {
    const tipo = inferTipoPericia(input.textoOuNomeArquivo)

    return {
      numeroProcesso:  '0012345-67.2025.8.19.0001',
      autor:           'Maria Oliveira dos Santos',
      reu:             'Construtora Horizonte Ltda',
      vara:            '3ª Vara Cível da Comarca da Capital',
      tribunal:        'TJRJ',
      assunto:         `Perícia ${tipo} — Avaliação Técnica`,
      quesitos: [
        'Qual é o valor de mercado do imóvel na data da avaliação?',
        'Existem vícios construtivos que desvalorizem o bem?',
        'Os danos descritos na inicial são tecnicamente comprovados?',
      ],
      endereco:        'Rua das Laranjeiras, 234, Rio de Janeiro, RJ',
      tipoPericia:     tipo,
    }
  },

  // ── generateProcessSummary ────────────────────────────────────────────────

  async generateProcessSummary(
    input: GenerateProcessSummaryInput,
  ): Promise<GenerateProcessSummaryOutput> {
    const d = input.dadosExtraidos
    const tipo = d.tipoPericia ?? 'Técnica'
    const assunto = d.assunto ?? `Perícia ${tipo}`

    return {
      resumoCurto: `${assunto} envolvendo ${d.autor ?? 'Autor'} e ${d.reu ?? 'Réu'} perante a ${d.vara ?? 'vara competente'} do ${d.tribunal ?? 'tribunal'}.`,

      objetoDaPericia:
        `Avaliar e emitir parecer técnico sobre ${assunto.toLowerCase()}, ` +
        `respondendo aos quesitos formulados pelas partes e pelo juízo, ` +
        `com base em vistorias in loco, análise documental e normas técnicas vigentes (ABNT/NBR).`,

      pontosRelevantes: [
        `Processo nº ${d.numeroProcesso ?? '—'} em tramitação no ${d.tribunal ?? '—'}`,
        `Local da perícia: ${d.endereco ?? 'a confirmar mediante consulta aos autos'}`,
        `Tipo de perícia: ${tipo}`,
        `${d.quesitos.length} quesito${d.quesitos.length !== 1 ? 's' : ''} a responder`,
      ],

      necessidadesDeCampo: [
        'Vistoria presencial no local indicado nos autos',
        'Coleta de documentação técnica e registros fotográficos',
        'Consulta a normas técnicas aplicáveis ao caso',
        'Entrevista com as partes (se autorizado pelo juízo)',
      ],
    }
  },

  // ── createPericiaCardFromProcess ──────────────────────────────────────────

  async createPericiaCardFromProcess(
    input: CreatePericiaCardInput,
  ): Promise<CreatePericiaCardOutput> {
    const d = input.dadosExtraidos
    const tipo = d.tipoPericia ?? 'Engenharia Civil'

    return {
      titulo:        d.assunto ?? `Perícia ${tipo}`,
      tipoPericia:   tipo,
      prazo:         prazoFrom(30),
      endereco:      d.endereco,
      statusInicial: 'planejada',
    }
  },

  // ── generateFeeProposalDraft ──────────────────────────────────────────────

  async generateFeeProposalDraft(
    input: GenerateFeeProposalInput,
  ): Promise<GenerateFeeProposalOutput> {
    const d = input.dadosExtraidos
    const valor = input.valorSugerido ?? 4500
    const nome = input.peritoNome
    const qualif = input.peritoQualificacao ?? 'Perito Judicial nomeado pelo Juízo'

    return {
      introducao:
        `${nome}, ${qualif}, nomeado(a) perito(a) judicial nos autos do processo ` +
        `nº ${d.numeroProcesso ?? '—'}, em trâmite perante a ${d.vara ?? 'vara competente'} ` +
        `do ${d.tribunal ?? '—'}, vem, respeitosamente, apresentar proposta de honorários ` +
        `periciais para a realização da perícia de ${d.tipoPericia ?? 'natureza técnica'} ` +
        `objeto do presente feito.`,

      escopo:
        `Os serviços periciais compreendem: (i) análise e estudo dos autos; ` +
        `(ii) vistoria técnica no imóvel/local indicado; ` +
        `(iii) coleta de dados e documentação fotográfica; ` +
        `(iv) elaboração do laudo pericial com resposta aos ${d.quesitos.length} quesito${d.quesitos.length !== 1 ? 's' : ''} ` +
        `formulados; e (v) eventuais esclarecimentos em audiência.`,

      honorarios:
        `Pelo conjunto dos trabalhos periciais descritos, os honorários são estimados em ` +
        `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, ` +
        `a serem depositados em conta judicial ou diretamente ao perito, conforme determinação do juízo, ` +
        `no prazo de 15 (quinze) dias após a nomeação definitiva.`,

      condicoes:
        `O prazo para entrega do laudo pericial é de 30 (trinta) dias corridos a contar do depósito ` +
        `dos honorários e do acesso irrestrito ao local e documentação necessária. ` +
        `Honorários adicionais poderão ser solicitados caso sejam necessárias diligências extras ` +
        `não previstas inicialmente, mediante prévia autorização do juízo.`,
    }
  },

  // ── generateReportDraft ───────────────────────────────────────────────────

  async generateReportDraft(
    input: GenerateReportDraftInput,
  ): Promise<GenerateReportDraftOutput> {
    const d = input.dadosExtraidos
    const r = input.resumo

    return {
      identificacao:
        `LAUDO PERICIAL\n\n` +
        `Processo nº: ${d.numeroProcesso ?? '—'}\n` +
        `Tribunal: ${d.tribunal ?? '—'}\n` +
        `Vara: ${d.vara ?? '—'}\n` +
        `Autor: ${d.autor ?? '—'}\n` +
        `Réu: ${d.reu ?? '—'}\n` +
        `Tipo de Perícia: ${d.tipoPericia ?? '—'}\n` +
        `Local: ${d.endereco ?? 'A informar'}`,

      objeto:
        r.objetoDaPericia,

      metodologia:
        `Para a elaboração do presente laudo foram adotados os seguintes procedimentos técnicos: ` +
        `(1) análise dos autos e documentos juntados pelas partes; ` +
        `(2) vistoria in loco no endereço indicado (${d.endereco ?? 'a informar'}); ` +
        `(3) registro fotográfico e coleta de amostras quando aplicável; ` +
        `(4) consulta às normas técnicas ABNT vigentes para o tipo de perícia; ` +
        `(5) análise comparativa e valoração técnica fundamentada.`,

      analise:
        `[Campo a ser preenchido pelo perito após vistoria e análise dos autos]\n\n` +
        `Pontos identificados na análise preliminar:\n` +
        r.pontosRelevantes.map((p, i) => `${i + 1}. ${p}`).join('\n') +
        `\n\nNecessidades de campo identificadas:\n` +
        r.necessidadesDeCampo.map((n, i) => `${i + 1}. ${n}`).join('\n'),

      conclusao:
        `[Campo a ser preenchido pelo perito após análise completa]\n\n` +
        `Diante dos fatos apurados, o perito responderá aos quesitos formulados:\n\n` +
        d.quesitos.map((q, i) => `Quesito ${i + 1}: ${q}\nResposta: [A preencher após vistoria]`).join('\n\n'),
    }
  },
}

// ─── AI Provider — Type Definitions ──────────────────────────────────────────
// All inputs and outputs are defined here.
// A future provider (OpenAI, Anthropic, etc.) must satisfy these exact shapes.

// ─────────────────────────────────────────────────────────────────────────────
// extractProcessData
// ─────────────────────────────────────────────────────────────────────────────

export interface ExtractProcessDataInput {
  /** Raw text extracted from the uploaded document, or the filename as fallback */
  textoOuNomeArquivo: string
  /** Optional: intake ID for logging/tracing */
  intakeId?: string
}

export interface ExtractProcessDataOutput {
  numeroProcesso: string | null
  autor: string | null
  reu: string | null
  vara: string | null
  tribunal: string | null
  assunto: string | null
  /** List of quesitos (questions posed to the expert) */
  quesitos: string[]
  /** Physical address of the expertise site */
  endereco: string | null
  tipoPericia: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// generateProcessSummary
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateProcessSummaryInput {
  dadosExtraidos: ExtractProcessDataOutput
  /** Optional extra context (e.g. perito's area, keywords) */
  contexto?: string
}

export interface GenerateProcessSummaryOutput {
  resumoCurto: string
  objetoDaPericia: string
  pontosRelevantes: string[]
  necessidadesDeCampo: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// createPericiaCardFromProcess
// ─────────────────────────────────────────────────────────────────────────────

export interface CreatePericiaCardInput {
  dadosExtraidos: ExtractProcessDataOutput
  peritoId: string
  intakeId: string
}

export interface CreatePericiaCardOutput {
  titulo: string
  tipoPericia: string
  prazo: string | null   // "DD/MM/YYYY"
  endereco: string | null
  statusInicial: 'planejada' | 'em_andamento'
}

// ─────────────────────────────────────────────────────────────────────────────
// generateFeeProposalDraft
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateFeeProposalInput {
  dadosExtraidos: ExtractProcessDataOutput
  peritoNome: string
  peritoQualificacao?: string
  valorSugerido?: number
}

export interface GenerateFeeProposalOutput {
  introducao: string
  escopo: string
  honorarios: string
  condicoes: string
}

// ─────────────────────────────────────────────────────────────────────────────
// generateReportDraft
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateReportDraftInput {
  dadosExtraidos: ExtractProcessDataOutput
  resumo: GenerateProcessSummaryOutput
  observacoesPerito?: string
}

export interface GenerateReportDraftOutput {
  identificacao: string
  objeto: string
  metodologia: string
  analise: string
  conclusao: string
}

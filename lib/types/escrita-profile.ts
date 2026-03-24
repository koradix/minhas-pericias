// ─── Expert Writing Profile — type system ───────────────────────────────────
// Used to personalize AI-generated documents per perito.

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TomEscrita =
  | 'formal'       // Linguagem formal padrão jurídico-técnico
  | 'tecnico'      // Altamente técnico, terminologia especializada
  | 'objetivo'     // Direto ao ponto, sem rodeios
  | 'detalhado'    // Expansivo, com explicações para leigos
  | 'conciso'      // Mínimo necessário, parágrafos curtos

export const TOM_LABEL: Record<TomEscrita, string> = {
  formal:    'Formal',
  tecnico:   'Técnico',
  objetivo:  'Objetivo',
  detalhado: 'Detalhado',
  conciso:   'Conciso',
}

export const TOM_DESC: Record<TomEscrita, string> = {
  formal:    'Linguagem formal padrão para documentos judiciais',
  tecnico:   'Terminologia especializada, voltado para profissionais',
  objetivo:  'Direto ao ponto, sem explicações supérfluas',
  detalhado: 'Explica cada ponto para facilitar a compreensão do juiz/partes',
  conciso:   'Mínimo necessário, parágrafos curtos e assertivos',
}

// ─── Glossary entry ───────────────────────────────────────────────────────────

export interface Abreviatura {
  sigla: string      // ex: "NBR"
  expansao: string   // ex: "Norma Brasileira ABNT"
}

// ─── Core profile shape ───────────────────────────────────────────────────────

export interface EscritaProfile {
  id: string
  userId: string

  // Style
  tom: TomEscrita

  // Document structure preferences
  estruturaLaudo: string[]      // ordered section titles for laudo
  estruturaProposta: string[]   // ordered section titles for proposta

  // Favourite templates
  templatesFavoritos: string[]  // ModeloBase.id[]

  // Vocabulary
  expressoes: string[]          // recurring phrases/expressions
  palavrasEvitar: string[]      // words/phrases to avoid
  abreviaturas: Abreviatura[]   // personal glossary

  // Closing style
  estiloConc: string            // free text: how the expert concludes documents
  formulaFecho: string          // standard closing sentence

  // AI notes
  notasIA: string               // free-text instructions for the AI
  contextoRegional: string      // e.g. "TJRJ — Rio de Janeiro"

  createdAt: Date
  updatedAt: Date
}

// ─── Default structures ───────────────────────────────────────────────────────

export const DEFAULT_ESTRUTURA_LAUDO: string[] = [
  'I. Objeto da Perícia',
  'II. Metodologia Adotada',
  'III. Análise Técnica',
  'IV. Conclusão',
  'V. Encerramento',
]

export const DEFAULT_ESTRUTURA_PROPOSTA: string[] = [
  '1. Identificação das Partes',
  '2. Objeto dos Serviços',
  '3. Escopo e Metodologia',
  '4. Honorários Periciais',
  '5. Prazo Estimado',
  '6. Observações',
  '7. Assinatura',
]

// ─── Form input (used by server action) ──────────────────────────────────────

export interface SaveEscritaProfileInput {
  tom: TomEscrita
  estruturaLaudo: string[]
  estruturaProposta: string[]
  templatesFavoritos: string[]
  expressoes: string[]
  palavrasEvitar: string[]
  abreviaturas: Abreviatura[]
  estiloConc: string
  formulaFecho: string
  notasIA: string
  contextoRegional: string
}

// ─── AI prompt serialization ──────────────────────────────────────────────────

/**
 * Serializes a writing profile into a plain-text block that can be injected
 * directly into an AI system prompt.
 *
 * Example output:
 *   TOM: formal
 *   ESTRUTURA LAUDO: I. Objeto | II. Metodologia | III. Conclusão
 *   EXPRESSÕES: "Diante do exposto" | "conforme vistoriado"
 *   EVITAR: "obviamente" | "claramente"
 *   FECHO: "Diante do exposto, conclui-se que…"
 *   NOTAS IA: Use numeração romana para seções.
 */
export function serializeProfileForPrompt(profile: EscritaProfile): string {
  const lines: string[] = []

  lines.push(`TOM DE ESCRITA: ${TOM_LABEL[profile.tom]} (${profile.tom})`)

  if (profile.estruturaLaudo.length > 0) {
    lines.push(`ESTRUTURA PREFERIDA DO LAUDO: ${profile.estruturaLaudo.join(' | ')}`)
  }
  if (profile.estruturaProposta.length > 0) {
    lines.push(`ESTRUTURA PREFERIDA DA PROPOSTA: ${profile.estruturaProposta.join(' | ')}`)
  }
  if (profile.expressoes.length > 0) {
    lines.push(`EXPRESSÕES RECORRENTES: "${profile.expressoes.join('" | "')}"`)
  }
  if (profile.palavrasEvitar.length > 0) {
    lines.push(`TERMOS A EVITAR: "${profile.palavrasEvitar.join('" | "')}"`)
  }
  if (profile.abreviaturas.length > 0) {
    const gloss = profile.abreviaturas.map((a) => `${a.sigla}=${a.expansao}`).join('; ')
    lines.push(`GLOSSÁRIO PESSOAL: ${gloss}`)
  }
  if (profile.formulaFecho) {
    lines.push(`FÓRMULA DE ENCERRAMENTO: "${profile.formulaFecho}"`)
  }
  if (profile.estiloConc) {
    lines.push(`ESTILO DE CONCLUSÃO: ${profile.estiloConc}`)
  }
  if (profile.contextoRegional) {
    lines.push(`CONTEXTO REGIONAL: ${profile.contextoRegional}`)
  }
  if (profile.notasIA) {
    lines.push(`INSTRUÇÕES ADICIONAIS PARA IA: ${profile.notasIA}`)
  }

  return lines.join('\n')
}

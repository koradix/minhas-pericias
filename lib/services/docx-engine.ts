/**
 * docx-engine.ts
 *
 * Encapsulates all DOCX template operations:
 *   - detectTags     — dry-run to collect {{placeholders}}
 *   - validateTags   — check required tags are present in template
 *   - fillTemplate   — render template buffer with data map
 *   - buildRenderData — map structured proposal JSON → tag values
 */

import type { GerarPropostaOutput } from '@/app/api/pericias/proposta/gerar/route'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DocxEngineError {
  ok:      false
  code:    'CORRUPT_TEMPLATE' | 'MISSING_TAGS' | 'RENDER_ERROR' | 'NO_TAGS'
  message: string
  details?: unknown
}

export interface DetectResult {
  ok:   true
  tags: string[]          // e.g. ['{{nomePerito}}', '{{numeroProcesso}}']
}

export interface ValidateResult {
  ok:      boolean
  missing: string[]       // required tags absent from template
}

export interface FillResult {
  ok:     true
  buffer: Buffer
}

// ─── Required tags for a valid proposal ────────────────────────────────────

export const REQUIRED_TAGS: ReadonlyArray<string> = [
  '{{numeroProcesso}}',
  '{{tribunal}}',
  '{{vara}}',
  '{{peritoNome}}',
  '{{descricaoServicos}}',
  '{{dataProposta}}',
]

// ─── detectTags ────────────────────────────────────────────────────────────

/**
 * Dry-run the template to collect all {{tag}} placeholders.
 * Returns DocxEngineError if the buffer is not a valid DOCX.
 */
export async function detectTags(
  buffer: Buffer,
): Promise<DetectResult | DocxEngineError> {
  const collected: string[] = []

  try {
    const PizZip        = (await import('pizzip')).default
    const Docxtemplater = (await import('docxtemplater')).default

    let zip: InstanceType<typeof PizZip>
    try {
      zip = new PizZip(buffer)
    } catch {
      return { ok: false, code: 'CORRUPT_TEMPLATE', message: 'Arquivo DOCX corrompido ou inválido.' }
    }

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks:    true,
      delimiters:    { start: '{{', end: '}}' },
      parser: (tag: string) => ({
        get: () => {
          collected.push(`{{${tag}}}`)
          return ''
        },
      }),
    })

    // Trigger parsing; ignore render errors (expected — data is empty)
    try { doc.render({}) } catch { /* intentional */ }

    const unique = [...new Set(collected)]
    return { ok: true, tags: unique }
  } catch (err) {
    return {
      ok:      false,
      code:    'CORRUPT_TEMPLATE',
      message: `Falha ao analisar template: ${err instanceof Error ? err.message : String(err)}`,
      details: err,
    }
  }
}

// ─── validateTags ──────────────────────────────────────────────────────────

/**
 * Check that all required tags are present in the detected set.
 */
export function validateTags(
  detectedTags: string[],
  required: ReadonlyArray<string> = REQUIRED_TAGS,
): ValidateResult {
  const missing = required.filter((r) => !detectedTags.includes(r))
  return { ok: missing.length === 0, missing }
}

// ─── fillTemplate ──────────────────────────────────────────────────────────

/**
 * Render a template buffer with the given data map.
 * Unknown tags resolve to '' (nullGetter) — never throws on missing data.
 */
export async function fillTemplate(
  buffer: Buffer,
  data: Record<string, string>,
): Promise<FillResult | DocxEngineError> {
  try {
    const PizZip        = (await import('pizzip')).default
    const Docxtemplater = (await import('docxtemplater')).default

    let zip: InstanceType<typeof PizZip>
    try {
      zip = new PizZip(buffer)
    } catch {
      return { ok: false, code: 'CORRUPT_TEMPLATE', message: 'Arquivo DOCX corrompido ou inválido.' }
    }

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks:    true,
      delimiters:    { start: '{{', end: '}}' },
      nullGetter:    () => '',   // never crash on missing tag
    })

    try {
      doc.render(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Distinguish template syntax errors from runtime errors
      if (
        msg.includes('tag') ||
        msg.includes('Unclosed') ||
        msg.includes('delimiter') ||
        msg.includes('unmatched')
      ) {
        return {
          ok:      false,
          code:    'CORRUPT_TEMPLATE',
          message: `Erro de sintaxe no template: ${msg}. Verifique se as tags usam {{nomeDaTag}}.`,
          details: err,
        }
      }
      return { ok: false, code: 'RENDER_ERROR', message: `Erro ao preencher template: ${msg}`, details: err }
    }

    const out = doc.getZip().generate({
      type:     'nodebuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }) as Buffer

    return { ok: true, buffer: out }
  } catch (err) {
    return {
      ok:      false,
      code:    'RENDER_ERROR',
      message: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}`,
      details: err,
    }
  }
}

// ─── buildRenderData ───────────────────────────────────────────────────────

interface ProposalInput {
  numeroProcesso:    string
  tribunal:          string
  vara:              string
  autor?:            string | null
  reu?:              string | null
  peritoNome:        string
  peritoQualificacao?: string
  descricaoServicos: string
  resumoTecnico?:    string
  metodologia?:      string
  fasesEstimadas?:   string[]
  horasEstimadas?:   number | null
  despesasPrevistas?: string
  valorHonorarios?:  number | null
  custoDeslocamento?: number | null
  prazoEntrega?:     string
  condicoesPagamento?: string
  observacoes?:      string
  complexidade?:     string
  dataProposta?:     string
}

function brl(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

/**
 * Map structured proposal data to a flat tag→value record
 * ready for docxtemplater render().
 */
export function buildRenderData(
  proposal: ProposalInput,
  iaOutput?: Partial<GerarPropostaOutput>,
): Record<string, string> {
  const honorarios   = proposal.valorHonorarios   ?? 0
  const deslocamento = proposal.custoDeslocamento ?? 0

  return {
    // Process
    numeroProcesso:     proposal.numeroProcesso,
    tribunal:           proposal.tribunal,
    vara:               proposal.vara,
    autor:              proposal.autor              ?? '',
    reu:                proposal.reu                ?? '',
    // Perito
    peritoNome:         proposal.peritoNome,
    peritoQual:         proposal.peritoQualificacao ?? '',
    // Content
    descricaoServicos:  proposal.descricaoServicos,
    resumoTecnico:      proposal.resumoTecnico      ?? '',
    metodologia:        proposal.metodologia        ?? '',
    fases:              (proposal.fasesEstimadas    ?? []).map((f, i) => `${i + 1}. ${f}`).join('\n'),
    horasEstimadas:     proposal.horasEstimadas     != null ? `${proposal.horasEstimadas}h` : '',
    despesasPrevistas:  proposal.despesasPrevistas  ?? '',
    complexidade:       proposal.complexidade       ?? '',
    // Financial
    valorHonorarios:    brl(honorarios),
    custoDeslocamento:  brl(deslocamento),
    totalHonorarios:    brl(honorarios + deslocamento),
    // Conditions
    prazoEntrega:       proposal.prazoEntrega       ?? '',
    condicoesPagamento: proposal.condicoesPagamento ?? '',
    observacoes:        proposal.observacoes        ?? '',
    // Date
    dataProposta:       proposal.dataProposta       ?? new Date().toLocaleDateString('pt-BR'),
    hoje:               new Date().toLocaleDateString('pt-BR'),
    // IA passthrough (if available)
    escopo:             iaOutput?.texto_documento?.escopo       ?? proposal.descricaoServicos,
    abertura:           iaOutput?.texto_documento?.abertura     ?? '',
    fechamento:         iaOutput?.texto_documento?.fechamento   ?? proposal.observacoes ?? '',
    // QA
    camposFaltantes:    (iaOutput?.qa?.campos_faltantes ?? []).join(', '),
    riscos:             (iaOutput?.qa?.riscos           ?? []).join('\n'),
  }
}

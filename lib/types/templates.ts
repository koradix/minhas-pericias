// ─── Template type system for PeriLaB document intelligence ─────────────────
// Additive — does not replace lib/types/documentos.ts

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TipoTemplate =
  | 'LAUDO'
  | 'PROPOSTA_HONORARIOS'
  | 'PARECER_TECNICO'
  | 'RESPOSTA_QUESITOS'

export type MimeTypeTemplate =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/plain'

// ─── Core model (mirrors Prisma ModeloBase with new fields) ───────────────────

export interface TemplateMetadata {
  id: string
  nome: string
  tipo: TipoTemplate
  descricao: string | null
  area: string | null

  // Specialty association
  especialidade: string | null
  subEspecialidade: string | null

  // Authorship
  uploadedById: string | null
  uploadedByNome?: string | null // denormalized for display

  // Versioning
  versao: number
  versaoPaiId: string | null   // null = this is the root

  // Lifecycle
  isActive: boolean
  preferido: boolean
  status: string               // legacy field kept for compat

  // File
  nomeArquivo: string | null
  caminhoArq: string | null
  mimeType: string | null
  tamanhoBytes: number | null

  // AI readiness
  textoExtraido: string | null
  tokenCount: number | null
  processadoEm: Date | null

  // Usage
  totalUsos: number
  createdAt: Date
  updatedAt: Date
}

// ─── Template with version chain ─────────────────────────────────────────────

export interface TemplateComVersoes extends TemplateMetadata {
  versoes: TemplateMetadata[]   // other versions of the same root
}

// ─── Input for creating/updating a template ───────────────────────────────────

export interface CreateTemplateInput {
  nome: string
  tipo: TipoTemplate
  descricao?: string
  area?: string
  especialidade?: string
  subEspecialidade?: string
  versaoPaiId?: string          // set when creating a new version of an existing template
}

export interface UpdateTemplateInput {
  nome?: string
  descricao?: string
  especialidade?: string
  subEspecialidade?: string
  isActive?: boolean
  preferido?: boolean
}

// ─── Query filters ────────────────────────────────────────────────────────────

export interface TemplateFilters {
  tipo?: TipoTemplate
  especialidade?: string
  isActive?: boolean
  uploadedById?: string
}

// ─── Storage layer contract ───────────────────────────────────────────────────

export interface UploadedFile {
  /** Original filename provided by the user */
  originalName: string
  /** Public URL or path to the stored file */
  storagePath: string
  /** MIME type of the uploaded file */
  mimeType: MimeTypeTemplate | string
  /** File size in bytes */
  tamanhoBytes: number
}

// ─── Extraction status (for future job queue) ─────────────────────────────────

export type ExtractionStatus = 'pending' | 'processing' | 'done' | 'failed' | 'not_applicable'

export interface TemplateExtractionResult {
  templateId: string
  status: ExtractionStatus
  textoExtraido: string | null
  tokenCount: number | null
  processadoEm: Date | null
  erro?: string
}

// ─── Labels for UI ────────────────────────────────────────────────────────────

export const TIPO_TEMPLATE_LABEL: Record<TipoTemplate, string> = {
  LAUDO: 'Laudo Pericial',
  PROPOSTA_HONORARIOS: 'Proposta de Honorários',
  PARECER_TECNICO: 'Parecer Técnico',
  RESPOSTA_QUESITOS: 'Resposta a Quesitos',
}

export const TIPO_TEMPLATE_COLOR: Record<TipoTemplate, string> = {
  LAUDO: 'bg-blue-50 text-blue-700 border-blue-100',
  PROPOSTA_HONORARIOS: 'bg-lime-50 text-lime-700 border-lime-200',
  PARECER_TECNICO: 'bg-violet-50 text-violet-700 border-violet-100',
  RESPOSTA_QUESITOS: 'bg-amber-50 text-amber-700 border-amber-100',
}

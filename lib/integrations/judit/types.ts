/**
 * Judit API — Tipos TypeScript
 *
 * Tipos isolados da integracao Judit. Nenhum import do Escavador.
 */

// ─── Request (criar consulta assincrona) ─────────────────────────────────────

export interface JuditCreateRequestBody {
  lawsuit_cnj?: string
  person_cpf?: string
  callback_url?: string
}

export interface JuditCreateRequestResponse {
  request_id: string
  status: JuditRequestStatusValue
  created_at: string
}

// ─── Request Status ──────────────────────────────────────────────────────────

export type JuditRequestStatusValue = 'pending' | 'processing' | 'completed' | 'failed'

export interface JuditRequestStatus {
  request_id: string
  status: JuditRequestStatusValue
  created_at: string
  updated_at: string
  lawsuit_id?: string
  error?: string
  responses_count?: number
}

// ─── Responses (resultado da consulta) ───────────────────────────────────────

export interface JuditResponsesResult {
  request_id: string
  responses: JuditLawsuit[]
}

// ─── Lawsuit (processo completo) ─────────────────────────────────────────────

export interface JuditLawsuit {
  id: string
  cnj: string
  instance?: number | null
  court: string
  court_branch: string
  subject: string
  class_name: string
  distribution_date: string
  last_update: string
  status: string
  judge?: string | null
  parties: JuditParty[]
  movements: JuditMovement[]
  attachments: JuditAttachment[]
}

export interface JuditParty {
  name: string
  role: string
  document?: string | null
  lawyers?: { name: string; oab?: string | null }[]
}

export interface JuditMovement {
  id: string
  date: string
  description: string
  type?: string | null
  content?: string | null
}

export interface JuditAttachment {
  id: string
  name: string
  type: string
  url: string
  mime_type?: string | null
  is_public?: boolean
  download_available?: boolean
  size_bytes?: number | null
  movement_id?: string | null
  created_at: string
}

// ─── Normalized (formato interno PeriLaB) ────────────────────────────────────

export interface NormalizedLawsuit {
  cnj: string
  instance: number | null
  tribunal: string
  vara: string
  assunto: string
  classe: string
  juiz: string | null
  dataDistribuicao: string | null
  dataUltimaAtualizacao: string | null
  status: string
  autor: string | null
  reu: string | null
  perito: string | null
  partes: NormalizedParty[]
  movimentacoes: NormalizedMovement[]
  anexos: NormalizedAttachment[]
  raw: unknown
}

export interface NormalizedParty {
  nome: string
  tipo: string
  documento: string | null
}

export interface NormalizedMovement {
  externalId: string | null
  data: string
  descricao: string
  tipo: string | null
  conteudo: string | null
  source: 'judit'
}

export interface NormalizedAttachment {
  externalId: string
  nome: string
  tipo: string
  url: string | null
  mimeType: string | null
  isPublic: boolean
  downloadAvailable: boolean
  tamanhoBytes: number | null
  data: string | null
  source: 'judit'
}

// ─── CPF Search result ──────────────────────────────────────────────────────

export interface CpfSearchSyncResult {
  ok: boolean
  message: string
  requestId?: string
  cpf: string
  /** Quantos processos vieram da Judit */
  totalProcessos: number
  /** Quantos tinham CNJ confiavel */
  processosComCnj: number
  /** Quantos tinham dados incompletos (sem CNJ) */
  processosSemCnj: number
  /** Pericias efetivamente criadas */
  periciasCriadas: number
  /** Pericias atualizadas (ja existiam) */
  periciasAtualizadas: number
  /** Total de movimentacoes sincronizadas */
  movimentacoesSincronizadas: number
  /** Total de anexos sincronizados (metadata) */
  anexosSincronizados: number
  /** IDs das pericias tocadas */
  periciaIds: string[]
}

// ─── Attachment download result ──────────────────────────────────────────────

export type AttachmentDownloadStatus = 'pending' | 'downloaded' | 'failed' | 'unavailable'

export interface AttachmentDownloadResult {
  ok: boolean
  message: string
  periciaId: string
  totalAnexos: number
  jaExistiam: number
  baixados: number
  falharam: number
  apenasMetadata: number
}

// ─── Tracking (stubs para futuro) ────────────────────────────────────────────

export interface JuditTrackingCreatePayload {
  lawsuit_cnj: string
  webhook_url?: string
}

export interface JuditTrackingCreateResponse {
  tracking_id: string
  lawsuit_cnj: string
  status: 'active' | 'paused' | 'error'
  created_at: string
}

export interface JuditTrackingStatusResponse {
  tracking_id: string
  lawsuit_cnj: string
  status: 'active' | 'paused' | 'error'
  last_check_at?: string | null
  events_count?: number
}

export interface JuditTrackingEvent {
  event_id: string
  tracking_id: string
  event_type: string
  event_date: string
  description: string
  raw?: unknown
}

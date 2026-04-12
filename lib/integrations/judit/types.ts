/**
 * Judit API — Tipos REAIS baseados no payload da API.
 *
 * Endpoints:
 *   POST /requests → { search: { search_type, search_key } }
 *   GET  /requests/:id → { request_id, status }
 *   GET  /responses?request_id=:id&page=1 → { page_data: [{ response_data }] }
 */

// ─── Request ─────────────────────────────────────────────────────────────────

export type JuditSearchType = 'cpf' | 'cnpj' | 'oab' | 'lawsuit_cnj' | 'lawsuit_id'

export interface JuditCreateRequestBody {
  search: {
    search_type: JuditSearchType
    search_key: string
    response_type?: string
    cache_ttl_in_days?: number
  }
}

export interface JuditCreateRequestResponse {
  request_id: string
  status: string
  search: {
    search_type: string
    search_key: string
  }
  created_at: string
  updated_at: string
}

// ─── Request Status ──────────────────────────────────────────────────────────

export interface JuditRequestStatus {
  request_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  error?: string
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface JuditResponsesPage {
  request_status: string
  page: number
  page_count: number
  all_pages_count: number
  all_count: number
  page_data: JuditResponseItem[]
}

export interface JuditResponseItem {
  request_id: string
  response_id: string
  response_type: string
  response_data: JuditLawsuit
}

// ─── Lawsuit (response_data real) ────────────────────────────────────────────

export interface JuditLawsuit {
  code: string           // CNJ
  instance?: number | null
  tribunal_acronym?: string
  tribunal?: string
  justice?: string
  justice_description?: string
  distribution_date?: string | null
  secrecy_level?: number
  judge?: string | null
  county?: string | null
  status?: string | null
  phase?: string | null
  amount?: number | null
  area?: string | null
  city?: string | null
  state?: string | null
  free_justice?: boolean | null
  subjects?: JuditSubject[]
  classifications?: JuditClassification[]
  courts?: JuditCourt[]
  parties?: JuditParty[]
  steps?: JuditStep[]
  attachments?: JuditAttachment[]
  last_step?: JuditStep | null
  related_lawsuits?: unknown[]
  created_at?: string
  updated_at?: string
  tags?: Record<string, unknown>
}

export interface JuditSubject {
  code: string
  name: string
  date?: string
}

export interface JuditClassification {
  code: string
  name: string
  date?: string
}

export interface JuditCourt {
  code?: string
  name: string
  date?: string
}

export interface JuditParty {
  name: string
  main_document?: string | null
  person_type?: string  // AUTOR, RÉU, ADVOGADO, PERITO, etc.
  side?: string         // Active, Passive
  entity_type?: string  // person, company
  documents?: unknown[]
  lawyers?: unknown[]
}

export interface JuditStep {
  step_id: string
  lawsuit_cnj?: string
  lawsuit_instance?: number
  step_date?: string | null
  step_type?: string | null
  content?: string | null
  private?: boolean
}

export interface JuditAttachment {
  attachment_id: string
  attachment_name?: string | null
  attachment_date?: string | null
  extension?: string | null
  status?: string
  private?: boolean
  step_id?: string | null
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
  /** Status no provedor: 'done' = capturado e pronto para download */
  providerStatus: string | null
}

// ─── Result types ────────────────────────────────────────────────────────────

export interface CpfSearchSyncResult {
  ok: boolean
  message: string
  requestId?: string
  cpf: string
  totalProcessos: number
  processosComCnj: number
  processosSemCnj: number
  periciasCriadas: number
  periciasAtualizadas: number
  movimentacoesSincronizadas: number
  anexosSincronizados: number
  periciaIds: string[]
}

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

// ─── Tracking (stubs) ────────────────────────────────────────────────────────

export interface JuditTrackingCreatePayload { lawsuit_cnj: string; webhook_url?: string }
export interface JuditTrackingCreateResponse { tracking_id: string; status: string; created_at: string }
export interface JuditTrackingStatusResponse { tracking_id: string; status: string }
export interface JuditTrackingEvent { event_id: string; tracking_id: string; event_type: string; event_date: string; description: string; raw?: unknown }

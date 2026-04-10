// ─── Re-exports centralizados da integracao Judit ───────────────────────────

export { juditConfig, isJuditReady, juditLog, validateJuditConfig } from './config'
export { JuditService, judit } from './service'
export type { JuditFetchResult } from './service'
export { JuditClient, JuditApiError } from './client'
export { normalizeLawsuit, formatPartesString } from './mappers'
export { JuditTrackingService, juditTracking } from './tracking'
export { JUDIT_SOURCE, JUDIT_POLL_TIMEOUT_MS, JUDIT_POLL_INTERVAL_MS } from './constants'

export type {
  JuditLawsuit,
  JuditParty,
  JuditMovement,
  JuditAttachment,
  JuditCreateRequestBody,
  JuditCreateRequestResponse,
  JuditRequestStatus,
  JuditRequestStatusValue,
  JuditResponsesResult,
  NormalizedLawsuit,
  NormalizedParty,
  NormalizedMovement,
  NormalizedAttachment,
  CpfSearchSyncResult,
  AttachmentDownloadResult,
  AttachmentDownloadStatus,
  JuditTrackingCreatePayload,
  JuditTrackingCreateResponse,
  JuditTrackingStatusResponse,
  JuditTrackingEvent,
} from './types'

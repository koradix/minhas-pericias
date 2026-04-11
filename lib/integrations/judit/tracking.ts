/**
 * Judit — Tracking / Monitoramento (stubs).
 * NADA ligado ao sistema atual. Apenas preparacao estrutural.
 */

import { juditConfig, isJuditReady, juditLog } from './config'
import type {
  JuditTrackingCreateResponse,
  JuditTrackingStatusResponse,
  JuditTrackingEvent,
} from './types'

export class JuditTrackingService {
  async createTrackingForProcess(_cnj: string): Promise<JuditTrackingCreateResponse> {
    if (!isJuditReady()) throw new Error('[Judit] Nao habilitada')
    if (!juditConfig.useTracking) throw new Error('[Judit] Tracking desabilitado')
    throw new Error('[Judit] Tracking nao implementado')
  }

  async getTrackingStatus(_trackingId: string): Promise<JuditTrackingStatusResponse> {
    throw new Error('[Judit] Tracking nao implementado')
  }

  async syncTrackingUpdates(_trackingId: string): Promise<JuditTrackingEvent[]> {
    throw new Error('[Judit] Tracking nao implementado')
  }

  parseTrackingEvent(payload: unknown): JuditTrackingEvent | null {
    if (!payload || typeof payload !== 'object') return null
    const p = payload as Record<string, unknown>
    return {
      event_id: String(p.event_id ?? ''),
      tracking_id: String(p.tracking_id ?? ''),
      event_type: String(p.event_type ?? 'unknown'),
      event_date: String(p.event_date ?? new Date().toISOString()),
      description: String(p.description ?? ''),
      raw: payload,
    }
  }
}

export const juditTracking = new JuditTrackingService()

/**
 * Judit — Tracking / Monitoramento (stubs).
 *
 * Preparacao estrutural para futura implementacao de:
 * - Monitoramento automatico de processos
 * - Webhooks de atualizacao
 * - Sincronizacao de eventos
 *
 * NADA aqui esta ligado ao sistema atual.
 * Os metodos estao preparados mas lançam erro indicando "nao implementado".
 */

import { juditConfig, isJuditReady, juditLog } from './config'
import { JuditClient } from './client'
import type {
  JuditTrackingCreatePayload,
  JuditTrackingCreateResponse,
  JuditTrackingStatusResponse,
  JuditTrackingEvent,
} from './types'

const client = new JuditClient()

export class JuditTrackingService {

  /**
   * Cria monitoramento para um processo.
   * FUTURO: POST /api/tracking com CNJ + webhook URL.
   */
  async createTrackingForProcess(
    cnj: string,
    webhookUrl?: string,
  ): Promise<JuditTrackingCreateResponse> {
    if (!isJuditReady()) throw new Error('[Judit] Integracao nao habilitada')
    if (!juditConfig.useTracking) throw new Error('[Judit] Tracking desabilitado (JUDIT_USE_TRACKING=false)')

    juditLog(`createTrackingForProcess: ${cnj}`)

    // TODO: Implementar quando a API de tracking estiver disponivel
    // return client.post<JuditTrackingCreateResponse>(
    //   juditConfig.baseUrl,
    //   '/api/tracking',
    //   { lawsuit_cnj: cnj, webhook_url: webhookUrl } satisfies JuditTrackingCreatePayload,
    // )

    throw new Error('[Judit] Tracking ainda nao implementado — aguardando API')
  }

  /**
   * Consulta status de um monitoramento existente.
   * FUTURO: GET /api/tracking/:trackingId
   */
  async getTrackingStatus(trackingId: string): Promise<JuditTrackingStatusResponse> {
    if (!isJuditReady()) throw new Error('[Judit] Integracao nao habilitada')

    juditLog(`getTrackingStatus: ${trackingId}`)

    // TODO: Implementar
    // return client.get<JuditTrackingStatusResponse>(
    //   juditConfig.baseUrl,
    //   `/api/tracking/${trackingId}`,
    // )

    throw new Error('[Judit] Tracking ainda nao implementado — aguardando API')
  }

  /**
   * Sincroniza eventos de tracking para atualizar movimentacoes.
   * FUTURO: GET /api/tracking/:trackingId/events
   */
  async syncTrackingUpdates(trackingId: string): Promise<JuditTrackingEvent[]> {
    if (!isJuditReady()) throw new Error('[Judit] Integracao nao habilitada')

    juditLog(`syncTrackingUpdates: ${trackingId}`)

    // TODO: Implementar
    // return client.get<{ events: JuditTrackingEvent[] }>(
    //   juditConfig.baseUrl,
    //   `/api/tracking/${trackingId}/events`,
    // ).then(r => r.events)

    throw new Error('[Judit] Tracking ainda nao implementado — aguardando API')
  }

  /**
   * Parseia um evento de tracking/webhook.
   * FUTURO: validar e normalizar payload do webhook.
   */
  parseTrackingEvent(payload: unknown): JuditTrackingEvent | null {
    if (!payload || typeof payload !== 'object') return null

    const p = payload as Record<string, unknown>

    // Estrutura esperada — ajustar quando API estiver disponivel
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

/** Singleton — usar quando tracking estiver habilitado. */
export const juditTracking = new JuditTrackingService()

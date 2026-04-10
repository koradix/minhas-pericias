/**
 * Judit — Service Layer
 *
 * A Judit tem UMA API que faz tudo:
 *   POST /api/requests          → cria request (CNJ ou CPF)
 *   GET  /api/requests/:id      → status da request
 *   GET  /api/requests/:id/responses → dados do processo
 *
 * Totalmente isolado do Escavador.
 */

import { juditConfig, isJuditReady, juditLog } from './config'
import { JuditClient } from './client'
import { normalizeLawsuit, formatPartesString } from './mappers'
import { JUDIT_POLL_TIMEOUT_MS, JUDIT_POLL_INTERVAL_MS } from './constants'
import type {
  JuditCreateRequestResponse,
  JuditRequestStatus,
  JuditResponsesResult,
  JuditLawsuit,
  NormalizedLawsuit,
} from './types'

const client = new JuditClient()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Resultado generico de um fluxo request+poll+responses */
export interface JuditFetchResult {
  requestId: string
  status: string
  responses: JuditLawsuit[]
  normalized: NormalizedLawsuit[]
}

export class JuditService {

  private get base() { return juditConfig.baseUrl }

  // ─── Request lifecycle ───────────────────────────────────────────────────────

  /** Cria request por CNJ. */
  async createLawsuitRequestByCnj(cnj: string): Promise<JuditCreateRequestResponse> {
    this.assertReady()
    return client.post<JuditCreateRequestResponse>(
      this.base, '/api/requests', { lawsuit_cnj: cnj },
    )
  }

  /** Cria request por CPF. */
  async createRequestByCpf(cpf: string): Promise<JuditCreateRequestResponse> {
    this.assertReady()
    const cleanCpf = cpf.replace(/\D/g, '')
    juditLog(`Criando request por CPF: ${cleanCpf}`)
    return client.post<JuditCreateRequestResponse>(
      this.base, '/api/requests', { person_cpf: cleanCpf },
    )
  }

  /** Verifica status de uma request. */
  async getRequestStatus(requestId: string): Promise<JuditRequestStatus> {
    this.assertReady()
    return client.get<JuditRequestStatus>(
      this.base, `/api/requests/${requestId}`,
    )
  }

  /** Busca respostas de uma request completada. */
  async getResponsesByRequestId(requestId: string): Promise<JuditResponsesResult> {
    this.assertReady()
    return client.get<JuditResponsesResult>(
      this.base, `/api/requests/${requestId}/responses`,
    )
  }

  // ─── Polling generico ──────────────────────────────────────────────────────

  private async pollAndFetch(requestId: string, initialStatus: string): Promise<JuditFetchResult> {
    const start = Date.now()
    let lastStatus: JuditRequestStatus = {
      request_id: requestId,
      status: initialStatus as JuditRequestStatus['status'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    while (lastStatus.status !== 'completed' && lastStatus.status !== 'failed') {
      if (Date.now() - start > JUDIT_POLL_TIMEOUT_MS) {
        juditLog(`Timeout no polling (${JUDIT_POLL_TIMEOUT_MS}ms) — request: ${requestId}`)
        return { requestId, status: 'timeout', responses: [], normalized: [] }
      }
      await sleep(JUDIT_POLL_INTERVAL_MS)
      lastStatus = await this.getRequestStatus(requestId)
      juditLog(`Poll ${requestId}: ${lastStatus.status}`)
    }

    if (lastStatus.status === 'failed') {
      juditLog(`Request falhou: ${requestId} — ${lastStatus.error}`)
      return { requestId, status: 'failed', responses: [], normalized: [] }
    }

    const result = await this.getResponsesByRequestId(requestId)
    const lawsuits = result.responses ?? []
    juditLog(`Request ${requestId}: ${lawsuits.length} processos retornados`)

    const normalized = lawsuits.map((l) => normalizeLawsuit(l))
    return { requestId, status: 'completed', responses: lawsuits, normalized }
  }

  // ─── Fluxo completo por CNJ ────────────────────────────────────────────────

  async fetchProcessByCnj(cnj: string): Promise<JuditFetchResult | null> {
    if (!isJuditReady()) return null
    try {
      const req = await this.createLawsuitRequestByCnj(cnj)
      juditLog(`Request CNJ criado: ${req.request_id} (status: ${req.status})`)
      return this.pollAndFetch(req.request_id, req.status)
    } catch (e) {
      juditLog('fetchProcessByCnj error:', e)
      return null
    }
  }

  // ─── Fluxo completo por CPF ────────────────────────────────────────────────

  async fetchProcessesByCpf(cpf: string): Promise<JuditFetchResult | null> {
    if (!isJuditReady()) return null
    try {
      const req = await this.createRequestByCpf(cpf)
      juditLog(`Request CPF criado: ${req.request_id} (status: ${req.status})`)
      return this.pollAndFetch(req.request_id, req.status)
    } catch (e) {
      juditLog('fetchProcessesByCpf error:', e)
      return null
    }
  }

  // ─── Download de anexo ─────────────────────────────────────────────────────

  async downloadAttachment(attachmentUrl: string): Promise<{
    buffer: Buffer
    contentType: string
    fileName: string | null
  } | null> {
    if (!isJuditReady()) return null
    return client.downloadBinary(attachmentUrl)
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  normalize(lawsuit: JuditLawsuit): NormalizedLawsuit {
    return normalizeLawsuit(lawsuit)
  }

  formatPartes(normalized: NormalizedLawsuit): string {
    return formatPartesString(normalized.partes)
  }

  private assertReady() {
    if (!isJuditReady()) {
      throw new Error('[Judit] Integracao nao esta habilitada ou API key ausente')
    }
  }
}

/** Singleton */
export const judit = new JuditService()

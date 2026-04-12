/**
 * Judit — Service Layer (formato REAL da API).
 *
 * Endpoints reais:
 *   POST /requests                          → criar request
 *   GET  /requests/:id                      → poll status
 *   GET  /responses?request_id=:id&page=N   → buscar resultados
 */

import { isJuditReady, juditLog } from './config'
import { JuditClient } from './client'
import { normalizeLawsuit } from './mappers'
import { JUDIT_POLL_TIMEOUT_MS, JUDIT_POLL_INTERVAL_MS, JUDIT_LAWSUITS_BASE_URL } from './constants'
import type {
  JuditCreateRequestResponse,
  JuditRequestStatus,
  JuditResponsesPage,
  JuditLawsuit,
  NormalizedLawsuit,
  JuditSearchType,
} from './types'

const client = new JuditClient()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface JuditFetchResult {
  requestId: string
  status: string
  responses: JuditLawsuit[]
  normalized: NormalizedLawsuit[]
}

export class JuditService {

  // ─── Criar request ─────────────────────────────────────────────────────────

  async createRequest(
    searchType: JuditSearchType,
    searchKey: string,
    options?: { withAttachments?: boolean },
  ): Promise<JuditCreateRequestResponse> {
    this.assertReady()
    return client.post<JuditCreateRequestResponse>('/requests', {
      search: {
        search_type: searchType,
        search_key: searchKey,
      },
      ...(options?.withAttachments ? { with_attachments: true } : {}),
    })
  }

  // ─── Poll status ───────────────────────────────────────────────────────────

  async getRequestStatus(requestId: string): Promise<JuditRequestStatus> {
    this.assertReady()
    return client.get<JuditRequestStatus>(`/requests/${requestId}`)
  }

  // ─── Buscar responses (paginado) ───────────────────────────────────────────

  async getResponses(requestId: string, page = 1): Promise<JuditResponsesPage> {
    this.assertReady()
    return client.get<JuditResponsesPage>(
      `/responses?request_id=${requestId}&page=${page}`,
    )
  }

  // ─── Polling generico ──────────────────────────────────────────────────────

  private async pollAndFetch(requestId: string, initialStatus: string): Promise<JuditFetchResult> {
    const start = Date.now()
    let status = initialStatus

    while (status !== 'completed' && status !== 'failed') {
      if (Date.now() - start > JUDIT_POLL_TIMEOUT_MS) {
        juditLog(`Timeout (${JUDIT_POLL_TIMEOUT_MS}ms) — request: ${requestId}`)
        return { requestId, status: 'timeout', responses: [], normalized: [] }
      }
      await sleep(JUDIT_POLL_INTERVAL_MS)
      const s = await this.getRequestStatus(requestId)
      status = s.status
      juditLog(`Poll ${requestId}: ${status}`)
    }

    if (status === 'failed') {
      juditLog(`Request falhou: ${requestId}`)
      return { requestId, status: 'failed', responses: [], normalized: [] }
    }

    // Buscar todas as paginas de responses
    const allLawsuits: JuditLawsuit[] = []
    let page = 1
    let totalPages = 1

    do {
      const resp = await this.getResponses(requestId, page)
      totalPages = resp.all_pages_count ?? 1
      for (const item of resp.page_data ?? []) {
        if (item.response_data) {
          allLawsuits.push(item.response_data)
        }
      }
      page++
    } while (page <= totalPages)

    juditLog(`Request ${requestId}: ${allLawsuits.length} processos retornados`)

    const normalized = allLawsuits.map((l) => normalizeLawsuit(l))
    return { requestId, status: 'completed', responses: allLawsuits, normalized }
  }

  // ─── Fluxo completo por CNJ ────────────────────────────────────────────────

  async fetchProcessByCnj(cnj: string, options?: { withAttachments?: boolean }): Promise<JuditFetchResult | null> {
    if (!isJuditReady()) return null
    try {
      const req = await this.createRequest('lawsuit_cnj', cnj, {
        withAttachments: options?.withAttachments ?? false,
      })
      juditLog(`Request CNJ criado: ${req.request_id} (with_attachments: ${options?.withAttachments ?? false})`)
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
      const cleanCpf = cpf.replace(/\D/g, '')
      const req = await this.createRequest('cpf', cleanCpf)
      juditLog(`Request CPF criado: ${req.request_id}`)
      return this.pollAndFetch(req.request_id, req.status)
    } catch (e) {
      juditLog('fetchProcessesByCpf error:', e)
      return null
    }
  }

  // ─── Download de anexo ─────────────────────────────────────────────────────

  /**
   * Constroi a URL de download de um anexo no endpoint de lawsuits.
   * Endpoint: GET /lawsuits/{cnj}/{instance}/attachments/{attachmentId}
   */
  buildAttachmentUrl(cnj: string, instance: number, attachmentId: string): string {
    const cleanCnj = cnj.trim()
    return `${JUDIT_LAWSUITS_BASE_URL}/lawsuits/${cleanCnj}/${instance}/attachments/${attachmentId}`
  }

  async downloadAttachment(attachmentUrl: string): Promise<{
    buffer: Buffer
    contentType: string
    fileName: string | null
  } | null> {
    if (!isJuditReady()) return null
    return client.downloadBinary(attachmentUrl)
  }

  /**
   * Download de anexo usando cnj + instance + attachmentId.
   * Constroi a URL e delega para downloadAttachment.
   */
  async downloadAttachmentByParts(cnj: string, instance: number, attachmentId: string): Promise<{
    buffer: Buffer
    contentType: string
    fileName: string | null
  } | null> {
    const url = this.buildAttachmentUrl(cnj, instance, attachmentId)
    juditLog(`Download attachment: ${url}`)
    return this.downloadAttachment(url)
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  normalize(lawsuit: JuditLawsuit): NormalizedLawsuit {
    return normalizeLawsuit(lawsuit)
  }

  private assertReady() {
    if (!isJuditReady()) {
      throw new Error('[Judit] Integracao nao habilitada ou API key ausente')
    }
  }
}

export const judit = new JuditService()

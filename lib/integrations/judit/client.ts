/**
 * Judit — HTTP Client centralizado.
 *
 * Auth: header "api-key" (NAO Bearer).
 * Base URL: https://requests.prod.judit.io
 */

import { juditConfig, juditLog } from './config'

export class JuditClient {
  private headers(): Record<string, string> {
    return {
      'api-key': juditConfig.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  async get<T>(path: string): Promise<T> {
    const url = `${juditConfig.baseUrl}${path}`
    juditLog(`GET ${url}`)
    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
      cache: 'no-store',
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new JuditApiError(res.status, `GET ${path}`, txt.slice(0, 300))
    }
    return res.json() as Promise<T>
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${juditConfig.baseUrl}${path}`
    juditLog(`POST ${url}`, body)
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new JuditApiError(res.status, `POST ${path}`, txt.slice(0, 300))
    }
    return res.json() as Promise<T>
  }

  /** Download binario (para anexos futuros). */
  async downloadBinary(url: string): Promise<{
    buffer: Buffer
    contentType: string
    fileName: string | null
  } | null> {
    juditLog(`DOWNLOAD ${url}`)
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'api-key': juditConfig.apiKey },
        redirect: 'follow',
      })
      if (!res.ok) return null
      const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
      const disposition = res.headers.get('content-disposition')
      let fileName: string | null = null
      if (disposition) {
        const match = disposition.match(/filename[*]?=(?:UTF-8''|"?)([^";]+)/i)
        if (match) fileName = decodeURIComponent(match[1].trim())
      }
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      if (buffer.length === 0) return null
      return { buffer, contentType, fileName }
    } catch (e) {
      juditLog(`Download error: ${e instanceof Error ? e.message : String(e)}`)
      return null
    }
  }
}

export class JuditApiError extends Error {
  constructor(
    public statusCode: number,
    public endpoint: string,
    public body: string,
  ) {
    super(`[Judit] ${endpoint} → ${statusCode}: ${body}`)
    this.name = 'JuditApiError'
  }
}

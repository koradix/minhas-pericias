/**
 * Judit — HTTP Client centralizado.
 *
 * Toda chamada HTTP a Judit passa por aqui.
 * Autenticacao e headers centralizados — nenhum fetch solto no projeto.
 */

import { juditConfig, juditLog } from './config'

export class JuditClient {
  private jsonHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${juditConfig.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  private authHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${juditConfig.apiKey}`,
    }
  }

  async get<T>(baseUrl: string, path: string): Promise<T> {
    const url = `${baseUrl}${path}`
    juditLog(`GET ${url}`)
    const res = await fetch(url, {
      method: 'GET',
      headers: this.jsonHeaders(),
      cache: 'no-store',
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new JuditApiError(res.status, `GET ${path}`, txt.slice(0, 300))
    }
    return res.json() as Promise<T>
  }

  async post<T>(baseUrl: string, path: string, body: unknown): Promise<T> {
    const url = `${baseUrl}${path}`
    juditLog(`POST ${url}`)
    const res = await fetch(url, {
      method: 'POST',
      headers: this.jsonHeaders(),
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new JuditApiError(res.status, `POST ${path}`, txt.slice(0, 300))
    }
    return res.json() as Promise<T>
  }

  /**
   * Download binario de um arquivo.
   * Trata redirect, signed URL, e respostas de blob/stream.
   * Retorna { buffer, contentType, fileName } ou null se indisponivel.
   */
  async downloadBinary(url: string): Promise<{
    buffer: Buffer
    contentType: string
    fileName: string | null
  } | null> {
    juditLog(`DOWNLOAD ${url}`)
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.authHeaders(),
        redirect: 'follow',
      })

      if (!res.ok) {
        juditLog(`Download falhou: ${res.status} para ${url}`)
        return null
      }

      const contentType = res.headers.get('content-type') ?? 'application/octet-stream'

      // Extrair filename do Content-Disposition se presente
      const disposition = res.headers.get('content-disposition')
      let fileName: string | null = null
      if (disposition) {
        const match = disposition.match(/filename[*]?=(?:UTF-8''|"?)([^";]+)/i)
        if (match) fileName = decodeURIComponent(match[1].trim())
      }

      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      if (buffer.length === 0) {
        juditLog(`Download vazio para ${url}`)
        return null
      }

      juditLog(`Download ok: ${buffer.length} bytes, type=${contentType}`)
      return { buffer, contentType, fileName }
    } catch (e) {
      juditLog(`Download error: ${e instanceof Error ? e.message : String(e)}`)
      return null
    }
  }
}

/** Erro tipado da API Judit — facilita debug sem poluir logs. */
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

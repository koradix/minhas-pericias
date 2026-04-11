/**
 * Judit — Configuracao central e feature flags.
 *
 * API real da Judit:
 *   Base URL: https://requests.prod.judit.io
 *   Auth header: api-key: $JUDIT_API_KEY
 *   Endpoints:
 *     POST /requests          — criar request (CPF, CNJ, nome, CNPJ, OAB)
 *     GET  /requests/:id      — poll status
 *     GET  /responses?request_id=:id&page=1 — buscar resultados
 */

function envBool(key: string, fallback = false): boolean {
  const v = process.env[key]
  if (!v) return fallback
  return v.trim() === 'true' || v.trim() === '1'
}

export const juditConfig = {
  get enabled()        { return envBool('JUDIT_ENABLED', false) },
  get apiKey()         { return (process.env.JUDIT_API_KEY ?? '').trim() },
  get useAttachments() { return envBool('JUDIT_USE_ATTACHMENTS', true) },
  get useTracking()    { return envBool('JUDIT_USE_TRACKING', false) },

  /** Base URL unica da API Judit. */
  get baseUrl() {
    return (
      process.env.JUDIT_BASE_URL
      ?? process.env.JUDIT_REQUESTS_BASE_URL
      ?? 'https://requests.prod.judit.io'
    ).trim()
  },
}

export function isJuditReady(): boolean {
  return juditConfig.enabled && juditConfig.apiKey.length > 0
}

export function juditLog(msg: string, data?: unknown) {
  const prefix = juditConfig.enabled ? '[Judit]' : '[Judit:OFF]'
  if (data !== undefined) {
    console.log(prefix, msg, data)
  } else {
    console.log(prefix, msg)
  }
}

export function validateJuditConfig(): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  if (!juditConfig.enabled) {
    issues.push('JUDIT_ENABLED is false')
    return { valid: false, issues }
  }
  if (!juditConfig.apiKey) issues.push('JUDIT_API_KEY is not set')
  return { valid: issues.length === 0, issues }
}

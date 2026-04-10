/**
 * Judit — Configuracao central e feature flags.
 *
 * A Judit tem UMA API que faz tudo (requests → poll → responses).
 *
 * Variaveis de ambiente:
 *   JUDIT_ENABLED           — true|false (master switch)
 *   JUDIT_API_KEY           — API key da Judit
 *   JUDIT_BASE_URL          — base URL da API (default: https://requests.api.judit.io)
 *   JUDIT_USE_ATTACHMENTS   — true|false (baixar anexos reais)
 *   JUDIT_USE_TRACKING      — true|false (futuro)
 *   JUDIT_USE_WEBHOOK       — true|false (futuro)
 *
 * Se JUDIT_ENABLED=false, nenhuma chamada a Judit e feita.
 */

function envBool(key: string, fallback = false): boolean {
  const v = process.env[key]
  if (!v) return fallback
  return v === 'true' || v === '1'
}

export const juditConfig = {
  /** Master switch — se false, toda a integracao e no-op. */
  get enabled()        { return envBool('JUDIT_ENABLED', false) },
  get apiKey()         { return process.env.JUDIT_API_KEY ?? '' },
  get useAttachments() { return envBool('JUDIT_USE_ATTACHMENTS', true) },
  get useTracking()    { return envBool('JUDIT_USE_TRACKING', false) },
  get useWebhook()     { return envBool('JUDIT_USE_WEBHOOK', false) },

  /** Base URL unica da API Judit. */
  get baseUrl() {
    return process.env.JUDIT_BASE_URL
      ?? process.env.JUDIT_REQUESTS_BASE_URL
      ?? 'https://requests.api.judit.io'
  },
}

/** Guard: retorna true se a Judit esta habilitada e configurada. */
export function isJuditReady(): boolean {
  return juditConfig.enabled && juditConfig.apiKey.length > 0
}

/** Log com prefixo [Judit] para facilitar filtragem. */
export function juditLog(msg: string, data?: unknown) {
  const prefix = juditConfig.enabled ? '[Judit]' : '[Judit:OFF]'
  if (data !== undefined) {
    console.log(prefix, msg, data)
  } else {
    console.log(prefix, msg)
  }
}

/** Valida configuracao e loga status. */
export function validateJuditConfig(): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  if (!juditConfig.enabled) {
    issues.push('JUDIT_ENABLED is false — integration is disabled')
    return { valid: false, issues }
  }

  if (!juditConfig.apiKey) {
    issues.push('JUDIT_API_KEY is not set')
  }

  return { valid: issues.length === 0, issues }
}

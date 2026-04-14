/**
 * Judit — Constantes da integracao.
 */

/** Tempo maximo de polling para request assíncrona (ms) — 25s para caber na Vercel */
export const JUDIT_POLL_TIMEOUT_MS = 25_000

/** Intervalo entre polls (ms) */
export const JUDIT_POLL_INTERVAL_MS = 2_000

/** Source tag para registros vindos da Judit */
export const JUDIT_SOURCE = 'judit' as const

/** Status possiveis de uma request Judit */
export const JUDIT_REQUEST_STATUSES = ['pending', 'processing', 'done', 'error'] as const

/** Headers padrao para API Judit */
export const JUDIT_CONTENT_TYPE = 'application/json'

/** Base URL do servico de lawsuits (download de anexos) */
export const JUDIT_LAWSUITS_BASE_URL = 'https://lawsuits.production.judit.io'

/** Versao da integracao (para logs e debug) */
export const JUDIT_INTEGRATION_VERSION = '1.0.0'

// ─── Domain types ─────────────────────────────────────────────────────────────
// Named TribunalRadarInfo to avoid conflict with lib/constants/tribunais.ts TribunalInfo

export interface TribunalRadarInfo {
  sigla: string
  nome: string
  uf: string
  escavadorId?: number  // Escavador diário id — undefined if not found in API
  suportaBusca: boolean // busca_nome === 1 in /tribunal/origens
}

export interface CitacaoResult {
  externalId: string
  diarioSigla: string
  diarioNome: string
  diarioData: string  // ISO date string YYYY-MM-DD
  snippet: string
  numeroProcesso: string | null
  linkCitacao: string
}

export interface SaldoInfo {
  saldo: number
  descricao: string // e.g. "R$ 47,00"
}

// ─── Provider contract ────────────────────────────────────────────────────────

export interface RadarProvider {
  /** Check current credit balance — FREE, always call before paid endpoints */
  verificarSaldo(): Promise<SaldoInfo>

  /**
   * Resolve perito's tribunal siglas to enriched TribunalRadarInfo,
   * including Escavador diário ids and busca_nome capability.
   * Uses FREE endpoints /origens and /tribunal/origens (cached per process).
   */
  resolverTribunais(siglas: string[]): Promise<TribunalRadarInfo[]>

  /**
   * List existing monitoring subscriptions — FREE.
   * Used to recover an existing monitoramento without creating a duplicate.
   */
  listMonitoramentos(): Promise<{ id: number; termo: string; tipo: string }[]>

  /**
   * Create a name-monitoring subscription in Escavador — FREE.
   * Returns the external monitoramento id.
   * Call once on first radar setup; store result in RadarConfig.
   */
  criarMonitoramento(
    nomePeito: string,
    tribunaisIds: number[],
    variacoes: string[],
  ): Promise<string>

  /**
   * Get appearances from an existing monitoring subscription — FREE.
   * Prefer this over buscarPorNome when monitoramentoExtId is available.
   */
  buscarCitacoes(monitoramentoId: string, page?: number): Promise<CitacaoResult[]>

  /**
   * Full-text search in Diários Oficiais — COSTS R$3.00 PER CALL.
   * Only call when perito explicitly requests a search AND saldo > 0.
   * Results filtered to siglasFiltro.
   */
  buscarPorNome(nome: string, siglasFiltro: string[], page?: number): Promise<CitacaoResult[]>
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class EscavadorError extends Error {
  constructor(
    public code: 401 | 402 | 404 | 408 | 500,
    message: string,
  ) {
    super(message)
    this.name = 'EscavadorError'
  }
}

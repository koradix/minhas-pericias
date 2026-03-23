import { TRIBUNAIS_POR_ESTADO } from '@/lib/constants/tribunais'
import {
  EscavadorError,
  type CitacaoResult,
  type RadarProvider,
  type SaldoInfo,
  type TribunalRadarInfo,
} from '@/lib/services/radar-provider'
import { getEnderecoTribunal } from '@/lib/data/varas-enderecos'

// ─── Response shapes ──────────────────────────────────────────────────────────

interface EscavadorSaldoResponse {
  quantidade_creditos: number
  saldo: number
  saldo_descricao: string
}

interface EscavadorDiario {
  id: number
  sigla: string
  nome: string
  estado: string
  categoria: string
}

export interface EscavadorOrigem {
  nome: string
  diarios: EscavadorDiario[]
}

export interface VaraData {
  tribunalSigla: string
  tribunalNome: string
  varaNome: string
  varaId: string
  uf: string | null
}

export interface VaraComEndereco extends VaraData {
  enderecoTexto: string | null
  latitude: number | null
  longitude: number | null
  dadosFicticios: boolean // true = address from static map, not verified
}

interface TribunalCapability {
  sigla: string
  nome: string
  busca_processo: 0 | 1
  busca_nome: 0 | 1
  busca_oab: 0 | 1
  busca_documento: 0 | 1
  disponivel_autos: 0 | 1
  documentos_publicos: 0 | 1
}

interface AparicaoItem {
  id: number
  data_diario_formatada: string // "DD/MM/YYYY"
  conteudo_snippet: string
  numero_processo: string | null
  nome_diario: string
  sigla_diario: string
  movimentacao: { link: string } | null
}

interface EscavadorBuscaItem {
  id: number
  diario_sigla: string
  diario_nome: string
  diario_data: string // "YYYY-MM-DD"
  texto: string
  link: string
  tipo_resultado: string
}

export interface ExistingMonitoramento {
  id: number
  termo: string
  tipo: string
  aparicoes_nao_visualizadas: number
  data_ultima_aparicao: string | null
}

// ─── Module-level lookup maps (built once) ────────────────────────────────────

const siglaToNome = new Map<string, string>()
const siglaToUF = new Map<string, string>()

for (const [uf, tribunais] of Object.entries(TRIBUNAIS_POR_ESTADO)) {
  for (const t of tribunais) {
    siglaToNome.set(t.sigla, t.nome)
    siglaToUF.set(t.sigla, uf)
  }
}

// ─── In-memory caches (per process) ──────────────────────────────────────────

let cachedOrigens: EscavadorOrigem[] | null = null
let cachedTribunalCapabilities: TribunalCapability[] | null = null

// ─── Service ──────────────────────────────────────────────────────────────────

export class EscavadorService implements RadarProvider {
  private readonly baseUrl = 'https://api.escavador.com/api/v1'

  constructor() {
    if (!process.env.ESCAVADOR_API_TOKEN) {
      throw new Error(
        '[EscavadorService] ESCAVADOR_API_TOKEN not found. Add it to .env.local\n' +
          'Get your token at: https://www.escavador.com/sobre/api',
      )
    }
  }

  private get token(): string {
    const t = process.env.ESCAVADOR_API_TOKEN
    if (!t) throw new EscavadorError(401, 'ESCAVADOR_API_TOKEN is not set')
    return t
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    path: string,
    options?: RequestInit,
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...this.headers(), ...(options?.headers ?? {}) },
      cache: 'no-store',
    })

    const creditosUsados = res.headers.get('Creditos-Utilizados')
    if (creditosUsados && process.env.NODE_ENV !== 'production') {
      console.log(
        `[Escavador] Créditos utilizados: ${creditosUsados} | path: ${path}`,
      )
    }

    if (res.status === 401) throw new EscavadorError(401, 'Token inválido ou expirado')
    if (res.status === 402) throw new EscavadorError(402, 'Saldo insuficiente')
    if (res.status === 404) throw new EscavadorError(404, 'Recurso não encontrado')
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new EscavadorError(500, `Erro ${res.status}: ${body}`)
    }

    return res.json() as Promise<T>
  }

  // ── ENDPOINT 1 — Saldo (FREE) ───────────────────────────────────────────────

  async verificarSaldo(): Promise<SaldoInfo> {
    const data = await this.request<EscavadorSaldoResponse>('/quantidade-creditos')
    return { saldo: data.saldo, descricao: data.saldo_descricao }
  }

  // ── ENDPOINT 2 — Origens (FREE, cached) ────────────────────────────────────

  private async getOrigens(): Promise<EscavadorOrigem[]> {
    if (cachedOrigens) return cachedOrigens
    const data = await this.request<EscavadorOrigem[]>('/origens')
    cachedOrigens = data
    return data
  }

  // ── ENDPOINT 3 — Tribunal capabilities (FREE, cached) ──────────────────────

  private async getTribunalCapabilities(): Promise<TribunalCapability[]> {
    if (cachedTribunalCapabilities) return cachedTribunalCapabilities
    const data = await this.request<{ items: TribunalCapability[] }>('/tribunal/origens')
    cachedTribunalCapabilities = data.items
    return data.items
  }

  // ── Public wrappers for FREE endpoints (used by perfil sync) ───────────────

  async getTribunalOrigens(): Promise<EscavadorOrigem[]> {
    return this.getOrigens()
  }

  async getTribunalCapabilitiesPublic(): Promise<TribunalCapability[]> {
    return this.getTribunalCapabilities()
  }

  // ── getVarasByTribunais — FREE cached, filters origens by sigla set ─────────

  async getVarasByTribunais(siglas: string[]): Promise<VaraData[]> {
    const origens = await this.getOrigens()
    const siglaSet = new Set(siglas.map((s) => s.toUpperCase()))
    const varas: VaraData[] = []

    for (const origem of origens) {
      for (const diario of origem.diarios) {
        if (!siglaSet.has(diario.sigla.toUpperCase())) continue
        varas.push({
          tribunalSigla: diario.sigla,
          tribunalNome: origem.nome,
          varaNome: diario.nome,
          varaId: String(diario.id),
          uf: diario.estado ?? null,
        })
      }
    }

    return varas
  }

  // ── getVarasByEstado — FREE cached, enriches with static address lookup ─────

  async getVarasByEstado(uf: string): Promise<VaraComEndereco[]> {
    const origens = await this.getOrigens()
    const ufUpper = uf.toUpperCase()
    const varas: VaraComEndereco[] = []

    for (const origem of origens) {
      for (const diario of origem.diarios) {
        if ((diario.estado ?? '').toUpperCase() !== ufUpper) continue
        const endereco = getEnderecoTribunal(diario.sigla)
        varas.push({
          tribunalSigla: diario.sigla,
          tribunalNome: origem.nome,
          varaNome: diario.nome,
          varaId: String(diario.id),
          uf: diario.estado ?? null,
          enderecoTexto: endereco?.enderecoTexto ?? null,
          latitude: endereco?.latitude ?? null,
          longitude: endereco?.longitude ?? null,
          dadosFicticios: endereco !== null,
        })
      }
    }

    return varas.sort((a, b) => a.tribunalSigla.localeCompare(b.tribunalSigla))
  }

  // ── resolverTribunais ───────────────────────────────────────────────────────

  async resolverTribunais(siglas: string[]): Promise<TribunalRadarInfo[]> {
    const [origens, capabilities] = await Promise.all([
      this.getOrigens(),
      this.getTribunalCapabilities(),
    ])

    // Build lookup maps from Escavador data
    const escavadorIdBySigla = new Map<string, number>()
    for (const origem of origens) {
      for (const diario of origem.diarios) {
        escavadorIdBySigla.set(diario.sigla.toUpperCase(), diario.id)
      }
    }

    const busNomeBySigla = new Map<string, boolean>()
    for (const cap of capabilities) {
      busNomeBySigla.set(cap.sigla.toUpperCase(), cap.busca_nome === 1)
    }

    return siglas.map((sigla) => {
      const upper = sigla.toUpperCase()
      return {
        sigla,
        nome: siglaToNome.get(sigla) ?? sigla,
        uf: siglaToUF.get(sigla) ?? '',
        escavadorId: escavadorIdBySigla.get(upper),
        suportaBusca: busNomeBySigla.get(upper) ?? false,
      }
    })
  }

  // ── ENDPOINT 4a — List monitoramentos (FREE) ────────────────────────────────

  async listMonitoramentos(): Promise<ExistingMonitoramento[]> {
    const res = await fetch(`${this.baseUrl}/monitoramentos?limit=50`, {
      headers: this.headers(),
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()

    // Escavador may wrap the array in different shapes
    const arr: ExistingMonitoramento[] =
      Array.isArray(data)                 ? data :
      Array.isArray(data?.items)          ? data.items :
      Array.isArray(data?.monitoramentos) ? data.monitoramentos :
      Array.isArray(data?.data)           ? data.data :
      []

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Escavador] listMonitoramentos: ${arr.length} monitoramento(s), keys=${Object.keys(data ?? {})}`)
    }
    return arr
  }

  // ── ENDPOINT 4b — Criar monitoramento (FREE, idempotent) ─────────────────────

  async criarMonitoramento(
    nomePeito: string,
    tribunaisIds: number[],
    variacoes: string[],
  ): Promise<string> {
    const termoNorm = nomePeito.toLowerCase().trim()

    // Step 1 — check if already exists in Escavador (FREE, avoids 422)
    const existentes = await this.listMonitoramentos()
    const existente = existentes.find((m) => {
      const t = (m.termo ?? '').toLowerCase().trim()
      return t === termoNorm || t.includes(termoNorm) || termoNorm.includes(t)
    })
    if (existente) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Escavador] Monitoramento já existe: id=${existente.id}, termo="${existente.termo}"`)
      }
      return String(existente.id)
    }

    // Step 2 — create new
    try {
      const data = await this.request<{
        status: string
        monitoramento: { id: number; termo: string; numero_diarios_monitorados: number }
      }>('/monitoramentos', {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'termo',
          termo: nomePeito,
          origens_ids: tribunaisIds,
          variacoes: variacoes.slice(0, 3),
        }),
      })
      return String(data.monitoramento.id)
    } catch (e) {
      // Step 3 — if 422 race condition, fetch again and return found id
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('422') || msg.toLowerCase().includes('já monitora')) {
        const existentes2 = await this.listMonitoramentos()
        const found = existentes2.find((m) => {
          const t = (m.termo ?? '').toLowerCase().trim()
          return t === termoNorm || t.includes(termoNorm) || termoNorm.includes(t)
        })
        if (found) return String(found.id)
      }
      throw e
    }
  }

  // ── ENDPOINT 5 — Aparições do monitoramento (FREE) ─────────────────────────

  async buscarCitacoes(monitoramentoId: string, page = 1): Promise<CitacaoResult[]> {
    const data = await this.request<{
      items: AparicaoItem[]
      paginator: { total: number; total_pages: number }
    }>(`/monitoramentos/${monitoramentoId}/aparicoes?page=${page}`)

    return data.items.map((item) => ({
      externalId: `monitor-${item.id}`,
      diarioSigla: item.sigla_diario,
      diarioNome: item.nome_diario,
      // Convert DD/MM/YYYY → YYYY-MM-DD
      diarioData: item.data_diario_formatada
        ? item.data_diario_formatada.split('/').reverse().join('-')
        : new Date().toISOString().split('T')[0],
      snippet: item.conteudo_snippet,
      numeroProcesso: item.numero_processo,
      linkCitacao: item.movimentacao?.link ?? '',
    }))
  }

  // ── ENDPOINT 6 — Busca por nome (PAGO — R$3.00/chamada) ────────────────────

  async buscarPorNome(nome: string, siglasFiltro: string[], page = 1): Promise<CitacaoResult[]> {
    const q = encodeURIComponent(nome)
    const data = await this.request<{
      paginator: { total: number }
      items: EscavadorBuscaItem[]
    }>(`/busca?q=${q}&qo=d&qs=d&limit=20&page=${page}`)

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[Escavador] buscarPorNome: ${data.paginator.total} resultado(s) encontrado(s) para "${nome}"`,
      )
    }

    const filtroUpper = new Set(siglasFiltro.map((s) => s.toUpperCase()))

    return data.items
      .filter(
        (item) =>
          item.tipo_resultado === 'Diario' &&
          filtroUpper.has(item.diario_sigla.toUpperCase()),
      )
      .map((item) => ({
        externalId: `busca-${item.id}`,
        diarioSigla: item.diario_sigla,
        diarioNome: item.diario_nome,
        diarioData: item.diario_data,
        snippet: item.texto,
        numeroProcesso: null,
        linkCitacao: item.link,
      }))
  }
}

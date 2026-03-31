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

// ─── Processo shapes ──────────────────────────────────────────────────────────

export interface EscavadorParteProcesso {
  nome: string
  tipo_parte: string  // ATIVO | PASSIVO | INTERESSADO | etc.
}

export interface EscavadorProcesso {
  id: number
  numero: string                    // número CNJ
  titulo: string | null             // ex: "Ação de Indenização"
  assunto: string | null
  tribunal: string | null           // sigla ex: "TJRJ"
  orgao_julgador: string | null
  data_distribuicao: string | null  // ISO date
  data_ultima_movimentacao: string | null
  partes: EscavadorParteProcesso[]
}

export interface EscavadorDocumento {
  id: number
  nome: string          // ex: "Despacho — Nomeação de Perito"
  tipo: string | null   // ex: "Despacho", "Decisão"
  data: string | null   // ISO date
  url: string | null    // URL pública para download (quando disponível)
  paginas: number | null
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
    timeoutMs = 15_000,
  ): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: { ...this.headers(), ...(options?.headers ?? {}) },
        cache: 'no-store',
        signal: controller.signal,
      })
    } catch (err) {
      clearTimeout(timer)
      if ((err as Error)?.name === 'AbortError') {
        throw new EscavadorError(408, `Timeout na requisição: ${path}`)
      }
      throw err
    }
    clearTimeout(timer)

    const creditosUsados = res.headers.get('Creditos-Utilizados')
    if (creditosUsados && process.env.NODE_ENV !== 'production') {
      console.log(
        `[Escavador] Créditos utilizados: ${creditosUsados} | path: ${path}`,
      )
    }

    if (res.status === 401) {
      const isMonitoramento = path.startsWith('/monitoramentos')
      throw new EscavadorError(401, isMonitoramento
        ? 'Monitoramento não disponível no plano atual. Use "Buscar nomeações" manualmente.'
        : 'Token inválido ou expirado')
    }
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
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 15_000)
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}/monitoramentos?limit=50`, {
        headers: this.headers(),
        cache: 'no-store',
        signal: controller.signal,
      })
    } catch {
      return []
    }
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

  // ── ENDPOINT 6 — Busca processo por número CNJ (PAGO se busca_processo=1) ───
  //
  // Endpoint: GET /tribunal/processo?numero={numero}&tribunal_sigla={sigla}
  // Custo: varia por tribunal (alguns são FREE, outros cobram crédito)
  //
  // Returns null se tribunal não suportar busca_processo ou processo não encontrado.

  async buscarProcesso(
    numero: string,
    tribunalSigla: string,
  ): Promise<EscavadorProcesso | null> {
    try {
      const q = encodeURIComponent(numero)
      const t = encodeURIComponent(tribunalSigla)
      const data = await this.request<{ processo: EscavadorProcesso } | EscavadorProcesso | null>(
        `/tribunal/processo?numero=${q}&tribunal_sigla=${t}`,
      )
      if (!data) return null
      // API may return { processo: {...} } or the object directly
      const p = (data as { processo?: EscavadorProcesso }).processo ?? (data as EscavadorProcesso)
      if (!p?.id) return null
      return p
    } catch {
      return null
    }
  }

  // ── ENDPOINT 7 — Listar documentos de um processo (depende de disponivel_autos) ─
  //
  // Endpoint: GET /tribunal/processo/{id}/documentos
  // Requer: disponivel_autos=1 ou documentos_publicos=1 no tribunal

  async listarDocumentos(processoEscavadorId: number): Promise<EscavadorDocumento[]> {
    try {
      const data = await this.request<
        EscavadorDocumento[] | { items: EscavadorDocumento[] } | { documentos: EscavadorDocumento[] }
      >(`/tribunal/processo/${processoEscavadorId}/documentos`)

      if (Array.isArray(data)) return data
      if (Array.isArray((data as { items?: EscavadorDocumento[] }).items)) {
        return (data as { items: EscavadorDocumento[] }).items
      }
      if (Array.isArray((data as { documentos?: EscavadorDocumento[] }).documentos)) {
        return (data as { documentos: EscavadorDocumento[] }).documentos
      }
      return []
    } catch {
      return []
    }
  }

  // ── ENDPOINT 8 — Download de documento (retorna Buffer) ─────────────────────
  //
  // Endpoint: GET /tribunal/processo/{id}/documentos/{docId}/download
  // Ou se o documento tiver url pública, faz fetch direto na url

  async downloadDocumento(
    processoEscavadorId: number,
    docId: number,
    docUrl?: string | null,
  ): Promise<Buffer> {
    // Prefer public URL to avoid spending credits
    const targetUrl = docUrl ?? `${this.baseUrl}/tribunal/processo/${processoEscavadorId}/documentos/${docId}/download`

    const res = await fetch(targetUrl, {
      headers: docUrl ? {} : this.headers(), // só manda auth se for endpoint interno
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new EscavadorError(500, `Falha ao baixar documento: HTTP ${res.status}`)
    }

    const ab = await res.arrayBuffer()
    return Buffer.from(ab)
  }

  // ── ENDPOINT 9 — Busca por nome em diários (PAGO) ──────────────────────────
  //
  // Busca o nome exato do perito nos Diários de Justiça Eletrônico (DJE) dos
  // tribunais informados. A query adiciona "perito" para priorizar resultados
  // de nomeações, mas o filtro pós-busca é a fonte definitiva de filtragem.

  async buscarPorNome(nome: string, siglasFiltro: string[], page = 1): Promise<CitacaoResult[]> {
    // Busca COM aspas — exige que o nome completo apareça como frase exata no documento.
    // Isso evita falsos positivos onde partes do nome pertencem a pessoas diferentes
    // (ex: "MARCUS FREDERICO" e "BONASSI SEMMLER" no mesmo despacho mas como advogados distintos).
    // Não adicionamos "perito" porque não é parte do nome cadastrado pelo usuário —
    // a relevância de nomeação é verificada depois em isSnippetNomeacao.
    const queryTermo = `"${nome}"`
    const q = encodeURIComponent(queryTermo)

    // Data mínima: 1 ano atrás — garante histórico sem poluir com resultados antigos demais
    const dataMinima = new Date()
    dataMinima.setFullYear(dataMinima.getFullYear() - 1)
    const dataDe = dataMinima.toISOString().split('T')[0] // YYYY-MM-DD

    let data: { paginator: { total: number }; items: EscavadorBuscaItem[] }
    try {
      data = await this.request<{ paginator: { total: number }; items: EscavadorBuscaItem[] }>(
        `/busca?q=${q}&qo=d&qs=d&limit=50&page=${page}&data_de=${dataDe}`,
      )
    } catch {
      // Fallback: sem filtro de data (caso API não suporte o parâmetro)
      data = await this.request<{ paginator: { total: number }; items: EscavadorBuscaItem[] }>(
        `/busca?q=${q}&qo=d&qs=d&limit=50&page=${page}`,
      )
    }

    console.log(
      `[Escavador] buscarPorNome: query="${queryTermo}" desde=${dataDe} → ${data.paginator.total} total, ${data.items.length} nesta página`,
    )

    // Escavador usa "DJ{UF}" para os diários (ex: DJRJ, DJSP) mas nosso cadastro
    // armazena a sigla do tribunal "TJ{UF}". Expandimos o filtro para aceitar ambos.
    const filtroUpper = new Set<string>()
    for (const s of siglasFiltro) {
      const u = s.toUpperCase()
      filtroUpper.add(u)
      if (u.startsWith('TJ')) filtroUpper.add('DJ' + u.slice(2)) // TJRJ → DJRJ
      if (u.startsWith('DJ')) filtroUpper.add('TJ' + u.slice(2)) // DJRJ → TJRJ
    }
    const semFiltro = filtroUpper.size === 0

    // Debug: log distinct tipos e siglas
    if (data.items.length > 0) {
      const tipos = [...new Set(data.items.map((i) => i.tipo_resultado))].join(', ')
      const siglas = [...new Set(data.items.map((i) => i.diario_sigla).filter(Boolean))].slice(0, 10).join(', ')
      console.log(`[Escavador] buscarPorNome: tipos=${tipos} | siglas=${siglas || '(vazio)'}`)
    }

    // Filtro 1: tribunal
    const porTribunal = data.items.filter(
      (item) => semFiltro || filtroUpper.has(item.diario_sigla.toUpperCase()),
    )

    // Filtro 2: nome completo deve aparecer como frase contínua no snippet
    // Remove acentos e normaliza caixa para comparar sem depender de encoding do DJE.
    const normalize = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
    const nomeNorm = normalize(nome)

    const comNome = porTribunal.filter((item) => normalize(item.texto).includes(nomeNorm))

    console.log(
      `[Escavador] buscarPorNome: ${porTribunal.length} passaram pelo tribunal → ${comNome.length} com nome completo "${nome}"`,
    )

    return comNome.map((item) => ({
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

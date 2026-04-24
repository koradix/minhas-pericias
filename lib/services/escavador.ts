import { TRIBUNAIS_POR_ESTADO } from '@/lib/constants/tribunais'
import {
  EscavadorError,
  type CitacaoResult,
  type RadarProvider,
  type SaldoInfo,
  type TribunalRadarInfo,
} from '@/lib/services/radar-provider'
import { getEnderecoTribunal } from '@/lib/data/varas-enderecos'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrai número CNJ do texto (só formato válido: 0000000-00.0000.0.00.0000) */
function extrairNumeroProcesso(texto: string): string | null {
  const cnj = texto.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)
  return cnj ? cnj[0] : null
}

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

// v2 document from documentos-publicos endpoint (uses string key, not numeric id)
export interface EscavadorDocumentoPublicoV2 {
  key: string           // string identifier used for download
  nome: string
  tipo: string | null
  data: string | null   // ISO date
  url: string | null    // URL pública (when available — use to avoid credit cost)
  paginas: number | null
}

// v2 process cover — returned by GET /api/v2/processos/numero_cnj/{cnj}
export interface EscavadorProcessoV2 {
  numero_cnj: string
  titulo: string | null
  classe: string | null
  assunto: string | null
  tribunal: string | null
  orgao_julgador: string | null
  data_inicio: string | null
  data_ultima_movimentacao: string | null
  envolvidos: Array<{
    nome: string
    tipo: string | null          // "PARTE"
    tipo_normalizado: string | null // "Autor", "Réu", etc.
    polo: string | null          // "ATIVO" | "PASSIVO"
  }>
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

// ─── v2 response shapes ───────────────────────────────────────────────────────

export interface EscavadorEnvolvidoItem {
  id: number
  numero_cnj: string | null
  titulo_polo_ativo: string | null
  titulo_polo_passivo: string | null
  data_inicio: string | null
  data_ultima_movimentacao: string | null
  tribunal: string | null
  orgao_julgador: string | null
  envolvidos: Array<{
    nome: string
    tipo: string | null
    tipo_normalizado: string | null
    polo: string | null
  }>
}

interface EscavadorEnvolvidoResponse {
  resposta: {
    envolvido_encontrado: { nome: string; quantidade_processos: number } | null
    items: EscavadorEnvolvidoItem[]
    paginator: { total: number; current_page: number; total_pages: number }
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class EscavadorService implements RadarProvider {
  private readonly baseUrl   = 'https://api.escavador.com/api/v1'
  private readonly baseUrlV2 = 'https://api.escavador.com/api/v2'

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
      numeroProcesso: item.numero_processo ?? extrairNumeroProcesso(item.conteudo_snippet ?? ''),
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

  // ── ENDPOINT v2 — Busca processo por CNJ (dados completos) ─────────────────
  //
  // GET /api/v2/processos/numero_cnj/{cnj}
  // Retorna: titulo_polo_ativo (autor), titulo_polo_passivo (réu),
  // unidade_origem (vara, endereco, cidade, tribunal_sigla)

  async buscarProcessoPorCnjV2(cnj: string): Promise<{
    autor: string | null
    reu: string | null
    vara: string | null
    endereco: string | null
    cidade: string | null
    tribunal: string | null
  } | null> {
    try {
      const res = await fetch(`${this.baseUrlV2}/processos/numero_cnj/${encodeURIComponent(cnj)}`, {
        headers: this.headers(),
        cache: 'no-store',
      })
      if (!res.ok) return null
      const data = await res.json()
      return {
        autor: data.titulo_polo_ativo ?? null,
        reu: data.titulo_polo_passivo ?? null,
        vara: data.unidade_origem?.nome ?? null,
        endereco: data.unidade_origem?.endereco ?? null,
        cidade: data.unidade_origem?.cidade ?? null,
        tribunal: data.unidade_origem?.tribunal_sigla ?? null,
      }
    } catch {
      return null
    }
  }

  // ── ENDPOINT v2 — Busca processos por envolvido (nome + CPF) ────────────────
  //
  // Escavador v2 /api/v2/envolvido/processos
  // Cobre 440 sistemas de tribunais (não só Diários Oficiais).
  // Quando CPF é fornecido, é usado como identificador único — elimina ambiguidades de homônimos.
  // Retorna processos onde a pessoa é envolvida; filtramos por tipo "PERITO".

  async buscarProcessosEnvolvido(
    nome: string,
    cpf: string | null,
    page = 1,
  ): Promise<{ citacoes: CitacaoResult[]; totalProcessos: number; totalPages: number }> {
    // Monta query string
    // `nome` é SEMPRE obrigatório pela API v2.
    // `cpf` é enviado adicionalmente quando disponível para desambiguar homônimos.
    const params = new URLSearchParams()
    params.set('nome', nome)
    if (cpf) {
      params.set('cpf', cpf.replace(/\D/g, '')) // só dígitos, para desambiguar
    }
    params.set('page', String(page))
    params.set('limit', '50')
    params.set('ordena_por', 'data_ultima_movimentacao')
    params.set('ordem', 'desc')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20_000)

    let res: Response
    try {
      res = await fetch(`${this.baseUrlV2}/envolvido/processos?${params.toString()}`, {
        headers: this.headers(),
        cache: 'no-store',
        signal: controller.signal,
      })
    } catch (err) {
      clearTimeout(timer)
      if ((err as Error)?.name === 'AbortError') throw new EscavadorError(408, 'Timeout v2/envolvido')
      throw err
    }
    clearTimeout(timer)

    if (res.status === 402) throw new EscavadorError(402, 'Saldo insuficiente')
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new EscavadorError(500, `v2/envolvido erro ${res.status}: ${body.slice(0, 200)}`)
    }

    const data = await res.json()
    // v2 retorna { items: [], paginator: {}, envolvido_encontrado: {} }
    const items = data?.items ?? data?.resposta?.items ?? []
    const total = data?.paginator?.total ?? data?.envolvido_encontrado?.quantidade_processos ?? 0
    const totalPages = data?.paginator?.total_pages ?? 1

    console.log(
      `[Escavador v2] envolvido/processos: ${total} total, página ${page}/${totalPages}, ${items.length} itens`,
    )

    // Normaliza nome para comparação
    const norm = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
    const nomeNorm = norm(nome)

    const citacoes: CitacaoResult[] = []

    for (const item of items) {
      if (!item.numero_cnj) continue

      // Verifica o papel da pessoa no processo (se CPF fornecido, confia no match do Escavador;
      // se só nome, confirma que o nome bate). Aceita qualquer tipo de envolvimento —
      // tribunais tagueiam como "PERITO", "AUXILIAR DA JUSTIÇA", "TÉCNICO", "EXPERT", etc.
      // Envolvidos podem estar em item.fontes[0].envolvidos ou item.envolvidos
      const envolvidos: { nome?: string; tipo?: string; tipo_normalizado?: string; polo?: string }[] =
        item.fontes?.[0]?.envolvidos ?? item.envolvidos ?? []

      // Detecta o tipo do perito nos envolvidos
      const peritoEnv = envolvidos.find((e: { nome?: string }) => {
        const n = norm(e.nome ?? '')
        return n.includes(nomeNorm) || nomeNorm.includes(n)
      })
      const tipoEnvolvido = peritoEnv?.tipo_normalizado ?? peritoEnv?.tipo ?? 'Envolvido'

      // Filtrar: só incluir se é PERITO/EXPERT/AUXILIAR (não AUTOR/RÉU/REQUERENTE)
      const tipoUpper = tipoEnvolvido.toUpperCase()
      const ehPerito = ['PERITO', 'PERITA', 'EXPERT', 'AUXILIAR', 'TÉCNICO', 'TECNICO'].some(t => tipoUpper.includes(t))
      const ehParte = ['AUTOR', 'AUTORA', 'RÉU', 'REU', 'REQUERENTE', 'REQUERIDO'].some(t => tipoUpper.includes(t))
      if (ehParte && !ehPerito) continue // pula processos onde é parte, não perito

      const vara = item.unidade_origem?.nome ?? item.orgao_julgador ?? ''
      const cidade = item.unidade_origem?.cidade ?? ''
      const endereco = item.unidade_origem?.endereco ?? ''
      const partes = [item.titulo_polo_ativo, item.titulo_polo_passivo].filter(Boolean).join(' × ')

      // Snippet rico com dados completos
      const snippet = [
        `${tipoEnvolvido} no processo ${item.numero_cnj}`,
        vara ? `| ${vara}` : '',
        partes ? `| ${partes}` : '',
      ].filter(Boolean).join(' ')

      const data_ref = item.data_ultima_movimentacao ?? item.data_inicio ?? new Date().toISOString().split('T')[0]
      const dataFormatada = data_ref.split('T')[0]

      // Usa SEMPRE o CNJ no link — item.id frequentemente não bate com URL pública
      const linkCitacao = `https://www.escavador.com/processos/${item.numero_cnj}`

      citacoes.push({
        externalId: `v2p-${item.numero_cnj}`,
        diarioSigla: item.unidade_origem?.tribunal_sigla ?? item.tribunal ?? 'OUTROS',
        diarioNome: vara || item.tribunal || 'Tribunal',
        diarioData: dataFormatada,
        snippet,
        numeroProcesso: item.numero_cnj,
        linkCitacao,
        fonte: 'v2_tribunal',
      })
    }

    return { citacoes, totalProcessos: total, totalPages }
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

    // Extrai CNJ: primeiro do snippet; se não achar, segue link_api (igual no email)
    const results: CitacaoResult[] = []
    for (const item of comNome) {
      let cnj = extrairNumeroProcesso(item.texto)

      if (!cnj && (item as { link_api?: string }).link_api) {
        const pageText = await this.fetchDiarioPageText((item as { link_api?: string }).link_api!)
        if (pageText) {
          cnj = this.findCnjNearSnippet(pageText, item.texto)
        }
      }

      results.push({
        externalId: `busca-${item.id}`,
        diarioSigla: item.diario_sigla,
        diarioNome: item.diario_nome,
        diarioData: item.diario_data,
        snippet: item.texto,
        numeroProcesso: cnj,
        linkCitacao: item.link,
      })
    }

    console.log(`[Escavador] buscarPorNome: ${results.length} items, ${results.filter(r => r.numeroProcesso).length} com CNJ extraído`)
    return results
  }

  // ── ENDPOINT 10 — Busca por EMAIL em diários (PAGO — R$ 0,03) ──────────────
  //
  // Email é string única — match exato nos DJs. Muitos tribunais publicam
  // a nomeação com email do perito no texto:
  //   "NOMEIO o perito, FULANO (fulano@email.com)..."
  //
  // Se o snippet não tiver o CNJ, segue link_api pra pegar a página completa
  // do diário e extrair o CNJ do cabeçalho.
  async buscarPorEmail(email: string): Promise<CitacaoResult[]> {
    const emailTrim = email.trim().toLowerCase()
    if (!emailTrim || !emailTrim.includes('@')) return []

    const q = encodeURIComponent(`"${emailTrim}"`)

    // Data mínima: 2 anos atrás pra pegar nomeações recentes
    const dataMinima = new Date()
    dataMinima.setFullYear(dataMinima.getFullYear() - 2)
    const dataDe = dataMinima.toISOString().split('T')[0]

    let data: { paginator: { total: number }; items: EscavadorBuscaItem[] }
    try {
      data = await this.request<{ paginator: { total: number }; items: EscavadorBuscaItem[] }>(
        `/busca?q=${q}&qo=d&qs=d&limit=50&page=1&data_de=${dataDe}`,
      )
    } catch {
      data = await this.request<{ paginator: { total: number }; items: EscavadorBuscaItem[] }>(
        `/busca?q=${q}&qo=d&qs=d&limit=50&page=1`,
      )
    }

    console.log(`[Escavador] buscarPorEmail: "${emailTrim}" → ${data.paginator.total} total, ${data.items.length} nesta página`)

    if (data.items.length === 0) return []

    const results: CitacaoResult[] = []

    for (const item of data.items) {
      // 1) Tenta extrair CNJ do snippet
      let cnj = extrairNumeroProcesso(item.texto)

      // 2) Se falhar, segue link_api pra pegar a página completa
      if (!cnj && (item as { link_api?: string }).link_api) {
        const pageText = await this.fetchDiarioPageText((item as { link_api?: string }).link_api!)
        if (pageText) {
          cnj = this.findCnjNearSnippet(pageText, item.texto)
        }
      }

      results.push({
        externalId: `v1email-${item.id}`,
        diarioSigla: item.diario_sigla,
        diarioNome: item.diario_nome,
        diarioData: item.diario_data,
        snippet: item.texto,
        numeroProcesso: cnj,
        linkCitacao: item.link,
        fonte: 'v1_email_dj',
      })
    }

    console.log(`[Escavador] buscarPorEmail: ${results.length} items, ${results.filter(r => r.numeroProcesso).length} com CNJ extraído`)
    return results
  }

  /** Segue link_api do item V1 para pegar o texto completo da página do diário */
  private async fetchDiarioPageText(linkApi: string): Promise<string | null> {
    try {
      const res = await fetch(linkApi, {
        headers: this.headers(),
        cache: 'no-store',
      })
      if (!res.ok) return null
      const data = await res.json() as Record<string, unknown>
      const texto =
        (data.conteudo as string) ??
        (data.texto as string) ??
        ((data.pagina as Record<string, unknown>)?.conteudo as string) ??
        ((data.pagina as Record<string, unknown>)?.texto as string) ??
        JSON.stringify(data)
      return typeof texto === 'string' ? texto : null
    } catch {
      return null
    }
  }

  /** Encontra o CNJ mais próximo do snippet no texto completo da página */
  private findCnjNearSnippet(pageText: string, snippet: string): string | null {
    const cnjRegex = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g
    const cnjs = Array.from(new Set(pageText.match(cnjRegex) ?? []))
    if (cnjs.length === 0) return null
    if (cnjs.length === 1) return cnjs[0]

    const anchor = snippet.substring(0, 80).trim()
    const anchorIdx = pageText.indexOf(anchor)
    if (anchorIdx < 0) return cnjs[0]

    let closestCnj = cnjs[0]
    let closestDist = Infinity
    for (const cnj of cnjs) {
      const cnjIdx = pageText.indexOf(cnj)
      if (cnjIdx < 0) continue
      const dist = Math.abs(cnjIdx - anchorIdx)
      if (dist < closestDist) {
        closestDist = dist
        closestCnj = cnj
      }
    }
    return closestCnj
  }

  // ── V2 ENDPOINT A — Solicitar atualização de processo (aciona robôs) ─────────
  //
  // POST api/v2/processos/numero_cnj/{cnj}/solicitar-atualizacao
  // Body: { documentos_publicos: 1 }  — para documentos públicos
  //       { autos: 1, usuario, senha } — para autos (restritos, fase 2)
  //
  // Assíncrono: robôs processam em background. Chamar documentos-publicos
  // logo depois pode retornar lista vazia — aguardar e repetir se necessário.

  // ── V2 ENDPOINT — Metadados do processo por CNJ ──────────────────────────────
  // GET api/v2/processos/numero_cnj/{cnj}
  // Retorna partes (polo ativo = autor, polo passivo = réu), juiz, classe, etc.
  // Útil para pré-preencher campos antes de fazer upload do PDF.

  async getProcessoV2(cnj: string): Promise<EscavadorProcessoV2 | null> {
    try {
      const cnj2 = encodeURIComponent(cnj)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15_000)
      let res: Response
      try {
        res = await fetch(
          `${this.baseUrlV2}/processos/numero_cnj/${cnj2}`,
          { headers: this.headers(), cache: 'no-store', signal: controller.signal },
        )
      } catch { clearTimeout(timer); return null }
      clearTimeout(timer)
      if (!res.ok) return null
      const data = await res.json() as EscavadorProcessoV2 | { processo?: EscavadorProcessoV2 }
      // Escavador pode envelopar em { processo: {...} }
      return ('processo' in data && data.processo) ? data.processo : data as EscavadorProcessoV2
    } catch { return null }
  }

  // ── V2 ENDPOINT — Autos do processo (público + restrito se autorizado) ────────
  // GET api/v2/processos/numero_cnj/{cnj}/autos
  // Retorna o mesmo shape de documentos-publicos.
  // Para acesso restrito, é necessário solicitar-atualizacao com autos: 1 primeiro.

  async listarAutosV2(cnj: string): Promise<EscavadorDocumentoPublicoV2[]> {
    try {
      const cnj2 = encodeURIComponent(cnj)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20_000)
      let res: Response
      try {
        res = await fetch(
          `${this.baseUrlV2}/processos/numero_cnj/${cnj2}/autos`,
          { headers: this.headers(), cache: 'no-store', signal: controller.signal },
        )
      } catch { clearTimeout(timer); return [] }
      clearTimeout(timer)
      if (!res.ok) return []
      const data = await res.json()
      const items: EscavadorDocumentoPublicoV2[] =
        Array.isArray(data)                                             ? data :
        Array.isArray((data as { items?: unknown[] }).items)            ? (data as { items: EscavadorDocumentoPublicoV2[] }).items :
        Array.isArray((data as { documentos?: unknown[] }).documentos)  ? (data as { documentos: EscavadorDocumentoPublicoV2[] }).documentos :
        Array.isArray((data as { autos?: unknown[] }).autos)            ? (data as { autos: EscavadorDocumentoPublicoV2[] }).autos :
        []
      return items
    } catch { return [] }
  }

  async solicitarAtualizacaoV2(
    cnj: string,
    flags: {
      documentos_publicos?: boolean
      autos?: boolean
      usuario?: string
      senha?: string
      utilizar_certificado?: boolean  // certificado A1 pré-cadastrado no painel Escavador
      documentos_especificos?: string // ex: "INICIAIS"
    } = {},
  ): Promise<{ ok: boolean; message?: string }> {
    try {
      const cnj2 = encodeURIComponent(cnj)
      const body: Record<string, number | string> = {}
      if (flags.documentos_publicos) body.documentos_publicos = 1
      if (flags.autos) body.autos = 1
      if (flags.usuario) body.usuario = flags.usuario
      if (flags.senha) body.senha = flags.senha
      if (flags.utilizar_certificado) body.utilizar_certificado = 1
      if (flags.documentos_especificos) body.documentos_especificos = flags.documentos_especificos

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20_000)
      let res: Response
      try {
        res = await fetch(
          `${this.baseUrlV2}/processos/numero_cnj/${cnj2}/solicitar-atualizacao`,
          {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(body),
            cache: 'no-store',
            signal: controller.signal,
          },
        )
      } catch (err) {
        clearTimeout(timer)
        return { ok: false, message: `Erro de rede: ${(err as Error).message}` }
      }
      clearTimeout(timer)

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        return { ok: false, message: `HTTP ${res.status}: ${txt.slice(0, 200)}` }
      }
      return { ok: true, message: 'Atualização solicitada. Documentos disponíveis em instantes.' }
    } catch (err) {
      return { ok: false, message: (err as Error).message }
    }
  }

  // ── V2 ENDPOINT — Status da atualização solicitada ───────────────────────────
  //
  // GET api/v2/processos/numero_cnj/{cnj}/status-atualizacao
  // Retorna: PENDENTE | SUCESSO | ERRO
  // Usar após solicitarAtualizacaoV2 com autos/certificado para saber quando buscar.

  async getStatusAtualizacaoV2(cnj: string): Promise<'PENDENTE' | 'SUCESSO' | 'ERRO' | null> {
    try {
      const cnj2 = encodeURIComponent(cnj)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10_000)
      let res: Response
      try {
        res = await fetch(
          `${this.baseUrlV2}/processos/numero_cnj/${cnj2}/status-atualizacao`,
          { headers: this.headers(), cache: 'no-store', signal: controller.signal },
        )
      } catch { clearTimeout(timer); return null }
      clearTimeout(timer)
      if (!res.ok) return null
      const data = await res.json() as { status?: string }
      const s = (data?.status ?? '').toUpperCase()
      if (s === 'PENDENTE' || s === 'SUCESSO' || s === 'ERRO') return s
      return null
    } catch { return null }
  }

  // ── V2 ENDPOINTS — Certificados Digitais A1 ──────────────────────────────────
  //
  // POST /api/v2/certificados          — upload .pfx + senha (multipart)
  // GET  /api/v2/certificados          — listar certificados cadastrados
  // DELETE /api/v2/certificados/{id}   — remover certificado

  async uploadCertificado(
    pfxBuffer: Buffer,
    nomeArquivo: string,
    senha: string,
  ): Promise<{ ok: true; id: number; titular: string } | { ok: false; message: string }> {
    try {
      const form = new FormData()
      const ab = pfxBuffer.buffer instanceof ArrayBuffer
        ? pfxBuffer.buffer.slice(pfxBuffer.byteOffset, pfxBuffer.byteOffset + pfxBuffer.byteLength) as ArrayBuffer
        : new Uint8Array(pfxBuffer).buffer as ArrayBuffer
      form.append('certificado', new Blob([ab], { type: 'application/x-pkcs12' }), nomeArquivo)
      form.append('senha', senha)

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30_000)
      let res: Response
      try {
        res = await fetch(`${this.baseUrlV2}/certificados`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'X-Requested-With': 'XMLHttpRequest',
            // NÃO definir Content-Type — o fetch define automaticamente com boundary para multipart
          },
          body: form,
          cache: 'no-store',
          signal: controller.signal,
        })
      } catch (err) { clearTimeout(timer); return { ok: false, message: (err as Error).message } }
      clearTimeout(timer)

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        return { ok: false, message: `HTTP ${res.status}: ${txt.slice(0, 300)}` }
      }
      const data = await res.json() as { id?: number; nome_titular?: string; cpf?: string }
      return { ok: true, id: data.id ?? 0, titular: data.nome_titular ?? data.cpf ?? 'Certificado' }
    } catch (err) {
      return { ok: false, message: (err as Error).message }
    }
  }

  async listarCertificados(): Promise<Array<{ id: number; titular: string; cpf: string; validade: string | null }>> {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10_000)
      let res: Response
      try {
        res = await fetch(`${this.baseUrlV2}/certificados`, {
          headers: this.headers(),
          cache: 'no-store',
          signal: controller.signal,
        })
      } catch { clearTimeout(timer); return [] }
      clearTimeout(timer)
      if (!res.ok) return []
      const data = await res.json() as Array<{ id: number; nome_titular?: string; cpf?: string; data_validade?: string }>
      return (Array.isArray(data) ? data : []).map((c) => ({
        id: c.id,
        titular: c.nome_titular ?? c.cpf ?? `Cert #${c.id}`,
        cpf: c.cpf ?? '',
        validade: c.data_validade ?? null,
      }))
    } catch { return [] }
  }

  async removerCertificado(id: number): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10_000)
      let res: Response
      try {
        res = await fetch(`${this.baseUrlV2}/certificados/${id}`, {
          method: 'DELETE',
          headers: this.headers(),
          cache: 'no-store',
          signal: controller.signal,
        })
      } catch { clearTimeout(timer); return false }
      clearTimeout(timer)
      return res.ok
    } catch { return false }
  }

  // ── V2 ENDPOINT B — Listar documentos públicos por CNJ ───────────────────────
  //
  // GET api/v2/processos/numero_cnj/{cnj}/documentos-publicos
  // Retorna docs já capturados. Chame após solicitar-atualizacao.

  async listarDocumentosPublicosV2(cnj: string): Promise<EscavadorDocumentoPublicoV2[]> {
    try {
      const cnj2 = encodeURIComponent(cnj)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20_000)
      let res: Response
      try {
        res = await fetch(
          `${this.baseUrlV2}/processos/numero_cnj/${cnj2}/documentos-publicos`,
          { headers: this.headers(), cache: 'no-store', signal: controller.signal },
        )
      } catch (err) {
        clearTimeout(timer)
        return []
      }
      clearTimeout(timer)
      if (!res.ok) return []

      const data = await res.json()
      const items: EscavadorDocumentoPublicoV2[] =
        Array.isArray(data)                          ? data :
        Array.isArray((data as { items?: unknown[] }).items)        ? (data as { items: EscavadorDocumentoPublicoV2[] }).items :
        Array.isArray((data as { documentos?: unknown[] }).documentos) ? (data as { documentos: EscavadorDocumentoPublicoV2[] }).documentos :
        []
      return items
    } catch {
      return []
    }
  }

  // ── V2 ENDPOINT C — Download de documento por CNJ + key ─────────────────────
  //
  // GET api/v2/processos/numero_cnj/{cnj}/documentos/{key}
  // Se urlPublica estiver disponível, usa ela diretamente (sem crédito).

  async downloadDocumentoV2(
    cnj: string,
    key: string,
    urlPublica?: string | null,
  ): Promise<Buffer> {
    const targetUrl = urlPublica
      ?? `${this.baseUrlV2}/processos/numero_cnj/${encodeURIComponent(cnj)}/documentos/${encodeURIComponent(key)}`
    const headers = urlPublica ? {} : this.headers()

    const res = await fetch(targetUrl, { headers, cache: 'no-store' })
    if (!res.ok) throw new EscavadorError(500, `Falha ao baixar documento v2: HTTP ${res.status}`)

    const ab = await res.arrayBuffer()
    return Buffer.from(ab)
  }
}

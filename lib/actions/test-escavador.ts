'use server'

/**
 * TEMPORÁRIO — página de teste /testeapi
 * Chama EscavadorService.buscarProcessosEnvolvido e retorna tudo bruto
 * para inspeção. Não persiste nada no banco.
 */

import { auth } from '@/auth'
import { EscavadorService } from '@/lib/services/escavador'
import { EscavadorError } from '@/lib/services/radar-provider'

export interface TestEscavadorResult {
  ok: boolean
  error?: string

  // Saldo antes/depois
  saldoAntes?: number
  saldoDepois?: number

  // Dados brutos da resposta v2
  rawResponse?: unknown

  // Processamento pelo service
  totalProcessos?: number
  totalPages?: number
  citacoesCount?: number
  citacoes?: unknown[]

  // Timing
  durationMs?: number
}

export async function testBuscarProcessosEnvolvido(
  nome: string,
  cpf: string,
): Promise<TestEscavadorResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const nomeTrim = nome.trim()
  if (!nomeTrim) return { ok: false, error: 'Nome é obrigatório' }

  const cpfDigits = cpf.replace(/\D/g, '')
  const cpfParam = cpfDigits.length === 11 ? cpfDigits : null

  const svc = new EscavadorService()
  const t0 = Date.now()

  try {
    // Saldo antes
    const saldoAntes = await svc.verificarSaldo()

    // Chamada v2 via service (passa pela mesma lógica das nomeações)
    const { citacoes, totalProcessos, totalPages } = await svc.buscarProcessosEnvolvido(
      nomeTrim,
      cpfParam,
      1,
    )

    // Também faz chamada crua (axios-like) para ver o JSON bruto da API
    const token = process.env.ESCAVADOR_API_TOKEN
    const params = new URLSearchParams()
    params.set('nome', nomeTrim)
    if (cpfParam) params.set('cpf', cpfParam)
    params.set('limit', '50')

    let rawResponse: unknown = null
    try {
      const res = await fetch(`https://api.escavador.com/api/v2/envolvido/processos?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        cache: 'no-store',
      })
      rawResponse = await res.json()
    } catch (e) {
      rawResponse = { error: e instanceof Error ? e.message : String(e) }
    }

    // Saldo depois
    const saldoDepois = await svc.verificarSaldo()

    return {
      ok: true,
      saldoAntes: saldoAntes.saldo,
      saldoDepois: saldoDepois.saldo,
      rawResponse,
      totalProcessos,
      totalPages,
      citacoesCount: citacoes.length,
      citacoes,
      durationMs: Date.now() - t0,
    }
  } catch (err) {
    if (err instanceof EscavadorError) {
      return {
        ok: false,
        error: `EscavadorError ${err.code}: ${err.message}`,
        durationMs: Date.now() - t0,
      }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
    }
  }
}

// ─── V2 /envolvido/processos RAW — SEM nenhum filtro interno ─────────────────

export interface TestV2RawResult {
  ok: boolean
  error?: string
  saldoAntes?: number
  saldoDepois?: number

  // Meta
  totalProcessos?: number
  totalPages?: number
  query?: { nome: string; cpf: string | null }

  // Todos os items crus da API (sem filtro nenhum)
  rawItems?: unknown[]

  // Items analisados: mostra por que cada um passou ou foi descartado
  analise?: Array<{
    numero_cnj: string
    tribunal_sigla: string
    tipoEnvolvido: string
    decisao: 'aceito' | 'rejeitado_parte' | 'rejeitado_sem_cnj' | 'passou_sem_match_nome'
    motivo: string
    nomeEnvolvidoMatch: string | null
    dataUltimaMov: string | null
  }>

  // Separação por decisão
  aceitos?: unknown[]
  rejeitados?: unknown[]

  durationMs?: number
}

/** V2 Raw — chama /envolvido/processos e analisa CADA item (sem filtrar nada) */
export async function testBuscarV2Raw(
  nome: string,
  cpf: string,
  opts: { semCpf?: boolean; comHomonimos?: boolean; status?: 'ATIVO' | 'INATIVO' } = {},
): Promise<TestV2RawResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const nomeTrim = nome.trim()
  if (!nomeTrim) return { ok: false, error: 'Nome é obrigatório' }

  const cpfDigits = cpf.replace(/\D/g, '')
  const cpfParam = !opts.semCpf && cpfDigits.length === 11 ? cpfDigits : null

  const token = process.env.ESCAVADOR_API_TOKEN
  if (!token) return { ok: false, error: 'ESCAVADOR_API_TOKEN não configurado' }

  const svc = new EscavadorService()
  const t0 = Date.now()

  try {
    const saldoAntes = await svc.verificarSaldo()

    // Chamada direta ao endpoint, sem passar pelo service (para não aplicar filtros)
    const params = new URLSearchParams()
    params.set('nome', nomeTrim)
    if (cpfParam) params.set('cpf', cpfParam)
    if (opts.comHomonimos) params.set('incluir_homonimos', 'true')
    if (opts.status) params.set('status', opts.status)
    params.set('limit', '100')

    const res = await fetch(`https://api.escavador.com/api/v2/envolvido/processos?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status}: ${await res.text().catch(() => '')}`,
        durationMs: Date.now() - t0,
      }
    }

    const data = await res.json()
    const items: Array<Record<string, unknown>> = data?.items ?? data?.resposta?.items ?? []
    const total = data?.paginator?.total ?? data?.envolvido_encontrado?.quantidade_processos ?? items.length
    const totalPages = data?.paginator?.total_pages ?? 1

    // Analisar cada item: replicar a MESMA lógica do EscavadorService para saber por que foi aceito/rejeitado
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
    const nomeNorm = norm(nomeTrim)

    const analise: TestV2RawResult['analise'] = []
    const aceitos: unknown[] = []
    const rejeitados: unknown[] = []

    for (const item of items) {
      const numero_cnj = (item.numero_cnj as string) ?? ''
      const unidade = item.unidade_origem as { tribunal_sigla?: string; nome?: string } | undefined
      const tribunal_sigla = unidade?.tribunal_sigla ?? (item.tribunal as string) ?? 'OUTROS'

      if (!numero_cnj) {
        analise.push({
          numero_cnj: '(sem CNJ)',
          tribunal_sigla,
          tipoEnvolvido: '—',
          decisao: 'rejeitado_sem_cnj',
          motivo: 'numero_cnj ausente no item',
          nomeEnvolvidoMatch: null,
          dataUltimaMov: null,
        })
        rejeitados.push(item)
        continue
      }

      const fontes = (item.fontes as Array<{ envolvidos?: Array<Record<string, unknown>> }>) ?? []
      const envolvidos = fontes[0]?.envolvidos ?? (item.envolvidos as Array<Record<string, unknown>>) ?? []

      const peritoEnv = envolvidos.find((e) => {
        const n = norm((e.nome as string) ?? '')
        return n.includes(nomeNorm) || nomeNorm.includes(n)
      })

      const tipoEnvolvido = ((peritoEnv?.tipo_normalizado as string) ?? (peritoEnv?.tipo as string) ?? 'Envolvido')
      const tipoUpper = tipoEnvolvido.toUpperCase()
      const ehPerito = ['PERITO', 'PERITA', 'EXPERT', 'AUXILIAR', 'TÉCNICO', 'TECNICO'].some(t => tipoUpper.includes(t))
      const ehParte = ['AUTOR', 'AUTORA', 'RÉU', 'REU', 'REQUERENTE', 'REQUERIDO'].some(t => tipoUpper.includes(t))

      const dataUltimaMov = (item.data_ultima_movimentacao as string) ?? (item.data_inicio as string) ?? null

      if (ehParte && !ehPerito) {
        analise.push({
          numero_cnj,
          tribunal_sigla,
          tipoEnvolvido,
          decisao: 'rejeitado_parte',
          motivo: `Descartado: tipo="${tipoEnvolvido}" bate com AUTOR/RÉU e não tem palavra-chave de perito`,
          nomeEnvolvidoMatch: (peritoEnv?.nome as string) ?? null,
          dataUltimaMov,
        })
        rejeitados.push(item)
      } else if (!peritoEnv) {
        // Nome não bateu com nenhum envolvido, mas ainda assim volta da API
        analise.push({
          numero_cnj,
          tribunal_sigla,
          tipoEnvolvido,
          decisao: 'passou_sem_match_nome',
          motivo: 'Nome não encontrou match em item.fontes[0].envolvidos — mas item veio da API',
          nomeEnvolvidoMatch: null,
          dataUltimaMov,
        })
        aceitos.push(item)
      } else {
        analise.push({
          numero_cnj,
          tribunal_sigla,
          tipoEnvolvido,
          decisao: 'aceito',
          motivo: `OK: tipo="${tipoEnvolvido}" — ${ehPerito ? 'é perito' : 'não é parte'}`,
          nomeEnvolvidoMatch: (peritoEnv.nome as string) ?? null,
          dataUltimaMov,
        })
        aceitos.push(item)
      }
    }

    const saldoDepois = await svc.verificarSaldo()

    return {
      ok: true,
      saldoAntes: saldoAntes.saldo,
      saldoDepois: saldoDepois.saldo,
      totalProcessos: total,
      totalPages,
      query: { nome: nomeTrim, cpf: cpfParam },
      rawItems: items,
      analise,
      aceitos,
      rejeitados,
      durationMs: Date.now() - t0,
    }
  } catch (err) {
    if (err instanceof EscavadorError) {
      return {
        ok: false,
        error: `EscavadorError ${err.code}: ${err.message}`,
        durationMs: Date.now() - t0,
      }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
    }
  }
}

// ─── V1 /busca — Diários Oficiais (onde nomeações realmente aparecem) ───────

export interface TestV1BuscaResult {
  ok: boolean
  error?: string
  saldoAntes?: number
  saldoDepois?: number

  query?: string
  totalResultados?: number
  totalPaginas?: number

  // Itens crus da API (sem filtro de tribunal nem de nome exato)
  rawItems?: unknown[]

  // Distribuição por tribunal (DJRJ, DJSP, etc.) — ajuda identificar onde o user aparece
  tribunalCounts?: Record<string, number>

  // Items que mencionam "perito", "nomeacao", "perícia" — candidatos reais
  candidatos?: unknown[]

  durationMs?: number
}

/** Busca V1 crua — sem filtros de tribunal, sem exigir nome completo. Mostra TUDO. */
export async function testBuscarV1(
  termo: string,
  opts: { comOperadores?: boolean } = {},
): Promise<TestV1BuscaResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const termoTrim = termo.trim()
  if (!termoTrim) return { ok: false, error: 'Informe nome ou CPF' }

  const token = process.env.ESCAVADOR_API_TOKEN
  if (!token) return { ok: false, error: 'ESCAVADOR_API_TOKEN não configurado' }

  const svc = new EscavadorService()
  const t0 = Date.now()

  try {
    const saldoAntes = await svc.verificarSaldo()

    // Busca crua V1 — com aspas (frase exata)
    const q = encodeURIComponent(`"${termoTrim}"`)
    const baseUrl = `https://api.escavador.com/api/v1/busca?q=${q}&qo=d&qs=d&limit=50&page=1`
    const url = opts.comOperadores
      ? `${baseUrl}&utilizar_operadores_logicos=1`
      : baseUrl

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status}: ${await res.text().catch(() => '')}`,
        durationMs: Date.now() - t0,
      }
    }

    const data = await res.json() as {
      paginator: { total: number; total_pages?: number }
      items: Array<{
        id: number
        tipo_resultado?: string
        diario_sigla?: string
        diario_nome?: string
        diario_data?: string
        texto?: string
        link?: string
      }>
    }

    const items = data.items ?? []

    // Distribuição por tribunal
    const tribunalCounts: Record<string, number> = {}
    for (const item of items) {
      const sigla = item.diario_sigla ?? '(sem sigla)'
      tribunalCounts[sigla] = (tribunalCounts[sigla] ?? 0) + 1
    }

    // Candidatos: items que mencionam perito/perícia/nomeação no texto
    const candidatoRegex = /per[íi]c|perito|vistori|nomea|designa|expert|laudo/i
    const candidatos = items.filter((i) => i.texto && candidatoRegex.test(i.texto))

    const saldoDepois = await svc.verificarSaldo()

    return {
      ok: true,
      saldoAntes: saldoAntes.saldo,
      saldoDepois: saldoDepois.saldo,
      query: termoTrim,
      totalResultados: data.paginator?.total ?? items.length,
      totalPaginas: data.paginator?.total_pages ?? 1,
      rawItems: items,
      tribunalCounts,
      candidatos,
      durationMs: Date.now() - t0,
    }
  } catch (err) {
    if (err instanceof EscavadorError) {
      return {
        ok: false,
        error: `EscavadorError ${err.code}: ${err.message}`,
        durationMs: Date.now() - t0,
      }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
    }
  }
}

// ─── Busca processo direto por CNJ (valida se Escavador tem) ────────────────

export interface TestCnjResult {
  ok: boolean
  error?: string
  httpStatus?: number
  cnj?: string
  rawResponse?: unknown
  // Extraído do response para facilitar análise
  envolvidos?: unknown[]
  tribunal?: string
  unidade?: string
  status?: string
  dataUltimaMov?: string | null
  dataInicio?: string | null
  // Se seu nome/CPF está nos envolvidos
  matchEncontrado?: {
    nome: string | null
    tipo: string | null
    tipo_normalizado: string | null
    cpf: string | null
  } | null
  durationMs?: number
}

export async function testBuscarProcessoPorCnj(
  cnj: string,
  nomePerito: string,
  cpfPerito: string,
): Promise<TestCnjResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const cnjTrim = cnj.trim()
  if (!cnjTrim) return { ok: false, error: 'Informe o CNJ' }

  const token = process.env.ESCAVADOR_API_TOKEN
  if (!token) return { ok: false, error: 'ESCAVADOR_API_TOKEN não configurado' }

  const t0 = Date.now()

  try {
    const res = await fetch(`https://api.escavador.com/api/v2/processos/numero_cnj/${encodeURIComponent(cnjTrim)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return {
        ok: false,
        error: `HTTP ${res.status}: ${body.slice(0, 500)}`,
        httpStatus: res.status,
        cnj: cnjTrim,
        durationMs: Date.now() - t0,
      }
    }

    const data = await res.json()

    // Extrair info útil
    const proc = data as Record<string, unknown>
    const fontes = (proc.fontes as Array<Record<string, unknown>>) ?? []
    const envolvidos = (fontes[0]?.envolvidos as Array<Record<string, unknown>>) ?? (proc.envolvidos as Array<Record<string, unknown>>) ?? []

    const tribunal = ((proc.unidade_origem as Record<string, unknown>)?.tribunal_sigla as string) ?? (proc.tribunal as string) ?? null
    const unidade = ((proc.unidade_origem as Record<string, unknown>)?.nome as string) ?? null
    const status = (proc.status as string) ?? null
    const dataUltimaMov = (proc.data_ultima_movimentacao as string) ?? null
    const dataInicio = (proc.data_inicio as string) ?? null

    // Tentar match com nome/cpf do perito
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
    const nomeNorm = norm(nomePerito.trim())
    const cpfDigits = cpfPerito.replace(/\D/g, '')

    const matched = envolvidos.find((e) => {
      const n = norm((e.nome as string) ?? '')
      const c = ((e.cpf as string) ?? '').replace(/\D/g, '')
      if (nomeNorm && (n.includes(nomeNorm) || nomeNorm.includes(n))) return true
      if (cpfDigits.length === 11 && c === cpfDigits) return true
      return false
    })

    return {
      ok: true,
      cnj: cnjTrim,
      rawResponse: data,
      envolvidos,
      tribunal: tribunal ?? undefined,
      unidade: unidade ?? undefined,
      status: status ?? undefined,
      dataUltimaMov,
      dataInicio,
      matchEncontrado: matched ? {
        nome: (matched.nome as string) ?? null,
        tipo: (matched.tipo as string) ?? null,
        tipo_normalizado: (matched.tipo_normalizado as string) ?? null,
        cpf: (matched.cpf as string) ?? null,
      } : null,
      durationMs: Date.now() - t0,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
    }
  }
}

// ─── BUSCA COMPLETA — 1 botão que combina tudo ────────────────────────────────

export interface TestBuscaCompletaResult {
  ok: boolean
  error?: string
  saldoAntes?: number
  saldoDepois?: number
  durationMs?: number

  // Resumo
  totalUnicos?: number        // total de processos únicos após dedup
  totalAceitos?: number       // passaram no filtro (não são AUTOR/RÉU)
  totalRejeitados?: number
  creditosConsumidos?: number

  // Todos os processos únicos consolidados
  processos?: Array<{
    cnj: string
    tribunal: string
    unidade: string
    tipoEnvolvido: string
    decisao: 'aceito' | 'rejeitado_parte'
    motivo: string
    dataUltimaMov: string | null
    dataInicio: string | null
    status: string | null           // ATIVO / INATIVO
    poloAtivo: string | null
    poloPassivo: string | null
    achadoEm: string[]              // Quais estratégias trouxeram (com_cpf, sem_cpf, inativos, homonimos)
    cpfCadastradoNoProcesso: string | null
    linkEscavador: string
  }>

  // Query feita
  nome?: string
  cpf?: string | null

  // Estatísticas por estratégia
  porEstrategia?: Record<string, number>

  // Debug: items V1 brutos (pra ver se link_api veio correto)
  v1ItemsDebug?: Array<{
    diario_sigla: string | null
    diario_data: string | null
    texto_preview: string
    link: string | null
    link_api: string | null
    cnj_extraido_do_snippet: string | null
    cnj_extraido_do_link_api: string | null
  }>
}

async function fetchV2(
  params: URLSearchParams,
  token: string,
): Promise<{ items: Array<Record<string, unknown>>; total: number } | null> {
  try {
    const res = await fetch(`https://api.escavador.com/api/v2/envolvido/processos?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      items: data?.items ?? data?.resposta?.items ?? [],
      total: data?.paginator?.total ?? 0,
    }
  } catch {
    return null
  }
}

async function fetchV1Busca(
  termo: string,
  token: string,
): Promise<{ items: Array<Record<string, unknown>>; total: number } | null> {
  try {
    const q = encodeURIComponent(`"${termo}"`)
    const res = await fetch(`https://api.escavador.com/api/v1/busca?q=${q}&qo=d&qs=d&limit=50&page=1`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      items: data?.items ?? [],
      total: data?.paginator?.total ?? 0,
    }
  } catch {
    return null
  }
}

/** Extrai número CNJ de um texto */
function extractCnj(texto: string): string | null {
  const m = texto.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)
  return m ? m[0] : null
}

/** Extrai todos os CNJs de um texto (pode ter múltiplos no mesmo diário) */
function extractAllCnjs(texto: string): string[] {
  const matches = texto.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g)
  return matches ? Array.from(new Set(matches)) : []
}

/** Segue o link_api do item V1 e retorna o texto completo da página do diário */
async function fetchV1DiarioPage(linkApi: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(linkApi, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json() as Record<string, unknown>

    // A página do diário pode ter diferentes shapes dependendo da API
    const texto =
      (data.conteudo as string) ??
      (data.texto as string) ??
      (data.pagina as Record<string, unknown>)?.conteudo as string ??
      (data.pagina as Record<string, unknown>)?.texto as string ??
      JSON.stringify(data)

    return typeof texto === 'string' ? texto : null
  } catch {
    return null
  }
}

/** Tenta encontrar o CNJ mais próximo do snippet no texto completo da página */
function findCnjNearSnippet(pageText: string, snippet: string): string | null {
  // Pega as primeiras 80 chars do snippet como âncora
  const anchor = snippet.substring(0, 80).trim()
  const cnjs = extractAllCnjs(pageText)
  if (cnjs.length === 0) return null
  if (cnjs.length === 1) return cnjs[0]

  // Tenta localizar o anchor no texto e pegar o CNJ mais próximo
  const anchorIdx = pageText.indexOf(anchor)
  if (anchorIdx < 0) return cnjs[0] // Fallback: primeiro CNJ

  // Encontra o CNJ com menor distância do anchor
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

/**
 * Um botão só — combina TODAS as estratégias de busca V2 em paralelo,
 * deduplica por CNJ e devolve a união completa.
 *
 * Estratégias executadas em paralelo:
 * 1. V2 com CPF + nome (status padrão)
 * 2. V2 SEM CPF (só nome) — caso tribunal não tenha CPF cadastrado
 * 3. V2 com incluir_homonimos (match mais permissivo)
 * 4. V2 com status=INATIVO (processos arquivados)
 *
 * Cada processo ganha tag "achadoEm" mostrando qual(is) estratégia(s) o trouxe(ram).
 */
export async function testBuscaCompleta(
  nome: string,
  cpf: string,
  email?: string,
): Promise<TestBuscaCompletaResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const nomeTrim = nome.trim()
  if (!nomeTrim) return { ok: false, error: 'Nome é obrigatório' }

  const cpfDigits = cpf.replace(/\D/g, '')
  const cpfParam = cpfDigits.length === 11 ? cpfDigits : null
  const emailTrim = email?.trim().toLowerCase() || null

  const token = process.env.ESCAVADOR_API_TOKEN
  if (!token) return { ok: false, error: 'ESCAVADOR_API_TOKEN não configurado' }

  const svc = new EscavadorService()
  const t0 = Date.now()

  try {
    const saldoAntes = await svc.verificarSaldo()

    // Monta as estratégias
    const estrategias: Array<{ nome: string; params: URLSearchParams }> = []

    // Sempre faz a básica (sem CPF — mais inclusiva)
    const p1 = new URLSearchParams()
    p1.set('nome', nomeTrim)
    p1.set('limit', '100')
    estrategias.push({ nome: 'sem_cpf', params: p1 })

    // Se tem CPF, também tenta com CPF
    if (cpfParam) {
      const p2 = new URLSearchParams()
      p2.set('nome', nomeTrim)
      p2.set('cpf', cpfParam)
      p2.set('limit', '100')
      estrategias.push({ nome: 'com_cpf', params: p2 })
    }

    // Com homônimos (pode trazer matches parciais adicionais)
    const p3 = new URLSearchParams()
    p3.set('nome', nomeTrim)
    if (cpfParam) p3.set('cpf', cpfParam)
    p3.set('incluir_homonimos', 'true')
    p3.set('limit', '100')
    estrategias.push({ nome: 'homonimos', params: p3 })

    // Só INATIVOS (processos antigos/arquivados)
    const p4 = new URLSearchParams()
    p4.set('nome', nomeTrim)
    if (cpfParam) p4.set('cpf', cpfParam)
    p4.set('status', 'INATIVO')
    p4.set('limit', '100')
    estrategias.push({ nome: 'inativos', params: p4 })

    // Executa V2 em paralelo + V1 por email (se tiver) em paralelo
    const [resultadosV2, v1Email] = await Promise.all([
      Promise.all(estrategias.map(async (e) => ({ nome: e.nome, dados: await fetchV2(e.params, token) }))),
      emailTrim ? fetchV1Busca(emailTrim, token) : Promise.resolve(null),
    ])

    // Estatísticas por estratégia
    const porEstrategia: Record<string, number> = {}
    for (const r of resultadosV2) {
      porEstrategia[r.nome] = r.dados?.items.length ?? 0
    }
    if (emailTrim) {
      porEstrategia['v1_email'] = v1Email?.items.length ?? 0
    }

    const resultados = resultadosV2

    // Consolida e dedup por CNJ
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
    const nomeNorm = norm(nomeTrim)

    type ProcessoConsolidado = NonNullable<TestBuscaCompletaResult['processos']>[number]
    const mapaProcessos = new Map<string, ProcessoConsolidado>()

    for (const { nome: estrategia, dados } of resultados) {
      if (!dados) continue
      for (const item of dados.items) {
        const cnj = (item.numero_cnj as string) ?? ''
        if (!cnj) continue

        const fontes = (item.fontes as Array<Record<string, unknown>>) ?? []
        const envolvidos = (fontes[0]?.envolvidos as Array<Record<string, unknown>>) ?? (item.envolvidos as Array<Record<string, unknown>>) ?? []

        const meEnv = envolvidos.find((e) => {
          const n = norm((e.nome as string) ?? '')
          return n.includes(nomeNorm) || nomeNorm.includes(n)
        })

        const tipoEnvolvido = ((meEnv?.tipo_normalizado as string) ?? (meEnv?.tipo as string) ?? 'Envolvido')
        const tipoUpper = tipoEnvolvido.toUpperCase()
        const ehPerito = ['PERITO', 'PERITA', 'EXPERT', 'AUXILIAR', 'TÉCNICO', 'TECNICO'].some(t => tipoUpper.includes(t))
        const ehParte = ['AUTOR', 'AUTORA', 'RÉU', 'REU', 'REQUERENTE', 'REQUERIDO'].some(t => tipoUpper.includes(t))

        const decisao: 'aceito' | 'rejeitado_parte' = (ehParte && !ehPerito) ? 'rejeitado_parte' : 'aceito'
        const motivo = decisao === 'rejeitado_parte'
          ? `Tipo "${tipoEnvolvido}" indica que você é parte, não perito`
          : `OK: tipo "${tipoEnvolvido}"`

        const unidade = item.unidade_origem as Record<string, unknown> | undefined
        const tribunal = (unidade?.tribunal_sigla as string) ?? (item.tribunal as string) ?? 'OUTROS'
        const nomeUnidade = (unidade?.nome as string) ?? (item.tribunal as string) ?? 'Tribunal'

        const cpfCadastrado = ((meEnv?.cpf as string) ?? '').replace(/\D/g, '') || null

        // Se já existe no mapa, só adiciona a estratégia à tag
        const existente = mapaProcessos.get(cnj)
        if (existente) {
          if (!existente.achadoEm.includes(estrategia)) existente.achadoEm.push(estrategia)
          continue
        }

        mapaProcessos.set(cnj, {
          cnj,
          tribunal,
          unidade: nomeUnidade,
          tipoEnvolvido,
          decisao,
          motivo,
          dataUltimaMov: (item.data_ultima_movimentacao as string) ?? null,
          dataInicio: (item.data_inicio as string) ?? null,
          status: (item.status as string) ?? null,
          poloAtivo: (item.titulo_polo_ativo as string) ?? null,
          poloPassivo: (item.titulo_polo_passivo as string) ?? null,
          achadoEm: [estrategia],
          cpfCadastradoNoProcesso: cpfCadastrado,
          linkEscavador: item.id
            ? `https://www.escavador.com/processos/${item.id}`
            : `https://www.escavador.com/processos/${cnj}`,
        })
      }
    }

    // Adiciona processos vindos de V1 /busca (por email) que não estão na V2
    // (declarado fora do if pra retornar no response)
    // eslint-disable-next-line prefer-const
    var v1ItemsDebug: NonNullable<TestBuscaCompletaResult['v1ItemsDebug']> = []

    if (v1Email && emailTrim) {
      for (const item of v1Email.items) {
        const texto = (item.texto as string) ?? ''
        const snippetCnj = extractCnj(texto)
        let cnj = snippetCnj
        let origemCnj: 'snippet' | 'link_api' = 'snippet'
        let linkApiCnj: string | null = null

        // Se não achou CNJ no snippet, segue o link_api do diário
        const linkApi = (item.link_api as string) ?? null
        if (!cnj && linkApi) {
          const pageText = await fetchV1DiarioPage(linkApi, token)
          if (pageText) {
            linkApiCnj = findCnjNearSnippet(pageText, texto)
            if (linkApiCnj) {
              cnj = linkApiCnj
              origemCnj = 'link_api'
            }
          }
        }

        // Adiciona no debug
        v1ItemsDebug.push({
          diario_sigla: (item.diario_sigla as string) ?? null,
          diario_data: (item.diario_data as string) ?? null,
          texto_preview: texto.substring(0, 300),
          link: (item.link as string) ?? null,
          link_api: linkApi,
          cnj_extraido_do_snippet: snippetCnj,
          cnj_extraido_do_link_api: linkApiCnj,
        })

        if (!cnj) continue // Ainda não achou → descarta

        const existente = mapaProcessos.get(cnj)
        if (existente) {
          if (!existente.achadoEm.includes('v1_email')) existente.achadoEm.push('v1_email')
          continue
        }

        // Processo NOVO achado pelo email (não estava na V2)
        const diarioSigla = (item.diario_sigla as string) ?? 'OUTROS'
        const diarioNome = (item.diario_nome as string) ?? 'Diário Oficial'
        const diarioData = (item.diario_data as string) ?? null

        mapaProcessos.set(cnj, {
          cnj,
          tribunal: diarioSigla.replace(/^DJ/, 'TJ'),
          unidade: diarioNome,
          tipoEnvolvido: 'Perito (do Diário Oficial)',
          decisao: 'aceito',
          motivo: `Encontrado no Diário Oficial V1 pelo email (CNJ via ${origemCnj}) — V2 ainda não indexou`,
          dataUltimaMov: diarioData,
          dataInicio: null,
          status: null,
          poloAtivo: null,
          poloPassivo: null,
          achadoEm: ['v1_email'],
          cpfCadastradoNoProcesso: null,
          linkEscavador: (item.link as string) ?? `https://www.escavador.com/processos/${cnj}`,
        })
      }
    }

    const processos = Array.from(mapaProcessos.values())
    const aceitos = processos.filter(p => p.decisao === 'aceito')
    const rejeitados = processos.filter(p => p.decisao === 'rejeitado_parte')

    const saldoDepois = await svc.verificarSaldo()

    return {
      ok: true,
      saldoAntes: saldoAntes.saldo,
      saldoDepois: saldoDepois.saldo,
      durationMs: Date.now() - t0,
      totalUnicos: processos.length,
      totalAceitos: aceitos.length,
      totalRejeitados: rejeitados.length,
      creditosConsumidos: saldoAntes.saldo - saldoDepois.saldo,
      processos,
      nome: nomeTrim,
      cpf: cpfParam,
      porEstrategia,
      v1ItemsDebug: v1ItemsDebug.length > 0 ? v1ItemsDebug : undefined,
    }
  } catch (err) {
    if (err instanceof EscavadorError) {
      return {
        ok: false,
        error: `EscavadorError ${err.code}: ${err.message}`,
        durationMs: Date.now() - t0,
      }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
    }
  }
}

// ─── BUSCA ASSÍNCRONA POR CPF (V1) — vai direto no PJe ───────────────────────

export interface TestAssincronaDispararResult {
  ok: boolean
  error?: string
  httpStatus?: number
  requestId?: string | number
  rawResponse?: unknown
  endpoint?: string
}

/**
 * Dispara busca assíncrona por CPF. A API escaneia TODOS os tribunais
 * (PJe, eProc, Projudi) em tempo real — não depende do índice do Escavador.
 * Retorna um request_id para consultar depois.
 */
export async function testDispararBuscaAssincronaCpf(
  cpf: string,
): Promise<TestAssincronaDispararResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const cpfDigits = cpf.replace(/\D/g, '')
  if (cpfDigits.length !== 11) {
    return { ok: false, error: 'CPF inválido — informe 11 dígitos' }
  }

  const token = process.env.ESCAVADOR_API_TOKEN
  if (!token) return { ok: false, error: 'ESCAVADOR_API_TOKEN não configurado' }

  // Tentar endpoints conhecidos (a API tem padrão /api/v1/processos/assincrono/{tipo})
  const tentativas = [
    { url: 'https://api.escavador.com/api/v1/processos/assincrono/cpf', body: { cpf: cpfDigits } },
    { url: 'https://api.escavador.com/api/v1/processos/por-cpf', body: { cpf: cpfDigits } },
    { url: 'https://api.escavador.com/api/v1/busca-assincrona', body: { cpf: cpfDigits, tipo: 'cpf' } },
  ]

  for (const t of tentativas) {
    try {
      const res = await fetch(t.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(t.body),
        cache: 'no-store',
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        const requestId =
          (data.id as string | number) ??
          (data.request_id as string | number) ??
          (data.busca_id as string | number) ??
          undefined
        return {
          ok: true,
          requestId,
          rawResponse: data,
          endpoint: t.url,
          httpStatus: res.status,
        }
      }

      // Se não for 404, é erro real — retorna
      if (res.status !== 404) {
        return {
          ok: false,
          error: `HTTP ${res.status}: ${JSON.stringify(data).slice(0, 500)}`,
          httpStatus: res.status,
          rawResponse: data,
          endpoint: t.url,
        }
      }
      // Se 404, tenta próximo endpoint
    } catch (err) {
      // Segue pra próxima tentativa
      console.error(`[assincronaCpf] Erro em ${t.url}:`, err)
    }
  }

  return {
    ok: false,
    error: 'Nenhum endpoint de busca assíncrona por CPF funcionou. A API pode ter mudado.',
  }
}

export interface TestAssincronaStatusResult {
  ok: boolean
  error?: string
  status?: string
  rawStatus?: unknown
  rawResultados?: unknown
  endpoint?: string
  durationMs?: number
  // Quando concluído
  processos?: Array<Record<string, unknown>>
  totalEncontrados?: number
}

/**
 * Consulta status + resultados de uma busca assíncrona pelo request_id.
 * Retorna status: pendente | processando | concluido | erro
 */
export async function testConsultarBuscaAssincrona(
  requestId: string | number,
): Promise<TestAssincronaStatusResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const token = process.env.ESCAVADOR_API_TOKEN
  if (!token) return { ok: false, error: 'ESCAVADOR_API_TOKEN não configurado' }

  const t0 = Date.now()

  try {
    // Status
    const statusRes = await fetch(`https://api.escavador.com/api/v1/buscas-assincronas/${encodeURIComponent(String(requestId))}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      cache: 'no-store',
    })

    if (!statusRes.ok) {
      const body = await statusRes.text().catch(() => '')
      return {
        ok: false,
        error: `Status HTTP ${statusRes.status}: ${body.slice(0, 300)}`,
        durationMs: Date.now() - t0,
      }
    }

    const statusData = await statusRes.json()
    const status = (statusData.status as string) ?? (statusData.situacao as string) ?? 'desconhecido'

    const result: TestAssincronaStatusResult = {
      ok: true,
      status,
      rawStatus: statusData,
      durationMs: Date.now() - t0,
    }

    // Se concluído, busca resultados
    if (['concluido', 'concluído', 'finalizado', 'sucesso', 'done', 'complete'].some(s => status.toLowerCase().includes(s))) {
      try {
        const resultadosRes = await fetch(`https://api.escavador.com/api/v1/buscas-assincronas/${encodeURIComponent(String(requestId))}/resultados`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
          cache: 'no-store',
        })

        if (resultadosRes.ok) {
          const resultadosData = await resultadosRes.json()
          result.rawResultados = resultadosData
          const processos = (resultadosData.items as Array<Record<string, unknown>>)
            ?? (resultadosData.processos as Array<Record<string, unknown>>)
            ?? (resultadosData.resultados as Array<Record<string, unknown>>)
            ?? []
          result.processos = processos
          result.totalEncontrados = resultadosData.total ?? processos.length
        }
      } catch (err) {
        console.error('[consultarAssincrona] Erro ao buscar resultados:', err)
      }
    }

    return result
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
    }
  }
}

// ─── Só saldo (rápido, grátis) ────────────────────────────────────────────────

export async function testVerificarSaldo(): Promise<{ ok: boolean; saldo?: number; descricao?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    const svc = new EscavadorService()
    const info = await svc.verificarSaldo()
    return { ok: true, saldo: info.saldo, descricao: info.descricao }
  } catch (err) {
    if (err instanceof EscavadorError) {
      return { ok: false, error: `EscavadorError ${err.code}: ${err.message}` }
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

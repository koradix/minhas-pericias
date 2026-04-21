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

'use server'

/**
 * Judit — Relatório de consumo da API.
 *
 * Busca histórico de requests no endpoint GET /requests
 * e calcula custos estimados por tipo de operação.
 */

import { auth } from '@/auth'
import { isJuditReady, juditConfig } from '@/lib/integrations/judit/config'

// ─── Types ──────────────────────────────────────────────────────────────────

interface JuditRequest {
  request_id: string
  search: {
    on_demand: boolean
    search_type: string
    search_key: string
    response_type: string
  }
  with_attachments: boolean
  origin: string // api | tracking
  status: string
  created_at: string
  updated_at: string
}

export interface ConsumoItem {
  id: string
  data: string
  tipo: string // cpf | cnpj | lawsuit_cnj | name | oab
  chave: string // masked
  origem: string // api | tracking
  comAnexos: boolean
  onDemand: boolean
  status: string
  custoEstimado: number
}

export interface ConsumoResumo {
  ok: boolean
  message: string
  periodo: { de: string; ate: string }
  totalRequests: number
  custoTotal: number
  porTipo: Record<string, { count: number; custo: number }>
  items: ConsumoItem[]
}

// ─── Pricing estimates (valores ilustrativos da doc Judit) ──────────────────

function estimarCusto(req: JuditRequest): number {
  const { search, with_attachments, origin } = req
  let custo = 0

  if (origin === 'tracking') {
    // Monitoramento processual: R$ 0,69/mês
    custo += 0.69
  } else {
    // Consulta via API
    switch (search.search_type) {
      case 'lawsuit_cnj':
        custo += search.on_demand ? 0.25 : 0.07 // real-time vs data lake
        break
      case 'cpf':
      case 'cnpj':
        custo += search.on_demand ? 0.15 : 0.04
        break
      case 'name':
      case 'oab':
        custo += 0.15
        break
      default:
        custo += 0.10
    }
  }

  // Anexos: cobrança adicional
  if (with_attachments) {
    custo += 3.50
  }

  return custo
}

function maskKey(key: string): string {
  if (key.length <= 6) return key
  return key.slice(0, 3) + '***' + key.slice(-3)
}

// ─── Action ─────────────────────────────────────────────────────────────────

export async function getConsumoJudit(
  dataInicio?: string,
  dataFim?: string,
): Promise<ConsumoResumo> {
  const empty: ConsumoResumo = {
    ok: false, message: '', periodo: { de: '', ate: '' },
    totalRequests: 0, custoTotal: 0, porTipo: {}, items: [],
  }

  const session = await auth()
  if (!session?.user?.id) return { ...empty, message: 'Não autenticado' }
  if (!isJuditReady()) return { ...empty, message: 'Judit não habilitada' }

  // Default: último mês
  const agora = new Date()
  const de = dataInicio ?? new Date(agora.getFullYear(), agora.getMonth() - 1, agora.getDate()).toISOString().split('T')[0]
  const ate = dataFim ?? agora.toISOString().split('T')[0]

  try {
    const url = `${juditConfig.baseUrl}/requests?page_size=1000&created_at_gte=${de}&created_at_lte=${ate}`
    const res = await fetch(url, {
      headers: { 'api-key': juditConfig.apiKey },
    })

    if (!res.ok) {
      return { ...empty, message: `Erro API: ${res.status}` }
    }

    const data = await res.json()
    const requests: JuditRequest[] = data.page_data ?? []

    const items: ConsumoItem[] = requests.map(r => ({
      id: r.request_id,
      data: r.created_at,
      tipo: r.search.search_type,
      chave: maskKey(r.search.search_key),
      origem: r.origin,
      comAnexos: r.with_attachments,
      onDemand: r.search.on_demand,
      status: r.status,
      custoEstimado: estimarCusto(r),
    }))

    // Agrupar por tipo
    const porTipo: Record<string, { count: number; custo: number }> = {}
    for (const item of items) {
      if (!porTipo[item.tipo]) porTipo[item.tipo] = { count: 0, custo: 0 }
      porTipo[item.tipo].count++
      porTipo[item.tipo].custo += item.custoEstimado
    }

    const custoTotal = items.reduce((acc, i) => acc + i.custoEstimado, 0)

    return {
      ok: true,
      message: `${items.length} requisições no período`,
      periodo: { de, ate },
      totalRequests: items.length,
      custoTotal,
      porTipo,
      items,
    }
  } catch (e) {
    return { ...empty, message: `Erro: ${e instanceof Error ? e.message : String(e)}` }
  }
}

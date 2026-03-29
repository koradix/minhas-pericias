import { prisma } from '@/lib/prisma'
import type { TribunalRadarInfo } from '@/lib/services/radar-provider'

// ─── Serialized types (safe to pass as Server Component props) ────────────────

export interface CitacaoSerializada {
  id: string
  peritoId: string
  externalId: string
  diarioSigla: string
  diarioNome: string
  diarioData: string  // ISO string
  snippet: string
  numeroProcesso: string | null
  linkCitacao: string
  visualizado: boolean
  fonte: string
  status: string
  periciaId: string | null
  criadoEm: string    // ISO string
}

export interface KpisRadar {
  total: number
  naoLidas: number
  ultimaBusca: string | null  // ISO string or null
  saldo: number | null
}

export interface TribunaisRadar {
  suportados: TribunalRadarInfo[]
  ignorados: string[]
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getRadarConfig(peritoId: string) {
  return prisma.radarConfig.findUnique({ where: { peritoId } })
}

export async function getCitacoes(
  peritoId: string,
  options?: { apenasNaoLidas?: boolean },
): Promise<CitacaoSerializada[]> {
  const rows = await prisma.nomeacaoCitacao.findMany({
    where: {
      peritoId,
      status: 'pendente',
      ...(options?.apenasNaoLidas ? { visualizado: false } : {}),
    },
    orderBy: { diarioData: 'desc' },
  })

  return rows.map((r) => ({
    ...r,
    diarioData: r.diarioData.toISOString(),
    criadoEm: r.criadoEm.toISOString(),
  }))
}

export async function getKpis(peritoId: string): Promise<KpisRadar> {
  const [total, naoLidas, config] = await Promise.all([
    prisma.nomeacaoCitacao.count({ where: { peritoId } }),
    prisma.nomeacaoCitacao.count({ where: { peritoId, visualizado: false } }),
    prisma.radarConfig.findUnique({ where: { peritoId } }),
  ])

  return {
    total,
    naoLidas,
    ultimaBusca: config?.ultimaBusca?.toISOString() ?? null,
    saldo: config?.saldoUltimaVerif ?? null,
  }
}

export async function getNaoLidasCount(peritoId: string): Promise<number> {
  return prisma.nomeacaoCitacao.count({ where: { peritoId, visualizado: false } })
}

export async function getTribunaisDoRadar(peritoId: string): Promise<TribunaisRadar> {
  const config = await prisma.radarConfig.findUnique({ where: { peritoId } })
  if (!config) return { suportados: [], ignorados: [] }

  const resolvidos: TribunalRadarInfo[] = JSON.parse(config.tribunaisResolvidos || '[]')
  const ignorados: string[] = JSON.parse(config.tribunaisIgnorados || '[]')
  const suportados = resolvidos.filter((t) => t.suportaBusca)

  return { suportados, ignorados }
}

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

// ─── Write queries (citações) ───────────────────────────────────────────────

export interface CitacaoInput {
  peritoId: string
  externalId: string
  diarioSigla: string
  diarioNome: string
  diarioData: string     // ISO or YYYY-MM-DD
  snippet: string
  numeroProcesso: string | null
  linkCitacao: string
  fonte: string
}

/** Lookup map: sigla (uppercase) → TribunalVara.id */
export async function getVaraIdBySigla(
  peritoId: string,
): Promise<{ map: Map<string, string>; rows: { id: string; tribunalSigla: string }[] }> {
  const rows = await prisma.tribunalVara.findMany({
    where: { peritoId, ativa: true },
    select: { id: true, tribunalSigla: true },
  })
  const map = new Map(rows.map((v) => [v.tribunalSigla.toUpperCase(), v.id]))
  return { map, rows }
}

/**
 * Insere citação se não existe (dedup por @@unique).
 * Se inseriu, faz link com TribunalVara + increment totalNomeacoes + upsert VaraStats.
 * Retorna true se inseriu (nova), false se já existia.
 */
export async function upsertCitacao(
  input: CitacaoInput,
  varaIdMap: Map<string, string>,
): Promise<boolean> {
  const existing = await prisma.nomeacaoCitacao.findUnique({
    where: { peritoId_externalId: { peritoId: input.peritoId, externalId: input.externalId } },
    select: { id: true },
  })
  if (existing) return false

  const tribunalVaraId = varaIdMap.get(input.diarioSigla.toUpperCase()) ?? null

  try {
    await prisma.nomeacaoCitacao.create({
      data: {
        peritoId: input.peritoId,
        externalId: input.externalId,
        diarioSigla: input.diarioSigla,
        diarioNome: input.diarioNome,
        diarioData: new Date(input.diarioData),
        snippet: input.snippet,
        numeroProcesso: input.numeroProcesso,
        linkCitacao: input.linkCitacao,
        fonte: input.fonte,
        tribunalVaraId,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (!msg.includes('Unique constraint')) console.error('[upsertCitacao] erro:', err)
    return false
  }

  // Link com TribunalVara + VaraStats
  if (tribunalVaraId) {
    await linkTribunalVara(tribunalVaraId)
  }

  return true
}

/** Incrementa totalNomeacoes no TribunalVara e upsert VaraStats */
async function linkTribunalVara(tribunalVaraId: string): Promise<void> {
  const vara = await prisma.tribunalVara.update({
    where: { id: tribunalVaraId },
    data: { totalNomeacoes: { increment: 1 } },
    select: { tribunalSigla: true, varaNome: true },
  })

  await prisma.varaStats.upsert({
    where: { tribunalSigla_varaNome: { tribunalSigla: vara.tribunalSigla, varaNome: vara.varaNome } },
    create: { tribunalSigla: vara.tribunalSigla, varaNome: vara.varaNome, totalNomeacoes: 1 },
    update: { totalNomeacoes: { increment: 1 } },
  })
}

/** Bulk upsert de citações. Retorna quantas foram novas. */
export async function upsertCitacoesBatch(
  citacoes: CitacaoInput[],
  varaIdMap: Map<string, string>,
): Promise<number> {
  let novas = 0
  for (const c of citacoes) {
    const inserted = await upsertCitacao(c, varaIdMap)
    if (inserted) novas++
  }
  return novas
}

/** Atualiza stats do radar após busca */
export async function updateRadarStats(
  peritoId: string,
  saldo: number,
): Promise<void> {
  const totalCitacoes = await prisma.nomeacaoCitacao.count({ where: { peritoId } })
  await prisma.radarConfig.update({
    where: { peritoId },
    data: { ultimaBusca: new Date(), totalCitacoes, saldoUltimaVerif: saldo },
  })
}

/** Busca CNJs já existentes no v2_tribunal (para dedup V1) */
export async function getCnjsV2Existentes(peritoId: string): Promise<Set<string>> {
  const rows = await prisma.nomeacaoCitacao.findMany({
    where: { peritoId, fonte: 'v2_tribunal' },
    select: { numeroProcesso: true },
  })
  return new Set(rows.map(e => e.numeroProcesso).filter(Boolean) as string[])
}

import { prisma } from '@/lib/prisma'
import type { VaraComEndereco } from '@/lib/services/escavador'

// ─── Serialized type ──────────────────────────────────────────────────────────

export interface VaraItem {
  id: string
  peritoId: string
  tribunalSigla: string
  tribunalNome: string
  varaNome: string
  varaId: string | null
  cidade: string | null
  uf: string | null
  ativa: boolean
  totalNomeacoes: number
  criadoEm: string // ISO string
}

function toVaraItem(r: {
  id: string
  peritoId: string
  tribunalSigla: string
  tribunalNome: string
  varaNome: string
  varaId: string | null
  cidade: string | null
  uf: string | null
  ativa: boolean
  totalNomeacoes: number
  criadoEm: Date
}): VaraItem {
  return { ...r, criadoEm: r.criadoEm.toISOString() }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** All varas for a perito */
export async function getVarasByPerito(peritoId: string): Promise<VaraItem[]> {
  const rows = await prisma.tribunalVara.findMany({
    where: { peritoId, ativa: true },
    orderBy: [{ tribunalSigla: 'asc' }, { varaNome: 'asc' }],
  })
  return rows.map(toVaraItem)
}

/** Varas ranked by totalNomeacoes desc */
export async function getRankingVaras(peritoId: string): Promise<VaraItem[]> {
  const rows = await prisma.tribunalVara.findMany({
    where: { peritoId, ativa: true },
    orderBy: { totalNomeacoes: 'desc' },
  })
  return rows.map(toVaraItem)
}

/** Varas that already have at least one nomeacao linked */
export async function getVarasComNomeacoes(peritoId: string): Promise<VaraItem[]> {
  const rows = await prisma.tribunalVara.findMany({
    where: { peritoId, ativa: true, totalNomeacoes: { gt: 0 } },
    orderBy: { totalNomeacoes: 'desc' },
  })
  return rows.map(toVaraItem)
}

/** Varas not yet linked to any nomeacao (prospecção targets) */
export async function getVarasSemNomeacoes(peritoId: string): Promise<VaraItem[]> {
  const rows = await prisma.tribunalVara.findMany({
    where: { peritoId, ativa: true, totalNomeacoes: 0 },
    orderBy: [{ tribunalSigla: 'asc' }, { varaNome: 'asc' }],
  })
  return rows.map(toVaraItem)
}

/** Count of varas that have at least one nomeacao */
export async function getVarasComNomeacoesCount(peritoId: string): Promise<number> {
  return prisma.tribunalVara.count({ where: { peritoId, totalNomeacoes: { gt: 0 } } })
}

/** Platform-wide stats for a specific vara */
export async function getVaraStats(tribunalSigla: string, varaNome: string) {
  return prisma.varaStats.findUnique({
    where: { tribunalSigla_varaNome: { tribunalSigla, varaNome } },
  })
}

/** Top N varas by totalNomeacoes for map/prospecting views */
export async function getVarasParaProspeccao(peritoId: string, limit = 20): Promise<VaraItem[]> {
  const rows = await prisma.tribunalVara.findMany({
    where: { peritoId, ativa: true },
    orderBy: { totalNomeacoes: 'desc' },
    take: limit,
  })
  return rows.map(toVaraItem)
}

/** Varas for a perito filtered by UF */
export async function getVarasByEstadoFromDB(peritoId: string, uf: string): Promise<VaraItem[]> {
  const rows = await prisma.tribunalVara.findMany({
    where: { peritoId, ativa: true, uf: uf.toUpperCase() },
    orderBy: [{ tribunalSigla: 'asc' }, { varaNome: 'asc' }],
  })
  return rows.map(toVaraItem)
}

/** Upsert a vara with address data from Escavador (FREE /origens enriched) */
export async function upsertVaraComEndereco(peritoId: string, vara: VaraComEndereco): Promise<void> {
  await prisma.tribunalVara.upsert({
    where: { peritoId_tribunalSigla_varaNome: { peritoId, tribunalSigla: vara.tribunalSigla, varaNome: vara.varaNome } },
    create: {
      peritoId,
      tribunalSigla: vara.tribunalSigla,
      tribunalNome: vara.tribunalNome,
      varaNome: vara.varaNome,
      varaId: vara.varaId,
      uf: vara.uf,
      enderecoTexto: vara.enderecoTexto,
      latitude: vara.latitude,
      longitude: vara.longitude,
      sincronizadoEm: new Date(),
    },
    update: {
      enderecoTexto: vara.enderecoTexto,
      latitude: vara.latitude,
      longitude: vara.longitude,
      sincronizadoEm: new Date(),
    },
  })
}

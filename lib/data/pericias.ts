import { prisma } from '@/lib/prisma'

// ─── Helpers ────────────────────────────────────────────────────────────────

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PericiaRow {
  id: string; peritoId: string; numero: string; assunto: string; tipo: string
  tags: string
  processo: string | null; vara: string | null; partes: string | null
  endereco: string | null; status: string; prazo: string | null
  valorHonorarios: number | null; criadoEm: Date; atualizadoEm: Date
}

export interface NomeacaoLink {
  id: string
  criadoEm: Date
  nomeArquivo: string | null
  extractedData: string | null
  processSummary: string | null
  status: string
}

export interface CitacaoLink {
  diarioSigla: string
  linkCitacao: string
}

export interface CpRow {
  id: string
  ordem: number
  titulo: string
  endereco: string | null
  status: string
  midiaCount: number
}

export interface VistoriaInfo {
  data: string | null
  endereco: string | null
}

export interface PeritoPerfil2 {
  formacao: string | null
  registro: string | null
  telefone: string | null
}

export interface MidiaRow {
  id: string
  tipo: string
  url: string | null
  texto: string | null
  descricao: string | null
  criadoEm: string
}

// ─── Metadata queries ───────────────────────────────────────────────────────

export async function getPericiaAssunto(id: string): Promise<string | null> {
  const row = await prisma.pericia.findUnique({ where: { id }, select: { assunto: true } })
  return row?.assunto ?? null
}

export async function getRotaTitulo(id: string): Promise<string | null> {
  const row = await prisma.rotaPericia.findUnique({ where: { id }, select: { titulo: true } })
  return row?.titulo ?? null
}

// ─── Main fetch ─────────────────────────────────────────────────────────────

export async function getPericiaById(id: string): Promise<PericiaRow | null> {
  return prisma.pericia.findUnique({ where: { id } })
}

export async function getRotaById(id: string): Promise<{
  id: string; peritoId: string; titulo: string; status: string
  criadoEm: Date | string; atualizadoEm: Date | string
} | null> {
  return prisma.rotaPericia.findUnique({ where: { id } })
}

// ─── Related data ───────────────────────────────────────────────────────────

export async function getIntakeByPericiaId(periciaId: string): Promise<{ id: string; resumo: string | null } | null> {
  return prisma.processoIntake.findFirst({
    where: { periciaId },
    select: { id: true, resumo: true },
  })
}

export async function getNomeacaoByPericiaId(periciaId: string): Promise<NomeacaoLink | null> {
  return prisma.nomeacao.findFirst({
    where: { periciaId },
    select: { id: true, criadoEm: true, nomeArquivo: true, extractedData: true, processSummary: true, status: true },
  })
}

export async function getCitacaoByPericiaId(periciaId: string): Promise<CitacaoLink | null> {
  return prisma.nomeacaoCitacao.findFirst({
    where: { periciaId },
    select: { diarioSigla: true, linkCitacao: true },
  })
}

export async function getCheckpointsComMidias(
  filterKey: 'periciaId' | 'rotaId',
  filterValue: string,
): Promise<{ checkpoints: CpRow[]; midias: MidiaRow[] }> {
  const dbCps = await prisma.checkpoint.findMany({
    where: { [filterKey]: filterValue },
    orderBy: { ordem: 'asc' },
  })

  if (dbCps.length === 0) return { checkpoints: [], midias: [] }

  const cpIds = dbCps.map((c) => c.id)
  const dbMidias = await prisma.checkpointMidia.findMany({
    where: { checkpointId: { in: cpIds } },
    orderBy: { criadoEm: 'desc' },
  })

  const midias: MidiaRow[] = dbMidias.map((m) => ({
    id: m.id, tipo: m.tipo, url: m.url, texto: m.texto,
    descricao: m.descricao, criadoEm: toISO(m.criadoEm),
  }))

  const checkpoints: CpRow[] = dbCps.map((cp) => ({
    id: cp.id, ordem: cp.ordem, titulo: cp.titulo, endereco: cp.endereco,
    status: cp.status,
    midiaCount: dbMidias.filter((m) => m.checkpointId === cp.id).length,
  }))

  return { checkpoints, midias }
}

export async function getVistoriaInfo(periciaId: string): Promise<VistoriaInfo> {
  const cp = await prisma.checkpoint.findFirst({
    where: { periciaId, status: 'concluido' },
    orderBy: { ordem: 'asc' },
    select: { chegadaEm: true, endereco: true },
  })
  return {
    data: cp?.chegadaEm ? toISO(cp.chegadaEm) : null,
    endereco: cp?.endereco ?? null,
  }
}

export async function getPeritoPerfil(userId: string): Promise<PeritoPerfil2 | null> {
  return prisma.peritoPerfil.findUnique({
    where: { userId },
    select: { formacao: true, registro: true, telefone: true },
  })
}

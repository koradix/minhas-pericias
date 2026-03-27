import { prisma } from '@/lib/prisma'
import type { Rota, PontoRota, PericiaInfo, TipoPontoRota } from '@/lib/types/rotas'

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d as string)
}

function checkpointToTipo(periciaId: string | null, tribunalSigla: string | null): TipoPontoRota {
  if (tribunalSigla) return 'FORUM'
  if (periciaId) return 'PERICIA'
  return 'PERICIA'
}

export async function getRotasPericiasByPerito(peritoId: string): Promise<Rota[]> {
  try {
    return await _getRotas(peritoId)
  } catch {
    return []
  }
}

async function _getRotas(peritoId: string): Promise<Rota[]> {
  const rotas = await prisma.rotaPericia.findMany({
    where: { peritoId },
    orderBy: { criadoEm: 'desc' },
  })

  if (rotas.length === 0) return []

  const rotaIds = rotas.map((r) => r.id)

  type CheckpointRow = Awaited<ReturnType<typeof prisma.checkpoint.findMany>>[number]
  const checkpoints: CheckpointRow[] = await prisma.checkpoint.findMany({
    where: { rotaId: { in: rotaIds } },
    orderBy: { ordem: 'asc' },
  }).catch(() => [])

  // Collect periciaIds to join
  const periciaIds = [...new Set(
    checkpoints.map((c) => c.periciaId).filter((id): id is string => !!id)
  )]

  const periciasMap = new Map<string, PericiaInfo>()
  if (periciaIds.length > 0) {
    const pericias = await prisma.pericia.findMany({
      where: { id: { in: periciaIds } },
      select: { id: true, numero: true, assunto: true, tipo: true, status: true, vara: true },
    }).catch(() => [])
    for (const p of pericias) {
      periciasMap.set(p.id, { id: p.id, numero: p.numero, assunto: p.assunto, tipo: p.tipo, status: p.status, vara: p.vara })
    }
  }

  const checkpointsByRota = new Map<string, CheckpointRow[]>()
  for (const c of checkpoints) {
    const arr = checkpointsByRota.get(c.rotaId) ?? []
    arr.push(c)
    checkpointsByRota.set(c.rotaId, arr)
  }

  return rotas.map((r) => {
    const pts = checkpointsByRota.get(r.id) ?? []
    const pontos: PontoRota[] = pts.map((c) => ({
      id: c.id,
      rotaId: r.id,
      nome: c.titulo,
      latitude: c.lat ?? 0,
      longitude: c.lng ?? 0,
      tipo: checkpointToTipo(c.periciaId ?? null, c.tribunalSigla ?? null),
      ordem: c.ordem,
      endereco: c.endereco ?? undefined,
      periciaId: c.periciaId ?? undefined,
      periciaInfo: c.periciaId ? periciasMap.get(c.periciaId) : undefined,
      pericoId: c.pericoId ?? undefined,
      tribunalSigla: c.tribunalSigla ?? undefined,
      varaNome: c.varaNome ?? undefined,
      statusCheckpoint: (c.status as 'pendente' | 'chegou' | 'concluido') ?? 'pendente',
    }))

    // Infer tipo from checkpoints
    const hasPericia = pts.some((c) => c.periciaId || c.pericoId)
    const tipo = hasPericia ? 'PERICIA' : 'PROSPECCAO'

    return {
      id: r.id,
      tipo,
      titulo: r.titulo,
      data: toDate(r.criadoEm).toLocaleDateString('pt-BR'),
      status: r.status as Rota['status'],
      distanciaKm: 0,
      tempoEstimadoMin: 0,
      custoEstimado: 0,
      pontos,
    }
  })
}

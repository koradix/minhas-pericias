import { prisma } from '@/lib/prisma'
import type { Rota, PontoRota, TipoPontoRota } from '@/lib/types/rotas'

function checkpointToTipo(tribunalSigla: string | null): TipoPontoRota {
  if (tribunalSigla) return 'FORUM'
  return 'PERICIA'
}

export async function getRotasPericiasByPerito(peritoId: string): Promise<Rota[]> {
  const rotas = await prisma.rotaPericia.findMany({
    where: { peritoId },
    orderBy: { criadoEm: 'desc' },
  })

  if (rotas.length === 0) return []

  const rotaIds = rotas.map((r) => r.id)
  const checkpoints = await prisma.checkpoint.findMany({
    where: { rotaId: { in: rotaIds } },
    orderBy: { ordem: 'asc' },
  })

  const checkpointsByRota = new Map<string, typeof checkpoints>()
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
      tipo: checkpointToTipo(c.tribunalSigla ?? null),
      ordem: c.ordem,
      endereco: c.endereco ?? undefined,
      pericoId: c.pericoId ?? undefined,
      tribunalSigla: c.tribunalSigla ?? undefined,
      varaNome: c.varaNome ?? undefined,
    }))

    // Infer tipo from checkpoints
    const hasPericia = pts.some((c) => c.pericoId)
    const tipo = hasPericia ? 'PERICIA' : 'PROSPECCAO'

    // Status mapping
    const status = r.status as Rota['status']

    return {
      id: r.id,
      tipo,
      titulo: r.titulo,
      data: r.criadoEm.toLocaleDateString('pt-BR'),
      status,
      distanciaKm: 0,
      tempoEstimadoMin: 0,
      custoEstimado: 0,
      pontos,
    }
  })
}

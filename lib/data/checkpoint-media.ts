import { prisma } from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckpointMidiaDado {
  id: string
  checkpointId: string
  tipo: string
  url: string | null
  texto: string | null
  descricao: string | null
  criadoEm: Date
}

export interface CheckpointDado {
  id: string
  rotaId: string
  ordem: number
  titulo: string
  endereco: string | null
  lat: number | null
  lng: number | null
  status: string
  chegadaEm: Date | null
  criadoEm: Date
  midias: CheckpointMidiaDado[]
}

export interface RotaComCheckpoints {
  id: string
  peritoId: string
  titulo: string
  status: string
  criadoEm: Date
  atualizadoEm: Date
  checkpoints: Omit<CheckpointDado, 'midias'>[]
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Returns a checkpoint with all its attached media. */
export async function getCheckpointComMidia(
  checkpointId: string,
): Promise<CheckpointDado | null> {
  const checkpoint = await prisma.checkpoint.findUnique({ where: { id: checkpointId } })
  if (!checkpoint) return null

  const midias = await prisma.checkpointMidia.findMany({
    where: { checkpointId },
    orderBy: { criadoEm: 'asc' },
  })

  return { ...checkpoint, midias }
}

/** Returns a full rota tree (no media) for the map view. */
export async function getRotaComCheckpoints(rotaId: string): Promise<RotaComCheckpoints | null> {
  const rota = await prisma.rotaPericia.findUnique({ where: { id: rotaId } })
  if (!rota) return null

  const checkpoints = await prisma.checkpoint.findMany({
    where: { rotaId },
    orderBy: { ordem: 'asc' },
  })

  return { ...rota, checkpoints }
}

// ─── Serializable DTO for client components ───────────────────────────────────

export interface MidiaDaPericia {
  id: string
  tipo: string
  url: string | null
  texto: string | null
  descricao: string | null
  criadoEm: string // ISO string
}

/**
 * All media (fotos, áudios, notas) captured in any checkpoint of any rota
 * linked to a specific pericia. Uses dual path:
 * 1. Via RotaPericia.pericoId → Checkpoint (created via PericiaMediaSection)
 * 2. Via Checkpoint.pericoId directly (created via rota execution checkpoints)
 */
export async function getMidiasByPericiaId(
  pericoId: string,
  peritoId: string,
): Promise<MidiaDaPericia[]> {
  // Path 1: checkpoints linked via RotaPericia
  const rotas = await prisma.rotaPericia.findMany({
    where: { pericoId, peritoId },
    select: { id: true },
  })
  const rotaIds = rotas.map((r) => r.id)

  // Collect checkpoint IDs from both paths
  const cpFromRota = rotaIds.length
    ? await prisma.checkpoint.findMany({ where: { rotaId: { in: rotaIds } }, select: { id: true } })
    : []

  // Path 2: checkpoints with direct pericoId reference (column may not exist yet in production)
  let cpDirect: { id: string }[] = []
  try {
    cpDirect = await prisma.checkpoint.findMany({ where: { pericoId }, select: { id: true } })
  } catch {
    // Column pericoId not yet migrated in production DB — skip path 2 gracefully
  }

  const cpIds = [...new Set([...cpFromRota.map((c) => c.id), ...cpDirect.map((c) => c.id)])]
  if (!cpIds.length) return []

  const midias = await prisma.checkpointMidia.findMany({
    where: { checkpointId: { in: cpIds } },
    orderBy: { criadoEm: 'desc' },
  })

  return midias.map((m) => ({
    id: m.id,
    tipo: m.tipo,
    url: m.url,
    texto: m.texto,
    descricao: m.descricao,
    criadoEm: m.criadoEm.toISOString(),
  }))
}

/**
 * Flat list of all media attached to every checkpoint in a rota.
 * Used by the laudo generation flow to pre-populate document content.
 */
export async function getMidiaParaLaudo(
  rotaId: string,
): Promise<{ checkpointTitulo: string; tipo: string; texto: string | null; url: string | null }[]> {
  const checkpoints = await prisma.checkpoint.findMany({
    where: { rotaId },
    orderBy: { ordem: 'asc' },
  })

  const result: { checkpointTitulo: string; tipo: string; texto: string | null; url: string | null }[] =
    []

  for (const cp of checkpoints) {
    const midias = await prisma.checkpointMidia.findMany({
      where: { checkpointId: cp.id },
      orderBy: { criadoEm: 'asc' },
    })
    for (const m of midias) {
      result.push({ checkpointTitulo: cp.titulo, tipo: m.tipo, texto: m.texto, url: m.url })
    }
  }

  return result
}

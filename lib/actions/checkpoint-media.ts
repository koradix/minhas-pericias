'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckpointStatus = 'pendente' | 'chegou' | 'concluido'
export type MidiaTipo = 'foto' | 'audio' | 'texto' | 'documento'

export interface AddMidiaPayload {
  url?: string       // base64 data URI (foto / audio)
  texto?: string     // for tipo=texto
  descricao?: string // optional caption
}

export interface CheckpointMeta {
  rotaId?: string
  ordem?: number
  titulo?: string
  endereco?: string
  pericoId?: string      // pericia mock id — direct link to process
  tribunalSigla?: string // for FORUM/VARA_CIVEL checkpoints
  varaNome?: string      // for FORUM/VARA_CIVEL checkpoints
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Safe ISO conversion — handles cases where @prisma/adapter-libsql returns
 * DATETIME columns as strings instead of Date objects (known libsql quirk).
 */
function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Upsert checkpoint status (chegou | concluido).
 * Creates the Checkpoint row on first call — allows lazy creation from mock ponto IDs.
 */
export async function updateCheckpointStatus(
  checkpointId: string,
  status: CheckpointStatus,
  meta?: CheckpointMeta,
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const chegadaEm = status === 'chegou' ? new Date() : undefined

  // Attempt 1: with new columns (post-migration)
  try {
    await prisma.checkpoint.upsert({
      where: { id: checkpointId },
      update: {
        status,
        ...(chegadaEm && { chegadaEm }),
      },
      create: {
        id: checkpointId,
        rotaId: meta?.rotaId ?? checkpointId,
        ordem: meta?.ordem ?? 1,
        titulo: meta?.titulo ?? 'Checkpoint',
        endereco: meta?.endereco ?? null,
        pericoId: meta?.pericoId ?? null,
        tribunalSigla: meta?.tribunalSigla ?? null,
        varaNome: meta?.varaNome ?? null,
        status,
        ...(chegadaEm && { chegadaEm }),
      },
    })
    if (meta?.pericoId) revalidatePath(`/pericias/${meta.pericoId}`)
    revalidatePath('/rotas/pericias')
    return
  } catch {
    // fall through to attempt 2
  }

  // Attempt 2: without new columns (pre-migration fallback)
  try {
    await prisma.checkpoint.upsert({
      where: { id: checkpointId },
      update: { status, ...(chegadaEm && { chegadaEm }) },
      create: {
        id: checkpointId,
        rotaId: meta?.rotaId ?? checkpointId,
        ordem: meta?.ordem ?? 1,
        titulo: meta?.titulo ?? 'Checkpoint',
        endereco: meta?.endereco ?? null,
        status,
        ...(chegadaEm && { chegadaEm }),
      },
    })
  } catch {
    // If both attempts fail, swallow — don't crash the client
  }

  revalidatePath('/rotas/pericias')
}

/**
 * Attach a media item to a checkpoint.
 * Returns the new row id so the client can optimistically update.
 */
export async function addCheckpointMidia(
  checkpointId: string,
  tipo: MidiaTipo,
  payload: AddMidiaPayload,
): Promise<{ id: string; criadoEm: string }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')

  const midia = await prisma.checkpointMidia.create({
    data: {
      checkpointId,
      tipo,
      url: payload.url ?? null,
      texto: payload.texto ?? null,
      descricao: payload.descricao ?? null,
    },
  })

  // Revalidate the perícia page so photos appear there immediately
  try {
    const cp = await prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      select: { periciaId: true },
    })
    if (cp?.periciaId) revalidatePath(`/pericias/${cp.periciaId}`)
  } catch {}

  revalidatePath('/rotas/pericias')
  return { id: midia.id, criadoEm: toISO(midia.criadoEm) }
}

/** Hard-delete a single media item. */
export async function deleteCheckpointMidia(midiaId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  try {
    const midia = await prisma.checkpointMidia.findUnique({
      where: { id: midiaId },
      select: { checkpointId: true },
    })
    await prisma.checkpointMidia.delete({ where: { id: midiaId } })
    if (midia?.checkpointId) {
      const cp = await prisma.checkpoint.findUnique({
        where: { id: midia.checkpointId },
        select: { periciaId: true },
      })
      if (cp?.periciaId) revalidatePath(`/pericias/${cp.periciaId}`)
    }
  } catch {}
  revalidatePath('/rotas/pericias')
}

/**
 * Fetch all midias for a checkpoint.
 * Called on panel open so existing evidence is always shown.
 */
export async function getCheckpointMidias(checkpointId: string): Promise<
  {
    id: string
    checkpointId: string
    tipo: string
    url: string | null
    texto: string | null
    descricao: string | null
    criadoEm: string
  }[]
> {
  try {
    const rows = await prisma.checkpointMidia.findMany({
      where: { checkpointId },
      orderBy: { criadoEm: 'asc' },
    })
    return rows.map((r) => ({ ...r, criadoEm: toISO(r.criadoEm) }))
  } catch {
    return []
  }
}

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

  await prisma.checkpoint.upsert({
    where: { id: checkpointId },
    update: {
      status,
      ...(chegadaEm && { chegadaEm }),
    },
    create: {
      id: checkpointId,
      rotaId: meta?.rotaId ?? checkpointId, // fallback: use self-id so FK-less insert works
      ordem: meta?.ordem ?? 1,
      titulo: meta?.titulo ?? 'Checkpoint',
      endereco: meta?.endereco ?? null,
      status,
      ...(chegadaEm && { chegadaEm }),
    },
  })

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

  revalidatePath('/rotas/pericias')
  return { id: midia.id, criadoEm: midia.criadoEm.toISOString() }
}

/** Hard-delete a single media item. */
export async function deleteCheckpointMidia(midiaId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.checkpointMidia.delete({ where: { id: midiaId } })
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
  const rows = await prisma.checkpointMidia.findMany({
    where: { checkpointId },
    orderBy: { criadoEm: 'asc' },
  })
  return rows.map((r) => ({ ...r, criadoEm: r.criadoEm.toISOString() }))
}

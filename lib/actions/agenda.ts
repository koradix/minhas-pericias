'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgendaItemRow {
  id: string
  periciaId: string
  titulo: string
  descricao: string | null
  tipo: string
  origem: string
  dataLimite: string | null
  status: string
  prioridade: string
  criadoEm: string
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function getAgendaItems(periciaId: string): Promise<AgendaItemRow[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const items = await prisma.agendaItem.findMany({
    where: { periciaId, peritoId: session.user.id },
    orderBy: [{ status: 'asc' }, { prioridade: 'asc' }, { dataLimite: 'asc' }, { criadoEm: 'desc' }],
  })

  return items.map((i) => ({
    id: i.id,
    periciaId: i.periciaId,
    titulo: i.titulo,
    descricao: i.descricao,
    tipo: i.tipo,
    origem: i.origem,
    dataLimite: i.dataLimite?.toISOString() ?? null,
    status: i.status,
    prioridade: i.prioridade,
    criadoEm: i.criadoEm.toISOString(),
  }))
}

// ─── CREATE (manual) ──────────────────────────────────────────────────────────

export async function criarAgendaItem(
  periciaId: string,
  data: { titulo: string; descricao?: string; tipo?: string; dataLimite?: string; prioridade?: string },
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    await prisma.agendaItem.create({
      data: {
        periciaId,
        peritoId: session.user.id,
        titulo: data.titulo,
        descricao: data.descricao ?? null,
        tipo: data.tipo ?? 'action',
        origem: 'user',
        dataLimite: data.dataLimite ? new Date(data.dataLimite) : null,
        prioridade: data.prioridade ?? 'normal',
      },
    })

    revalidatePath(`/pericias/${periciaId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 120) : 'Erro' }
  }
}

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────

export async function toggleAgendaItem(
  itemId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    const item = await prisma.agendaItem.findUnique({ where: { id: itemId }, select: { status: true, peritoId: true, periciaId: true } })
    if (!item || item.peritoId !== session.user.id) return { ok: false, error: 'Item não encontrado' }

    await prisma.agendaItem.update({
      where: { id: itemId },
      data: { status: item.status === 'pending' ? 'completed' : 'pending' },
    })

    revalidatePath(`/pericias/${item.periciaId}`)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao atualizar' }
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deletarAgendaItem(
  itemId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    const item = await prisma.agendaItem.findUnique({ where: { id: itemId }, select: { peritoId: true, periciaId: true } })
    if (!item || item.peritoId !== session.user.id) return { ok: false, error: 'Item não encontrado' }

    await prisma.agendaItem.delete({ where: { id: itemId } })
    revalidatePath(`/pericias/${item.periciaId}`)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao deletar' }
  }
}

// ─── AUTO-POPULATE (idempotent — uses sourceKey for dedup) ────────────────────

export async function autoPopulateAgenda(
  periciaId: string,
  context: {
    hasAnalise: boolean
    hasProposta: boolean
    hasVistoria: boolean
    hasMidias: boolean
    periciaStatus: string
  },
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const peritoId = session.user.id
  const items: { titulo: string; tipo: string; prioridade: string; sourceKey: string }[] = []

  if (!context.hasAnalise) {
    items.push({ titulo: 'Fazer upload do documento de nomeação', tipo: 'action', prioridade: 'alta', sourceKey: 'sys_upload_nomeacao' })
  }
  if (!context.hasProposta && context.hasAnalise) {
    items.push({ titulo: 'Gerar proposta de honorários', tipo: 'action', prioridade: 'alta', sourceKey: 'sys_gerar_proposta' })
  }
  if (!context.hasVistoria) {
    items.push({ titulo: 'Agendar vistoria', tipo: 'action', prioridade: 'normal', sourceKey: 'sys_agendar_vistoria' })
  }
  if (!context.hasMidias && context.hasVistoria) {
    items.push({ titulo: 'Registrar evidências da vistoria', tipo: 'action', prioridade: 'normal', sourceKey: 'sys_registrar_midias' })
  }
  if (context.periciaStatus !== 'concluida' && context.hasMidias) {
    items.push({ titulo: 'Elaborar laudo pericial', tipo: 'action', prioridade: 'normal', sourceKey: 'sys_elaborar_laudo' })
  }

  for (const item of items) {
    await prisma.agendaItem.upsert({
      where: { periciaId_sourceKey: { periciaId, sourceKey: item.sourceKey } },
      create: { periciaId, peritoId, titulo: item.titulo, tipo: item.tipo, prioridade: item.prioridade, origem: 'system', sourceKey: item.sourceKey },
      update: {}, // no-op if exists
    }).catch(() => {}) // ignore duplicates
  }

  // Remove items that are no longer relevant (step was completed)
  if (context.hasAnalise) {
    await prisma.agendaItem.deleteMany({ where: { periciaId, sourceKey: 'sys_upload_nomeacao', status: 'pending' } }).catch(() => {})
  }
  if (context.hasProposta) {
    await prisma.agendaItem.deleteMany({ where: { periciaId, sourceKey: 'sys_gerar_proposta', status: 'pending' } }).catch(() => {})
  }
  if (context.hasVistoria) {
    await prisma.agendaItem.deleteMany({ where: { periciaId, sourceKey: 'sys_agendar_vistoria', status: 'pending' } }).catch(() => {})
  }
  if (context.hasMidias) {
    await prisma.agendaItem.deleteMany({ where: { periciaId, sourceKey: 'sys_registrar_midias', status: 'pending' } }).catch(() => {})
  }
}

// ─── AI DEADLINE EXTRACTION (called after document analysis) ──────────────────

export async function addAiAgendaItems(
  periciaId: string,
  peritoId: string,
  items: { titulo: string; descricao?: string; dataLimite?: string; tipo: string; confianca: number }[],
): Promise<void> {
  for (const item of items) {
    if (item.confianca < 0.5) continue // skip low-confidence items

    const sourceKey = `ai_${item.titulo.slice(0, 50).replace(/\s+/g, '_').toLowerCase()}`

    await prisma.agendaItem.upsert({
      where: { periciaId_sourceKey: { periciaId, sourceKey } },
      create: {
        periciaId,
        peritoId,
        titulo: item.titulo,
        descricao: item.descricao ?? null,
        tipo: item.tipo,
        origem: 'ai',
        dataLimite: item.dataLimite ? new Date(item.dataLimite) : null,
        prioridade: item.dataLimite ? 'alta' : 'normal',
        confianca: item.confianca,
        sourceKey,
      },
      update: {},
    }).catch(() => {})
  }
}

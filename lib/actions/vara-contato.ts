'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// ─── Helper ───────────────────────────────────────────────────────────────────

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaraContatoData {
  telefone?: string
  email?: string
  juizNome?: string
  secretarioNome?: string
  secretarioLinkedin?: string
  observacoes?: string
}

export interface VaraContatoRow extends VaraContatoData {
  id: string
  peritoId: string
  tribunalSigla: string
  varaNome: string
  updatedAt: string
  criadoEm: string
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getVaraContato(
  tribunalSigla: string,
  varaNome: string,
): Promise<VaraContatoRow | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  try {
    const row = await prisma.varaContato.findUnique({
      where: { peritoId_tribunalSigla_varaNome: { peritoId: session.user.id, tribunalSigla, varaNome } },
    })
    if (!row) return null

    return {
      id: row.id,
      peritoId: row.peritoId,
      tribunalSigla: row.tribunalSigla,
      varaNome: row.varaNome,
      telefone: row.telefone ?? undefined,
      email: row.email ?? undefined,
      juizNome: row.juizNome ?? undefined,
      secretarioNome: row.secretarioNome ?? undefined,
      secretarioLinkedin: row.secretarioLinkedin ?? undefined,
      observacoes: row.observacoes ?? undefined,
      updatedAt: toISO(row.updatedAt),
      criadoEm: toISO(row.criadoEm),
    }
  } catch {
    return null
  }
}

export async function upsertVaraContato(
  tribunalSigla: string,
  varaNome: string,
  data: VaraContatoData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const peritoId = session.user.id

  try {
    const row = await prisma.varaContato.upsert({
      where: { peritoId_tribunalSigla_varaNome: { peritoId, tribunalSigla, varaNome } },
      update: {
        telefone: data.telefone ?? null,
        email: data.email ?? null,
        juizNome: data.juizNome ?? null,
        secretarioNome: data.secretarioNome ?? null,
        secretarioLinkedin: data.secretarioLinkedin ?? null,
        observacoes: data.observacoes ?? null,
      },
      create: {
        peritoId,
        tribunalSigla,
        varaNome,
        telefone: data.telefone ?? null,
        email: data.email ?? null,
        juizNome: data.juizNome ?? null,
        secretarioNome: data.secretarioNome ?? null,
        secretarioLinkedin: data.secretarioLinkedin ?? null,
        observacoes: data.observacoes ?? null,
      },
    })
    return { ok: true, id: row.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao salvar contato' }
  }
}

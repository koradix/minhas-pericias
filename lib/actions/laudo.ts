'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LaudoSecao {
  titulo: string
  conteudo: string
}

export interface LaudoTemplateRow {
  id: string
  categoria: string
  nome: string
  secoes: LaudoSecao[]
  isDefault: boolean
}

export interface LaudoDraftRow {
  id: string
  periciaId: string
  templateId: string | null
  categoria: string
  secoes: LaudoSecao[]
  status: string
  versao: number
  iaModel: string
  criadoEm: string
}

function tryParse<T>(v: string, fallback: T): T {
  try { return JSON.parse(v) as T } catch { return fallback }
}

// ─── GET Templates ────────────────────────────────────────────────────────────

export async function getLaudoTemplates(): Promise<LaudoTemplateRow[]> {
  const session = await auth()
  const userId = session?.user?.id

  const templates = await prisma.laudoTemplate.findMany({
    where: {
      ativo: true,
      OR: [
        { userId: null }, // default PeriLaB templates
        ...(userId ? [{ userId }] : []),
      ],
    },
    orderBy: [{ userId: 'asc' }, { categoria: 'asc' }, { nome: 'asc' }],
  })

  return templates.map((t) => ({
    id: t.id,
    categoria: t.categoria,
    nome: t.nome,
    secoes: tryParse<LaudoSecao[]>(t.secoes, []),
    isDefault: t.userId === null,
  }))
}

// ─── GET Draft ────────────────────────────────────────────────────────────────

export async function getLaudoDraft(periciaId: string): Promise<LaudoDraftRow | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const draft = await prisma.laudoDraft.findUnique({
    where: { periciaId_userId: { periciaId, userId: session.user.id } },
  })

  if (!draft) return null

  return {
    id: draft.id,
    periciaId: draft.periciaId,
    templateId: draft.templateId,
    categoria: draft.categoria,
    secoes: tryParse<LaudoSecao[]>(draft.secoes, []),
    status: draft.status,
    versao: draft.versao,
    iaModel: draft.iaModel,
    criadoEm: draft.criadoEm.toISOString(),
  }
}

// ─── UPSERT Draft ─────────────────────────────────────────────────────────────

export async function salvarLaudoDraft(
  periciaId: string,
  data: {
    templateId?: string | null
    categoria?: string
    secoes: LaudoSecao[]
    status?: string
    iaModel?: string
    iaRawOutput?: string
  },
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    const existing = await prisma.laudoDraft.findUnique({
      where: { periciaId_userId: { periciaId, userId: session.user.id } },
      select: { id: true, versao: true },
    })

    const secoesJson = JSON.stringify(data.secoes)

    if (existing) {
      await prisma.laudoDraft.update({
        where: { id: existing.id },
        data: {
          secoes: secoesJson,
          status: data.status ?? 'rascunho',
          templateId: data.templateId ?? undefined,
          categoria: data.categoria ?? undefined,
          iaModel: data.iaModel ?? undefined,
          iaRawOutput: data.iaRawOutput ?? undefined,
          versao: data.iaModel ? existing.versao + 1 : existing.versao,
        },
      })
    } else {
      await prisma.laudoDraft.create({
        data: {
          periciaId,
          userId: session.user.id,
          templateId: data.templateId ?? null,
          categoria: data.categoria ?? '',
          secoes: secoesJson,
          status: data.status ?? 'rascunho',
          iaModel: data.iaModel ?? '',
          iaRawOutput: data.iaRawOutput ?? '',
        },
      })
    }

    revalidatePath(`/pericias/${periciaId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 120) : 'Erro' }
  }
}

// ─── Create custom template ───────────────────────────────────────────────────

export async function criarLaudoTemplate(
  data: { categoria: string; nome: string; secoes: LaudoSecao[] },
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    const t = await prisma.laudoTemplate.create({
      data: {
        userId: session.user.id,
        categoria: data.categoria,
        nome: data.nome,
        secoes: JSON.stringify(data.secoes),
      },
    })
    return { ok: true, id: t.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 120) : 'Erro' }
  }
}

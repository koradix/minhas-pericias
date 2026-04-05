'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ProposalTemplateRow {
  id:           string
  nome:         string
  descricao:    string | null
  nomeArquivo:  string
  tamanhoBytes: number
  tagsDetected: string[]
  ativo:        boolean
  criadoEm:    string
}

// ─── GET ────────────────────────────────────────────────────────────────────────

export async function getProposalTemplates(userId: string): Promise<ProposalTemplateRow[]> {
  try {
    const rows = await prisma.proposalTemplate.findMany({
      where:   { userId, ativo: true },
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true, nome: true, descricao: true,
        nomeArquivo: true, tamanhoBytes: true,
        tagsDetected: true, ativo: true, criadoEm: true,
      },
    })
    return rows.map((r) => ({
      ...r,
      tagsDetected: (() => { try { return JSON.parse(r.tagsDetected) as string[] } catch { return [] } })(),
      criadoEm: r.criadoEm.toISOString(),
    }))
  } catch { return [] }
}

// ─── SAVE ────────────────────────────────────────────────────────────────────────

export type SaveTemplateResult =
  | { ok: true; templateId: string; tagsDetected: string[] }
  | { ok: false; error: string }

export async function saveProposalTemplate(params: {
  blobUrl:      string
  nomeArquivo:  string
  tamanhoBytes: number
  nome:         string
  descricao?:   string
  tagsDetected: string[]
}): Promise<SaveTemplateResult> {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  if (params.tamanhoBytes > 5 * 1024 * 1024) {
    return { ok: false, error: 'Template muito grande (máx. 5 MB)' }
  }

  try {
    const row = await prisma.proposalTemplate.create({
      data: {
        userId,
        nome:         params.nome,
        descricao:    params.descricao ?? null,
        blobUrl:      params.blobUrl,
        nomeArquivo:  params.nomeArquivo,
        tamanhoBytes: params.tamanhoBytes,
        tagsDetected: JSON.stringify(params.tagsDetected),
      },
      select: { id: true },
    })
    return { ok: true, templateId: row.id, tagsDetected: params.tagsDetected }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao salvar template' }
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────────

export async function deleteProposalTemplate(
  templateId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    const row = await prisma.proposalTemplate.findUnique({
      where:  { id: templateId },
      select: { userId: true, blobUrl: true },
    })
    if (!row || row.userId !== userId) return { ok: false, error: 'Template não encontrado' }

    // Soft delete + cleanup blob
    await prisma.proposalTemplate.update({
      where: { id: templateId },
      data:  { ativo: false },
    })
    del(row.blobUrl).catch(() => {})

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao excluir template' }
  }
}

// ─── GET BLOB URL (server only — never expose to client) ──────────────────────

export async function getTemplateBlobUrl(
  templateId: string,
  userId: string,
): Promise<string | null> {
  try {
    const row = await prisma.proposalTemplate.findUnique({
      where:  { id: templateId },
      select: { blobUrl: true, userId: true },
    })
    if (!row || row.userId !== userId) return null
    return row.blobUrl
  } catch { return null }
}

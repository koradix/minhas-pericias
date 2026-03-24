import { prisma } from '@/lib/prisma'
import type { TemplateFilters, TemplateMetadata, TemplateComVersoes } from '@/lib/types/templates'

// ─── Mapper ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTemplate(row: any): TemplateMetadata {
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo,
    descricao: row.descricao ?? null,
    area: row.area ?? null,
    especialidade: row.especialidade ?? null,
    subEspecialidade: row.subEspecialidade ?? null,
    uploadedById: row.uploadedById ?? null,
    uploadedByNome: row.uploadedBy?.name ?? null,
    versao: row.versao ?? 1,
    versaoPaiId: row.versaoPaiId ?? null,
    isActive: row.isActive ?? true,
    preferido: row.preferido ?? false,
    status: row.status ?? 'ativo',
    nomeArquivo: row.nomeArquivo ?? null,
    caminhoArq: row.caminhoArq ?? null,
    mimeType: row.mimeType ?? null,
    tamanhoBytes: row.tamanhoBytes ?? null,
    textoExtraido: row.textoExtraido ?? null,
    tokenCount: row.tokenCount ?? null,
    processadoEm: row.processadoEm ?? null,
    totalUsos: row.totalUsos ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

const SELECT_FIELDS = {
  id: true,
  nome: true,
  tipo: true,
  descricao: true,
  area: true,
  especialidade: true,
  subEspecialidade: true,
  uploadedById: true,
  uploadedBy: { select: { name: true } },
  versao: true,
  versaoPaiId: true,
  isActive: true,
  preferido: true,
  status: true,
  nomeArquivo: true,
  caminhoArq: true,
  mimeType: true,
  tamanhoBytes: true,
  textoExtraido: true,
  tokenCount: true,
  processadoEm: true,
  totalUsos: true,
  createdAt: true,
  updatedAt: true,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getTemplates(filters: TemplateFilters = {}): Promise<TemplateMetadata[]> {
  const where: Record<string, unknown> = {}
  if (filters.tipo) where.tipo = filters.tipo
  if (filters.especialidade) where.especialidade = filters.especialidade
  if (filters.isActive !== undefined) where.isActive = filters.isActive
  if (filters.uploadedById) where.uploadedById = filters.uploadedById

  const rows = await prisma.modeloBase.findMany({
    where,
    select: SELECT_FIELDS,
    orderBy: [{ tipo: 'asc' }, { versao: 'desc' }, { createdAt: 'desc' }],
  })

  return rows.map(toTemplate)
}

export async function getTemplateById(id: string): Promise<TemplateMetadata | null> {
  const row = await prisma.modeloBase.findUnique({
    where: { id },
    select: SELECT_FIELDS,
  })
  if (!row) return null
  return toTemplate(row)
}

/** Returns the template with its full version chain (siblings). */
export async function getTemplateComVersoes(id: string): Promise<TemplateComVersoes | null> {
  const template = await getTemplateById(id)
  if (!template) return null

  // Root ID is versaoPaiId if set, otherwise the template itself is the root
  const rootId = template.versaoPaiId ?? template.id

  const versoes = await prisma.modeloBase.findMany({
    where: {
      OR: [
        { id: rootId },
        { versaoPaiId: rootId },
      ],
    },
    select: SELECT_FIELDS,
    orderBy: { versao: 'asc' },
  })

  return {
    ...template,
    versoes: versoes.map(toTemplate).filter((v) => v.id !== template.id),
  }
}

/** Returns all root templates (versaoPaiId IS NULL) per tipo, including version count. */
export async function getTemplateRoots(
  filters: TemplateFilters = {},
): Promise<(TemplateMetadata & { totalVersoes: number })[]> {
  const where: Record<string, unknown> = { versaoPaiId: null }
  if (filters.tipo) where.tipo = filters.tipo
  if (filters.especialidade) where.especialidade = filters.especialidade
  if (filters.isActive !== undefined) where.isActive = filters.isActive
  if (filters.uploadedById) where.uploadedById = filters.uploadedById

  const rows = await prisma.modeloBase.findMany({
    where,
    select: {
      ...SELECT_FIELDS,
      versoes: { select: { id: true } },
    },
    orderBy: [{ tipo: 'asc' }, { createdAt: 'desc' }],
  })

  return rows.map((row) => ({
    ...toTemplate(row),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    totalVersoes: 1 + ((row as any).versoes?.length ?? 0),
  }))
}

/** Returns the preferred (or latest active) template for a given tipo. */
export async function getTemplatePreferido(tipo: string): Promise<TemplateMetadata | null> {
  // 1. Try preferred
  const preferred = await prisma.modeloBase.findFirst({
    where: { tipo, preferido: true, isActive: true },
    select: SELECT_FIELDS,
    orderBy: { versao: 'desc' },
  })
  if (preferred) return toTemplate(preferred)

  // 2. Fall back to latest active
  const latest = await prisma.modeloBase.findFirst({
    where: { tipo, isActive: true },
    select: SELECT_FIELDS,
    orderBy: { versao: 'desc' },
  })
  return latest ? toTemplate(latest) : null
}

/** Returns all templates with extracted text — for AI ingestion pipelines. */
export async function getTemplatesWithExtractedText(tipo?: string): Promise<TemplateMetadata[]> {
  const rows = await prisma.modeloBase.findMany({
    where: {
      textoExtraido: { not: null },
      isActive: true,
      ...(tipo ? { tipo } : {}),
    },
    select: SELECT_FIELDS,
    orderBy: { versao: 'desc' },
  })
  return rows.map(toTemplate)
}

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { templateStorage } from '@/lib/services/template-storage'
import { processTemplateExtraction } from '@/lib/services/template-extractor'
import type { CreateTemplateInput, UpdateTemplateInput } from '@/lib/types/templates'

// ─── Result types ─────────────────────────────────────────────────────────────

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ─── Upload new template ──────────────────────────────────────────────────────

export async function uploadTemplate(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const nome = (formData.get('nome') as string | null)?.trim() ?? ''
  const tipo = (formData.get('tipo') as string | null)?.trim() ?? ''
  const descricao = (formData.get('descricao') as string | null)?.trim() || null
  const area = (formData.get('area') as string | null)?.trim() || null
  const especialidade = (formData.get('especialidade') as string | null)?.trim() || null
  const subEspecialidade = (formData.get('subEspecialidade') as string | null)?.trim() || null
  const versaoPaiId = (formData.get('versaoPaiId') as string | null)?.trim() || null
  const arquivo = formData.get('arquivo') as File | null

  if (!nome) return { ok: false, error: 'Nome é obrigatório' }
  if (!tipo) return { ok: false, error: 'Tipo é obrigatório' }

  // Determine version number
  let versao = 1
  if (versaoPaiId) {
    const latestVersion = await prisma.modeloBase.findFirst({
      where: { OR: [{ id: versaoPaiId }, { versaoPaiId }] },
      orderBy: { versao: 'desc' },
      select: { versao: true },
    })
    versao = (latestVersion?.versao ?? 0) + 1
  }

  // Store file if provided
  let nomeArquivo: string | null = null
  let caminhoArq: string | null = null
  let mimeType: string | null = null
  let tamanhoBytes: number | null = null

  if (arquivo && arquivo.size > 0) {
    try {
      const uploaded = await templateStorage.save(arquivo)
      nomeArquivo = uploaded.originalName
      caminhoArq = uploaded.storagePath
      mimeType = uploaded.mimeType
      tamanhoBytes = uploaded.tamanhoBytes
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Erro ao salvar arquivo' }
    }
  }

  const template = await prisma.modeloBase.create({
    data: {
      nome,
      tipo,
      descricao,
      area,
      especialidade,
      subEspecialidade,
      uploadedById: session.user.id,
      versao,
      versaoPaiId,
      isActive: true,
      preferido: false,
      nomeArquivo,
      caminhoArq,
      mimeType,
      tamanhoBytes,
    },
    select: { id: true },
  })

  // Trigger async extraction (non-blocking — best-effort)
  if (caminhoArq) {
    processTemplateExtraction(template.id, caminhoArq, mimeType).catch(() => {
      // Extraction failure is logged silently — it can be retried later
    })
  }

  revalidatePath('/documentos/templates')
  revalidatePath('/documentos/modelos')

  return { ok: true, data: { id: template.id } }
}

// ─── Update template metadata ─────────────────────────────────────────────────

export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput,
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  await prisma.modeloBase.update({
    where: { id },
    data: {
      ...(input.nome !== undefined && { nome: input.nome }),
      ...(input.descricao !== undefined && { descricao: input.descricao }),
      ...(input.especialidade !== undefined && { especialidade: input.especialidade }),
      ...(input.subEspecialidade !== undefined && { subEspecialidade: input.subEspecialidade }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.preferido !== undefined && { preferido: input.preferido }),
    },
  })

  revalidatePath('/documentos/templates')
  revalidatePath('/documentos/modelos')
  return { ok: true, data: undefined }
}

// ─── Activate / deactivate ────────────────────────────────────────────────────

export async function ativarTemplate(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  await prisma.modeloBase.update({
    where: { id },
    data: { isActive: true },
  })
  revalidatePath('/documentos/templates')
  return { ok: true, data: undefined }
}

export async function desativarTemplate(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  await prisma.modeloBase.update({
    where: { id },
    data: { isActive: false, preferido: false },
  })
  revalidatePath('/documentos/templates')
  return { ok: true, data: undefined }
}

// ─── Set preferred template ───────────────────────────────────────────────────

/**
 * Marks a template as preferred for its tipo+especialidade combination.
 * Clears preferido=true from all other templates with the same tipo.
 */
export async function definirPreferido(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const template = await prisma.modeloBase.findUnique({
    where: { id },
    select: { tipo: true, especialidade: true },
  })
  if (!template) return { ok: false, error: 'Template não encontrado' }

  // Clear existing preferred for same tipo
  await prisma.modeloBase.updateMany({
    where: { tipo: template.tipo, preferido: true },
    data: { preferido: false },
  })

  // Set new preferred
  await prisma.modeloBase.update({
    where: { id },
    data: { preferido: true, isActive: true },
  })

  revalidatePath('/documentos/templates')
  return { ok: true, data: undefined }
}

// ─── Create new version ───────────────────────────────────────────────────────

/**
 * Creates a new version of an existing template, optionally with a new file.
 * The original template is deactivated; the new version becomes active.
 */
export async function criarNovaVersao(
  rootId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const root = await prisma.modeloBase.findUnique({
    where: { id: rootId },
    select: { nome: true, tipo: true, area: true, especialidade: true, subEspecialidade: true, versao: true, preferido: true },
  })
  if (!root) return { ok: false, error: 'Template não encontrado' }

  // Inherit metadata from root, allow overrides
  const patchedFormData = new FormData()
  patchedFormData.set('nome', (formData.get('nome') as string | null) ?? root.nome)
  patchedFormData.set('tipo', root.tipo)
  patchedFormData.set('area', (formData.get('area') as string | null) ?? root.area ?? '')
  patchedFormData.set('especialidade', (formData.get('especialidade') as string | null) ?? root.especialidade ?? '')
  patchedFormData.set('subEspecialidade', (formData.get('subEspecialidade') as string | null) ?? root.subEspecialidade ?? '')
  patchedFormData.set('descricao', (formData.get('descricao') as string | null) ?? '')
  patchedFormData.set('versaoPaiId', rootId)
  const arquivo = formData.get('arquivo') as File | null
  if (arquivo) patchedFormData.set('arquivo', arquivo)

  // Deactivate previous versions
  await prisma.modeloBase.updateMany({
    where: { OR: [{ id: rootId }, { versaoPaiId: rootId }] },
    data: { isActive: false, preferido: false },
  })

  const result = await uploadTemplate(patchedFormData)
  if (!result.ok) return result

  // If root was preferred, transfer preference to new version
  if (root.preferido) {
    await prisma.modeloBase.update({
      where: { id: result.data.id },
      data: { preferido: true },
    })
  }

  return result
}

// ─── Delete template ──────────────────────────────────────────────────────────

export async function deleteTemplate(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const template = await prisma.modeloBase.findUnique({
    where: { id },
    select: { caminhoArq: true, versoes: { select: { id: true } } },
  })
  if (!template) return { ok: false, error: 'Template não encontrado' }

  // Block deletion if there are child versions
  if (template.versoes.length > 0) {
    return { ok: false, error: 'Não é possível excluir um template com versões filhas. Desative-o ou exclua as versões primeiro.' }
  }

  // Remove file from storage
  if (template.caminhoArq) {
    await templateStorage.remove(template.caminhoArq).catch(() => {})
  }

  await prisma.modeloBase.delete({ where: { id } })

  revalidatePath('/documentos/templates')
  revalidatePath('/documentos/modelos')
  return { ok: true, data: undefined }
}

// ─── Re-trigger extraction ────────────────────────────────────────────────────

export async function reprocessarExtracao(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const template = await prisma.modeloBase.findUnique({
    where: { id },
    select: { caminhoArq: true, mimeType: true },
  })
  if (!template?.caminhoArq) return { ok: false, error: 'Nenhum arquivo associado a este template' }

  const result = await processTemplateExtraction(id, template.caminhoArq, template.mimeType)
  revalidatePath('/documentos/templates')

  if (result.status === 'failed') return { ok: false, error: result.erro ?? 'Erro na extração' }
  return { ok: true, data: undefined }
}

// ─── Legacy bridge ────────────────────────────────────────────────────────────

/**
 * Re-exported for callers that still use the old criarModelo pattern.
 * Adds auth + new fields while keeping the same FormData interface.
 */
export async function criarModeloLegacy(
  _prevState: { errors?: Record<string, string[]>; message?: string },
  formData: FormData,
) {
  const result = await uploadTemplate(formData)
  if (!result.ok) return { errors: { _: [result.error] } }
  return { message: 'Modelo criado com sucesso' }
}

export type { CreateTemplateInput, UpdateTemplateInput }

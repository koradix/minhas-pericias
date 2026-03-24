'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { VARAS_CATALOG } from '@/lib/data/varas-catalog'
import type { AreaPrincipalId } from '@/lib/constants/pericias'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PerfilProfissionalData {
  areaPrincipal: AreaPrincipalId
  areasSecundarias: AreaPrincipalId[]
  especialidades2: string[]
  keywords: string[]
  formacao?: string
  formacaoCustom?: string  // free-text when formacao = "Outra formação"
  registro?: string
}

// ─── Action 1 — Atualizar taxonomia do perfil ─────────────────────────────────

export async function updatePerfilProfissional(
  data: PerfilProfissionalData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const userId = session.user.id

  try {
    await prisma.peritoPerfil.upsert({
      where: { userId },
      create: {
        userId,
        areaPrincipal: data.areaPrincipal,
        areasSecundarias: JSON.stringify(data.areasSecundarias),
        especialidades2: JSON.stringify(data.especialidades2),
        keywords: JSON.stringify(data.keywords),
        ...(data.formacao ? { formacao: data.formacao } : {}),
        ...(data.formacaoCustom ? { formacaoCustom: data.formacaoCustom } : {}),
        ...(data.registro ? { registro: data.registro } : {}),
        perfilCompleto: true,
      },
      update: {
        areaPrincipal: data.areaPrincipal,
        areasSecundarias: JSON.stringify(data.areasSecundarias),
        especialidades2: JSON.stringify(data.especialidades2),
        keywords: JSON.stringify(data.keywords),
        ...(data.formacao ? { formacao: data.formacao } : {}),
        ...(data.formacaoCustom ? { formacaoCustom: data.formacaoCustom } : {}),
        ...(data.registro ? { registro: data.registro } : {}),
        perfilCompleto: true,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/perfil')
    return { ok: true }
  } catch (e) {
    console.error('[updatePerfilProfissional]', e)
    return { ok: false, error: 'Erro ao salvar perfil' }
  }
}

// ─── Shared helper: upsert catalog varas for given tribunal siglas ─────────────

async function upsertCatalogVaras(
  userId: string,
  siglas: string[],
): Promise<number> {
  const siglaSet = new Set(siglas.map((s) => s.toUpperCase()))
  const varasDosCatalogo = VARAS_CATALOG.filter((v) => siglaSet.has(v.tribunal.toUpperCase()))

  let count = 0
  for (const v of varasDosCatalogo) {
    try {
      await prisma.tribunalVara.upsert({
        where: {
          peritoId_tribunalSigla_varaNome: {
            peritoId: userId,
            tribunalSigla: v.tribunal,
            varaNome: v.nome,
          },
        },
        create: {
          peritoId: userId,
          tribunalSigla: v.tribunal,
          tribunalNome: v.tribunal,
          varaNome: v.nome,
          varaId: v.id,
          uf: v.uf,
          enderecoTexto: `${v.endereco} — ${v.cidade}`,
          latitude: v.latitude,
          longitude: v.longitude,
        },
        update: {
          varaId: v.id,
          uf: v.uf,
          enderecoTexto: `${v.endereco} — ${v.cidade}`,
          latitude: v.latitude,
          longitude: v.longitude,
          ativa: true,
        },
      })
      count++
    } catch {
      // Ignore individual upsert errors
    }
  }
  return count
}

// ─── Action 2 — Sincronizar varas (from local catalog) ───────────────────────

export async function syncTribunaisReais(): Promise<
  { ok: true; varasSalvas: number } | { ok: false; error: string }
> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const userId = session.user.id

  const perfil = await prisma.peritoPerfil.findUnique({
    where: { userId },
    select: { tribunais: true },
  })
  if (!perfil) return { ok: false, error: 'Perfil não encontrado' }

  const siglas: string[] = JSON.parse(perfil.tribunais ?? '[]')
  if (siglas.length === 0) return { ok: true, varasSalvas: 0 }

  try {
    const varasSalvas = await upsertCatalogVaras(userId, siglas)

    await prisma.peritoPerfil.update({
      where: { userId },
      data: { sincronizadoEm: new Date() },
    })

    revalidatePath('/rotas/prospeccao')
    return { ok: true, varasSalvas }
  } catch (e) {
    console.error('[syncTribunaisReais]', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Erro na sincronização' }
  }
}

// ─── Action 3 — Sincronizar varas no signup (after signIn, takes siglas param) ─

export async function syncVarasFromSignup(
  siglas: string[],
): Promise<{ ok: true; varasCount: number; tribunaisCount: number } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const userId = session.user.id
  if (siglas.length === 0) return { ok: true, varasCount: 0, tribunaisCount: 0 }

  try {
    const siglaSet = new Set(siglas.map((s) => s.toUpperCase()))
    const varasDosCatalogo = VARAS_CATALOG.filter((v) => siglaSet.has(v.tribunal.toUpperCase()))
    const tribunaisVistos = new Set<string>()
    let varasCount = 0

    for (const v of varasDosCatalogo) {
      try {
        await prisma.tribunalVara.upsert({
          where: {
            peritoId_tribunalSigla_varaNome: {
              peritoId: userId,
              tribunalSigla: v.tribunal,
              varaNome: v.nome,
            },
          },
          create: {
            peritoId: userId,
            tribunalSigla: v.tribunal,
            tribunalNome: v.tribunal,
            varaNome: v.nome,
            varaId: v.id,
            uf: v.uf,
            enderecoTexto: `${v.endereco} — ${v.cidade}`,
            latitude: v.latitude,
            longitude: v.longitude,
          },
          update: {
            varaId: v.id,
            uf: v.uf,
            enderecoTexto: `${v.endereco} — ${v.cidade}`,
            latitude: v.latitude,
            longitude: v.longitude,
            ativa: true,
          },
        })

        // Platform-wide stats
        await prisma.varaStats.upsert({
          where: { tribunalSigla_varaNome: { tribunalSigla: v.tribunal, varaNome: v.nome } },
          create: { tribunalSigla: v.tribunal, varaNome: v.nome, totalPeritosSugeridos: 1 },
          update: { totalPeritosSugeridos: { increment: 1 } },
        })

        varasCount++
        tribunaisVistos.add(v.tribunal)
      } catch {
        // Ignore individual upsert errors
      }
    }

    await prisma.peritoPerfil.update({
      where: { userId },
      data: { sincronizadoEm: new Date() },
    })

    return { ok: true, varasCount, tribunaisCount: tribunaisVistos.size }
  } catch (e) {
    console.error('[syncVarasFromSignup]', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Erro na sincronização' }
  }
}

// ─── Action 3b — Salvar tribunais e estados ───────────────────────────────────

export async function saveTribunaisEstados(
  siglas: string[],
  estados: string[],
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }
  const userId = session.user.id

  try {
    await prisma.peritoPerfil.upsert({
      where: { userId },
      create: { userId, tribunais: JSON.stringify(siglas), estados: JSON.stringify(estados) },
      update: { tribunais: JSON.stringify(siglas), estados: JSON.stringify(estados) },
    })
    revalidatePath('/nomeacoes')
    revalidatePath('/configuracoes')
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
  }
}

// ─── Action 4 — Preview vara count (instant, from local catalog) ──────────────

export async function previewVarasCount(
  siglas: string[],
): Promise<{ varas: number; tribunais: number }> {
  if (siglas.length === 0) return { varas: 0, tribunais: 0 }
  const siglaSet = new Set(siglas.map((s) => s.toUpperCase()))
  const varas = VARAS_CATALOG.filter((v) => siglaSet.has(v.tribunal.toUpperCase()))
  const tribunais = new Set(varas.map((v) => v.tribunal)).size
  return { varas: varas.length, tribunais }
}

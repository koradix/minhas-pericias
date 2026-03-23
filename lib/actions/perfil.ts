'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { radar } from '@/lib/services/radar'
import { EscavadorService } from '@/lib/services/escavador'
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

// ─── Action 2 — Sincronizar varas reais dos tribunais (FREE) ──────────────────

export async function syncTribunaisReais(): Promise<
  { ok: true; varasSalvas: number } | { ok: false; error: string }
> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const userId = session.user.id

  // 1. Get perito's tribunais
  const perfil = await prisma.peritoPerfil.findUnique({
    where: { userId },
    select: { tribunais: true, estados: true },
  })
  if (!perfil) return { ok: false, error: 'Perfil não encontrado' }

  const siglas: string[] = JSON.parse(perfil.tribunais ?? '[]')
  if (siglas.length === 0) return { ok: true, varasSalvas: 0 }

  // 2. Call Escavador FREE endpoint to get origens (diários list)
  let varasSalvas = 0
  try {
    const escavador = radar as unknown as EscavadorService
    const origens = await escavador.getTribunalOrigens()

    // Build map: sigla → { nome, diarios }
    const siglaSet = new Set(siglas.map((s) => s.toUpperCase()))

    for (const origem of origens) {
      for (const diario of origem.diarios) {
        const siglaUp = diario.sigla.toUpperCase()
        if (!siglaSet.has(siglaUp)) continue

        // Each diario is effectively a vara/source for this tribunal
        try {
          await prisma.tribunalVara.upsert({
            where: {
              peritoId_tribunalSigla_varaNome: {
                peritoId: userId,
                tribunalSigla: diario.sigla,
                varaNome: diario.nome,
              },
            },
            create: {
              peritoId: userId,
              tribunalSigla: diario.sigla,
              tribunalNome: origem.nome,
              varaNome: diario.nome,
              varaId: String(diario.id),
              uf: diario.estado ?? null,
            },
            update: {
              tribunalNome: origem.nome,
              varaId: String(diario.id),
              uf: diario.estado ?? null,
              ativa: true,
            },
          })
          varasSalvas++
        } catch {
          // Ignore individual upsert errors (e.g. duplicate edge cases)
        }
      }
    }

    // Update sincronizadoEm
    await prisma.peritoPerfil.update({
      where: { userId },
      data: { sincronizadoEm: new Date() },
    })

    return { ok: true, varasSalvas }
  } catch (e) {
    console.error('[syncTribunaisReais]', e)
    const msg = e instanceof Error ? e.message : 'Erro na sincronização'
    return { ok: false, error: msg }
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
    const escavador = radar as unknown as EscavadorService
    const varas = await escavador.getVarasByTribunais(siglas)

    let varasCount = 0
    const tribunaisVistos = new Set<string>()

    for (const v of varas) {
      try {
        await prisma.tribunalVara.upsert({
          where: {
            peritoId_tribunalSigla_varaNome: {
              peritoId: userId,
              tribunalSigla: v.tribunalSigla,
              varaNome: v.varaNome,
            },
          },
          create: {
            peritoId: userId,
            tribunalSigla: v.tribunalSigla,
            tribunalNome: v.tribunalNome,
            varaNome: v.varaNome,
            varaId: v.varaId,
            uf: v.uf,
          },
          update: {
            tribunalNome: v.tribunalNome,
            varaId: v.varaId,
            uf: v.uf,
            ativa: true,
          },
        })

        // Platform-wide stats — track how many peritos monitor each vara
        await prisma.varaStats.upsert({
          where: { tribunalSigla_varaNome: { tribunalSigla: v.tribunalSigla, varaNome: v.varaNome } },
          create: { tribunalSigla: v.tribunalSigla, varaNome: v.varaNome, totalPeritosSugeridos: 1 },
          update: { totalPeritosSugeridos: { increment: 1 } },
        })

        varasCount++
        tribunaisVistos.add(v.tribunalSigla)
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

// ─── Action 4 — Preview vara count (no auth needed, cached FREE call) ─────────

export async function previewVarasCount(
  siglas: string[],
): Promise<{ varas: number; tribunais: number }> {
  if (siglas.length === 0) return { varas: 0, tribunais: 0 }
  try {
    const escavador = radar as unknown as EscavadorService
    const varas = await escavador.getVarasByTribunais(siglas)
    const tribunais = new Set(varas.map((v) => v.tribunalSigla)).size
    return { varas: varas.length, tribunais }
  } catch {
    return { varas: 0, tribunais: 0 }
  }
}

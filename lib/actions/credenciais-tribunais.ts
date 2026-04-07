'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export type CredencialTribunal = {
  usuario: string
  senha: string
}

export type CredenciaisMap = Record<string, CredencialTribunal>

// ─── Lê credenciais de um tribunal específico ────────────────────────────────

export async function getCredenciaisTribunal(
  sigla: string,
): Promise<CredencialTribunal | null> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  try {
    const perfil = await prisma.peritoPerfil.findUnique({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: { credenciaisTribunais: true } as any,
    })
    if (!perfil) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (perfil as any).credenciaisTribunais as string | undefined
    if (!raw) return null
    const map: CredenciaisMap = JSON.parse(raw)
    return map[sigla] ?? null
  } catch {
    return null
  }
}

// ─── Salva/atualiza credenciais de um tribunal ───────────────────────────────

export async function saveCredenciaisTribunal(
  sigla: string,
  usuario: string,
  senha: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  try {
    const perfil = await prisma.peritoPerfil.findUnique({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: { credenciaisTribunais: true } as any,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (perfil as any)?.credenciaisTribunais as string | undefined
    const map: CredenciaisMap = raw ? JSON.parse(raw) : {}
    map[sigla] = { usuario, senha }

    await (prisma.peritoPerfil as unknown as {
      upsert: (args: unknown) => Promise<unknown>
    }).upsert({
      where: { userId },
      create: { userId, credenciaisTribunais: JSON.stringify(map) },
      update: { credenciaisTribunais: JSON.stringify(map) },
    })

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro ao salvar' }
  }
}

// ─── Remove credenciais de um tribunal ──────────────────────────────────────

export async function removeCredenciaisTribunal(
  sigla: string,
): Promise<{ ok: boolean }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false }

  try {
    const perfil = await prisma.peritoPerfil.findUnique({
      where: { userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: { credenciaisTribunais: true } as any,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (perfil as any)?.credenciaisTribunais as string | undefined
    const map: CredenciaisMap = raw ? JSON.parse(raw) : {}
    delete map[sigla]

    await (prisma.peritoPerfil as unknown as {
      update: (args: unknown) => Promise<unknown>
    }).update({
      where: { userId },
      data: { credenciaisTribunais: JSON.stringify(map) },
    })

    return { ok: true }
  } catch {
    return { ok: false }
  }
}

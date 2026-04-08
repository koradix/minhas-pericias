'use server'

import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { auth } from '@/auth'

export type VerifyEmailResult =
  | { ok: true }
  | { ok: false; error: 'invalid_token' | 'expired_token' | 'already_verified' | 'unknown' }

export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  try {
    const record = await prisma.emailVerificationToken.findUnique({ where: { token } })

    if (!record) return { ok: false, error: 'invalid_token' }
    if (record.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { token } })
      return { ok: false, error: 'expired_token' }
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } })
    if (!user) return { ok: false, error: 'invalid_token' }
    if (user.emailVerified) return { ok: false, error: 'already_verified' }

    // Mark verified + delete token (single-use)
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
      prisma.emailVerificationToken.delete({ where: { token } }),
    ])

    return { ok: true }
  } catch {
    return { ok: false, error: 'unknown' }
  }
}

export async function resendVerificationEmail(): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Não autenticado' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { ok: false, error: 'Usuário não encontrado' }
  if (user.emailVerified) return { ok: false, error: 'E-mail já verificado' }

  // Delete any existing tokens for this user
  await prisma.emailVerificationToken.deleteMany({ where: { userId } })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await prisma.emailVerificationToken.create({ data: { userId, token, expiresAt } })

  await sendVerificationEmail(user.email, token).catch((err) => {
    console.error('[resend-verification] error:', err)
  })

  return { ok: true }
}

'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const ADMIN_EMAILS = ['mmbonassi@gmail.com']

async function assertAdmin() {
  const session = await auth()
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    throw new Error('Não autorizado')
  }
}

export async function changeUserPassword(
  userId: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin()
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: 'Senha muito curta (mínimo 6 caracteres)' }
  }
  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } })
  return { ok: true }
}

export async function executeTursoSql(
  sql: string,
): Promise<{ ok: boolean; message: string }> {
  await assertAdmin()

  const DB_URL = process.env.TURSO_DATABASE_URL
  const TOKEN = process.env.TURSO_AUTH_TOKEN

  // Local dev fallback: run via Prisma $executeRawUnsafe
  if (!DB_URL || !TOKEN) {
    try {
      await prisma.$executeRawUnsafe(sql)
      return { ok: true, message: 'Executado via SQLite local.' }
    } catch (e) {
      return { ok: false, message: String(e) }
    }
  }

  // Production: Turso HTTP pipeline API
  const host = DB_URL.replace('libsql://', '')
  const apiUrl = `https://${host}/v2/pipeline`

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql } },
          { type: 'close' },
        ],
      }),
    })

    const data = await res.json() as { results?: { type: string; error?: { message?: string } }[] }

    if (!res.ok) {
      return { ok: false, message: `HTTP ${res.status}: ${JSON.stringify(data)}` }
    }

    const errors = data.results?.filter(
      (r) =>
        r.type === 'error' &&
        !r.error?.message?.toLowerCase().includes('duplicate column name') &&
        !r.error?.message?.toLowerCase().includes('already exists'),
    )

    if (errors?.length) {
      return { ok: false, message: JSON.stringify(errors, null, 2) }
    }

    return { ok: true, message: 'SQL executado com sucesso no Turso!' }
  } catch (e) {
    return { ok: false, message: String(e) }
  }
}

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

export async function createDemoRotas(
  targetUserId: string,
): Promise<{ ok: boolean; message: string }> {
  await assertAdmin()

  try {
    const existing = await prisma.rotaPericia.count({ where: { peritoId: targetUserId } })
    if (existing > 0) {
      return { ok: true, message: `Usuário já tem ${existing} rota(s) — nenhuma criada.` }
    }

    // Rota 1: Avaliação de Imóvel — em andamento
    const rota1 = await prisma.rotaPericia.create({
      data: { peritoId: targetUserId, titulo: 'Avaliação de Imóvel — Botafogo, RJ', status: 'em_andamento' },
    })
    await prisma.checkpoint.createMany({
      data: [
        { rotaId: rota1.id, ordem: 1, titulo: 'Fórum Central do Rio', endereco: 'Av. Erasmo Braga, 115 — Centro, Rio de Janeiro, RJ', status: 'concluido' },
        { rotaId: rota1.id, ordem: 2, titulo: 'Local da Vistoria', endereco: 'Rua Voluntários da Pátria, 340 — Botafogo, Rio de Janeiro, RJ', status: 'pendente' },
        { rotaId: rota1.id, ordem: 3, titulo: 'Escritório do Perito', endereco: 'Av. Rio Branco, 1 — Centro, Rio de Janeiro, RJ', status: 'pendente' },
      ],
    })

    // Rota 2: Perícia Trabalhista — concluída (conta como laudo pendente)
    const rota2 = await prisma.rotaPericia.create({
      data: { peritoId: targetUserId, titulo: 'Perícia Trabalhista — TRT-1, RJ', status: 'concluida' },
    })
    await prisma.checkpoint.createMany({
      data: [
        { rotaId: rota2.id, ordem: 1, titulo: 'TRT-1 — 5ª Vara do Trabalho', endereco: 'Av. Presidente Vargas, 1012 — Centro, Rio de Janeiro, RJ', status: 'concluido' },
        { rotaId: rota2.id, ordem: 2, titulo: 'Sede da Empresa (Reclamada)', endereco: 'Av. das Américas, 500 — Barra da Tijuca, Rio de Janeiro, RJ', status: 'concluido' },
      ],
    })

    return { ok: true, message: '2 rotas demo criadas com sucesso!' }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erro ao criar demos' }
  }
}

/** Split SQL text into individual statements (strips comments, blank lines) */
function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter((s) => s.length > 0)
}

function isIgnorableError(msg: string): boolean {
  const m = msg.toLowerCase()
  return (
    m.includes('duplicate column name') ||
    m.includes('already exists') ||
    m.includes('table') && m.includes('already exists')
  )
}

export async function executeTursoSql(
  sql: string,
): Promise<{ ok: boolean; message: string }> {
  await assertAdmin()

  const DB_URL = process.env.TURSO_DATABASE_URL
  const TOKEN = process.env.TURSO_AUTH_TOKEN

  const statements = splitStatements(sql)
  if (statements.length === 0) return { ok: false, message: 'Nenhum statement encontrado.' }

  // Local dev fallback: run via Prisma $executeRawUnsafe (one at a time)
  if (!DB_URL || !TOKEN) {
    try {
      for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt)
      }
      return { ok: true, message: `${statements.length} statement(s) executado(s) via SQLite local.` }
    } catch (e) {
      return { ok: false, message: String(e) }
    }
  }

  // Production: Turso HTTP pipeline API — one statement per request
  const host = DB_URL.replace('libsql://', '')
  const apiUrl = `https://${host}/v2/pipeline`

  const results: string[] = []

  for (const stmt of statements) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            { type: 'execute', stmt: { sql: stmt } },
            { type: 'close' },
          ],
        }),
      })

      const data = await res.json() as { results?: { type: string; error?: { message?: string } }[] }

      if (!res.ok) {
        return { ok: false, message: `HTTP ${res.status} no statement:\n${stmt}\n\n${JSON.stringify(data)}` }
      }

      const errors = data.results?.filter(
        (r) => r.type === 'error' && !isIgnorableError(r.error?.message ?? ''),
      )

      if (errors?.length) {
        return { ok: false, message: `Erro no statement:\n${stmt}\n\n${JSON.stringify(errors, null, 2)}` }
      }

      results.push(`✓ ${stmt.slice(0, 60).replace(/\s+/g, ' ')}…`)
    } catch (e) {
      return { ok: false, message: `Exceção no statement:\n${stmt}\n\n${String(e)}` }
    }
  }

  return { ok: true, message: `${statements.length} statement(s) executado(s) com sucesso!\n\n${results.join('\n')}` }
}

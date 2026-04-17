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


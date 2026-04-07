'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export interface SignupData {
  nome: string
  email: string
  senha: string
  cpf?: string
  telefone?: string
  formacao?: string
  formacaoCustom?: string
  registro?: string
  especialidades?: string[]
  cursos?: string[]
  estados?: string[]
  tribunais?: string[]
  cidade?: string
  areaAtuacao?: string
}

export async function signup(data: SignupData): Promise<{ success: true } | { error: string }> {
  const {
    nome, email, senha, cpf, telefone,
    formacao, formacaoCustom, registro, especialidades, cursos,
    estados, tribunais, cidade, areaAtuacao,
  } = data

  if (!nome?.trim() || !email?.trim() || !senha?.trim()) {
    return { error: 'Nome, e-mail e senha são obrigatórios.' }
  }
  if (senha.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres.' }
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return { error: 'Já existe uma conta com este e-mail.' }
  }

  const passwordHash = await bcrypt.hash(senha, 10)

  try {
    // Transação atômica — user + perfil criados juntos ou nenhum
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name: nome.trim(),
          passwordHash,
          role: 'perito',
        },
      })

      await tx.peritoPerfil.create({
        data: {
          userId: user.id,
          cpf: cpf?.replace(/\D/g, '').length === 11 ? cpf.trim() : null,
          telefone: telefone?.trim() || null,
          formacao: formacao || null,
          formacaoCustom: formacaoCustom?.trim() || null,
          registro: registro?.trim() || null,
          especialidades: JSON.stringify(especialidades ?? []),
          cursos: JSON.stringify(cursos ?? []),
          estados: JSON.stringify(estados ?? []),
          tribunais: JSON.stringify(tribunais ?? []),
          cidade: cidade?.trim() || null,
          estado: estados?.[0] ?? null,
          areaAtuacao: areaAtuacao?.trim() || null,
        },
      })
    })
  } catch (err) {
    console.error('[signup] erro ao criar usuário:', err)
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }

  return { success: true }
}

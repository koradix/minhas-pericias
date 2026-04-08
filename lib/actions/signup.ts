'use server'

import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

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
    const user = await prisma.$transaction(async (tx) => {
      // Sem RESEND_API_KEY: auto-verifica para o login funcionar
      // (a tela "email enviado" é exibida mesmo assim — cosmética)
      const autoVerify = !process.env.RESEND_API_KEY

      const newUser = await tx.user.create({
        data: {
          email:        email.toLowerCase(),
          name:         nome.trim(),
          passwordHash,
          role:         'perito',
          emailVerified: autoVerify ? new Date() : null,
        },
      })

      await tx.peritoPerfil.create({
        data: {
          userId:       newUser.id,
          cpf:          cpf?.replace(/\D/g, '').length === 11 ? cpf.trim() : null,
          telefone:     telefone?.trim() || null,
          formacao:     formacao || null,
          formacaoCustom: formacaoCustom?.trim() || null,
          registro:     registro?.trim() || null,
          especialidades: JSON.stringify(especialidades ?? []),
          cursos:       JSON.stringify(cursos ?? []),
          estados:      JSON.stringify(estados ?? []),
          tribunais:    JSON.stringify(tribunais ?? []),
          cidade:       cidade?.trim() || null,
          estado:       estados?.[0] ?? null,
          areaAtuacao:  areaAtuacao?.trim() || null,
        },
      })

      return newUser
    })

    // Generate secure verification token (expires in 24 h)
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token, expiresAt },
    })

    // Send verification email (non-blocking — don't fail signup if email fails)
    await sendVerificationEmail(email.toLowerCase(), token).catch((err) => {
      console.error('[signup] Failed to send verification email:', err)
    })
  } catch (err) {
    console.error('[signup] erro ao criar usuário:', err)
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }

  return { success: true }
}

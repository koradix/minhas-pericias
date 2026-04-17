'use server'

import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

const SignupSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  formacao: z.string().optional(),
  formacaoCustom: z.string().optional(),
  registro: z.string().optional(),
  especialidades: z.array(z.string()).optional(),
  cursos: z.array(z.string()).optional(),
  estados: z.array(z.string()).optional(),
  tribunais: z.array(z.string()).optional(),
  cidade: z.string().optional(),
  areaAtuacao: z.string().optional(),
})

export type SignupData = z.infer<typeof SignupSchema>

export async function signup(data: SignupData): Promise<{ success: true } | { error: string }> {
  const parsed = SignupSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const {
    nome, email, senha, cpf, telefone,
    formacao, formacaoCustom, registro, especialidades, cursos,
    estados, tribunais, cidade, areaAtuacao,
  } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return { error: 'Já existe uma conta com este e-mail.' }
  }

  const passwordHash = await bcrypt.hash(senha, 10)

  try {
    // Transação atômica — user + perfil criados juntos ou nenhum
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email:        email.toLowerCase(),
          name:         nome.trim(),
          passwordHash,
          role:         'perito',
          emailVerified: new Date(), // auto-verificado — login funciona imediatamente
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

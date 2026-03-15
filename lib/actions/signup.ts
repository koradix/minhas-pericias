'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export interface SignupData {
  // Step 1
  nome: string
  email: string
  senha: string
  telefone?: string
  // Step 2
  formacao?: string
  registro?: string
  especialidades?: string[]
  cursos?: string[]
  // Step 3
  estados?: string[]       // UFs de atuação (ex: ["RJ","SP"])
  tribunais?: string[]     // siglas dos tribunais escolhidos
  cidade?: string
  areaAtuacao?: string
}

export async function signup(data: SignupData): Promise<{ success: true } | { error: string }> {
  const {
    nome, email, senha, telefone,
    formacao, registro, especialidades, cursos,
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

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: nome.trim(),
      passwordHash,
      role: 'perito',
    },
  })

  const estadosPrimario = estados?.[0] ?? null

  await prisma.peritoPerfil.create({
    data: {
      userId: user.id,
      telefone: telefone?.trim() || null,
      formacao: formacao || null,
      registro: registro?.trim() || null,
      especialidades: JSON.stringify(especialidades ?? []),
      cursos: JSON.stringify(cursos ?? []),
      estados: JSON.stringify(estados ?? []),
      tribunais: JSON.stringify(tribunais ?? []),
      cidade: cidade?.trim() || null,
      estado: estadosPrimario,
      areaAtuacao: areaAtuacao?.trim() || null,
    },
  })

  return { success: true }
}

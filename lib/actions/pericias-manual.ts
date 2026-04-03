'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function registrarPericiaManual(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autorizado' }

  const peritoId = session.user.id
  const numero    = formData.get('numero') as string
  const assunto   = formData.get('assunto') as string
  const vara      = formData.get('vara') as string || null
  const partes    = formData.get('partes') as string || null
  const valor     = parseFloat(formData.get('valor') as string) || null
  const prazo     = formData.get('prazo') as string || null
  const tipo      = (formData.get('tipo') as string) || 'Anual'

  if (!assunto) return { ok: false, error: 'Assunto é obrigatório' }

  // Generate sequential number if not provided
  let numeroFinal = numero
  if (!numeroFinal) {
    const count = await prisma.pericia.count({ where: { peritoId } })
    numeroFinal = `MAN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`
  }

  try {
    const pericia = await prisma.pericia.create({
      data: {
        peritoId,
        numero: numeroFinal,
        assunto,
        tipo,
        vara,
        partes,
        valorHonorarios: valor,
        prazo,
        status: 'planejada',
      }
    })

    revalidatePath('/pericias')
    return { ok: true, periciaId: pericia.id }
  } catch (err) {
    console.error('[registrarPericiaManual] erro:', err)
    return { ok: false, error: 'Erro ao registrar perícia manual' }
  }
}

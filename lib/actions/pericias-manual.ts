'use server'

/**
 * Criar perícia manualmente — com select de comarca/vara do banco.
 * Anti-duplicidade por CNJ e por réu.
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface CriarPericiaManualInput {
  processo: string
  autor: string
  reu: string
  uf: string
  comarca: string
  vara: string
}

export async function criarPericiaManual(
  input: CriarPericiaManualInput,
): Promise<{ ok: true; periciaId: string } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autorizado' }
  const peritoId = session.user.id

  const processo = input.processo.trim() || null
  const autor = input.autor.trim()
  const reu = input.reu.trim()

  if (!autor && !reu) return { ok: false, error: 'Informe pelo menos o autor ou o réu' }

  // Anti-duplicidade por CNJ
  if (processo) {
    const existente = await prisma.pericia.findFirst({
      where: { peritoId, processo },
      select: { id: true },
    })
    if (existente) return { ok: true, periciaId: existente.id }
  }

  // Anti-duplicidade por réu
  if (reu.length > 5) {
    const existente = await prisma.pericia.findFirst({
      where: { peritoId, partes: { contains: reu } },
      select: { id: true },
    })
    if (existente) return { ok: true, periciaId: existente.id }
  }

  // Número sequencial: {Seq}-{Ano}-{UF}-{Cidade}-{NºVara}-{Tipo}
  const count = await prisma.pericia.count({ where: { peritoId } })
  const seq = String(count + 1).padStart(3, '0')
  const ano = new Date().getFullYear()
  const ufCode = input.uf || 'XX'
  const cidade = input.comarca
    ? input.comarca.split(' ').slice(0, 2).join('_').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9_]/g, '')
    : 'SEM'
  // Extrair número da vara: "1 VARA CIVEL" → "1VC", "Vara Única" → "VU"
  const varaMatch = input.vara?.match(/^(\d+)[ªº]?\s*vara/i)
  const varaTipo = input.vara?.toLowerCase().includes('famil') ? 'FAM'
    : input.vara?.toLowerCase().includes('fazenda') ? 'FAZ'
    : input.vara?.toLowerCase().includes('única') ? 'VU'
    : 'CIV'
  const varaNum = varaMatch ? `${varaMatch[1]}${varaTipo}` : varaTipo
  const numero = `${seq}-${ano}-${ufCode}-${cidade}-${varaNum}`

  const partes = [autor && `AUTOR: ${autor}`, reu && `RÉU: ${reu}`].filter(Boolean).join(' × ')
  const varaFull = input.vara
    ? `${input.vara} — ${input.comarca}`
    : input.comarca || null

  const pericia = await prisma.pericia.create({
    data: {
      peritoId,
      numero,
      assunto: `Perícia judicial — ${reu || autor}`,
      tipo: 'Judicial',
      processo: processo ?? undefined,
      vara: varaFull ?? undefined,
      partes: partes || undefined,
      status: 'planejada',
    },
  })

  revalidatePath('/pericias')
  revalidatePath('/nomeacoes')

  return { ok: true, periciaId: pericia.id }
}

/** @deprecated — use criarPericiaManual */
export async function registrarPericiaManual(formData: FormData) {
  const session = await (await import('@/auth')).auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autorizado' }
  const peritoId = session.user.id
  const assunto = formData.get('assunto') as string
  if (!assunto) return { ok: false, error: 'Assunto obrigatório' }
  const count = await prisma.pericia.count({ where: { peritoId } })
  const numero = `PRC-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`
  const pericia = await prisma.pericia.create({
    data: {
      peritoId, numero, assunto, tipo: (formData.get('tipo') as string) || 'Judicial',
      vara: (formData.get('vara') as string) || undefined,
      partes: (formData.get('partes') as string) || undefined,
      prazo: (formData.get('prazo') as string) || undefined,
      valorHonorarios: parseFloat(formData.get('valor') as string) || undefined,
      status: 'planejada',
    },
  })
  revalidatePath('/pericias')
  return { ok: true, periciaId: pericia.id }
}

export async function getComarcasByUf(uf: string): Promise<string[]> {
  const rows = await prisma.varaPublica.findMany({
    where: { uf, ativa: true },
    select: { comarca: true },
    distinct: ['comarca'],
    orderBy: { comarca: 'asc' },
  })
  return rows.map(r => r.comarca)
}

export async function getVarasByComarca(uf: string, comarca: string): Promise<string[]> {
  const rows = await prisma.varaPublica.findMany({
    where: { uf, comarca, ativa: true },
    select: { varaNome: true },
    orderBy: { varaNome: 'asc' },
  })
  return rows.map(r => r.varaNome)
}

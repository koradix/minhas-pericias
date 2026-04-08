import { prisma } from '@/lib/prisma'

export type VaraPublicaRow = {
  id: string
  comarca: string
  varaNome: string
  emailPrincipal: string | null
  emailGabinete: string | null
  telefone: string | null
  fax: string | null
  endereco: string | null
  cep: string | null
  juizTitular: string | null
  tribunal: string
  uf: string
  totalVisitas: number
  ultimaVisita: Date | null
}

export type ProspeccaoVisitaRow = {
  id: string
  varaId: string | null
  comarca: string
  varaNome: string
  dataVisita: Date
  resultado: string
  anotacoes: string | null
  juizEncontrado: string | null
  contatoNome: string | null
  contatoRole: string | null
  contatoEmail: string | null
  contatoFotoUrl: string | null
  emailEnviadoEm: Date | null
  followUpEm: Date | null
  criadoEm: Date
}

export async function getVarasPublicas(filters?: {
  comarca?: string
  search?: string
  uf?: string
}): Promise<VaraPublicaRow[]> {
  const where: Record<string, unknown> = { ativa: true }
  if (filters?.uf) where.uf = filters.uf
  if (filters?.comarca) where.comarca = filters.comarca
  if (filters?.search) {
    where.OR = [
      { varaNome: { contains: filters.search, mode: 'insensitive' } },
      { comarca: { contains: filters.search, mode: 'insensitive' } },
      { juizTitular: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const varas = await prisma.varaPublica.findMany({
    where,
    include: {
      _count: { select: { visitas: true } },
      visitas: {
        orderBy: { dataVisita: 'desc' },
        take: 1,
        select: { dataVisita: true },
      },
    },
    orderBy: [{ comarca: 'asc' }, { varaNome: 'asc' }],
  })

  return varas.map((v) => ({
    id: v.id,
    comarca: v.comarca,
    varaNome: v.varaNome,
    emailPrincipal: v.emailPrincipal,
    emailGabinete: v.emailGabinete,
    telefone: v.telefone,
    fax: v.fax,
    endereco: v.endereco,
    cep: v.cep,
    juizTitular: v.juizTitular,
    tribunal: v.tribunal,
    uf: v.uf,
    totalVisitas: v._count.visitas,
    ultimaVisita: v.visitas[0]?.dataVisita ?? null,
  }))
}

export async function getComarcas(uf = 'RJ'): Promise<string[]> {
  const rows = await prisma.varaPublica.findMany({
    where: { uf, ativa: true },
    select: { comarca: true },
    distinct: ['comarca'],
    orderBy: { comarca: 'asc' },
  })
  return rows.map((r) => r.comarca)
}

export async function getVisitasByPerito(
  peritoId: string,
  varaId?: string,
): Promise<ProspeccaoVisitaRow[]> {
  return prisma.prospeccaoVisita.findMany({
    where: { peritoId, ...(varaId ? { varaId } : {}) },
    orderBy: { dataVisita: 'desc' },
  })
}

export async function getVaraById(id: string) {
  return prisma.varaPublica.findUnique({ where: { id } })
}

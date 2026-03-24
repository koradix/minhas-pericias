import { prisma } from '@/lib/prisma'
import type { EscritaProfile, TomEscrita, Abreviatura } from '@/lib/types/escrita-profile'

function parseJSON<T>(val: string, fallback: T): T {
  try { return JSON.parse(val) as T } catch { return fallback }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProfile(row: any): EscritaProfile {
  return {
    id: row.id,
    userId: row.userId,
    tom: (row.tom ?? 'formal') as TomEscrita,
    estruturaLaudo: parseJSON<string[]>(row.estruturaLaudo, []),
    estruturaProposta: parseJSON<string[]>(row.estruturaProposta, []),
    templatesFavoritos: parseJSON<string[]>(row.templatesFavoritos, []),
    expressoes: parseJSON<string[]>(row.expressoes, []),
    palavrasEvitar: parseJSON<string[]>(row.palavrasEvitar, []),
    abreviaturas: parseJSON<Abreviatura[]>(row.abreviaturas, []),
    estiloConc: row.estiloConc ?? '',
    formulaFecho: row.formulaFecho ?? '',
    notasIA: row.notasIA ?? '',
    contextoRegional: row.contextoRegional ?? '',
    createdAt: row.criadoEm,
    updatedAt: row.atualizadoEm,
  }
}

export async function getEscritaProfile(userId: string): Promise<EscritaProfile | null> {
  try {
    const row = await prisma.peritoEscritaProfile.findUnique({ where: { userId } })
    return row ? toProfile(row) : null
  } catch {
    return null
  }
}

/** Returns the profile or a zero-value default — never null. */
export async function getOrDefaultEscritaProfile(userId: string): Promise<EscritaProfile> {
  const profile = await getEscritaProfile(userId)
  if (profile) return profile

  return {
    id: '',
    userId,
    tom: 'formal',
    estruturaLaudo: [],
    estruturaProposta: [],
    templatesFavoritos: [],
    expressoes: [],
    palavrasEvitar: [],
    abreviaturas: [],
    estiloConc: '',
    formulaFecho: '',
    notasIA: '',
    contextoRegional: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

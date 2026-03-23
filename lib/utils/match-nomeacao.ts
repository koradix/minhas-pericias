import type { ProcessoDataJud } from '@/lib/services/datajud'
import { tribunalToUF } from '@/lib/constants/datajud-tribunais'

export interface PerfilMatch {
  especialidades: string[]   // JSON parse de PeritoPerfil.especialidades
  especialidades2: string[]  // nova taxonomia
  areaPrincipal: string | null
  tribunais: string[]        // JSON parse de PeritoPerfil.tribunais
  estados: string[]          // JSON parse de PeritoPerfil.estados
  cursos: string[]           // JSON parse de PeritoPerfil.cursos
  perfilCompleto: boolean
}

/** Calcula score de compatibilidade entre processo e perfil do perito (0–90) */
export function calcularScore(
  processo: ProcessoDataJud,
  perfil: PerfilMatch,
): number {
  let score = 0

  const assuntoLow = (processo.assunto ?? '').toLowerCase()
  const classeLow  = (processo.classe ?? '').toLowerCase()
  const texto      = `${assuntoLow} ${classeLow}`

  // Todas as palavras-chave do perfil
  const keywords = [
    ...perfil.especialidades,
    ...perfil.especialidades2,
    perfil.areaPrincipal ?? '',
  ]
    .map((e) => e.toLowerCase())
    .filter(Boolean)

  // Especialidade / área de atuação → +40
  if (keywords.some((k) => texto.includes(k))) {
    score += 40
  }

  // Estado (tribunal sigla → UF) → +20
  const uf = tribunalToUF(processo.tribunal)
  if (uf && perfil.estados.includes(uf)) {
    score += 20
  }

  // Tribunal cadastrado pelo perito → +15
  if (perfil.tribunais.some((t) => processo.tribunal.toUpperCase().includes(t.toUpperCase()))) {
    score += 15
  }

  // Cursos relacionados ao assunto → +10
  const cursosLow = perfil.cursos.map((c) => c.toLowerCase())
  if (cursosLow.some((c) => c.length > 3 && texto.includes(c))) {
    score += 10
  }

  // Perfil completo → +5
  if (perfil.perfilCompleto) {
    score += 5
  }

  return Math.min(score, 90)
}

/** Retorna o label do badge para um score */
export function scoreBadgeLabel(score: number): string {
  if (score >= 75) return 'Excelente match'
  if (score >= 55) return 'Bom match'
  return 'Compatível'
}

/** Retorna as classes Tailwind para o badge de score */
export function scoreBadgeClass(score: number): string {
  if (score >= 75) return 'bg-lime-100 text-lime-700 border-lime-200'
  if (score >= 55) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

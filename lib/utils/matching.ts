import type { PeritoPerfil } from '@/lib/mocks/peritos'
import { ESPECIALIDADES_POR_AREA, type AreaPrincipalId } from '@/lib/constants/pericias'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Demanda {
  tipo: string       // especialidade (ex: "Avaliação de Imóvel")
  uf: string         // estado (ex: "RJ")
  cidade?: string
  tribunal?: string  // sigla (ex: "TJRJ")
}

// Extended type — mock PeritoPerfil + optional new taxonomy fields from Prisma
interface PeritoComTaxonomia extends PeritoPerfil {
  areaPrincipal?: string | null
  areasSecundarias?: string[]
  especialidades2?: string[]
  keywords?: string[]
}

export type ScoreCategoria =
  | 'excelente'   // 90+
  | 'bom'         // 70–89
  | 'compativel'  // 50–69
  | 'baixa'       // <50

export interface MatchResult extends PeritoPerfil {
  score: number
  categoria: ScoreCategoria
}

// ─── Classificação ────────────────────────────────────────────────────────────

const CATEGORIAS: { min: number; key: ScoreCategoria; label: string; color: string }[] = [
  { min: 90, key: 'excelente',  label: 'Excelente encaixe',  color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' },
  { min: 70, key: 'bom',        label: 'Bom encaixe',        color: 'bg-lime-50    text-lime-700    ring-lime-600/15'    },
  { min: 50, key: 'compativel', label: 'Compatível',         color: 'bg-amber-50   text-amber-700   ring-amber-600/15'  },
  { min: 0,  key: 'baixa',      label: 'Baixa aderência',    color: 'bg-slate-100  text-slate-600   ring-slate-500/15'  },
]

export function getCategoria(score: number): ScoreCategoria {
  return (CATEGORIAS.find((c) => score >= c.min) ?? CATEGORIAS[CATEGORIAS.length - 1]).key
}

export function getCategoriaLabel(score: number): string {
  return (CATEGORIAS.find((c) => score >= c.min) ?? CATEGORIAS[CATEGORIAS.length - 1]).label
}

export function getCategoriaColor(score: number): string {
  return (CATEGORIAS.find((c) => score >= c.min) ?? CATEGORIAS[CATEGORIAS.length - 1]).color
}

// ─── Cálculo de score ─────────────────────────────────────────────────────────
//
//  Critério (nova taxonomia)             Pontos   Max
//  ──────────────────────────────────────────────────
//  areaPrincipal contém tipo              +35     35
//  especialidades2 exata                  +25     25
//  especialidades2 parcial                +15     15  (só se !exata)
//  areasSecundarias contém tipo           +10     10
//  keywords relevantes (+5 cada, max 15)          15
//  ──────────────────────────────────────────────────
//  Critério (legado — sem nova taxonomia)
//  Especialidade exata                    +40
//  Especialidade parcial                  +20
//  ──────────────────────────────────────────────────
//  Mesmo estado de atuação                +20     20
//  Mesmo tribunal de interesse            +15     15
//  Cursos relevantes                      +10     10
//  Perfil completo                        +5       5
//  ──────────────────────────────────────────────────
//  Total máximo (nova)                            100
//  Total máximo (legado)                          90 (cap 100)

export function calculatePeritoMatchScore(
  perito: PeritoPerfil | PeritoComTaxonomia,
  demanda: Demanda,
): number {
  let score = 0
  const p = perito as PeritoComTaxonomia
  const tipoNorm = demanda.tipo.toLowerCase()
  const keyword  = tipoNorm.split(' ').find((w) => w.length > 3) ?? ''

  const esp2:            string[] = p.especialidades2 ?? []
  const areasSecundarias: string[] = p.areasSecundarias ?? []
  const keywords:         string[] = p.keywords ?? []
  const hasNewTaxonomy = esp2.length > 0 || !!p.areaPrincipal

  if (hasNewTaxonomy) {
    // ── Nova taxonomia ────────────────────────────────────────────────────

    // areaPrincipal match (+35): check if demanda.tipo is in the area's specialties
    if (p.areaPrincipal) {
      const area = p.areaPrincipal as AreaPrincipalId
      const areaEsps = ESPECIALIDADES_POR_AREA[area] ?? []
      const areaMatch = areaEsps.some((e) => e.toLowerCase() === tipoNorm)
        || (keyword.length > 3 && areaEsps.some((e) => e.toLowerCase().includes(keyword)))
      if (areaMatch) score += 35
    }

    // especialidades2 (+25 exata, +15 parcial)
    if (esp2.some((e) => e.toLowerCase() === tipoNorm)) {
      score += 25
    } else if (keyword.length > 3 && esp2.some((e) => e.toLowerCase().includes(keyword))) {
      score += 15
    }

    // areasSecundarias (+10)
    if (areasSecundarias.length > 0) {
      const secondaryEsps = areasSecundarias.flatMap((a) => ESPECIALIDADES_POR_AREA[a as AreaPrincipalId] ?? [])
      const secMatch = secondaryEsps.some((e) => e.toLowerCase() === tipoNorm)
        || (keyword.length > 3 && secondaryEsps.some((e) => e.toLowerCase().includes(keyword)))
      if (secMatch) score += 10
    }

    // keywords (+5 each, max 15)
    if (keyword.length > 3 && keywords.length > 0) {
      let kwScore = 0
      for (const kw of keywords) {
        if (tipoNorm.includes(kw.toLowerCase()) || kw.toLowerCase().includes(keyword)) {
          kwScore += 5
        }
        if (kwScore >= 15) break
      }
      score += kwScore
    }
  } else {
    // ── Legado (sem nova taxonomia) ───────────────────────────────────────
    if (perito.especialidades.some((e) => e.toLowerCase() === tipoNorm)) {
      score += 40
    } else if (
      keyword.length > 3 &&
      perito.especialidades.some((e) => e.toLowerCase().includes(keyword))
    ) {
      score += 20
    }
  }

  // ── Geography (sempre) ───────────────────────────────────────────────────

  // Estado (+20)
  if (perito.regioes.map((r) => r.toUpperCase()).includes(demanda.uf.toUpperCase())) {
    score += 20
  }

  // Tribunal (+15)
  if (demanda.tribunal && perito.tribunais.includes(demanda.tribunal)) {
    score += 15
  }

  // Cursos relevantes (+10)
  if (keyword.length > 3 && perito.cursos.some((c) => c.toLowerCase().includes(keyword))) {
    score += 10
  }

  // Perfil completo (+5)
  if (perito.formacao && perito.bio && perito.especialidades.length >= 2) {
    score += 5
  }

  return Math.min(score, 100)
}

// ─── Ranking por demanda ──────────────────────────────────────────────────────

export function rankPeritosPorDemanda(
  peritos: PeritoPerfil[],
  demanda: Demanda,
): MatchResult[] {
  return peritos
    .filter((p) => p.disponivel)
    .map((p) => {
      const score = calculatePeritoMatchScore(p, demanda)
      return { ...p, score, categoria: getCategoria(score) }
    })
    .sort((a, b) => b.score - a.score)
}

// ─── Função legada (mantida para compatibilidade) ─────────────────────────────

export interface LegacyMatchResult extends PeritoPerfil {
  score: number
}

export function calcularScore(
  tipo: string,
  uf: string,
  cidade: string,
  perito: PeritoPerfil,
): number {
  return calculatePeritoMatchScore(perito, { tipo, uf, cidade })
}

export function rankPeritos(
  tipo: string,
  uf: string,
  cidade: string,
  peritos: PeritoPerfil[],
): LegacyMatchResult[] {
  return peritos
    .filter((p) => p.disponivel)
    .map((p) => ({ ...p, score: calcularScore(tipo, uf, cidade, p) }))
    .sort((a, b) => b.score - a.score)
}

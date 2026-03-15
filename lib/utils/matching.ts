import type { PeritoPerfil } from '@/lib/mocks/peritos'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Demanda {
  tipo: string       // especialidade (ex: "Avaliação de Imóvel")
  uf: string         // estado (ex: "RJ")
  cidade?: string
  tribunal?: string  // sigla (ex: "TJRJ")
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
//  Critério                     Pontos   Max
//  ─────────────────────────────────────────
//  Especialidade compatível      +40     40
//  Mesmo estado de atuação       +20     20
//  Mesmo tribunal de interesse   +15     15
//  Cursos relevantes             +10     10
//  Perfil completo               +5       5
//  ─────────────────────────────────────────
//  Total máximo                          90  (os últimos 10 são impossíveis de atingir sem todos)
//  Normalizado cap                       100

export function calculatePeritoMatchScore(
  perito: PeritoPerfil,
  demanda: Demanda,
): number {
  let score = 0

  // Especialidade (+40 exato, +20 parcial)
  const tipoNorm = demanda.tipo.toLowerCase()
  if (perito.especialidades.some((e) => e.toLowerCase() === tipoNorm)) {
    score += 40
  } else if (perito.especialidades.some((e) => e.toLowerCase().includes(tipoNorm.split(' ')[0]))) {
    score += 20
  }

  // Estado (+20)
  if (perito.regioes.map((r) => r.toUpperCase()).includes(demanda.uf.toUpperCase())) {
    score += 20
  }

  // Tribunal (+15)
  if (demanda.tribunal && perito.tribunais.includes(demanda.tribunal)) {
    score += 15
  }

  // Cursos relevantes (+10) — ao menos 1 curso que contenha palavra da especialidade
  const keyword = demanda.tipo.toLowerCase().split(' ').find((w) => w.length > 3) ?? ''
  if (keyword && perito.cursos.some((c) => c.toLowerCase().includes(keyword))) {
    score += 10
  }

  // Perfil completo (+5) — tem formação, bio e pelo menos 2 especialidades
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

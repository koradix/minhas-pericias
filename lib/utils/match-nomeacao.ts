// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProcessoMatch {
  tribunal: string
  assunto: string | null
  classe: string | null
  [key: string]: unknown  // permite campos extras (numeroProcesso, orgaoJulgador, etc.)
}

export interface PerfilMatch {
  especialidades: string[]   // JSON parse de PeritoPerfil.especialidades
  especialidades2: string[]  // nova taxonomia
  areaPrincipal: string | null
  tribunais: string[]        // JSON parse de PeritoPerfil.tribunais
  estados: string[]          // JSON parse de PeritoPerfil.estados
  cursos: string[]           // JSON parse de PeritoPerfil.cursos
  perfilCompleto: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extrai UF da sigla do tribunal (ex: "TJRJ" → "RJ", "TRT1" → "RJ") */
function tribunalToUF(sigla: string): string | null {
  const s = sigla.toUpperCase()
  const m = s.match(/TJ([A-Z]{2})/)
  if (m) return m[1]
  // TRTs por região
  const trtMap: Record<string, string> = {
    TRT1: 'RJ', TRT2: 'SP', TRT3: 'MG', TRT4: 'RS', TRT5: 'BA',
    TRT6: 'PE', TRT7: 'CE', TRT8: 'PA', TRT9: 'PR', TRT10: 'DF',
    TRT11: 'AM', TRT12: 'SC', TRT13: 'PB', TRT14: 'RO', TRT15: 'SP',
    TRT16: 'MA', TRT17: 'ES', TRT18: 'GO', TRT19: 'AL', TRT20: 'SE',
    TRT21: 'RN', TRT22: 'PI', TRT23: 'MT', TRT24: 'MS',
  }
  const trtKey = s.match(/TRT\d+/)?.[0]
  return trtKey ? (trtMap[trtKey] ?? null) : null
}

// ─── Scoring ────────────────────────────────────────────────────────────────

/** Calcula score de compatibilidade entre processo e perfil do perito (0–90) */
export function calcularScore(
  processo: ProcessoMatch,
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

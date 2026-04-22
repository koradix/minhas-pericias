/**
 * Dedup de citações (Nomeações V2, DJ por email, DJ por nome, manual).
 *
 * Regra:
 * 1. Match por CNJ normalizado (alta confiança)
 * 2. Se ambos não tem CNJ → match por sobreposição de nomes de partes
 *    (excluindo o próprio perito) + data próxima
 * 3. Ao duplicar, mantém a de MAIOR FORÇA:
 *    v2_tribunal > v1_email_dj > escavador (V1 DJE por nome) > manual
 */

import type { CitacaoSerializada } from '@/lib/data/nomeacoes'

// ─── Normalização ────────────────────────────────────────────────────────────

export function normalizeCnj(cnj: string | null | undefined): string | null {
  if (!cnj) return null
  const cleaned = cnj.trim().replace(/\s+/g, '')
  // Valida formato CNJ: 0000000-00.0000.0.00.0000
  if (!/^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(cleaned)) return null
  return cleaned
}

function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

// ─── Extração de partes do snippet ───────────────────────────────────────────

/**
 * Extrai nomes de partes (autor/réu) do snippet do DJ.
 * Exclui o nome do próprio perito.
 *
 * Exemplos de formatos que pegamos:
 * - "Vanilda Ornelas Matheus × Ampla Energia e Servicos S.A"
 * - "autora MARIA SILVA e réu BANCO XYZ"
 * - "Perito no processo X | Vara Y | AUTOR × RÉU"
 */
export function extractPartesDoSnippet(snippet: string, nomePerito: string): Set<string> {
  const partes = new Set<string>()
  if (!snippet) return partes

  const nomePeritoNorm = normalizeText(nomePerito)

  // Pattern 1: "X × Y" (formato de snippet V2 que usa ×)
  const crossPattern = /([^|×\n]+?)\s*×\s*([^|×\n]+?)(?:\s*\||\s*$|\n)/g
  let m
  while ((m = crossPattern.exec(snippet)) !== null) {
    for (const p of [m[1], m[2]]) {
      const n = normalizeText(p)
      if (n.length < 5) continue
      if (nomePeritoNorm.includes(n) || n.includes(nomePeritoNorm)) continue
      partes.add(n)
    }
  }

  // Pattern 2: palavras capitalizadas sequenciais (nomes próprios)
  // "Maria da Silva", "JOAO PEREIRA LTDA", "Banco XYZ S.A"
  const nomePattern = /\b([A-ZÁÉÍÓÚÃÕÂÊÔÇ][A-ZÁÉÍÓÚÃÕÂÊÔÇa-záéíóúãõâêôç.&]+(?:\s+(?:da|de|do|dos|das|e|do|&)\s+|\s+)){1,5}[A-ZÁÉÍÓÚÃÕÂÊÔÇ][A-ZÁÉÍÓÚÃÕÂÊÔÇa-záéíóúãõâêôç.&]+/g
  const nomeMatches = snippet.match(nomePattern) ?? []
  for (const match of nomeMatches) {
    const n = normalizeText(match)
    if (n.length < 8) continue // muito curto, provável ruído
    if (nomePeritoNorm.includes(n) || n.includes(nomePeritoNorm)) continue
    // Ignora palavras genéricas
    if (/^(vara|cível|civel|juizado|comarca|tribunal|justica|justiça|secretaria|processo|autos|diário|diario|oficial|estado|republica|república|nomeio|perito|perita|autor|autora|réu|reu|polo|ativo|passivo|requerente|requerido|cadastro|sejud)\b/i.test(n)) continue
    partes.add(n)
  }

  return partes
}

/** Retorna true se pelo menos uma parte bate entre as duas (match parcial aceito) */
export function partesOverlap(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false
  for (const nomeA of a) {
    for (const nomeB of b) {
      if (nomeA === nomeB) return true
      // Match parcial quando um contém o outro (casos de variação de nome)
      if (nomeA.length >= 8 && nomeB.length >= 8) {
        if (nomeA.includes(nomeB) || nomeB.includes(nomeA)) return true
      }
    }
  }
  return false
}

// ─── Prioridade de fonte ─────────────────────────────────────────────────────

/** Maior número = maior prioridade */
export function fontePriority(fonte: string): number {
  switch (fonte) {
    case 'v2_tribunal':  return 4  // Processo confirmado com documentos
    case 'v1_email_dj':  return 3  // DJ por email (alta precisão)
    case 'escavador':    return 2  // V1 DJE por nome
    case 'manual':       return 1  // Criação manual
    default:             return 0
  }
}

// ─── Dedup ───────────────────────────────────────────────────────────────────

export interface CitacaoAgrupada {
  principal: CitacaoSerializada
  duplicatas: CitacaoSerializada[]
  /** Todas as fontes que identificaram esse processo */
  fontes: Set<string>
}

/**
 * Agrupa citações duplicadas e mantém a de maior força como principal.
 * Considera duplicata quando:
 * - CNJ bate (normalizado), OU
 * - Ambos sem CNJ mas partes no snippet têm sobreposição (excluindo nome do perito)
 */
export function dedupCitacoes(
  citacoes: CitacaoSerializada[],
  nomePerito: string,
): CitacaoAgrupada[] {
  const grupos: CitacaoAgrupada[] = []

  // Pré-calcula partes de cada citação (cache)
  const partesCache = new Map<string, Set<string>>()
  const getPartes = (c: CitacaoSerializada): Set<string> => {
    const cached = partesCache.get(c.id)
    if (cached) return cached
    const p = extractPartesDoSnippet(c.snippet, nomePerito)
    partesCache.set(c.id, p)
    return p
  }

  for (const c of citacoes) {
    const cnjC = normalizeCnj(c.numeroProcesso)

    // Procura grupo existente que case
    let grupoMatch: CitacaoAgrupada | null = null

    for (const g of grupos) {
      const cnjG = normalizeCnj(g.principal.numeroProcesso)

      // Critério 1: CNJ bate (alta confiança)
      if (cnjC && cnjG && cnjC === cnjG) {
        grupoMatch = g
        break
      }

      // Critério 2: ambos sem CNJ → compara partes (confiança média)
      // Só considera se ambos não têm CNJ, para evitar misturar processos distintos
      if (!cnjC && !cnjG) {
        const partesC = getPartes(c)
        const partesG = getPartes(g.principal)
        if (partesOverlap(partesC, partesG)) {
          grupoMatch = g
          break
        }
      }
    }

    if (grupoMatch) {
      grupoMatch.fontes.add(c.fonte)
      // Se c tem prioridade maior, vira principal
      if (fontePriority(c.fonte) > fontePriority(grupoMatch.principal.fonte)) {
        grupoMatch.duplicatas.push(grupoMatch.principal)
        grupoMatch.principal = c
      } else {
        grupoMatch.duplicatas.push(c)
      }
    } else {
      grupos.push({ principal: c, duplicatas: [], fontes: new Set([c.fonte]) })
    }
  }

  return grupos
}

/** Separa grupos em: confirmados (V2) vs diário oficial (tudo mais) */
export function separarGrupos(grupos: CitacaoAgrupada[]): {
  confirmadas: CitacaoAgrupada[]
  diarioOficial: CitacaoAgrupada[]
} {
  const confirmadas: CitacaoAgrupada[] = []
  const diarioOficial: CitacaoAgrupada[] = []

  for (const g of grupos) {
    if (g.principal.fonte === 'v2_tribunal') {
      confirmadas.push(g)
    } else {
      diarioOficial.push(g)
    }
  }

  return { confirmadas, diarioOficial }
}

// ─── Dedup INDEPENDENTE por seção (mantém ambas visíveis) ──────────────────

/**
 * Retorna 2 listas DEDUPADAS internamente, SEM cross-dedup entre elas.
 * Ou seja: o mesmo CNJ pode aparecer em "Nomeações V2" e "Diário Oficial",
 * já que são fontes diferentes com informações complementares.
 *
 * Filtros:
 * - Apenas tribunais estaduais (TJ*) ou diários estaduais (DJ*)
 * - Ignora status = 'arquivada' e 'rejeitada' (peritocontrola via "Descartar")
 *
 * Dedup:
 * - Dentro de cada seção, agrupa por CNJ (normalizado)
 * - Se 2 citações V1 DJ têm mesmo CNJ, mantém a mais recente
 */
export function separarPorFonteSemCrossDedup(
  citacoes: CitacaoSerializada[],
  nomePerito: string,
): {
  confirmadas: CitacaoSerializada[]
  diarioOficial: CitacaoSerializada[]
} {
  const ehTjOuDj = (sigla: string): boolean => {
    const s = (sigla ?? '').toUpperCase()
    return s.startsWith('TJ') || s.startsWith('DJ')
  }

  // Filtra: apenas estaduais + não arquivadas/rejeitadas
  const elegiveis = citacoes.filter((c) => {
    if (!ehTjOuDj(c.diarioSigla)) return false
    if (c.status === 'arquivada' || c.status === 'rejeitada') return false
    return true
  })

  // Separa por tipo de fonte
  const v2 = elegiveis.filter((c) => c.fonte === 'v2_tribunal')
  const dj = elegiveis.filter((c) => c.fonte !== 'v2_tribunal')

  // Dedup interno V2 por CNJ
  const v2Map = new Map<string, CitacaoSerializada>()
  for (const c of v2) {
    const key = normalizeCnj(c.numeroProcesso) ?? c.externalId
    const existing = v2Map.get(key)
    if (!existing || new Date(c.diarioData) > new Date(existing.diarioData)) {
      v2Map.set(key, c)
    }
  }

  // Dedup interno DJ por CNJ (ou por partes quando sem CNJ)
  const djGrupos = dedupCitacoes(dj, nomePerito)
  const diarioOficial = djGrupos.map((g) => g.principal)

  return {
    confirmadas: Array.from(v2Map.values()),
    diarioOficial,
  }
}

/**
 * Funções puras de domínio para nomeações.
 * Sem Prisma, sem fetch, sem side effects — apenas lógica de negócio.
 */

import { EscavadorError, type CitacaoResult } from '@/lib/services/radar-provider'

// ─── Normalização de texto ──────────────────────────────────────────────────

/** Remove acentos, lowercase, normaliza espaços */
export function normalizeName(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Gera "primeiro + último" nome para filtro tolerante */
export function buildPrimeiroUltimo(nomeCompleto: string): string {
  const parts = nomeCompleto.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 3) return `${parts[0]} ${parts[parts.length - 1]}`.toLowerCase()
  return nomeCompleto.toLowerCase()
}

// ─── Variações de nome para busca ───────────────────────────────────────────

export function buildVariacoes(nome: string, cpf?: string | null): string[] {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  const vars: string[] = []
  if (parts.length >= 2) vars.push(`${parts[0]} ${parts[parts.length - 1]}`)
  if (parts.length >= 1) vars.push(parts[0])
  const cpfDigits = cpf?.replace(/\D/g, '') ?? ''
  if (cpfDigits.length === 11) {
    vars.push(cpf!.trim())
  } else if (parts.length >= 2) {
    vars.push(parts[parts.length - 1])
  }
  return vars.slice(0, 3)
}

// ─── Classificação de tribunais ─────────────────────────────────────────────

/** Retorna true se a sigla pertence a um tribunal estadual cível (TJ*). */
export function isTribunalCivel(sigla: string): boolean {
  return sigla.toUpperCase().startsWith('TJ')
}

// ─── Detecção de nomeação em snippet ────────────────────────────────────────

/**
 * Retorna true se o snippet provavelmente menciona nomeação de perito.
 * Intencionalmente permissivo — melhor salvar um falso positivo do que perder
 * uma nomeação real.
 */
export function isSnippetNomeacaoCivel(snippet: string): boolean {
  const lower = snippet.toLowerCase()
  return /per[íi]c|perito|vistori|nomea|designa|expert|laudo/.test(lower)
}

// ─── Filtro de citações (snippet + nome) ────────────────────────────────────

/** Filtra citações: v2_tribunal passa direto, v1 DJE precisa mencionar perícia + nome */
export function filtrarCitacoesPorNome(
  citacoes: (CitacaoResult & { fonte?: string })[],
  nomeCompleto: string,
): (CitacaoResult & { fonte?: string })[] {
  const nomeLower = nomeCompleto.toLowerCase()
  const primeiroUltimo = buildPrimeiroUltimo(nomeCompleto)

  return citacoes.filter((c) => {
    if (c.fonte === 'v2_tribunal') return true
    if (!isSnippetNomeacaoCivel(c.snippet)) return false
    const snipLower = c.snippet.toLowerCase()
    return snipLower.includes(nomeLower) || snipLower.includes(primeiroUltimo)
  })
}

/** Filtra citações V1 DJE: precisa mencionar perícia + nome */
export function filtrarCitacoesV1PorNome(
  citacoes: CitacaoResult[],
  nomeCompleto: string,
): CitacaoResult[] {
  const nomeLower = nomeCompleto.toLowerCase()
  const primeiroUltimo = buildPrimeiroUltimo(nomeCompleto)

  return citacoes.filter((c) => {
    if (!isSnippetNomeacaoCivel(c.snippet)) return false
    const snipLower = c.snippet.toLowerCase()
    return snipLower.includes(nomeLower) || snipLower.includes(primeiroUltimo)
  })
}

// ─── Deduplicação cross-fonte ───────────────────────────────────────────────

/** Deduplica citações por externalId, com v2 tendo prioridade sobre v1 para mesmo CNJ */
export function dedupCitacoes(
  citacoes: (CitacaoResult & { fonte?: string })[],
): (CitacaoResult & { fonte?: string })[] {
  const seen = new Set<string>()
  const seenCnj = new Set<string>()

  // Primeiro registra CNJs do v2
  for (const c of citacoes) {
    if (c.fonte === 'v2_tribunal' && c.numeroProcesso) {
      seenCnj.add(c.numeroProcesso)
    }
  }

  return citacoes.filter((c) => {
    if (seen.has(c.externalId)) return false
    seen.add(c.externalId)
    if (c.fonte !== 'v2_tribunal' && c.numeroProcesso && seenCnj.has(c.numeroProcesso)) return false
    return true
  })
}

/** Deduplica citações V1, excluindo CNJs já existentes (vindos do v2) */
export function dedupCitacoesV1(
  citacoes: CitacaoResult[],
  cnjsExistentes: Set<string>,
): CitacaoResult[] {
  const seen = new Set<string>()
  return citacoes.filter((c) => {
    if (seen.has(c.externalId)) return false
    seen.add(c.externalId)
    if (c.numeroProcesso && cnjsExistentes.has(c.numeroProcesso)) return false
    return true
  })
}

// ─── Erros legíveis ─────────────────────────────────────────────────────────

export function humanReadableError(e: unknown): string {
  if (e instanceof EscavadorError) {
    if (e.code === 401) return 'Token de API inválido. Verifique as configurações.'
    if (e.code === 402) return 'Saldo insuficiente na API Escavador.'
    if (e.code === 404) return 'Recurso não encontrado na API.'
    if (e.message.includes('422')) return 'Configuração já existe. Tente recarregar a página.'
    return 'Erro temporário. Tente novamente.'
  }
  if (e instanceof Error) {
    if (e.message.includes('422')) return 'Configuração já existe. Tente recarregar a página.'
    if (e.message.toLowerCase().includes('tribunal')) return e.message
    if (e.message.toLowerCase().includes('perfil')) return e.message
    return 'Erro inesperado. Tente novamente.'
  }
  return 'Erro inesperado. Tente novamente.'
}

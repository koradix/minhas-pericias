/**
 * Judit — Mappers de normalizacao.
 *
 * Centraliza TODA transformacao de dados Judit → formato interno PeriLaB.
 * Nenhum parsing espalhado em rotas ou componentes.
 *
 * Campos mapeados (Judit → PeriLaB):
 *   cnj               → cnj
 *   instance           → instance
 *   court              → tribunal
 *   court_branch       → vara
 *   subject            → assunto
 *   class_name         → classe
 *   judge              → juiz
 *   distribution_date  → dataDistribuicao
 *   last_update        → dataUltimaAtualizacao
 *   status             → status
 *   parties[].name     → partes[].nome
 *   parties[].role     → partes[].tipo
 *   parties[].document → partes[].documento
 *   movements[].id     → movimentacoes[].externalId
 *   movements[].date   → movimentacoes[].data
 *   movements[].description → movimentacoes[].descricao
 *   movements[].type   → movimentacoes[].tipo
 *   movements[].content → movimentacoes[].conteudo
 *   attachments[].id   → anexos[].externalId
 *   attachments[].name → anexos[].nome
 *   attachments[].type → anexos[].tipo
 *   attachments[].url  → anexos[].url
 *   attachments[].mime_type → anexos[].mimeType
 *   attachments[].is_public → anexos[].isPublic
 *   attachments[].download_available → anexos[].downloadAvailable
 *   attachments[].size_bytes → anexos[].tamanhoBytes
 *   attachments[].created_at → anexos[].data
 *
 * Para adaptar se a API variar: altere apenas este arquivo.
 */

import type {
  JuditLawsuit,
  NormalizedLawsuit,
  NormalizedParty,
  NormalizedMovement,
  NormalizedAttachment,
} from './types'

// ─── Helpers seguros ─────────────────────────────────────────────────────────

function safeStr(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim()
  return null
}

function safeDate(v: unknown): string | null {
  if (!v) return null
  const s = String(v).trim()
  if (!s) return null
  // Tenta parsear — se invalido, retorna o string original
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toISOString()
}

// ─── Party helpers ───────────────────────────────────────────────────────────

function findPartyByRole(parties: NormalizedParty[], ...roles: string[]): string | null {
  for (const role of roles) {
    const match = parties.find((p) =>
      p.tipo.toUpperCase().includes(role.toUpperCase())
    )
    if (match) return match.nome
  }
  return null
}

// ─── Main mapper ─────────────────────────────────────────────────────────────

export function normalizeLawsuit(j: JuditLawsuit): NormalizedLawsuit {
  const partes: NormalizedParty[] = (j.parties ?? []).map((p) => ({
    nome: p.name ?? 'Desconhecido',
    tipo: p.role ?? 'Parte',
    documento: safeStr(p.document),
  }))

  const movimentacoes: NormalizedMovement[] = (j.movements ?? []).map((m) => ({
    externalId: safeStr(m.id),
    data: safeDate(m.date) ?? new Date().toISOString(),
    descricao: m.description ?? '',
    tipo: safeStr(m.type),
    conteudo: safeStr(m.content),
    source: 'judit' as const,
  }))

  const anexos: NormalizedAttachment[] = (j.attachments ?? []).map((a) => ({
    externalId: a.id ?? '',
    nome: a.name ?? 'Documento sem nome',
    tipo: a.type ?? 'unknown',
    url: safeStr(a.url),
    mimeType: safeStr(a.mime_type),
    isPublic: a.is_public ?? false,
    downloadAvailable: a.download_available ?? false,
    tamanhoBytes: a.size_bytes ?? null,
    data: safeDate(a.created_at),
    source: 'judit' as const,
  }))

  return {
    cnj: j.cnj,
    instance: j.instance ?? null,
    tribunal: j.court ?? '',
    vara: j.court_branch ?? '',
    assunto: j.subject ?? '',
    classe: j.class_name ?? '',
    juiz: safeStr(j.judge),
    dataDistribuicao: safeDate(j.distribution_date),
    dataUltimaAtualizacao: safeDate(j.last_update),
    status: j.status ?? '',
    autor: findPartyByRole(partes, 'AUTOR', 'AUTORA', 'REQUERENTE'),
    reu: findPartyByRole(partes, 'REU', 'RÉU', 'REQUERIDO', 'REQUERIDA'),
    perito: findPartyByRole(partes, 'PERITO', 'PERITA'),
    partes,
    movimentacoes,
    anexos,
    raw: j,
  }
}

/**
 * Formata partes como string unica para campo `Pericia.partes`.
 * Ex: "AUTOR: João Silva × RÉU: Maria Santos"
 */
export function formatPartesString(partes: NormalizedParty[]): string {
  return partes
    .map((p) => `${p.tipo.toUpperCase()}: ${p.nome}`)
    .join(' × ')
}

/**
 * Judit — Mappers REAIS baseados no payload da API.
 *
 * response_data real:
 *   code            → cnj
 *   instance        → instance
 *   tribunal_acronym → tribunal
 *   courts[0].name  → vara
 *   subjects[0].name → assunto
 *   classifications[0].name → classe
 *   judge           → juiz
 *   distribution_date → dataDistribuicao
 *   updated_at      → dataUltimaAtualizacao
 *   status          → status
 *   parties[].name  → partes[].nome
 *   parties[].person_type → partes[].tipo
 *   parties[].main_document → partes[].documento
 *   steps[].step_id → movimentacoes[].externalId
 *   steps[].step_date → movimentacoes[].data
 *   steps[].content → movimentacoes[].descricao
 *   steps[].step_type → movimentacoes[].tipo
 *   attachments[].attachment_id → anexos[].externalId
 *   attachments[].attachment_name → anexos[].nome
 *   attachments[].extension → anexos[].tipo
 *   attachments[].attachment_date → anexos[].data
 */

import type {
  JuditLawsuit,
  NormalizedLawsuit,
  NormalizedParty,
  NormalizedMovement,
  NormalizedAttachment,
} from './types'

function safeStr(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim()
  return null
}

function safeDate(v: unknown): string | null {
  if (!v) return null
  const s = String(v).trim()
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toISOString()
}

function findPartyByRole(parties: NormalizedParty[], ...roles: string[]): string | null {
  for (const role of roles) {
    const match = parties.find((p) =>
      p.tipo.toUpperCase().includes(role.toUpperCase())
    )
    if (match) return match.nome
  }
  return null
}

export function normalizeLawsuit(j: JuditLawsuit): NormalizedLawsuit {
  const partes: NormalizedParty[] = (j.parties ?? []).map((p) => ({
    nome: p.name ?? 'Desconhecido',
    tipo: p.person_type ?? 'Parte',
    documento: safeStr(p.main_document),
  }))

  const movimentacoes: NormalizedMovement[] = (j.steps ?? []).map((s) => ({
    externalId: safeStr(s.step_id),
    data: safeDate(s.step_date) ?? new Date().toISOString(),
    descricao: s.content ?? '',
    tipo: safeStr(s.step_type),
    conteudo: null,
    source: 'judit' as const,
  }))

  const anexos: NormalizedAttachment[] = (j.attachments ?? []).map((a) => ({
    externalId: a.attachment_id ?? '',
    nome: a.attachment_name ?? 'Documento sem nome',
    tipo: a.extension ?? 'unknown',
    url: null, // URL construida no download via /lawsuits/{cnj}/{instance}/attachments/{id}
    mimeType: a.extension === 'pdf' ? 'application/pdf' : null,
    isPublic: !(a.private ?? false),
    downloadAvailable: a.status === 'done',
    tamanhoBytes: null,
    data: safeDate(a.attachment_date),
    source: 'judit' as const,
    providerStatus: a.status ?? null,
  }))

  // Pegar vara do courts array
  const vara = j.courts?.[0]?.name ?? j.courts?.[1]?.name ?? ''

  return {
    cnj: j.code,
    instance: j.instance ?? null,
    tribunal: j.tribunal_acronym ?? '',
    vara,
    assunto: j.subjects?.[0]?.name ?? '',
    classe: j.classifications?.[0]?.name ?? '',
    juiz: safeStr(j.judge),
    dataDistribuicao: safeDate(j.distribution_date),
    dataUltimaAtualizacao: safeDate(j.updated_at),
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

export function formatPartesString(partes: NormalizedParty[]): string {
  return partes
    .filter((p) => !['ADVOGADO', 'ADVOGADA'].includes(p.tipo.toUpperCase()))
    .map((p) => `${p.tipo.toUpperCase()}: ${p.nome}`)
    .join(' × ')
}

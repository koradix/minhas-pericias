import { describe, it, expect } from 'vitest'
import { EscavadorError, type CitacaoResult } from '@/lib/services/radar-provider'
import {
  normalizeName,
  buildPrimeiroUltimo,
  buildVariacoes,
  isTribunalCivel,
  isSnippetNomeacaoCivel,
  filtrarCitacoesPorNome,
  filtrarCitacoesV1PorNome,
  dedupCitacoes,
  dedupCitacoesV1,
  humanReadableError,
} from '@/lib/services/nomeacoes'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeCitacao(overrides: Partial<CitacaoResult & { fonte?: string }> = {}): CitacaoResult & { fonte?: string } {
  return {
    externalId: 'ext-1',
    diarioSigla: 'TJRJ',
    diarioNome: 'Diário TJRJ',
    diarioData: '2025-01-15',
    snippet: 'o perito foi nomeado para realizar vistoria',
    numeroProcesso: '0001234-56.2024.8.19.0001',
    linkCitacao: 'https://example.com/citacao/1',
    fonte: 'escavador',
    ...overrides,
  }
}

// ─── normalizeName ──────────────────────────────────────────────────────────

describe('normalizeName', () => {
  it('remove acentos e converte para lowercase', () => {
    expect(normalizeName('José da SILVA')).toBe('jose da silva')
  })

  it('normaliza espaços múltiplos e trim', () => {
    expect(normalizeName('  Maria   Aparecida  ')).toBe('maria aparecida')
  })

  it('retorna string vazia para string vazia', () => {
    expect(normalizeName('')).toBe('')
  })

  it('trata caracteres com acento complexo (tilde, cedilha)', () => {
    expect(normalizeName('JOÃO GONÇALVES')).toBe('joao goncalves')
  })
})

// ─── buildPrimeiroUltimo ────────────────────────────────────────────────────

describe('buildPrimeiroUltimo', () => {
  it('retorna primeiro + último para 3+ nomes', () => {
    expect(buildPrimeiroUltimo('José Carlos da Silva')).toBe('josé silva')
  })

  it('retorna nome completo lowercase para 2 nomes', () => {
    expect(buildPrimeiroUltimo('José Silva')).toBe('josé silva')
  })

  it('retorna nome completo lowercase para 1 nome', () => {
    expect(buildPrimeiroUltimo('José')).toBe('josé')
  })

  it('trata string vazia', () => {
    expect(buildPrimeiroUltimo('')).toBe('')
  })
})

// ─── buildVariacoes ─────────────────────────────────────────────────────────

describe('buildVariacoes', () => {
  it('gera variações primeiro+último, primeiro, último para nome sem CPF', () => {
    const result = buildVariacoes('José Carlos da Silva')
    expect(result).toEqual(['José Silva', 'José', 'Silva'])
  })

  it('inclui CPF quando fornecido com 11 dígitos', () => {
    const result = buildVariacoes('José Silva', '123.456.789-00')
    expect(result).toEqual(['José Silva', 'José', '123.456.789-00'])
  })

  it('retorna último nome se CPF inválido', () => {
    const result = buildVariacoes('José Silva', '123')
    expect(result).toEqual(['José Silva', 'José', 'Silva'])
  })

  it('retorna max 3 variações', () => {
    const result = buildVariacoes('A B C D E', '12345678901')
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('lida com nome único', () => {
    const result = buildVariacoes('José')
    expect(result).toEqual(['José'])
  })
})

// ─── isTribunalCivel ────────────────────────────────────────────────────────

describe('isTribunalCivel', () => {
  it('retorna true para TJRJ', () => {
    expect(isTribunalCivel('TJRJ')).toBe(true)
  })

  it('retorna true para tjsp (case insensitive)', () => {
    expect(isTribunalCivel('tjsp')).toBe(true)
  })

  it('retorna false para TST', () => {
    expect(isTribunalCivel('TST')).toBe(false)
  })

  it('retorna false para TRT1', () => {
    expect(isTribunalCivel('TRT1')).toBe(false)
  })

  it('retorna false para string vazia', () => {
    expect(isTribunalCivel('')).toBe(false)
  })
})

// ─── isSnippetNomeacaoCivel ─────────────────────────────────────────────────

describe('isSnippetNomeacaoCivel', () => {
  it('detecta menção a perito', () => {
    expect(isSnippetNomeacaoCivel('o perito foi nomeado para realizar vistoria')).toBe(true)
  })

  it('detecta menção a perícia com acento', () => {
    expect(isSnippetNomeacaoCivel('DETERMINO A REALIZAÇÃO DE PERÍCIA TÉCNICA')).toBe(true)
  })

  it('detecta menção a pericia sem acento', () => {
    expect(isSnippetNomeacaoCivel('pericia de engenharia')).toBe(true)
  })

  it('detecta menção a vistoria', () => {
    expect(isSnippetNomeacaoCivel('agendar vistoria no imóvel')).toBe(true)
  })

  it('detecta menção a laudo', () => {
    expect(isSnippetNomeacaoCivel('apresentar o laudo em 30 dias')).toBe(true)
  })

  it('detecta menção a nomeação', () => {
    expect(isSnippetNomeacaoCivel('nomeação do expert judicial')).toBe(true)
  })

  it('retorna false para snippet sem termos relevantes', () => {
    expect(isSnippetNomeacaoCivel('o réu foi condenado ao pagamento de indenização')).toBe(false)
  })

  it('retorna false para string vazia', () => {
    expect(isSnippetNomeacaoCivel('')).toBe(false)
  })
})

// ─── filtrarCitacoesPorNome ─────────────────────────────────────────────────

describe('filtrarCitacoesPorNome', () => {
  it('deixa v2_tribunal passar sem filtro de snippet', () => {
    const citacoes = [
      makeCitacao({ fonte: 'v2_tribunal', snippet: 'qualquer coisa sem termos relevantes' }),
    ]
    const result = filtrarCitacoesPorNome(citacoes, 'José Silva')
    expect(result).toHaveLength(1)
  })

  it('filtra v1 que não menciona perícia', () => {
    const citacoes = [
      makeCitacao({ fonte: 'escavador', snippet: 'condenação do réu por danos morais' }),
    ]
    const result = filtrarCitacoesPorNome(citacoes, 'José Silva')
    expect(result).toHaveLength(0)
  })

  it('filtra v1 que menciona perícia mas não o nome do perito', () => {
    const citacoes = [
      makeCitacao({ fonte: 'escavador', snippet: 'o perito Carlos Mendes foi nomeado' }),
    ]
    const result = filtrarCitacoesPorNome(citacoes, 'José Silva')
    expect(result).toHaveLength(0)
  })

  it('aceita v1 que menciona perícia + nome completo', () => {
    const citacoes = [
      makeCitacao({ fonte: 'escavador', snippet: 'o perito José da Silva foi nomeado para vistoria' }),
    ]
    const result = filtrarCitacoesPorNome(citacoes, 'José da Silva')
    expect(result).toHaveLength(1)
  })

  it('aceita v1 pelo primeiro+último nome (3+ nomes)', () => {
    const citacoes = [
      makeCitacao({ fonte: 'escavador', snippet: 'o perito josé silva foi designado para perícia' }),
    ]
    const result = filtrarCitacoesPorNome(citacoes, 'José Carlos da Silva')
    expect(result).toHaveLength(1)
  })
})

// ─── filtrarCitacoesV1PorNome ───────────────────────────────────────────────

describe('filtrarCitacoesV1PorNome', () => {
  it('aceita citação com termo de perícia + nome', () => {
    const citacoes = [
      makeCitacao({ snippet: 'nomeação do perito josé silva para laudo' }),
    ]
    const result = filtrarCitacoesV1PorNome(citacoes, 'José Silva')
    expect(result).toHaveLength(1)
  })

  it('rejeita citação sem termo de perícia', () => {
    const citacoes = [
      makeCitacao({ snippet: 'josé silva compareceu na audiência de instrução' }),
    ]
    const result = filtrarCitacoesV1PorNome(citacoes, 'José Silva')
    expect(result).toHaveLength(0)
  })
})

// ─── dedupCitacoes ──────────────────────────────────────────────────────────

describe('dedupCitacoes', () => {
  it('remove duplicatas por externalId', () => {
    const citacoes = [
      makeCitacao({ externalId: 'a' }),
      makeCitacao({ externalId: 'a' }),
      makeCitacao({ externalId: 'b' }),
    ]
    const result = dedupCitacoes(citacoes)
    expect(result).toHaveLength(2)
  })

  it('v2 tem prioridade: remove v1 com mesmo CNJ', () => {
    const citacoes = [
      makeCitacao({ externalId: 'v2-1', fonte: 'v2_tribunal', numeroProcesso: '123' }),
      makeCitacao({ externalId: 'v1-1', fonte: 'escavador', numeroProcesso: '123' }),
    ]
    const result = dedupCitacoes(citacoes)
    expect(result).toHaveLength(1)
    expect(result[0].externalId).toBe('v2-1')
  })

  it('mantém v1 se CNJ diferente do v2', () => {
    const citacoes = [
      makeCitacao({ externalId: 'v2-1', fonte: 'v2_tribunal', numeroProcesso: '123' }),
      makeCitacao({ externalId: 'v1-1', fonte: 'escavador', numeroProcesso: '456' }),
    ]
    const result = dedupCitacoes(citacoes)
    expect(result).toHaveLength(2)
  })

  it('mantém v1 sem CNJ', () => {
    const citacoes = [
      makeCitacao({ externalId: 'v2-1', fonte: 'v2_tribunal', numeroProcesso: '123' }),
      makeCitacao({ externalId: 'v1-1', fonte: 'escavador', numeroProcesso: null }),
    ]
    const result = dedupCitacoes(citacoes)
    expect(result).toHaveLength(2)
  })

  it('retorna vazio para lista vazia', () => {
    expect(dedupCitacoes([])).toHaveLength(0)
  })
})

// ─── dedupCitacoesV1 ────────────────────────────────────────────────────────

describe('dedupCitacoesV1', () => {
  it('remove citações com CNJ já existente no v2', () => {
    const citacoes = [
      makeCitacao({ externalId: 'v1-1', numeroProcesso: '123' }),
      makeCitacao({ externalId: 'v1-2', numeroProcesso: '456' }),
    ]
    const cnjsV2 = new Set(['123'])
    const result = dedupCitacoesV1(citacoes, cnjsV2)
    expect(result).toHaveLength(1)
    expect(result[0].externalId).toBe('v1-2')
  })

  it('mantém citações sem CNJ', () => {
    const citacoes = [
      makeCitacao({ externalId: 'v1-1', numeroProcesso: null }),
    ]
    const result = dedupCitacoesV1(citacoes, new Set(['123']))
    expect(result).toHaveLength(1)
  })

  it('remove duplicatas por externalId', () => {
    const citacoes = [
      makeCitacao({ externalId: 'same', numeroProcesso: '999' }),
      makeCitacao({ externalId: 'same', numeroProcesso: '999' }),
    ]
    const result = dedupCitacoesV1(citacoes, new Set())
    expect(result).toHaveLength(1)
  })
})

// ─── humanReadableError ─────────────────────────────────────────────────────

describe('humanReadableError', () => {
  it('mapeia EscavadorError 401 para mensagem sobre token', () => {
    const err = new EscavadorError(401, 'Unauthorized')
    expect(humanReadableError(err)).toContain('Token de API inválido')
  })

  it('mapeia EscavadorError 402 para mensagem sobre saldo', () => {
    const err = new EscavadorError(402, 'Payment Required')
    expect(humanReadableError(err)).toContain('Saldo insuficiente')
  })

  it('mapeia EscavadorError 404 para mensagem sobre recurso', () => {
    const err = new EscavadorError(404, 'Not Found')
    expect(humanReadableError(err)).toContain('Recurso não encontrado')
  })

  it('mapeia EscavadorError com 422 na mensagem', () => {
    const err = new EscavadorError(500, 'Error 422 entity exists')
    expect(humanReadableError(err)).toContain('Configuração já existe')
  })

  it('mapeia EscavadorError genérico para "Erro temporário"', () => {
    const err = new EscavadorError(500, 'Internal server error')
    expect(humanReadableError(err)).toContain('Erro temporário')
  })

  it('mapeia Error padrão com "tribunal" para mensagem original', () => {
    const err = new Error('Tribunal TJRJ não suportado')
    expect(humanReadableError(err)).toBe('Tribunal TJRJ não suportado')
  })

  it('mapeia Error padrão genérico para "Erro inesperado"', () => {
    const err = new Error('something broke')
    expect(humanReadableError(err)).toContain('Erro inesperado')
  })

  it('mapeia valor não-Error para "Erro inesperado"', () => {
    expect(humanReadableError('string error')).toContain('Erro inesperado')
    expect(humanReadableError(null)).toContain('Erro inesperado')
    expect(humanReadableError(42)).toContain('Erro inesperado')
  })
})

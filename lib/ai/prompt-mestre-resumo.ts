// ─── Prompt Mestre — Resumo de Processo ───────────────────────────────────────
// Dois schemas coexistem:
//   V1 (legacy)  — AnaliseProcesso        → processSummary antigos
//   V2 (current) — AnaliseProcessoV2      → processSummary novos
//
// Usado em: app/api/nomeacoes/upload + lib/actions/nomeacoes-intake (gerarResumo)

// ─── V1 Type (legacy — mantido para backwards-compat) ─────────────────────────

export interface AnaliseProcesso {
  resumoProcesso: {
    tipoAcao: string
    partes: string
    objetoPericia: string
    areaTecnica: string
  }
  nomeacaoDespacho: {
    peritoNomeado: boolean
    dataNomeacao: string | null
    determinacaoJuiz: string
    quesitos: string[]
    pontoCriticos: string[]
  }
  aceiteHonorarios: {
    prazoAceite: string | null
    complexidade: 'baixa' | 'média' | 'alta'
    estrategiaHonorarios: string
    justificativasAumento: string[]
  }
  prazos: {
    prazoAceite: string | null
    prazoLaudo: string | null
    outrosPrazos: string[]
  }
  localPericia: {
    enderecoCompleto: string | null
    cidadeEstado: string | null
    necessitaDeslocamento: boolean
    custosLogisticos: string | null
  }
  necessidadesTecnicas: {
    tipoVistoria: string
    equipamentos: string[]
    assistentesTecnicos: string | null
    coletaDados: string[]
  }
  riscos: {
    tecnico: string[]
    juridico: string[]
    informacoesFaltando: string[]
    conflitos: string[]
  }
  checklist: string[]
  // Flat fields
  numeroProcesso: string | null
  tribunal: string | null
  vara: string | null
  autor: string | null
  reu: string | null
  enderecoVistoria: string | null
  tipoPericia: string | null
}

// ─── V2 Type (current) ────────────────────────────────────────────────────────

export interface AnaliseProcessoV2 {
  analysis_version: '2.0'
  language: 'pt-BR'

  // ── Narrative blocks ──────────────────────────────────────────────────────
  partes: {
    autor: string | null
    reu: string | null
    terceiros_relevantes: string[]
  }
  tipo_processo: {
    classe: string | null
    natureza: string | null
  }
  objeto_processo: {
    resumo_curto: string | null
  }
  peticao_inicial: {
    paragrafo_1: string | null
    paragrafo_2: string | null
    paragrafo_3: string | null
    paragrafo_4: string | null
  }
  contestacao: {
    paragrafo_1: string | null
    paragrafo_2: string | null
    paragrafo_3: string | null
    paragrafo_4: string | null
  }
  replica: {
    paragrafo_1: string | null
    paragrafo_2: string | null
    paragrafo_3: string | null
    paragrafo_4: string | null
  }
  ponto_controvertido: {
    resumo: string | null
  }
  opiniao_tecnica_breve: {
    resumo: string | null
  }
  proximos_passos: string[]

  // ── Operacional (for PropostaTab + DB extraction) ─────────────────────────
  operacional: {
    numeroProcesso: string | null
    tribunal: string | null
    vara: string | null
    enderecoVistoria: string | null
    tipoPericia: string | null
    aceiteHonorarios: {
      prazoAceite: string | null
      complexidade: 'baixa' | 'média' | 'alta'
      estrategiaHonorarios: string | null
      justificativasAumento: string[]
    }
    prazos: {
      prazoAceite: string | null
      prazoLaudo: string | null
      outrosPrazos: string[]
    }
    localPericia: {
      enderecoCompleto: string | null
      cidadeEstado: string | null
      necessitaDeslocamento: boolean
      custosLogisticos: string | null
    }
    nomeacaoDespacho: {
      determinacaoJuiz: string | null
      dataNomeacao: string | null
      peritoNomeado: boolean
      quesitos: string[]
      pontoCriticos: string[]
    }
  }
}

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isAnaliseProcessoV2(data: unknown): data is AnaliseProcessoV2 {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).analysis_version === '2.0'
  )
}

export function isAnaliseProcesso(data: unknown): data is AnaliseProcesso {
  if (isAnaliseProcessoV2(data)) return false
  return (
    typeof data === 'object' &&
    data !== null &&
    'resumoProcesso' in data &&
    'checklist' in data
  )
}

// ─── Adapter: V2 → V1 shape (for PropostaTab backwards-compat) ───────────────

export function toAnaliseCompativel(v2: AnaliseProcessoV2): AnaliseProcesso {
  const op = v2.operacional

  return {
    resumoProcesso: {
      tipoAcao:      v2.tipo_processo.natureza ?? v2.tipo_processo.classe ?? '',
      partes:        [v2.partes.autor, v2.partes.reu].filter(Boolean).join(' × '),
      objetoPericia: v2.objeto_processo.resumo_curto ?? '',
      areaTecnica:   op.tipoPericia ?? '',
    },
    nomeacaoDespacho: {
      peritoNomeado:    op.nomeacaoDespacho.peritoNomeado,
      dataNomeacao:     op.nomeacaoDespacho.dataNomeacao,
      determinacaoJuiz: op.nomeacaoDespacho.determinacaoJuiz ?? '',
      quesitos:         op.nomeacaoDespacho.quesitos,
      pontoCriticos:    op.nomeacaoDespacho.pontoCriticos,
    },
    aceiteHonorarios: {
      prazoAceite:          op.aceiteHonorarios.prazoAceite,
      complexidade:         op.aceiteHonorarios.complexidade,
      estrategiaHonorarios: op.aceiteHonorarios.estrategiaHonorarios ?? '',
      justificativasAumento: op.aceiteHonorarios.justificativasAumento,
    },
    prazos: op.prazos,
    localPericia: op.localPericia,
    necessidadesTecnicas: {
      tipoVistoria:        '',
      equipamentos:        [],
      assistentesTecnicos: null,
      coletaDados:         [],
    },
    riscos: {
      tecnico:             [],
      juridico:            [],
      informacoesFaltando: [],
      conflitos:           [],
    },
    checklist:      [],
    numeroProcesso: op.numeroProcesso,
    tribunal:       op.tribunal,
    vara:           op.vara,
    autor:          v2.partes.autor,
    reu:            v2.partes.reu,
    enderecoVistoria: op.enderecoVistoria,
    tipoPericia:    op.tipoPericia,
  }
}

// ─── V1 System Prompt (legacy — kept for gerarResumo fallback) ────────────────

export const SYSTEM_PROMPT =
  'Você é um especialista em leitura e análise de documentos processuais judiciais brasileiros.\n' +
  'Sua tarefa é extrair informações de processos judiciais — incluindo documentos escaneados, PDFs de baixa qualidade e imagens de páginas.\n\n' +
  'INSTRUÇÕES DE LEITURA (OCR):\n' +
  '- Leia TODAS as páginas do documento visualmente, incluindo cabeçalhos, rodapés e carimbos\n' +
  '- O número do processo segue o padrão CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO (ex: 0845912-13.2022.8.19.0001)\n' +
  '- Partes estão marcadas como: AUTOR/REQUERENTE/EXEQUENTE vs RÉU/REQUERIDO/EXECUTADO\n' +
  '- O nome do perito nomeado aparece após termos como "nomeio", "designo", "fica nomeado"\n' +
  '- Prazos aparecem como "no prazo de X dias", "até DD/MM/AAAA", "em X dias úteis"\n' +
  '- Endereços de vistoria aparecem próximos a "imóvel", "local", "endereço do bem"\n' +
  '- Quesitos são perguntas numeradas dirigidas ao perito\n\n' +
  'REGRA CRÍTICA: NUNCA retorne "Não identificado" se a informação existir no documento, mesmo que parcialmente legível.\n' +
  'Se um campo não existir de fato no documento, use null.\n' +
  'Se existir mas estiver parcialmente ilegível, retorne o que conseguiu ler com "[ilegível]" na parte incerta.\n\n' +
  'Retorne APENAS JSON válido, sem texto adicional, sem markdown.'

// ─── V2 System Prompt (current) ───────────────────────────────────────────────

export const SYSTEM_PROMPT_V2 =
  'Você é um assistente técnico de análise processual para apoio a peritos judiciais.\n\n' +
  'Sua função: analisar o processo de forma concisa e útil para o perito entender rapidamente o caso.\n\n' +
  'Estrutura obrigatória da análise:\n' +
  '1. Partes (autor e réu)\n' +
  '2. Tipo de processo\n' +
  '3. Objeto (1 frase curta e direta)\n' +
  '4. Petição inicial — 4 parágrafos curtos: (1) fatos, (2) fundamentos jurídicos, (3) pedidos, (4) pedido de urgência se houver\n' +
  '5. Contestação — 4 parágrafos: (1) defesa principal, (2) impugnação dos fatos, (3) teses jurídicas, (4) pedidos da contestação\n' +
  '6. Réplica — 4 parágrafos se houver, senão null\n' +
  '7. Ponto controvertido — 1 a 2 frases objetivas sobre o que precisa ser provado\n' +
  '8. Breve opinião técnica — leitura operacional: tipo de perícia (documental/presencial), fragilidades, complexidade\n' +
  '9. Próximos passos — máximo 3 ações práticas e diretas para o perito\n\n' +
  'Regras rígidas:\n' +
  '1. Retorne apenas JSON válido, sem texto adicional, sem markdown.\n' +
  '2. Não invente fatos — baseie-se estritamente no documento.\n' +
  '3. Se algo não existir no documento, use null.\n' +
  '4. Substitua sempre "infirmar" por "invalidar".\n' +
  '5. Cada parágrafo deve ser curto — não transcreva, resuma.\n' +
  '6. Não repita os mesmos fatos entre seções.\n' +
  '7. Número do processo segue padrão CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO\n' +
  '8. Leia todas as páginas, cabeçalhos, rodapés e carimbos.\n\n' +
  'Retorne APENAS o JSON, sem mais nada.'

// ─── V2 JSON Template ─────────────────────────────────────────────────────────

const JSON_TEMPLATE_V2 = `Retorne SOMENTE este JSON (sem texto adicional):
{
  "analysis_version": "2.0",
  "language": "pt-BR",
  "partes": {
    "autor": "nome do autor/requerente ou null",
    "reu": "nome do réu/requerido ou null",
    "terceiros_relevantes": ["terceiros relevantes, se houver"]
  },
  "tipo_processo": {
    "classe": "classe processual (ex: Procedimento Comum Cível) ou null",
    "natureza": "natureza jurídica resumida (ex: Ação de Indenização) ou null"
  },
  "objeto_processo": {
    "resumo_curto": "1 frase curta e direta: o que o autor quer e por quê"
  },
  "peticao_inicial": {
    "paragrafo_1": "contexto e narrativa dos fatos",
    "paragrafo_2": "fundamentos jurídicos",
    "paragrafo_3": "pedidos formulados",
    "paragrafo_4": "pretensão prática ou pedido de urgência, se houver"
  },
  "contestacao": {
    "paragrafo_1": "linha de defesa principal",
    "paragrafo_2": "impugnações aos fatos",
    "paragrafo_3": "teses jurídicas levantadas",
    "paragrafo_4": "pedidos da contestação (improcedência, etc.)"
  },
  "replica": {
    "paragrafo_1": "resposta à defesa principal",
    "paragrafo_2": "impugnação dos argumentos da contestação",
    "paragrafo_3": "reforço do pedido original",
    "paragrafo_4": "delimitação do conflito após a réplica"
  },
  "ponto_controvertido": {
    "resumo": "o que exatamente precisa ser provado ou esclarecido — 1 a 2 frases objetivas"
  },
  "opiniao_tecnica_breve": {
    "resumo": "leitura operacional: se o caso é documental ou depende de vistoria, se há fragilidade probatória, se o ponto está bem delimitado, se faltam documentos, se a perícia parece simples/média/complexa"
  },
  "proximos_passos": [
    "ação prática 1 voltada ao perito",
    "ação prática 2",
    "ação prática 3"
  ],
  "operacional": {
    "numeroProcesso": "número CNJ ou null",
    "tribunal": "sigla do tribunal ou null",
    "vara": "nome da vara ou null",
    "enderecoVistoria": "endereço físico do imóvel/local ou null",
    "tipoPericia": "tipo de perícia ou null",
    "aceiteHonorarios": {
      "prazoAceite": "prazo de aceite ou null",
      "complexidade": "baixa | média | alta",
      "estrategiaHonorarios": "parágrafo sobre honorários",
      "justificativasAumento": ["fatores que justificam cobrar mais"]
    },
    "prazos": {
      "prazoAceite": "prazo ou null",
      "prazoLaudo": "prazo ou null",
      "outrosPrazos": []
    },
    "localPericia": {
      "enderecoCompleto": "endereço completo ou null",
      "cidadeEstado": "cidade/UF ou null",
      "necessitaDeslocamento": true,
      "custosLogisticos": null
    },
    "nomeacaoDespacho": {
      "determinacaoJuiz": "resumo do despacho de nomeação ou null",
      "dataNomeacao": "data ou null",
      "peritoNomeado": true,
      "quesitos": ["lista completa de quesitos"],
      "pontoCriticos": []
    }
  }
}`

// ─── V1 JSON Template (legacy — kept for gerarResumo fallback) ────────────────

const JSON_TEMPLATE =
  'Retorne JSON:\n' +
  '{\n' +
  '  "resumoProcesso": {\n' +
  '    "tipoAcao": "tipo de ação judicial",\n' +
  '    "partes": "partes envolvidas (autor e réu)",\n' +
  '    "objetoPericia": "objeto da perícia",\n' +
  '    "areaTecnica": "área técnica (ex: elétrica, hidráulica, médica)"\n' +
  '  },\n' +
  '  "nomeacaoDespacho": {\n' +
  '    "peritoNomeado": true,\n' +
  '    "dataNomeacao": "data ou null",\n' +
  '    "determinacaoJuiz": "TRANSCRIÇÃO COMPLETA do despacho/decisão judicial",\n' +
  '    "quesitos": ["lista numerada COMPLETA de todos os quesitos formulados"],\n' +
  '    "pontoCriticos": ["Prazo de aceite: X dias", "Honorários: R$ X ou a combinar"]\n' +
  '  },\n' +
  '  "aceiteHonorarios": {\n' +
  '    "prazoAceite": "prazo de aceite ou null",\n' +
  '    "complexidade": "baixa | média | alta",\n' +
  '    "estrategiaHonorarios": "parágrafo sobre honorários",\n' +
  '    "justificativasAumento": ["fatores que justificam cobrar mais"]\n' +
  '  },\n' +
  '  "prazos": { "prazoAceite": "prazo ou null", "prazoLaudo": "prazo ou null", "outrosPrazos": [] },\n' +
  '  "localPericia": { "enderecoCompleto": "endereço ou null", "cidadeEstado": "cidade/estado ou null", "necessitaDeslocamento": true, "custosLogisticos": "estimativa ou null" },\n' +
  '  "necessidadesTecnicas": { "tipoVistoria": "tipo", "equipamentos": [], "assistentesTecnicos": null, "coletaDados": [] },\n' +
  '  "riscos": { "tecnico": [], "juridico": [], "informacoesFaltando": [], "conflitos": [] },\n' +
  '  "checklist": ["Aceitar nomeação", "Elaborar proposta de honorários", "Agendar vistoria"],\n' +
  '  "numeroProcesso": "número CNJ ou null",\n' +
  '  "tribunal": "sigla do tribunal ou null",\n' +
  '  "vara": "nome da vara ou null",\n' +
  '  "autor": "nome do autor ou null",\n' +
  '  "reu": "nome do réu ou null",\n' +
  '  "enderecoVistoria": "endereço físico ou null",\n' +
  '  "tipoPericia": "tipo de perícia ou null"\n' +
  '}'

// ─── V2 Prompt builders ───────────────────────────────────────────────────────

export function buildPdfUserPromptV2(contexto?: string): string {
  return (
    'O documento acima é um processo judicial brasileiro em PDF.\n' +
    (contexto ? `Contexto já conhecido: ${contexto}\n\n` : '\n') +
    'PASSOS:\n' +
    '1. Leia visualmente TODAS as páginas — o documento pode ser escaneado ou de baixa qualidade\n' +
    '2. Identifique: número do processo (CNJ), tribunal, vara, partes, tipo de ação\n' +
    '3. Localize e resuma: petição inicial, contestação, réplica (se houver)\n' +
    '4. Identifique: quesitos periciais, prazos, endereço da vistoria\n' +
    '5. Extraia o ponto controvertido central\n' +
    '6. Se um campo não existir no documento, use null\n\n' +
    JSON_TEMPLATE_V2
  )
}

export function buildUserPromptV2(texto: string): string {
  const conteudo = texto.slice(0, 30000)
  return (
    'Analise o documento do processo judicial abaixo e retorne JSON com exatamente esta estrutura:\n\n' +
    `<processo>\n${conteudo}\n</processo>\n\n` +
    JSON_TEMPLATE_V2
  )
}

// ─── V1 Prompt builders (legacy) ─────────────────────────────────────────────

export function buildPdfUserPrompt(contexto?: string): string {
  return (
    'O documento acima é um processo judicial brasileiro em PDF.\n' +
    (contexto ? `Contexto já conhecido: ${contexto}\n\n` : '\n') +
    'PASSOS:\n' +
    '1. Leia visualmente TODAS as páginas — o documento pode ser escaneado ou de baixa qualidade\n' +
    '2. Procure na capa/cabeçalho: número do processo (formato CNJ), tribunal, vara, comarca\n' +
    '3. Procure nas primeiras páginas: nomes das partes (autor, réu), tipo de ação\n' +
    '4. Procure no despacho/decisão: nomeação do perito, quesitos, prazos\n' +
    '5. Procure em qualquer página: endereço do imóvel/local da perícia\n' +
    '6. Se um campo estiver ilegível mas parcialmente visível, retorne o que conseguir + "[ilegível]"\n' +
    '7. Use null apenas se a informação realmente não existir no documento\n\n' +
    JSON_TEMPLATE
  )
}

export function buildUserPrompt(texto: string): string {
  const conteudo = texto.slice(0, 30000)
  return (
    'Analise o documento do processo judicial abaixo e retorne JSON com exatamente esta estrutura:\n\n' +
    `<processo>\n${conteudo}\n</processo>\n\n` +
    JSON_TEMPLATE
  )
}

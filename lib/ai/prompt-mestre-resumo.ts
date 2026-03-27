// ─── Prompt Mestre — Resumo de Processo ───────────────────────────────────────
// Prompt especializado para análise completa de documentos processuais judiciais.
// Usado em: app/api/nomeacoes/upload e lib/actions/nomeacoes-intake (gerarResumo)

// ─── Type ─────────────────────────────────────────────────────────────────────

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
  // Campos planos para identificação do processo
  numeroProcesso: string | null
  tribunal: string | null
  vara: string | null
  autor: string | null
  reu: string | null
  enderecoVistoria: string | null
  tipoPericia: string | null
}

// ─── Type guard ───────────────────────────────────────────────────────────────

export function isAnaliseProcesso(data: unknown): data is AnaliseProcesso {
  return (
    typeof data === 'object' &&
    data !== null &&
    'resumoProcesso' in data &&
    'checklist' in data
  )
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT =
  'Você é um perito judicial experiente, com ampla experiência em análise de processos, ' +
  'elaboração de propostas de honorários e organização de perícias técnicas.\n' +
  'Você é direto, prático e focado em identificar o que realmente importa para execução da perícia.\n' +
  'Analise o documento do processo fornecido e extraia todas as informações relevantes.\n' +
  'Retorne APENAS JSON válido, sem texto adicional.'

// Template JSON reutilizado por buildUserPrompt e buildPdfUserPrompt
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
  '    "determinacaoJuiz": "o que o juiz determinou",\n' +
  '    "quesitos": ["lista de quesitos ou []"],\n' +
  '    "pontoCriticos": ["pontos críticos definidos pelo juiz"]\n' +
  '  },\n' +
  '  "aceiteHonorarios": {\n' +
  '    "prazoAceite": "prazo ou null",\n' +
  '    "complexidade": "baixa | média | alta",\n' +
  '    "estrategiaHonorarios": "sugestão de estratégia",\n' +
  '    "justificativasAumento": ["pontos que justificam aumento de honorários"]\n' +
  '  },\n' +
  '  "prazos": {\n' +
  '    "prazoAceite": "prazo ou null",\n' +
  '    "prazoLaudo": "prazo ou null",\n' +
  '    "outrosPrazos": ["outros prazos relevantes"]\n' +
  '  },\n' +
  '  "localPericia": {\n' +
  '    "enderecoCompleto": "endereço ou null",\n' +
  '    "cidadeEstado": "cidade/estado ou null",\n' +
  '    "necessitaDeslocamento": true,\n' +
  '    "custosLogisticos": "estimativa ou null"\n' +
  '  },\n' +
  '  "necessidadesTecnicas": {\n' +
  '    "tipoVistoria": "tipo necessário",\n' +
  '    "equipamentos": ["equipamentos necessários"],\n' +
  '    "assistentesTecnicos": "necessidade ou null",\n' +
  '    "coletaDados": ["dados específicos a coletar"]\n' +
  '  },\n' +
  '  "riscos": {\n' +
  '    "tecnico": ["riscos técnicos"],\n' +
  '    "juridico": ["riscos jurídicos"],\n' +
  '    "informacoesFaltando": ["informações ausentes no processo"],\n' +
  '    "conflitos": ["possíveis conflitos"]\n' +
  '  },\n' +
  '  "checklist": ["Aceitar nomeação", "Elaborar proposta de honorários", "Agendar vistoria"],\n' +
  '  "numeroProcesso": "número CNJ ou null",\n' +
  '  "tribunal": "sigla do tribunal ou null",\n' +
  '  "vara": "nome da vara ou null",\n' +
  '  "autor": "nome do autor ou null",\n' +
  '  "reu": "nome do réu ou null",\n' +
  '  "enderecoVistoria": "endereço físico ou null",\n' +
  '  "tipoPericia": "tipo de perícia ou null"\n' +
  '}'

/** Para PDF: o conteúdo já vem como DocumentBlockParam — não wrapa em <processo> */
export function buildPdfUserPrompt(contexto?: string): string {
  return (
    'O documento do processo judicial foi fornecido acima como PDF.\n' +
    (contexto ? `Contexto adicional: ${contexto}\n\n` : '\n') +
    'Leia o documento completo e ' + JSON_TEMPLATE
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

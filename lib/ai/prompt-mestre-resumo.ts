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

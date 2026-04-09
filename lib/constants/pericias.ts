// ─── Taxonomia de especialidades para peritos judiciais ────────────────────────

export const AREAS_PRINCIPAIS = [
  { id: 'engenharia',       label: 'Engenharia' },
  { id: 'contabilidade',    label: 'Contabilidade e Finanças' },
  { id: 'medicina',         label: 'Medicina' },
  { id: 'imobiliario',      label: 'Avaliação Imobiliária' },
  { id: 'trabalhista',      label: 'Trabalhista' },
  { id: 'meio_ambiente',    label: 'Meio Ambiente' },
  { id: 'informatica',      label: 'Informática e TI' },
  { id: 'grafotecnia',      label: 'Grafotecnia e Documentoscopia' },
  { id: 'quimica',          label: 'Química e Farmácia' },
  { id: 'psicologia',       label: 'Psicologia' },
  { id: 'agronegocio',      label: 'Agronegócio' },
  { id: 'biologia',         label: 'Biologia e Genética' },
  { id: 'transito',         label: 'Trânsito e Acidentes' },
  { id: 'seguros',          label: 'Seguros e Atuária' },
  { id: 'traducao',         label: 'Tradução e Interpretação' },
  { id: 'outros',           label: 'Outros' },
] as const

export type AreaPrincipalId = typeof AREAS_PRINCIPAIS[number]['id']

// ─── Especialidades por área ───────────────────────────────────────────────────

export const ESPECIALIDADES_POR_AREA: Record<AreaPrincipalId, string[]> = {
  engenharia: [
    'Engenharia Civil',
    'Engenharia Elétrica',
    'Engenharia Mecânica',
    'Engenharia de Produção',
    'Engenharia Estrutural',
    'Engenharia de Solos e Fundações',
    'Engenharia Hidráulica',
    'Engenharia Sanitária',
    'Engenharia de Telecomunicações',
    'Engenharia de Segurança do Trabalho',
    'Vistoria e Avaliação de Obras',
    'Apuração de Danos em Construção',
  ],
  contabilidade: [
    'Perícia Contábil',
    'Análise de Balanços',
    'Apuração de Haveres',
    'Avaliação de Empresas (Goodwill)',
    'Perícia em Contratos Bancários',
    'Apuração de Desvios e Fraudes',
    'Contabilidade Societária',
    'Auditoria Forense',
    'Cálculos Trabalhistas Contábeis',
    'Liquidação de Sentença (Cível)',
  ],
  medicina: [
    'Perícia Médica Judicial',
    'Nexo Causal — Acidente de Trabalho',
    'Avaliação de Invalidez / Incapacidade',
    'Dano Estético',
    'Erro Médico',
    'Psiquiatria Forense',
    'Medicina do Trabalho',
    'Lesão Corporal',
    'Perda Auditiva Ocupacional (PAIR)',
    'Avaliação de Doenças Ocupacionais',
  ],
  imobiliario: [
    'Avaliação de Imóvel Urbano',
    'Avaliação de Imóvel Rural',
    'Avaliação de Glebas e Terrenos',
    'Locação — Revisão de Aluguel',
    'Usucapião',
    'Indenização por Desapropriação',
    'Vícios de Construção',
    'Incorporação Imobiliária',
    'Condomínios — Apuração de Fundo de Reserva',
    'Levantamento Topográfico Judicial',
  ],
  trabalhista: [
    'Perícia Trabalhista',
    'Insalubridade e Periculosidade',
    'Acidente de Trabalho',
    'Cálculos de Verbas Rescisórias',
    'Equiparação Salarial',
    'Assédio Moral — Laudo Psicológico',
    'Jornada de Trabalho — Apuração',
    'FGTS — Apuração de Diferenças',
    'Doenças Ocupacionais',
  ],
  meio_ambiente: [
    'Perícia Ambiental',
    'Passivo Ambiental',
    'Dano Ambiental — Apuração',
    'Licenciamento Ambiental',
    'Recuperação de Área Degradada',
    'Poluição Hídrica e Atmosférica',
    'Flora e Fauna',
    'Crimes Ambientais',
    'Resíduos Sólidos e Industriais',
  ],
  informatica: [
    'Perícia em Informática',
    'Análise de Evidências Digitais',
    'Fraude Eletrônica',
    'Contratos de TI — Análise',
    'Segurança da Informação Forense',
    'Propriedade Intelectual de Software',
    'Redes e Telecomunicações',
    'Crimes Cibernéticos',
    'Recuperação de Dados',
  ],
  grafotecnia: [
    'Exame Grafotécnico',
    'Autenticidade de Assinatura',
    'Falsidade Documental',
    'Reconhecimento de Escrita',
    'Datação de Documentos',
    'Adulteração em Documentos Públicos',
    'Exame de Impressões Digitais',
    'Falsidade Ideológica',
  ],
  quimica: [
    'Perícia Química',
    'Análise de Substâncias Psicoativas',
    'Adulteração de Alimentos',
    'Intoxicação — Toxicologia Forense',
    'Análise de Materiais e Produtos',
    'Explosivos e Incêndios',
    'Identificação de Substâncias Contaminantes',
  ],
  psicologia: [
    'Avaliação Psicológica Forense',
    'Guarda de Filhos e Alienação Parental',
    'Interdição Civil',
    'Dano Psíquico',
    'Avaliação de Capacidade Testamentária',
    'Psicologia Organizacional Forense',
    'Avaliação de Vítimas de Violência',
  ],
  agronegocio: [
    'Avaliação de Propriedade Rural',
    'Perícia Agrícola e Agronômica',
    'Avaliação de Culturas e Benfeitorias',
    'Apuração de Danos em Lavoura',
    'Pecuária — Avaliação de Rebanho',
    'Irrigação e Recursos Hídricos Rurais',
    'Conflitos Fundiários',
  ],
  biologia: [
    'Perícia Biológica',
    'DNA e Exame de Paternidade',
    'Análise Microbiológica',
    'Perícia em Alimentos',
    'Biologia Forense',
    'Identificação de Espécies Protegidas',
  ],
  transito: [
    'Reconstituição de Acidentes de Trânsito',
    'Análise de Dinâmica de Colisão',
    'Avaliação de Danos Veiculares',
    'Velocidade e Frenagem',
    'Sinalização Viária',
    'Habilitação e Documentação Veicular',
  ],
  seguros: [
    'Perícia em Sinistros de Seguro',
    'Cálculos Atuariais',
    'Fraude em Seguros',
    'Avaliação de Bens Segurados',
    'Sinistro de Veículos',
    'Seguro de Vida e Saúde',
  ],
  traducao: [
    'Tradução Juramentada — Inglês',
    'Tradução Juramentada — Espanhol',
    'Tradução Juramentada — Alemão',
    'Tradução Juramentada — Francês',
    'Tradução Juramentada — Italiano',
    'Tradução Juramentada — Mandarim',
    'Tradução Juramentada — Outros',
    'Interpretação em Audiências',
  ],
  outros: [
    'Administração e Gestão',
    'Propriedade Intelectual',
    'Economia e Macroeconomia',
    'Nutrição e Alimentos',
    'Veterinária Forense',
    'Arqueologia e Patrimônio Histórico',
    'Náutica e Perícia Marítima',
    'Heráldica e Registros Históricos',
  ],
}

// ─── Listas derivadas ──────────────────────────────────────────────────────────

export const TODAS_ESPECIALIDADES: string[] = (
  Object.values(ESPECIALIDADES_POR_AREA) as string[][]
).flat()

// ─── Keywords sugeridas por área ──────────────────────────────────────────────
// Usadas no matching engine e no formulário de perfil

export const KEYWORDS_SUGERIDAS_POR_AREA: Record<AreaPrincipalId, string[]> = {
  engenharia:    ['vistoria', 'laudo', 'estrutura', 'obra', 'construção', 'projeto', 'NBR', 'CREA', 'CAU', 'NR-18'],
  contabilidade: ['balanço', 'haveres', 'desvio', 'fraude', 'CPC', 'IFRS', 'goodwill', 'liquidação', 'cálculo'],
  medicina:      ['nexo causal', 'incapacidade', 'invalidez', 'CID', 'CRM', 'laudo', 'prontuário', 'DPVAT'],
  imobiliario:   ['ABNT 14653', 'avaliação', 'terreno', 'planta', 'matrícula', 'IPTU', 'aluguel', 'incorporação'],
  trabalhista:   ['CLT', 'NR', 'PPP', 'LTCAT', 'insalubridade', 'periculosidade', 'rescisão', 'FGTS'],
  meio_ambiente: ['CONAMA', 'IBAMA', 'licença', 'EIA', 'RIMA', 'passivo', 'degradação', 'APP', 'reserva legal'],
  informatica:   ['LGPD', 'hash', 'metadados', 'log', 'IP', 'forense digital', 'malware', 'criptografia'],
  grafotecnia:   ['grafoscopia', 'assinatura', 'escrita', 'caligrafia', 'traço', 'documento falso', 'reconhecimento'],
  quimica:       ['CRQ', 'toxicologia', 'laudo', 'análise', 'substância', 'amostra', 'reagente'],
  psicologia:    ['CRP', 'alienação parental', 'guarda', 'capacidade', 'avaliação', 'laudo psicológico'],
  agronegocio:   ['CREA agrônomo', 'INCRA', 'SIGEF', 'CNIR', 'ITR', 'georreferenciamento', 'cultura'],
  biologia:      ['CRBio', 'DNA', 'PCR', 'laudo genético', 'paternidade', 'microbiologia'],
  transito:      ['DENATRAN', 'CONTRAN', 'CTB', 'boletim de ocorrência', 'laudo de colisão', 'tachógrafo'],
  seguros:       ['SUSEP', 'apólice', 'sinistro', 'regulação', 'cosseguro', 'resseguro'],
  traducao:      ['JUCESP', 'JUCERJA', 'tradução juramentada', 'apostila de Haia', 'consular'],
  outros:        ['laudo', 'perícia', 'avaliação', 'relatório técnico'],
}

// ─── Tags comuns de perícia ───────────────────────────────────────────────────

export const TAGS_PERICIA = [
  'Água',
  'Energia',
  'Avaliação Imobiliária',
  'Grafotecnia',
  'Médica',
  'Trabalhista',
  'Engenharia Civil',
  'Meio Ambiente',
  'Contábil',
  'Trânsito',
  'Informática',
  'Seguros',
] as const

// ─── Helper ────────────────────────────────────────────────────────────────────

/** Retorna o label de uma área principal pelo id */
export function getLabelArea(id: AreaPrincipalId): string {
  return AREAS_PRINCIPAIS.find((a) => a.id === id)?.label ?? id
}

/** Retorna todas as especialidades como opções para select/chips */
export function getEspecialidadesOptions(): { value: string; label: string }[] {
  return TODAS_ESPECIALIDADES.map((e) => ({ value: e, label: e }))
}

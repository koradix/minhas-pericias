export interface PeritoPerfil {
  id: string
  nome: string
  formacao: string
  especialidades: string[]
  cursos: string[]
  regioes: string[]       // UFs
  cidades: string[]
  tribunais: string[]     // siglas dos tribunais
  rating: number
  pericias_concluidas: number
  valor_referencia: number
  disponivel: boolean
  bio: string
}

export const peritos: PeritoPerfil[] = [
  {
    id: 'PRT-001',
    nome: 'Dr. Ricardo Mendonça',
    formacao: 'Eng. Civil — UFRJ | Pós em Perícia Judicial — FGV',
    especialidades: ['Avaliação de Imóvel', 'Engenharia Civil', 'Avaliação de Empresa'],
    cursos: ['Perícia Judicial', 'Avaliação de Imóveis', 'Inspeção Predial', 'Laudos Técnicos'],
    regioes: ['RJ', 'ES'],
    cidades: ['Rio de Janeiro', 'Niterói', 'São Gonçalo', 'Petrópolis'],
    tribunais: ['TJRJ', 'TRT-1', 'JFRJ'],
    rating: 4.9,
    pericias_concluidas: 312,
    valor_referencia: 4500,
    disponivel: true,
    bio: 'Engenheiro civil com 20 anos de atuação pericial no TJRJ e TRF-2. Especialista em avaliações imobiliárias e laudos de sinistro.',
  },
  {
    id: 'PRT-002',
    nome: 'Dra. Fernanda Oliveira',
    formacao: 'Ciências Contábeis — UERJ | MBA em Direito do Trabalho — PUC-Rio',
    especialidades: ['Perícia Trabalhista', 'Perícia Contábil'],
    cursos: ['Perícia Trabalhista', 'Cálculos Judiciais', 'Perícia Judicial', 'Mediação e Arbitragem'],
    regioes: ['RJ'],
    cidades: ['Rio de Janeiro', 'Duque de Caxias', 'Nova Iguaçu'],
    tribunais: ['TRT-1', 'JFRJ', 'TJRJ'],
    rating: 4.7,
    pericias_concluidas: 228,
    valor_referencia: 3800,
    disponivel: true,
    bio: 'Contadora e perita judicial com larga experiência no TRT-1 e JFRJ. Especialista em recálculo de verbas trabalhistas.',
  },
  {
    id: 'PRT-003',
    nome: 'Dr. Marcos Cavalcanti',
    formacao: 'Economia — PUC-Rio | Doutorado em Finanças — FGV-EPGE',
    especialidades: ['Avaliação de Empresa', 'Perícia Contábil', 'Avaliação de Imóvel'],
    cursos: ['Perícia Judicial', 'Avaliação de Imóveis', 'Assistência Técnica', 'Mediação e Arbitragem'],
    regioes: ['RJ', 'SP', 'MG'],
    cidades: ['Rio de Janeiro', 'Barra da Tijuca', 'Centro'],
    tribunais: ['TJRJ', 'TJSP', 'TJMG', 'JFRJ'],
    rating: 4.8,
    pericias_concluidas: 187,
    valor_referencia: 6000,
    disponivel: true,
    bio: 'Economista e perito judicial especializado em avaliação de empresas, apuração de haveres e perícias societárias no TJRJ.',
  },
  {
    id: 'PRT-004',
    nome: 'Dra. Juliana Fonseca',
    formacao: 'Medicina — UFRJ | Especialização em Perícia Médica — CFM',
    especialidades: ['Perícia Médica', 'Acidente de Trabalho'],
    cursos: ['Perícia Judicial', 'Perícia Cível', 'Mediação e Arbitragem'],
    regioes: ['RJ'],
    cidades: ['Rio de Janeiro', 'Niterói', 'São Gonçalo', 'Maricá'],
    tribunais: ['TJRJ', 'TRT-1', 'JFRJ', 'TRE-RJ'],
    rating: 4.6,
    pericias_concluidas: 154,
    valor_referencia: 5000,
    disponivel: true,
    bio: 'Médica perita judicial com atuação em perícias de incapacidade, acidente de trabalho e responsabilidade civil médica.',
  },
  {
    id: 'PRT-005',
    nome: 'Dr. Paulo Siqueira',
    formacao: 'Eng. Civil — UFF | Especialização em Eng. Ambiental — UENF',
    especialidades: ['Engenharia Civil', 'Avaliação de Imóvel', 'Ambiental'],
    cursos: ['Avaliação de Imóveis', 'Inspeção Predial', 'Laudos Técnicos', 'Assistência Técnica'],
    regioes: ['RJ', 'ES'],
    cidades: ['Niterói', 'Maricá', 'Cabo Frio', 'Búzios'],
    tribunais: ['TJRJ', 'JFRJ'],
    rating: 4.5,
    pericias_concluidas: 98,
    valor_referencia: 3500,
    disponivel: true,
    bio: 'Engenheiro civil e ambiental com expertise em avaliações de imóveis na Região dos Lagos e litoral fluminense.',
  },
  {
    id: 'PRT-006',
    nome: 'Dra. Camila Rodrigues',
    formacao: 'Ciências Contábeis — UFRRJ | Pós-graduação em Auditoria — IBMEC',
    especialidades: ['Perícia Contábil', 'Perícia Trabalhista'],
    cursos: ['Cálculos Judiciais', 'Perícia Trabalhista', 'Laudos Técnicos'],
    regioes: ['RJ'],
    cidades: ['Duque de Caxias', 'Nova Iguaçu', 'São João de Meriti', 'Belford Roxo'],
    tribunais: ['TRT-1', 'TJRJ'],
    rating: 4.4,
    pericias_concluidas: 76,
    valor_referencia: 3200,
    disponivel: true,
    bio: 'Perita contábil atuante na Baixada Fluminense, com foco em recálculos trabalhistas e apuração de lucros cessantes.',
  },
  {
    id: 'PRT-007',
    nome: 'Dr. Henrique Braga',
    formacao: 'Eng. Ambiental — UERJ | Mestrado em Geotecnia — PUC-Rio',
    especialidades: ['Ambiental', 'Engenharia Civil', 'Avaliação de Imóvel'],
    cursos: ['Laudos Técnicos', 'Avaliação de Imóveis', 'Inspeção Predial', 'Assistência Técnica'],
    regioes: ['RJ', 'ES', 'MG'],
    cidades: ['Rio de Janeiro', 'Petrópolis', 'Teresópolis', 'Nova Friburgo'],
    tribunais: ['TJRJ', 'TJMG', 'JFRJ'],
    rating: 4.7,
    pericias_concluidas: 143,
    valor_referencia: 4200,
    disponivel: false,
    bio: 'Especialista em perícias ambientais e de engenharia na Serra Fluminense. Experiência em laudos para Ibama e órgãos estaduais.',
  },
]

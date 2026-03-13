export type StatusDemanda = 'disponivel' | 'aceita' | 'expirada'

export interface Demanda {
  id: number
  titulo: string
  originador: string
  tipoOriginador: string
  especialidade: string
  cidade: string
  uf: string
  valor: number
  prazo: string
  diasParaExpirar: number
  status: StatusDemanda
  descricao: string
}

export const demandas: Demanda[] = [
  {
    id: 1,
    titulo: 'Avaliação de Imóvel Residencial',
    originador: 'Seguradora Confiança',
    tipoOriginador: 'Seguradora',
    especialidade: 'Avaliação de Imóvel',
    cidade: 'São Paulo',
    uf: 'SP',
    valor: 3500,
    prazo: '28/12/2024',
    diasParaExpirar: 2,
    status: 'disponivel',
    descricao: 'Avaliação de imóvel residencial para fins de sinistro. Localizado no bairro Jardins.',
  },
  {
    id: 2,
    titulo: 'Perícia Trabalhista — Cálculos Rescisórios',
    originador: 'Lima & Associados Advocacia',
    tipoOriginador: 'Escritório de Advocacia',
    especialidade: 'Perícia Trabalhista',
    cidade: 'São Paulo',
    uf: 'SP',
    valor: 2800,
    prazo: '30/12/2024',
    diasParaExpirar: 4,
    status: 'disponivel',
    descricao: 'Levantamento e conferência de verbas rescisórias. Processo extrajudicial em fase de negociação.',
  },
  {
    id: 3,
    titulo: 'Avaliação de Veículo Sinistrado',
    originador: 'Porto Seguro',
    tipoOriginador: 'Seguradora',
    especialidade: 'Avaliação de Veículo',
    cidade: 'Campinas',
    uf: 'SP',
    valor: 1200,
    prazo: '02/01/2025',
    diasParaExpirar: 7,
    status: 'disponivel',
    descricao: 'Avaliação de danos em veículo sinistrado. Acesso ao veículo disponível mediante agendamento.',
  },
  {
    id: 4,
    titulo: 'Laudo de Avaliação Empresarial',
    originador: 'Empresa Alfa Ltda.',
    tipoOriginador: 'Empresa',
    especialidade: 'Avaliação de Empresa',
    cidade: 'São Paulo',
    uf: 'SP',
    valor: 8500,
    prazo: '15/01/2025',
    diasParaExpirar: 20,
    status: 'disponivel',
    descricao: 'Avaliação de empresa para fins de fusão e aquisição. Documentação financeira disponível para acesso.',
  },
  {
    id: 5,
    titulo: 'Perícia Contábil — Apuração de Haveres',
    originador: 'Dra. Ana Carvalho',
    tipoOriginador: 'Advogada Autônoma',
    especialidade: 'Perícia Contábil',
    cidade: 'Guarulhos',
    uf: 'SP',
    valor: 4200,
    prazo: '10/01/2025',
    diasParaExpirar: 15,
    status: 'aceita',
    descricao: 'Apuração de haveres em dissolução de sociedade. Acesso aos livros contábeis já confirmado.',
  },
]

export const statusMapDemandas = {
  disponivel: { label: 'Disponível', variant: 'info' as const },
  aceita: { label: 'Aceita por você', variant: 'success' as const },
  expirada: { label: 'Expirada', variant: 'danger' as const },
}

export const originadorColors: Record<string, string> = {
  Seguradora: 'bg-blue-50 text-blue-700',
  'Escritório de Advocacia': 'bg-violet-50 text-violet-700',
  Empresa: 'bg-amber-50 text-amber-700',
  'Advogada Autônoma': 'bg-emerald-50 text-emerald-700',
  'Advogado Autônomo': 'bg-emerald-50 text-emerald-700',
}

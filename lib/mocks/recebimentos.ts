export type StatusRecebimento = 'recebido' | 'pendente' | 'vencido' | 'parcial'

export interface Recebimento {
  id: number
  pericia: string
  descricao: string
  cliente: string
  valorTotal: number
  valorRecebido: number
  vencimento: string
  status: StatusRecebimento
}

export const recebimentos: Recebimento[] = [
  {
    id: 1,
    pericia: 'PRC-2024-003',
    descricao: 'Laudo Contábil Societário',
    cliente: 'Carlos Oliveira',
    valorTotal: 8000,
    valorRecebido: 8000,
    vencimento: '10/12/2024',
    status: 'recebido',
  },
  {
    id: 2,
    pericia: 'PRC-2024-001',
    descricao: 'Avaliação de Imóvel Residencial',
    cliente: 'João Silva',
    valorTotal: 4200,
    valorRecebido: 0,
    vencimento: '15/12/2024',
    status: 'pendente',
  },
  {
    id: 3,
    pericia: 'PRC-2024-002',
    descricao: 'Perícia Trabalhista',
    cliente: 'Maria Santos',
    valorTotal: 3500,
    valorRecebido: 0,
    vencimento: '20/12/2024',
    status: 'pendente',
  },
  {
    id: 4,
    pericia: 'PRC-2024-004',
    descricao: 'Avaliação de Estabelecimento',
    cliente: 'Ana Costa',
    valorTotal: 6500,
    valorRecebido: 0,
    vencimento: '22/12/2024',
    status: 'pendente',
  },
  {
    id: 5,
    pericia: 'PRC-2024-000',
    descricao: 'Perícia Imobiliária Complexa',
    cliente: 'Banco Invest S.A.',
    valorTotal: 15000,
    valorRecebido: 0,
    vencimento: '05/12/2024',
    status: 'vencido',
  },
]

export const statusMapRecebimentos = {
  recebido: { label: 'Recebido', variant: 'success' as const },
  pendente: { label: 'Pendente', variant: 'warning' as const },
  vencido: { label: 'Vencido', variant: 'danger' as const },
  parcial: { label: 'Parcial', variant: 'info' as const },
}

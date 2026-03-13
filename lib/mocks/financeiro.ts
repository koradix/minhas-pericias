export type StatusMovimentacao = 'recebido' | 'pendente'
export type TipoMovimentacao = 'recebimento'

export interface Movimentacao {
  id: number
  descricao: string
  tipo: TipoMovimentacao
  valor: number
  data: string
  status: StatusMovimentacao
}

export const movimentacoes: Movimentacao[] = [
  {
    id: 1,
    descricao: 'Honorários — PRC-2024-003',
    tipo: 'recebimento',
    valor: 8000,
    data: '08/12/2024',
    status: 'recebido',
  },
  {
    id: 2,
    descricao: 'Honorários — PRC-2024-001',
    tipo: 'recebimento',
    valor: 4200,
    data: '05/12/2024',
    status: 'pendente',
  },
  {
    id: 3,
    descricao: 'Honorários — PRC-2024-002',
    tipo: 'recebimento',
    valor: 3500,
    data: '01/12/2024',
    status: 'pendente',
  },
  {
    id: 4,
    descricao: 'Demanda Extrajudicial — DMD-001',
    tipo: 'recebimento',
    valor: 3500,
    data: '28/11/2024',
    status: 'pendente',
  },
]

export const resumoFinanceiro = {
  recebidoMes: 8000,
  aReceber: 48500,
  recebidoMesLabel: 'Recebido (Dezembro)',
  aReceberCount: 12,
  variacaoMes: 22,
}

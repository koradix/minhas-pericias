export type StatusPericia = 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada' | 'nomeado'

export interface Pericia {
  id: number
  numero: string
  assunto: string
  processo: string
  cliente: string
  vara: string
  status: StatusPericia
  prazo: string
  valor: string
}

export const pericias: Pericia[] = [
  {
    id: 1,
    numero: 'PRC-2024-001',
    assunto: 'Avaliação de Imóvel Residencial',
    processo: '0012345-67.2024.8.26.0001',
    cliente: 'João Silva',
    vara: '3ª Vara Cível — TJSP',
    status: 'em_andamento',
    prazo: '15/12/2024',
    valor: 'R$ 4.200',
  },
  {
    id: 2,
    numero: 'PRC-2024-002',
    assunto: 'Perícia Trabalhista',
    processo: '0023456-78.2024.5.02.0001',
    cliente: 'Maria Santos',
    vara: '2ª Vara do Trabalho — TRT-2',
    status: 'aguardando',
    prazo: '20/12/2024',
    valor: 'R$ 3.500',
  },
  {
    id: 3,
    numero: 'PRC-2024-003',
    assunto: 'Laudo Contábil Societário',
    processo: '0034567-89.2024.8.26.0100',
    cliente: 'Carlos Oliveira',
    vara: '1ª Vara Empresarial — TJSP',
    status: 'concluida',
    prazo: '10/12/2024',
    valor: 'R$ 8.000',
  },
  {
    id: 4,
    numero: 'PRC-2024-004',
    assunto: 'Avaliação de Estabelecimento Comercial',
    processo: '0045678-90.2024.8.26.0002',
    cliente: 'Ana Costa',
    vara: '5ª Vara Cível — TJSP',
    status: 'em_andamento',
    prazo: '22/12/2024',
    valor: 'R$ 6.500',
  },
  {
    id: 5,
    numero: 'PRC-2024-005',
    assunto: 'Perícia de Engenharia Civil',
    processo: '0056789-01.2024.8.26.0003',
    cliente: 'Roberto Lima',
    vara: '4ª Vara Cível — TJSP',
    status: 'aguardando',
    prazo: '28/12/2024',
    valor: 'R$ 5.200',
  },
  {
    id: 6,
    numero: 'PRC-2024-006',
    assunto: 'Laudo Ambiental',
    processo: '0067890-12.2024.4.03.6100',
    cliente: 'Empresa XYZ Ltda.',
    vara: '1ª Vara Federal Ambiental',
    status: 'nomeado',
    prazo: '10/01/2025',
    valor: 'A definir',
  },
]

export const statusMapPericias = {
  em_andamento: { label: 'Em andamento', variant: 'info' as const },
  aguardando: { label: 'Aguardando', variant: 'warning' as const },
  concluida: { label: 'Concluída', variant: 'success' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
  nomeado: { label: 'Nomeado', variant: 'secondary' as const },
}

// DEMO — dados fictícios do Rio de Janeiro para fins de teste
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
  endereco?: string  // local físico da perícia (para rotas)
  latitude?: number
  longitude?: number
}

export const pericias: Pericia[] = [
  {
    id: 1,
    numero: 'PRC-2024-001',
    assunto: 'Avaliação de Imóvel Residencial',
    processo: '0045678-32.2024.8.19.0001',
    cliente: 'João Ferreira da Silva',
    vara: '3ª Vara Cível da Comarca da Capital — TJRJ',
    status: 'em_andamento',
    prazo: '15/01/2025',
    valor: 'R$ 4.200',
    endereco: 'Rua Voluntários da Pátria, 340, Botafogo — Rio de Janeiro, RJ',
    latitude: -22.9388,
    longitude: -43.1822,
  },
  {
    id: 2,
    numero: 'PRC-2024-002',
    assunto: 'Perícia Trabalhista — Cálculo de Verbas Rescisórias',
    processo: '0012345-67.2024.5.01.0001',
    cliente: 'Maria das Graças Souza',
    vara: '5ª Vara do Trabalho — TRT-1 (Rio de Janeiro)',
    status: 'aguardando',
    prazo: '22/01/2025',
    valor: 'R$ 3.500',
    endereco: 'Av. Presidente Vargas, 1012, Centro — Rio de Janeiro, RJ',
    latitude: -22.9041,
    longitude: -43.1789,
  },
  {
    id: 3,
    numero: 'PRC-2024-003',
    assunto: 'Laudo Contábil — Apuração de Haveres Societários',
    processo: '0078901-12.2024.8.19.0038',
    cliente: 'Construtora Niterói Ltda.',
    vara: '2ª Vara Empresarial da Comarca de Niterói — TJRJ',
    status: 'concluida',
    prazo: '20/12/2024',
    valor: 'R$ 8.000',
    endereco: 'Rua Quinze de Novembro, 8, Centro — Niterói, RJ',
    latitude: -22.8998,
    longitude: -43.1769,
  },
  {
    id: 4,
    numero: 'PRC-2024-004',
    assunto: 'Avaliação de Estabelecimento Comercial',
    processo: '0023456-89.2024.8.19.0002',
    cliente: 'Ana Paula Rodrigues',
    vara: '7ª Vara Cível da Comarca da Capital — TJRJ',
    status: 'em_andamento',
    prazo: '28/01/2025',
    valor: 'R$ 6.500',
    endereco: 'Rua Uruguaiana, 75, Centro — Rio de Janeiro, RJ',
    latitude: -22.9056,
    longitude: -43.1769,
  },
  {
    id: 5,
    numero: 'PRC-2024-005',
    assunto: 'Perícia de Engenharia Civil — Vícios Construtivos',
    processo: '0056789-45.2024.8.19.0066',
    cliente: 'Roberto Alves Lima',
    vara: '1ª Vara Cível da Comarca de Duque de Caxias — TJRJ',
    status: 'aguardando',
    prazo: '10/02/2025',
    valor: 'R$ 5.200',
    endereco: 'Av. Presidente Kennedy, 1500, Vila São Luís — Duque de Caxias, RJ',
    latitude: -22.7736,
    longitude: -43.3133,
  },
  {
    id: 6,
    numero: 'PRC-2024-006',
    assunto: 'Laudo Ambiental — Avaliação de Dano Ambiental',
    processo: '0034567-23.2024.4.02.5101',
    cliente: 'Indústria Petroquímica São Gonçalo S.A.',
    vara: '3ª Vara Federal Ambiental — JFRJ',
    status: 'nomeado',
    prazo: '15/02/2025',
    valor: 'A definir',
    endereco: 'Estrada do Colubandê, s/n, Porto Velho — São Gonçalo, RJ',
    latitude: -22.8297,
    longitude: -43.0505,
  },
  {
    id: 7,
    numero: 'PRC-2024-007',
    assunto: 'Perícia Contábil — Revisional de Contrato Bancário',
    processo: '0089012-56.2024.8.19.0003',
    cliente: 'Carlos Eduardo Monteiro',
    vara: '12ª Vara Cível da Comarca da Capital — TJRJ',
    status: 'em_andamento',
    prazo: '05/02/2025',
    valor: 'R$ 3.800',
  },
  {
    id: 8,
    numero: 'PRC-2024-008',
    assunto: 'Avaliação de Imóvel Comercial — Desapropriação',
    processo: '0067890-78.2024.8.19.0202',
    cliente: 'Município de Nova Iguaçu',
    vara: '1ª Vara da Fazenda Pública de Nova Iguaçu — TJRJ',
    status: 'nomeado',
    prazo: '20/02/2025',
    valor: 'R$ 12.000',
    endereco: 'Av. Governador Portela, 212, Centro — Nova Iguaçu, RJ',
    latitude: -22.7575,
    longitude: -43.4523,
  },
]

export const statusMapPericias = {
  em_andamento: { label: 'Em andamento', variant: 'info' as const },
  aguardando: { label: 'Aguardando', variant: 'warning' as const },
  concluida: { label: 'Concluída', variant: 'success' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
  nomeado: { label: 'Nomeado', variant: 'info' as const },
}

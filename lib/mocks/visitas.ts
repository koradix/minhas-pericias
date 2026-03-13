export type StatusVisita = 'confirmada' | 'pendente' | 'realizada' | 'cancelada'
export type TipoVisita = 'Vistoria' | 'Entrevista' | 'Reunião Técnica'

export interface Visita {
  id: number
  tipo: TipoVisita
  pericia: string
  assunto: string
  local: string
  data: string
  hora: string
  status: StatusVisita
}

export const visitas: Visita[] = [
  {
    id: 1,
    tipo: 'Vistoria',
    pericia: 'PRC-2024-001',
    assunto: 'Avaliação de Imóvel Residencial',
    local: 'Rua das Flores, 123 — Jardins, SP',
    data: 'Hoje',
    hora: '14:00',
    status: 'confirmada',
  },
  {
    id: 2,
    tipo: 'Entrevista',
    pericia: 'PRC-2024-004',
    assunto: 'Avaliação de Estabelecimento',
    local: 'Av. Paulista, 1000 — Bela Vista, SP',
    data: 'Amanhã',
    hora: '09:30',
    status: 'confirmada',
  },
  {
    id: 3,
    tipo: 'Vistoria',
    pericia: 'PRC-2024-006',
    assunto: 'Laudo Ambiental',
    local: 'Rua do Comércio, 45 — Centro, SP',
    data: '18 Dez',
    hora: '10:00',
    status: 'pendente',
  },
  {
    id: 4,
    tipo: 'Reunião Técnica',
    pericia: 'PRC-2024-002',
    assunto: 'Perícia Trabalhista',
    local: 'TRT-2 — Rua da Consolação, 300',
    data: '20 Dez',
    hora: '14:30',
    status: 'pendente',
  },
  {
    id: 5,
    tipo: 'Vistoria',
    pericia: 'PRC-2024-005',
    assunto: 'Perícia de Engenharia Civil',
    local: 'Av. Brigadeiro Faria Lima, 2000 — Itaim Bibi',
    data: '22 Dez',
    hora: '09:00',
    status: 'confirmada',
  },
]

export const statusMapVisitas = {
  confirmada: { label: 'Confirmada', variant: 'success' as const },
  pendente: { label: 'Pendente', variant: 'warning' as const },
  realizada: { label: 'Realizada', variant: 'secondary' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
}

export const tipoColors: Record<string, string> = {
  Vistoria: 'bg-blue-50 text-blue-600',
  Entrevista: 'bg-violet-50 text-violet-600',
  'Reunião Técnica': 'bg-amber-50 text-amber-600',
}

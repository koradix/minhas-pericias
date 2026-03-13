export type TipoContato = 'advogado' | 'parte' | 'juiz' | 'perito_parceiro' | 'servidor'

export interface Contato {
  id: number
  nome: string
  tipo: TipoContato
  email: string
  telefone: string
  pericias: number
  oab: string | null
}

export const contatos: Contato[] = [
  {
    id: 1,
    nome: 'Dr. João Silva',
    tipo: 'advogado',
    email: 'joao.silva@escritorio.com.br',
    telefone: '(11) 9 9999-0001',
    pericias: 8,
    oab: 'OAB/SP 123.456',
  },
  {
    id: 2,
    nome: 'Maria Santos',
    tipo: 'parte',
    email: 'maria.santos@email.com.br',
    telefone: '(11) 9 9999-0002',
    pericias: 2,
    oab: null,
  },
  {
    id: 3,
    nome: 'Dr. Carlos Oliveira',
    tipo: 'juiz',
    email: 'carlos.oliveira@tjsp.jus.br',
    telefone: '(11) 3333-0001',
    pericias: 12,
    oab: null,
  },
  {
    id: 4,
    nome: 'Ana Costa',
    tipo: 'parte',
    email: 'ana.costa@empresaxyz.com.br',
    telefone: '(11) 9 9999-0003',
    pericias: 1,
    oab: null,
  },
  {
    id: 5,
    nome: 'Eng. Roberto Lima',
    tipo: 'perito_parceiro',
    email: 'roberto.lima@pericias.com.br',
    telefone: '(11) 9 9999-0004',
    pericias: 5,
    oab: null,
  },
  {
    id: 6,
    nome: 'Dra. Paula Mendes',
    tipo: 'advogado',
    email: 'paula.mendes@advocacia.com.br',
    telefone: '(11) 9 9999-0005',
    pericias: 4,
    oab: 'OAB/SP 234.567',
  },
]

export const tipoMapContatos = {
  advogado: { label: 'Advogado', variant: 'info' as const },
  parte: { label: 'Parte', variant: 'secondary' as const },
  juiz: { label: 'Juiz/Magistrado', variant: 'warning' as const },
  perito_parceiro: { label: 'Perito Parceiro', variant: 'success' as const },
  servidor: { label: 'Servidor', variant: 'default' as const },
}

export const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

export function getInitials(name: string) {
  return name
    .replace(/^(Dr|Dra|Eng)\.\s*/i, '')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

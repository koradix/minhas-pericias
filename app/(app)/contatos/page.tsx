import { Users, Plus, Search, Mail, Phone } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contatos' }

const contatos = [
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

const tipoMap = {
  advogado: { label: 'Advogado', variant: 'info' as const },
  parte: { label: 'Parte', variant: 'secondary' as const },
  juiz: { label: 'Juiz/Magistrado', variant: 'warning' as const },
  perito_parceiro: { label: 'Perito Parceiro', variant: 'success' as const },
  servidor: { label: 'Servidor', variant: 'default' as const },
}

function getInitials(name: string) {
  return name
    .replace(/^(Dr|Dra|Eng)\.\s*/i, '')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

export default function ContatosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contatos"
        description="Gerencie partes, advogados, juízes e peritos parceiros"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        }
      />

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar contato por nome ou e-mail..."
            className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none">
          <option value="">Todos os tipos</option>
          <option value="advogado">Advogados</option>
          <option value="parte">Partes</option>
          <option value="juiz">Juízes</option>
          <option value="perito_parceiro">Peritos Parceiros</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contatos.map((c, i) => {
          const tipo = tipoMap[c.tipo as keyof typeof tipoMap]
          return (
            <div
              key={c.id}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColors[i % avatarColors.length]}`}
                >
                  {getInitials(c.nome)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                      {c.nome}
                    </p>
                    <Badge variant={tipo.variant} className="flex-shrink-0">
                      {tipo.label}
                    </Badge>
                  </div>
                  {c.oab && <p className="text-xs text-slate-400 mt-0.5">{c.oab}</p>}
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{c.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <span>{c.telefone}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {c.pericias} {c.pericias === 1 ? 'perícia' : 'perícias'}
                </span>
                <span className="text-xs text-blue-600 font-medium group-hover:underline">
                  Ver detalhes →
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Mostrando 6 de 137 contatos</p>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled>
            ← Anterior
          </Button>
          <Button variant="outline" size="sm">
            Próximo →
          </Button>
        </div>
      </div>
    </div>
  )
}

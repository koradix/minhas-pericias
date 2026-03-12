import { ArrowUpCircle, Plus, Search, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/shared/stats-card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pagamentos a Peritos' }

const pagamentos = [
  {
    id: 1,
    perito: 'Eng. Roberto Lima',
    pericia: 'PRC-2024-005',
    servico: 'Perícia de Engenharia Civil',
    valor: 2500,
    vencimento: '15/12/2024',
    status: 'pendente',
  },
  {
    id: 2,
    perito: 'Dra. Paula Mendes',
    pericia: 'PRC-2024-002',
    servico: 'Assistência Técnica Trabalhista',
    valor: 1800,
    vencimento: '28/11/2024',
    status: 'pago',
  },
  {
    id: 3,
    perito: 'Eng. Roberto Lima',
    pericia: 'PRC-2024-003',
    servico: 'Suporte Técnico Contábil',
    valor: 2500,
    vencimento: '10/12/2024',
    status: 'pago',
  },
  {
    id: 4,
    perito: 'Dr. Marcos Rocha',
    pericia: 'PRC-2024-006',
    servico: 'Perícia Ambiental',
    valor: 4500,
    vencimento: '20/12/2024',
    status: 'pendente',
  },
]

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const statusMap = {
  pago: { label: 'Pago', variant: 'success' as const },
  pendente: { label: 'Pendente', variant: 'warning' as const },
  vencido: { label: 'Vencido', variant: 'danger' as const },
}

const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
]

export default function PagamentosPeritosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagamentos a Peritos"
        description="Controle de pagamentos para peritos parceiros"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo Pagamento
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Pago (Dezembro)"
          value="R$ 4.300"
          icon={ArrowUpCircle}
          accent="blue"
          trend={{ value: 10, label: 'vs. novembro', positive: false }}
        />
        <StatsCard
          title="A Pagar"
          value="R$ 7.000"
          description="2 pagamentos pendentes"
          icon={ArrowUpCircle}
          accent="amber"
        />
        <StatsCard
          title="Peritos Ativos"
          value="4"
          description="Com acordos vigentes"
          icon={Users}
          accent="violet"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por perito ou perícia..."
            className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="pago">Pagos</option>
          <option value="vencido">Vencidos</option>
        </select>
      </div>

      <div className="space-y-3">
        {pagamentos.map((p, i) => {
          const status = statusMap[p.status as keyof typeof statusMap]
          const initials = p.perito
            .replace(/^(Eng|Dr|Dra)\.\s*/i, '')
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase()
          return (
            <div
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColors[i % avatarColors.length]}`}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{p.perito}</p>
                <p className="text-xs text-slate-500 truncate">
                  {p.servico} · {p.pericia}
                </p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-400">Vencimento</p>
                  <p className="text-xs font-medium text-slate-700">{p.vencimento}</p>
                </div>
                <p className="text-base font-bold text-slate-900">{formatCurrency(p.valor)}</p>
                <Badge variant={status.variant}>{status.label}</Badge>
                {p.status === 'pendente' && (
                  <Button size="sm" variant="outline">
                    Pagar
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

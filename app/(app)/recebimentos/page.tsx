import { ArrowDownCircle, Plus, Search, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/shared/stats-card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Recebimentos' }

const recebimentos = [
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

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const statusMap = {
  recebido: { label: 'Recebido', variant: 'success' as const },
  pendente: { label: 'Pendente', variant: 'warning' as const },
  vencido: { label: 'Vencido', variant: 'danger' as const },
  parcial: { label: 'Parcial', variant: 'info' as const },
}

export default function RecebimentosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recebimentos"
        description="Controle de honorários e valores a receber"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo Recebimento
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Recebido (Dezembro)"
          value="R$ 8.000"
          icon={ArrowDownCircle}
          accent="emerald"
          trend={{ value: 22, label: 'vs. novembro', positive: true }}
        />
        <StatsCard
          title="Pendente"
          value="R$ 29.200"
          description="9 recebimentos em aberto"
          icon={ArrowDownCircle}
          accent="amber"
        />
        <StatsCard
          title="Vencido"
          value="R$ 15.000"
          description="1 recebimento em atraso"
          icon={ArrowDownCircle}
          accent="rose"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por perícia ou cliente..."
            className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="recebido">Recebidos</option>
          <option value="vencido">Vencidos</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Perícia / Descrição
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Valor
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recebimentos.map((r) => {
                const status = statusMap[r.status as keyof typeof statusMap]
                return (
                  <tr key={r.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                          <FileText className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{r.descricao}</p>
                          <p className="text-xs text-slate-400">{r.pericia}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3.5">
                      <span className="text-sm text-slate-700">{r.cliente}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(r.valorTotal)}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3.5">
                      <span className="text-sm text-slate-600">{r.vencimento}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">5 recebimentos</p>
          <p className="text-xs font-medium text-slate-700">
            Total pendente: <span className="text-amber-600">R$ 44.200</span>
          </p>
        </div>
      </div>
    </div>
  )
}

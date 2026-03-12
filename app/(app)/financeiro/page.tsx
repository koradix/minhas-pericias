import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Financeiro' }

const recentMovimentacoes = [
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
    descricao: 'Pagamento Eng. Roberto Lima',
    tipo: 'pagamento',
    valor: 2500,
    data: '07/12/2024',
    status: 'pago',
  },
  {
    id: 3,
    descricao: 'Honorários — PRC-2024-001',
    tipo: 'recebimento',
    valor: 4200,
    data: '05/12/2024',
    status: 'pendente',
  },
  {
    id: 4,
    descricao: 'Honorários — PRC-2024-002',
    tipo: 'recebimento',
    valor: 3500,
    data: '01/12/2024',
    status: 'pendente',
  },
  {
    id: 5,
    descricao: 'Pagamento Dra. Paula Mendes',
    tipo: 'pagamento',
    valor: 1800,
    data: '28/11/2024',
    status: 'pago',
  },
]

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financeiro</h1>
        <p className="mt-1 text-sm text-slate-500">Visão geral das suas finanças periciais</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Recebido (Dezembro)</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(8000)}</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">↑ 22% vs. novembro</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">A Receber</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(48500)}</p>
          <p className="mt-1 text-xs text-slate-400">12 recebimentos em aberto</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Pago a Parceiros</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
              <TrendingDown className="h-5 w-5 text-rose-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(4300)}</p>
          <p className="mt-1 text-xs text-slate-400">3 pagamentos em dezembro</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/recebimentos"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
            <ArrowDownCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Recebimentos</p>
            <p className="text-xs text-slate-500 mt-0.5">Honorários e valores a receber</p>
          </div>
          <span className="ml-auto text-slate-300 group-hover:text-blue-500 transition-colors text-lg">
            →
          </span>
        </Link>

        <Link
          href="/pagamentos-peritos"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
            <ArrowUpCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Pagamentos a Peritos</p>
            <p className="text-xs text-slate-500 mt-0.5">Pagamentos para peritos parceiros</p>
          </div>
          <span className="ml-auto text-slate-300 group-hover:text-blue-500 transition-colors text-lg">
            →
          </span>
        </Link>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Movimentações Recentes</CardTitle>
            <Button variant="ghost" size="sm" className="text-blue-600 -mr-2">
              Ver todas →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="divide-y divide-slate-100">
            {recentMovimentacoes.map((m) => (
              <div key={m.id} className="flex items-center gap-4 py-3">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    m.tipo === 'recebimento' ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}
                >
                  {m.tipo === 'recebimento' ? (
                    <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4 text-rose-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{m.descricao}</p>
                  <p className="text-xs text-slate-400">{m.data}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-sm font-semibold ${
                      m.tipo === 'recebimento' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {m.tipo === 'recebimento' ? '+' : '-'} {formatCurrency(m.valor)}
                  </span>
                  <Badge variant={m.status === 'pendente' ? 'warning' : 'success'}>
                    {m.status === 'pendente' ? 'Pendente' : m.status === 'recebido' ? 'Recebido' : 'Pago'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

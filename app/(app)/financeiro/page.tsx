import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financeiro</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Visão geral das suas finanças periciais</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Recebido (Dezembro)</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(8000)}</p>
          <p className="mt-1 text-xs text-[#a3e635] font-bold uppercase tracking-wider">↑ 22% vs. novembro</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">A Receber</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(48500)}</p>
          <p className="mt-1 text-xs text-slate-400 font-medium uppercase tracking-wider">12 recebimentos em aberto</p>
        </div>
      </div>

      {/* Quick action */}
      <Link
        href="/recebimentos"
        className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md hover:border-[#a3e635]/30 transition-all group"
      >
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-slate-900 uppercase tracking-widest">Recebimentos</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Honorários e valores a receber</p>
        </div>
        <span className="ml-auto text-slate-300 group-hover:text-[#a3e635] transition-colors text-xl font-bold">
          →
        </span>
      </Link>

      {/* Recent transactions */}
      <Card className="rounded-xl border-slate-200 shadow-sm border-0">
        <CardHeader className="px-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">Movimentações Recentes</CardTitle>
            <Button variant="ghost" size="sm" className="text-[#a3e635] font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 -mr-2">
              Ver todas
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-2">
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {recentMovimentacoes.map((m) => (
              <div key={m.id} className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 tracking-tight">{m.descricao}</p>
                  <p className="text-xs text-slate-400 font-medium">{m.data}</p>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-900">
                    + {formatCurrency(m.valor)}
                  </span>
                  <Badge variant={m.status === 'pendente' ? 'default' : 'secondary'} className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                    m.status === 'recebido' ? "bg-[#a3e635] text-slate-900 border-0" : "text-slate-400 border-slate-200"
                  )}>
                    {m.status === 'pendente' ? 'Pendente' : 'Recebido'}
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

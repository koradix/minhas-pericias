import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Financeiro' }
export const dynamic = 'force-dynamic'

export default async function FinanceiroPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  // Propostas aceitas = recebíveis confirmados
  const propostas = await prisma.feeProposal.findMany({
    where:  { userId, status: 'aceita' },
    select: {
      id: true,
      valorHonorarios: true,
      numeroProcesso: true,
      vara: true,
      tribunal: true,
      criadoEm: true,
      atualizadoEm: true,
      periciaId: true,
    },
    orderBy: { atualizadoEm: 'desc' },
  })

  const totalAReceber = propostas.reduce((s, p) => s + (p.valorHonorarios ?? 0), 0)
  const recentes = propostas.slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Visão geral das suas finanças periciais"
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">A Receber</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(totalAReceber)}</p>
          <p className="mt-1 text-xs text-slate-400 font-medium uppercase tracking-wider">
            {propostas.length} proposta{propostas.length !== 1 ? 's' : ''} aceita{propostas.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Link
          href="/recebimentos"
          className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-[#a3e635]/40 hover:shadow-md transition-all group"
        >
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recebimentos</p>
          <div className="flex items-end justify-between">
            <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Ver detalhes</p>
            <span className="text-slate-300 group-hover:text-[#a3e635] transition-colors font-bold">→</span>
          </div>
        </Link>
      </div>

      {/* Propostas aceitas recentes */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Propostas Aceitas</p>
          <Link href="/recebimentos" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
            Ver todas →
          </Link>
        </div>

        {recentes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-400">Nenhuma proposta aceita ainda.</p>
            <p className="text-xs text-slate-300 mt-1">Quando o cliente aceitar a proposta de honorários, ela aparecerá aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentes.map((p) => (
              <Link key={p.id} href={`/pericias/${p.periciaId}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {p.numeroProcesso || p.vara || 'Processo'}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">{p.tribunal}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(p.valorHonorarios ?? 0)}
                  </span>
                  <span className="text-[10px] font-bold bg-[#a3e635] text-slate-900 rounded-md px-2 py-0.5 uppercase tracking-widest">
                    Aceita
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

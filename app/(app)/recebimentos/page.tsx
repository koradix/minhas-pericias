import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Recebimentos' }
export const dynamic = 'force-dynamic'

export default async function RecebimentosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const propostas = await prisma.feeProposal.findMany({
    where:  { userId, status: 'aceita' },
    select: {
      id: true,
      periciaId: true,
      valorHonorarios: true,
      custoDeslocamento: true,
      numeroProcesso: true,
      vara: true,
      tribunal: true,
      partes: true,
      prazoEntrega: true,
      condicoesPagamento: true,
      atualizadoEm: true,
    },
    orderBy: { atualizadoEm: 'desc' },
  })

  const total = propostas.reduce((s, p) => s + (p.valorHonorarios ?? 0) + (p.custoDeslocamento ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recebimentos"
        description="Honorários de propostas aceitas"
      />

      {/* KPI */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total a receber</p>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatCurrency(total)}</p>
        <p className="mt-1 text-xs text-slate-400 uppercase tracking-wider font-medium">
          {propostas.length} proposta{propostas.length !== 1 ? 's' : ''} aceita{propostas.length !== 1 ? 's' : ''}
        </p>
      </div>

      {propostas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <p className="text-sm font-semibold text-slate-500">Nenhuma proposta aceita</p>
          <p className="text-xs text-slate-400 mt-1">
            Marque uma proposta como aceita na página da perícia para registrar o recebível.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Processo / Vara</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Partes</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Honorários</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Deslocamento</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Condições</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {propostas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/pericias/${p.periciaId}`} className="group">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-[#4d7c0f] transition-colors truncate max-w-[200px]">
                          {p.numeroProcesso || '—'}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">{p.vara || p.tribunal}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 truncate max-w-[180px]">{p.partes || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(p.valorHonorarios ?? 0)}</p>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {p.custoDeslocamento ? formatCurrency(p.custoDeslocamento) : '—'}
                      </p>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <p className="text-xs text-slate-500 max-w-[160px] truncate">{p.condicoesPagamento || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold bg-[#a3e635] text-slate-900 rounded-md px-2 py-0.5 uppercase tracking-widest">
                        A receber
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">{propostas.length} recebimento{propostas.length !== 1 ? 's' : ''}</p>
            <p className="text-xs font-bold text-slate-700">
              Total: <span className="text-slate-900">{formatCurrency(total)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

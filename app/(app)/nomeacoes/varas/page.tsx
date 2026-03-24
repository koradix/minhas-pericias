import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Navigation, ChevronRight, Building2, RefreshCw, Settings2 } from 'lucide-react'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shared/page-header'
import { BadgeStatus } from '@/components/shared/badge-status'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getRankingVaras } from '@/lib/data/varas'
import { VarasChart } from '@/components/nomeacoes/varas-chart'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Varas — Radar de Nomeações' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcPrioridade(total: number, max: number): 'ALTA' | 'MEDIA' | 'BAIXA' {
  if (max === 0) return 'BAIXA'
  const pct = total / max
  if (pct >= 0.6) return 'ALTA'
  if (pct >= 0.3) return 'MEDIA'
  return 'BAIXA'
}

const prioridadeRow: Record<string, string> = {
  ALTA:  'border-l-lime-500',
  MEDIA: 'border-l-amber-400',
  BAIXA: 'border-l-slate-200',
}

const prioridadeBar: Record<string, string> = {
  ALTA:  'bg-lime-500',
  MEDIA: 'bg-amber-400',
  BAIXA: 'bg-slate-300',
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function NomeacoesVarasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const varas = await getRankingVaras(userId)
  const maxNomeacoes = Math.max(...varas.map((v) => v.totalNomeacoes), 0)
  const hasData = varas.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Varas"
        description="Ranking de varas por volume de perícias nomeadas"
        actions={
          <div className="flex gap-2">
            <Link href="/configuracoes/varas">
              <Button size="sm" variant="outline" className="gap-1.5 border-slate-200 text-slate-600">
                <Settings2 className="h-3.5 w-3.5" />
                Gerenciar
              </Button>
            </Link>
            <Link href="/nomeacoes/estrategia">
              <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold">
                <Navigation className="h-3.5 w-3.5" />
                Gerar Estratégia
              </Button>
            </Link>
          </div>
        }
      />

      {!hasData && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <Building2 className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Nenhuma vara sincronizada ainda</p>
            <p className="text-xs text-slate-400 mt-1">
              Configure o Radar e execute a primeira busca para acumular dados das varas.
            </p>
          </div>
          <Link href="/nomeacoes">
            <Button size="sm" variant="outline" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Ir para o Radar
            </Button>
          </Link>
        </div>
      )}

      {hasData && (
        <>
          {/* Bar chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              Nomeações por vara
              <span className="ml-2 text-xs font-normal text-slate-400">Top 10</span>
            </p>
            <VarasChart varas={varas} />
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="pl-4 pr-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-6">#</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vara / Tribunal</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">UF</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nomeações</th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Prioridade</th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {varas.map((v, i) => {
                    const pri = calcPrioridade(v.totalNomeacoes, maxNomeacoes)
                    const pct = maxNomeacoes > 0 ? Math.round((v.totalNomeacoes / maxNomeacoes) * 100) : 0
                    return (
                      <tr
                        key={v.id}
                        className={cn('hover:bg-slate-50/60 transition-colors border-l-2', prioridadeRow[pri])}
                      >
                        <td className="pl-4 pr-2 py-3 text-xs font-medium text-slate-400 tabular-nums">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-800">{v.varaNome}</p>
                          <p className="text-xs text-slate-400">{v.tribunalSigla} · {v.tribunalNome}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{v.uf ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm font-bold text-slate-800 tabular-nums">{v.totalNomeacoes}</span>
                            <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', prioridadeBar[pri])}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <BadgeStatus status={pri.toLowerCase()} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link href="/rotas/nova">
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs whitespace-nowrap border-slate-200 text-slate-600 hover:border-lime-400 hover:text-lime-700">
                              <Navigation className="h-3 w-3" />
                              Criar Rota
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>{varas.length} vara(s) monitorada(s)</span>
            <Link href="/nomeacoes/estrategia" className="flex items-center gap-1 text-lime-600 hover:text-lime-700 font-medium transition-colors">
              Gerar estratégia de prospecção <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Navigation, ChevronRight, Building2, RefreshCw } from 'lucide-react'
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
  ALTA:  'bg-brand-500',
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
          <Link href="/nomeacoes/estrategia">
            <Button size="sm" className="bg-brand-500 hover:bg-lime-600 text-foreground font-semibold">
              <Navigation className="h-3.5 w-3.5" />
              Gerar Estratégia
            </Button>
          </Link>
        }
      />

      {!hasData && (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900/50">
            <Building2 className="h-6 w-6 text-zinc-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300">Nenhuma vara sincronizada ainda</p>
            <p className="text-xs text-zinc-500 mt-1">
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
          <div className="rounded-xl border border-border bg-card p-5 shadow-saas space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Nomeações por vara
              <span className="ml-2 text-xs font-normal text-zinc-500">Top 10</span>
            </p>
            <VarasChart varas={varas} />
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card shadow-saas overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/80">
                    <th className="pl-4 pr-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 w-6">#</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Vara / Tribunal</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">UF</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Nomeações</th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Prioridade</th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {varas.map((v, i) => {
                    const pri = calcPrioridade(v.totalNomeacoes, maxNomeacoes)
                    const pct = maxNomeacoes > 0 ? Math.round((v.totalNomeacoes / maxNomeacoes) * 100) : 0
                    return (
                      <tr
                        key={v.id}
                        className={cn('hover:bg-muted/60 transition-colors border-l-2', prioridadeRow[pri])}
                      >
                        <td className="pl-4 pr-2 py-3 text-xs font-medium text-zinc-500 tabular-nums">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-foreground">{v.varaNome}</p>
                          <p className="text-xs text-zinc-500">{v.tribunalSigla} · {v.tribunalNome}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400">{v.uf ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm font-bold text-foreground tabular-nums">{v.totalNomeacoes}</span>
                            <div className="w-16 h-1 rounded-full bg-zinc-900/50 overflow-hidden">
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
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs whitespace-nowrap border-border text-zinc-400 hover:border-brand-400 hover:text-brand-400">
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

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>{varas.length} vara(s) monitorada(s)</span>
            <Link href="/nomeacoes/estrategia" className="flex items-center gap-1 text-brand-500 hover:text-brand-400 font-medium transition-colors">
              Gerar estratégia de prospecção <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

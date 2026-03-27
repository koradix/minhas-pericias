import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Navigation, Plus, CheckCircle2, Clock, FileText,
  ArrowRight, Inbox,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Péricias' }

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

const statusPericiaMap: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'secondary' | 'danger' }> = {
  planejada:          { label: 'Planejada',          variant: 'info'      },
  processo_importado: { label: 'Processo importado', variant: 'info'      },
  em_andamento:       { label: 'Em andamento',       variant: 'warning'   },
  concluida:          { label: 'Concluída',          variant: 'success'   },
  cancelada:          { label: 'Cancelada',          variant: 'secondary' },
}

export default async function PericiasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  type RotaRow = { id: string; titulo: string; status: string; criadoEm: string; concluidos: number; total: number }
  type PericiaRow = { id: string; numero: string; assunto: string; tipo: string; status: string; prazo: string | null; vara: string | null; rotaTitulo?: string }

  let rotas: RotaRow[] = []
  let dbPericias: PericiaRow[] = []

  try {
    const [dbRotas, pericias] = await Promise.all([
      prisma.rotaPericia.findMany({
        where: { peritoId: userId },
        orderBy: { criadoEm: 'desc' },
      }),
      prisma.pericia.findMany({
        where: { peritoId: userId },
        orderBy: { criadoEm: 'desc' },
        select: { id: true, numero: true, assunto: true, tipo: true, status: true, prazo: true, vara: true },
      }),
    ])

    if (dbRotas.length > 0) {
      const rotaIds = dbRotas.map((r) => r.id)
      const cps = await prisma.checkpoint.findMany({
        where: { rotaId: { in: rotaIds } },
        select: { rotaId: true, status: true },
      })
      rotas = dbRotas.map((rota) => {
        const mine = cps.filter((c) => c.rotaId === rota.id)
        return {
          id: rota.id,
          titulo: rota.titulo,
          status: rota.status,
          criadoEm: toISO(rota.criadoEm),
          concluidos: mine.filter((c) => c.status === 'concluido').length,
          total: mine.length,
        }
      })
    }

    // Enrich péricias with rota info if linked via checkpoint
    if (pericias.length > 0 && rotas.length > 0) {
      const periciaIds = pericias.map((p) => p.id)
      const linkedCps = await prisma.checkpoint.findMany({
        where: { periciaId: { in: periciaIds } },
        select: { periciaId: true, rotaId: true },
      }).catch(() => [])
      const rotaMap = new Map(rotas.map((r) => [r.id, r.titulo]))
      const periciaRotaMap = new Map(linkedCps.map((c) => [c.periciaId!, rotaMap.get(c.rotaId)]))
      dbPericias = pericias.map((p) => ({ ...p, rotaTitulo: periciaRotaMap.get(p.id) }))
    } else {
      dbPericias = pericias.map((p) => ({ ...p }))
    }
  } catch { /* DB not ready — empty */ }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Péricias"
        description={`${dbPericias.length} péricia${dbPericias.length !== 1 ? 's' : ''}`}
        actions={
          <Link href="/nomeacoes">
            <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Importar processo
            </Button>
          </Link>
        }
      />

      {/* ── Péricias (primary) ── */}
      {dbPericias.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-8 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 mx-auto mb-4">
            <Inbox className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">Nenhuma perícia ainda</p>
          <p className="text-xs text-slate-400 mb-5">
            Importe um processo a partir de uma nomeação para criar a primeira perícia.
          </p>
          <Link href="/nomeacoes">
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold text-sm px-4 py-2 transition-colors">
              Ver nomeações <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Processo / Descrição
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vara
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Prazo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dbPericias.map((p) => {
                  const st = statusPericiaMap[p.status] ?? { label: p.status, variant: 'secondary' as const }
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                      <td className="px-4 py-4">
                        <Link href={`/pericias/${p.id}`} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50">
                            <FileText className="h-4 w-4 text-violet-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{p.assunto}</p>
                            <p className="text-xs text-slate-400 font-mono">{p.numero}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-4">
                        <p className="text-xs text-slate-600 truncate max-w-xs">
                          {p.rotaTitulo
                            ? <span className="text-lime-700 font-medium">{p.rotaTitulo}</span>
                            : p.vara ?? '—'
                          }
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4">
                        {p.prazo && (
                          <span className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Clock className="h-3 w-3" /> {p.prazo}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              {dbPericias.length} péricia{dbPericias.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* ── Rotas de vistoria (secondary) ── */}
      {rotas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              <Navigation className="h-3.5 w-3.5 text-lime-600" />
              Rotas de vistoria
            </h2>
            <Link href="/rotas/pericias" className="text-xs text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rota
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Progresso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rotas.map((rota) => (
                    <tr key={rota.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                      <td className="px-4 py-4">
                        <Link href={`/pericias/${rota.id}`} className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                            rota.status === 'concluida' ? 'bg-emerald-50' : 'bg-lime-50',
                          )}>
                            {rota.status === 'concluida'
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              : <Navigation className="h-4 w-4 text-lime-600" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{rota.titulo}</p>
                            <p className="text-xs text-slate-400 font-mono">{rota.id.slice(-8).toUpperCase()}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-lime-400"
                              style={{ width: rota.total > 0 ? `${Math.round((rota.concluidos / rota.total) * 100)}%` : '0%' }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums">
                            {rota.concluidos}/{rota.total}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {rota.status === 'concluida'
                          ? <Badge variant="success">Concluída</Badge>
                          : rota.status === 'cancelada'
                            ? <Badge variant="secondary">Cancelada</Badge>
                            : <Badge variant="info">Em andamento</Badge>}
                      </td>
                      <td className="hidden md:table-cell px-4 py-4">
                        <span className="text-sm text-slate-500">
                          {new Date(rota.criadoEm).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

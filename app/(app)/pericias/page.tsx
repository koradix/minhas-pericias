import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navigation, Plus, CheckCircle2 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
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

export default async function PericiasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  type RotaRow = {
    id: string
    titulo: string
    status: string
    criadoEm: string
    concluidos: number
    total: number
  }

  let rotas: RotaRow[] = []
  try {
    const dbRotas = await prisma.rotaPericia.findMany({
      where: { peritoId: userId },
      orderBy: { criadoEm: 'desc' },
    })
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
  } catch { /* DB not ready — empty state */ }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Péricias"
        description={
          rotas.length > 0
            ? `${rotas.length} processo${rotas.length !== 1 ? 's' : ''} periciais`
            : 'Gerencie seus processos periciais'
        }
        actions={
          <Link href="/rotas/nova">
            <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Nova rota
            </Button>
          </Link>
        }
      />

      {rotas.length === 0 ? (
        <EmptyState
          icon={Navigation}
          title="Nenhuma perícia ainda"
          description="Crie uma rota de vistoria ou prospecção para registrar sua primeira perícia."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Processo / Rota
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Progresso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rotas.map((rota) => (
                  <tr
                    key={rota.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-4">
                      <Link href={`/pericias/${rota.id}`} className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                            rota.status === 'concluida' ? 'bg-emerald-50' : 'bg-lime-50',
                          )}
                        >
                          {rota.status === 'concluida' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Navigation className="h-4 w-4 text-lime-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{rota.titulo}</p>
                          <p className="text-xs text-slate-400 font-mono">{rota.id.slice(-8).toUpperCase()}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-lime-400"
                            style={{
                              width:
                                rota.total > 0
                                  ? `${Math.round((rota.concluidos / rota.total) * 100)}%`
                                  : '0%',
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {rota.concluidos}/{rota.total}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {rota.status === 'concluida' ? (
                        <Badge variant="success">Concluída</Badge>
                      ) : rota.status === 'cancelada' ? (
                        <Badge variant="warning">Cancelada</Badge>
                      ) : (
                        <Badge variant="info">Em andamento</Badge>
                      )}
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
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              {rotas.length} processo{rotas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

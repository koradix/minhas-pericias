import Link from 'next/link'
import { List, Kanban, MapPin, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kanban — Pericias' }

function toISO(d: Date | string | null | undefined): string {
  if (!d) return new Date().toISOString()
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

interface RotaCard {
  id: string
  titulo: string
  status: string
  criadoEm: string
  total: number
  concluidos: number
}

const COLUMNS = [
  { id: 'em_andamento', label: 'Em andamento', icon: Clock,        color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'  },
  { id: 'concluida',    label: 'Concluída',    icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'cancelada',    label: 'Cancelada',    icon: XCircle,       color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200' },
]

export default async function KanbanPage() {
  const session = await auth()
  const userId = session?.user?.id ?? ''

  let rotas: RotaCard[] = []
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
          total: mine.length,
          concluidos: mine.filter((c) => c.status === 'concluido').length,
        }
      })
    }
  } catch {}

  const total = rotas.length
  const em_andamento = rotas.filter((r) => r.status === 'em_andamento').length
  const concluidas = rotas.filter((r) => r.status === 'concluida').length

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kanban de Pericias</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {total} rota{total !== 1 ? 's' : ''} · {em_andamento} em andamento · {concluidas} concluída{concluidas !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
          <Link
            href="/pericias"
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <List className="h-3.5 w-3.5" />
            Lista
          </Link>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-lime-50 text-lime-700 border-l border-slate-200">
            <Kanban className="h-3.5 w-3.5" />
            Kanban
          </span>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const Icon = col.icon
          const cards = rotas.filter((r) => r.status === col.id)
          return (
            <div key={col.id} className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
              {/* Column header */}
              <div className={cn('flex items-center gap-2 px-4 py-3 border-b border-slate-200', col.bg)}>
                <Icon className={cn('h-4 w-4', col.color)} />
                <span className={cn('text-sm font-semibold', col.color)}>{col.label}</span>
                <span className="ml-auto text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-2 min-h-[120px]">
                {cards.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">Nenhuma rota</p>
                ) : (
                  cards.map((rota) => {
                    const pct = rota.total > 0 ? Math.round((rota.concluidos / rota.total) * 100) : 0
                    return (
                      <Link key={rota.id} href={`/pericias/${rota.id}`}>
                        <div className="rounded-lg border border-slate-200 bg-white p-3 hover:border-lime-300 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">{rota.titulo}</p>
                          </div>
                          {rota.total > 0 && (
                            <div className="mt-2 space-y-1">
                              <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-lime-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-400">{rota.concluidos}/{rota.total} checkpoints</p>
                            </div>
                          )}
                          <p className="mt-1.5 text-[10px] text-slate-400">{formatDate(rota.criadoEm)}</p>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

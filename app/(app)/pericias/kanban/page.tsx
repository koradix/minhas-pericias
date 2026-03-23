import Link from 'next/link'
import { List, Kanban } from 'lucide-react'
import { auth } from '@/auth'
import { pericias } from '@/lib/mocks/pericias'
import { getStatusOverrides } from '@/lib/data/pericias-status'
import { KanbanBoard } from '@/components/pericias/kanban-board'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kanban — Péricias' }

export default async function KanbanPage() {
  const session = await auth()
  const userId  = session?.user?.id ?? ''

  const statusOverrides = userId ? await getStatusOverrides(userId) : {}

  // Compute effective statuses for header counts
  const effective    = pericias.map((p) => statusOverrides[String(p.id)] ?? p.status)
  const total        = pericias.length
  const em_andamento = effective.filter((s) => s === 'em_andamento').length
  const concluidas   = effective.filter((s) => s === 'concluida').length

  return (
    <div className="space-y-5 pb-10">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kanban de Péricias</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {total} processo{total !== 1 ? 's' : ''} ·{' '}
            {em_andamento} em andamento ·{' '}
            {concluidas} concluído{concluidas !== 1 ? 's' : ''}
          </p>
        </div>

        {/* View toggle */}
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

      {/* ── Board ────────────────────────────────────────────────────────────── */}
      <KanbanBoard pericias={pericias} statusOverrides={statusOverrides} />

    </div>
  )
}

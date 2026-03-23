'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, Calendar, User, Building2, ChevronRight, Loader2 } from 'lucide-react'
import type { Pericia } from '@/lib/mocks/pericias'
import { updatePericiaStatus } from '@/lib/actions/pericias-status'

const VALID_NEXT: Record<string, string> = {
  nomeado:      'aguardando',
  aguardando:   'em_andamento',
  em_andamento: 'concluida',
}

function getNextStatus(status: string): string | null {
  return VALID_NEXT[status] ?? null
}

// ── Column definitions ────────────────────────────────────────────────────────

export interface KanbanColumn {
  id:       string
  label:    string
  statuses: string[]
  color:    string
  badge:    string
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id:       'nomeacao',
    label:    'Nomeação recebida',
    statuses: ['nomeado'],
    color:    'border-l-violet-400',
    badge:    'bg-violet-100 text-violet-700',
  },
  {
    id:       'proposta_pendente',
    label:    'Proposta pendente',
    statuses: ['aguardando'],
    color:    'border-l-amber-400',
    badge:    'bg-amber-100 text-amber-700',
  },
  {
    id:       'proposta_enviada',
    label:    'Proposta enviada',
    statuses: [], // future
    color:    'border-l-blue-400',
    badge:    'bg-blue-100 text-blue-700',
  },
  {
    id:       'em_andamento',
    label:    'Em andamento',
    statuses: ['em_andamento'],
    color:    'border-l-lime-500',
    badge:    'bg-lime-100 text-lime-700',
  },
  {
    id:       'laudo',
    label:    'Laudo em preparação',
    statuses: [], // future
    color:    'border-l-indigo-400',
    badge:    'bg-indigo-100 text-indigo-700',
  },
  {
    id:       'concluida',
    label:    'Entregue',
    statuses: ['concluida'],
    color:    'border-l-emerald-500',
    badge:    'bg-emerald-100 text-emerald-700',
  },
  {
    id:       'cancelada',
    label:    'Cancelada',
    statuses: ['cancelada'],
    color:    'border-l-red-300',
    badge:    'bg-red-100 text-red-600',
  },
]

// ── Next-status label map ─────────────────────────────────────────────────────

const NEXT_LABEL: Record<string, string> = {
  nomeado:      'Iniciar proposta',
  aguardando:   'Iniciar perícia',
  em_andamento: 'Marcar como entregue',
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface KanbanCardProps {
  p:              Pericia
  effectiveStatus: string
}

function KanbanCard({ p, effectiveStatus }: KanbanCardProps) {
  const router         = useRouter()
  const [pending, startTransition] = useTransition()
  const nextStatus     = getNextStatus(effectiveStatus)
  const nextLabel      = nextStatus ? NEXT_LABEL[effectiveStatus] : null

  function handleAdvance(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!nextStatus || pending) return
    startTransition(async () => {
      await updatePericiaStatus(String(p.id), effectiveStatus)
      router.refresh()
    })
  }

  return (
    <Link href={`/pericias/${p.id}`} className="block group">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-4 space-y-3 cursor-pointer">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {p.numero}
          </span>
        </div>

        {/* Subject */}
        <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-slate-900">
          {p.assunto}
        </p>

        {/* Meta rows */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-1.5">
            <User className="h-3 w-3 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-slate-500 leading-snug line-clamp-1">{p.cliente}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-slate-400 leading-snug line-clamp-2">{p.vara}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="h-3 w-3" />
            {p.prazo}
          </span>
          <span className="text-[11px] font-semibold text-emerald-700">{p.valor}</span>
        </div>

        {/* Advance button */}
        {nextLabel && (
          <button
            onClick={handleAdvance}
            disabled={pending}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-lime-50 hover:border-lime-300 hover:text-lime-700 text-slate-500 text-[11px] font-medium py-1.5 transition-colors disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {nextLabel}
          </button>
        )}

      </div>
    </Link>
  )
}

// ── Column ────────────────────────────────────────────────────────────────────

interface CardEntry {
  pericia:         Pericia
  effectiveStatus: string
}

function KanbanCol({ col, entries }: { col: KanbanColumn; entries: CardEntry[] }) {
  return (
    <div className="flex flex-col min-w-[272px] w-[272px]">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <p className="text-xs font-semibold text-slate-700 truncate flex-1">{col.label}</p>
        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${col.badge}`}>
          {entries.length}
        </span>
      </div>

      {/* Card list */}
      <div className={`flex-1 rounded-2xl border border-slate-200 bg-slate-50/60 border-l-4 ${col.color} p-3 space-y-2.5 min-h-[120px]`}>
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-slate-400 italic">Nenhum processo</p>
          </div>
        ) : (
          entries.map(({ pericia, effectiveStatus }) => (
            <KanbanCard key={pericia.id} p={pericia} effectiveStatus={effectiveStatus} />
          ))
        )}
      </div>
    </div>
  )
}

// ── Board ─────────────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  pericias:       Pericia[]
  statusOverrides: Record<string, string>
}

export function KanbanBoard({ pericias, statusOverrides }: KanbanBoardProps) {
  const [search, setSearch] = useState('')

  // Build entries with effective status applied
  const entries = useMemo<CardEntry[]>(() =>
    pericias.map((p) => ({
      pericia:         p,
      effectiveStatus: statusOverrides[String(p.id)] ?? p.status,
    })),
    [pericias, statusOverrides],
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(
      ({ pericia: p }) =>
        p.numero.toLowerCase().includes(q)  ||
        p.assunto.toLowerCase().includes(q) ||
        p.cliente.toLowerCase().includes(q) ||
        p.vara.toLowerCase().includes(q),
    )
  }, [entries, search])

  // Only show cancelada when it has cards
  const visibleColumns = KANBAN_COLUMNS.filter((col) => {
    if (col.id === 'cancelada') {
      return filtered.some(({ effectiveStatus }) => col.statuses.includes(effectiveStatus))
    }
    return true
  })

  return (
    <div className="space-y-4">

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número, assunto, parte ou vara…"
          className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-sm text-slate-800 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500/40"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Columns ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 w-max">
          {visibleColumns.map((col) => (
            <KanbanCol
              key={col.id}
              col={col}
              entries={filtered.filter(({ effectiveStatus }) => col.statuses.includes(effectiveStatus))}
            />
          ))}
        </div>
      </div>

      {/* ── Summary ────────────────────────────────────────────────────────── */}
      <p className="text-xs text-slate-400">
        {filtered.length} processo{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}
        {search && ` para "${search}"`}
      </p>

    </div>
  )
}

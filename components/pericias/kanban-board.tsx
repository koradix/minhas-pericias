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
    color:    'border-l-[#1f2937]',
    badge:    'bg-[#f2f3f9] text-[#1f2937]',
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
    color:    'border-l-[#416900]',
    badge:    'bg-[#f4fce3] text-[#416900]',
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
    color:    'border-l-[#416900]',
    badge:    'bg-[#f4fce3] text-[#416900]',
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
      <div className="rounded-xl border border-[#e2e8f0] bg-white hover:border-[#416900]/30 transition-all p-5 space-y-4 cursor-pointer">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-semibold tracking-[0.1em] text-[#9ca3af] uppercase font-inter">
            {p.numero}
          </span>
        </div>

        {/* Subject */}
        <p className="text-[15px] font-semibold text-[#1f2937] leading-tight line-clamp-2 group-hover:text-[#374151] font-manrope">
          {p.assunto}
        </p>

        {/* Meta rows */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-[#9ca3af] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <span className="text-[14px] text-[#6b7280] leading-snug line-clamp-1 font-inter">{p.cliente}</span>
          </div>
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-[#9ca3af] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <span className="text-[14px] text-[#9ca3af] leading-snug line-clamp-2 font-inter">{p.vara}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f2f3f9]">
          <span className="flex items-center gap-1.5 text-[12px] text-[#9ca3af] font-inter">
            <Calendar className="h-4 w-4" strokeWidth={1.5} />
            {p.prazo}
          </span>
          <span className="text-[13px] font-bold text-[#416900] font-inter">{p.valor}</span>
        </div>

        {/* Advance button */}
        {nextLabel && (
          <button
            onClick={handleAdvance}
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#f4fce3]/50 hover:border-[#416900]/30 hover:text-[#416900] text-[#6b7280] text-[12px] font-semibold py-2 transition-all disabled:opacity-50 font-inter"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
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
    <div className="flex flex-col min-w-[300px] w-[300px]">
      {/* Column header */}
      <div className="flex items-center gap-2.5 mb-4 px-1">
        <p className="text-[15px] font-semibold text-[#1f2937] truncate flex-1 font-manrope">{col.label}</p>
        <span className={`text-[11px] font-bold rounded-md px-2.5 py-0.5 font-inter ${col.badge}`}>
          {entries.length}
        </span>
      </div>

      {/* Card list */}
      <div className={`flex-1 rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff]/50 border-l-4 ${col.color} p-4 space-y-4 min-h-[200px]`}>
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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] pointer-events-none" strokeWidth={1.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número, assunto, parte ou vara…"
          className="w-full h-11 rounded-lg border border-[#e2e8f0] bg-white pl-10 pr-10 text-[14px] text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#416900] focus:outline-none focus:ring-4 focus:ring-[#416900]/5 transition-all font-inter"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151] transition-colors"
          >
            <X className="h-4 w-4" />
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

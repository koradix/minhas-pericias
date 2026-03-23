'use client'

import { useState, useMemo } from 'react'
import { Send, Clock, CheckCircle2, XCircle, MessageSquare, Star } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import type { Proposta } from '@prisma/client'
import { formatCurrency } from '@/lib/utils'

const statusConfig: Record<string, {
  label: string
  variant: 'info' | 'warning' | 'success' | 'danger' | 'secondary'
  icon: typeof Send
  color: string
}> = {
  enviada: { label: 'Enviada', variant: 'info', icon: Send, color: 'text-blue-600 bg-blue-50' },
  visualizada: { label: 'Visualizada', variant: 'warning', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  aceita: { label: 'Aceita', variant: 'success', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  recusada: { label: 'Recusada', variant: 'danger', icon: XCircle, color: 'text-red-600 bg-red-50' },
  em_negociacao: { label: 'Em negociação', variant: 'warning', icon: MessageSquare, color: 'text-violet-600 bg-violet-50' },
  concluida: { label: 'Concluída', variant: 'secondary', icon: Star, color: 'text-zinc-400 bg-muted' },
}

const FILTROS = [
  { key: '', label: 'Todas' },
  { key: 'enviada', label: 'Enviadas' },
  { key: 'visualizada', label: 'Visualizadas' },
  { key: 'aceita', label: 'Aceitas' },
  { key: 'em_negociacao', label: 'Em negociação' },
  { key: 'recusada', label: 'Recusadas' },
  { key: 'concluida', label: 'Concluídas' },
]

export function PropostasClient({ propostas }: { propostas: Proposta[] }) {
  const [filtro, setFiltro] = useState('')

  const filtered = useMemo(
    () => (!filtro ? propostas : propostas.filter((p) => p.status === filtro)),
    [propostas, filtro],
  )

  function formatDate(d: Date) {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propostas"
        description="Acompanhe o status de todos os seus convites enviados a peritos"
      />

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => {
          const count = !f.key
            ? propostas.length
            : propostas.filter((p) => p.status === f.key).length
          return (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filtro === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-card border border-border text-zinc-400 hover:bg-muted'
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className={`inline-flex items-center justify-center h-4 min-w-[1rem] rounded-full px-1 text-[10px] font-bold ${
                  filtro === f.key ? 'bg-card/30 text-white' : 'bg-zinc-900/50 text-zinc-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Send}
          title={propostas.length === 0 ? 'Nenhuma proposta enviada' : 'Nenhum resultado'}
          description={
            propostas.length === 0
              ? 'Busque peritos compatíveis com suas demandas e envie convites.'
              : 'Tente outro filtro de status.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const conf = statusConfig[p.status] ?? statusConfig['enviada']
            const Icon = conf.icon
            return (
              <div
                key={p.id}
                className="flex gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-saas transition-all"
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${conf.color}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.peritoNome}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{p.demandaTitulo}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={conf.variant}>{conf.label}</Badge>
                    </div>
                  </div>
                  {p.mensagem && (
                    <p className="mt-2 text-xs text-zinc-400 leading-relaxed line-clamp-2 italic">
                      {'"'}{p.mensagem}{'"'}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(p.createdAt)}
                    </span>
                    {p.valorProposto && (
                      <span className="font-medium text-zinc-400">
                        {formatCurrency(p.valorProposto)}
                      </span>
                    )}
                    <span className="text-[10px] bg-zinc-900/50 rounded px-1.5 py-0.5">
                      #{p.peritoId}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { ExternalLink, Eye, FileText, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { marcarVisualizado } from '@/lib/actions/nomeacoes'
import type { CitacaoSerializada } from '@/lib/data/nomeacoes'
import { cn } from '@/lib/utils'

interface Props {
  citacoes: CitacaoSerializada[]
}

// ─── Single card ──────────────────────────────────────────────────────────────

function CitacaoCard({ citacao }: { citacao: CitacaoSerializada }) {
  const [expanded, setExpanded] = useState(false)
  const [lida, setLida] = useState(citacao.visualizado)
  const [isPending, startTransition] = useTransition()

  const dataFormatada = new Date(citacao.diarioData).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  function handleMarcarLida() {
    startTransition(async () => {
      await marcarVisualizado(citacao.id)
      setLida(true)
    })
  }

  const isLong = citacao.snippet.length > 220
  const snippet = !expanded && isLong ? `${citacao.snippet.slice(0, 220)}…` : citacao.snippet

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        lida ? 'border-border bg-card' : 'border-brand-500/30 bg-brand-500/10/40',
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <div className="flex-shrink-0 pt-1.5">
          {!lida ? (
            <span className="block h-2 w-2 rounded-full bg-brand-500" />
          ) : (
            <span className="block h-2 w-2 rounded-full bg-slate-200" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {/* Tribunal sigla */}
            <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
              {citacao.diarioSigla}
            </span>

            {/* Date */}
            <span className="text-xs text-zinc-400">{dataFormatada}</span>

            {/* Manual badge */}
            {citacao.fonte === 'manual' && (
              <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                manual
              </span>
            )}
          </div>

          {/* Snippet */}
          <p className="text-xs text-zinc-300 leading-relaxed">{snippet}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-[11px] font-medium text-brand-400 hover:text-lime-800"
            >
              {expanded ? 'Ver menos' : 'Ver mais'}
            </button>
          )}

          {/* Footer chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {citacao.numeroProcesso && (
              <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700 ring-1 ring-inset ring-blue-200">
                <Hash className="h-2.5 w-2.5" />
                {citacao.numeroProcesso}
              </span>
            )}

            {citacao.linkCitacao && (
              <a
                href={citacao.linkCitacao}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Ver no diário
              </a>
            )}

            {!lida && (
              <button
                onClick={handleMarcarLida}
                disabled={isPending}
                className="ml-auto flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
              >
                <Eye className="h-3 w-3" />
                Marcar como lida
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function CitacoesList({ citacoes }: Props) {
  if (citacoes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhuma citação encontrada ainda"
        description="Clique em 'Buscar nomeações agora' para verificar os diários dos seus tribunais."
      />
    )
  }

  const naoLidas = citacoes.filter((c) => !c.visualizado).length

  return (
    <div className="space-y-2">
      {naoLidas > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500/20 px-1.5 text-[10px] font-bold text-brand-400">
            {naoLidas}
          </span>
          <span className="text-xs text-zinc-400">não lida{naoLidas > 1 ? 's' : ''}</span>
        </div>
      )}
      {citacoes.map((c) => (
        <CitacaoCard key={c.id} citacao={c} />
      ))}
    </div>
  )
}

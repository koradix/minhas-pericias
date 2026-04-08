'use client'

import React, { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckpointMediaPanel } from '@/components/rotas/checkpoint-media-panel'
import { updateCheckpointStatus } from '@/lib/actions/checkpoint-media'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckpointItem {
  id: string
  titulo: string
  endereco?: string
  ordem: number
  pericoId?: string
  tipo?: 'FORUM' | 'VARA_CIVEL' | 'ESCRITORIO' | 'PERICIA'
  tribunalSigla?: string
  varaNome?: string
  statusCheckpoint?: 'pendente' | 'chegou' | 'concluido'
}

interface Props {
  rotaId: string
  checkpoints: CheckpointItem[]
  onFinalizar?: () => void
}

type CPStatus = 'pendente' | 'chegou' | 'concluido'

// ─── Component ────────────────────────────────────────────────────────────────

export function RotaPericiasExecucao({ rotaId, checkpoints, onFinalizar }: Props) {
  const [statusMap, setStatusMap] = useState<Record<string, CPStatus>>(() =>
    Object.fromEntries(checkpoints.map((c) => [c.id, (c.statusCheckpoint ?? 'pendente') as CPStatus])),
  )
  const [activeCheckpoint, setActiveCheckpoint] = useState<CheckpointItem | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  function handleCheguei(cp: CheckpointItem) {
    setLoadingId(cp.id)
    startTransition(async () => {
      await updateCheckpointStatus(cp.id, 'chegou', {
        rotaId,
        ordem: cp.ordem,
        titulo: cp.titulo,
        endereco: cp.endereco,
        pericoId: cp.pericoId,
        tribunalSigla: cp.tribunalSigla,
        varaNome: cp.varaNome,
      })
      setStatusMap((prev) => ({ ...prev, [cp.id]: 'chegou' }))
      setActiveCheckpoint(cp)
      setLoadingId(null)
    })
  }

  function handleConcluido() {
    if (!activeCheckpoint) return
    setStatusMap((prev) => ({ ...prev, [activeCheckpoint.id]: 'concluido' }))
    setActiveCheckpoint(null)
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
          CHECKPOINTS EM CAMPO
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-200">
          {checkpoints.filter((c) => statusMap[c.id] === 'concluido').length} / {checkpoints.length} CONCLUÍDOS
        </span>
      </div>

      <div className="space-y-px bg-slate-100 border border-slate-100 shadow-sm overflow-hidden">
        {checkpoints.map((cp) => {
          const status = statusMap[cp.id]
          const isLoading = loadingId === cp.id
          const isChegou = status === 'chegou'

          return (
            <div
              key={cp.id}
              className={cn(
                "flex items-center gap-8 bg-white p-6 transition-all",
                status === 'concluido' ? 'opacity-30 grayscale' : '',
              )}
            >
              {/* Ordem */}
              <div className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center text-[10px] font-bold tracking-widest",
                status === 'concluido' ? "bg-slate-50 text-slate-300" : isChegou ? "bg-[#a3e635] text-slate-900" : "bg-slate-900 text-white"
              )}>
                {cp.ordem}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-[11px] font-bold uppercase tracking-wider", status === 'concluido' ? 'text-slate-300' : 'text-slate-900')}>{cp.titulo}</p>
                {cp.endereco && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 truncate">{cp.endereco}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-8">
                {status === 'pendente' && (
                  <button
                    className="h-10 px-8 bg-white border-2 border-[#a3e635] text-slate-900 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-slate-50 transition-all shadow-sm"
                    onClick={() => handleCheguei(cp)}
                    disabled={isPending}
                  >
                    {isLoading ? '...' : 'CHEGUEI'}
                  </button>
                )}

                {(status === 'chegou' || status === 'concluido') && (
                  <button
                    onClick={() => setActiveCheckpoint(cp)}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    EVIDÊNCIAS
                  </button>
                )}

                {isChegou && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">
                    NO LOCAL
                  </span>
                )}
                
                {status === 'concluido' && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">OK</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress footer */}
      {checkpoints.length > 0 && checkpoints.every((c) => statusMap[c.id] === 'concluido') && (
        <div className="mt-12 pt-12 border-t border-dashed border-slate-100 flex flex-col items-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4">
            TODOS OS CHECKPOINTS CONCLUÍDOS
          </p>
          {onFinalizar && (
            <button
              onClick={onFinalizar}
              className="h-12 px-8 bg-[#a3e635] text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:brightness-105 transition-all"
            >
              FINALIZAR ROTA
            </button>
          )}
        </div>
      )}

      {/* Media panel overlay */}
      {activeCheckpoint && (
        <CheckpointMediaPanel
          checkpointId={activeCheckpoint.id}
          checkpointTitulo={activeCheckpoint.titulo}
          endereco={activeCheckpoint.endereco}
          tipo={activeCheckpoint.tipo}
          tribunalSigla={activeCheckpoint.tribunalSigla}
          varaNome={activeCheckpoint.varaNome}
          onClose={() => setActiveCheckpoint(null)}
          onConcluido={handleConcluido}
        />
      )}
    </>
  )
}

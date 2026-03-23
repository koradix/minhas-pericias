'use client'

import { useState, useTransition } from 'react'
import { MapPin, Camera, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckpointMediaPanel } from '@/components/rotas/checkpoint-media-panel'
import { updateCheckpointStatus } from '@/lib/actions/checkpoint-media'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckpointItem {
  id: string
  titulo: string
  endereco?: string
  ordem: number
}

interface Props {
  rotaId: string
  checkpoints: CheckpointItem[]
}

type CPStatus = 'pendente' | 'chegou' | 'concluido'

// ─── Component ────────────────────────────────────────────────────────────────

export function RotaPericiasExecucao({ rotaId, checkpoints }: Props) {
  const [statusMap, setStatusMap] = useState<Record<string, CPStatus>>(() =>
    Object.fromEntries(checkpoints.map((c) => [c.id, 'pendente' as CPStatus])),
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

  const statusConfig: Record<CPStatus, { label: string; variant: 'secondary' | 'warning' | 'success' }> = {
    pendente: { label: 'Pendente', variant: 'secondary' },
    chegou: { label: 'No local', variant: 'warning' },
    concluido: { label: 'Concluído', variant: 'success' },
  }

  return (
    <>
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          Em campo
        </span>
        <span className="text-[10px] text-slate-400">
          {checkpoints.filter((c) => statusMap[c.id] === 'concluido').length}/{checkpoints.length} checkpoints
        </span>
      </div>

      <div className="space-y-2">
        {checkpoints.map((cp) => {
          const status = statusMap[cp.id]
          const conf = statusConfig[status]
          const isLoading = loadingId === cp.id

          return (
            <div
              key={cp.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                status === 'concluido'
                  ? 'border-emerald-100 bg-emerald-50/60 opacity-75'
                  : status === 'chegou'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-slate-100 bg-white'
              }`}
            >
              {/* Ordem badge */}
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  status === 'concluido'
                    ? 'bg-emerald-100 text-emerald-700'
                    : status === 'chegou'
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {status === 'concluido' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  cp.ordem
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{cp.titulo}</p>
                {cp.endereco && (
                  <p className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="truncate">{cp.endereco}</span>
                  </p>
                )}
              </div>

              {/* Action / status */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {status === 'pendente' && (
                  <Button
                    size="sm"
                    className="h-7 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    onClick={() => handleCheguei(cp)}
                    disabled={isPending}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <MapPin className="h-3 w-3" />
                    )}
                    Cheguei
                  </Button>
                )}

                {status === 'chegou' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
                    onClick={() => setActiveCheckpoint(cp)}
                  >
                    <Camera className="h-3 w-3" />
                    Evidências
                  </Button>
                )}

                {status === 'concluido' && (
                  <Badge variant="success">Concluído</Badge>
                )}

                {status !== 'concluido' && (
                  <Badge variant={conf.variant} className="text-[10px]">
                    {conf.label}
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress footer */}
      {checkpoints.every((c) => statusMap[c.id] === 'concluido') && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-semibold text-emerald-800">
            Todos os checkpoints concluídos — rota finalizada!
          </p>
        </div>
      )}

      {/* Media panel (portal-like overlay) */}
      {activeCheckpoint && (
        <CheckpointMediaPanel
          checkpointId={activeCheckpoint.id}
          checkpointTitulo={activeCheckpoint.titulo}
          endereco={activeCheckpoint.endereco}
          onClose={() => setActiveCheckpoint(null)}
          onConcluido={handleConcluido}
        />
      )}
    </>
  )
}

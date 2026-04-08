'use client'

import React, { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { RotaPericiasExecucao } from '@/components/rotas/rota-pericias-execucao'
import { iniciarRota } from '@/lib/actions/rotas-nova'
import type { Rota, StatusRota, TipoPontoRota } from '@/lib/types/rotas'

// ─── Config ───────────────────────────────────────────────────────────────────

const pontoConfig: Record<TipoPontoRota, { label: string }> = {
  FORUM:      { label: 'Fórum'      },
  VARA_CIVEL: { label: 'Vara'       },
  ESCRITORIO: { label: 'Escritório' },
  PERICIA:    { label: 'Perícia'    },
}

const statusMap: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'secondary' }> = {
  planejada:    { label: 'Planejada',    variant: 'info'      },
  em_execucao:  { label: 'Em execução', variant: 'warning'   },
  em_andamento: { label: 'Em andamento', variant: 'warning'  },
  concluida:    { label: 'Concluída',    variant: 'success'   },
  cancelada:    { label: 'Cancelada',    variant: 'secondary' },
}

function formatTempo(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RotasProspeccaoListClient({ rotas }: { rotas: Rota[] }) {
  const [localStatus, setLocalStatus] = useState<Record<string, StatusRota>>({})
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  function getStatus(rota: Rota): StatusRota {
    return localStatus[rota.id] ?? rota.status
  }

  function handleIniciar(rotaId: string) {
    setLoadingId(rotaId)
    startTransition(async () => {
      await iniciarRota(rotaId)
      setLocalStatus((p) => ({ ...p, [rotaId]: 'em_execucao' }))
      setLoadingId(null)
    })
  }

  return (
    <div className="space-y-12">
      {rotas.map((rota) => {
        const status = getStatus(rota)
        const st = statusMap[status] ?? { label: status, variant: 'secondary' as const }
        const isLoading = loadingId === rota.id
        const emCampo = status === 'em_execucao'

        return (
          <Card key={rota.id} className={cn(
            "rounded-none border transition-all",
            status === 'concluida' ? 'opacity-30 border-slate-100 grayscale' : 'border-slate-200',
          )}>
            <CardHeader className="p-8 pb-3">
              <div className="flex items-start justify-between gap-8">
                <div className="min-w-0">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant={st.variant} className="rounded-none uppercase text-[9px] px-2 py-0.5 tracking-widest">{st.label}</Badge>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rota.data}</span>
                  </div>
                  <CardTitle className="text-lg font-bold tracking-tight uppercase leading-tight">{rota.titulo}</CardTitle>
                </div>

                {status === 'planejada' && (
                  <button
                    className="h-10 px-6 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-20 transition-all font-bold"
                    onClick={() => handleIniciar(rota.id)}
                    disabled={isPending}
                  >
                    {isLoading ? '...' : 'INICIAR'}
                  </button>
                )}

                {emCampo && (
                  <Badge variant="warning" className="rounded-none uppercase tracking-widest text-[10px] px-3 py-1">
                    EM CAMPO
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-8 pt-0">
              <div className="mb-10 space-y-4">
                {emCampo ? (
                  <RotaPericiasExecucao
                    rotaId={rota.id}
                    checkpoints={rota.pontos.map((p) => ({
                      id: p.id,
                      titulo: p.nome,
                      endereco: p.endereco,
                      ordem: p.ordem,
                      pericoId: p.pericoId,
                      tipo: p.tipo,
                      tribunalSigla: p.tribunalSigla,
                      varaNome: p.varaNome,
                      comarca: p.comarca,
                      statusCheckpoint: p.statusCheckpoint,
                      varasJson: p.varasJson,
                      juizNome: p.juizNome,
                      secretarioNome: p.secretarioNome,
                      foiNomeado: p.foiNomeado,
                      observacoes: p.observacoes,
                    }))}
                  />
                ) : (
                  <div className="space-y-px bg-slate-50 border border-slate-50">
                    {rota.pontos.map((p) => {
                      const conf = pontoConfig[p.tipo]
                      return (
                        <div key={p.id} className="flex items-center gap-6 bg-white p-6 leading-none">
                          <span className="text-[10px] font-bold text-slate-300 w-4 text-right">
                            {p.ordem}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider truncate leading-tight">{p.nome}</p>
                            {p.endereco && (
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate">{p.endereco}</p>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 shrink-0">
                            {p.periciaInfo?.tipo ?? conf.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-10 pt-8 border-t border-slate-50 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-300">
                <span className="tabular-nums">{rota.distanciaKm} KM</span>
                <span className="tabular-nums">{formatTempo(rota.tempoEstimadoMin)}</span>
                <span className="tabular-nums">{formatCurrency(rota.custoEstimado)}</span>
                <span>{rota.pontos.length} PARADAS</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

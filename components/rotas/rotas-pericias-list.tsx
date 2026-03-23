'use client'

import { useState } from 'react'
import { MapPin, Clock, Banknote, Navigation, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { RotaPericiasExecucao } from '@/components/rotas/rota-pericias-execucao'
import type { Rota, StatusRota } from '@/lib/types/rotas'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusMap = {
  planejada:    { label: 'Planejada',     variant: 'info'    as const },
  em_execucao:  { label: 'Em execução',   variant: 'warning' as const },
  concluida:    { label: 'Concluída',     variant: 'success' as const },
  cancelada:    { label: 'Cancelada',     variant: 'danger'  as const },
}

function formatTempo(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RotasPericiasListClient({ rotas }: { rotas: Rota[] }) {
  const [localStatus, setLocalStatus] = useState<Record<string, StatusRota>>({})

  function getStatus(rota: Rota): StatusRota {
    return localStatus[rota.id] ?? rota.status
  }

  return (
    <div className="space-y-4">
      {rotas.map((rota) => {
        const status = getStatus(rota)
        const st = statusMap[status]

        return (
          <Card key={rota.id} className={status === 'concluida' ? 'opacity-70' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={st.variant}>{st.label}</Badge>
                    <span className="text-xs text-slate-400">{rota.data}</span>
                  </div>
                  <CardTitle className="text-base">{rota.titulo}</CardTitle>
                </div>

                {status === 'planejada' && (
                  <Button
                    size="sm"
                    className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() =>
                      setLocalStatus((p) => ({ ...p, [rota.id]: 'em_execucao' }))
                    }
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Iniciar
                  </Button>
                )}

                {status === 'em_execucao' && (
                  <Badge variant="warning" className="flex-shrink-0">
                    Em campo
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="mb-4 space-y-2">
                {status === 'em_execucao' ? (
                  <RotaPericiasExecucao
                    rotaId={rota.id}
                    checkpoints={rota.pontos.map((p) => ({
                      id: p.id,
                      titulo: p.nome,
                      endereco: p.endereco,
                      ordem: p.ordem,
                    }))}
                  />
                ) : (
                  rota.pontos.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-start gap-3 rounded-lg bg-emerald-50/60 border border-emerald-100 p-3"
                    >
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <FileText className="h-3 w-3 text-emerald-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-emerald-900">{p.nome}</p>
                        {p.endereco && (
                          <p className="flex items-center gap-1 text-[11px] text-emerald-700 mt-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {p.endereco}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 rounded px-1.5 py-0.5">
                        Parada {p.ordem}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center gap-5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {rota.distanciaKm} km
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {formatTempo(rota.tempoEstimadoMin)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5 text-slate-400" />
                  {formatCurrency(rota.custoEstimado)}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

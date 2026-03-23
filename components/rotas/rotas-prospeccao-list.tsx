'use client'

import { useState } from 'react'
import { MapPin, Clock, Banknote, Navigation, Building2, Landmark, Briefcase } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import { RotaPericiasExecucao } from '@/components/rotas/rota-pericias-execucao'
import type { Rota, StatusRota, TipoPontoRota } from '@/lib/types/rotas'

// ─── Config ───────────────────────────────────────────────────────────────────

const pontoConfig: Record<TipoPontoRota, { icon: typeof MapPin; color: string; bg: string; label: string }> = {
  FORUM:      { icon: Building2, color: 'text-blue-700',   bg: 'bg-blue-50',   label: 'Fórum'      },
  VARA_CIVEL: { icon: Landmark,  color: 'text-violet-700', bg: 'bg-violet-50', label: 'Vara'       },
  ESCRITORIO: { icon: Briefcase, color: 'text-amber-700',  bg: 'bg-amber-50',  label: 'Escritório' },
  PERICIA:    { icon: MapPin,    color: 'text-emerald-700',bg: 'bg-emerald-50',label: 'Perícia'    },
}

const statusMap = {
  planejada:   { label: 'Planejada',   variant: 'info'    as const },
  em_execucao: { label: 'Em execução', variant: 'warning' as const },
  concluida:   { label: 'Concluída',   variant: 'success' as const },
  cancelada:   { label: 'Cancelada',   variant: 'danger'  as const },
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
                    <span className="text-xs text-zinc-500">{rota.data}</span>
                  </div>
                  <CardTitle className="text-base">{rota.titulo}</CardTitle>
                </div>

                {status === 'planejada' && (
                  <Button
                    size="sm"
                    className="flex-shrink-0 bg-violet-600 hover:bg-violet-700"
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
              <div className="mb-4 space-y-1.5">
                {status === 'em_execucao' ? (
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
                    }))}
                  />
                ) : (
                  rota.pontos.map((p) => {
                    const conf = pontoConfig[p.tipo]
                    const Icon = conf.icon
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-zinc-500 w-4 text-right">
                          {p.ordem}
                        </span>
                        <div
                          className={cn(
                            'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md',
                            conf.bg,
                          )}
                        >
                          <Icon className={cn('h-3 w-3', conf.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground">{p.nome}</p>
                          {p.endereco && (
                            <p className="text-[10px] text-zinc-500">{p.endereco}</p>
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                            conf.bg,
                            conf.color,
                          )}
                        >
                          {conf.label}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="flex items-center gap-5 pt-3 border-t border-border text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                  {rota.distanciaKm} km
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  {formatTempo(rota.tempoEstimadoMin)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5 text-zinc-500" />
                  {formatCurrency(rota.custoEstimado)}
                </span>
                <span className="flex items-center gap-1.5 text-zinc-500">
                  {rota.pontos.length} paradas
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

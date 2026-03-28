'use client'

import { useState, useTransition } from 'react'
import { MapPin, Clock, Banknote, Navigation, FileText, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { RotaPericiasExecucao } from '@/components/rotas/rota-pericias-execucao'
import { iniciarRota } from '@/lib/actions/rotas-nova'
import type { Rota, StatusRota } from '@/lib/types/rotas'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMapsUrl(pontos: Rota['pontos']): string | null {
  const enderecos = pontos
    .sort((a, b) => a.ordem - b.ordem)
    .map((p) => p.endereco)
    .filter(Boolean) as string[]
  if (enderecos.length === 0) return null
  if (enderecos.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecos[0])}`
  }
  const origin = encodeURIComponent(enderecos[0])
  const destination = encodeURIComponent(enderecos[enderecos.length - 1])
  const waypoints = enderecos.slice(1, -1).map(encodeURIComponent).join('|')
  const base = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
  return waypoints ? `${base}&waypoints=${waypoints}` : base
}

const statusMap: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'danger' | 'secondary' }> = {
  planejada:    { label: 'Planejada',     variant: 'info'      },
  em_execucao:  { label: 'Em execução',   variant: 'warning'   },
  em_andamento: { label: 'Em andamento',  variant: 'warning'   },
  concluida:    { label: 'Concluída',     variant: 'success'   },
  cancelada:    { label: 'Cancelada',     variant: 'secondary' },
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
    <div className="space-y-4">
      {rotas.map((rota) => {
        const status = getStatus(rota)
        const st = statusMap[status] ?? { label: status, variant: 'secondary' as const }
        const isLoading = loadingId === rota.id

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
                    onClick={() => handleIniciar(rota.id)}
                    disabled={isPending}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Navigation className="h-3.5 w-3.5" />
                    )}
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
                      pericoId: p.pericoId,
                      tipo: p.tipo,
                      tribunalSigla: p.tribunalSigla,
                      varaNome: p.varaNome,
                      statusCheckpoint: p.statusCheckpoint,
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
                        {p.periciaInfo && (
                          <p className="text-[11px] font-medium text-emerald-700 mt-0.5">{p.periciaInfo.tipo}</p>
                        )}
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

              <div className="flex items-center justify-between gap-3">
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
                {(() => {
                  const mapsUrl = buildMapsUrl(rota.pontos)
                  return mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver no Maps
                    </a>
                  ) : null
                })()}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

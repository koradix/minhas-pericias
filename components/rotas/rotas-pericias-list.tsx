'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RotaPericiasExecucao } from '@/components/rotas/rota-pericias-execucao'
import { iniciarRota, finalizarRota, reabrirRota } from '@/lib/actions/rotas-nova'
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

const statusConfig: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'secondary' }> = {
  planejada:    { label: 'Planejada',    variant: 'secondary' },
  em_execucao:  { label: 'Em campo',     variant: 'warning'   },
  em_andamento: { label: 'Pronta',       variant: 'info'      },
  concluida:    { label: 'Concluída',    variant: 'success'   },
  cancelada:    { label: 'Cancelada',    variant: 'secondary' },
}

// ─── Rota card ────────────────────────────────────────────────────────────────

function RotaCard({ rota }: { rota: Rota }) {
  const [localStatus, setLocalStatus] = useState<StatusRota>(rota.status)
  const [isPending, startTransition] = useTransition()

  const status = localStatus
  const st = statusConfig[status] ?? { label: status, variant: 'secondary' as const }
  const emCampo = status === 'em_execucao'
  const concluida = status === 'concluida'
  const mapsUrl = buildMapsUrl(rota.pontos)

  const enderecosPrincipais = rota.pontos
    .sort((a, b) => a.ordem - b.ordem)
    .slice(0, 2)
    .map((p) => p.endereco)
    .filter(Boolean) as string[]

  function handleIniciar() {
    startTransition(async () => {
      await iniciarRota(rota.id)
      setLocalStatus('em_execucao')
    })
  }

  function handleFinalizar() {
    startTransition(async () => {
      await finalizarRota(rota.id)
      setLocalStatus('concluida')
    })
  }

  function handleReabrir() {
    startTransition(async () => {
      await reabrirRota(rota.id)
      setLocalStatus('em_execucao')
    })
  }

  return (
    <div className={cn(
      'rounded-2xl border bg-white shadow-sm overflow-hidden transition-all',
      emCampo ? 'border-amber-200' : concluida ? 'border-slate-100 opacity-70' : 'border-slate-200',
    )}>
      {/* Card header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant={st.variant}>{st.label}</Badge>
              <span className="text-xs text-slate-400">{rota.data}</span>
              {rota.pontos.length > 0 && (
                <span className="text-xs text-slate-400">
                  · {rota.pontos.length} local{rota.pontos.length > 1 ? 'is' : ''}
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 leading-snug">{rota.titulo}</h3>

            {/* Endereço principal — só quando planejada */}
            {!emCampo && !concluida && enderecosPrincipais.length > 0 && (
              <p className="flex items-center gap-1 text-xs text-slate-500 mt-1.5">
                <MapPin className="h-3 w-3 flex-shrink-0 text-slate-400" />
                <span className="truncate">{enderecosPrincipais[0]}</span>
                {enderecosPrincipais.length > 1 && (
                  <span className="text-slate-400 flex-shrink-0">+{rota.pontos.length - 1} mais</span>
                )}
              </p>
            )}

            {/* Link para a perícia se existir */}
            {rota.pontos.some((p) => p.pericoId) && (
              <Link
                href={`/pericias/${rota.pontos.find((p) => p.pericoId)?.pericoId}`}
                className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-violet-600 hover:text-violet-800 transition-colors"
              >
                <ChevronRight className="h-3 w-3" />
                Ver perícia
              </Link>
            )}
          </div>

          {/* Ações */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {(status === 'planejada' || status === 'em_andamento') && (
              <Button
                size="sm"
                className="bg-lime-500 hover:bg-lime-600 text-white font-semibold gap-1.5"
                onClick={handleIniciar}
                disabled={isPending}
              >
                {isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Navigation className="h-3.5 w-3.5" />
                }
                Iniciar vistoria
              </Button>
            )}

            {concluida && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReabrir}
                  disabled={isPending}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors disabled:opacity-40"
                >
                  Reabrir
                </button>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Finalizada
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkpoints — só aparecem quando em campo */}
      {emCampo && (
        <div className="border-t border-amber-100 px-5 py-4">
          <RotaPericiasExecucao
            rotaId={rota.id}
            onFinalizar={handleFinalizar}
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
        </div>
      )}

      {/* Rodapé — Google Maps link */}
      {mapsUrl && (
        <div className={cn(
          'flex justify-end px-5 py-2.5 border-t',
          emCampo ? 'border-amber-100 bg-amber-50/40' : 'border-slate-50 bg-slate-50/60',
        )}>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir no Google Maps
          </a>
        </div>
      )}
    </div>
  )
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function RotasPericiasListClient({ rotas }: { rotas: Rota[] }) {
  // Sort: em campo first, then planejada, then concluida
  const sorted = [...rotas].sort((a, b) => {
    const order = { em_execucao: 0, em_andamento: 1, planejada: 1, concluida: 2, cancelada: 3 }
    return (order[a.status as keyof typeof order] ?? 1) - (order[b.status as keyof typeof order] ?? 1)
  })

  const ativas = sorted.filter((r) => r.status !== 'concluida' && r.status !== 'cancelada')

  const concluidas = sorted.filter((r) => r.status === 'concluida' || r.status === 'cancelada')

  return (
    <div className="space-y-6">
      {/* Rotas ativas */}
      {ativas.length > 0 && (
        <div className="space-y-3">
          {ativas.map((rota) => (
            <RotaCard key={rota.id} rota={rota} />
          ))}
        </div>
      )}

      {/* Concluídas — colapsadas */}
      {concluidas.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Concluídas ({concluidas.length})
          </p>
          <div className="space-y-2">
            {concluidas.map((rota) => (
              <RotaCard key={rota.id} rota={rota} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

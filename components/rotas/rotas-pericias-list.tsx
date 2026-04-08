'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
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
      'rounded-none border bg-white transition-all',
      status === 'concluida' ? 'opacity-30 border-slate-100 grayscale' : 'border-slate-200',
    )}>
      {/* Card header */}
      <div className="px-8 py-8">
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <Badge variant={st.variant} className="rounded-none uppercase text-[9px] px-2 py-0.5 tracking-widest">{st.label}</Badge>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rota.data}</span>
              {rota.pontos.length > 0 && (
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  · {rota.pontos.length} LOCAL{rota.pontos.length > 1 ? 'IS' : ''}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase leading-tight">{rota.titulo}</h3>

            {/* Endereço principal — só quando planejada */}
            {!emCampo && !concluida && enderecosPrincipais.length > 0 && (
              <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest truncate">
                {enderecosPrincipais[0]}
                {enderecosPrincipais.length > 1 && (
                  <span className="text-slate-200 ml-2">+{rota.pontos.length - 1} MAIS</span>
                )}
              </p>
            )}

            {/* Link para a perícia if exists */}
            {rota.pontos.some((p) => p.pericoId) && (
              <Link
                href={`/pericias/${rota.pontos.find((p) => p.pericoId)?.pericoId}`}
                className="inline-block mt-4 text-[10px] font-bold uppercase tracking-widest text-[#a3e635] hover:text-slate-900 transition-colors"
              >
                DETALHES DA PERÍCIA
              </Link>
            )}
          </div>

          {/* Ações */}
          <div className="flex-shrink-0 flex items-center gap-6">
            {(status === 'planejada' || status === 'em_andamento') && (
              <button
                className="h-12 px-8 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-20 transition-all font-bold"
                onClick={handleIniciar}
                disabled={isPending}
              >
                {isPending ? 'PROCESSANDO...' : 'INICIAR ROTA'}
              </button>
            )}

            {concluida && (
              <div className="flex items-center gap-6">
                <button
                  onClick={handleReabrir}
                  disabled={isPending}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-20"
                >
                  REABRIR
                </button>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">
                  FINALIZADA
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkpoints — só aparecem quando em campo */}
      {emCampo && (
        <div className="border-t border-slate-100 p-8 pt-0">
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
              comarca: p.comarca,
              statusCheckpoint: p.statusCheckpoint,
              varasJson: p.varasJson,
              juizNome: p.juizNome,
              secretarioNome: p.secretarioNome,
              foiNomeado: p.foiNomeado,
              observacoes: p.observacoes,
            }))}
          />
        </div>
      )}

      {/* Footer — Google Maps link */}
      {mapsUrl && (
        <div className="flex justify-end px-8 py-4 border-t border-slate-50 bg-slate-50/30">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors"
          >
            ABRIR NO GOOGLE MAPS
          </a>
        </div>
      )}
    </div>
  )
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function RotasPericiasListClient({ rotas }: { rotas: Rota[] }) {
  const sorted = [...rotas].sort((a, b) => {
    const order = { em_execucao: 0, em_andamento: 1, planejada: 1, concluida: 2, cancelada: 3 }
    return (order[a.status as keyof typeof order] ?? 1) - (order[b.status as keyof typeof order] ?? 1)
  })

  const ativas = sorted.filter((r) => r.status !== 'concluida' && r.status !== 'cancelada')
  const concluidas = sorted.filter((r) => r.status === 'concluida' || r.status === 'cancelada')

  return (
    <div className="space-y-16">
      {/* Rotas ativas */}
      {ativas.length > 0 && (
        <div className="space-y-px bg-slate-100 border border-slate-100 shadow-sm overflow-hidden">
          {ativas.map((rota) => (
            <RotaCard key={rota.id} rota={rota} />
          ))}
        </div>
      )}

      {/* Concluídas */}
      {concluidas.length > 0 && (
        <div className="space-y-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            CONCLUÍDAS ({concluidas.length})
          </h3>
          <div className="space-y-px bg-slate-100 border border-slate-100 shadow-sm overflow-hidden opacity-50 grayscale">
            {concluidas.map((rota) => (
              <RotaCard key={rota.id} rota={rota} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

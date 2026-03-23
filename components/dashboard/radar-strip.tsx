'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Radar, BellDot, CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buscarNomeacoes } from '@/lib/actions/nomeacoes'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  hasConfig: boolean
  naoLidas: number
  totalCitacoes: number
  ultimaBusca: string | null
  saldo: number | null
}

function formatUltimaBusca(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 60) return `${diffMin}min atrás`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h atrás`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RadarStrip({ hasConfig, naoLidas, totalCitacoes, ultimaBusca, saldo }: Props) {
  const [isPending, startTransition] = useTransition()
  const [localNaoLidas, setLocalNaoLidas] = useState(naoLidas)
  const [novasBusca, setNovasBusca] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // ── Sem config → setup CTA ────────────────────────────────────────────────
  if (!hasConfig) {
    return (
      <Link href="/nomeacoes">
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-brand-500/50 bg-brand-500/10/40 px-5 py-3.5 hover:bg-brand-500/10 transition-colors cursor-pointer">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/20">
            <Radar className="h-4 w-4 text-brand-400" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-lime-800">
              Configure o Radar de Nomeações
            </p>
            <p className="text-xs text-brand-500 mt-0.5">
              Monitore seus tribunais e receba alertas de citações nos diários oficiais
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-400 bg-brand-500/20 border border-brand-500/30 rounded-lg px-3 py-1.5 flex-shrink-0 whitespace-nowrap">
            Configurar →
          </span>
        </div>
      </Link>
    )
  }

  // ── Com config → status + verificar ──────────────────────────────────────
  const hasNotifications = localNaoLidas > 0

  function handleVerificar() {
    if (saldo !== null && saldo < 3) {
      if (!confirm(`Saldo baixo (R$ ${saldo.toFixed(2)}). Verificar mesmo assim?`)) return
    }
    setErr(null)
    setNovasBusca(null)
    startTransition(async () => {
      const result = await buscarNomeacoes()
      if (result.ok) {
        setNovasBusca(result.novas)
        if (result.novas > 0) setLocalNaoLidas((p) => p + result.novas)
      } else {
        setErr(result.error)
      }
    })
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-5 py-3.5 transition-colors',
        hasNotifications
          ? 'border-brand-500/30 bg-brand-500/10/50'
          : 'border-border bg-card shadow-saas',
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
          hasNotifications ? 'bg-brand-500' : 'bg-zinc-900/50',
        )}
      >
        {hasNotifications ? (
          <BellDot className="h-4 w-4 text-white" />
        ) : (
          <Radar className="h-4 w-4 text-zinc-400" />
        )}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {novasBusca !== null && !isPending ? (
          <p className="text-sm font-semibold text-emerald-800">
            {novasBusca === 0
              ? 'Nenhuma novidade — tudo em dia'
              : `${novasBusca} nova${novasBusca > 1 ? 's' : ''} citaç${novasBusca > 1 ? 'ões' : 'ão'} encontrada${novasBusca > 1 ? 's' : ''}!`}
          </p>
        ) : hasNotifications ? (
          <p className="text-sm font-semibold text-lime-800">
            {localNaoLidas} citaç{localNaoLidas > 1 ? 'ões' : 'ão'} não {localNaoLidas > 1 ? 'lidas' : 'lida'} no radar
          </p>
        ) : (
          <p className="text-sm font-semibold text-foreground">
            Radar de Nomeações · {totalCitacoes} citaç{totalCitacoes !== 1 ? 'ões' : 'ão'}
          </p>
        )}
        <p className="text-xs text-zinc-500 mt-0.5">
          {err ? (
            <span className="text-rose-600">{err}</span>
          ) : ultimaBusca ? (
            `Última verificação: ${formatUltimaBusca(ultimaBusca)}`
          ) : (
            'Ainda não verificado'
          )}
        </p>
      </div>

      {/* Feedback */}
      {novasBusca === 0 && !isPending && (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
      )}
      {err && !isPending && (
        <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {hasNotifications && (
          <Link href="/nomeacoes">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
              <ExternalLink className="h-3 w-3" />
              Ver
            </Button>
          </Link>
        )}
        <Button
          size="sm"
          onClick={handleVerificar}
          disabled={isPending}
          className="h-8 bg-brand-500 hover:bg-lime-600 text-foreground font-semibold text-xs gap-1.5"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Radar className="h-3 w-3" />
          )}
          Verificar
        </Button>
      </div>
    </div>
  )
}

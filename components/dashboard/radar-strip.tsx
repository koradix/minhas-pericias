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
        <div className="flex items-center gap-4 rounded-xl border border-dashed border-[#d1d5db] bg-[#f8f9ff]/50 px-6 py-4 hover:border-[#416900] hover:bg-[#f4fce3]/20 transition-all cursor-pointer group font-inter">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#f4fce3]">
            <Radar className="h-5 w-5 text-[#416900]" strokeWidth={1.5} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#1f2937] font-manrope group-hover:text-[#416900] transition-colors">
              Configure o Radar de Nomeações
            </p>
            <p className="text-[13px] text-[#6b7280] mt-1">
              Monitore seus tribunais e receba alertas de citações nos diários oficiais
            </p>
          </div>
          <span className="text-[12px] font-bold text-[#416900] bg-[#f4fce3] border border-[#d8f5a2] rounded-lg px-4 py-2 flex-shrink-0 whitespace-nowrap transition-all group-hover:bg-[#416900] group-hover:text-white">
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
        'flex items-center gap-4 rounded-xl border px-6 py-4 transition-all font-inter',
        hasNotifications
          ? 'border-[#d8f5a2] bg-[#f4fce3]/30'
          : 'border-[#e2e8f0] bg-white',
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          hasNotifications ? 'bg-[#416900]' : 'bg-[#f8f9ff]',
        )}
      >
        {hasNotifications ? (
          <BellDot className="h-5 w-5 text-white" />
        ) : (
          <Radar className="h-5 w-5 text-[#9ca3af]" strokeWidth={1.5} />
        )}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {novasBusca !== null && !isPending ? (
          <p className="text-[15px] font-semibold text-[#416900] font-manrope">
            {novasBusca === 0
              ? 'Nenhuma novidade — tudo em dia'
              : `${novasBusca} nova${novasBusca > 1 ? 's' : ''} citaç${novasBusca > 1 ? 'ões' : 'ão'} encontrada${novasBusca > 1 ? 's' : ''}!`}
          </p>
        ) : hasNotifications ? (
          <p className="text-[15px] font-semibold text-[#416900] font-manrope">
            {localNaoLidas} citaç{localNaoLidas > 1 ? 'ões' : 'ão'} não {localNaoLidas > 1 ? 'lidas' : 'lida'} no radar
          </p>
        ) : (
          <p className="text-[15px] font-semibold text-[#1f2937] font-manrope">
            Radar de Nomeações · {totalCitacoes} citaç{totalCitacoes !== 1 ? 'ões' : 'ão'}
          </p>
        )}
        <p className="text-[12px] text-[#9ca3af] mt-1 font-inter">
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
      <div className="flex items-center gap-3 flex-shrink-0">
        {hasNotifications && (
          <Link href="/nomeacoes">
            <Button size="sm" variant="outline" className="h-9 text-[12px] gap-1.5 border-[#e2e8f0] text-[#374151] hover:bg-[#f8f9ff] font-semibold px-4 rounded-lg">
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
              Ver
            </Button>
          </Link>
        )}
        <Button
          size="sm"
          onClick={handleVerificar}
          disabled={isPending}
          className="h-9 bg-[#1f2937] hover:bg-[#374151] text-white font-semibold text-[13px] gap-2 px-4 rounded-lg transition-all font-inter"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Radar className="h-4 w-4" strokeWidth={2} />
          )}
          Verificar
        </Button>
      </div>
    </div>
  )
}

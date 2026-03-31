'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Radar, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buscarNomeacoes } from '@/lib/actions/nomeacoes'
import { cn } from '@/lib/utils'

// ─── Error translation ────────────────────────────────────────────────────────

function traduzirErro(raw: string): string {
  if (raw === 'sem_credito' || raw.includes('402'))
    return 'Saldo insuficiente na API Escavador. Recarregue seus créditos.'
  if (raw.includes('401') || raw.toLowerCase().includes('token'))
    return 'Token de API inválido. Verifique as configurações.'
  if (raw.includes('404'))
    return 'Recurso não encontrado na API.'
  if (raw.includes('500'))
    return 'Erro temporário na API. Tente novamente em instantes.'
  if (raw.toLowerCase().includes('fetch') || raw.toLowerCase().includes('network'))
    return 'Sem conexão com a API. Verifique sua internet.'
  return 'Erro inesperado. Tente novamente.'
}

function formatUltimaBusca(iso: string | null): string {
  if (!iso) return 'Nunca buscado'
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 60) return `${diffMin}min atrás`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h atrás`
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  ultimaBusca: string | null    // ISO string or null
  saldo: number | null
  naoLidas: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardRadarBanner({ ultimaBusca, saldo, naoLidas: initialNaoLidas }: Props) {
  const [isPending, startTransition] = useTransition()
  const [naoLidas, setNaoLidas] = useState(initialNaoLidas)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function handleBuscar() {
    if (saldo !== null && saldo < 3) {
      if (!confirm(`Saldo baixo (R$ ${saldo.toFixed(2)}). Buscar mesmo assim?`)) return
    }
    setFeedback(null)
    startTransition(async () => {
      const result = await buscarNomeacoes()
      if (result.ok) {
        const msg = result.novas === 0
          ? 'Nenhuma novidade — tudo em dia'
          : `${result.novas} nova${result.novas > 1 ? 's' : ''} nomeaç${result.novas > 1 ? 'ões' : 'ão'} encontrada${result.novas > 1 ? 's' : ''}!`
        setFeedback({ type: 'success', msg })
        if (result.novas > 0) setNaoLidas((p) => p + result.novas)
      } else {
        setFeedback({ type: 'error', msg: traduzirErro(result.error) })
      }
    })
  }

  const subtitulo = ultimaBusca
    ? `Última busca: ${formatUltimaBusca(ultimaBusca)}`
    : 'Radar configurado — faça sua primeira busca'

  return (
    <div className={cn(
      'rounded-xl border border-[#e2e8f0] bg-white px-6 py-5',
      'flex flex-col sm:flex-row sm:items-center gap-5',
      naoLidas > 0 ? 'border-l-4 border-l-[#416900]' : 'border-l-4 border-l-[#d1d5db]',
    )}>
      {/* Left — status */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <span className={cn(
          'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full',
          naoLidas > 0 ? 'bg-[#f4fce3]' : 'bg-[#f8f9ff]',
        )}>
          <Radar className={cn('h-5 w-5', naoLidas > 0 ? 'text-[#416900]' : 'text-[#9ca3af]')} strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-[#1f2937] truncate font-manrope">
            Radar de Nomeações ativo
            {naoLidas > 0 && (
              <span className="ml-2.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#416900] text-white text-[11px] font-bold px-2">
                {naoLidas}
              </span>
            )}
          </p>
          <p className="text-[13px] text-[#6b7280] mt-1 truncate font-inter">
            {feedback
              ? feedback.msg
              : subtitulo}
          </p>
        </div>

        {/* Feedback icons */}
        {feedback?.type === 'success' && !isPending && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        )}
        {feedback?.type === 'error' && !isPending && (
          <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
        )}
      </div>

      {/* Right — CTA */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          {naoLidas > 0 && !isPending && (
            <Link href="/nomeacoes">
              <Button size="sm" variant="outline" className="h-10 text-[13px] border-[#e2e8f0] text-[#374151] hover:bg-[#f8f9ff] font-semibold px-4 rounded-lg">
                Ver {naoLidas} pendente{naoLidas > 1 ? 's' : ''}
              </Button>
            </Link>
          )}
          <Button
            onClick={handleBuscar}
            disabled={isPending}
            className={cn(
              'h-10 px-5 font-semibold text-[14px] gap-2.5 rounded-lg transition-all font-inter',
              'bg-[#1f2937] hover:bg-[#374151] text-white',
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Buscando…
              </>
            ) : (
              <>
                <Radar className="h-4 w-4" strokeWidth={2} />
                {ultimaBusca ? 'Buscar Agora' : 'Primeira Busca'}
              </>
            )}
          </Button>
        </div>
        {/* Credit cost notice — always visible */}
        <p className="text-[11px] text-[#9ca3af] font-inter">
          Busca manual · R$ 3,00 / chamada
          {saldo !== null && ` · Saldo: R$ ${saldo.toFixed(2)}`}
        </p>
      </div>
    </div>
  )
}

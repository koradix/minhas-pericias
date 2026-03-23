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
      'rounded-2xl border-l-4 border border-slate-100 bg-white px-5 py-4 shadow-sm',
      'flex flex-col sm:flex-row sm:items-center gap-4',
      naoLidas > 0 ? 'border-l-lime-500' : 'border-l-slate-300',
    )}>
      {/* Left — status */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
          naoLidas > 0 ? 'bg-lime-100' : 'bg-slate-100',
        )}>
          <Radar className={cn('h-4 w-4', naoLidas > 0 ? 'text-lime-700' : 'text-slate-500')} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            Radar de Nomeações ativo
            {naoLidas > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-500 text-white text-[10px] font-bold px-1.5">
                {naoLidas}
              </span>
            )}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
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
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex items-center gap-2">
          {naoLidas > 0 && !isPending && (
            <Link href="/nomeacoes">
              <Button size="sm" variant="outline" className="h-9 text-xs border-lime-200 text-lime-700 hover:bg-lime-50">
                Ver {naoLidas} pendente{naoLidas > 1 ? 's' : ''}
              </Button>
            </Link>
          )}
          <Button
            onClick={handleBuscar}
            disabled={isPending}
            className={cn(
              'h-9 px-4 font-semibold text-sm gap-2',
              'bg-lime-500 hover:bg-lime-600 text-slate-900',
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando nos diários…
              </>
            ) : (
              <>
                <Radar className="h-4 w-4" />
                {ultimaBusca ? 'Buscar Nomeações Agora' : 'Fazer Primeira Busca'}
              </>
            )}
          </Button>
        </div>
        {/* Credit cost notice — always visible */}
        <p className="text-[10px] text-slate-400">
          Busca manual · R$ 3,00 por chamada
          {saldo !== null && ` · Saldo: R$ ${saldo.toFixed(2)}`}
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CheckCheck,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buscarNomeacoes, marcarTodasVisualizadas } from '@/lib/actions/nomeacoes'
import { ManualCitacaoForm } from '@/components/nomeacoes/manual-citacao-form'
import { formatCurrency } from '@/lib/utils'

interface Props {
  naoLidas: number
  saldoAtual: number | null
  siglas: string[]  // perito's tribunal siglas for manual form
}

type Toast =
  | { type: 'success'; message: string }
  | { type: 'warning'; message: string }
  | { type: 'error'; message: string; showManual?: boolean }

export function RadarBuscarBtn({ naoLidas, saldoAtual, siglas }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isMarcando, startMarcando] = useTransition()
  const [toast, setToast] = useState<Toast | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)

  function clearToast() { setToast(null) }

  function handleBuscar() {
    // Warn if saldo low
    if (saldoAtual !== null && saldoAtual < 6) {
      const confirmado = window.confirm(
        `Seu saldo está baixo (${formatCurrency(saldoAtual)}). Deseja continuar?\nEsta busca custa R$3,00.`,
      )
      if (!confirmado) return
    }

    setToast(null)
    startTransition(async () => {
      const result = await buscarNomeacoes()
      if (result.ok) {
        setToast({
          type: 'success',
          message:
            result.novas === 0
              ? 'Nenhuma nova nomeação encontrada'
              : `${result.novas} nova${result.novas > 1 ? 's' : ''} nomeação${result.novas > 1 ? 'ões' : ''} encontrada${result.novas > 1 ? 's' : ''}!`,
        })
      } else {
        setToast({
          type: 'error',
          message: result.error ?? 'Erro ao buscar nomeações',
          showManual: true,
        })
      }
    })
  }

  function handleMarcarTodas() {
    startMarcando(async () => {
      await marcarTodasVisualizadas()
      setToast({ type: 'success', message: 'Todas as citações marcadas como lidas.' })
    })
  }

  return (
    <div className="space-y-3">
      {/* Toast */}
      {toast && (
        <div
          className={`flex items-start gap-3 rounded-xl px-4 py-3 border text-sm ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs">{toast.message}</p>
            {toast.type === 'error' && toast.showManual && (
              <button
                onClick={() => { setShowManualForm(true); clearToast() }}
                className="mt-1 text-xs font-semibold text-rose-700 underline hover:no-underline"
              >
                Registrar manualmente
              </button>
            )}
          </div>
          <button onClick={clearToast} className="flex-shrink-0 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-2 shadow-sm"
          onClick={handleBuscar}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Atualizar Nomeações
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-slate-600"
          onClick={() => setShowManualForm(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Registrar manualmente
        </Button>

        {naoLidas > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-slate-500 hover:text-slate-800"
            onClick={handleMarcarTodas}
            disabled={isMarcando}
          >
            {isMarcando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Manual form modal */}
      {showManualForm && (
        <ManualCitacaoForm siglas={siglas} onClose={() => setShowManualForm(false)} />
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buscarProcessosDataJud } from '@/lib/actions/datajud'
import { ManualCitacaoForm } from '@/components/nomeacoes/manual-citacao-form'

interface Props {
  novas: number     // nomeações novas (badge)
  siglas: string[]  // siglas para o form manual
}

type Toast =
  | { type: 'success'; message: string }
  | { type: 'error';   message: string; showManual?: boolean }

export function RadarBuscarBtn({ novas, siglas }: Props) {
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<Toast | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)

  function clearToast() { setToast(null) }

  function handleBuscar() {
    setToast(null)
    startTransition(async () => {
      try {
        const result = await buscarProcessosDataJud()
        if (result.ok) {
          const { novas: n, atualizadas: a } = result
          setToast({
            type: 'success',
            message:
              n === 0 && a === 0
                ? 'Nenhum processo novo encontrado nos seus tribunais'
                : n > 0
                ? `${n} novo${n > 1 ? 's' : ''} processo${n > 1 ? 's' : ''} encontrado${n > 1 ? 's' : ''}!${a > 0 ? ` (${a} atualizado${a > 1 ? 's' : ''})` : ''}`
                : `${a} processo${a > 1 ? 's' : ''} atualizado${a > 1 ? 's' : ''}`,
          })
        } else {
          setToast({
            type: 'error',
            message: result.error ?? 'Erro ao buscar nomeações',
            showManual: true,
          })
        }
      } catch {
        setToast({ type: 'error', message: 'Erro inesperado. Tente novamente.', showManual: true })
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Toast */}
      {toast && (
        <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border text-sm ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            : <AlertCircle  className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-500" />
          }
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
          <button onClick={clearToast} className="flex-shrink-0 text-zinc-500 hover:text-zinc-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="bg-brand-500 hover:bg-lime-600 text-foreground font-semibold gap-2 shadow-saas"
          onClick={handleBuscar}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando no DataJud…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Buscar Nomeações
              {novas > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px] font-bold px-1">
                  {novas}
                </span>
              )}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-zinc-400"
          onClick={() => setShowManualForm(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Registrar manualmente
        </Button>
      </div>

      {/* Manual form modal */}
      {showManualForm && (
        <ManualCitacaoForm siglas={siglas} onClose={() => setShowManualForm(false)} />
      )}
    </div>
  )
}

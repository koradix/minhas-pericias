'use client'

import { useState, useTransition } from 'react'
import { Search, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buscarNomeacoes, setupRadar } from '@/lib/actions/nomeacoes'
import { ManualCitacaoForm } from './manual-citacao-form'

interface Props {
  novas: number
  siglas: string[]
  radarConfigurado: boolean
}

type BuscarState =
  | { fase: 'idle' }
  | { fase: 'buscando' }
  | { fase: 'ok'; novas: number; saldo: number; totalEncontrados: number }
  | { fase: 'erro'; mensagem: string }

export function RadarBuscarBtn({ radarConfigurado, siglas }: Props) {
  const [buscarState, setBuscarState] = useState<BuscarState>({ fase: 'idle' })
  const [isPending, startTransition] = useTransition()
  const [showManual, setShowManual] = useState(false)

  function handleBuscar() {
    setBuscarState({ fase: 'buscando' })
    startTransition(async () => {
      try {
        if (!radarConfigurado) {
          const setupRes = await setupRadar()
          if (setupRes.status === 'error') {
            const isPlanoInsuficiente =
              setupRes.message.includes('Monitoramento não disponível') ||
              setupRes.message.includes('Token de API inválido')
            if (!isPlanoInsuficiente) {
              setBuscarState({ fase: 'erro', mensagem: setupRes.message })
              return
            }
            console.log('[setupRadar] monitoramento indisponível — continuando com busca ativa')
          }
        }

        const res = await buscarNomeacoes()
        if (res.ok) {
          setBuscarState({ fase: 'ok', novas: res.novas, saldo: res.saldoRestante, totalEncontrados: res.totalEncontrados })
          setTimeout(() => setBuscarState({ fase: 'idle' }), 5000)
        } else {
          setBuscarState({ fase: 'erro', mensagem: res.error })
        }
      } catch (err) {
        console.error('[buscar] erro:', err)
        setBuscarState({ fase: 'erro', mensagem: 'Erro de conexão. Tente novamente.' })
      }
    })
  }

  const isBusy = isPending || buscarState.fase === 'buscando'

  return (
    <div className="space-y-4">
      {/* Botões de comando */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleBuscar}
          disabled={isBusy}
          className="bg-[#1f2937] hover:bg-[#374151] text-white font-manrope font-semibold text-[14px] px-6 py-5 rounded-xl gap-2 shadow-none border border-[#1f2937]"
        >
          {isBusy
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Buscando…</>
            : <><Search className="h-4 w-4" /> Buscar nomeações</>
          }
        </Button>

        <Button
          onClick={() => setShowManual(true)}
          variant="outline"
          disabled={isBusy}
          className="border-slate-200 text-[#4b5563] hover:bg-slate-50 hover:text-[#1f2937] font-manrope font-semibold text-[14px] px-6 py-5 rounded-xl gap-2 shadow-none transition-all"
        >
          <Plus className="h-4 w-4" /> Registrar processo
        </Button>
      </div>

      {/* Manual Upload Modal */}
      {showManual && (
        <ManualCitacaoForm siglas={siglas} onClose={() => setShowManual(false)} />
      )}

      {/* Feedback da busca */}
      {buscarState.fase === 'ok' && (
        <div className="rounded-xl bg-lime-50 border border-lime-200 px-4 py-3 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-lime-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-lime-800 flex-1">
              {buscarState.novas > 0
                ? `${buscarState.novas} nova${buscarState.novas > 1 ? 's' : ''} salva${buscarState.novas > 1 ? 's' : ''}!`
                : 'Busca concluída — nenhuma nova citação.'
              }
            </p>
            {buscarState.saldo > 0 && (
              <span className="text-xs text-lime-600 font-bold">
                Saldo: R$ {buscarState.saldo.toFixed(2)}
              </span>
            )}
          </div>
          {buscarState.totalEncontrados === 0 && (
            <p className="text-xs text-lime-700 pl-6">
              A API não retornou citações para esse nome nos tribunais cadastrados.
            </p>
          )}
          {buscarState.totalEncontrados > 0 && buscarState.novas === 0 && (
            <p className="text-xs text-lime-700 pl-6">
              {buscarState.totalEncontrados} citaç{buscarState.totalEncontrados > 1 ? 'ões encontradas' : 'ão encontrada'} — todas já estavam salvas.
            </p>
          )}
        </div>
      )}

      {buscarState.fase === 'erro' && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-rose-700 leading-tight">{buscarState.mensagem}</p>
        </div>
      )}

    </div>
  )
}

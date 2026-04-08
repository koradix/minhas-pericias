'use client'

import { useState, useTransition } from 'react'
import { Search, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buscarNomeacoes, buscarProcessosTribunais, setupRadar } from '@/lib/actions/nomeacoes'
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
          }
        }

        // Roda DJe e tribunais em paralelo
        const [djeRes, tribRes] = await Promise.allSettled([
          buscarNomeacoes(),
          buscarProcessosTribunais(),
        ])

        const dje   = djeRes.status   === 'fulfilled' ? djeRes.value   : null
        const trib  = tribRes.status  === 'fulfilled' ? tribRes.value  : null

        const novas           = (dje?.ok ? dje.novas           : 0) + (trib?.ok ? trib.novas           : 0)
        const totalEncontrados= (dje?.ok ? dje.totalEncontrados : 0) + (trib?.ok ? trib.totalEncontrados : 0)
        const saldo           = dje?.ok ? dje.saldoRestante : (trib?.ok ? trib.saldoRestante : 0)

        const erroMsg = [
          !dje?.ok  ? dje?.error  : null,
          !trib?.ok ? trib?.error : null,
        ].filter(Boolean).join(' | ')

        if (!dje?.ok && !trib?.ok && erroMsg) {
          setBuscarState({ fase: 'erro', mensagem: erroMsg })
        } else {
          setBuscarState({ fase: 'ok', novas, saldo, totalEncontrados })
          setTimeout(() => setBuscarState({ fase: 'idle' }), 6000)
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
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleBuscar}
          disabled={isBusy}
          className="bg-[#a3e635] hover:bg-[#bef264] text-[#0f172a] font-manrope font-black text-[14.5px] px-6 py-5 rounded-xl gap-2.5 shadow-lg shadow-lime-200 border border-transparent transition-all"
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
          className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#4d7c0f] hover:border-[#a3e635]/30 font-manrope font-bold text-[14.5px] px-6 py-5 rounded-xl gap-2.5 shadow-none transition-all"
        >
          <Plus className="h-4 w-4" /> Registrar manualmente
        </Button>
      </div>

      {showManual && (
        <ManualCitacaoForm siglas={siglas} onClose={() => setShowManual(false)} />
      )}

      {buscarState.fase === 'ok' && (
        <div className="rounded-xl bg-lime-50 border border-lime-200 px-4 py-3 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-lime-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-lime-800 flex-1">
              {buscarState.novas > 0
                ? `${buscarState.novas} nova${buscarState.novas > 1 ? 's' : ''} nomeaç${buscarState.novas > 1 ? 'ões salvas' : 'ão salva'}!`
                : 'Busca concluída — nenhuma nova encontrada.'
              }
            </p>
            {buscarState.saldo > 0 && (
              <span className="text-xs text-lime-600 font-bold">
                Saldo: R$ {buscarState.saldo.toFixed(2)}
              </span>
            )}
          </div>
          {buscarState.totalEncontrados > 0 && buscarState.novas === 0 && (
            <p className="text-xs text-lime-700 pl-6">
              {buscarState.totalEncontrados} processo{buscarState.totalEncontrados > 1 ? 's encontrados' : ' encontrado'} — {buscarState.totalEncontrados > 1 ? 'todos já estavam salvos' : 'já estava salvo'}.
            </p>
          )}
          {buscarState.totalEncontrados > 0 && buscarState.novas > 0 && (
            <p className="text-xs text-lime-700 pl-6">
              {buscarState.totalEncontrados} processo{buscarState.totalEncontrados > 1 ? 's' : ''} encontrado{buscarState.totalEncontrados > 1 ? 's' : ''}.
            </p>
          )}
        </div>
      )}

      {buscarState.fase === 'erro' && (
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-rose-700 leading-tight">{buscarState.mensagem}</p>
        </div>
      )}
    </div>
  )
}

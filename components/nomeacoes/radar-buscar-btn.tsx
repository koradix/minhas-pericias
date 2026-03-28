'use client'

import { useState, useTransition } from 'react'
import { Plus, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ManualCitacaoForm } from '@/components/nomeacoes/manual-citacao-form'
import { buscarNomeacoes } from '@/lib/actions/nomeacoes'
import { setupRadar } from '@/lib/actions/nomeacoes'

interface Props {
  novas: number
  siglas: string[]
  radarConfigurado: boolean  // true se RadarConfig com monitoramentoExtId existe
}

type BuscarState =
  | { fase: 'idle' }
  | { fase: 'buscando' }
  | { fase: 'ok'; novas: number; saldo: number; totalEncontrados: number }
  | { fase: 'erro'; mensagem: string }

export function RadarBuscarBtn({ siglas, radarConfigurado }: Props) {
  const [showManualForm, setShowManualForm] = useState(false)
  const [buscarState, setBuscarState] = useState<BuscarState>({ fase: 'idle' })
  const [isPending, startTransition] = useTransition()

  function handleBuscar() {
    setBuscarState({ fase: 'buscando' })
    startTransition(async () => {
      try {
        // Se radar não configurado, tenta configurar primeiro
        if (!radarConfigurado) {
          const setupRes = await setupRadar()
          if (setupRes.status === 'error') {
            setBuscarState({ fase: 'erro', mensagem: setupRes.message })
            return
          }
        }

        const res = await buscarNomeacoes()
        if (res.ok) {
          setBuscarState({ fase: 'ok', novas: res.novas, saldo: res.saldoRestante, totalEncontrados: res.totalEncontrados })
          // Limpa o banner após 5s
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
    <div className="space-y-3">
      {/* Botões principais */}
      <div className="flex flex-wrap gap-2">
        {/* Busca automática via Escavador */}
        <Button
          onClick={handleBuscar}
          disabled={isBusy}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold gap-2 shadow-sm"
        >
          {isBusy
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Buscando…</>
            : <><Search className="h-4 w-4" /> Buscar nomeações</>
          }
        </Button>

        {/* Registro manual com documento */}
        <Button
          variant="outline"
          className="gap-2 font-semibold"
          onClick={() => setShowManualForm(true)}
          disabled={isBusy}
        >
          <Plus className="h-4 w-4" />
          Registrar com documento
        </Button>
      </div>

      {/* Feedback da busca */}
      {buscarState.fase === 'ok' && (
        <div className="rounded-xl bg-lime-50 border border-lime-200 px-4 py-2.5 space-y-0.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-lime-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-lime-800 flex-1">
              {buscarState.novas > 0
                ? `${buscarState.novas} nova${buscarState.novas > 1 ? 's' : ''} salva${buscarState.novas > 1 ? 's' : ''}!`
                : 'Busca concluída — nenhuma nova citação.'
              }
            </p>
            {buscarState.saldo > 0 && (
              <span className="text-xs text-lime-600 flex-shrink-0">
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
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5">
          <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          <p className="text-sm text-rose-700">{buscarState.mensagem}</p>
        </div>
      )}

      {/* Form de registro manual com documento */}
      {showManualForm && (
        <ManualCitacaoForm siglas={siglas} onClose={() => setShowManualForm(false)} />
      )}
    </div>
  )
}

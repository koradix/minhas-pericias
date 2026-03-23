'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Radar, AlertCircle, Loader2, CheckCircle2, Info,
  Search, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setupRadar, buscarNomeacoes } from '@/lib/actions/nomeacoes'
import { TRIBUNAIS_POR_ESTADO, tipoCor } from '@/lib/constants/tribunais'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  siglas: string[]
}

type ViewState =
  | { view: 'setup' }
  | { view: 'configured'; toast?: string }
  | { view: 'error'; msg: string }

// ─── Sub-views ────────────────────────────────────────────────────────────────

function SetupView({
  siglas,
  isPending,
  onSetup,
}: {
  siglas: string[]
  isPending: boolean
  onSetup: () => void
}) {
  const enriched = siglas.map((sigla) => {
    for (const [, tribunais] of Object.entries(TRIBUNAIS_POR_ESTADO)) {
      const found = tribunais.find((t) => t.sigla === sigla)
      if (found) return found
    }
    return { sigla, nome: sigla, tipo: 'estadual' as const }
  })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-lime-100">
          <Radar className="h-6 w-6 text-lime-700" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">Configurar Radar de Nomeações</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitore seus tribunais registrados nos diários oficiais
          </p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-5">
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            A configuração inicial usa apenas endpoints gratuitos da API Escavador. Busca manual: R$3,00 por chamada.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Tribunais a monitorar ({siglas.length})
          </p>
          {siglas.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Nenhum tribunal registrado. Atualize seu perfil para adicionar tribunais.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {enriched.map((t) => (
                <div
                  key={t.sigla}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm"
                >
                  <span className="text-xs font-bold text-slate-900">{t.sigla}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${tipoCor[t.tipo]}`}>
                    {t.tipo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-2"
          onClick={onSetup}
          disabled={isPending || siglas.length === 0}
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Configurando radar…</>
          ) : (
            <><CheckCircle2 className="h-4 w-4" />Configurar Radar</>
          )}
        </Button>
      </div>
    </div>
  )
}

function ConfiguredView({
  siglas,
  toast,
}: {
  siglas: string[]
  toast?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [searchResult, setSearchResult] = useState<string | null>(null)

  function handleBuscar() {
    startTransition(async () => {
      const res = await buscarNomeacoes()
      if (res.ok) {
        setSearchResult(
          res.novas === 0
            ? 'Nenhuma novidade — tudo em dia'
            : `${res.novas} nova${res.novas > 1 ? 's' : ''} nomeação${res.novas > 1 ? 'ões' : ''} encontrada${res.novas > 1 ? 's' : ''}!`,
        )
      } else {
        setSearchResult(res.error === 'sem_credito' ? 'Saldo insuficiente para busca.' : 'Erro ao buscar. Tente novamente.')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-lime-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 border-b border-lime-100 bg-lime-50/50 px-6 py-5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-lime-100">
          <CheckCircle2 className="h-6 w-6 text-lime-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-slate-900">Radar ativo</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitorando {siglas.length} tribunal{siglas.length !== 1 ? 'is' : ''}
          </p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">
        {toast && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <p className="text-xs text-emerald-700">{toast}</p>
          </div>
        )}
        {searchResult && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <Info className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-600">{searchResult}</p>
          </div>
        )}
        <Button
          className="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-2 text-base py-5"
          onClick={handleBuscar}
          disabled={isPending}
        >
          {isPending ? (
            <><Loader2 className="h-5 w-5 animate-spin" />Buscando nos diários…</>
          ) : (
            <><Search className="h-5 w-5" />Buscar Nomeações Agora</>
          )}
        </Button>
        <p className="text-center text-[11px] text-slate-400">
          Busca manual · R$ 3,00 por chamada
        </p>
      </div>
    </div>
  )
}

function ErrorView({
  msg,
  onRetry,
}: {
  msg: string
  onRetry: () => void
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Erro ao configurar o Radar</p>
          <p className="text-xs text-amber-700 mt-1">{msg}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Tentar novamente
      </Button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RadarSetupCard({ siglas }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [viewState, setViewState] = useState<ViewState>({ view: 'setup' })

  function handleSetup() {
    startTransition(async () => {
      const result = await setupRadar()
      if (result.status === 'already_configured') {
        setViewState({ view: 'configured' }) // silent — already was configured
        router.refresh()
      } else if (result.status === 'recovered') {
        setViewState({ view: 'configured', toast: 'Radar já estava configurado. Pronto para buscar!' })
        router.refresh()
      } else if (result.status === 'created') {
        setViewState({ view: 'configured', toast: 'Radar configurado com sucesso!' })
        router.refresh()
      } else {
        setViewState({ view: 'error', msg: result.message })
      }
    })
  }

  if (viewState.view === 'configured') {
    return <ConfiguredView siglas={siglas} toast={viewState.toast} />
  }
  if (viewState.view === 'error') {
    return <ErrorView msg={viewState.msg} onRetry={() => setViewState({ view: 'setup' })} />
  }
  return <SetupView siglas={siglas} isPending={isPending} onSetup={handleSetup} />
}

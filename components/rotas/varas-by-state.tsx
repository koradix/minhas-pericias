'use client'

import { useState, useTransition } from 'react'
import { MapPin, Landmark, Loader2, Plus, CheckSquare, Square, AlertCircle, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fetchVarasByEstado, createRotaFromVaras } from '@/lib/actions/rotas-nova'
import { ESTADOS_DISPONIVEIS } from '@/lib/constants/tribunais'
import type { VaraComEndereco } from '@/lib/services/escavador'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedVara {
  id: string
  tribunalSigla: string
  varaNome: string
  enderecoTexto: string | null
  latitude: number | null
  longitude: number | null
}

interface Props {
  /** Pre-fetched varas already in DB for this user (all UFs) */
  varasDoPerito: SavedVara[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VarasByState({ varasDoPerito }: Props) {
  const [uf, setUf] = useState('')
  const [varas, setVaras] = useState<VaraComEndereco[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [isCreating, startCreatingTransition] = useTransition()
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Build a set of vara names already in DB for quick lookup
  const varasNaSigla = new Set(varasDoPerito.map((v) => `${v.tribunalSigla}|${v.varaNome}`))

  function handleUfChange(newUf: string) {
    setUf(newUf)
    setVaras([])
    setSelected(new Set())
    setLoaded(false)
    setError(null)
    if (!newUf) return

    startTransition(async () => {
      const result = await fetchVarasByEstado(newUf)
      setVaras(result)
      setLoaded(true)
    })
  }

  function toggleVara(varaId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(varaId)) next.delete(varaId)
      else next.add(varaId)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === varas.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(varas.map((v) => v.varaId)))
    }
  }

  function handleCriarRota() {
    // Map selected varaIds (Escavador external IDs) to DB TribunalVara.id
    const dbIds = varasDoPerito
      .filter((v) => selected.has(v.id))
      .map((v) => v.id)

    // Also include varas matched by tribunalSigla+varaNome if not already DB-mapped
    if (dbIds.length === 0) {
      setError('Sincronize as varas primeiro para criar uma rota com elas.')
      return
    }
    setError(null)
    startCreatingTransition(async () => {
      const result = await createRotaFromVaras(dbIds)
      if (result && !result.ok) setError(result.error ?? 'Erro ao criar rota')
    })
  }

  // Varas com endereço
  const comEndereco = varas.filter((v) => v.enderecoTexto)
  const semEndereco = varas.filter((v) => !v.enderecoTexto)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-slate-900">Varas por Estado</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Explore varas disponíveis no Escavador e crie rotas de prospecção
        </p>
      </div>

      {/* UF selector */}
      <div className="flex gap-2">
        <select
          value={uf}
          onChange={(e) => handleUfChange(e.target.value)}
          className="flex h-9 w-full max-w-[160px] items-center rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
        >
          <option value="">Selecione o estado</option>
          {ESTADOS_DISPONIVEIS.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>

        {uf && loaded && varas.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="gap-1.5 text-xs border-slate-200 text-slate-600 h-9"
          >
            {selected.size === varas.length ? (
              <><CheckSquare className="h-3.5 w-3.5" />Desmarcar todas</>
            ) : (
              <><Square className="h-3.5 w-3.5" />Marcar todas</>
            )}
          </Button>
        )}
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-lime-500" />
          Carregando varas do estado…
        </div>
      )}

      {/* Results */}
      {!isPending && loaded && varas.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 px-4 py-4">
          <AlertCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-500">
            Nenhuma vara encontrada para {uf} na API Escavador.
          </p>
        </div>
      )}

      {!isPending && varas.length > 0 && (
        <>
          {/* Summary */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{varas.length} varas</span>
            <span>·</span>
            <span className="text-emerald-600">{comEndereco.length} com endereço</span>
            {semEndereco.length > 0 && (
              <><span>·</span><span className="text-amber-600">{semEndereco.length} sem endereço</span></>
            )}
          </div>

          {/* Vara list */}
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {varas.map((v) => {
              const key = `${v.tribunalSigla}|${v.varaNome}`
              const noDb = varasNaSigla.has(key)
              const dbVara = varasDoPerito.find((d) => d.tribunalSigla === v.tribunalSigla && d.varaNome === v.varaNome)
              const isSelected = dbVara ? selected.has(dbVara.id) : false

              return (
                <div
                  key={v.varaId}
                  onClick={() => dbVara && toggleVara(dbVara.id)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                    dbVara
                      ? isSelected
                        ? 'border-lime-300 bg-lime-50 cursor-pointer'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer'
                      : 'border-slate-100 bg-slate-50/30 cursor-default opacity-60',
                  )}
                >
                  {/* Checkbox */}
                  <div className="flex-shrink-0 mt-0.5">
                    {dbVara ? (
                      isSelected
                        ? <CheckSquare className="h-4 w-4 text-lime-600" />
                        : <Square className="h-4 w-4 text-slate-300" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-200" />
                    )}
                  </div>

                  {/* Icon */}
                  <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                    v.enderecoTexto ? 'bg-violet-50' : 'bg-slate-100')}>
                    <Landmark className={cn('h-4 w-4', v.enderecoTexto ? 'text-violet-600' : 'text-slate-400')} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{v.varaNome}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{v.tribunalSigla}</p>
                    {v.enderecoTexto && (
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-start gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5 text-slate-400" />
                        <span className="truncate">{v.enderecoTexto}</span>
                      </p>
                    )}
                    {!v.enderecoTexto && (
                      <p className="text-[10px] text-amber-600 mt-0.5">Sem endereço cadastrado</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    {noDb && (
                      <span className="text-[9px] bg-lime-100 text-lime-700 rounded px-1.5 py-0.5 font-semibold">
                        No radar
                      </span>
                    )}
                    {v.dadosFicticios && v.enderecoTexto && (
                      <span className="text-[9px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                        Endereço aprox.
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700">{error}</p>
            </div>
          )}
        </>
      )}

      {/* Sticky CTA */}
      {selected.size > 0 && (
        <div className="sticky bottom-0 pt-2 border-t border-slate-100 bg-white">
          <Button
            className="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-2"
            onClick={handleCriarRota}
            disabled={isCreating}
          >
            {isCreating ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Criando rota…</>
            ) : (
              <><Building2 className="h-4 w-4" />Criar rota com {selected.size} vara{selected.size !== 1 ? 's' : ''}</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

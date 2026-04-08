'use client'

import React, { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { fetchVarasByEstado, createRotaFromVaras } from '@/lib/actions/rotas-nova'
import { ESTADOS_DISPONIVEIS } from '@/lib/constants/tribunais'

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
  varasDoPerito: SavedVara[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VarasByState({ varasDoPerito }: Props) {
  const [uf, setUf] = useState('')
  const [varas, setVaras] = useState<any[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [isCreating, startCreatingTransition] = useTransition()
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    const dbIds = varasDoPerito
      .filter((v) => selected.has(v.id))
      .map((v) => v.id)

    if (dbIds.length === 0) {
      setError('SINCRONIZE AS VARAS NO RADAR PRIMEIRO PARA CRIAR UMA ROTA.')
      return
    }
    setError(null)
    startCreatingTransition(async () => {
      const result = await createRotaFromVaras(dbIds)
      if (result && !result.ok) setError(result.error ?? 'ERRO AO CRIAR ROTA')
    })
  }

  return (
    <div className="border border-slate-100 bg-white p-8 space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-900">RADAR DE VARAS POR ESTADO</h3>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">
          EXPLORE VARAS DISPONÍVEIS E GERE ESTRATÉGIAS DE CAMPO
        </p>
      </div>

      {/* Selectors */}
      <div className="flex gap-4">
        <select
          value={uf}
          onChange={(e) => handleUfChange(e.target.value)}
          className="h-10 bg-slate-50 border-0 text-[10px] font-bold uppercase tracking-widest px-4 focus:ring-0 min-w-[200px]"
        >
          <option value="">FILTRAR ESTADO</option>
          {ESTADOS_DISPONIVEIS.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>

        {uf && loaded && varas.length > 0 && (
          <button
            onClick={toggleAll}
            className="h-10 px-6 border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
          >
            {selected.size === varas.length ? 'DESMARCAR TUDO' : 'MARCAR TUDO'}
          </button>
        )}
      </div>

      {/* Status states */}
      {isPending && (
        <div className="py-12 flex flex-col items-center border border-dashed border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-300 animate-pulse">MAPEANDO VARAS...</span>
        </div>
      )}

      {!isPending && loaded && varas.length === 0 && (
        <div className="py-12 flex flex-col items-center border border-dashed border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
            NENHUMA VARA ENCONTRADA PARA {uf}
          </p>
        </div>
      )}

      {/* Results */}
      {!isPending && varas.length > 0 && (
        <>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            <span>{varas.length} VARAS MAPEADAS</span>
            <span className="h-4 w-px bg-slate-100" />
            <span className="text-[#a3e635]">{varas.filter(v => v.enderecoTexto).length} COM ENDEREÇO</span>
          </div>

          <div className="space-y-px bg-slate-100 border border-slate-100 max-h-96 overflow-y-auto shadow-sm">
            {varas.map((v) => {
              const key = `${v.tribunalSigla}|${v.varaNome}`
              const inRadar = varasNaSigla.has(key)
              const dbVara = varasDoPerito.find((d) => d.tribunalSigla === v.tribunalSigla && d.varaNome === v.varaNome)
              const isSelected = dbVara ? selected.has(dbVara.id) : false

              return (
                <div
                  key={v.varaId}
                  onClick={() => dbVara && toggleVara(dbVara.id)}
                  className={cn(
                    'flex items-center gap-8 bg-white p-6 transition-all',
                    dbVara ? 'cursor-pointer hover:bg-slate-50' : 'opacity-40 cursor-default',
                    isSelected ? 'ring-2 ring-inset ring-[#a3e635] z-10' : ''
                  )}
                >
                  {/* Select Box */}
                  <div className={cn("h-4 w-4 border flex-shrink-0", isSelected ? "bg-[#a3e635] border-[#a3e635]" : "border-slate-200")} />

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider truncate">{v.varaNome}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{v.tribunalSigla}</span>
                      {v.enderecoTexto && (
                        <>
                          <span className="text-[9px] text-slate-100">|</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{v.enderecoTexto}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {inRadar && (
                      <span className="bg-[#a3e635] text-slate-900 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                        NO RADAR
                      </span>
                    )}
                    {!v.enderecoTexto && (
                      <span className="text-[9px] font-bold text-red-300 uppercase tracking-widest">SEM ENDEREÇO</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</p>
            </div>
          )}

          {/* Action Footer */}
          {selected.size > 0 && (
            <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                {selected.size} VARA(S) SELECIONADA(S)
              </span>
              <button
                className="h-14 px-12 bg-[#a3e635] text-slate-900 text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-105 disabled:opacity-20 transition-all font-bold"
                onClick={handleCriarRota}
                disabled={isCreating}
              >
                {isCreating ? 'PROCESSANDO...' : 'CRIAR ROTA ESTRATÉGICA'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import React, { useState, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { salvarRotaProspeccao } from '@/lib/actions/rotas-nova'
import type { VaraCatalog } from '@/lib/data/varas-catalog'
import type { TipoPontoRota } from '@/lib/types/rotas'
import dynamic from 'next/dynamic'

const RouteMapDynamic = dynamic(() => import('@/components/maps/route-map-dynamic'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-white border border-slate-100">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">CARREGANDO MAPA...</span>
    </div>
  ),
})

function buildGoogleMapsUrl(
  pontos: { latitude: number; longitude: number }[],
): string {
  if (pontos.length === 0) return ''
  if (pontos.length === 1)
    return `https://www.google.com/maps/search/?api=1&query=${pontos[0].latitude},${pontos[0].longitude}`

  const origin = `${pontos[0].latitude},${pontos[0].longitude}`
  const dest   = `${pontos[pontos.length - 1].latitude},${pontos[pontos.length - 1].longitude}`
  const middle = pontos.slice(1, -1)
  const wp     = middle.map((p) => `${p.latitude},${p.longitude}`).join('|')
  const base   = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`
  return wp ? `${base}&waypoints=${wp}` : base
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  varas: VaraCatalog[]
  grupos: Record<string, VaraCatalog[]>
}

export function NovaRotaForm({ varas, grupos }: Props) {
  const [titulo, setTitulo] = useState('')
  const [selecionadas, setSelecionadas] = useState<VaraCatalog[]>([])
  const [filtro, setFiltro] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function addVara(vara: VaraCatalog) {
    if (selecionadas.find((v) => v.id === vara.id)) return
    setSelecionadas((p) => [...p, vara])
  }

  function removeVara(id: string) {
    setSelecionadas((p) => p.filter((v) => v.id !== id))
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    setSelecionadas((p) => {
      const next = [...p]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  function moveDown(idx: number) {
    setSelecionadas((p) => {
      if (idx >= p.length - 1) return p
      const next = [...p]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  const mapRoute = useMemo(
    () => ({
      id: 'nova',
      pontos: selecionadas.map((v, i) => ({
        id: v.id,
        rotaId: 'nova',
        nome: v.nome,
        latitude: v.latitude,
        longitude: v.longitude,
        tipo: v.tipo,
        ordem: i + 1,
        endereco: v.endereco,
      })),
    }),
    [selecionadas],
  )

  const gmapsUrl = buildGoogleMapsUrl(selecionadas)

  function copyLink() {
    navigator.clipboard.writeText(gmapsUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSalvar() {
    if (!titulo.trim()) { setError('INFORME UM TÍTULO PARA A ROTA'); return }
    if (selecionadas.length < 1) { setError('SELECIONE AO MENOS 1 PARADA'); return }
    setError(null)
    startTransition(async () => {
      const res = await salvarRotaProspeccao({
        titulo,
        pontos: selecionadas.map((v, i) => ({
          titulo: v.nome,
          endereco: v.endereco,
          latitude: v.latitude,
          longitude: v.longitude,
          ordem: i + 1,
        })),
      })
      if (res && !res.ok) setError(res.error ?? 'ERRO AO SALVAR')
    })
  }

  const filtradas = filtro.trim()
    ? varas.filter(
        (v) =>
          v.nome.toLowerCase().includes(filtro.toLowerCase()) ||
          v.tribunal.toLowerCase().includes(filtro.toLowerCase()) ||
          v.cidade.toLowerCase().includes(filtro.toLowerCase()),
      )
    : null

  const selectedIds = new Set(selecionadas.map((v) => v.id))

  return (
    <div className="space-y-12">

      {/* Título */}
      <div className="max-w-2xl">
        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
          NOME DA ROTA
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="EX: CIRCUITO CENTRO — VARAS CÍVEIS"
          className="w-full text-2xl font-bold tracking-tight text-slate-900 border-0 border-b border-slate-100 bg-transparent py-4 focus:ring-0 focus:border-slate-900 placeholder:text-slate-100 transition-all uppercase"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-px bg-slate-100 border border-slate-100">
        {/* PARADAS DISPONÍVEIS */}
        <div className="bg-white p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-900">PERÍCIAS DISPONÍVEIS</h3>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{varas.length} LOCAIS</span>
          </div>

          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="PESQUISAR..."
            className="w-full h-10 bg-slate-50 border-0 text-[10px] font-bold tracking-widest px-4 focus:ring-0 placeholder:text-slate-200 uppercase"
          />

          <div className="max-h-[400px] overflow-y-auto space-y-px">
            {filtradas ? (
              filtradas.map((vara) => (
                <VaraItem key={vara.id} vara={vara} selected={selectedIds.has(vara.id)} onAdd={addVara} />
              ))
            ) : (
              Object.entries(grupos).map(([grupo, items]) => (
                <div key={grupo} className="py-2 first:pt-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300 mb-2 mt-4 ml-4">{grupo}</p>
                  <div className="space-y-px">
                    {items.map((vara) => (
                      <VaraItem key={vara.id} vara={vara} selected={selectedIds.has(vara.id)} onAdd={addVara} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ROTA ATUAL */}
        <div className="bg-white p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-900">CONFIGURAÇÃO DA ROTA</h3>
            {selecionadas.length > 0 && (
              <button onClick={() => setSelecionadas([])} className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635] hover:text-slate-900 transition-colors">LIMPAR</button>
            )}
          </div>

          {selecionadas.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-200 border border-dashed border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-widest">ADICIONE PONTOS À ESQUERDA</p>
            </div>
          ) : (
            <div className="space-y-px bg-slate-50 border border-slate-50 max-h-[400px] overflow-y-auto">
              {selecionadas.map((vara, idx) => (
                <div key={vara.id} className="flex items-center gap-4 bg-white p-4 group leading-none">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-slate-900 text-[10px] font-bold text-white leading-none">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider truncate leading-tight">{vara.nome}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1 truncate">{vara.cidade}</p>
                  </div>
                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-[10px] font-bold text-slate-300 hover:text-slate-900 disabled:opacity-10">↑</button>
                    <button onClick={() => moveDown(idx)} disabled={idx === selecionadas.length - 1} className="text-[10px] font-bold text-slate-300 hover:text-slate-900 disabled:opacity-10">↓</button>
                    <button onClick={() => removeVara(vara.id)} className="text-[10px] font-bold text-red-300 hover:text-red-500">X</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mapa preview */}
      {selecionadas.length >= 1 && (
        <div className="space-y-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-900">PREVIEW DA ROTA</h3>
          <div className="h-[400px] w-full overflow-hidden border border-slate-100">
            <RouteMapDynamic routes={[mapRoute]} />
          </div>
        </div>
      )}

      {/* Google Maps link */}
      {selecionadas.length >= 1 && (
        <div className="p-8 bg-slate-900 flex items-center justify-between gap-12">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">INTEGRAÇÃO GOOGLE MAPS</p>
            <p className="text-[11px] font-bold text-white uppercase tracking-widest truncate">{gmapsUrl}</p>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={copyLink} className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635] hover:text-white transition-colors">
              {copied ? 'COPIADO' : 'COPIAR LINK'}
            </button>
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="h-10 px-6 bg-white text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:bg-[#a3e635] transition-all flex items-center">
              ABRIR NO MAPS
            </a>
          </div>
        </div>
      )}

      {/* Botões finais */}
      <div className="flex items-center justify-between pt-8 border-t border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-300">
          {selecionadas.length} PARADA(S) CONFIGURADA(S)
        </p>
        <div className="flex gap-4">
          {error && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest pt-3 pr-4">{error}</span>}
          <button
            onClick={handleSalvar}
            disabled={isPending || selecionadas.length < 1 || !titulo.trim()}
            className="h-14 px-12 bg-[#a3e635] text-slate-900 text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-105 disabled:opacity-20 transition-all"
          >
            {isPending ? 'SALVANDO...' : 'SALVAR ROTA'}
          </button>
        </div>
      </div>
    </div>
  )
}

function VaraItem({ vara, selected, onAdd }: { vara: VaraCatalog, selected: boolean, onAdd: (v: VaraCatalog) => void }) {
  return (
    <button
      onClick={() => !selected && onAdd(vara)}
      disabled={selected}
      className={cn(
        "w-full flex items-center gap-6 px-6 py-4 text-left transition-all",
        selected ? "bg-slate-50 opacity-40 cursor-default" : "bg-white hover:bg-slate-50"
      )}
    >
      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-slate-900 text-[10px] font-bold text-white">
        {selected ? 'OK' : '+'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider truncate">{vara.nome}</p>
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1.5 truncate">{vara.cidade}</p>
      </div>
    </button>
  )
}

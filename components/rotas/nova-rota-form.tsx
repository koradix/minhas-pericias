'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  MapPin,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Building2,
  Landmark,
  Briefcase,
  ArrowUp,
  ArrowDown,
  Copy,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { salvarRotaProspeccao } from '@/lib/actions/rotas-nova'
import type { VaraCatalog } from '@/lib/data/varas-catalog'
import type { TipoPontoRota } from '@/lib/types/rotas'
import dynamic from 'next/dynamic'

const RouteMapDynamic = dynamic(() => import('@/components/maps/route-map-dynamic'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
    </div>
  ),
})

// ─── Config ───────────────────────────────────────────────────────────────────

const tipoIcon: Record<TipoPontoRota, typeof MapPin> = {
  FORUM:      Building2,
  VARA_CIVEL: Landmark,
  ESCRITORIO: Briefcase,
  PERICIA:    MapPin,
}

const tipoColor: Record<TipoPontoRota, string> = {
  FORUM:      'text-blue-700 bg-blue-50 border-blue-200',
  VARA_CIVEL: 'text-violet-700 bg-violet-50 border-violet-200',
  ESCRITORIO: 'text-amber-700 bg-amber-50 border-amber-200',
  PERICIA:    'text-emerald-700 bg-emerald-50 border-emerald-200',
}

// ─── Google Maps link ─────────────────────────────────────────────────────────

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

  // ── Seleção ──────────────────────────────────────────────────────────────
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

  // ── Map data ─────────────────────────────────────────────────────────────
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

  // ── Google Maps link ─────────────────────────────────────────────────────
  const gmapsUrl = buildGoogleMapsUrl(selecionadas)

  function copyLink() {
    navigator.clipboard.writeText(gmapsUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  function handleSalvar() {
    if (!titulo.trim()) { setError('Informe um título para a rota'); return }
    if (selecionadas.length < 2) { setError('Selecione ao menos 2 paradas'); return }
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
      if (res && !res.ok) setError(res.error ?? 'Erro ao salvar')
    })
  }

  // ── Filtered varas ───────────────────────────────────────────────────────
  const filtradas = filtro.trim()
    ? varas.filter(
        (v) =>
          v.nome.toLowerCase().includes(filtro.toLowerCase()) ||
          v.tribunal.toLowerCase().includes(filtro.toLowerCase()) ||
          v.cidade.toLowerCase().includes(filtro.toLowerCase()),
      )
    : null // null = show grouped view

  const selectedIds = new Set(selecionadas.map((v) => v.id))

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Título */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Nome da rota <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Circuito Centro — Varas Cíveis RJ"
          className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
        />
      </div>

      {/* Main area: selector + pontos selecionados */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* ── Varas disponíveis ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            Varas disponíveis
            <span className="ml-2 text-xs font-normal text-slate-400">{varas.length} locais</span>
          </p>

          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar por nome, tribunal ou cidade…"
            className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
          />

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filtradas ? (
              /* ── Search results ── */
              filtradas.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Nenhum resultado</p>
              ) : (
                filtradas.map((vara) => (
                  <VaraItem
                    key={vara.id}
                    vara={vara}
                    selected={selectedIds.has(vara.id)}
                    onAdd={addVara}
                  />
                ))
              )
            ) : (
              /* ── Grouped view ── */
              Object.entries(grupos).map(([grupo, items]) => (
                <div key={grupo}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                    {grupo}
                  </p>
                  <div className="space-y-1">
                    {items.map((vara) => (
                      <VaraItem
                        key={vara.id}
                        vara={vara}
                        selected={selectedIds.has(vara.id)}
                        onAdd={addVara}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Pontos selecionados ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              Rota
              {selecionadas.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-100 px-1.5 text-[10px] font-bold text-lime-700">
                  {selecionadas.length}
                </span>
              )}
            </p>
            {selecionadas.length > 0 && (
              <button
                onClick={() => setSelecionadas([])}
                className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>

          {selecionadas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <MapPin className="h-8 w-8 text-slate-200" />
              <p className="text-xs">Clique em varas para adicionar à rota</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {selecionadas.map((vara, idx) => {
                const Icon = tipoIcon[vara.tipo]
                return (
                  <div
                    key={vara.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-lime-500 text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{vara.nome}</p>
                      <p className="text-[10px] text-slate-400 truncate">{vara.cidade} · {vara.tribunal}</p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-300 hover:text-slate-600 disabled:opacity-0 transition-colors"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === selecionadas.length - 1}
                        className="p-1 rounded text-slate-300 hover:text-slate-600 disabled:opacity-0 transition-colors"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeVara(vara.id)}
                        className="p-1 rounded text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mapa preview */}
      {selecionadas.length >= 1 && (
        <div>
          <p className="text-sm font-semibold text-slate-900 mb-2">Preview no mapa</p>
          <div className="h-[340px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <RouteMapDynamic routes={[mapRoute]} />
          </div>
        </div>
      )}

      {/* Google Maps link */}
      {selecionadas.length >= 2 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
          <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 mb-0.5">Link Google Maps</p>
            <p className="text-[11px] text-slate-400 truncate">{gmapsUrl}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={copyLink}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
            >
              {copied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir
            </a>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <p className="mr-auto text-xs text-slate-400">
          {selecionadas.length === 0
            ? 'Nenhuma parada selecionada'
            : `${selecionadas.length} parada${selecionadas.length > 1 ? 's' : ''} na rota`}
        </p>
        <Button
          type="button"
          onClick={handleSalvar}
          disabled={isPending || selecionadas.length < 2 || !titulo.trim()}
          className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1.5"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Salvar rota
        </Button>
      </div>
    </div>
  )
}

// ─── VaraItem ─────────────────────────────────────────────────────────────────

function VaraItem({
  vara,
  selected,
  onAdd,
}: {
  vara: VaraCatalog
  selected: boolean
  onAdd: (vara: VaraCatalog) => void
}) {
  const Icon = tipoIcon[vara.tipo]
  return (
    <button
      onClick={() => !selected && onAdd(vara)}
      disabled={selected}
      className={cn(
        'w-full flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all',
        selected
          ? 'border-lime-200 bg-lime-50 opacity-60 cursor-default'
          : 'border-slate-100 bg-white hover:border-lime-300 hover:shadow-sm cursor-pointer',
      )}
    >
      <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border', tipoColor[vara.tipo])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-800 truncate">{vara.nome}</p>
        <p className="text-[10px] text-slate-400 truncate">{vara.endereco}</p>
      </div>
      {selected ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-lime-600 flex-shrink-0" />
      ) : (
        <Plus className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
      )}
    </button>
  )
}

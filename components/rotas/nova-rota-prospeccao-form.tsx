'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  MapPin, Search, Plus, Trash2, ExternalLink, Loader2,
  Landmark, ArrowUp, ArrowDown, Copy, CheckCircle2, ChevronDown, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { salvarRotaProspeccao } from '@/lib/actions/rotas-nova'
import type { VaraPublicaRow } from '@/lib/data/prospeccao'
import { getCoordsComarca } from '@/lib/data/coords-rj'
import dynamic from 'next/dynamic'

const RouteMapDynamic = dynamic(() => import('@/components/maps/route-map-dynamic'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
    </div>
  ),
})

// ─── Regiões ─────────────────────────────────────────────────────────────────

const REGIOES: { nome: string; comarcas: string[] }[] = [
  { nome: 'Capital',             comarcas: ['CAPITAL'] },
  { nome: 'Grande Rio',          comarcas: ['DUQUE DE CAXIAS','NOVA IGUACU','SAO JOAO DE MERITI','NILOPOLIS','QUEIMADOS','JAPERI','SEROPEDICA','ITAGUAI','SAO GONCALO','NITEROI','MARICA','GUAPIMIRIM','ITABORAI'] },
  { nome: 'Serrana',             comarcas: ['PETROPOLIS','TERESOPOLIS','NOVA FRIBURGO','TRES RIOS','VASSOURAS','BARRA DO PIRAI','PARAIBA DO SUL'] },
  { nome: 'Médio Paraíba',       comarcas: ['BARRA MANSA','VOLTA REDONDA','RESENDE'] },
  { nome: 'Norte Fluminense',    comarcas: ['CAMPOS DOS GOYTACAZE','MACAE','RIO DAS OSTRAS','SAO FIDELIS','ITAPERUNA','MIRACEMA','BOM JESUS DE ITABAPORA'] },
  { nome: 'Baixadas Litorâneas', comarcas: ['CABO FRIO','BUZIOS','ARARUAMA','SAO PEDRO DA ALDEIA','RIO BONITO','ANGRA DOS REIS','SAO JOAO DA BARRA'] },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type VaraSelected = VaraPublicaRow & { lat: number; lng: number }

function buildGoogleMapsUrl(pontos: { lat: number; lng: number }[]): string {
  if (pontos.length === 0) return ''
  if (pontos.length === 1)
    return `https://www.google.com/maps/search/?api=1&query=${pontos[0].lat},${pontos[0].lng}`
  const origin = `${pontos[0].lat},${pontos[0].lng}`
  const dest   = `${pontos[pontos.length - 1].lat},${pontos[pontos.length - 1].lng}`
  const middle = pontos.slice(1, -1)
  const wp     = middle.map((p) => `${p.lat},${p.lng}`).join('|')
  const base   = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`
  return wp ? `${base}&waypoints=${wp}` : base
}

// ─── Comarca Accordion ────────────────────────────────────────────────────────

function ComarcaItem({
  comarca,
  varas,
  selectedIds,
  onToggle,
}: {
  comarca: string
  varas: VaraPublicaRow[]
  selectedIds: Set<string>
  onToggle: (vara: VaraPublicaRow) => void
}) {
  const [open, setOpen] = useState(false)
  const countSelected = varas.filter((v) => selectedIds.has(v.id)).length

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className="flex-1 text-sm font-semibold text-slate-700 capitalize">
          {comarca.charAt(0) + comarca.slice(1).toLowerCase()}
        </span>
        <span className="text-[11px] text-slate-400 shrink-0">{varas.length} vara{varas.length !== 1 ? 's' : ''}</span>
        {countSelected > 0 && (
          <span className="inline-flex items-center rounded-md bg-lime-100 px-1.5 py-0.5 text-[10px] font-bold text-lime-700 shrink-0">
            {countSelected}
          </span>
        )}
        <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-2 py-2 space-y-1">
          {varas.map((vara) => {
            const selected = selectedIds.has(vara.id)
            return (
              <button
                key={vara.id}
                onClick={() => onToggle(vara)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-xs transition-all',
                  selected
                    ? 'border-lime-200 bg-lime-50'
                    : 'border-slate-100 bg-white hover:border-lime-300 hover:bg-lime-50/30',
                )}
              >
                <Landmark className={cn('h-3.5 w-3.5 shrink-0', selected ? 'text-lime-600' : 'text-slate-400')} />
                <div className="flex-1 min-w-0">
                  <p className={cn('font-semibold truncate', selected ? 'text-lime-800' : 'text-slate-700')}>
                    {vara.varaNome}
                  </p>
                  {vara.juizTitular && vara.juizTitular !== 'Vago' && (
                    <p className="text-[10px] text-slate-400 truncate">{vara.juizTitular}</p>
                  )}
                </div>
                {selected
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-lime-600 shrink-0" />
                  : <Plus className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Região Section ───────────────────────────────────────────────────────────

function RegiaoSection({
  regiao,
  varasPorComarca,
  selectedIds,
  onToggle,
}: {
  regiao: typeof REGIOES[0]
  varasPorComarca: Map<string, VaraPublicaRow[]>
  selectedIds: Set<string>
  onToggle: (vara: VaraPublicaRow) => void
}) {
  const [open, setOpen] = useState(false)
  const comarcasComVaras = regiao.comarcas.filter((c) => (varasPorComarca.get(c)?.length ?? 0) > 0)
  if (comarcasComVaras.length === 0) return null

  const totalSelecionadas = comarcasComVaras.reduce(
    (acc, c) => acc + (varasPorComarca.get(c) ?? []).filter((v) => selectedIds.has(v.id)).length,
    0,
  )

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-sm text-slate-700">{regiao.nome}</span>
        <span className="text-[11px] text-slate-400">{comarcasComVaras.length} comarcas</span>
        {totalSelecionadas > 0 && (
          <span className="inline-flex items-center rounded-md bg-lime-100 px-1.5 py-0.5 text-[10px] font-bold text-lime-700">
            {totalSelecionadas} selecionada{totalSelecionadas !== 1 ? 's' : ''}
          </span>
        )}
        <ChevronDown className={cn('h-4 w-4 text-slate-400 ml-auto shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-3 py-3 space-y-2">
          {comarcasComVaras.map((comarca) => (
            <ComarcaItem
              key={comarca}
              comarca={comarca}
              varas={varasPorComarca.get(comarca) ?? []}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function NovaRotaProspeccaoForm({ varas }: { varas: VaraPublicaRow[] }) {
  const [titulo, setTitulo] = useState('')
  const [selecionadas, setSelecionadas] = useState<VaraSelected[]>([])
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // ── Agrupamento ──────────────────────────────────────────────────────────
  const varasPorComarca = useMemo(() => {
    const map = new Map<string, VaraPublicaRow[]>()
    const filtered = search.trim()
      ? varas.filter(
          (v) =>
            v.varaNome.toLowerCase().includes(search.toLowerCase()) ||
            v.comarca.toLowerCase().includes(search.toLowerCase()) ||
            (v.juizTitular ?? '').toLowerCase().includes(search.toLowerCase()),
        )
      : varas
    for (const v of filtered) {
      const list = map.get(v.comarca) ?? []
      list.push(v)
      map.set(v.comarca, list)
    }
    return map
  }, [varas, search])

  const selectedIds = useMemo(() => new Set(selecionadas.map((v) => v.id)), [selecionadas])

  function handleToggle(vara: VaraPublicaRow) {
    if (selectedIds.has(vara.id)) {
      setSelecionadas((p) => p.filter((v) => v.id !== vara.id))
    } else {
      const [lat, lng] = getCoordsComarca(vara.comarca)
      // Offset slightly so stacked varas in same building don't overlap on map
      const idx = selecionadas.filter((v) => v.comarca === vara.comarca).length
      setSelecionadas((p) => [...p, { ...vara, lat: lat + idx * 0.0002, lng: lng + idx * 0.0002 }])
    }
  }

  function moveUp(idx: number) {
    setSelecionadas((p) => {
      if (idx === 0) return p
      const next = [...p]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; return next
    })
  }

  function moveDown(idx: number) {
    setSelecionadas((p) => {
      if (idx >= p.length - 1) return p
      const next = [...p]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; return next
    })
  }

  const mapRoute = useMemo(() => ({
    id: 'nova-prospeccao',
    pontos: selecionadas.map((v, i) => ({
      id: v.id,
      rotaId: 'nova-prospeccao',
      nome: `${v.comarca} — ${v.varaNome}`,
      latitude: v.lat,
      longitude: v.lng,
      tipo: 'VARA_CIVEL' as const,
      ordem: i + 1,
      endereco: v.endereco ?? undefined,
    })),
  }), [selecionadas])

  const gmapsUrl = buildGoogleMapsUrl(selecionadas)

  function copyLink() {
    navigator.clipboard.writeText(gmapsUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSalvar() {
    if (!titulo.trim()) { setError('Informe um título para a rota'); return }
    if (selecionadas.length < 1) { setError('Selecione ao menos 1 vara'); return }
    setError(null)
    startTransition(async () => {
      const res = await salvarRotaProspeccao({
        titulo,
        pontos: selecionadas.map((v, i) => ({
          titulo: `${v.comarca} — ${v.varaNome}`,
          endereco: v.endereco ?? `${v.comarca} — ${v.varaNome}`,
          latitude: v.lat,
          longitude: v.lng,
          ordem: i + 1,
        })),
      })
      if (res && !res.ok) setError(res.error ?? 'Erro ao salvar')
    })
  }

  return (
    <div className="space-y-5">
      {/* Título */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Nome da rota <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Circuito Fóruns Centro RJ — Janeiro"
          className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Varas disponíveis ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            Varas disponíveis
            <span className="ml-2 text-xs font-normal text-slate-400">{varas.length} varas · TJRJ</span>
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por vara, comarca ou juiz…"
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
            {REGIOES.map((regiao) => (
              <RegiaoSection
                key={regiao.nome}
                regiao={regiao}
                varasPorComarca={varasPorComarca}
                selectedIds={selectedIds}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>

        {/* ── Rota selecionada ── */}
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
              <button onClick={() => setSelecionadas([])} className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors">
                Limpar
              </button>
            )}
          </div>

          {selecionadas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <Landmark className="h-8 w-8 text-slate-200" />
              <p className="text-xs">Clique nas varas para adicionar</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {selecionadas.map((vara, idx) => (
                <div
                  key={vara.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-500 text-[10px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <Landmark className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{vara.varaNome}</p>
                    <p className="text-[10px] text-slate-400 truncate capitalize">{vara.comarca.toLowerCase()}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 rounded text-slate-300 hover:text-slate-600 disabled:opacity-0 transition-colors">
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button onClick={() => moveDown(idx)} disabled={idx === selecionadas.length - 1} className="p-1 rounded text-slate-300 hover:text-slate-600 disabled:opacity-0 transition-colors">
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleToggle(vara)} className="p-1 rounded text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mapa preview */}
      {selecionadas.length >= 1 && (
        <div>
          <p className="text-sm font-semibold text-slate-900 mb-2">Preview no mapa</p>
          <div className="isolate h-[340px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <RouteMapDynamic routes={[mapRoute]} />
          </div>
        </div>
      )}

      {/* Google Maps link */}
      {selecionadas.length >= 1 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
          <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 mb-0.5">Link Google Maps</p>
            <p className="text-[11px] text-slate-400 truncate">{gmapsUrl}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={copyLink} className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors">
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <ExternalLink className="h-3 w-3" />
              Abrir
            </a>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <p className="mr-auto text-xs text-slate-400">
          {selecionadas.length === 0 ? 'Nenhuma vara selecionada' : `${selecionadas.length} parada${selecionadas.length > 1 ? 's' : ''} na rota`}
        </p>
        <Button
          type="button"
          onClick={handleSalvar}
          disabled={isPending || selecionadas.length < 1 || !titulo.trim()}
          className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1.5"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Salvar rota
        </Button>
      </div>
    </div>
  )
}

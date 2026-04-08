'use client'

import { useState, useTransition, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { salvarRotaComarcas } from '@/lib/actions/rotas-nova'
import type { VaraPublicaRow } from '@/lib/data/prospeccao'
import { getCoordsComarca } from '@/lib/data/coords-rj'
import dynamic from 'next/dynamic'

const RouteMapDynamic = dynamic(() => import('@/components/maps/route-map-dynamic'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-white border border-slate-100">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">CARREGANDO MAPA...</span>
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
  selected,
  onToggleComarca,
}: {
  comarca: string
  varas: VaraPublicaRow[]
  selected: boolean
  onToggleComarca: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-slate-100 bg-white">
      <div className="flex items-center gap-0">
        {/* Checkbox area — selects entire city */}
        <button
          onClick={onToggleComarca}
          className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50 transition-all"
        >
          <div className={cn("h-4 w-4 border flex-shrink-0", selected ? "bg-[#a3e635] border-[#a3e635]" : "border-slate-200")} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
            {comarca}
          </span>
        </button>
        {/* Expand to see varas */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto px-6 py-5 text-[9px] font-bold text-slate-300 uppercase tracking-widest hover:text-slate-600 transition-colors"
        >
          {open ? 'FECHAR' : `${varas.length} VARAS`}
        </button>
      </div>

      {open && (
        <div className="px-6 pb-4 space-y-1 bg-slate-50 border-t border-slate-50">
          {varas.map((vara) => (
            <div key={vara.id} className="flex items-center gap-4 px-4 py-2 bg-white">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate flex-1">{vara.varaNome}</p>
              {vara.juizTitular && vara.juizTitular !== 'Vago' && (
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest truncate">{vara.juizTitular}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Região Section ───────────────────────────────────────────────────────────

function RegiaoSection({
  regiao,
  varasPorComarca,
  selectedComarcas,
  onToggleComarca,
}: {
  regiao: typeof REGIOES[0]
  varasPorComarca: Map<string, VaraPublicaRow[]>
  selectedComarcas: Set<string>
  onToggleComarca: (comarca: string) => void
}) {
  const [open, setOpen] = useState(false)
  const comarcasComVaras = regiao.comarcas.filter((c) => (varasPorComarca.get(c)?.length ?? 0) > 0)
  if (comarcasComVaras.length === 0) return null

  const totalSel = comarcasComVaras.filter((c) => selectedComarcas.has(c)).length

  return (
    <div className="border border-slate-100 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-8 py-8 text-left hover:bg-slate-50 transition-all"
      >
        <div className="flex items-center gap-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">{regiao.nome}</span>
          {totalSel > 0 && (
            <span className="bg-[#a3e635] text-slate-900 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 shadow-sm">
              {totalSel} CIDADE{totalSel > 1 ? 'S' : ''}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          {open ? 'ESCONDER' : `${comarcasComVaras.length} CIDADES`}
        </span>
      </button>

      {open && (
        <div className="p-8 pt-0 space-y-px bg-slate-50 border-t border-slate-50">
          {comarcasComVaras.map((comarca) => (
            <ComarcaItem
              key={comarca}
              comarca={comarca}
              varas={varasPorComarca.get(comarca) ?? []}
              selected={selectedComarcas.has(comarca)}
              onToggleComarca={() => onToggleComarca(comarca)}
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
  const [selectedComarcas, setSelectedComarcas] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Full map (unfiltered) for route building
  const allVarasPorComarca = useMemo(() => {
    const map = new Map<string, VaraPublicaRow[]>()
    for (const v of varas) {
      const list = map.get(v.comarca) ?? []
      list.push(v)
      map.set(v.comarca, list)
    }
    return map
  }, [varas])

  // Filtered map (for search)
  const varasPorComarca = useMemo(() => {
    if (!search.trim()) return allVarasPorComarca
    const map = new Map<string, VaraPublicaRow[]>()
    const q = search.toLowerCase()
    for (const v of varas) {
      if (v.varaNome.toLowerCase().includes(q) || v.comarca.toLowerCase().includes(q) || (v.juizTitular ?? '').toLowerCase().includes(q)) {
        const list = map.get(v.comarca) ?? []
        list.push(v)
        map.set(v.comarca, list)
      }
    }
    return map
  }, [varas, allVarasPorComarca, search])

  function handleToggleComarca(comarca: string) {
    setSelectedComarcas((prev) => {
      const next = new Set(prev)
      if (next.has(comarca)) next.delete(comarca)
      else next.add(comarca)
      return next
    })
  }

  // Build comarca data for route from selection
  const comarcasAgrupadas = useMemo(() => {
    return Array.from(selectedComarcas).map((comarca) => {
      const comarcaVaras = allVarasPorComarca.get(comarca) ?? []
      const [lat, lng] = getCoordsComarca(comarca)
      return {
        comarca,
        varas: comarcaVaras,
        lat,
        lng,
        endereco: comarcaVaras[0]?.endereco ?? comarca,
      }
    })
  }, [selectedComarcas, allVarasPorComarca])

  const mapRoute = useMemo(() => ({
    id: 'nova-prospeccao',
    pontos: comarcasAgrupadas.map((c, i) => ({
      id: c.comarca,
      rotaId: 'nova-prospeccao',
      nome: `${c.comarca} (${c.varas.length} varas)`,
      latitude: c.lat,
      longitude: c.lng,
      tipo: 'FORUM' as const,
      ordem: i + 1,
      endereco: c.endereco,
    })),
  }), [comarcasAgrupadas])

  const gmapsUrl = buildGoogleMapsUrl(comarcasAgrupadas)

  function copyLink() {
    navigator.clipboard.writeText(gmapsUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSalvar() {
    if (!titulo.trim()) { setError('INFORME UM TÍTULO PARA A ROTA'); return }
    if (selectedComarcas.size < 1) { setError('SELECIONE AO MENOS 1 CIDADE'); return }
    setError(null)
    startTransition(async () => {
      const res = await salvarRotaComarcas(titulo, comarcasAgrupadas.map((c) => ({
        comarca: c.comarca,
        endereco: c.endereco,
        latitude: c.lat,
        longitude: c.lng,
        varas: c.varas.map((v) => ({
          varaNome: v.varaNome,
          juizNome: v.juizTitular ?? undefined,
        })),
      })))
      if (res && !res.ok) setError(res.error ?? 'ERRO AO SALVAR')
    })
  }

  return (
    <div className="space-y-12">
      {/* Título */}
      <div className="max-w-2xl">
        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
          NOME DA ROTA DE PROSPECÇÃO
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="EX: CIRCUITO FÓRUNS CENTRO RJ — MARÇO"
          className="w-full text-2xl font-bold tracking-tight text-slate-900 border-0 border-b border-slate-100 bg-transparent py-4 focus:ring-0 focus:border-slate-900 placeholder:text-slate-100 transition-all uppercase"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-px bg-slate-100 border border-slate-100 shadow-sm overflow-hidden">
        {/* VARAS DISPONÍVEIS */}
        <div className="bg-white p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-900">CATÁLOGO DE VARAS</h3>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{varas.length} VARAS · TJRJ</span>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="FILTRAR POR VARA, COMARCA OU JUIZ..."
            className="w-full h-10 bg-slate-50 border-0 text-[10px] font-bold tracking-widest px-6 focus:ring-0 placeholder:text-slate-200 uppercase"
          />

          <div className="max-h-[500px] overflow-y-auto space-y-px">
            {REGIOES.map((regiao) => (
              <RegiaoSection
                key={regiao.nome}
                regiao={regiao}
                varasPorComarca={varasPorComarca}
                selectedComarcas={selectedComarcas}
                onToggleComarca={handleToggleComarca}
              />
            ))}
          </div>
        </div>

        {/* ROTA ATUAL */}
        <div className="bg-white p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-900">CIDADES NA ROTA</h3>
            {selectedComarcas.size > 0 && (
              <button onClick={() => setSelectedComarcas(new Set())} className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635] hover:text-slate-900 transition-colors">LIMPAR</button>
            )}
          </div>

          {comarcasAgrupadas.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-slate-200 border border-dashed border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest">NENHUMA CIDADE SELECIONADA</p>
            </div>
          ) : (
            <div className="space-y-px bg-slate-50 border border-slate-50 max-h-[500px] overflow-y-auto">
              {comarcasAgrupadas.map((comarca, idx) => (
                <div key={comarca.comarca} className="bg-white">
                  <div className="flex items-center gap-6 p-6 leading-none">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-slate-900 text-[10px] font-bold text-white leading-none">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider truncate leading-tight">{comarca.comarca}</p>
                      <p className="text-[9px] font-bold text-[#a3e635] uppercase tracking-widest mt-1.5">{comarca.varas.length} VARA{comarca.varas.length > 1 ? 'S' : ''}</p>
                    </div>
                    <button onClick={() => handleToggleComarca(comarca.comarca)} className="text-[9px] font-bold text-red-300 hover:text-red-500 transition-all">X</button>
                  </div>
                  <div className="px-6 pb-4 space-y-1">
                    {comarca.varas.map((v) => (
                      <div key={v.id} className="flex items-center gap-4 px-4 py-2 bg-slate-50">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate flex-1">{v.varaNome}</p>
                        {v.juizTitular && v.juizTitular !== 'Vago' && (
                          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest truncate">{v.juizTitular}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mapa preview */}
      {comarcasAgrupadas.length >= 1 && (
        <div className="space-y-8">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-900">ESTRATÉGIA LOGÍSTICA</h3>
          <div className="h-[440px] w-full overflow-hidden border border-slate-100 shadow-sm">
            <RouteMapDynamic routes={[mapRoute]} />
          </div>
        </div>
      )}

      {/* Google Maps link */}
      {comarcasAgrupadas.length >= 1 && (
        <div className="p-10 bg-slate-900 flex items-center justify-between gap-12 shadow-xl">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">INTEGRAÇÃO GOOGLE MAPS</p>
            <p className="text-[11px] font-bold text-white uppercase tracking-widest truncate">{gmapsUrl}</p>
          </div>
          <div className="flex items-center gap-10">
            <button onClick={copyLink} className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635] hover:text-white transition-colors">
              {copied ? 'COPIADO' : 'COPIAR LINK'}
            </button>
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="h-12 px-8 bg-white text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:bg-[#a3e635] transition-all flex items-center shadow-lg">
              ABRIR NO MAPS
            </a>
          </div>
        </div>
      )}

      {/* Botões finais */}
      <div className="flex items-center justify-between pt-10 border-t border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-300">
          {selectedComarcas.size} CIDADE{selectedComarcas.size !== 1 ? 'S' : ''} SELECIONADA{selectedComarcas.size !== 1 ? 'S' : ''}
        </p>
        <div className="flex gap-6">
          {error && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest pt-4 pr-6 shrink-0">{error}</span>}
          <button
            onClick={handleSalvar}
            disabled={isPending || selectedComarcas.size < 1 || !titulo.trim()}
            className="h-14 px-12 bg-[#a3e635] text-slate-900 text-[11px] font-bold uppercase tracking-[0.3em] hover:brightness-105 disabled:opacity-20 transition-all font-bold shadow-lg"
          >
            {isPending ? 'PROCESSANDO...' : 'SALVAR ROTA'}
          </button>
        </div>
      </div>
    </div>
  )
}

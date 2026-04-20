'use client'

import dynamic from 'next/dynamic'
import { MapPin, ExternalLink, Navigation } from 'lucide-react'

const RouteMapDynamic = dynamic(() => import('@/components/maps/route-map-dynamic'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Carregando mapa...</span>
    </div>
  ),
})

interface Props {
  titulo: string
  endereco?: string | null
  lat?: number | null
  lng?: number | null
}

function googleMapsUrl(lat: number | null | undefined, lng: number | null | undefined, endereco?: string | null): string {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  }
  if (endereco) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(endereco)}`
  }
  return ''
}

function wazeUrl(lat: number | null | undefined, lng: number | null | undefined, endereco?: string | null): string {
  if (lat != null && lng != null) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  }
  if (endereco) {
    return `https://waze.com/ul?q=${encodeURIComponent(endereco)}&navigate=yes`
  }
  return ''
}

export function CheckpointMapHeader({ titulo, endereco, lat, lng }: Props) {
  const hasCoords = lat != null && lng != null
  const gmaps = googleMapsUrl(lat, lng, endereco)
  const waze = wazeUrl(lat, lng, endereco)

  return (
    <div className="space-y-3">
      {/* Mapa (só se tem coords) */}
      {hasCoords && (
        <div className="h-[200px] w-full overflow-hidden rounded-lg border border-slate-200">
          <RouteMapDynamic
            routes={[{
              id: 'cp',
              pontos: [{
                id: 'cp-1',
                rotaId: 'cp',
                ordem: 1,
                nome: titulo,
                tipo: 'PERICIA' as const,
                latitude: lat,
                longitude: lng,
                endereco: endereco ?? '',
              }],
            }]}
          />
        </div>
      )}

      {/* Endereço + CTAs de navegação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 truncate">{titulo}</p>
            {endereco && (
              <p className="text-[12px] text-slate-500 truncate">{endereco}</p>
            )}
            {!hasCoords && endereco && (
              <p className="text-[10px] text-amber-600 mt-0.5">Localização não geocodificada — use os apps abaixo</p>
            )}
          </div>
        </div>
        {(gmaps || waze) && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {gmaps && (
              <a
                href={gmaps}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:border-slate-900 hover:bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all"
              >
                <Navigation className="h-3 w-3" />
                Google Maps
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
            {waze && (
              <a
                href={waze}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:border-slate-900 hover:bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all"
              >
                <Navigation className="h-3 w-3" />
                Waze
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

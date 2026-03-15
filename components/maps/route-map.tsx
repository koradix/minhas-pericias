'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, LayerGroup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PontoRota } from '@/lib/types/rotas'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROUTE_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']

function markerIcon(label: string, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-family:system-ui,sans-serif">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

// ─── FitBounds ────────────────────────────────────────────────────────────────

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (fitted.current || positions.length === 0) return
    fitted.current = true
    if (positions.length === 1) {
      map.setView(positions[0], 14)
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [48, 48] })
    }
  })

  return null
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteMapRoute {
  id: string
  pontos: PontoRota[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RouteMap({ routes }: { routes: RouteMapRoute[] }) {
  const allPositions = routes.flatMap((r) =>
    r.pontos.map((p) => [p.latitude, p.longitude] as [number, number])
  )

  const center: [number, number] = allPositions[0] ?? [-23.5505, -46.6333]

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      />

      {routes.map((route, routeIdx) => {
        const color = ROUTE_COLORS[routeIdx % ROUTE_COLORS.length]
        const sorted = [...route.pontos].sort((a, b) => a.ordem - b.ordem)
        const positions = sorted.map((p) => [p.latitude, p.longitude] as [number, number])

        return (
          <LayerGroup key={route.id}>
            {positions.length >= 2 && (
              <Polyline positions={positions} color={color} weight={3} opacity={0.8} />
            )}
            {sorted.map((ponto) => (
              <Marker
                key={ponto.id}
                position={[ponto.latitude, ponto.longitude]}
                icon={markerIcon(String(ponto.ordem), color)}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{ponto.nome}</p>
                    {ponto.endereco && (
                      <p style={{ color: '#64748b', fontSize: 11 }}>{ponto.endereco}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        )
      })}

      <FitBounds positions={allPositions} />
    </MapContainer>
  )
}

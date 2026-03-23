'use client'

import dynamic from 'next/dynamic'
import type { RouteMapRoute } from './route-map'

const RouteMap = dynamic(() => import('./route-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
        <p className="text-xs">Carregando mapa...</p>
      </div>
    </div>
  ),
})

export type { RouteMapRoute }
export default RouteMap

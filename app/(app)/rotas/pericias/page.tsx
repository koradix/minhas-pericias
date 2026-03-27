import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import RouteMapDynamic from '@/components/maps/route-map-dynamic'
import { RotasPericiasListClient } from '@/components/rotas/rotas-pericias-list'
import { getRotasPericiasByPerito } from '@/lib/data/rotas'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Rotas de Péricias' }

export default async function RotasPericiasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const todasRotas = await getRotasPericiasByPerito(session.user.id).catch(() => [])
  const rotas = todasRotas.filter((r) => r.tipo === 'PERICIA')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rotas de Péricias"
        description="Roteiros para vistorias, diligências e coleta de documentos"
        actions={
          <Link href="/rotas/nova?tipo=PERICIA">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Nova Rota
            </Button>
          </Link>
        }
      />

      {/* Mapa */}
      <div className="isolate h-[360px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <RouteMapDynamic
          routes={rotas.map((r) => ({ id: r.id, pontos: r.pontos }))}
        />
      </div>

      {/* Route cards */}
      {rotas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Nenhuma rota criada</p>
          <p className="mt-1 text-xs text-slate-400">Crie uma nova rota para organizar suas visitas e perícias.</p>
          <Link href="/rotas/nova?tipo=PERICIA" className="mt-4">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Nova Rota
            </Button>
          </Link>
        </div>
      ) : (
        <RotasPericiasListClient rotas={rotas} />
      )}
    </div>
  )
}

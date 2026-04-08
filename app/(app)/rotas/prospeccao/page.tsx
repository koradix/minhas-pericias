import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, ChevronRight } from 'lucide-react'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { RotasProspeccaoListClient } from '@/components/rotas/rotas-prospeccao-list'
import { getRotasPericiasByPerito } from '@/lib/data/rotas'
import RouteMapDynamic from '@/components/maps/route-map-dynamic'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Rotas de Prospecção' }

export default async function RotasProspeccaoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const todasRotas = await getRotasPericiasByPerito(session.user.id).catch(() => [])
  const rotas = todasRotas.filter((r) => r.tipo === 'PROSPECCAO')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rotas de Prospecção"
        description="Roteiros para visitar fóruns e varas cíveis"
        actions={
          <Link href="/rotas/prospeccao/nova">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Nova Rota
            </Button>
          </Link>
        }
      />

      {rotas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Nenhuma rota de prospecção criada</p>
          <p className="mt-1 text-xs text-slate-400">Crie uma rota para organizar visitas a varas e fóruns.</p>
          <Link href="/rotas/prospeccao/nova" className="mt-4">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Nova Rota
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Mapa */}
          <div className="isolate h-[380px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <RouteMapDynamic
              routes={rotas.map((r) => ({ id: r.id, pontos: r.pontos }))}
            />
          </div>

          <RotasProspeccaoListClient rotas={rotas} />

          <div className="text-center">
            <Link href="/rotas/historico">
              <Button variant="outline" size="sm">
                Ver histórico completo <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
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

  const rotas = await getRotasPericiasByPerito(session.user.id)

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

      {rotas.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Nenhuma rota de perícia</p>
            <p className="text-xs text-slate-400 mt-1">Crie uma rota para planejar suas vistorias e diligências</p>
          </div>
          <Link href="/rotas/nova?tipo=PERICIA">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Criar primeira rota
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Mapa real */}
          <div className="isolate h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <RouteMapDynamic
              routes={rotas.map((r) => ({ id: r.id, pontos: r.pontos }))}
            />
          </div>

          {/* Route cards */}
          <RotasPericiasListClient rotas={rotas} />
        </>
      )}
    </div>
  )
}

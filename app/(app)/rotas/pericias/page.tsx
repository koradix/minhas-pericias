import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { RotasPericiasListClient } from '@/components/rotas/rotas-pericias-list'
import { RotasProspeccaoListClient } from '@/components/rotas/rotas-prospeccao-list'
import { getRotasPericiasByPerito } from '@/lib/data/rotas'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Rotas e Vistorias' }

export default async function RotasPericiasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const todasRotas = await getRotasPericiasByPerito(session.user.id).catch(() => [])
  const rotasVistoria    = todasRotas.filter((r) => r.tipo === 'PERICIA')
  const rotasProspeccao  = todasRotas.filter((r) => r.tipo === 'PROSPECCAO')

  return (
    <div className="space-y-8">
      <PageHeader
        title="Rotas e Vistorias"
        description="Roteiros de vistorias e prospecção de varas"
      />

      {/* ── Prospecção ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Rotas de Prospecção</h2>
            <p className="text-xs text-slate-400 mt-0.5">Visitas a fóruns e varas cíveis</p>
          </div>
          <Link href="/rotas/prospeccao/nova">
            <Button size="sm" variant="outline">
              <Plus className="h-3.5 w-3.5" />
              Nova Rota
            </Button>
          </Link>
        </div>

        {rotasProspeccao.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center">
            <p className="text-sm font-semibold text-slate-600">Nenhuma rota de prospecção criada</p>
            <p className="mt-1 text-xs text-slate-400">Crie rotas para visitar varas e fóruns do TJRJ.</p>
            <Link href="/rotas/prospeccao/nova" className="mt-4">
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" />
                Nova Rota de Prospecção
              </Button>
            </Link>
          </div>
        ) : (
          <RotasProspeccaoListClient rotas={rotasProspeccao} />
        )}
      </section>

      <div className="h-px bg-slate-100" />

      {/* ── Vistorias ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Rotas de Vistoria</h2>
            <p className="text-xs text-slate-400 mt-0.5">Diligências e coleta de documentos em perícias</p>
          </div>
          <Link href="/rotas/nova">
            <Button size="sm" variant="outline">
              <Plus className="h-3.5 w-3.5" />
              Nova Rota
            </Button>
          </Link>
        </div>

        {rotasVistoria.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center">
            <p className="text-sm font-semibold text-slate-600">Nenhuma rota de vistoria criada</p>
            <p className="mt-1 text-xs text-slate-400">Adicione endereço nas suas perícias para montar rotas.</p>
            <Link href="/rotas/nova" className="mt-4">
              <Button size="sm" variant="outline">
                <Plus className="h-3.5 w-3.5" />
                Nova Rota de Vistoria
              </Button>
            </Link>
          </div>
        ) : (
          <RotasPericiasListClient rotas={rotasVistoria} />
        )}
      </section>
    </div>
  )
}

import Link from 'next/link'
import { ChevronRight, Plus, FileText, Landmark } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Visitas e Rotas' }

export default function RotasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitas e Rotas"
        description="Planejamento de rotas de prospecção e vistorias de perícias"
        actions={
          <Link href="/rotas/prospeccao">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Nova Rota
            </Button>
          </Link>
        }
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/rotas/prospeccao"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md hover:border-violet-200 transition-all group"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 group-hover:bg-violet-100 transition-colors">
            <Landmark className="h-6 w-6 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Rotas de Prospecção</p>
            <p className="text-xs text-slate-500 mt-0.5">Fóruns, varas cíveis e escritórios</p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-slate-300 group-hover:text-violet-400 transition-colors" />
        </Link>

        <Link
          href="/rotas/pericias"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md hover:border-emerald-200 transition-all group"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
            <FileText className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Rotas de Perícias</p>
            <p className="text-xs text-slate-500 mt-0.5">Vistorias e diligências agendadas</p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
        </Link>
      </div>
    </div>
  )
}

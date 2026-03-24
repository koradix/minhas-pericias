import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings, ChevronRight, RefreshCw } from 'lucide-react'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { VarasManager } from '@/components/varas/varas-manager'
import { getMinhasVaras } from '@/lib/actions/varas-manage'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gerenciar Varas' }

export default async function ConfigVarasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const varas = await getMinhasVaras()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/configuracoes" className="hover:text-slate-600 transition-colors flex items-center gap-1">
          <Settings className="h-3 w-3" />
          Configurações
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600 font-medium">Varas</span>
      </div>

      <PageHeader
        title="Gerenciar Varas"
        description="Cadastro e endereços das varas monitoradas no seu radar"
        actions={
          <Link href="/nomeacoes/varas">
            <Button size="sm" variant="outline" className="gap-1.5 border-slate-200 text-slate-600">
              <RefreshCw className="h-3.5 w-3.5" />
              Ver ranking
            </Button>
          </Link>
        }
      />

      <VarasManager varas={varas} />
    </div>
  )
}

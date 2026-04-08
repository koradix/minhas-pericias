import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { getVarasPublicas } from '@/lib/data/prospeccao'
import { NovaRotaProspeccaoForm } from '@/components/rotas/nova-rota-prospeccao-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nova Rota de Prospecção' }

export default async function NovaRotaProspeccaoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const varas = await getVarasPublicas({ uf: 'RJ' })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Rota de Prospecção"
        description="Selecione as varas para montar o roteiro de prospecção"
        actions={
          <Link href="/rotas/prospeccao">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Button>
          </Link>
        }
      />
      <NovaRotaProspeccaoForm varas={varas} />
    </div>
  )
}

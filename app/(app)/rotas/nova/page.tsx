import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { NovaRotaForm } from '@/components/rotas/nova-rota-form'
import { getVarasParaEstados, agruparVarasPorTribunal } from '@/lib/data/varas-catalog'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nova Rota de Prospecção' }

export default async function NovaRotaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const perfil = await prisma.peritoPerfil.findUnique({
    where: { userId: session.user.id },
    select: { estados: true },
  })

  const estados: string[] = JSON.parse(perfil?.estados ?? '[]')
  const varas = getVarasParaEstados(estados)
  const grupos = agruparVarasPorTribunal(varas)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Rota de Prospecção"
        description={
          estados.length > 0
            ? `Varas disponíveis em: ${estados.join(', ')}`
            : 'Mostrando todos os locais disponíveis'
        }
        actions={
          <Link href="/rotas/prospeccao">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Button>
          </Link>
        }
      />

      <NovaRotaForm varas={varas} grupos={grupos} />
    </div>
  )
}

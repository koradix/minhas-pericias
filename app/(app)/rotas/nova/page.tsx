import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { NovaRotaForm } from '@/components/rotas/nova-rota-form'
import type { VaraCatalog } from '@/lib/data/varas-catalog'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nova Rota de Vistorias' }

export default async function NovaRotaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Pericias reais com endereço + coordenadas
  const pericias = await prisma.pericia.findMany({
    where: {
      peritoId: session.user.id,
      NOT: { endereco: null },
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true, numero: true, assunto: true, tipo: true,
      vara: true, endereco: true, latitude: true, longitude: true,
    },
    orderBy: { criadoEm: 'desc' },
  })

  const varas: VaraCatalog[] = pericias.map((p) => ({
    id: p.id,
    nome: `${p.numero} — ${p.assunto}`,
    tribunal: p.vara ?? 'TJRJ',
    tipo: 'PERICIA' as const,
    endereco: p.endereco!,
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    latitude: p.latitude!,
    longitude: p.longitude!,
  }))

  // Agrupado por vara/comarca
  const grupos: Record<string, VaraCatalog[]> = {}
  for (const v of varas) {
    const key = v.tribunal || 'Outras'
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(v)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Rota de Vistorias"
        description="Selecione as perícias com endereço para montar o roteiro"
        actions={
          <Link href="/rotas/pericias">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Button>
          </Link>
        }
      />

      {varas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">Nenhuma perícia com endereço encontrada</p>
          <p className="text-xs text-slate-400">Adicione o endereço e coordenadas nas suas perícias para montar rotas de vistoria.</p>
          <Link href="/pericias">
            <Button size="sm" variant="outline">Ver perícias</Button>
          </Link>
        </div>
      ) : (
        <NovaRotaForm varas={varas} grupos={grupos} />
      )}
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import ParceiroForm from '@/components/parceiros/parceiro-form'
import { getParceiroById } from '@/lib/data/parceiros'
import { updateParceiro } from '@/lib/actions/parceiros'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const parceiro = await getParceiroById(id)
  return { title: parceiro ? `Editar — ${parceiro.nome}` : 'Editar Parceiro' }
}

export default async function EditarParceiroPage({ params }: Props) {
  const { id } = await params
  const parceiro = await getParceiroById(id)

  if (!parceiro) notFound()

  const action = updateParceiro.bind(null, parceiro.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/parceiros" className="hover:text-slate-600 transition-colors">Parceiros</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/parceiros/${parceiro.id}`} className="hover:text-slate-600 transition-colors truncate max-w-xs">
          {parceiro.nome}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600">Editar</span>
      </div>

      <PageHeader title="Editar Parceiro" description={parceiro.nome} />
      <ParceiroForm
        action={action}
        initialData={parceiro}
        cancelHref={`/parceiros/${parceiro.id}`}
      />
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import ParceiroForm from '@/components/parceiros/parceiro-form'
import { createParceiro } from '@/lib/actions/parceiros'

export const metadata: Metadata = { title: 'Novo Parceiro' }

export default function NovoParceiro() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/parceiros" className="hover:text-slate-600 transition-colors">Parceiros</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600">Novo</span>
      </div>
      <PageHeader title="Novo Parceiro" description="Cadastre um advogado, escritório, seguradora ou empresa parceira" />
      <ParceiroForm action={createParceiro} />
    </div>
  )
}

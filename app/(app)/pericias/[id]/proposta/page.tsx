import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Eye } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { pericias } from '@/lib/mocks/pericias'
import { getPropostaByPericia } from '@/lib/data/propostas-honorarios'
import { PropostaHonorariosForm } from '@/components/pericias/proposta-honorarios-form'
import { PropostaStatusBadge } from '@/components/pericias/proposta-status-btn'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const p = pericias.find((x) => x.id === Number(id))
  return { title: p ? `Proposta de Honorários — ${p.numero}` : 'Proposta' }
}

export default async function PropostaHonorariosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) notFound()

  const p = pericias.find((x) => x.id === Number(id))
  if (!p) notFound()

  const [draft, perfil] = await Promise.all([
    getPropostaByPericia(String(p.id), userId),
    prisma.peritoPerfil.findUnique({ where: { userId }, select: { formacao: true } }),
  ])

  const peritoNomeDefault = session.user?.name ?? ''
  const peritoQualDefault = perfil?.formacao ?? ''

  return (
    <div className="space-y-6 pb-10 max-w-2xl mx-auto">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/pericias" className="hover:text-slate-700 transition-colors">
          Perícias
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/pericias/${p.id}`} className="hover:text-slate-700 transition-colors">
          {p.numero}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600 font-medium">Proposta de Honorários</span>
      </div>

      {/* ── Page heading ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href={`/pericias/${p.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Proposta de Honorários</h1>
          <p className="text-xs text-slate-400">
            {draft ? 'Rascunho salvo · edite e salve novamente para atualizar' : 'Preencha os campos e salve como rascunho'}
          </p>
        </div>
        {draft && (
          <div className="ml-auto flex items-center gap-2">
            <PropostaStatusBadge status={draft.status} />
            <Link
              href={`/pericias/${p.id}/proposta/preview`}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs px-3 py-1.5 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              Visualizar
            </Link>
          </div>
        )}
      </div>

      {/* ── Form ───────────────────────────────────────────────────────────── */}
      <PropostaHonorariosForm
        pericia={p}
        draft={draft}
        peritoNomeDefault={peritoNomeDefault}
        peritoQualDefault={peritoQualDefault}
      />

    </div>
  )
}

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NomeacaoPropostaForm } from '@/components/nomeacoes/nomeacao-proposta-form'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const n = await prisma.nomeacao.findUnique({ where: { id }, include: { processo: true } })
    if (n) return { title: `Proposta de Honorários — ${n.processo.numeroProcesso}` }
  } catch {}
  return { title: 'Proposta de Honorários' }
}

export default async function NomeacaoPropostaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const nomeacao = await prisma.nomeacao.findUnique({
    where: { id },
    include: { processo: true },
  }).catch(() => null)

  if (!nomeacao || nomeacao.peritoId !== userId) notFound()

  const perfil = await prisma.peritoPerfil.findUnique({
    where: { userId },
    select: { formacao: true },
  }).catch(() => null)

  // Parse extracted data to pre-fill form
  let dadosExtracted: Record<string, unknown> = {}
  if (nomeacao.extractedData) {
    try { dadosExtracted = JSON.parse(nomeacao.extractedData) as Record<string, unknown> } catch {}
  }
  if (!Object.keys(dadosExtracted).length && nomeacao.processSummary) {
    try { dadosExtracted = JSON.parse(nomeacao.processSummary) as Record<string, unknown> } catch {}
  }

  const partes: { nome: string; tipo: string }[] = (() => {
    try { return JSON.parse(nomeacao.processo.partes ?? '[]') } catch { return [] }
  })()
  const autor = partes.find((p) => p.tipo === 'Autor')?.nome ?? ''

  const processoData = {
    nomeacaoId:      nomeacao.id,
    numeroProcesso:  nomeacao.processo.numeroProcesso,
    tribunal:        nomeacao.processo.tribunal,
    vara:            nomeacao.processo.orgaoJulgador ?? '',
    assunto:         nomeacao.processo.assunto ?? '',
    autor,
    tipoPericia:     (dadosExtracted.tipoPericia as string | null) ?? '',
    quesitos:        (dadosExtracted.quesitos as string[] | null) ?? [],
    endereco:        (dadosExtracted.endereco as string | null) ?? '',
  }

  return (
    <div className="space-y-6 pb-10 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/nomeacoes" className="hover:text-slate-700 transition-colors">Nomeações</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/nomeacoes/${id}`} className="hover:text-slate-700 transition-colors font-mono truncate max-w-[120px]">
          {nomeacao.processo.numeroProcesso}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600 font-medium">Proposta de Honorários</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/nomeacoes/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Proposta de Honorários</h1>
          <p className="text-xs text-slate-400">Gere com IA ou carregue seu modelo DOCX</p>
        </div>
      </div>

      <NomeacaoPropostaForm
        processo={processoData}
        peritoNomeDefault={session.user?.name ?? ''}
        peritoQualDefault={perfil?.formacao ?? ''}
      />
    </div>
  )
}

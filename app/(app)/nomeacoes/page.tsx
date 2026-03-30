export const maxDuration = 60

import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { getNomeacoesByPerito } from '@/lib/data/nomeacoes-datajud'
import { getCitacoes } from '@/lib/data/nomeacoes'
import { RadarBuscarBtn } from '@/components/nomeacoes/radar-buscar-btn'
import { NomeacaoCard } from '@/components/nomeacoes/nomeacao-card'
import { ArquivadosCollapse } from '@/components/nomeacoes/arquivados-collapse'
import { CitacoesList } from '@/components/nomeacoes/citacoes-list'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nomeações' }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NomeacoesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [peritoPerfil, radarConfig, citacoes, todas] = await Promise.all([
    prisma.peritoPerfil.findUnique({ where: { userId } }).catch(() => null),
    prisma.radarConfig.findUnique({ where: { peritoId: userId }, select: { monitoramentoExtId: true } }).catch(() => null),
    getCitacoes(userId).catch(() => []),
    getNomeacoesByPerito(userId).catch(() => []),
  ])
  const siglas: string[] = JSON.parse(peritoPerfil?.tribunais ?? '[]')
  const radarConfigurado = !!radarConfig?.monitoramentoExtId

  const ativos    = todas.filter((n) => n.status !== 'arquivado')
  const arquivados = todas.filter((n) => n.status === 'arquivado')

  return (
    <div className="space-y-6">

      {/* Header */}
      <PageHeader
        title="Nomeações"
        description="Citações nos diários e nomeações recebidas"
      />

      {/* CTA — buscar + registrar manualmente */}
      <RadarBuscarBtn novas={0} siglas={siglas} radarConfigurado={radarConfigurado} />

      {/* Citações do Escavador */}
      {citacoes.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {citacoes.length} citaç{citacoes.length > 1 ? 'ões' : 'ão'} nos diários
          </p>
          <CitacoesList citacoes={citacoes} />
        </div>
      )}

      {/* Lista de processos ativos */}
      <div className="space-y-3">
        {ativos.length > 0 && (
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {ativos.length} processo{ativos.length > 1 ? 's' : ''} registrado{ativos.length > 1 ? 's' : ''}
          </p>
        )}

        {ativos.length > 0 ? (
          <div className="space-y-3">
            {ativos.map((n) => (
              <NomeacaoCard key={n.id} nomeacao={n} />
            ))}
          </div>
        ) : citacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200">
              <Plus className="h-5 w-5 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">Nenhum processo registrado</p>
              <p className="text-xs text-slate-400 mt-1">
                Clique em &ldquo;Registrar processo&rdquo; para adicionar o documento da nomeação
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Arquivados — colapsável */}
      {arquivados.length > 0 && (
        <ArquivadosCollapse nomeacoes={arquivados} />
      )}

    </div>
  )
}

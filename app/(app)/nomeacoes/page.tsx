export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { getNomeacoesByPerito } from '@/lib/data/nomeacoes-datajud'
import { getCitacoes } from '@/lib/data/nomeacoes'
import { SearchProviderSwitch } from '@/components/nomeacoes/search-provider-switch'
import { NomeacaoCard } from '@/components/nomeacoes/nomeacao-card'
import { ArquivadosCollapse } from '@/components/nomeacoes/arquivados-collapse'
import { CitacoesList } from '@/components/nomeacoes/citacoes-list'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nomeações' }

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NomeacoesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [peritoPerfil, radarConfig, citacoes, todas] = await Promise.all([
    prisma.peritoPerfil.findUnique({ where: { userId } }).catch((e) => {
      console.error('[Nomeacoes] peritoPerfil:', e?.message)
      return null
    }),
    prisma.radarConfig.findUnique({ where: { peritoId: userId }, select: { monitoramentoExtId: true } }).catch((e) => {
      console.error('[Nomeacoes] radarConfig:', e?.message)
      return null
    }),
    getCitacoes(userId).catch((e) => {
      console.error('[Nomeacoes] getCitacoes:', e?.message)
      return []
    }),
    getNomeacoesByPerito(userId).catch((e) => {
      console.error('[Nomeacoes] getNomeacoesByPerito:', e?.message)
      return []
    }),
  ])

  const siglas: string[] = safeJsonParse(peritoPerfil?.tribunais, [])
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

      {/* CTA — provedor escolhido pelo usuario em /integracoes */}
      <SearchProviderSwitch
        cpf={peritoPerfil?.cpf ?? null}
        siglas={siglas}
        radarConfigurado={radarConfigurado}
      />

      {/* Citações do Escavador */}
      {citacoes.length > 0 && (
        <div className="space-y-4">
          <p className="text-[12px] font-inter font-semibold uppercase tracking-[0.08em] text-[#6b7280]">
            {citacoes.length} citaç{citacoes.length > 1 ? 'ões' : 'ão'} nos diários
          </p>
          <CitacoesList citacoes={citacoes} />
        </div>
      )}

      {/* Lista de processos ativos */}
      <div className="space-y-5 mt-2">
        {ativos.length > 0 && (
          <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
            {ativos.length} processo{ativos.length > 1 ? 's' : ''} registrado{ativos.length > 1 ? 's' : ''}
          </p>
        )}

        {ativos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
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

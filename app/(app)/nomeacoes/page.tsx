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

      {/* Nomeações confirmadas (V2 — busca por CPF) */}
      {(() => {
        const nomeacoesList = citacoes.filter((c) => c.fonte === 'v2_tribunal')
        return nomeacoesList.length > 0 ? (
          <div className="space-y-4">
            <p className="text-[12px] font-inter font-semibold uppercase tracking-[0.08em] text-[#6b7280]">
              {nomeacoesList.length} nomeaç{nomeacoesList.length > 1 ? 'ões' : 'ão'} confirmada{nomeacoesList.length > 1 ? 's' : ''}
            </p>
            <CitacoesList citacoes={nomeacoesList} />
          </div>
        ) : null
      })()}

      {/* Citações nos diários (V1 DJE) */}
      {(() => {
        const citacoesDje = citacoes.filter((c) => c.fonte !== 'v2_tribunal')
        return citacoesDje.length > 0 ? (
          <div className="space-y-4">
            <p className="text-[12px] font-inter font-semibold uppercase tracking-[0.08em] text-[#6b7280]">
              {citacoesDje.length} citaç{citacoesDje.length > 1 ? 'ões' : 'ão'} nos diários
            </p>
            <CitacoesList citacoes={citacoesDje} showCriarPericia={false} />
          </div>
        ) : null
      })()}

      {/* Fluxo antigo (DataJud) — oculto no MVP */}

    </div>
  )
}

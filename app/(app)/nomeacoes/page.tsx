export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { getCitacoes } from '@/lib/data/nomeacoes'
import { SearchProviderSwitch } from '@/components/nomeacoes/search-provider-switch'
import { CitacoesList } from '@/components/nomeacoes/citacoes-list'
import { dedupCitacoes, separarGrupos } from '@/lib/utils/citacao-dedup'
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

  const [peritoPerfil, radarConfig, citacoes] = await Promise.all([
    prisma.peritoPerfil.findUnique({ where: { userId } }).catch((e: Error) => {
      console.error('[Nomeacoes] peritoPerfil:', e?.message)
      return null
    }),
    prisma.radarConfig.findUnique({ where: { peritoId: userId }, select: { monitoramentoExtId: true } }).catch((e: Error) => {
      console.error('[Nomeacoes] radarConfig:', e?.message)
      return null
    }),
    getCitacoes(userId).catch((e: Error) => {
      console.error('[Nomeacoes] getCitacoes:', e?.message)
      return []
    }),
  ])

  const siglas: string[] = safeJsonParse(peritoPerfil?.tribunais, [])
  const radarConfigurado = !!radarConfig?.monitoramentoExtId

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

      {(() => {
        // Dedup inteligente: agrupa duplicatas e mantém a de MAIOR FORÇA
        // v2_tribunal > v1_email_dj > escavador > manual
        const nomePerito = session.user.name ?? ''
        const grupos = dedupCitacoes(citacoes, nomePerito)
        const { confirmadas, diarioOficial } = separarGrupos(grupos)

        const todasCitacoes = [
          ...confirmadas.map(g => g.principal),
          ...diarioOficial.map(g => g.principal),
        ]

        if (todasCitacoes.length === 0) return null

        return (
          <CitacoesList citacoes={todasCitacoes} showCriarPericia={true} showBadgeFonte={true} />
        )
      })()}

    </div>
  )
}

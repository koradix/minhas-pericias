export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { getCitacoes } from '@/lib/data/nomeacoes'
import { SearchProviderSwitch } from '@/components/nomeacoes/search-provider-switch'
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
        // ─── Classificação + Dedup cross-fonte por CNJ ─────────────────────
        // Regra: V2 (tribunal cadastrado) tem prioridade.
        // Se um CNJ já aparece na V2, NÃO mostra ele na seção de DJ.
        const nomeacoesConfirmadas = citacoes.filter((c) => c.fonte === 'v2_tribunal')
        const cnjsV2 = new Set(
          nomeacoesConfirmadas.map((c) => c.numeroProcesso).filter(Boolean) as string[]
        )

        // Tudo que não é V2 entra em "Publicações no DJ" — desde que o CNJ não esteja na V2
        const publicacoesDJ = citacoes.filter((c) => {
          if (c.fonte === 'v2_tribunal') return false
          if (c.numeroProcesso && cnjsV2.has(c.numeroProcesso)) return false // dedup
          return true
        })

        return (
          <>
            {/* ━━━━━━━━━━━━━━━━━━━━ NOMEAÇÕES CONFIRMADAS (V2) ━━━━━━━━━━━━━━━━━━ */}
            {nomeacoesConfirmadas.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-[#a3e635] pl-4 py-2">
                  <div>
                    <p className="text-[14px] font-inter font-black uppercase tracking-[0.08em] text-slate-900">
                      ✅ {nomeacoesConfirmadas.length} nomeaç{nomeacoesConfirmadas.length > 1 ? 'ões' : 'ão'} confirmada{nomeacoesConfirmadas.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Processo cadastrado no tribunal · documentos disponíveis para download
                    </p>
                  </div>
                </div>
                <CitacoesList citacoes={nomeacoesConfirmadas} showBadgeFonte={true} />
              </div>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━ PUBLICAÇÕES NO DIÁRIO OFICIAL ━━━━━━━━━━━━━━ */}
            {publicacoesDJ.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-amber-400 pl-4 py-2">
                  <div>
                    <p className="text-[14px] font-inter font-black uppercase tracking-[0.08em] text-slate-900">
                      📰 {publicacoesDJ.length} publicaç{publicacoesDJ.length > 1 ? 'ões' : 'ão'} no Diário Oficial
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Nomeação publicada · documentos ainda não estão disponíveis · você pode criar a perícia manualmente
                    </p>
                  </div>
                </div>
                <CitacoesList citacoes={publicacoesDJ} showCriarPericia={true} showBadgeFonte={false} />
              </div>
            )}
          </>
        )
      })()}

    </div>
  )
}

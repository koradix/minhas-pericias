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

      {/* ━━━━━━━━━━━━━━━━━━━━━━ NOMEAÇÕES CONFIRMADAS (V2) ━━━━━━━━━━━━━━━━━━━━━━
          Processo já cadastrado no tribunal. Documentos disponíveis para download. */}
      {(() => {
        const nomeacoesList = citacoes.filter((c) => c.fonte === 'v2_tribunal')
        return nomeacoesList.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-l-4 border-[#a3e635] pl-4 py-2">
              <div>
                <p className="text-[14px] font-inter font-black uppercase tracking-[0.08em] text-slate-900">
                  ✅ {nomeacoesList.length} nomeaç{nomeacoesList.length > 1 ? 'ões' : 'ão'} confirmada{nomeacoesList.length > 1 ? 's' : ''}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Processo cadastrado no tribunal · documentos disponíveis para download
                </p>
              </div>
            </div>
            <CitacoesList citacoes={nomeacoesList} />
          </div>
        ) : null
      })()}

      {/* ━━━━━━━━━━━━━━━━━━━━━━ PUBLICAÇÕES NO DIÁRIO OFICIAL ━━━━━━━━━━━━━━━━━━━━
          Achado no DJ mas processo não cadastrado ainda.
          Pode criar perícia manualmente, mas documentos NÃO estão disponíveis ainda. */}
      {(() => {
        const djList = citacoes.filter((c) => c.fonte === 'v1_email_dj' || c.fonte === 'escavador')
        return djList.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-l-4 border-amber-400 pl-4 py-2">
              <div>
                <p className="text-[14px] font-inter font-black uppercase tracking-[0.08em] text-slate-900">
                  📰 {djList.length} publicaç{djList.length > 1 ? 'ões' : 'ão'} no Diário Oficial
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Nomeação publicada · <span className="text-amber-700 font-semibold">documentos ainda não disponíveis</span> — tribunal não atualizou o processo
                </p>
              </div>
            </div>
            <CitacoesList citacoes={djList} showCriarPericia={true} />
          </div>
        ) : null
      })()}

      {/* Outras fontes (manual etc) */}
      {(() => {
        const outros = citacoes.filter((c) =>
          c.fonte !== 'v2_tribunal' && c.fonte !== 'v1_email_dj' && c.fonte !== 'escavador'
        )
        return outros.length > 0 ? (
          <div className="space-y-4">
            <p className="text-[12px] font-inter font-semibold uppercase tracking-[0.08em] text-slate-500">
              {outros.length} outra{outros.length > 1 ? 's' : ''} citaç{outros.length > 1 ? 'ões' : 'ão'}
            </p>
            <CitacoesList citacoes={outros} showCriarPericia={false} />
          </div>
        ) : null
      })()}

    </div>
  )
}

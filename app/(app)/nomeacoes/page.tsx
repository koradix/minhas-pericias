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
        // ─── Dedup inteligente por CNJ + comparação de partes ─────────────
        // Agrupa duplicatas, mantém a de MAIOR FORÇA como principal:
        //   v2_tribunal > v1_email_dj > escavador (V1 DJE nome) > manual
        // Match: CNJ normalizado, OU (quando sem CNJ) partes do snippet
        const nomePerito = session.user.name ?? ''
        const grupos = dedupCitacoes(citacoes, nomePerito)
        const { confirmadas, diarioOficial } = separarGrupos(grupos)

        const confirmadasCitacoes = confirmadas.map(g => g.principal)
        const diarioOficialCitacoes = diarioOficial.map(g => g.principal)

        return (
          <>
            {/* ━━━━━━━━━━━━━━━━━━━━ NOMEAÇÕES CONFIRMADAS (V2) ━━━━━━━━━━━━━━━━━━ */}
            {confirmadasCitacoes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-[#a3e635] pl-4 py-2">
                  <div>
                    <p className="text-[14px] font-inter font-black uppercase tracking-[0.08em] text-slate-900">
                      ✅ {confirmadasCitacoes.length} nomeaç{confirmadasCitacoes.length > 1 ? 'ões' : 'ão'} confirmada{confirmadasCitacoes.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Processo cadastrado no tribunal · documentos disponíveis para download
                    </p>
                  </div>
                </div>
                <CitacoesList citacoes={confirmadasCitacoes} showBadgeFonte={true} />
              </div>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━ PUBLICAÇÕES NO DIÁRIO OFICIAL ━━━━━━━━━━━━━━ */}
            {diarioOficialCitacoes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-amber-400 pl-4 py-2">
                  <div>
                    <p className="text-[14px] font-inter font-black uppercase tracking-[0.08em] text-slate-900">
                      📰 {diarioOficialCitacoes.length} publicaç{diarioOficialCitacoes.length > 1 ? 'ões' : 'ão'} no Diário Oficial
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Nomeação publicada · documentos ainda não estão disponíveis · você pode criar a perícia manualmente
                    </p>
                  </div>
                </div>
                <CitacoesList citacoes={diarioOficialCitacoes} showCriarPericia={true} showBadgeFonte={true} />
              </div>
            )}
          </>
        )
      })()}

    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Radar,
  FileText,
  BellDot,
  Clock,
  Star,
  ChevronRight,
  AlertCircle,
  Building2,
  Users,
  Zap,
  SearchX,
} from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { tipoCor, TRIBUNAIS_POR_ESTADO } from '@/lib/constants/tribunais'
import { getRadarConfig, getCitacoes } from '@/lib/data/nomeacoes'
import { getKpisDataJud, getNomeacoesByPerito } from '@/lib/data/nomeacoes-datajud'
import { getDataJudAlias } from '@/lib/constants/datajud-tribunais'
import { RadarBuscarBtn } from '@/components/nomeacoes/radar-buscar-btn'
import { NomeacaoCard } from '@/components/nomeacoes/nomeacao-card'
import { CitacoesList } from '@/components/nomeacoes/citacoes-list'
import type { CitacaoSerializada } from '@/lib/data/nomeacoes'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Radar de Nomeações' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUltimaBusca(iso: string | null): string {
  if (!iso) return 'Nunca'
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 60) return `${diffMin}min atrás`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h atrás`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function toISO(d: Date | string | null | undefined): string | null {
  if (!d) return null
  if (d instanceof Date) return d.toISOString()
  return new Date(d as string).toISOString()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NomeacoesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const peritoPerfil = await prisma.peritoPerfil.findUnique({ where: { userId } })
  const siglas: string[] = JSON.parse(peritoPerfil?.tribunais ?? '[]')

  // Split siglas by DataJud support
  const suportados = siglas.filter((s) => getDataJudAlias(s) !== undefined)
  const semSuporte = siglas.filter((s) => getDataJudAlias(s) === undefined)

  // Build enriched tribunal list for display
  const allTribunaisInfo = Object.entries(TRIBUNAIS_POR_ESTADO).flatMap(([uf, ts]) =>
    ts.map((t) => ({ ...t, uf })),
  )
  const suportadosComTipo = suportados.map((sigla) => {
    const info = allTribunaisInfo.find((t) => t.sigla === sigla)
    return {
      sigla,
      nome: info?.nome ?? sigla,
      tipo: (info?.tipo ?? 'estadual') as 'estadual' | 'trabalho' | 'federal' | 'eleitoral',
      uf: info?.uf ?? '',
    }
  })

  const escavadorEnabled = process.env.ESCAVADOR_ENABLED === 'true'

  const [kpis, nomeacoes, radarConfig, citacoes] = await Promise.all([
    getKpisDataJud(userId),
    getNomeacoesByPerito(userId),
    getRadarConfig(userId),
    escavadorEnabled
      ? getCitacoes(userId)
      : Promise.resolve([] as CitacaoSerializada[]),
  ])

  const ultimaBusca = toISO(radarConfig?.ultimaBusca)

  return (
    <div className="space-y-6">

      {/* [1] Header */}
      <PageHeader
        title="Radar de Nomeações"
        description="Monitoramento automático via DataJud (CNJ)"
        actions={
          <Link href="/nomeacoes/estrategia">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Estratégia
            </Button>
          </Link>
        }
      />

      {/* [2] KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Nomeações encontradas"
          value={kpis.total}
          subtitle="Processos compatíveis"
          icon={FileText}
          accent="lime"
          highlight={kpis.total > 0}
        />
        <KPICard
          title="Novas"
          value={kpis.novas}
          subtitle={kpis.novas > 0 ? 'Aguardando revisão' : 'Tudo em dia'}
          icon={BellDot}
          accent={kpis.novas > 0 ? 'amber' : 'slate'}
        />
        <KPICard
          title="Última busca"
          value={formatUltimaBusca(ultimaBusca)}
          subtitle="Atualização manual"
          icon={Clock}
          accent="slate"
        />
        <KPICard
          title="Match excelente"
          value={kpis.excelentes}
          subtitle="Score 75+"
          icon={Star}
          accent={kpis.excelentes > 0 ? 'lime' : 'slate'}
          highlight={kpis.excelentes > 0}
        />
      </div>

      {/* [3] Tribunais monitorados */}
      {siglas.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            Tribunais monitorados via DataJud
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-100 px-1.5 text-[10px] font-bold text-lime-700">
              {suportados.length}
            </span>
          </p>

          <div className="flex flex-wrap gap-2">
            {suportadosComTipo.map((t) => (
              <div
                key={t.sigla}
                title={t.nome}
                className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm"
              >
                <span className="text-xs font-bold text-slate-900">{t.sigla}</span>
                {t.uf && (
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-medium', tipoCor[t.tipo])}>
                    {t.uf}
                  </span>
                )}
              </div>
            ))}
            {suportados.length === 0 && (
              <p className="text-xs text-slate-400">
                Nenhum tribunal compatível com o DataJud.{' '}
                <Link href="/perfil" className="underline hover:no-underline">
                  Adicione tribunais no perfil.
                </Link>
              </p>
            )}
          </div>

          {semSuporte.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700">
                  {semSuporte.length} tribunal(is) sem suporte ao DataJud
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {semSuporte.join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* [4] CTA — buscar nomeações */}
      <div className="rounded-2xl border border-lime-200 bg-lime-50/30 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Radar className="h-4 w-4 text-lime-700" />
          <p className="text-sm font-semibold text-slate-900">Buscar Nomeações</p>
          {kpis.novas > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-500 text-white text-[10px] font-bold px-1.5">
              {kpis.novas}
            </span>
          )}
          <span className="ml-auto text-[11px] text-slate-400">Gratuito · via DataJud CNJ</span>
        </div>
        <RadarBuscarBtn novas={kpis.novas} siglas={siglas} />
      </div>

      {/* [5] Nomeações list */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-900">
          Processos compatíveis
          {nomeacoes.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-400">({nomeacoes.length})</span>
          )}
        </p>

        {nomeacoes.length > 0 ? (
          <div className="space-y-3">
            {nomeacoes.map((n) => (
              <NomeacaoCard key={n.id} nomeacao={n} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12">
            <SearchX className="h-8 w-8 text-slate-300" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">Nenhuma nomeação encontrada</p>
              <p className="text-xs text-slate-400 mt-1">
                Clique em &ldquo;Buscar Nomeações&rdquo; para encontrar processos nos seus tribunais
              </p>
            </div>
          </div>
        )}
      </div>

      {/* [6] Escavador citações — legado, oculto por padrão */}
      {escavadorEnabled && citacoes.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            Citações Escavador
            <span className="ml-2 text-xs font-normal text-slate-400">({citacoes.length})</span>
          </p>
          <CitacoesList citacoes={citacoes} />
        </div>
      )}

      {/* [7] Sub-page links */}
      <SubPagesLinks />
    </div>
  )
}

// ─── Sub-pages row ────────────────────────────────────────────────────────────

function SubPagesLinks() {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {[
        { href: '/nomeacoes/varas',      icon: Building2, title: 'Varas',      desc: 'Ranking por volume de nomeações',   color: 'bg-lime-50 text-lime-600'      },
        { href: '/nomeacoes/juizes',     icon: Users,     title: 'Juízes',     desc: 'Histórico por magistrado',          color: 'bg-slate-100 text-slate-500'   },
        { href: '/nomeacoes/estrategia', icon: Radar,     title: 'Estratégia', desc: 'Gerar rota de prospecção',          color: 'bg-emerald-50 text-emerald-600' },
      ].map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-sm hover:border-slate-300 transition-all group"
          >
            <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', item.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500 truncate">{item.desc}</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors flex-shrink-0" />
          </Link>
        )
      })}
    </div>
  )
}

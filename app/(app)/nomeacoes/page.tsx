import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Radar,
  FileText,
  BellDot,
  Clock,
  Star,
  ChevronRight,
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
import { getRadarConfig, getCitacoes } from '@/lib/data/nomeacoes'
import { getKpisDataJud, getNomeacoesByPerito } from '@/lib/data/nomeacoes-datajud'
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
        description="Monitoramento automático de nomeações nos seus tribunais"
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
          <span className="ml-auto text-[11px] text-slate-400">Gratuito</span>
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

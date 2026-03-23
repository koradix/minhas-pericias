import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Radar,
  FileText,
  BellDot,
  Clock,
  Wallet,
  ChevronRight,
  AlertCircle,
  Building2,
  Users,
  Zap,
} from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { tipoCor, TRIBUNAIS_POR_ESTADO } from '@/lib/constants/tribunais'
import { getRadarConfig, getCitacoes, getKpis, getTribunaisDoRadar } from '@/lib/data/nomeacoes'
import { RadarSetupCard } from '@/components/nomeacoes/radar-setup-card'
import { RadarBuscarBtn } from '@/components/nomeacoes/radar-buscar-btn'
import { CitacoesList } from '@/components/nomeacoes/citacoes-list'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Radar de Nomeações' }

// ─── Helper ───────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NomeacoesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const peritoPerfil = await prisma.peritoPerfil.findUnique({ where: { userId } })
  const siglas: string[] = JSON.parse(peritoPerfil?.tribunais ?? '[]')

  const radarConfig = await getRadarConfig(userId)

  // ── No config → setup screen ──────────────────────────────────────────────
  if (!radarConfig) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Radar de Nomeações"
          description="Monitoramento de citações nos diários oficiais"
        />
        <RadarSetupCard siglas={siglas} />
        <SubPagesLinks />
      </div>
    )
  }

  // ── Config exists → full UI ───────────────────────────────────────────────
  const [kpis, tribunais, citacoes] = await Promise.all([
    getKpis(userId),
    getTribunaisDoRadar(userId),
    getCitacoes(userId),
  ])

  const suportadosComTipo = tribunais.suportados.map((t) => {
    const tipo =
      Object.values(TRIBUNAIS_POR_ESTADO)
        .flat()
        .find((c) => c.sigla === t.sigla)?.tipo ?? 'estadual'
    return { ...t, tipo }
  })

  return (
    <div className="space-y-6">

      {/* [1] Header */}
      <PageHeader
        title="Radar de Nomeações"
        description="Monitoramento de citações nos diários oficiais"
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
          title="Total de citações"
          value={kpis.total}
          subtitle="Encontradas pelo radar"
          icon={FileText}
          accent="lime"
          highlight={kpis.total > 0}
        />
        <KPICard
          title="Não lidas"
          value={kpis.naoLidas}
          subtitle={kpis.naoLidas > 0 ? 'Aguardando revisão' : 'Tudo em dia'}
          icon={BellDot}
          accent={kpis.naoLidas > 0 ? 'amber' : 'slate'}
        />
        <KPICard
          title="Última busca"
          value={formatUltimaBusca(kpis.ultimaBusca)}
          subtitle="Atualização manual"
          icon={Clock}
          accent="slate"
        />
        <KPICard
          title="Saldo Escavador"
          value={
            kpis.saldo !== null
              ? `R$ ${kpis.saldo.toFixed(2).replace('.', ',')}`
              : '—'
          }
          subtitle={
            kpis.saldo !== null && kpis.saldo < 6
              ? 'Saldo baixo — recarregue'
              : 'Créditos disponíveis'
          }
          icon={Wallet}
          accent={kpis.saldo !== null && kpis.saldo < 6 ? 'amber' : 'emerald'}
        />
      </div>

      {/* [3] Tribunais monitorados */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-slate-900">
          Tribunais monitorados
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-100 px-1.5 text-[10px] font-bold text-lime-700">
            {suportadosComTipo.length}
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
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-medium', tipoCor[t.tipo])}>
                {t.uf}
              </span>
            </div>
          ))}
          {suportadosComTipo.length === 0 && (
            <p className="text-xs text-slate-400">Nenhum tribunal com suporte a busca por nome.</p>
          )}
        </div>

        {tribunais.ignorados.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700">
                {tribunais.ignorados.length} tribunal(is) sem suporte a busca por nome
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {tribunais.ignorados.join(', ')} — monitorados via publicação mas não via busca ativa.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* [4] CTA — buscar nomeações (primary action, always above citações) */}
      <div className="rounded-2xl border border-lime-200 bg-lime-50/30 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Radar className="h-4 w-4 text-lime-700" />
          <p className="text-sm font-semibold text-slate-900">Buscar Nomeações</p>
          {kpis.naoLidas > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-500 text-white text-[10px] font-bold px-1.5">
              {kpis.naoLidas}
            </span>
          )}
          <span className="ml-auto text-[11px] text-slate-400">Busca manual · R$ 3,00/chamada</span>
        </div>
        <RadarBuscarBtn naoLidas={kpis.naoLidas} saldoAtual={kpis.saldo} siglas={siglas} />
      </div>

      {/* [5] Citações list */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-900">
          Citações encontradas
          {citacoes.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-400">({citacoes.length})</span>
          )}
        </p>
        <CitacoesList citacoes={citacoes} />
      </div>

      {/* [6] Sub-page links */}
      <SubPagesLinks />
    </div>
  )
}

// ─── Sub-pages row ────────────────────────────────────────────────────────────

function SubPagesLinks() {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {[
        { href: '/nomeacoes/varas',      icon: Building2, title: 'Varas',      desc: 'Ranking por volume de nomeações',  color: 'bg-lime-50 text-lime-600'     },
        { href: '/nomeacoes/juizes',     icon: Users,     title: 'Juízes',     desc: 'Histórico por magistrado',         color: 'bg-slate-100 text-slate-500'  },
        { href: '/nomeacoes/estrategia', icon: Radar,     title: 'Estratégia', desc: 'Gerar rota de prospecção',         color: 'bg-emerald-50 text-emerald-600'},
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

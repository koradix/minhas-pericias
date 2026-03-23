import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FileText,
  TrendingUp,
  ChevronRight,
  MapPin,
  Radar,
  ScrollText,
  Clock,
  Bell,
  Navigation,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/shared/kpi-card'
import { BadgeStatus } from '@/components/shared/badge-status'
import { cn, formatCurrency } from '@/lib/utils'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { OnboardingNudge } from '@/components/perfil/OnboardingNudge'
import { syncTribunaisReais } from '@/lib/actions/perfil'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const periciasAtivas = [
  { id: 1, numero: 'PRC-2024-001', assunto: 'Avaliação de Imóvel Residencial',  vara: '3ª Vara Cível', status: 'em_andamento' as const, prazo: '15/12', diasRestantes: 3  },
  { id: 2, numero: 'PRC-2024-002', assunto: 'Perícia Trabalhista',               vara: 'TRT-2',         status: 'aguardando'   as const, prazo: '20/12', diasRestantes: 8  },
  { id: 3, numero: 'PRC-2024-004', assunto: 'Avaliação de Estabelecimento',      vara: '5ª Vara Cível', status: 'em_andamento' as const, prazo: '22/12', diasRestantes: 10 },
  { id: 4, numero: 'PRC-2024-005', assunto: 'Perícia de Engenharia Civil',       vara: '4ª Vara Cível', status: 'aguardando'   as const, prazo: '28/12', diasRestantes: 16 },
]

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role === 'parceiro') redirect('/parceiro/dashboard')

  const userId = (session?.user as { id?: string })?.id
  let peritoPerfil = null
  if (userId) {
    peritoPerfil = await prisma.peritoPerfil.findUnique({ where: { userId } }).catch(() => null)
  }

  const nome      = session?.user?.name ?? 'Perito'
  const firstName = nome.split(' ')[0]
  const hora      = new Date().getHours()
  const saudacao  = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const tribunais: string[] = peritoPerfil ? JSON.parse(peritoPerfil.tribunais as string) : []
  const estados: string[]   = peritoPerfil ? JSON.parse((peritoPerfil as { estados?: string }).estados ?? '[]') : []

  // ── Sync varas trigger (transparent, first login) ────────────────────────
  if (userId && tribunais.length > 0) {
    const varasCount = await prisma.tribunalVara.count({ where: { peritoId: userId } }).catch(() => 0)
    if (varasCount === 0) {
      syncTribunaisReais().catch(() => null)
    }
  }

  let subtitle = 'Veja o resumo das suas atividades de hoje'
  if (estados.length > 0) {
    const labels = estados.slice(0, 3).join(', ')
    subtitle = `Atuando em ${labels}${estados.length > 3 ? ` e mais ${estados.length - 3}` : ''}`
  } else if (tribunais.length > 0) {
    const labels = tribunais.slice(0, 2).join(' e ')
    subtitle = `Monitorando ${labels}${tribunais.length > 2 ? ` e mais ${tribunais.length - 2}` : ''}`
  }

  // ── Radar ─────────────────────────────────────────────────────────────────
  const radarConfig = userId
    ? await prisma.radarConfig.findUnique({ where: { peritoId: userId } }).catch(() => null)
    : null

  const citacoesNaoLidas = userId && radarConfig
    ? await prisma.nomeacaoCitacao
        .count({ where: { peritoId: userId, visualizado: false } })
        .catch(() => 0)
    : 0

  // ── Rotas ativas (real Turso data) ───────────────────────────────────────
  type RotaComProgresso = {
    id: string
    titulo: string
    pericoId: string | null
    proximoCheckpoint: { titulo: string; endereco: string | null } | null
    checkpointsConcluidos: number
    totalCheckpoints: number
  }
  let rotasAtivas: RotaComProgresso[] = []
  if (userId) {
    try {
      const rotas = await prisma.rotaPericia.findMany({
        where: { peritoId: userId, status: 'em_andamento' },
        orderBy: { atualizadoEm: 'desc' },
        take: 4,
      })
      if (rotas.length > 0) {
        const rotaIds = rotas.map((r) => r.id)
        const allCps = await prisma.checkpoint.findMany({
          where: { rotaId: { in: rotaIds } },
          orderBy: { ordem: 'asc' },
          select: { id: true, rotaId: true, titulo: true, endereco: true, status: true },
        })
        rotasAtivas = rotas.map((rota) => {
          const cps = allCps.filter((c) => c.rotaId === rota.id)
          const concluidos = cps.filter((c) => c.status === 'concluido').length
          const proximo = cps.find((c) => c.status !== 'concluido') ?? null
          return {
            id: rota.id,
            titulo: rota.titulo,
            pericoId: rota.pericoId ?? null,
            proximoCheckpoint: proximo
              ? { titulo: proximo.titulo, endereco: proximo.endereco ?? null }
              : null,
            checkpointsConcluidos: concluidos,
            totalCheckpoints: cps.length,
          }
        })
      }
    } catch { /* DB not ready — renders empty state */ }
  }

  // ── Laudos pendentes (rotas concluídas = evidências coletadas, laudo pendente) ─
  let laudosPendentes = 0
  if (userId) {
    try {
      laudosPendentes = await prisma.rotaPericia.count({
        where: { peritoId: userId, status: 'concluida' },
      })
    } catch { /* DB not ready */ }
  }

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-6">

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {saudacao}, {firstName}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>

      {/* ── Onboarding nudge ─────────────────────────────────────────────── */}
      {peritoPerfil && !(peritoPerfil as { perfilCompleto?: boolean }).perfilCompleto && (
        <OnboardingNudge />
      )}

      {/* ── TOP ACTION BAR ───────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-3">

        {/* Buscar Nomeações — primary CTA */}
        <Link href="/nomeacoes">
          <div className="flex items-center gap-4 rounded-2xl bg-slate-900 px-5 py-4 hover:bg-slate-800 transition-colors group cursor-pointer">
            <div className="relative flex-shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400">
                <Radar className="h-5 w-5 text-slate-900" />
              </div>
              {citacoesNaoLidas > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-900">
                  {citacoesNaoLidas}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Buscar Nomeações</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {radarConfig?.ultimaBusca
                  ? `Última busca: ${new Date(radarConfig.ultimaBusca).toLocaleDateString('pt-BR')}`
                  : radarConfig
                  ? 'Radar ativo — nenhuma busca ainda'
                  : 'Configurar monitoramento'}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors flex-shrink-0" />
          </div>
        </Link>

        {/* Planejar Rota — secondary CTA */}
        <Link href="/rotas/nova">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-lime-300 hover:shadow-sm transition-all group cursor-pointer">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-lime-50">
              <Navigation className="h-5 w-5 text-lime-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Planejar Rota</p>
              <p className="text-xs text-slate-500 mt-0.5">Criar rota de vistoria ou prospecção</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-lime-500 transition-colors flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

        <Link href="/nomeacoes" className="group">
          <KPICard
            title="Nomeações Novas"
            value={citacoesNaoLidas}
            subtitle={citacoesNaoLidas > 0 ? 'Não lidas' : 'Nenhuma pendente'}
            icon={Bell}
            accent={citacoesNaoLidas > 0 ? 'lime' : 'slate'}
            highlight={citacoesNaoLidas > 0}
            className="h-full cursor-pointer group-hover:shadow-md transition-all"
          />
        </Link>

        <Link href="/pericias" className="group">
          <KPICard
            title="Péricias Ativas"
            value={periciasAtivas.length}
            subtitle="Em andamento"
            icon={FileText}
            accent="lime"
            className="h-full cursor-pointer group-hover:shadow-md transition-all"
          />
        </Link>

        <Link href="/documentos/modelos" className="group">
          <KPICard
            title="Laudos Pendentes"
            value={laudosPendentes}
            subtitle={laudosPendentes > 0 ? 'Rotas concluídas' : 'Nenhum pendente'}
            icon={ScrollText}
            accent={laudosPendentes > 0 ? 'amber' : 'slate'}
            highlight={laudosPendentes > 0}
            className="h-full cursor-pointer group-hover:shadow-md transition-all"
          />
        </Link>

        <Link href="/financeiro" className="group">
          <KPICard
            title="A Receber"
            value={formatCurrency(48500)}
            subtitle="Honorários pendentes"
            icon={TrendingUp}
            accent="emerald"
            className="h-full cursor-pointer group-hover:shadow-md transition-all"
          />
        </Link>
      </div>

      {/* ── Operação — Péricias + Visitas ────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Minhas Péricias */}
        <Card className="lg:col-span-3 rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Minhas Péricias</CardTitle>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-100 text-lime-700 text-[10px] font-bold px-1.5">
                  {periciasAtivas.length}
                </span>
              </div>
              <Link href="/pericias">
                <Button variant="ghost" size="sm" className="text-lime-600 hover:text-lime-700 -mr-2 gap-1">
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-0.5">
            {periciasAtivas.map((p) => (
              <Link
                key={p.id}
                href={`/pericias/${p.id}`}
                className={cn(
                  'group flex items-center gap-4 rounded-xl border-l-2 pl-3 pr-3 py-2.5 hover:bg-slate-50 transition-colors',
                  p.status === 'em_andamento'
                    ? 'border-l-lime-500'
                    : p.diasRestantes <= 5
                    ? 'border-l-rose-400'
                    : 'border-l-amber-300',
                )}
              >
                <div className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                  p.status === 'em_andamento' ? 'bg-lime-50' : 'bg-amber-50',
                )}>
                  {p.status === 'em_andamento'
                    ? <FileText className="h-3.5 w-3.5 text-lime-600" />
                    : <Clock className="h-3.5 w-3.5 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.assunto}</p>
                  <p className="text-xs text-slate-400 truncate">{p.numero} · {p.vara}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn(
                    'text-xs font-bold tabular-nums',
                    p.diasRestantes <= 5 ? 'text-rose-600' :
                    p.diasRestantes <= 10 ? 'text-amber-600' : 'text-slate-500',
                  )}>
                    {p.prazo}
                  </span>
                  <BadgeStatus status={p.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Próximas Rotas */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Próximas Rotas</CardTitle>
                {rotasAtivas.length > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-100 text-lime-700 text-[10px] font-bold px-1.5">
                    {rotasAtivas.length}
                  </span>
                )}
              </div>
              <Link href="/rotas">
                <Button variant="ghost" size="sm" className="text-lime-600 hover:text-lime-700 -mr-2 gap-1">
                  Ver rotas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {rotasAtivas.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-5 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <Navigation className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Nenhuma rota ativa</p>
                  <p className="text-xs text-slate-400 mt-0.5">Planeje uma rota de vistoria ou prospecção</p>
                </div>
                <Link href="/rotas/nova">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Planejar rota
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {rotasAtivas.map((rota) => (
                  <Link key={rota.id} href="/rotas/pericias">
                    <div className="group flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:border-lime-200 hover:bg-lime-50/40 transition-all cursor-pointer">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-lime-50">
                        <Navigation className="h-4 w-4 text-lime-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-slate-900 truncate">{rota.titulo}</p>
                          <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 tabular-nums">
                            {rota.checkpointsConcluidos}/{rota.totalCheckpoints}
                          </span>
                        </div>
                        {rota.proximoCheckpoint ? (
                          <>
                            <p className="text-xs text-slate-500 truncate">↳ {rota.proximoCheckpoint.titulo}</p>
                            {rota.proximoCheckpoint.endereco && (
                              <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                                <span className="truncate">{rota.proximoCheckpoint.endereco}</span>
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-emerald-600 font-medium">Todos concluídos ✓</p>
                        )}
                        {rota.totalCheckpoints > 0 && (
                          <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-lime-400 transition-all"
                              style={{ width: `${Math.round((rota.checkpointsConcluidos / rota.totalCheckpoints) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-lime-500 transition-colors flex-shrink-0 mt-1.5" />
                    </div>
                  </Link>
                ))}
                <Link href="/rotas/pericias">
                  <button className="mt-1 w-full rounded-xl border border-dashed border-slate-200 py-2.5 text-xs font-semibold text-slate-500 hover:border-lime-400 hover:text-lime-700 transition-colors">
                    Executar rota no mapa →
                  </button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Ações Rápidas ────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Ações Rápidas
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { label: 'Buscar Nomeações', href: '/nomeacoes',           icon: Radar,      primary: true  },
            { label: 'Planejar Rota',    href: '/rotas/nova',          icon: Navigation, primary: false },
            { label: 'Nova Perícia',     href: '/pericias',            icon: Plus,       primary: false },
            { label: 'Gerar Proposta',   href: '/documentos/modelos',  icon: ScrollText, primary: false },
          ] as const).map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <button
                  className={cn(
                    'w-full flex flex-col items-center justify-center gap-2 rounded-xl px-3 py-4 text-xs font-semibold transition-all',
                    action.primary
                      ? 'bg-lime-500 text-slate-900 hover:bg-lime-600'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-lime-400 hover:text-lime-700',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {action.label}
                </button>
              </Link>
            )
          })}
        </div>
      </div>

    </div>
  )
}

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

  // ── Péricias ativas (rotas em_andamento) ─────────────────────────────────
  type RotaAtiva = { id: string; titulo: string; status: string; concluidos: number; total: number }
  let periciasAtivas: RotaAtiva[] = []
  if (userId) {
    try {
      const dbRotas = await prisma.rotaPericia.findMany({
        where: { peritoId: userId, status: { in: ['em_andamento', 'concluida'] } },
        orderBy: { atualizadoEm: 'desc' },
        take: 4,
      })
      if (dbRotas.length > 0) {
        const rotaIds = dbRotas.map((r) => r.id)
        const cps = await prisma.checkpoint.findMany({
          where: { rotaId: { in: rotaIds } },
          select: { rotaId: true, status: true },
        })
        periciasAtivas = dbRotas.map((rota) => {
          const mine = cps.filter((c) => c.rotaId === rota.id)
          return {
            id: rota.id,
            titulo: rota.titulo,
            status: rota.status,
            concluidos: mine.filter((c) => c.status === 'concluido').length,
            total: mine.length,
          }
        })
      }
    } catch { /* DB not ready */ }
  }

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-8 max-w-[1200px] mx-auto w-full pt-4">

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 border-b border-border/60 pb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {saudacao}, {firstName}
        </h1>
        <p className="text-sm text-zinc-400">{subtitle}</p>
      </div>

      {/* ── Onboarding nudge ─────────────────────────────────────────────── */}
      {peritoPerfil && !(peritoPerfil as { perfilCompleto?: boolean }).perfilCompleto && (
        <OnboardingNudge />
      )}

      {/* ── TOP ACTION BAR ───────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Buscar Nomeações — primary CTA */}
        <Link href="/nomeacoes">
          <div className="flex items-center gap-4 rounded-xl bg-card border border-brand-500/20 px-5 py-4 hover:border-brand-500/50 hover:shadow-saas-glow transition-all group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex-shrink-0 z-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 border border-brand-500/20 group-hover:bg-brand-500/30 transition-colors">
                <Radar className="h-5 w-5 text-brand-500" />
              </div>
              {citacoesNaoLidas > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-card shadow-saas">
                  {citacoesNaoLidas}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 z-10">
              <p className="text-sm font-medium text-foreground">Buscar Nomeações</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {radarConfig?.ultimaBusca
                  ? `Última busca: ${new Date(radarConfig.ultimaBusca).toLocaleDateString('pt-BR')}`
                  : radarConfig
                  ? 'Radar ativo — nenhuma busca ainda'
                  : 'Configurar monitoramento'}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-brand-500 transition-colors flex-shrink-0 z-10" />
          </div>
        </Link>

        {/* Planejar Rota — secondary CTA */}
        <Link href="/rotas/nova">
          <div className="flex items-center gap-4 rounded-xl bg-card border border-border px-5 py-4 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all group cursor-pointer">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500/10 border border-brand-500/20 group-hover:bg-brand-500/20 transition-colors">
              <Navigation className="h-4 w-4 text-brand-500 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Planejar Rota</p>
              <p className="text-xs text-zinc-400 mt-0.5">Criar rota de vistoria ou prospecção</p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-foreground transition-colors flex-shrink-0" />
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
            accent="brand"
            highlight={citacoesNaoLidas > 0}
            className="h-full cursor-pointer hover:border-zinc-700 transition-all"
          />
        </Link>

        <Link href="/pericias" className="group">
          <KPICard
            title="Péricias Ativas"
            value={periciasAtivas.length}
            subtitle={periciasAtivas.length > 0 ? 'Em andamento' : 'Nenhuma ativa'}
            icon={FileText}
            accent="brand"
            className="h-full cursor-pointer hover:border-zinc-700 transition-all"
          />
        </Link>

        <Link href="/documentos/modelos" className="group">
          <KPICard
            title="Laudos Pendentes"
            value={laudosPendentes}
            subtitle={laudosPendentes > 0 ? 'Rotas concluídas' : 'Nenhum pendente'}
            icon={ScrollText}
            accent="brand"
            highlight={laudosPendentes > 0}
            className="h-full cursor-pointer hover:border-zinc-700 transition-all"
          />
        </Link>

        <Link href="/financeiro" className="group">
          <KPICard
            title="A Receber"
            value={formatCurrency(48500)}
            subtitle="Honorários pendentes"
            icon={TrendingUp}
            accent="brand"
            className="h-full cursor-pointer hover:border-zinc-700 transition-all"
          />
        </Link>
      </div>

      {/* ── Operação — Péricias + Visitas ────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Minhas Péricias */}
        <Card className="lg:col-span-3 rounded-xl border-border bg-card shadow-saas">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-medium">Minhas Péricias</CardTitle>
                <span className="flex h-5 min-w-5 items-center justify-center rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-medium px-1.5">
                  {periciasAtivas.length}
                </span>
              </div>
              <Link href="/pericias">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-foreground text-xs -mr-2 gap-1 h-8">
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {periciasAtivas.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[160px] gap-3 text-center border border-dashed border-border/50 rounded-lg bg-zinc-900/20">
                <FileText className="h-6 w-6 text-brand-500" />
                <p className="text-sm text-zinc-500">Nenhuma perícia ativa</p>
                <Link href="/rotas/nova">
                  <Button size="sm" variant="outline" className="border-border text-xs h-8">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Planejar rota
                  </Button>
                </Link>
              </div>
            ) : (
              periciasAtivas.map((p) => {
                const pct = p.total > 0 ? Math.round((p.concluidos / p.total) * 100) : 0
                return (
                  <Link
                    key={p.id}
                    href={`/pericias/${p.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-transparent pl-2 pr-3 py-2.5 hover:bg-zinc-900/60 hover:border-border transition-all"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-brand-500/10 border border-brand-500/20">
                      <FileText className="h-4 w-4 text-brand-500 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.titulo}</p>
                      {p.total > 0 && (
                        <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                      {p.total > 0 && (
                        <span className="text-xs font-medium tabular-nums text-zinc-500">
                          {p.concluidos}/{p.total}
                        </span>
                      )}
                      {/* Sub-components need to adopt dark mode classes naturally */}
                      <BadgeStatus status={p.status} />
                    </div>
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Próximas Rotas */}
        <Card className="lg:col-span-2 rounded-xl border-border bg-card shadow-saas">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-medium">Próximas Rotas</CardTitle>
                {rotasAtivas.length > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-medium px-1.5">
                    {rotasAtivas.length}
                  </span>
                )}
              </div>
              <Link href="/rotas">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-foreground text-xs -mr-2 gap-1 h-8">
                  Ver rotas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {rotasAtivas.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[160px] gap-3 text-center border border-dashed border-border/50 rounded-lg bg-zinc-900/20">
                <Navigation className="h-6 w-6 text-brand-500" />
                <div>
                  <p className="text-sm font-medium text-zinc-300">Nenhuma rota ativa</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Planeje uma vistoria</p>
                </div>
                <Link href="/rotas/nova">
                  <Button size="sm" variant="outline" className="border-border text-xs h-8 mt-1">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Nova rota
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {rotasAtivas.map((rota) => (
                  <Link key={rota.id} href="/rotas/pericias">
                    <div className="group flex items-start gap-3 rounded-lg border border-border bg-zinc-900/30 p-3 hover:border-brand-500/30 hover:bg-zinc-900/80 transition-all cursor-pointer">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-brand-500/10 border border-brand-500/20">
                        <Navigation className="h-3.5 w-3.5 text-brand-500 transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground truncate">{rota.titulo}</p>
                          <span className="text-[10px] font-medium text-zinc-500 flex-shrink-0 tabular-nums bg-zinc-800 px-1.5 py-0.5 rounded">
                            {rota.checkpointsConcluidos}/{rota.totalCheckpoints}
                          </span>
                        </div>
                        {rota.proximoCheckpoint ? (
                          <>
                            <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-brand-500/50" />
                              {rota.proximoCheckpoint.titulo}
                            </p>
                            {rota.proximoCheckpoint.endereco && (
                              <p className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1 pl-2.5 border-l border-zinc-800 ml-0.5">
                                <span className="truncate">{rota.proximoCheckpoint.endereco}</span>
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-brand-500 font-medium">Todos concluídos ✓</p>
                        )}
                        {rota.totalCheckpoints > 0 && (
                          <div className="mt-2.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-500 transition-all"
                              style={{ width: `${Math.round((rota.checkpointsConcluidos / rota.totalCheckpoints) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                <Link href="/rotas/pericias">
                  <button className="mt-2 w-full inline-flex justify-center items-center py-2 text-xs font-medium text-brand-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors">
                    Executar rota no mapa <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Ações Rápidas ────────────────────────────────────────────────── */}
      <div className="pt-2">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
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
                    'w-full flex flex-col items-center justify-center gap-2.5 rounded-xl border px-3 py-4 text-xs font-medium transition-all',
                    action.primary
                      ? 'bg-brand-500 text-black border-brand-400 hover:bg-brand-400 hover:shadow-saas-glow'
                      : 'bg-card border-border text-zinc-400 hover:border-zinc-700 hover:text-foreground hover:bg-zinc-900/50',
                  )}
                >
                  <Icon className={cn("h-5 w-5", action.primary ? "text-black/80" : "text-brand-500")} />
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


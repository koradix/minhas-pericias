import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FileText,
  Calendar,
  Inbox,
  TrendingUp,
  ChevronRight,
  MapPin,
  Radar,
  ScrollText,
  Scale,
  Building2,
  Clock,
  Bell,
  Landmark,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/shared/kpi-card'
import { BadgeStatus } from '@/components/shared/badge-status'
import { cn, formatCurrency } from '@/lib/utils'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { RadarStrip } from '@/components/dashboard/radar-strip'
import { DashboardBuscarNomeacoes } from '@/components/dashboard/DashboardBuscarNomeacoes'
import { OnboardingNudge } from '@/components/perfil/OnboardingNudge'
import { syncTribunaisReais } from '@/lib/actions/perfil'
import { getVarasComNomeacoesCount } from '@/lib/data/varas'
import type { Metadata } from 'next'
import type { DemandaParceiro } from '@prisma/client'

export const metadata: Metadata = { title: 'Dashboard' }

// ─── MOCK DATA (demo user / sem CRUDs reais ainda) ───────────────────────────

const periciasAtivas = [
  { id: 1, numero: 'PRC-2024-001', assunto: 'Avaliação de Imóvel Residencial', vara: '3ª Vara Cível', status: 'em_andamento' as const, prazo: '15/12', diasRestantes: 3 },
  { id: 2, numero: 'PRC-2024-002', assunto: 'Perícia Trabalhista', vara: 'TRT-2', status: 'aguardando' as const, prazo: '20/12', diasRestantes: 8 },
  { id: 3, numero: 'PRC-2024-004', assunto: 'Avaliação de Estabelecimento', vara: '5ª Vara Cível', status: 'em_andamento' as const, prazo: '22/12', diasRestantes: 10 },
  { id: 4, numero: 'PRC-2024-005', assunto: 'Perícia de Engenharia Civil', vara: '4ª Vara Cível', status: 'aguardando' as const, prazo: '28/12', diasRestantes: 16 },
]

const proximasVisitas = [
  { id: 1, tipo: 'Vistoria',   pericia: 'PRC-2024-001', local: 'Rua das Flores, 123', cidade: 'Jardins, SP', quando: 'Hoje',   hora: '14:00', urgente: true  },
  { id: 2, tipo: 'Entrevista', pericia: 'PRC-2024-004', local: 'Av. Paulista, 1000',  cidade: 'Bela Vista, SP', quando: 'Amanhã', hora: '09:30', urgente: false },
  { id: 3, tipo: 'Vistoria',   pericia: 'PRC-2024-006', local: 'Rua do Comércio, 45', cidade: 'Centro, SP', quando: '18 Dez', hora: '10:00', urgente: false },
]

// Peritos do not create perícias manually.
// Perícias arrive via:
//   (a) Nomeações found by the Radar (Escavador API)
//   (b) Proposals from Parceiros
// A "Nova Perícia" button implies the wrong mental model.
const quickActions = [
  { label: 'Abrir Radar',     href: '/nomeacoes',              icon: Radar,     primary: true  },
  { label: 'Nova Visita',     href: '/rotas',                  icon: Calendar,  primary: false },
  { label: 'Ver Demandas',    href: '/demandas',               icon: Inbox,     primary: false },
  { label: 'Gerar Proposta',  href: '/documentos/modelos',     icon: ScrollText,primary: false },
  { label: 'Minhas Péricias', href: '/pericias',               icon: FileText,  primary: false },
  { label: 'Criar Documento', href: '/documentos/modelos/novo',icon: FileText,  primary: false },
]

// ─── Matching demandas → perito ──────────────────────────────────────────────

function matchDemandasParaPerito(
  especialidades: string[],
  estados: string[],
  cidade: string | null | undefined,
  demandas: DemandaParceiro[],
): (DemandaParceiro & { score: number })[] {
  if (demandas.length === 0) return []
  if (!especialidades.length && !estados.length) {
    return demandas.slice(0, 3).map((d) => ({ ...d, score: 0 }))
  }
  return demandas
    .map((d) => {
      let score = 0
      const tipoNorm = d.tipo.toLowerCase()
      if (especialidades.some((e) => e.toLowerCase() === tipoNorm)) {
        score += 50
      } else if (
        especialidades.some((e) => {
          const word = e.toLowerCase().split(' ')[0]
          return word.length > 3 && (tipoNorm.includes(word) || tipoNorm.split(' ')[0].includes(word))
        })
      ) {
        score += 25
      }
      if (estados.includes(d.uf)) score += 20
      if (cidade && d.cidade.toLowerCase().includes(cidade.toLowerCase())) score += 10
      return { ...d, score }
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role === 'parceiro') redirect('/parceiro/dashboard')

  const userId = (session?.user as { id?: string })?.id
  let peritoPerfil = null
  if (userId) {
    peritoPerfil = await prisma.peritoPerfil.findUnique({ where: { userId } }).catch(() => null)
  }

  const nome         = session?.user?.name ?? 'Perito'
  const firstName    = nome.split(' ')[0]
  const hora         = new Date().getHours()
  const saudacao     = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const tribunais: string[]      = peritoPerfil ? JSON.parse(peritoPerfil.tribunais as string) : []
  const estados: string[]        = peritoPerfil ? JSON.parse((peritoPerfil as { estados?: string }).estados ?? '[]') : []
  // Prefer new taxonomy especialidades2, fall back to legacy especialidades
  const esp2: string[]           = peritoPerfil ? JSON.parse((peritoPerfil as { especialidades2?: string }).especialidades2 ?? '[]') : []
  const espLegacy: string[]      = peritoPerfil ? JSON.parse(peritoPerfil.especialidades as string) : []
  const especialidades: string[] = esp2.length > 0 ? esp2 : espLegacy

  // ── Sync varas trigger (transparent, first login) ────────────────────────
  if (userId && tribunais.length > 0) {
    const varasCount = await prisma.tribunalVara.count({ where: { peritoId: userId } }).catch(() => 0)
    if (varasCount === 0) {
      // Fire-and-forget in background — don't block the page
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

  // ── Radar (real DB) ──────────────────────────────────────────────────────
  const radarConfig = userId
    ? await prisma.radarConfig.findUnique({ where: { peritoId: userId } }).catch(() => null)
    : null

  const [citacoesTotal, citacoesNaoLidas, varasComNomeacoes] = userId
    ? await Promise.all([
        radarConfig ? prisma.nomeacaoCitacao.count({ where: { peritoId: userId } }) : Promise.resolve(0),
        radarConfig ? prisma.nomeacaoCitacao.count({ where: { peritoId: userId, visualizado: false } }) : Promise.resolve(0),
        getVarasComNomeacoesCount(userId),
      ])
    : [0, 0, 0]

  // ── Demandas compatíveis (real DB) ───────────────────────────────────────
  const demandasDB = await prisma.demandaParceiro
    .findMany({ where: { status: 'aberta' }, orderBy: { createdAt: 'desc' }, take: 30 })
    .catch(() => [])

  const demandasMatch = matchDemandasParaPerito(especialidades, estados, peritoPerfil?.cidade, demandasDB)
  const temDemandasReais = demandasMatch.length > 0

  // Fallback mock demandas for demo user with empty DB
  const mockDemandasFallback = [
    { id: 'm1', titulo: 'Avaliação de Imóvel Residencial', parceiro: 'Seguradora Confiança', cidade: 'São Paulo', uf: 'SP', tipo: 'Avaliação de Imóvel', valor: 3500, expira: 2 },
    { id: 'm2', titulo: 'Perícia Trabalhista — Cálculos',  parceiro: 'Lima & Associados',    cidade: 'São Paulo', uf: 'SP', tipo: 'Perícia Trabalhista', valor: 2800, expira: 4 },
    { id: 'm3', titulo: 'Avaliação de Veículo Sinistrado', parceiro: 'Porto Seguro',          cidade: 'Campinas',  uf: 'SP', tipo: 'Avaliação de Veículo', valor: 1200, expira: 7 },
  ]

  return (
    <div className="space-y-6 pb-6">

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {saudacao}, {firstName}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>

      {/* ── Onboarding nudge (amber banner when perfil incomplete) ─────── */}
      {peritoPerfil && !(peritoPerfil as { perfilCompleto?: boolean }).perfilCompleto && (
        <OnboardingNudge />
      )}

      {/* ── Radar Banner — sempre visível ────────────────────────────────── */}
      <DashboardBuscarNomeacoes
        ultimaBusca={radarConfig?.ultimaBusca ?? null}
        naoLidas={citacoesNaoLidas}
      />

      {/* ── Linha 1 — KPIs (prioridade: o que importa ao perito) ─────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* [1] Nomeações novas — ação mais importante */}
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
        {/* [2] A receber — dinheiro em cima da mesa */}
        <Link href="/financeiro" className="group">
          <KPICard title="A Receber" value={formatCurrency(48500)} subtitle="Honorários pendentes"
            icon={TrendingUp} accent="emerald" className="h-full cursor-pointer group-hover:shadow-md transition-all" />
        </Link>
        {/* [3] Péricias ativas */}
        <Link href="/pericias" className="group">
          <KPICard title="Péricias Ativas" value={periciasAtivas.length} subtitle="Em andamento"
            icon={FileText} accent="lime" className="h-full cursor-pointer group-hover:shadow-md transition-all" />
        </Link>
        {/* [4] Varas com nomeações — inteligência de prospecção */}
        <Link href="/nomeacoes/varas" className="group">
          <KPICard
            title="Varas com Nomeações"
            value={varasComNomeacoes > 0 ? varasComNomeacoes : '—'}
            subtitle={
              varasComNomeacoes > 0
                ? `${varasComNomeacoes} vara${varasComNomeacoes > 1 ? 's' : ''} já nomeou você`
                : 'Sincronize suas varas'
            }
            icon={Landmark}
            accent={varasComNomeacoes > 0 ? 'amber' : 'slate'}
            className="h-full cursor-pointer group-hover:shadow-md transition-all"
          />
        </Link>
      </div>

      {/* ── Linha 2 — Operação ───────────────────────────────────────────── */}
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
              <Link key={p.id} href="/pericias" className={cn(
                'group flex items-center gap-4 rounded-xl border-l-2 pl-3 pr-3 py-2.5 hover:bg-slate-50 transition-colors',
                p.status === 'em_andamento' ? 'border-l-lime-500' :
                p.diasRestantes <= 5 ? 'border-l-rose-400' : 'border-l-amber-300',
              )}>
                <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                  p.status === 'em_andamento' ? 'bg-lime-50' : 'bg-amber-50')}>
                  {p.status === 'em_andamento'
                    ? <FileText className="h-3.5 w-3.5 text-lime-600" />
                    : <Clock className="h-3.5 w-3.5 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.assunto}</p>
                  <p className="text-xs text-slate-400 truncate">{p.numero} · {p.vara}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('text-xs font-bold tabular-nums',
                    p.diasRestantes <= 5 ? 'text-rose-600' :
                    p.diasRestantes <= 10 ? 'text-amber-600' : 'text-slate-500')}>
                    {p.prazo}
                  </span>
                  <BadgeStatus status={p.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Agenda */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Agenda</CardTitle>
              <Link href="/rotas">
                <Button variant="ghost" size="sm" className="text-lime-600 hover:text-lime-700 -mr-2 gap-1">
                  Ver <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {proximasVisitas.map((v) => (
              <div key={v.id} className={cn(
                'flex items-start gap-3 rounded-xl p-3 transition-all cursor-pointer',
                v.urgente ? 'bg-amber-50 border border-amber-100' : 'border border-transparent hover:bg-slate-50 hover:border-slate-100',
              )}>
                <div className={cn('flex flex-col items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl',
                  v.urgente ? 'bg-amber-100' : 'bg-slate-100')}>
                  <span className={cn('text-[9px] font-bold uppercase leading-none', v.urgente ? 'text-amber-600' : 'text-slate-500')}>
                    {v.quando}
                  </span>
                  <span className={cn('text-sm font-bold tabular-nums mt-0.5', v.urgente ? 'text-amber-700' : 'text-slate-700')}>
                    {v.hora}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                      v.tipo === 'Vistoria' ? 'bg-lime-50 text-lime-700' : 'bg-slate-100 text-slate-600')}>
                      {v.tipo}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">{v.pericia}</span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-slate-700 font-medium">
                    <MapPin className="h-3 w-3 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{v.local}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 pl-4">{v.cidade}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Linha 3 — Inteligência ────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Radar card */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Radar de Nomeações</CardTitle>
                {citacoesTotal > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-100 text-lime-700 text-[10px] font-bold px-1.5">
                    {citacoesTotal}
                  </span>
                )}
              </div>
              <Link href="/nomeacoes">
                <Button variant="ghost" size="sm" className="text-lime-600 hover:text-lime-700 -mr-2 gap-1">
                  Abrir <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            {(estados.length > 0 || tribunais.length > 0) && (
              <div className="flex flex-wrap gap-1 mt-1">
                {estados.length > 0
                  ? estados.map((uf) => (
                      <span key={uf} className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">{uf}</span>
                    ))
                  : tribunais.slice(0, 5).map((t) => (
                      <span key={t} className="inline-flex items-center rounded-md bg-lime-50 px-1.5 py-0.5 text-[10px] font-medium text-lime-700">{t}</span>
                    ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-2">
            {!radarConfig ? (
              <div className="space-y-3 py-1">
                <p className="text-xs text-slate-500">
                  Monitore automaticamente os diários oficiais e seja alertado quando seu nome aparecer em nomeações.
                </p>
                <Link href="/nomeacoes">
                  <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1.5 w-full">
                    <Radar className="h-3.5 w-3.5" />
                    Configurar Radar
                  </Button>
                </Link>
              </div>
            ) : citacoesTotal === 0 ? (
              <div className="space-y-2 py-1">
                <p className="text-xs text-slate-500">Radar ativo. Nenhuma citação encontrada ainda.</p>
                <Link href="/nomeacoes">
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                    <Radar className="h-3.5 w-3.5" />
                    Ir para o Radar
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{citacoesTotal}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">citações</p>
                  </div>
                  <div className={cn('rounded-xl border p-3 text-center', citacoesNaoLidas > 0 ? 'bg-lime-50 border-lime-200' : 'bg-slate-50 border-slate-100')}>
                    <p className={cn('text-2xl font-bold tabular-nums', citacoesNaoLidas > 0 ? 'text-lime-700' : 'text-slate-900')}>
                      {citacoesNaoLidas}
                    </p>
                    <p className={cn('text-[11px] mt-0.5', citacoesNaoLidas > 0 ? 'text-lime-600' : 'text-slate-500')}>não lidas</p>
                  </div>
                </div>
                <Link href="/nomeacoes" className="flex items-center gap-1 text-xs font-medium text-lime-600 hover:text-lime-700 transition-colors">
                  <Radar className="h-3.5 w-3.5" />
                  Ver todas as citações
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demandas compatíveis */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Demandas Compatíveis</CardTitle>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5">
                  {temDemandasReais ? demandasMatch.length : mockDemandasFallback.length}
                </span>
              </div>
              <Link href="/demandas">
                <Button variant="ghost" size="sm" className="text-lime-600 hover:text-lime-700 -mr-2 gap-1">
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            {especialidades.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {especialidades.slice(0, 3).map((e) => (
                  <span key={e} className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{e}</span>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-2 space-y-2">
            {temDemandasReais ? (
              demandasMatch.map((d) => (
                <div key={d.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:border-lime-200 hover:bg-lime-50/30 transition-all cursor-pointer">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-lime-50">
                    <Scale className="h-3.5 w-3.5 text-lime-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{d.titulo}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3" />
                      {d.cidade} · {d.uf}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-800">{formatCurrency(d.valor)}</p>
                    <p className="text-[10px] text-slate-400">{d.tipo}</p>
                  </div>
                </div>
              ))
            ) : (
              mockDemandasFallback.map((d) => (
                <div key={d.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:border-lime-200 hover:bg-lime-50/30 transition-all cursor-pointer">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-lime-50">
                    <Scale className="h-3.5 w-3.5 text-lime-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{d.titulo}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3" />
                      {d.parceiro} · {d.cidade}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-800">{formatCurrency(d.valor)}</p>
                    {d.expira <= 3 && (
                      <span className="text-[10px] font-bold text-rose-600">{d.expira}d</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Linha 4 — Ações Rápidas ───────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Ações Rápidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href + action.label} href={action.href}>
                <button className={cn(
                  'w-full flex flex-col items-center justify-center gap-2 rounded-xl px-3 py-4 text-xs font-semibold transition-all',
                  action.primary
                    ? 'bg-lime-500 text-slate-900 hover:bg-lime-600'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-lime-400 hover:text-lime-700',
                )}>
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

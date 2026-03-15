import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FileText,
  Calendar,
  Inbox,
  TrendingUp,
  ChevronRight,
  Plus,
  MapPin,
  Radar,
  ScrollText,
  Scale,
  Building2,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/shared/kpi-card'
import { BadgeStatus } from '@/components/shared/badge-status'
import { cn, formatCurrency } from '@/lib/utils'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const periciasAtivas = [
  { id: 1, numero: 'PRC-2024-001', assunto: 'Avaliação de Imóvel Residencial', vara: '3ª Vara Cível', status: 'em_andamento' as const, prazo: '15/12', diasRestantes: 3 },
  { id: 2, numero: 'PRC-2024-002', assunto: 'Perícia Trabalhista', vara: 'TRT-2', status: 'aguardando' as const, prazo: '20/12', diasRestantes: 8 },
  { id: 3, numero: 'PRC-2024-004', assunto: 'Avaliação de Estabelecimento', vara: '5ª Vara Cível', status: 'em_andamento' as const, prazo: '22/12', diasRestantes: 10 },
  { id: 4, numero: 'PRC-2024-005', assunto: 'Perícia de Engenharia Civil', vara: '4ª Vara Cível', status: 'aguardando' as const, prazo: '28/12', diasRestantes: 16 },
]

const proximasVisitas = [
  { id: 1, tipo: 'Vistoria', pericia: 'PRC-2024-001', local: 'Rua das Flores, 123', cidade: 'Jardins, SP', quando: 'Hoje', hora: '14:00', urgente: true },
  { id: 2, tipo: 'Entrevista', pericia: 'PRC-2024-004', local: 'Av. Paulista, 1000', cidade: 'Bela Vista, SP', quando: 'Amanhã', hora: '09:30', urgente: false },
  { id: 3, tipo: 'Vistoria', pericia: 'PRC-2024-006', local: 'Rua do Comércio, 45', cidade: 'Centro, SP', quando: '18 Dez', hora: '10:00', urgente: false },
]

const demandasCompativeis = [
  { id: 1, titulo: 'Avaliação de Imóvel Residencial', parceiro: 'Seguradora Confiança', cidade: 'São Paulo — SP', valor: 3500, expira: 2 },
  { id: 2, titulo: 'Perícia Trabalhista — Cálculos', parceiro: 'Lima & Associados', cidade: 'São Paulo — SP', valor: 2800, expira: 4 },
  { id: 3, titulo: 'Avaliação de Veículo Sinistrado', parceiro: 'Porto Seguro', cidade: 'Campinas — SP', valor: 1200, expira: 7 },
]

const topVarasMock = [
  { vara: '3ª Vara Cível Central', tribunal: 'TJSP', pericias: 47 },
  { vara: '1ª Vara Empresarial', tribunal: 'TJSP', pericias: 38 },
  { vara: 'TRT-2 — 1ª Turma', tribunal: 'TRT-2', pericias: 35 },
]

const quickActions = [
  { label: 'Nova Perícia', href: '/pericias', icon: Plus, primary: true },
  { label: 'Nova Visita', href: '/rotas', icon: Calendar, primary: false },
  { label: 'Ver Demandas', href: '/demandas', icon: Inbox, primary: false },
  { label: 'Gerar Proposta', href: '/documentos/modelos', icon: ScrollText, primary: false },
  { label: 'Abrir Radar', href: '/nomeacoes', icon: Radar, primary: false },
  { label: 'Criar Documento', href: '/documentos/modelos/novo', icon: FileText, primary: false },
]

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role === 'parceiro') {
    redirect('/parceiro/dashboard')
  }

  const userId = (session?.user as { id?: string })?.id
  let peritoPerfil = null
  if (userId) {
    peritoPerfil = await prisma.peritoPerfil.findUnique({ where: { userId } }).catch(() => null)
  }

  const nome = session?.user?.name ?? 'Perito'
  const firstName = nome.split(' ')[0]
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const tribunais: string[] = peritoPerfil ? JSON.parse(peritoPerfil.tribunais as string) : []
  const estados: string[] = peritoPerfil ? JSON.parse((peritoPerfil as { estados?: string }).estados ?? '[]') : []
  const especialidades: string[] = peritoPerfil ? JSON.parse(peritoPerfil.especialidades as string) : []

  let subtitle = 'Veja o resumo das suas atividades de hoje'
  if (estados.length > 0) {
    const labels = estados.slice(0, 3).join(', ')
    subtitle = `Atuando em ${labels}${estados.length > 3 ? ` e mais ${estados.length - 3}` : ''}`
  } else if (tribunais.length > 0) {
    const labels = tribunais.slice(0, 2).join(' e ')
    subtitle = `Monitorando ${labels}${tribunais.length > 2 ? ` e mais ${tribunais.length - 2}` : ''}`
  }

  const ativasCount = periciasAtivas.length
  const honorariosPendentes = 48500

  return (
    <div className="space-y-6 pb-6">

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {saudacao}, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        </div>
        <Link href="/pericias">
          <Button size="sm" className="hidden sm:inline-flex bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold">
            <Plus className="h-3.5 w-3.5" />
            Nova Perícia
          </Button>
        </Link>
      </div>

      {/* ── Linha 1 — KPIs ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/pericias" className="group">
          <KPICard
            title="Péricias Ativas"
            value={ativasCount}
            subtitle="Em andamento"
            icon={FileText}
            accent="lime"
            highlight
            className="h-full cursor-pointer group-hover:shadow-md transition-all"
          />
        </Link>
        <Link href="/demandas" className="group">
          <KPICard
            title="Demandas em Aberto"
            value={demandasCompativeis.length}
            subtitle="Aguardando aceite"
            icon={Inbox}
            accent="amber"
            className="h-full cursor-pointer group-hover:shadow-md transition-all"
          />
        </Link>
        <Link href="/rotas" className="group">
          <KPICard
            title="Visitas Agendadas"
            value={proximasVisitas.length}
            subtitle="Próximos 7 dias"
            icon={Calendar}
            accent="slate"
            className="h-full cursor-pointer group-hover:shadow-md transition-all"
          />
        </Link>
        <Link href="/financeiro" className="group">
          <KPICard
            title="Honorários Pendentes"
            value={formatCurrency(honorariosPendentes)}
            subtitle="A receber"
            icon={TrendingUp}
            accent="emerald"
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
                  {ativasCount}
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
                href="/pericias"
                className={cn(
                  'group flex items-center gap-4 rounded-xl border-l-2 pl-3 pr-3 py-2.5 hover:bg-slate-50 transition-colors',
                  p.status === 'em_andamento' ? 'border-l-lime-500' :
                  p.diasRestantes <= 5 ? 'border-l-rose-400' :
                  'border-l-amber-300'
                )}
              >
                <div className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                  p.status === 'em_andamento' ? 'bg-lime-50' : 'bg-amber-50'
                )}>
                  {p.status === 'em_andamento'
                    ? <FileText className="h-3.5 w-3.5 text-lime-600" />
                    : <Clock className="h-3.5 w-3.5 text-amber-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.assunto}</p>
                  <p className="text-xs text-slate-400 truncate">{p.numero} · {p.vara}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn(
                    'text-xs font-bold tabular-nums',
                    p.diasRestantes <= 5 ? 'text-rose-600' :
                    p.diasRestantes <= 10 ? 'text-amber-600' : 'text-slate-500'
                  )}>
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
              <div
                key={v.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl p-3 transition-all cursor-pointer',
                  v.urgente
                    ? 'bg-amber-50 border border-amber-100'
                    : 'border border-transparent hover:bg-slate-50 hover:border-slate-100'
                )}
              >
                <div className={cn(
                  'flex flex-col items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl',
                  v.urgente ? 'bg-amber-100' : 'bg-slate-100'
                )}>
                  <span className={cn('text-[9px] font-bold uppercase leading-none', v.urgente ? 'text-amber-600' : 'text-slate-500')}>
                    {v.quando}
                  </span>
                  <span className={cn('text-sm font-bold tabular-nums mt-0.5', v.urgente ? 'text-amber-700' : 'text-slate-700')}>
                    {v.hora}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cn(
                      'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                      v.tipo === 'Vistoria' ? 'bg-lime-50 text-lime-700' : 'bg-slate-100 text-slate-600'
                    )}>
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

        {/* Radar dos meus tribunais */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Radar de Nomeações</CardTitle>
                {estados.length > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-100 text-lime-700 text-[10px] font-bold px-1.5">
                    {estados.length} {estados.length === 1 ? 'estado' : 'estados'}
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
                      <span key={uf} className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                        {uf}
                      </span>
                    ))
                  : tribunais.slice(0, 5).map((t) => (
                      <span key={t} className="inline-flex items-center rounded-md bg-lime-50 px-1.5 py-0.5 text-[10px] font-medium text-lime-700">
                        {t}
                      </span>
                    ))
                }
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            {topVarasMock.map((v) => {
              const pct = Math.round((v.pericias / 47) * 100)
              return (
                <div key={v.vara} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{v.vara}</p>
                      <p className="text-[11px] text-slate-400">{v.tribunal}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-800 tabular-nums ml-3">{v.pericias}</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-lime-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            <Link href="/nomeacoes/estrategia" className="flex items-center gap-1 pt-1 text-xs font-medium text-lime-600 hover:text-lime-700 transition-colors">
              <Radar className="h-3.5 w-3.5" />
              Gerar estratégia de prospecção
            </Link>
          </CardContent>
        </Card>

        {/* Demandas compatíveis */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Demandas Compatíveis</CardTitle>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5">
                  {demandasCompativeis.length}
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
                  <span key={e} className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                    {e}
                  </span>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-2 space-y-2">
            {demandasCompativeis.map((d) => (
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
            ))}
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
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-lime-400 hover:text-lime-700'
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

import Link from 'next/link'
import {
  FileText,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowDownCircle,
  TrendingUp,
  Inbox,
  Building2,
  MapPin,
  ChevronRight,
  BellDot,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/shared/stats-card'
import { cn, formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const financeiro = {
  aReceber: 48500,
  recebidoMes: 8000,
  metaMes: 56500,
  originadoresAtivos: 12,
  recebimentosAbertos: 12,
}

const periciasAtivas = [
  {
    id: 1,
    numero: 'PRC-2024-001',
    assunto: 'Avaliação de Imóvel Residencial',
    vara: '3ª Vara Cível',
    status: 'em_andamento' as const,
    prazo: '15/12/2024',
    diasRestantes: 3,
  },
  {
    id: 2,
    numero: 'PRC-2024-002',
    assunto: 'Perícia Trabalhista',
    vara: 'TRT-2',
    status: 'aguardando' as const,
    prazo: '20/12/2024',
    diasRestantes: 8,
  },
  {
    id: 3,
    numero: 'PRC-2024-003',
    assunto: 'Laudo Contábil Societário',
    vara: '1ª Vara Empresarial',
    status: 'concluida' as const,
    prazo: '10/12/2024',
    diasRestantes: 0,
  },
  {
    id: 4,
    numero: 'PRC-2024-004',
    assunto: 'Avaliação de Estabelecimento Comercial',
    vara: '5ª Vara Cível',
    status: 'em_andamento' as const,
    prazo: '22/12/2024',
    diasRestantes: 10,
  },
  {
    id: 5,
    numero: 'PRC-2024-005',
    assunto: 'Perícia de Engenharia Civil',
    vara: '4ª Vara Cível',
    status: 'aguardando' as const,
    prazo: '28/12/2024',
    diasRestantes: 16,
  },
]

const demandasParaAceitar = [
  {
    id: 1,
    titulo: 'Avaliação de Imóvel Residencial',
    originador: 'Seguradora Confiança',
    cidade: 'São Paulo — SP',
    valor: 3500,
    diasParaExpirar: 2,
  },
  {
    id: 2,
    titulo: 'Perícia Trabalhista — Cálculos',
    originador: 'Lima & Associados Advocacia',
    cidade: 'São Paulo — SP',
    valor: 2800,
    diasParaExpirar: 4,
  },
  {
    id: 3,
    titulo: 'Avaliação de Veículo Sinistrado',
    originador: 'Porto Seguro',
    cidade: 'Campinas — SP',
    valor: 1200,
    diasParaExpirar: 7,
  },
]

const proximasVisitas = [
  {
    id: 1,
    tipo: 'Vistoria',
    pericia: 'PRC-2024-001',
    local: 'Rua das Flores, 123',
    cidade: 'Jardins, SP',
    quando: 'Hoje',
    hora: '14:00',
    urgente: true,
  },
  {
    id: 2,
    tipo: 'Entrevista',
    pericia: 'PRC-2024-004',
    local: 'Av. Paulista, 1000',
    cidade: 'Bela Vista, SP',
    quando: 'Amanhã',
    hora: '09:30',
    urgente: false,
  },
  {
    id: 3,
    tipo: 'Vistoria',
    pericia: 'PRC-2024-006',
    local: 'Rua do Comércio, 45',
    cidade: 'Centro, SP',
    quando: '18 Dez',
    hora: '10:00',
    urgente: false,
  },
]

const prazosUrgentes = [
  {
    id: 1,
    numero: 'PRC-2024-001',
    descricao: 'Entrega do Laudo Pericial',
    diasRestantes: 3,
    nivel: 'critico' as const,
  },
  {
    id: 2,
    numero: 'PRC-2024-002',
    descricao: 'Resposta aos Quesitos',
    diasRestantes: 8,
    nivel: 'atencao' as const,
  },
  {
    id: 3,
    numero: 'DMD-2024-001',
    descricao: 'Aceite de Demanda Extrajudicial',
    diasRestantes: 2,
    nivel: 'critico' as const,
  },
  {
    id: 4,
    numero: 'PRC-2024-004',
    descricao: 'Vistoria Obrigatória',
    diasRestantes: 10,
    nivel: 'normal' as const,
  },
]

const movimentacoes = [
  {
    id: 1,
    descricao: 'Honorários PRC-2024-003',
    tipo: 'entrada' as const,
    valor: 8000,
    quando: 'Hoje, 09:15',
  },
  {
    id: 2,
    descricao: 'Nova demanda aceita',
    tipo: 'neutro' as const,
    valor: 3500,
    quando: '10 Dez',
  },
  {
    id: 3,
    descricao: 'Honorários PRC-2024-001',
    tipo: 'pendente' as const,
    valor: 4200,
    quando: '08 Dez',
  },
]

const alertas = [
  {
    id: 1,
    texto: 'Nova nomeação recebida',
    sub: 'Proc. 0078901-23.2024 — 7ª Vara Cível',
    tipo: 'nomeacao' as const,
  },
  {
    id: 2,
    texto: 'Demanda expirando em 2 dias',
    sub: 'Seguradora Confiança — Aceite pendente',
    tipo: 'urgente' as const,
  },
  {
    id: 3,
    texto: 'Honorário vencido há 7 dias',
    sub: 'PRC-2024-000 · R$ 15.000',
    tipo: 'financeiro' as const,
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const statusPericia = {
  em_andamento: { label: 'Em andamento', variant: 'info' as const },
  aguardando: { label: 'Aguardando', variant: 'warning' as const },
  concluida: { label: 'Concluída', variant: 'success' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
}

const nivelPrazo = {
  critico: { dot: 'bg-red-500', text: 'text-red-600', border: 'border-red-100', bg: 'bg-red-50' },
  atencao: { dot: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50' },
  normal: { dot: 'bg-blue-400', text: 'text-slate-600', border: 'border-slate-100', bg: 'bg-slate-50' },
}

const movTipo = {
  entrada: { icon: ArrowDownCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', prefix: '+' },
  neutro: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', prefix: '' },
  pendente: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', prefix: '' },
}

const alertaTipo = {
  nomeacao: { icon: BellDot, color: 'text-blue-600', bg: 'bg-blue-50' },
  urgente: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  financeiro: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
}

function rowBorderColor(status: string, dias: number) {
  if (status === 'concluida') return 'border-l-emerald-400'
  if (dias <= 5) return 'border-l-red-400'
  if (dias <= 10) return 'border-l-amber-400'
  return 'border-l-blue-300'
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const pctMes = Math.round((financeiro.recebidoMes / financeiro.metaMes) * 100)
  const ativasCount = periciasAtivas.filter((p) => p.status !== 'concluida').length
  const criticosCount = prazosUrgentes.filter((p) => p.nivel === 'critico').length

  return (
    <div className="space-y-5 pb-4">

      {/* ── Welcome ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Bom dia, Rafael
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Dezembro 2024 · {criticosCount} prazos críticos esta semana
          </p>
        </div>
        <Button size="sm" className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700">
          <Zap className="h-3.5 w-3.5" />
          Nova Perícia
        </Button>
      </div>

      {/* ── Zone 1 — KPIs ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/pericias" className="group">
          <StatsCard
            title="Perícias Ativas"
            value="24"
            description="3 novas esta semana"
            icon={FileText}
            accent="blue"
            trend={{ value: 12, label: 'vs. mês anterior', positive: true }}
            className="h-full cursor-pointer group-hover:shadow-md group-hover:border-blue-200 transition-all"
          />
        </Link>
        <Link href="/demandas" className="group">
          <StatsCard
            title="Demandas Extrajudiciais"
            value="7"
            description="3 aguardando aceite"
            icon={Inbox}
            accent="violet"
            trend={{ value: 40, label: 'crescimento', positive: true }}
            className="h-full cursor-pointer group-hover:shadow-md group-hover:border-violet-200 transition-all"
          />
        </Link>
        <Link href="/visitas" className="group">
          <StatsCard
            title="Visitas Agendadas"
            value="8"
            description="Próximos 7 dias"
            icon={Calendar}
            accent="amber"
            className="h-full cursor-pointer group-hover:shadow-md group-hover:border-amber-200 transition-all"
          />
        </Link>
        <Link href="/alertas-nomeacoes" className="group">
          <StatsCard
            title="Prazos Críticos"
            value={String(criticosCount)}
            description="Próximas 72 horas"
            icon={AlertTriangle}
            accent="rose"
            className="h-full cursor-pointer group-hover:shadow-md group-hover:border-rose-200 transition-all"
          />
        </Link>
      </div>

      {/* ── Zone 2 — Resumo Financeiro ──────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Dark header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Resumo Financeiro</span>
            <span className="text-xs text-slate-400">— Dezembro 2024</span>
          </div>
          <Link
            href="/financeiro"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
          >
            Ver detalhes <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* A Receber */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total a Receber
              </p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(financeiro.aReceber)}
            </p>
            <p className="mt-1.5 text-xs text-slate-400">
              {financeiro.recebimentosAbertos} recebimentos em aberto
            </p>
            <Link
              href="/recebimentos"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Ver recebimentos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Recebido este mês */}
          <div className="px-6 py-5 bg-slate-50/60">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Recebido este Mês
              </p>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-md px-1.5 py-0.5">
                DEZ
              </span>
            </div>
            <p className="text-3xl font-bold text-emerald-600 tabular-nums">
              {formatCurrency(financeiro.recebidoMes)}
            </p>
            <p className="mt-1.5 text-xs text-slate-400">
              {financeiro.originadoresAtivos} originadores ativos
            </p>
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Meta mensal</span>
                <span className="text-[11px] font-bold text-slate-700">{pctMes}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${pctMes}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {formatCurrency(financeiro.recebidoMes)} de {formatCurrency(financeiro.metaMes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Zone 3 — Trabalho Ativo ──────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Perícias */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CardTitle>Perícias em Andamento</CardTitle>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5">
                  {ativasCount}
                </span>
              </div>
              <Link href="/pericias">
                <Button variant="ghost" size="sm" className="text-blue-600 -mr-2 gap-1">
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1">
            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 pl-4 pr-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Processo</span>
              <span className="text-right w-16">Prazo</span>
              <span className="w-28 text-center">Status</span>
            </div>
            <div className="space-y-0.5">
              {periciasAtivas.map((p) => {
                const st = statusPericia[p.status]
                const borderColor = rowBorderColor(p.status, p.diasRestantes)
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'group grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-r-lg border-l-2 pl-3 pr-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer',
                      borderColor
                    )}
                  >
                    {/* Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md',
                        p.status === 'concluida' ? 'bg-emerald-50' : 'bg-blue-50'
                      )}>
                        {p.status === 'concluida' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate leading-tight">
                          {p.assunto}
                        </p>
                        <p className="text-xs text-slate-400 truncate leading-tight">
                          {p.numero} · {p.vara}
                        </p>
                      </div>
                    </div>

                    {/* Prazo */}
                    <div className="flex flex-col items-end w-16">
                      {p.status === 'concluida' ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <>
                          <span className={cn(
                            'text-xs font-bold tabular-nums',
                            p.diasRestantes <= 5 ? 'text-red-600' :
                            p.diasRestantes <= 10 ? 'text-amber-600' : 'text-slate-600'
                          )}>
                            {p.diasRestantes}d
                          </span>
                          <span className="text-[10px] text-slate-400 tabular-nums">{p.prazo}</span>
                        </>
                      )}
                    </div>

                    {/* Status */}
                    <div className="w-28 flex justify-center">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Demandas para Aceitar */}
        <Card className="flex flex-col border-t-[3px] border-t-violet-500">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Para Aceitar</CardTitle>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold px-1.5">
                  {demandasParaAceitar.length}
                </span>
              </div>
              <Link href="/demandas">
                <Button variant="ghost" size="sm" className="text-violet-600 gap-1 -mr-2">
                  Ver <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1 space-y-3">
            {demandasParaAceitar.map((d) => (
              <div
                key={d.id}
                className="group rounded-xl border border-slate-100 p-3.5 hover:border-violet-200 hover:bg-violet-50/40 transition-all cursor-pointer"
              >
                {/* Title + expiry tag */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-slate-900 leading-snug flex-1 group-hover:text-violet-700 transition-colors">
                    {d.titulo}
                  </p>
                  {d.diasParaExpirar <= 3 && (
                    <span className="flex-shrink-0 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-inset ring-red-200">
                      {d.diasParaExpirar}d
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="space-y-1 mb-3">
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Building2 className="h-3 w-3 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{d.originador}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3 w-3 flex-shrink-0 text-slate-400" />
                    {d.cidade}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatCurrency(d.valor)}
                  </span>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                      Ver
                    </Button>
                    <Button size="sm" className="h-7 px-2.5 text-xs bg-violet-600 hover:bg-violet-700">
                      Aceitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Zone 4 — Agenda + Atividade ─────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Próximas Visitas */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Próximas Visitas</CardTitle>
              <Link href="/visitas">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 -mr-2">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {proximasVisitas.map((v) => (
              <div
                key={v.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-all',
                  v.urgente
                    ? 'bg-amber-50 border border-amber-100 hover:bg-amber-100/60'
                    : 'border border-transparent hover:bg-slate-50 hover:border-slate-100'
                )}
              >
                {/* Date pill */}
                <div className={cn(
                  'flex flex-col items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl',
                  v.urgente ? 'bg-amber-100' : 'bg-slate-100'
                )}>
                  <span className={cn(
                    'text-[9px] font-bold uppercase leading-none',
                    v.urgente ? 'text-amber-600' : 'text-slate-500'
                  )}>
                    {v.quando}
                  </span>
                  <span className={cn(
                    'text-sm font-bold tabular-nums mt-0.5',
                    v.urgente ? 'text-amber-700' : 'text-slate-700'
                  )}>
                    {v.hora}
                  </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cn(
                      'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                      v.tipo === 'Vistoria' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
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

        {/* Prazos Críticos */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Prazos Críticos</CardTitle>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 text-red-600 text-[10px] font-bold px-1.5">
                {criticosCount}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {prazosUrgentes.map((p) => {
              const style = nivelPrazo[p.nivel]
              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 border cursor-pointer hover:brightness-[0.97] transition-all',
                    style.bg, style.border
                  )}
                >
                  <div className={cn('h-2 w-2 rounded-full flex-shrink-0', style.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{p.descricao}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.numero}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className={cn('text-base font-bold tabular-nums leading-none', style.text)}>
                      {p.diasRestantes}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">dias</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Atividade — alertas + movimentações unificados */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Atividade</CardTitle>
              <Link href="/alertas-nomeacoes">
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-[10px] font-bold px-1.5 cursor-pointer hover:bg-red-200 transition-colors">
                  {alertas.length}
                </span>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">

            {/* Alertas */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Alertas
            </p>
            <div className="space-y-1.5 mb-4">
              {alertas.map((a) => {
                const conf = alertaTipo[a.tipo]
                const Icon = conf.icon
                return (
                  <div
                    key={a.id}
                    className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className={cn('mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md', conf.bg)}>
                      <Icon className={cn('h-3.5 w-3.5', conf.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{a.texto}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{a.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-slate-100 mb-3" />

            {/* Movimentações */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Financeiro
            </p>
            <div className="space-y-1">
              {movimentacoes.map((m) => {
                const conf = movTipo[m.tipo]
                const Icon = conf.icon
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className={cn('flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full', conf.bg)}>
                      <Icon className={cn('h-3 w-3', conf.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{m.descricao}</p>
                      <p className="text-[10px] text-slate-400">{m.quando}</p>
                    </div>
                    <span className={cn(
                      'text-xs font-semibold tabular-nums flex-shrink-0',
                      m.tipo === 'entrada' ? 'text-emerald-600' :
                      m.tipo === 'pendente' ? 'text-amber-600' : 'text-slate-600'
                    )}>
                      {conf.prefix}{formatCurrency(m.valor)}
                    </span>
                  </div>
                )
              })}
            </div>

            <Link href="/financeiro" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Ver financeiro completo
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

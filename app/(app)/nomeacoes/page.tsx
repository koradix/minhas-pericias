import Link from 'next/link'
import {
  Radar,
  BarChart3,
  Users,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Zap,
  Building2,
  Scale,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EstatisticaVara, NomeacaoPericia } from '@/lib/types/nomeacoes'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Radar de Nomeações' }

// ─── MOCKS ───────────────────────────────────────────────────────────────────

const topVaras: EstatisticaVara[] = [
  { vara: '3ª Vara Cível Central', juiz: 'Dr. Ricardo Almeida', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 47, prioridade: 'ALTA', especialidades: ['Avaliação de Imóvel', 'Perícia Contábil'], ultimaNomeacao: '12/12/2024' },
  { vara: '1ª Vara Empresarial', juiz: 'Dr. Fábio Costa', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 38, prioridade: 'ALTA', especialidades: ['Avaliação de Empresa', 'Perícia Contábil'], ultimaNomeacao: '08/12/2024' },
  { vara: 'TRT-2 — 1ª Turma', juiz: 'Dra. Ana Lima', tribunal: 'TRT-2', comarca: 'São Paulo', totalPericias: 35, prioridade: 'ALTA', especialidades: ['Perícia Trabalhista'], ultimaNomeacao: '10/12/2024' },
  { vara: '5ª Vara Cível', juiz: 'Dr. Marcos Silva', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 28, prioridade: 'MEDIA', especialidades: ['Avaliação de Imóvel'], ultimaNomeacao: '05/12/2024' },
  { vara: '7ª Vara Cível', juiz: 'Dra. Clara Mendes', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 22, prioridade: 'MEDIA', especialidades: ['Avaliação de Imóvel'], ultimaNomeacao: '01/12/2024' },
]

const nomeacoesRecentes: NomeacaoPericia[] = [
  { id: '1', tribunal: 'TJSP', comarca: 'São Paulo', vara: '3ª Vara Cível Central', juiz: 'Dr. Ricardo Almeida', processo: '0078901-23.2024', data: '12/12/2024', especialidade: 'Avaliação de Imóvel' },
  { id: '2', tribunal: 'TRT-2', comarca: 'São Paulo', vara: '1ª Turma', juiz: 'Dra. Ana Lima', processo: '0014523-11.2024', data: '10/12/2024', especialidade: 'Perícia Trabalhista' },
  { id: '3', tribunal: 'TJSP', comarca: 'São Paulo', vara: '1ª Vara Empresarial', juiz: 'Dr. Fábio Costa', processo: '0045678-09.2024', data: '08/12/2024', especialidade: 'Avaliação de Empresa' },
  { id: '4', tribunal: 'TJSP', comarca: 'São Paulo', vara: '5ª Vara Cível', juiz: 'Dr. Marcos Silva', processo: '0098234-15.2024', data: '05/12/2024', especialidade: 'Avaliação de Veículo' },
  { id: '5', tribunal: 'TJSP', comarca: 'São Paulo', vara: '7ª Vara Cível', juiz: 'Dra. Clara Mendes', processo: '0067891-22.2024', data: '01/12/2024', especialidade: 'Avaliação de Imóvel' },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const prioridadeConfig = {
  ALTA: { label: 'Alta', variant: 'danger' as const, bar: 'bg-red-500' },
  MEDIA: { label: 'Média', variant: 'warning' as const, bar: 'bg-amber-500' },
  BAIXA: { label: 'Baixa', variant: 'secondary' as const, bar: 'bg-slate-300' },
}

const maxPericias = Math.max(...topVaras.map((v) => v.totalPericias))

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function NomeacoesPage() {
  const totalPericias = topVaras.reduce((s, v) => s + v.totalPericias, 0)
  const altaPrioridade = topVaras.filter((v) => v.prioridade === 'ALTA').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Radar de Nomeações"
        description="Análise de varas e juízes para orientar sua prospecção"
        actions={
          <Link href="/nomeacoes/estrategia">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
              <Zap className="h-3.5 w-3.5" />
              Gerar Estratégia
            </Button>
          </Link>
        }
      />

      {/* Data source banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-800">Dados de demonstração</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Esta visualização usa dados mockados. A próxima fase integrará com DataJud, APIs de tribunais e Diários da Justiça.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatsCard title="Perícias Detectadas" value={totalPericias} description="Últimos 90 dias" icon={BarChart3} accent="blue" />
        <StatsCard title="Varas Monitoradas" value={topVaras.length} description="São Paulo — SP" icon={Building2} accent="violet" />
        <StatsCard title="Alta Prioridade" value={altaPrioridade} description="Varas para prospectar" icon={TrendingUp} accent="rose" />
      </div>

      {/* Top varas + Recent nomeacoes */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Top varas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Top Varas por Volume</CardTitle>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 text-red-600 text-[10px] font-bold px-1.5">
                  {altaPrioridade}
                </span>
              </div>
              <Link href="/nomeacoes/varas">
                <Button variant="ghost" size="sm" className="text-blue-600 -mr-2 gap-1">
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {topVaras.map((v) => {
              const conf = prioridadeConfig[v.prioridade]
              const pct = Math.round((v.totalPericias / maxPericias) * 100)
              return (
                <div key={v.vara} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{v.vara}</p>
                      <p className="text-[11px] text-slate-400">{v.juiz} · {v.tribunal}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">{v.totalPericias}</span>
                      <Badge variant={conf.variant}>{conf.label}</Badge>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={cn('h-full rounded-full', conf.bar)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent nomeacoes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Últimas Nomeações</CardTitle>
              <Link href="/nomeacoes/varas">
                <Button variant="ghost" size="sm" className="text-blue-600 -mr-2 gap-1">
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-0.5">
              {nomeacoesRecentes.map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-50">
                    <Scale className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{n.vara}</p>
                    <p className="text-[11px] text-slate-400 truncate">{n.juiz} · Proc. {n.processo}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[11px] font-medium text-slate-600">{n.data}</p>
                    <p className="text-[10px] text-slate-400">{n.tribunal}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/nomeacoes/varas', icon: Building2, title: 'Varas', desc: 'Ranking e estatísticas por vara', color: 'bg-blue-50 text-blue-600' },
          { href: '/nomeacoes/juizes', icon: Users, title: 'Juízes', desc: 'Histórico de nomeações por juiz', color: 'bg-violet-50 text-violet-600' },
          { href: '/nomeacoes/estrategia', icon: Radar, title: 'Estratégia', desc: 'Gerar rota de prospecção', color: 'bg-emerald-50 text-emerald-600' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', item.color)}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.desc}</p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

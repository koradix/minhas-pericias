import Link from 'next/link'
import {
  Radar,
  Navigation,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  MapPin,
  Building2,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { BadgeStatus } from '@/components/shared/badge-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EstatisticaVara } from '@/lib/types/nomeacoes'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Estratégia de Prospecção' }

// ─── MOCKS ───────────────────────────────────────────────────────────────────

const varasSugeridas: (EstatisticaVara & { distanciaKm: number; endereco: string })[] = [
  {
    vara: '3ª Vara Cível Central',
    juiz: 'Dr. Ricardo Almeida',
    tribunal: 'TJSP',
    comarca: 'São Paulo',
    totalPericias: 47,
    prioridade: 'ALTA',
    especialidades: ['Avaliação de Imóvel', 'Perícia Contábil'],
    ultimaNomeacao: '12/12/2024',
    distanciaKm: 12,
    endereco: 'Praça João Mendes s/n, Centro',
  },
  {
    vara: '1ª Vara Empresarial',
    juiz: 'Dr. Fábio Costa',
    tribunal: 'TJSP',
    comarca: 'São Paulo',
    totalPericias: 38,
    prioridade: 'ALTA',
    especialidades: ['Avaliação de Empresa', 'Perícia Contábil'],
    ultimaNomeacao: '08/12/2024',
    distanciaKm: 13,
    endereco: 'Praça João Mendes s/n, Centro',
  },
  {
    vara: 'TRT-2 — 1ª Turma',
    juiz: 'Dra. Ana Lima',
    tribunal: 'TRT-2',
    comarca: 'São Paulo',
    totalPericias: 35,
    prioridade: 'ALTA',
    especialidades: ['Perícia Trabalhista'],
    ultimaNomeacao: '10/12/2024',
    distanciaKm: 8,
    endereco: 'Rua Boa Vista, 83, Barra Funda',
  },
  {
    vara: '5ª Vara Cível',
    juiz: 'Dr. Marcos Silva',
    tribunal: 'TJSP',
    comarca: 'São Paulo',
    totalPericias: 28,
    prioridade: 'MEDIA',
    especialidades: ['Avaliação de Imóvel'],
    ultimaNomeacao: '05/12/2024',
    distanciaKm: 18,
    endereco: 'Av. Liberdade, 350, Liberdade',
  },
  {
    vara: '7ª Vara Cível',
    juiz: 'Dra. Clara Mendes',
    tribunal: 'TJSP',
    comarca: 'São Paulo',
    totalPericias: 22,
    prioridade: 'MEDIA',
    especialidades: ['Avaliação de Imóvel'],
    ultimaNomeacao: '01/12/2024',
    distanciaKm: 20,
    endereco: 'Av. Rangel Pestana, 200, Brás',
  },
]

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function EstrategiaPage() {
  const altaCount = varasSugeridas.filter((v) => v.prioridade === 'ALTA').length
  const kmTotal = varasSugeridas.reduce((s, v) => s + v.distanciaKm, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estratégia de Prospecção"
        description="Varas prioritárias para visitas presenciais com base no volume de nomeações"
        actions={
          <Link href="/rotas/prospeccao">
            <Button size="sm" className="bg-brand-500 hover:bg-lime-600 text-foreground font-semibold">
              <Navigation className="h-3.5 w-3.5" />
              Ver Rotas Criadas
            </Button>
          </Link>
        }
      />

      {/* Flow visualization */}
      <div className="rounded-xl border border-border bg-card shadow-saas p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-4">Como funciona</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { icon: Radar,         label: 'Radar monitora varas',   bg: 'bg-brand-500/10',    color: 'text-brand-500'    },
            { icon: AlertTriangle, label: 'Classifica prioridade',  bg: 'bg-amber-50',   color: 'text-amber-600'  },
            { icon: Navigation,    label: 'Gera rota sugerida',     bg: 'bg-zinc-900/50',  color: 'text-zinc-400'  },
            { icon: CheckCircle2,  label: 'Você planeja a visita',  bg: 'bg-emerald-50', color: 'text-emerald-600'},
          ].map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.label} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-slate-200 flex-shrink-0" />}
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2">
                  <div className={cn('flex h-6 w-6 items-center justify-center rounded-lg flex-shrink-0', step.bg)}>
                    <Icon className={cn('h-3 w-3', step.color)} />
                  </div>
                  <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">{step.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-saas">
          <p className="text-xs font-medium text-zinc-400 mb-1">Varas Sugeridas</p>
          <p className="text-2xl font-semibold text-foreground tabular-nums">{varasSugeridas.length}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{altaCount} de alta prioridade</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-saas">
          <p className="text-xs font-medium text-zinc-400 mb-1">Distância Total Estimada</p>
          <p className="text-2xl font-semibold text-foreground tabular-nums">{kmTotal} km</p>
          <p className="text-xs text-zinc-500 mt-0.5">Rota otimizada sugerida</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-saas">
          <p className="text-xs font-medium text-zinc-400 mb-1">Período Sugerido</p>
          <p className="text-2xl font-semibold text-foreground">Jan 2025</p>
          <p className="text-xs text-zinc-500 mt-0.5">1 dia de prospecção</p>
        </div>
      </div>

      {/* Vara selection */}
      <Card className="rounded-xl border-border shadow-saas">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Varas Prioritárias</CardTitle>
              <p className="text-xs text-zinc-500 mt-1">Selecione as varas para incluir na rota de prospecção</p>
            </div>
            <Button size="sm" className="bg-brand-500 hover:bg-lime-600 text-foreground font-semibold">
              <Zap className="h-3.5 w-3.5" />
              Gerar Rota
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2 space-y-3">
          {varasSugeridas.map((v, i) => (
            <div
              key={v.vara}
              className={cn(
                'flex items-start gap-4 rounded-xl border p-4 hover:bg-muted/60 transition-all cursor-pointer',
                v.prioridade === 'ALTA'  ? 'border-brand-500/30  bg-brand-500/10/20'   :
                v.prioridade === 'MEDIA' ? 'border-amber-100 bg-amber-50/10'  :
                'border-border'
              )}
            >
              {/* Rank */}
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-card border border-border text-xs font-medium text-zinc-500">
                {i + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground">{v.vara}</p>
                  <BadgeStatus status={v.prioridade.toLowerCase()} />
                </div>
                <p className="text-xs text-zinc-400">{v.juiz} · {v.tribunal}</p>
                <p className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                  <MapPin className="h-3 w-3" />
                  {v.endereco}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(v.especialidades ?? []).map((e) => (
                    <span key={e} className="inline-flex items-center rounded-md bg-card border border-border px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex-shrink-0 text-right">
                <p className="text-lg font-bold text-foreground tabular-nums">{v.totalPericias}</p>
                <p className="text-[10px] text-zinc-500">perícias/ano</p>
                <p className="text-xs text-zinc-400 mt-1 tabular-nums">{v.distanciaKm} km</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/10/40 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-brand-500" />
              <p className="text-sm font-semibold text-foreground">Rota de Prospecção Sugerida</p>
            </div>
            <p className="text-xs text-zinc-400">
              Com base nas {altaCount} varas de alta prioridade, sugerimos uma rota de {kmTotal} km
              cobrindo o Fórum João Mendes, TRT-2 e demais varas prioritárias em um único dia.
            </p>
          </div>
          <Link href="/rotas/prospeccao" className="flex-shrink-0">
            <Button size="sm" className="bg-brand-500 hover:bg-lime-600 text-foreground font-semibold whitespace-nowrap">
              Criar Rota <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

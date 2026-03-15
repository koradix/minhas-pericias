import Link from 'next/link'
import {
  MapPin,
  Clock,
  Banknote,
  ChevronRight,
  Plus,
  Briefcase,
  Landmark,
  Building2,
  Navigation,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import type { Rota, TipoPontoRota } from '@/lib/types/rotas'
import type { Metadata } from 'next'
import RouteMapDynamic from '@/components/maps/route-map-dynamic'

export const metadata: Metadata = { title: 'Rotas de Prospecção' }

// ─── MOCKS ───────────────────────────────────────────────────────────────────

const rotas: Rota[] = [
  {
    id: 'RT-001',
    tipo: 'PROSPECCAO',
    titulo: 'Circuito Centro — Fórum João Mendes',
    data: '16/12/2024',
    status: 'planejada',
    distanciaKm: 18,
    tempoEstimadoMin: 90,
    custoEstimado: 45,
    pontos: [
      { id: 'P1', rotaId: 'RT-001', nome: 'Fórum João Mendes', latitude: -23.548, longitude: -46.636, tipo: 'FORUM', ordem: 1, endereco: 'Praça João Mendes s/n, Centro' },
      { id: 'P2', rotaId: 'RT-001', nome: '1ª Vara Cível Central', latitude: -23.547, longitude: -46.637, tipo: 'VARA_CIVEL', ordem: 2, endereco: 'Praça João Mendes s/n, Centro' },
      { id: 'P3', rotaId: 'RT-001', nome: '3ª Vara Cível Central', latitude: -23.546, longitude: -46.638, tipo: 'VARA_CIVEL', ordem: 3, endereco: 'Praça João Mendes s/n, Centro' },
      { id: 'P4', rotaId: 'RT-001', nome: 'Lima & Associados', latitude: -23.560, longitude: -46.650, tipo: 'ESCRITORIO', ordem: 4, endereco: 'Av. Paulista, 1000' },
    ],
  },
  {
    id: 'RT-002',
    tipo: 'PROSPECCAO',
    titulo: 'Zona Sul — Circuito Seguradoras',
    data: '19/12/2024',
    status: 'planejada',
    distanciaKm: 31,
    tempoEstimadoMin: 150,
    custoEstimado: 78,
    pontos: [
      { id: 'P5', rotaId: 'RT-002', nome: 'Seguradora Confiança', latitude: -23.610, longitude: -46.680, tipo: 'ESCRITORIO', ordem: 1, endereco: 'Av. das Nações, 500' },
      { id: 'P6', rotaId: 'RT-002', nome: 'Porto Seguro — Sede', latitude: -23.630, longitude: -46.700, tipo: 'ESCRITORIO', ordem: 2, endereco: 'Rua Gomes de Carvalho, 1000' },
      { id: 'P7', rotaId: 'RT-002', nome: 'Liberty Seguros', latitude: -23.620, longitude: -46.690, tipo: 'ESCRITORIO', ordem: 3, endereco: 'Av. Ibirapuera, 2315' },
    ],
  },
  {
    id: 'RT-003',
    tipo: 'PROSPECCAO',
    titulo: 'Lapa-Barra Funda — TRT e Varas Trabalhistas',
    data: '05/12/2024',
    status: 'concluida',
    distanciaKm: 22,
    tempoEstimadoMin: 120,
    custoEstimado: 55,
    pontos: [
      { id: 'P8', rotaId: 'RT-003', nome: 'TRT-2', latitude: -23.525, longitude: -46.675, tipo: 'FORUM', ordem: 1, endereco: 'Rua Boa Vista, 83, Barra Funda' },
      { id: 'P9', rotaId: 'RT-003', nome: '4ª Vara Trabalhista', latitude: -23.524, longitude: -46.674, tipo: 'VARA_CIVEL', ordem: 2, endereco: 'Rua Boa Vista, 83' },
      { id: 'P10', rotaId: 'RT-003', nome: 'Dra. Ana Carvalho — Advocacia', latitude: -23.530, longitude: -46.660, tipo: 'ESCRITORIO', ordem: 3, endereco: 'Rua Lapa, 180' },
    ],
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const statusMap = {
  planejada: { label: 'Planejada', variant: 'info' as const },
  em_execucao: { label: 'Em execução', variant: 'warning' as const },
  concluida: { label: 'Concluída', variant: 'success' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
}

const pontoConfig: Record<TipoPontoRota, { icon: typeof MapPin; color: string; bg: string; label: string }> = {
  FORUM: { icon: Building2, color: 'text-blue-700', bg: 'bg-blue-50', label: 'Fórum' },
  VARA_CIVEL: { icon: Landmark, color: 'text-violet-700', bg: 'bg-violet-50', label: 'Vara' },
  ESCRITORIO: { icon: Briefcase, color: 'text-amber-700', bg: 'bg-amber-50', label: 'Escritório' },
  PERICIA: { icon: MapPin, color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Perícia' },
}

function formatTempo(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function RotasProspeccaoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rotas de Prospecção"
        description="Roteiros para visitar fóruns, varas cíveis e escritórios de advocacia"
        actions={
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            Nova Rota
          </Button>
        }
      />

      {/* Mapa real */}
      <div className="h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <RouteMapDynamic
          routes={rotas.map((r) => ({ id: r.id, pontos: r.pontos }))}
        />
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        {Object.entries(pontoConfig).map(([tipo, conf]) => {
          const Icon = conf.icon
          return (
            <span key={tipo} className="flex items-center gap-1.5">
              <Icon className={cn('h-3.5 w-3.5', conf.color)} />
              {conf.label}
            </span>
          )
        })}
      </div>

      {/* Route cards */}
      <div className="space-y-4">
        {rotas.map((rota) => {
          const st = statusMap[rota.status]
          return (
            <Card key={rota.id} className={rota.status === 'concluida' ? 'opacity-70' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <span className="text-xs text-slate-400">{rota.data}</span>
                    </div>
                    <CardTitle className="text-base">{rota.titulo}</CardTitle>
                  </div>
                  {rota.status === 'planejada' && (
                    <Button size="sm" className="flex-shrink-0 bg-violet-600 hover:bg-violet-700">
                      <Navigation className="h-3.5 w-3.5" />
                      Iniciar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Pontos */}
                <div className="mb-4 space-y-1.5">
                  {rota.pontos.map((p) => {
                    const conf = pontoConfig[p.tipo]
                    const Icon = conf.icon
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md" style={{ background: 'transparent' }}>
                          <span className={cn('text-[10px] font-bold text-slate-400')}>{p.ordem}</span>
                        </div>
                        <div className={cn('flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md', conf.bg)}>
                          <Icon className={cn('h-3 w-3', conf.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-800">{p.nome}</p>
                          {p.endereco && <p className="text-[10px] text-slate-400">{p.endereco}</p>}
                        </div>
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', conf.bg, conf.color)}>
                          {conf.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-5 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {rota.distanciaKm} km
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {formatTempo(rota.tempoEstimadoMin)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-slate-400" />
                    {formatCurrency(rota.custoEstimado)}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    {rota.pontos.length} paradas
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-center">
        <Link href="/rotas/historico">
          <Button variant="outline" size="sm">
            Ver histórico completo <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

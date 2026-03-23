import Link from 'next/link'
import {
  Navigation,
  MapPin,
  Clock,
  Banknote,
  ChevronRight,
  Plus,
  Briefcase,
  Landmark,
  FileText,
  Building2,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import type { Rota, TipoPontoRota } from '@/lib/types/rotas'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Rotas' }

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
      { id: 'P1', rotaId: 'RT-001', nome: 'Fórum João Mendes', latitude: -23.548, longitude: -46.636, tipo: 'FORUM', ordem: 1, endereco: 'Praça João Mendes s/n, Centro', tribunalSigla: 'TJSP', varaNome: 'Fórum João Mendes' },
      { id: 'P2', rotaId: 'RT-001', nome: '1ª Vara Cível Central', latitude: -23.547, longitude: -46.637, tipo: 'VARA_CIVEL', ordem: 2, endereco: 'Praça João Mendes s/n, Centro', tribunalSigla: 'TJSP', varaNome: '1ª Vara Cível Central' },
      { id: 'P3', rotaId: 'RT-001', nome: '3ª Vara Cível Central', latitude: -23.546, longitude: -46.638, tipo: 'VARA_CIVEL', ordem: 3, endereco: 'Praça João Mendes s/n, Centro', tribunalSigla: 'TJSP', varaNome: '3ª Vara Cível Central' },
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
    id: 'RT-004',
    tipo: 'PERICIA',
    titulo: 'Vistoria PRC-2024-001 e PRC-2024-004',
    data: '13/12/2024',
    status: 'em_execucao',
    distanciaKm: 24,
    tempoEstimadoMin: 180,
    custoEstimado: 60,
    pontos: [
      { id: 'P11', rotaId: 'RT-004', nome: 'Imóvel PRC-2024-001', latitude: -23.570, longitude: -46.660, tipo: 'PERICIA', ordem: 1, endereco: 'Rua das Flores, 123, Jardins', pericoId: '1' },
      { id: 'P12', rotaId: 'RT-004', nome: 'Estabelecimento PRC-2024-004', latitude: -23.575, longitude: -46.655, tipo: 'PERICIA', ordem: 2, endereco: 'Av. Paulista, 1000', pericoId: '4' },
    ],
  },
  {
    id: 'RT-005',
    tipo: 'PERICIA',
    titulo: 'Vistoria PRC-2024-006 — Centro',
    data: '18/12/2024',
    status: 'planejada',
    distanciaKm: 11,
    tempoEstimadoMin: 90,
    custoEstimado: 30,
    pontos: [
      { id: 'P13', rotaId: 'RT-005', nome: 'Local PRC-2024-006', latitude: -23.548, longitude: -46.636, tipo: 'PERICIA', ordem: 1, endereco: 'Rua do Comércio, 45, Centro', pericoId: '6' },
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

const pontoIcons: Record<TipoPontoRota, { icon: typeof MapPin; color: string; bg: string }> = {
  FORUM: { icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
  VARA_CIVEL: { icon: Landmark, color: 'text-violet-600', bg: 'bg-violet-50' },
  ESCRITORIO: { icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
  PERICIA: { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

function formatTempo(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function RotasPage() {
  const planejadas = rotas.filter((r) => r.status === 'planejada').length
  const kmTotal = rotas.filter((r) => r.status !== 'cancelada').reduce((s, r) => s + r.distanciaKm, 0)
  const custoTotal = rotas.filter((r) => r.status !== 'cancelada').reduce((s, r) => s + r.custoEstimado, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rotas"
        description="Planejamento de rotas de prospecção e execução de perícias"
        actions={
          <Link href="/rotas/prospeccao">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Nova Rota
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatsCard title="Rotas Planejadas" value={planejadas} description="Este mês" icon={Navigation} accent="blue" />
        <StatsCard title="Km Planejados" value={`${kmTotal} km`} description="Todas as rotas ativas" icon={MapPin} accent="violet" />
        <StatsCard title="Custo Estimado" value={formatCurrency(custoTotal)} description="Combustível e deslocamento" icon={Banknote} accent="amber" />
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/rotas/prospeccao"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-violet-200 transition-all group"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 group-hover:bg-violet-100 transition-colors">
            <Landmark className="h-5 w-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Rotas de Prospecção</p>
            <p className="text-xs text-zinc-400 mt-0.5">Fóruns, varas cíveis e escritórios</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-zinc-600 group-hover:text-violet-500 transition-colors" />
        </Link>

        <Link
          href="/rotas/pericias"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-emerald-200 transition-all group"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
            <FileText className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Rotas de Perícias</p>
            <p className="text-xs text-zinc-400 mt-0.5">Vistorias e diligências agendadas</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
        </Link>
      </div>

      {/* Route list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Próximas Rotas</CardTitle>
            <Link href="/rotas/historico">
              <Button variant="ghost" size="sm" className="text-blue-600 -mr-2 gap-1">
                Histórico <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {rotas.filter((r) => r.status !== 'concluida' && r.status !== 'cancelada').map((rota) => {
            const st = statusMap[rota.status]
            return (
              <div key={rota.id} className="rounded-xl border border-border p-4 hover:border-border hover:bg-muted/50 transition-all cursor-pointer">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold',
                        rota.tipo === 'PROSPECCAO' ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'
                      )}>
                        {rota.tipo === 'PROSPECCAO' ? 'Prospecção' : 'Perícia'}
                      </span>
                      <span className="text-xs text-zinc-500">{rota.data}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{rota.titulo}</p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>

                {/* Points */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {rota.pontos.map((p, i) => {
                    const conf = pontoIcons[p.tipo]
                    const Icon = conf.icon
                    return (
                      <div key={p.id} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="h-3 w-3 text-zinc-600 flex-shrink-0" />}
                        <span className={cn('flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium', conf.bg, conf.color)}>
                          <Icon className="h-2.5 w-2.5" />
                          {p.nome}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-zinc-400 pt-2.5 border-t border-border">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-zinc-500" />
                    {rota.distanciaKm} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-zinc-500" />
                    {formatTempo(rota.tempoEstimadoMin)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Banknote className="h-3 w-3 text-zinc-500" />
                    {formatCurrency(rota.custoEstimado)}
                  </span>
                  <Link href={rota.tipo === 'PROSPECCAO' ? '/rotas/prospeccao' : '/rotas/pericias'}>
                    <Button size="sm" variant="outline" className="ml-auto h-7 text-xs">
                      Ver detalhes
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
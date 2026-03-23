import { MapPin, Clock, Banknote, Briefcase, Landmark, Building2, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import type { Rota, TipoPontoRota } from '@/lib/types/rotas'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Histórico de Rotas' }

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
      { id: 'P1', rotaId: 'RT-001', nome: 'Fórum João Mendes', latitude: -23.548, longitude: -46.636, tipo: 'FORUM', ordem: 1 },
      { id: 'P2', rotaId: 'RT-001', nome: '1ª Vara Cível', latitude: -23.547, longitude: -46.637, tipo: 'VARA_CIVEL', ordem: 2 },
      { id: 'P3', rotaId: 'RT-001', nome: '3ª Vara Cível', latitude: -23.546, longitude: -46.638, tipo: 'VARA_CIVEL', ordem: 3 },
      { id: 'P4', rotaId: 'RT-001', nome: 'Lima & Associados', latitude: -23.560, longitude: -46.650, tipo: 'ESCRITORIO', ordem: 4 },
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
      { id: 'P5', rotaId: 'RT-002', nome: 'Seguradora Confiança', latitude: -23.610, longitude: -46.680, tipo: 'ESCRITORIO', ordem: 1 },
      { id: 'P6', rotaId: 'RT-002', nome: 'Porto Seguro', latitude: -23.630, longitude: -46.700, tipo: 'ESCRITORIO', ordem: 2 },
      { id: 'P7', rotaId: 'RT-002', nome: 'Liberty Seguros', latitude: -23.620, longitude: -46.690, tipo: 'ESCRITORIO', ordem: 3 },
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
      { id: 'P8', rotaId: 'RT-003', nome: 'TRT-2', latitude: -23.525, longitude: -46.675, tipo: 'FORUM', ordem: 1 },
      { id: 'P9', rotaId: 'RT-003', nome: '4ª Vara Trabalhista', latitude: -23.524, longitude: -46.674, tipo: 'VARA_CIVEL', ordem: 2 },
      { id: 'P10', rotaId: 'RT-003', nome: 'Dra. Ana Carvalho', latitude: -23.530, longitude: -46.660, tipo: 'ESCRITORIO', ordem: 3 },
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
      { id: 'P11', rotaId: 'RT-004', nome: 'Imóvel PRC-2024-001', latitude: -23.570, longitude: -46.660, tipo: 'PERICIA', ordem: 1 },
      { id: 'P12', rotaId: 'RT-004', nome: 'Estabelecimento PRC-2024-004', latitude: -23.575, longitude: -46.655, tipo: 'PERICIA', ordem: 2 },
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
      { id: 'P13', rotaId: 'RT-005', nome: 'Local PRC-2024-006', latitude: -23.548, longitude: -46.636, tipo: 'PERICIA', ordem: 1 },
    ],
  },
  {
    id: 'RT-006',
    tipo: 'PERICIA',
    titulo: 'Diligência PRC-2024-002 — TRT-2',
    data: '28/11/2024',
    status: 'concluida',
    distanciaKm: 16,
    tempoEstimadoMin: 120,
    custoEstimado: 40,
    pontos: [
      { id: 'P14', rotaId: 'RT-006', nome: 'TRT-2 — Entrevista', latitude: -23.525, longitude: -46.675, tipo: 'PERICIA', ordem: 1 },
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

const pontoIcons: Record<TipoPontoRota, typeof MapPin> = {
  FORUM: Building2,
  VARA_CIVEL: Landmark,
  ESCRITORIO: Briefcase,
  PERICIA: FileText,
}

const pontoColors: Record<TipoPontoRota, string> = {
  FORUM: 'text-blue-500',
  VARA_CIVEL: 'text-violet-500',
  ESCRITORIO: 'text-amber-500',
  PERICIA: 'text-emerald-500',
}

function formatTempo(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function RotasHistoricoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de Rotas"
        description="Todas as rotas planejadas e executadas"
      />

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Rota</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tipo</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Data</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Paradas</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Km</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tempo</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Custo</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rotas.map((rota) => {
                const st = statusMap[rota.status]
                return (
                  <tr key={rota.id} className="hover:bg-muted transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground max-w-xs truncate">{rota.titulo}</p>
                      <p className="text-xs text-zinc-500">{rota.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold',
                        rota.tipo === 'PROSPECCAO' ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'
                      )}>
                        {rota.tipo === 'PROSPECCAO' ? 'Prospecção' : 'Perícia'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{rota.data}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {rota.pontos.slice(0, 4).map((p) => {
                          const Icon = pontoIcons[p.tipo]
                          return <Icon key={p.id} className={cn('h-3.5 w-3.5', pontoColors[p.tipo])} />
                        })}
                        {rota.pontos.length > 4 && (
                          <span className="text-[10px] text-zinc-500">+{rota.pontos.length - 4}</span>
                        )}
                        <span className="ml-1 text-xs text-zinc-500">{rota.pontos.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-medium text-zinc-300 tabular-nums">{rota.distanciaKm} km</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-zinc-400 tabular-nums">{formatTempo(rota.tempoEstimadoMin)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-semibold text-zinc-300 tabular-nums">{formatCurrency(rota.custoEstimado)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/80">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-zinc-400">Total</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-zinc-300 tabular-nums">
                  {rotas.reduce((s, r) => s + r.distanciaKm, 0)} km
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-zinc-300 tabular-nums">
                  {formatTempo(rotas.reduce((s, r) => s + r.tempoEstimadoMin, 0))}
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-zinc-300 tabular-nums">
                  {formatCurrency(rotas.reduce((s, r) => s + r.custoEstimado, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

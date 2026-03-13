import Link from 'next/link'
import {
  Map,
  MapPin,
  Clock,
  Banknote,
  ChevronRight,
  Plus,
  FileText,
  Navigation,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import type { Rota } from '@/lib/types/rotas'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Rotas de Perícias' }

// ─── MOCKS ───────────────────────────────────────────────────────────────────

const rotas: Rota[] = [
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
      { id: 'P11', rotaId: 'RT-004', nome: 'Imóvel PRC-2024-001 — Jardins', latitude: -23.570, longitude: -46.660, tipo: 'PERICIA', ordem: 1, endereco: 'Rua das Flores, 123, Jardins' },
      { id: 'P12', rotaId: 'RT-004', nome: 'Estabelecimento PRC-2024-004 — Bela Vista', latitude: -23.575, longitude: -46.655, tipo: 'PERICIA', ordem: 2, endereco: 'Av. Paulista, 1000, Bela Vista' },
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
      { id: 'P13', rotaId: 'RT-005', nome: 'Local Perícia PRC-2024-006', latitude: -23.548, longitude: -46.636, tipo: 'PERICIA', ordem: 1, endereco: 'Rua do Comércio, 45, Centro' },
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
      { id: 'P14', rotaId: 'RT-006', nome: 'TRT-2 — Entrevista Testemunha', latitude: -23.525, longitude: -46.675, tipo: 'PERICIA', ordem: 1, endereco: 'Rua Boa Vista, 83, Barra Funda' },
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

function formatTempo(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function RotasPericiasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rotas de Perícias"
        description="Roteiros para vistorias, diligências e coleta de documentos"
        actions={
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            Nova Rota
          </Button>
        }
      />

      {/* Map placeholder */}
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 mb-3">
          <Map className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Visualização de Mapa</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Integração com OpenStreetMap prevista para a próxima fase. Os locais de vistoria serão exibidos no mapa.
        </p>
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
                    <Button size="sm" className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700">
                      <Navigation className="h-3.5 w-3.5" />
                      Iniciar
                    </Button>
                  )}
                  {rota.status === 'em_execucao' && (
                    <Badge variant="warning" className="flex-shrink-0">Em campo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Pontos */}
                <div className="mb-4 space-y-2">
                  {rota.pontos.map((p) => (
                    <div key={p.id} className="flex items-start gap-3 rounded-lg bg-emerald-50/60 border border-emerald-100 p-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <FileText className="h-3 w-3 text-emerald-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-emerald-900">{p.nome}</p>
                        {p.endereco && (
                          <p className="flex items-center gap-1 text-[11px] text-emerald-700 mt-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {p.endereco}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 rounded px-1.5 py-0.5">
                        Parada {p.ordem}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-5 text-xs text-slate-500">
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

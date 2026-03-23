import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import type { Rota } from '@/lib/types/rotas'
import type { Metadata } from 'next'
import RouteMapDynamic from '@/components/maps/route-map-dynamic'
import { RotasPericiasListClient } from '@/components/rotas/rotas-pericias-list'

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

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function RotasPericiasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rotas de Perícias"
        description="Roteiros para vistorias, diligências e coleta de documentos"
        actions={
          <Link href="/rotas/nova?tipo=PERICIA">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Nova Rota
            </Button>
          </Link>
        }
      />

      {/* Mapa real */}
      <div className="isolate h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <RouteMapDynamic
          routes={rotas.map((r) => ({ id: r.id, pontos: r.pontos }))}
        />
      </div>

      {/* Route cards — client (Iniciar button triggers em_execucao) */}
      <RotasPericiasListClient rotas={rotas} />

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

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import RouteMapDynamic from '@/components/maps/route-map-dynamic'
import { RotasPericiasListClient } from '@/components/rotas/rotas-pericias-list'
import { getRotasPericiasByPerito } from '@/lib/data/rotas'
import type { Metadata } from 'next'
import type { Rota } from '@/lib/types/rotas'

export const metadata: Metadata = { title: 'Rotas de Péricias' }

// ─── Rotas demo (visíveis quando DB vazio — para teste de câmera/checkpoint) ──

const DEMO_ROTAS: Rota[] = [
  {
    id: 'demo-rota-rj-1',
    tipo: 'PERICIA',
    titulo: 'Circuito Centro RJ — Perícias do dia',
    data: new Date().toLocaleDateString('pt-BR'),
    status: 'planejada',
    distanciaKm: 18,
    tempoEstimadoMin: 120,
    custoEstimado: 60,
    pontos: [
      {
        id: 'demo-cp-1',
        rotaId: 'demo-rota-rj-1',
        nome: 'PRC-2024-001 — Avaliação de Imóvel · Botafogo',
        latitude: -22.9388,
        longitude: -43.1822,
        tipo: 'PERICIA',
        ordem: 1,
        endereco: 'Rua São Clemente 450, Botafogo — Rio de Janeiro, RJ',
        pericoId: '1',
        statusCheckpoint: 'pendente',
      },
      {
        id: 'demo-cp-2',
        rotaId: 'demo-rota-rj-1',
        nome: 'PRC-2024-003 — Danos ao Imóvel · Centro',
        latitude: -22.9041,
        longitude: -43.1789,
        tipo: 'PERICIA',
        ordem: 2,
        endereco: 'Av. Rio Branco 85, Centro — Rio de Janeiro, RJ',
        pericoId: '3',
        statusCheckpoint: 'pendente',
      },
      {
        id: 'demo-cp-3',
        rotaId: 'demo-rota-rj-1',
        nome: 'PRC-2024-004 — Acidente de Trânsito · Niterói',
        latitude: -22.8998,
        longitude: -43.1769,
        tipo: 'PERICIA',
        ordem: 3,
        endereco: 'Rua Visconde do Rio Branco 123, Centro — Niterói, RJ',
        pericoId: '4',
        statusCheckpoint: 'pendente',
      },
    ],
  },
  {
    id: 'demo-rota-rj-2',
    tipo: 'PERICIA',
    titulo: 'Baixada Fluminense — Vistorias',
    data: new Date().toLocaleDateString('pt-BR'),
    status: 'planejada',
    distanciaKm: 35,
    tempoEstimadoMin: 180,
    custoEstimado: 90,
    pontos: [
      {
        id: 'demo-cp-4',
        rotaId: 'demo-rota-rj-2',
        nome: 'PRC-2024-006 — Acidente de Trabalho · Duque de Caxias',
        latitude: -22.7736,
        longitude: -43.3133,
        tipo: 'PERICIA',
        ordem: 1,
        endereco: 'Rua Brigadeiro Neco Menezes 1520, Centro — Duque de Caxias, RJ',
        pericoId: '6',
        statusCheckpoint: 'pendente',
      },
      {
        id: 'demo-cp-5',
        rotaId: 'demo-rota-rj-2',
        nome: 'PRC-2024-007 — Avaliação de Empresa · Nova Iguaçu',
        latitude: -22.7575,
        longitude: -43.4523,
        tipo: 'PERICIA',
        ordem: 2,
        endereco: 'Rua Getúlio Vargas 333, Centro — Nova Iguaçu, RJ',
        pericoId: '7',
        statusCheckpoint: 'pendente',
      },
    ],
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RotasPericiasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const dbRotas = await getRotasPericiasByPerito(session.user.id).catch(() => [])

  // Se não há rotas no banco, mostra rotas demo para teste de funcionalidade
  const rotas = dbRotas.length > 0 ? dbRotas : DEMO_ROTAS

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rotas de Péricias"
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

      {dbRotas.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <span className="text-base">🧪</span>
          <span>
            <strong>Modo demo</strong> — Rotas fictícias do RJ para teste de checkpoint e câmera.
            Fotos e notas funcionam na sessão mas não são persistidas.
          </span>
        </div>
      )}

      {/* Mapa */}
      <div className="isolate h-[360px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <RouteMapDynamic
          routes={rotas.map((r) => ({ id: r.id, pontos: r.pontos }))}
        />
      </div>

      {/* Route cards */}
      <RotasPericiasListClient rotas={rotas} />
    </div>
  )
}

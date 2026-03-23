import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, Plus, Building2, Landmark, Briefcase, MapPin, TrendingUp, AlertCircle } from 'lucide-react'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Rota, TipoPontoRota } from '@/lib/types/rotas'
import type { Metadata } from 'next'
import RouteMapDynamic from '@/components/maps/route-map-dynamic'
import { RotasProspeccaoListClient } from '@/components/rotas/rotas-prospeccao-list'
import { getVarasByPerito } from '@/lib/data/varas'
import { SincronizarVarasBtn } from '@/components/rotas/sincronizar-varas-btn'
import { VarasByState } from '@/components/rotas/varas-by-state'

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

// ─── Config ───────────────────────────────────────────────────────────────────

const pontoConfig: Record<TipoPontoRota, { icon: typeof MapPin; color: string; bg: string; label: string }> = {
  FORUM:      { icon: Building2, color: 'text-blue-700',   bg: 'bg-blue-50',   label: 'Fórum'      },
  VARA_CIVEL: { icon: Landmark,  color: 'text-violet-700', bg: 'bg-violet-50', label: 'Vara'       },
  ESCRITORIO: { icon: Briefcase, color: 'text-amber-700',  bg: 'bg-amber-50',  label: 'Escritório' },
  PERICIA:    { icon: MapPin,    color: 'text-emerald-700',bg: 'bg-emerald-50',label: 'Perícia'    },
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function RotasProspeccaoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  let varas: Awaited<ReturnType<typeof getVarasByPerito>> = []
  try {
    varas = await getVarasByPerito(userId)
  } catch {
    // DB error — render page with empty varas instead of crashing
  }
  const comNomeacoes = varas.filter((v) => v.totalNomeacoes > 0).length
  const semNomeacoes = varas.filter((v) => v.totalNomeacoes === 0).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rotas de Prospecção"
        description="Roteiros para visitar fóruns, varas cíveis e escritórios de advocacia"
        actions={
          <Link href="/rotas/nova">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Nova Rota
            </Button>
          </Link>
        }
      />

      {/* ── Varas do Radar ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">

        {/* header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Varas do Radar
              {varas.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-100 px-1.5 text-[10px] font-bold text-lime-700">
                  {varas.length}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Varas sincronizadas do seu radar de nomeações</p>
          </div>
          <SincronizarVarasBtn />
        </div>

        {varas.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 px-4 py-4">
            <AlertCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-600">Nenhuma vara sincronizada</p>
              <p className="text-xs text-slate-400">Configure tribunais no cadastro e clique em &quot;Sincronizar varas&quot;</p>
            </div>
            <Link href="/nomeacoes" className="ml-auto text-xs text-lime-600 hover:text-lime-700 font-medium whitespace-nowrap">
              Ir ao Radar →
            </Link>
          </div>
        ) : (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: varas.length,   color: 'bg-slate-50  text-slate-700'  },
                { label: 'Com nomeações', value: comNomeacoes, color: 'bg-lime-50   text-lime-700'   },
                { label: 'Para prospectar', value: semNomeacoes, color: 'bg-amber-50  text-amber-700'  },
              ].map((k) => (
                <div key={k.label} className={cn('rounded-xl px-3 py-2.5 text-center', k.color)}>
                  <p className="text-lg font-bold tabular-nums">{k.value}</p>
                  <p className="text-[10px] font-medium mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Vara list */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {varas.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:border-slate-200 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50">
                    <Landmark className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{v.varaNome}</p>
                    <p className="text-[10px] text-slate-400">{v.tribunalSigla}{v.uf ? ` · ${v.uf}` : ''}</p>
                  </div>
                  {v.totalNomeacoes > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-lime-700 bg-lime-50 rounded-md px-1.5 py-0.5 flex-shrink-0">
                      <TrendingUp className="h-3 w-3" />
                      {v.totalNomeacoes}
                    </span>
                  )}
                  <Link href={`/rotas/nova?vara=${encodeURIComponent(v.varaNome)}&tribunal=${v.tribunalSigla}&uf=${v.uf ?? ''}`}>
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs flex-shrink-0 border-slate-200 text-slate-600 hover:border-lime-400 hover:text-lime-700">
                      <Plus className="h-3 w-3" />
                      Criar Rota
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Varas por Estado (Escavador FREE) ──────────────────────────────── */}
      <VarasByState
        varasDoPerito={varas.map((v) => ({
          id: v.id,
          tribunalSigla: v.tribunalSigla,
          varaNome: v.varaNome,
          enderecoTexto: null,
          latitude: null,
          longitude: null,
        }))}
      />

      {/* Mapa real — isolate creates stacking context, keeping Leaflet z-indices contained */}
      <div className="isolate h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
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

      {/* Route cards — client (Iniciar button triggers em_execucao + checkpoints) */}
      <RotasProspeccaoListClient rotas={rotas} />

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

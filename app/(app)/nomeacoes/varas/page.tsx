import Link from 'next/link'
import { Navigation, ChevronRight, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EstatisticaVara } from '@/lib/types/nomeacoes'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Varas — Radar de Nomeações' }

// ─── MOCKS ───────────────────────────────────────────────────────────────────

const varas: EstatisticaVara[] = [
  { vara: '3ª Vara Cível Central', juiz: 'Dr. Ricardo Almeida', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 47, prioridade: 'ALTA', especialidades: ['Avaliação de Imóvel', 'Perícia Contábil'], ultimaNomeacao: '12/12/2024' },
  { vara: '1ª Vara Empresarial', juiz: 'Dr. Fábio Costa', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 38, prioridade: 'ALTA', especialidades: ['Avaliação de Empresa', 'Perícia Contábil'], ultimaNomeacao: '08/12/2024' },
  { vara: 'TRT-2 — 1ª Turma', juiz: 'Dra. Ana Lima', tribunal: 'TRT-2', comarca: 'São Paulo', totalPericias: 35, prioridade: 'ALTA', especialidades: ['Perícia Trabalhista'], ultimaNomeacao: '10/12/2024' },
  { vara: '5ª Vara Cível', juiz: 'Dr. Marcos Silva', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 28, prioridade: 'MEDIA', especialidades: ['Avaliação de Imóvel', 'Avaliação de Veículo'], ultimaNomeacao: '05/12/2024' },
  { vara: '7ª Vara Cível', juiz: 'Dra. Clara Mendes', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 22, prioridade: 'MEDIA', especialidades: ['Avaliação de Imóvel'], ultimaNomeacao: '01/12/2024' },
  { vara: '2ª Vara Trabalhista', juiz: 'Dr. Paulo Souza', tribunal: 'TRT-2', comarca: 'São Paulo', totalPericias: 18, prioridade: 'MEDIA', especialidades: ['Perícia Trabalhista'], ultimaNomeacao: '28/11/2024' },
  { vara: '4ª Vara Cível', juiz: 'Dr. José Santos', tribunal: 'TJSP', comarca: 'São Paulo', totalPericias: 12, prioridade: 'BAIXA', especialidades: ['Avaliação de Imóvel'], ultimaNomeacao: '15/11/2024' },
  { vara: '6ª Vara Cível', juiz: 'Dr. Carlos Vieira', tribunal: 'TJSP', comarca: 'Guarulhos', totalPericias: 9, prioridade: 'BAIXA', especialidades: ['Perícia Contábil'], ultimaNomeacao: '10/11/2024' },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const prioridadeConfig = {
  ALTA: { label: 'Alta', variant: 'danger' as const, row: 'border-l-red-400' },
  MEDIA: { label: 'Média', variant: 'warning' as const, row: 'border-l-amber-400' },
  BAIXA: { label: 'Baixa', variant: 'secondary' as const, row: 'border-l-slate-300' },
}

const maxPericias = Math.max(...varas.map((v) => v.totalPericias))

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function NomeacoesVarasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Varas"
        description="Ranking de varas por volume de perícias nomeadas"
        actions={
          <Link href="/nomeacoes/estrategia">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
              <Navigation className="h-3.5 w-3.5" />
              Gerar Estratégia
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar vara ou juiz..."
          className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="pl-4 pr-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-6">#</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vara / Juiz</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Especialidades</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">Última Nomeação</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Volume</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Prioridade</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {varas.map((v, i) => {
                const conf = prioridadeConfig[v.prioridade]
                const pct = Math.round((v.totalPericias / maxPericias) * 100)
                return (
                  <tr key={v.vara} className={cn('hover:bg-slate-50 transition-colors border-l-2', conf.row)}>
                    <td className="pl-4 pr-2 py-3 text-xs font-bold text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{v.vara}</p>
                      <p className="text-xs text-slate-400">{v.juiz} · {v.tribunal} · {v.comarca}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(v.especialidades ?? []).map((e) => (
                          <span key={e} className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{v.ultimaNomeacao ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">{v.totalPericias}</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', v.prioridade === 'ALTA' ? 'bg-red-500' : v.prioridade === 'MEDIA' ? 'bg-amber-500' : 'bg-slate-400')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={conf.variant}>{conf.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs whitespace-nowrap">
                        <Navigation className="h-3 w-3" />
                        Criar Rota
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <span>{varas.length} varas monitoradas</span>
        <Link href="/nomeacoes/estrategia" className="flex items-center gap-1 text-violet-600 hover:text-violet-700 font-medium transition-colors">
          Gerar estratégia de prospecção <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

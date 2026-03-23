import { Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Juízes — Radar de Nomeações' }

// ─── MOCKS ───────────────────────────────────────────────────────────────────

const juizes = [
  {
    nome: 'Dr. Ricardo Almeida',
    vara: '3ª Vara Cível Central',
    tribunal: 'TJSP',
    comarca: 'São Paulo',
    totalNomeacoes: 47,
    especialidades: ['Avaliação de Imóvel', 'Perícia Contábil'],
    ultimaNomeacao: '12/12/2024',
    tendencia: 'alta' as const,
  },
  {
    nome: 'Dr. Fábio Costa',
    vara: '1ª Vara Empresarial',
    tribunal: 'TJSP',
    comarca: 'São Paulo',
    totalNomeacoes: 38,
    especialidades: ['Avaliação de Empresa', 'Perícia Contábil'],
    ultimaNomeacao: '08/12/2024',
    tendencia: 'alta' as const,
  },
  {
    nome: 'Dra. Ana Lima',
    vara: 'TRT-2 — 1ª Turma',
    tribunal: 'TRT-2',
    comarca: 'São Paulo',
    totalNomeacoes: 35,
    especialidades: ['Perícia Trabalhista'],
    ultimaNomeacao: '10/12/2024',
    tendencia: 'estavel' as const,
  },
  {
    nome: 'Dr. Marcos Silva',
    vara: '5ª Vara Cível',
    tribunal: 'TJSP',
    comarca: 'São Paulo',
    totalNomeacoes: 28,
    especialidades: ['Avaliação de Imóvel', 'Avaliação de Veículo'],
    ultimaNomeacao: '05/12/2024',
    tendencia: 'alta' as const,
  },
  {
    nome: 'Dra. Clara Mendes',
    vara: '7ª Vara Cível',
    tribunal: 'TJSP',
    comarca: 'São Paulo',
    totalNomeacoes: 22,
    especialidades: ['Avaliação de Imóvel'],
    ultimaNomeacao: '01/12/2024',
    tendencia: 'estavel' as const,
  },
  {
    nome: 'Dr. Paulo Souza',
    vara: '2ª Vara Trabalhista',
    tribunal: 'TRT-2',
    comarca: 'São Paulo',
    totalNomeacoes: 18,
    especialidades: ['Perícia Trabalhista'],
    ultimaNomeacao: '28/11/2024',
    tendencia: 'queda' as const,
  },
  {
    nome: 'Dr. José Santos',
    vara: '4ª Vara Cível',
    tribunal: 'TJSP',
    comarca: 'São Paulo',
    totalNomeacoes: 12,
    especialidades: ['Avaliação de Imóvel'],
    ultimaNomeacao: '15/11/2024',
    tendencia: 'queda' as const,
  },
  {
    nome: 'Dr. Carlos Vieira',
    vara: '6ª Vara Cível',
    tribunal: 'TJSP',
    comarca: 'Guarulhos',
    totalNomeacoes: 9,
    especialidades: ['Perícia Contábil'],
    ultimaNomeacao: '10/11/2024',
    tendencia: 'estavel' as const,
  },
]

const tendenciaConfig = {
  alta:   { label: '↑ Alta',   class: 'text-brand-400    bg-brand-500/10'   },
  estavel:{ label: '→ Estável',class: 'text-zinc-400   bg-zinc-900/50' },
  queda:  { label: '↓ Queda', class: 'text-rose-600    bg-rose-50'   },
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function NomeacoesJuizesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Juízes"
        description="Histórico e tendência de nomeações por magistrado"
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar juiz ou vara..."
          className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-3 text-sm placeholder:text-zinc-500 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/80">
                <th className="pl-4 pr-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 w-6">#</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Magistrado</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Vara / Tribunal</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Especialidades</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Última Nomeação</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Nomeações</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tendência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {juizes.map((j, i) => {
                const tend = tendenciaConfig[j.tendencia]
                return (
                  <tr key={j.nome} className="hover:bg-muted/60 transition-colors cursor-pointer">
                    <td className="pl-4 pr-2 py-3 text-xs font-medium text-zinc-500 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{j.nome}</p>
                      <p className="text-xs text-zinc-500">{j.comarca}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-zinc-300">{j.vara}</p>
                      <p className="text-[11px] text-zinc-500">{j.tribunal}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {j.especialidades.map((e) => (
                          <span key={e} className="inline-flex items-center rounded-md bg-zinc-900/50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                            {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{j.ultimaNomeacao}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-foreground tabular-nums">{j.totalNomeacoes}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', tend.class)}>
                        {tend.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-zinc-500 text-center">
        {juizes.length} magistrados mapeados · Dados de demonstração
      </p>
    </div>
  )
}

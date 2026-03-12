import { FileText, Plus, Search, Filter, SlidersHorizontal } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Perícias' }

const pericias = [
  {
    id: 1,
    numero: 'PRC-2024-001',
    assunto: 'Avaliação de Imóvel Residencial',
    processo: '0012345-67.2024.8.26.0001',
    cliente: 'João Silva',
    vara: '3ª Vara Cível — TJSP',
    status: 'em_andamento',
    prazo: '15/12/2024',
    valor: 'R$ 4.200',
  },
  {
    id: 2,
    numero: 'PRC-2024-002',
    assunto: 'Perícia Trabalhista',
    processo: '0023456-78.2024.5.02.0001',
    cliente: 'Maria Santos',
    vara: '2ª Vara do Trabalho — TRT-2',
    status: 'aguardando',
    prazo: '20/12/2024',
    valor: 'R$ 3.500',
  },
  {
    id: 3,
    numero: 'PRC-2024-003',
    assunto: 'Laudo Contábil Societário',
    processo: '0034567-89.2024.8.26.0100',
    cliente: 'Carlos Oliveira',
    vara: '1ª Vara Empresarial — TJSP',
    status: 'concluida',
    prazo: '10/12/2024',
    valor: 'R$ 8.000',
  },
  {
    id: 4,
    numero: 'PRC-2024-004',
    assunto: 'Avaliação de Estabelecimento Comercial',
    processo: '0045678-90.2024.8.26.0002',
    cliente: 'Ana Costa',
    vara: '5ª Vara Cível — TJSP',
    status: 'em_andamento',
    prazo: '22/12/2024',
    valor: 'R$ 6.500',
  },
  {
    id: 5,
    numero: 'PRC-2024-005',
    assunto: 'Perícia de Engenharia Civil',
    processo: '0056789-01.2024.8.26.0003',
    cliente: 'Roberto Lima',
    vara: '4ª Vara Cível — TJSP',
    status: 'aguardando',
    prazo: '28/12/2024',
    valor: 'R$ 5.200',
  },
  {
    id: 6,
    numero: 'PRC-2024-006',
    assunto: 'Laudo Ambiental',
    processo: '0067890-12.2024.4.03.6100',
    cliente: 'Empresa XYZ Ltda.',
    vara: '1ª Vara Federal Ambiental',
    status: 'nomeado',
    prazo: '10/01/2025',
    valor: 'A definir',
  },
]

const statusMap = {
  em_andamento: { label: 'Em andamento', variant: 'info' as const },
  aguardando: { label: 'Aguardando', variant: 'warning' as const },
  concluida: { label: 'Concluída', variant: 'success' as const },
  cancelada: { label: 'Cancelada', variant: 'danger' as const },
  nomeado: { label: 'Nomeado', variant: 'secondary' as const },
}

export default function PericiasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Perícias"
        description="Gerencie todos os seus processos periciais"
        actions={
          <>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Nova Perícia
            </Button>
          </>
        }
      />

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por número, assunto ou cliente..."
            className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Todos os status</option>
          <option value="em_andamento">Em andamento</option>
          <option value="aguardando">Aguardando</option>
          <option value="concluida">Concluída</option>
          <option value="nomeado">Nomeado</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Número / Assunto
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Cliente
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vara
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Prazo
                </th>
                <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pericias.map((p) => {
                const status = statusMap[p.status as keyof typeof statusMap]
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{p.assunto}</p>
                          <p className="text-xs text-slate-400">
                            {p.numero} · {p.processo}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3.5">
                      <span className="text-sm text-slate-700">{p.cliente}</span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3.5">
                      <span className="text-xs text-slate-500">{p.vara}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3.5">
                      <span className="text-sm text-slate-600">{p.prazo}</span>
                    </td>
                    <td className="hidden xl:table-cell px-4 py-3.5">
                      <span className="text-sm font-semibold text-slate-900">{p.valor}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Mostrando 6 de 24 perícias</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>
              ← Anterior
            </Button>
            <Button variant="outline" size="sm">
              Próximo →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Search, SlidersHorizontal, ScrollText } from 'lucide-react'
// Nova Perícia button removed — perícias arrive via nomeações or parceiro proposals only
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { pericias, statusMapPericias } from '@/lib/mocks/pericias'

export default function PericiasPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    return pericias.filter((p) => {
      const matchSearch =
        !search ||
        p.assunto.toLowerCase().includes(search.toLowerCase()) ||
        p.numero.toLowerCase().includes(search.toLowerCase()) ||
        p.cliente.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perícias"
        description="Gerencie todos os seus processos periciais"
        actions={
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </Button>
        }
      />

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por número, assunto ou parte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="em_andamento">Em andamento</option>
          <option value="aguardando">Aguardando</option>
          <option value="concluida">Concluída</option>
          <option value="nomeado">Nomeado</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma perícia encontrada"
          description="Tente ajustar os filtros ou o termo de busca."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Número / Assunto
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Partes
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
                  <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Doc.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const status = statusMapPericias[p.status]
                  return (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/pericias/${p.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{p.assunto}</p>
                            <p className="text-xs text-slate-400">
                              {p.numero} · {p.processo}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Autor</p>
                        <span className="text-sm text-slate-700">{p.cliente}</span>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-4">
                        <span className="text-xs text-slate-500">{p.vara}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4">
                        <span className="text-sm text-slate-600">{p.prazo}</span>
                      </td>
                      <td className="hidden xl:table-cell px-4 py-4">
                        <span className="text-sm font-semibold text-slate-900">{p.valor}</span>
                      </td>
                      <td className="hidden xl:table-cell px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <Link href="/documentos">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                            <ScrollText className="h-3.5 w-3.5" />
                            Gerar
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              {filtered.length} de {pericias.length} perícias
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

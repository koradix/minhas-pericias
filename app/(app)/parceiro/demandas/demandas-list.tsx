'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Inbox, MapPin, Clock, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { BadgeStatus } from '@/components/shared/badge-status'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/utils'
import type { DemandaParceiro } from '@prisma/client'

export function DemandasParceiroList({ demandas }: { demandas: DemandaParceiro[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(
    () =>
      demandas.filter((d) => {
        const matchSearch =
          !search ||
          d.titulo.toLowerCase().includes(search.toLowerCase()) ||
          d.cidade.toLowerCase().includes(search.toLowerCase()) ||
          d.tipo.toLowerCase().includes(search.toLowerCase())
        const matchStatus = !statusFilter || d.status === statusFilter
        return matchSearch && matchStatus
      }),
    [demandas, search, statusFilter],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Demandas"
        description="Demandas que você cadastrou para buscar peritos"
        actions={
          <Link href="/parceiro/demandas/nova">
            <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold">
              <Plus className="h-3.5 w-3.5" />
              Nova Demanda
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar demandas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
        >
          <option value="">Todos os status</option>
          <option value="aberta">Aberta</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={demandas.length === 0 ? 'Nenhuma demanda ainda' : 'Nenhum resultado'}
          description={
            demandas.length === 0
              ? 'Cadastre sua primeira demanda para buscar peritos compatíveis.'
              : 'Tente outros filtros de busca.'
          }
          action={
            demandas.length === 0 ? (
              <Link href="/parceiro/demandas/nova">
                <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold">
                  <Plus className="h-3.5 w-3.5" />
                  Nova Demanda
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{d.titulo}</p>
                <BadgeStatus status={d.status} />
              </div>

              <div className="inline-flex items-center rounded-md bg-lime-50 px-2 py-0.5 text-[10px] font-semibold text-lime-700 mb-3">
                {d.tipo}
              </div>

              {d.descricao && (
                <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
                  {d.descricao}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {d.cidade}/{d.uf}
                </span>
                {d.prazo && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {d.prazo}
                  </span>
                )}
              </div>

              {d.valor > 0 && (
                <p className="text-base font-bold text-slate-900 mb-4">
                  {formatCurrency(d.valor)}
                </p>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Link
                  href={`/parceiro/peritos?tipo=${encodeURIComponent(d.tipo)}&uf=${d.uf}&cidade=${encodeURIComponent(d.cidade)}&demandaId=${d.id}&demandaTitulo=${encodeURIComponent(d.titulo)}`}
                  className="flex-1"
                >
                  <Button size="sm" className="w-full gap-1 bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold">
                    <Search className="h-3.5 w-3.5" />
                    Buscar Peritos
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

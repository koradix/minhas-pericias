'use client'

import { useState, useMemo } from 'react'
import { Inbox, Building2, MapPin, Clock, SlidersHorizontal, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/shared/stats-card'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/utils'
import { demandas, statusMapDemandas, originadorColors } from '@/lib/mocks/demandas'

export default function DemandasPage() {
  const [search, setSearch] = useState('')
  const [especialidadeFilter, setEspecialidadeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const disponiveis = demandas.filter((d) => d.status === 'disponivel').length
  const aceitas = demandas.filter((d) => d.status === 'aceita').length

  const filtered = useMemo(() => {
    return demandas.filter((d) => {
      const matchSearch =
        !search ||
        d.titulo.toLowerCase().includes(search.toLowerCase()) ||
        d.originador.toLowerCase().includes(search.toLowerCase()) ||
        d.cidade.toLowerCase().includes(search.toLowerCase())
      const matchEsp = !especialidadeFilter || d.especialidade === especialidadeFilter
      const matchStatus = !statusFilter || d.status === statusFilter
      return matchSearch && matchEsp && matchStatus
    })
  }, [search, especialidadeFilter, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandas Extrajudiciais"
        description="Demandas de seguradoras, advogados e empresas disponíveis para aceite"
        actions={
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatsCard title="Disponíveis" value={disponiveis} description="Aguardando seu aceite" icon={Inbox} accent="violet" />
        <StatsCard title="Aceitas por mim" value={aceitas} description="Em andamento" icon={Inbox} accent="emerald" />
        <StatsCard title="Concluídas (mês)" value="3" description="Dezembro 2024" icon={Inbox} accent="blue" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por tipo, originador ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select value={especialidadeFilter} onChange={(e) => setEspecialidadeFilter(e.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Todas as especialidades</option>
          <option>Avaliação de Imóvel</option>
          <option>Perícia Trabalhista</option>
          <option>Avaliação de Empresa</option>
          <option>Perícia Contábil</option>
          <option>Avaliação de Veículo</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Todos os status</option>
          <option value="disponivel">Disponíveis</option>
          <option value="aceita">Aceitas</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="Nenhuma demanda encontrada" description="Tente ajustar os filtros ou o termo de busca." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((d) => {
            const status = statusMapDemandas[d.status]
            const originadorColor = originadorColors[d.tipoOriginador] ?? 'bg-slate-100 text-slate-600'
            const isUrgente = d.diasParaExpirar <= 3
            return (
              <div key={d.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${originadorColor}`}>{d.tipoOriginador}</span>
                      <span className="text-[10px] text-slate-400">{d.especialidade}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">{d.titulo}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {isUrgente && d.status === 'disponivel' && (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-inset ring-red-200">
                        Expira em {d.diasParaExpirar}d
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{d.descricao}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /><span className="truncate max-w-[140px]">{d.originador}</span></span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />{d.cidade}, {d.uf}</span>
                  <span className="flex items-center gap-1.5 ml-auto flex-shrink-0"><Clock className="h-3.5 w-3.5 text-slate-400" />{d.prazo}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                  <span className="text-base font-bold text-slate-900 tabular-nums">{formatCurrency(d.valor)}</span>
                  {d.status === 'disponivel' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8 text-xs">Ver detalhes</Button>
                      <Button size="sm" className="h-8 text-xs bg-violet-600 hover:bg-violet-700">Aceitar demanda</Button>
                    </div>
                  )}
                  {d.status === 'aceita' && <Button size="sm" variant="secondary" className="h-8 text-xs">Acompanhar →</Button>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { Calendar, Plus, MapPin, Clock, FileText, Search } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { visitas, statusMapVisitas, tipoColors } from "@/lib/mocks/visitas"

export default function VisitasPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = useMemo(() => {
    return visitas.filter((v) => {
      const matchSearch =
        !search ||
        v.assunto.toLowerCase().includes(search.toLowerCase()) ||
        v.pericia.toLowerCase().includes(search.toLowerCase()) ||
        v.local.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || v.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitas"
        description="Agende e gerencie visitas, vistorias e entrevistas"
        actions={<Button size="sm"><Plus className="h-4 w-4" />Nova Visita</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Esta semana", value: "3", color: "text-blue-600 bg-blue-50" },
          { label: "Proximos 30 dias", value: "8", color: "text-violet-600 bg-violet-50" },
          { label: "Realizadas (mes)", value: "12", color: "text-emerald-600 bg-emerald-50" },
          { label: "Pendentes", value: "2", color: "text-amber-600 bg-amber-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={item.color + " inline-flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold mb-2"}>
              {item.value}
            </div>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="Buscar por assunto, pericia ou local..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Todos os status</option>
          <option value="confirmada">Confirmada</option>
          <option value="pendente">Pendente</option>
          <option value="realizada">Realizada</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Proximas Visitas</CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="text-xs">Lista</Button>
              <Button variant="ghost" size="sm" className="text-xs">Calendario</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {filtered.length === 0 ? (
            <EmptyState icon={Calendar} title="Nenhuma visita encontrada" description="Tente ajustar os filtros ou o termo de busca." />
          ) : (
            <div className="space-y-3">
              {filtered.map((v) => {
                const status = statusMapVisitas[v.status]
                const tipoColor = tipoColors[v.tipo] ?? "bg-slate-50 text-slate-600"
                return (
                  <div key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase leading-none">{v.data.split(" ")[1] ?? "DEZ"}</span>
                      <span className="text-lg font-bold text-slate-900 leading-none">{v.data.split(" ")[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={tipoColor + " inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"}>{v.tipo}</span>
                        <span className="text-xs text-slate-400">{v.pericia}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 mt-0.5 truncate">{v.assunto}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3 flex-shrink-0" /><span className="truncate max-w-[200px]">{v.local}</span></span>
                        <span className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0"><Clock className="h-3 w-3" />{v.hora}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <button className="text-xs text-slate-400 hover:text-blue-600 transition-colors"><FileText className="h-4 w-4" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

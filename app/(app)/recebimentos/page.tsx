"use client"

import { useState, useMemo } from "react"
import { ArrowDownCircle, Plus, Search, FileText } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/shared/stats-card"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/utils"
import { recebimentos, statusMapRecebimentos } from "@/lib/mocks/recebimentos"

export default function RecebimentosPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = useMemo(() => {
    return recebimentos.filter((r) => {
      const matchSearch =
        !search ||
        r.descricao.toLowerCase().includes(search.toLowerCase()) ||
        r.pericia.toLowerCase().includes(search.toLowerCase()) ||
        r.cliente.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  const totalPendente = recebimentos
    .filter((r) => r.status === "pendente" || r.status === "vencido")
    .reduce((s, r) => s + r.valorTotal, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recebimentos"
        description="Controle de honorarios e valores a receber"
        actions={<Button size="sm"><Plus className="h-4 w-4" />Novo Recebimento</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Recebido (Dezembro)" value="R$ 8.000" icon={ArrowDownCircle} accent="emerald" trend={{ value: 22, label: "vs. novembro", positive: true }} />
        <StatsCard title="Pendente" value="R$ 14.200" description="3 recebimentos em aberto" icon={ArrowDownCircle} accent="amber" />
        <StatsCard title="Vencido" value="R$ 15.000" description="1 recebimento em atraso" icon={ArrowDownCircle} accent="rose" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <input type="text" placeholder="Buscar por pericia ou cliente..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-3 text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="recebido">Recebidos</option>
          <option value="vencido">Vencidos</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ArrowDownCircle} title="Nenhum recebimento encontrado" description="Tente ajustar os filtros ou o termo de busca." />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-saas overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Pericia / Descricao</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Valor</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Vencimento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const status = statusMapRecebimentos[r.status]
                  return (
                    <tr key={r.id} className="hover:bg-muted cursor-pointer transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50"><FileText className="h-4 w-4 text-emerald-600" /></div>
                          <div><p className="text-sm font-medium text-foreground">{r.descricao}</p><p className="text-xs text-zinc-500">{r.pericia}</p></div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3.5"><span className="text-sm text-zinc-300">{r.cliente}</span></td>
                      <td className="px-4 py-3.5"><span className="text-sm font-semibold text-foreground">{formatCurrency(r.valorTotal)}</span></td>
                      <td className="hidden md:table-cell px-4 py-3.5"><span className="text-sm text-zinc-400">{r.vencimento}</span></td>
                      <td className="px-4 py-3.5"><Badge variant={status.variant}>{status.label}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border bg-muted px-4 py-3">
            <p className="text-xs text-zinc-400">{filtered.length} recebimento{filtered.length !== 1 ? "s" : ""}</p>
            <p className="text-xs font-medium text-zinc-300">Total pendente: <span className="text-amber-600">{formatCurrency(totalPendente)}</span></p>
          </div>
        </div>
      )}
    </div>
  )
}

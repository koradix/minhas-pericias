"use client"

import { useState, useMemo } from "react"
import { Users, Plus, Search, Mail, Phone } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { contatos, tipoMapContatos, avatarColors, getInitials } from "@/lib/mocks/contatos"

export default function ContatosPage() {
  const [search, setSearch] = useState("")
  const [tipoFilter, setTipoFilter] = useState("")

  const filtered = useMemo(() => {
    return contatos.filter((c) => {
      const matchSearch =
        !search ||
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      const matchTipo = !tipoFilter || c.tipo === tipoFilter
      return matchSearch && matchTipo
    })
  }, [search, tipoFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contatos"
        description="Gerencie partes, advogados, juizes e peritos parceiros"
        actions={<Button size="sm"><Plus className="h-4 w-4" />Novo Contato</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <input type="text" placeholder="Buscar contato por nome ou e-mail..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-3 text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none">
          <option value="">Todos os tipos</option>
          <option value="advogado">Advogados</option>
          <option value="parte">Partes</option>
          <option value="juiz">Juizes</option>
          <option value="perito_parceiro">Peritos Parceiros</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum contato encontrado" description="Tente ajustar os filtros ou o termo de busca." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => {
              const tipo = tipoMapContatos[c.tipo]
              return (
                <div key={c.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className={avatarColors[i % avatarColors.length] + " flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"}>
                      {getInitials(c.nome)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-blue-700 transition-colors">{c.nome}</p>
                        <Badge variant={tipo.variant} className="flex-shrink-0">{tipo.label}</Badge>
                      </div>
                      {c.oab && <p className="text-xs text-zinc-500 mt-0.5">{c.oab}</p>}
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Mail className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" /><span className="truncate">{c.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Phone className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" /><span>{c.telefone}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-zinc-500">{c.pericias} {c.pericias === 1 ? "pericia" : "pericias"}</span>
                    <span className="text-xs text-blue-600 font-medium group-hover:underline">Ver detalhes </span>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-zinc-400">{filtered.length} contato{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>
        </>
      )}
    </div>
  )
}

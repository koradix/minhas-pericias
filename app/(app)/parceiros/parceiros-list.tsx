'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Handshake, Plus, Search, Mail, Phone, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import type { Parceiro } from '@prisma/client'

const TIPO_MAP: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'secondary' | 'danger' }> = {
  advogado:   { label: 'Advogado(a)',  variant: 'info' },
  escritorio: { label: 'Escritório',   variant: 'default' },
  seguradora: { label: 'Seguradora',   variant: 'warning' },
  empresa:    { label: 'Empresa',      variant: 'secondary' },
  outro:      { label: 'Outro',        variant: 'secondary' },
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

interface ParceirosListClientProps {
  parceiros: Parceiro[]
}

export default function ParceirosListClient({ parceiros }: ParceirosListClientProps) {
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    return parceiros.filter((p) => {
      const matchSearch =
        !search ||
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        (p.email ?? '').toLowerCase().includes(search.toLowerCase())
      const matchTipo = !tipoFilter || p.tipo === tipoFilter
      const matchStatus = !statusFilter || p.status === statusFilter
      return matchSearch && matchTipo && matchStatus
    })
  }, [parceiros, search, tipoFilter, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parceiros"
        description="Advogados, escritórios, seguradoras e empresas parceiras"
        actions={
          <Link href="/parceiros/novo">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Novo Parceiro
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-3 text-sm placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todos os tipos</option>
          <option value="advogado">Advogado(a)</option>
          <option value="escritorio">Escritório</option>
          <option value="seguradora">Seguradora</option>
          <option value="empresa">Empresa</option>
          <option value="outro">Outro</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={parceiros.length === 0 ? 'Nenhum parceiro cadastrado' : 'Nenhum parceiro encontrado'}
          description={
            parceiros.length === 0
              ? 'Cadastre advogados, escritórios, seguradoras e empresas parceiras.'
              : 'Tente ajustar os filtros ou o termo de busca.'
          }
          action={
            parceiros.length === 0 ? (
              <Link href="/parceiros/novo">
                <Button size="sm"><Plus className="h-4 w-4" />Novo Parceiro</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => {
              const tipo = TIPO_MAP[p.tipo] ?? TIPO_MAP.outro
              return (
                <Link key={p.id} href={`/parceiros/${p.id}`} className="block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className={AVATAR_COLORS[i % AVATAR_COLORS.length] + ' flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold'}>
                      {getInitials(p.nome)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-blue-700 transition-colors">{p.nome}</p>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge variant={tipo.variant}>{tipo.label}</Badge>
                          {p.status === 'inativo' && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    {p.email && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Mail className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}
                    {p.telefone && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Phone className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                        <span>{p.telefone}</span>
                      </div>
                    )}
                    {(p.cidade || p.estado) && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                        <span>{[p.cidade, p.estado].filter(Boolean).join(' — ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-blue-600 font-medium group-hover:underline">Ver detalhes →</span>
                  </div>
                </Link>
              )
            })}
          </div>
          <p className="text-xs text-zinc-400">
            {filtered.length} parceiro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  )
}

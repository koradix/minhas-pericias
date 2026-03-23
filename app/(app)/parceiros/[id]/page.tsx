import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronRight, Pencil, Mail, Phone, MapPin, Calendar, Tag } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getParceiroById } from '@/lib/data/parceiros'
import DeleteButton from './delete-button'

const TIPO_LABEL: Record<string, string> = {
  advogado:   'Advogado(a)',
  escritorio: 'Escritório',
  seguradora: 'Seguradora',
  empresa:    'Empresa',
  outro:      'Outro',
}

const TIPO_VARIANT: Record<string, 'default' | 'info' | 'warning' | 'secondary'> = {
  advogado:   'info',
  escritorio: 'default',
  seguradora: 'warning',
  empresa:    'secondary',
  outro:      'secondary',
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const parceiro = await getParceiroById(id)
  return { title: parceiro?.nome ?? 'Parceiro' }
}

export default async function ParceiroDetailPage({ params }: Props) {
  const { id } = await params
  const parceiro = await getParceiroById(id)

  if (!parceiro) notFound()

  const criadoEm = new Intl.DateTimeFormat('pt-BR').format(parceiro.createdAt)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/parceiros" className="hover:text-zinc-400 transition-colors">Parceiros</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-400 truncate max-w-xs">{parceiro.nome}</span>
      </div>

      <PageHeader
        title={parceiro.nome}
        description={TIPO_LABEL[parceiro.tipo] ?? parceiro.tipo}
        actions={
          <div className="flex gap-2">
            <Link href={`/parceiros/${parceiro.id}/editar`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <DeleteButton id={parceiro.id} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Tipo + Status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Classificação</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={TIPO_VARIANT[parceiro.tipo] ?? 'secondary'}>
              {TIPO_LABEL[parceiro.tipo] ?? parceiro.tipo}
            </Badge>
            <Badge variant={parceiro.status === 'ativo' ? 'success' : 'secondary'}>
              {parceiro.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>

        {/* Contato */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Contato</p>
          <div className="space-y-2">
            {parceiro.email ? (
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Mail className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span className="truncate">{parceiro.email}</span>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">—</p>
            )}
            {parceiro.telefone && (
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Phone className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span>{parceiro.telefone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Localização */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Localização</p>
          {parceiro.cidade || parceiro.estado ? (
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <MapPin className="h-4 w-4 text-zinc-500 flex-shrink-0" />
              <span>{[parceiro.cidade, parceiro.estado].filter(Boolean).join(' — ')}</span>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">—</p>
          )}
        </div>
      </div>

      {/* Observações */}
      {parceiro.observacoes && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Observações</p>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{parceiro.observacoes}</p>
        </div>
      )}

      {/* Metadados */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          Cadastrado em {criadoEm}
        </span>
        <span className="flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" />
          {parceiro.id}
        </span>
      </div>
    </div>
  )
}

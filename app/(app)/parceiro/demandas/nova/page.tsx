'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { createDemanda, type DemandaActionState } from '@/lib/actions/parceiro-demandas'

const ESPECIALIDADES = [
  'Avaliação de Imóvel',
  'Engenharia Civil',
  'Perícia Trabalhista',
  'Perícia Contábil',
  'Avaliação de Empresa',
  'Perícia Médica',
  'Ambiental',
  'Outro',
]

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const initialState: DemandaActionState = {}

export default function NovaDemandaPage() {
  const [state, formAction, isPending] = useActionState(createDemanda, initialState)

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Nova Demanda"
        description="Cadastre uma demanda para buscar peritos compatíveis"
        actions={
          <Link href="/parceiro/demandas">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Button>
          </Link>
        }
      />

      <form action={formAction} className="space-y-5">
        {/* Título */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Título da Demanda <span className="text-red-500">*</span>
          </label>
          <input
            name="titulo"
            type="text"
            placeholder="Ex: Avaliação de Imóvel para Sinistro"
            disabled={isPending}
            className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          {state.errors?.titulo && (
            <p className="mt-1 text-xs text-red-500">{state.errors.titulo[0]}</p>
          )}
        </div>

        {/* Tipo / Especialidade */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Especialidade Requerida <span className="text-red-500">*</span>
          </label>
          <select
            name="tipo"
            disabled={isPending}
            className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Selecione...</option>
            {ESPECIALIDADES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          {state.errors?.tipo && (
            <p className="mt-1 text-xs text-red-500">{state.errors.tipo[0]}</p>
          )}
        </div>

        {/* Localização */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Cidade <span className="text-red-500">*</span>
            </label>
            <input
              name="cidade"
              type="text"
              placeholder="Ex: Rio de Janeiro"
              disabled={isPending}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            {state.errors?.cidade && (
              <p className="mt-1 text-xs text-red-500">{state.errors.cidade[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Estado (UF) <span className="text-red-500">*</span>
            </label>
            <select
              name="uf"
              disabled={isPending}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">UF</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
            {state.errors?.uf && (
              <p className="mt-1 text-xs text-red-500">{state.errors.uf[0]}</p>
            )}
          </div>
        </div>

        {/* Valor e Prazo */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Valor Estimado (R$)
            </label>
            <input
              name="valor"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              disabled={isPending}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Prazo Desejado
            </label>
            <input
              name="prazo"
              type="text"
              placeholder="Ex: 30/04/2026"
              disabled={isPending}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Descrição <span className="text-zinc-500 font-normal">(opcional)</span>
          </label>
          <textarea
            name="descricao"
            rows={4}
            placeholder="Descreva os detalhes da perícia necessária..."
            disabled={isPending}
            className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        {state.message && (
          <p className="text-xs text-red-500">{state.message}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link href="/parceiro/demandas" className="flex-1">
            <Button variant="outline" size="sm" className="w-full" disabled={isPending}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" size="sm" className="flex-1" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Salvando...
              </>
            ) : (
              'Cadastrar Demanda'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ParceiroActionState } from '@/lib/actions/parceiros'
import type { Parceiro } from '@prisma/client'

const TIPOS = [
  { value: 'advogado', label: 'Advogado(a)' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'seguradora', label: 'Seguradora' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'outro', label: 'Outro' },
]

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
]

interface ParceiroFormProps {
  action: (prevState: ParceiroActionState, formData: FormData) => Promise<ParceiroActionState>
  initialData?: Partial<Parceiro>
  cancelHref?: string
}

const inputClass =
  'w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50'

const labelClass = 'block text-sm font-medium text-zinc-300 mb-1.5'
const errorClass = 'mt-1 text-xs text-red-600'

export default function ParceiroForm({ action, initialData, cancelHref = '/parceiros' }: ParceiroFormProps) {
  const [state, formAction, isPending] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {state.message && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Nome + Tipo */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="nome">Nome <span className="text-red-500">*</span></label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            defaultValue={initialData?.nome ?? ''}
            placeholder="Nome completo ou razão social"
            className={inputClass}
          />
          {state.errors?.nome && <p className={errorClass}>{state.errors.nome[0]}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" defaultValue={initialData?.tipo ?? 'outro'} className={inputClass}>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Email + Telefone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={initialData?.email ?? ''}
            placeholder="contato@exemplo.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="telefone">Telefone</label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            defaultValue={initialData?.telefone ?? ''}
            placeholder="(11) 99999-9999"
            className={inputClass}
          />
        </div>
      </div>

      {/* Cidade + Estado + Status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className={labelClass} htmlFor="cidade">Cidade</label>
          <input
            id="cidade"
            name="cidade"
            type="text"
            defaultValue={initialData?.cidade ?? ''}
            placeholder="São Paulo"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="estado">Estado</label>
          <select id="estado" name="estado" defaultValue={initialData?.estado ?? ''} className={inputClass}>
            <option value="">—</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={initialData?.status ?? 'ativo'} className={inputClass}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className={labelClass} htmlFor="observacoes">Observações</label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          defaultValue={initialData?.observacoes ?? ''}
          placeholder="Anotações internas sobre este parceiro..."
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Salvando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar
            </span>
          )}
        </Button>
        <Link href={cancelHref}>
          <Button type="button" variant="outline">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  )
}

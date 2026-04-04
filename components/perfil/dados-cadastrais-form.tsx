'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2, User, Hash } from 'lucide-react'
import { updateDadosCadastrais } from '@/lib/actions/perfil'

interface Props {
  initialNome: string
  initialCpf: string
}

type FormState = { ok: true; nome: string; cpf: string } | { ok: false; error: string } | null

async function formAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const nome = (formData.get('nome') as string | null) ?? ''
  const cpf  = (formData.get('cpf')  as string | null) ?? ''
  const res = await updateDadosCadastrais({ nome, cpf })
  if (res.ok) return { ok: true, nome: nome.trim(), cpf: cpf.trim() }
  return { ok: false, error: res.error }
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

export function DadosCadastraisForm({ initialNome, initialCpf }: Props) {
  const [state, dispatch, isPending] = useActionState(formAction, null)

  const nomeCurrent  = state?.ok ? state.nome : initialNome
  const cpfCurrent   = state?.ok ? formatCpf(state.cpf) : formatCpf(initialCpf)

  return (
    <form action={dispatch} className="space-y-4">
      <div className="space-y-3">
        <div>
          <label htmlFor="nome" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Nome completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              id="nome"
              name="nome"
              type="text"
              defaultValue={nomeCurrent}
              key={nomeCurrent}
              disabled={isPending}
              placeholder="Seu nome completo"
              className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 disabled:opacity-60"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Deve ser idêntico ao que aparece no Diário Oficial
          </p>
        </div>

        <div>
          <label htmlFor="cpf" className="block text-xs font-semibold text-slate-700 mb-1.5">
            CPF <span className="font-normal text-slate-400">(melhora a busca em tribunais)</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              id="cpf"
              name="cpf"
              type="text"
              defaultValue={cpfCurrent}
              key={cpfCurrent}
              disabled={isPending}
              placeholder="000.000.000-00"
              inputMode="numeric"
              className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 font-mono focus:border-lime-400 focus:ring-1 focus:ring-lime-400 disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {state?.ok === false && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-sm px-4 py-2 transition-colors disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Salvar
        </button>
        {state?.ok === true && (
          <div className="flex items-center gap-1.5 text-sm text-lime-700">
            <CheckCircle2 className="h-4 w-4" />
            Salvo!
          </div>
        )}
      </div>
    </form>
  )
}

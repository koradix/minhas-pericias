'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, User, Hash } from 'lucide-react'
import { updateDadosCadastrais } from '@/lib/actions/perfil'

interface Props {
  initialNome: string
  initialCpf: string
}

export function DadosCadastraisForm({ initialNome, initialCpf }: Props) {
  const [nome, setNome] = useState(initialNome)
  const [cpf, setCpf] = useState(initialCpf)
  const [status, setStatus] = useState<'idle' | 'ok' | 'erro'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('idle')
    startTransition(async () => {
      const res = await updateDadosCadastrais({ nome, cpf })
      if (res.ok) {
        setStatus('ok')
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('erro')
        setErrorMsg(res.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Nome completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isPending}
              placeholder="Seu nome completo"
              className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 disabled:opacity-60"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Nome usado nas buscas de nomeação — deve ser idêntico ao do Diário Oficial
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            CPF <span className="font-normal text-slate-400">(opcional, melhora precisão da busca)</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              disabled={isPending}
              placeholder="000.000.000-00"
              inputMode="numeric"
              className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 font-mono focus:border-lime-400 focus:ring-1 focus:ring-lime-400 disabled:opacity-60"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Usado na busca em tribunais para evitar homônimos
          </p>
        </div>
      </div>

      {status === 'erro' && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {errorMsg}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-sm px-4 py-2 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Salvar
        </button>
        {status === 'ok' && (
          <div className="flex items-center gap-1.5 text-sm text-lime-700">
            <CheckCircle2 className="h-4 w-4" />
            Salvo!
          </div>
        )}
      </div>
    </form>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { criarPericiaManual } from '@/lib/actions/pericias-nova'

export default function NovaPericiaPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await criarPericiaManual(fd)
      if (res.ok && res.periciaId) {
        router.push(`/pericias/${res.periciaId}`)
      } else {
        setError(res.message)
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <Link href="/pericias" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Perícias
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
          <FileText className="h-4 w-4 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nova Perícia</h1>
          <p className="text-xs text-slate-500">Cadastro manual</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">

        <div className="px-6 py-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Processo</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Número do processo <span className="text-rose-500">*</span>
            </label>
            <input
              name="processo"
              required
              placeholder="0000000-00.0000.0.00.0000"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Tribunal</label>
              <input
                name="tribunal"
                placeholder="Ex: TJSP"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Vara / Órgão</label>
              <input
                name="vara"
                placeholder="Ex: 3ª Vara Cível"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Perícia</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Assunto / Objeto <span className="text-rose-500">*</span>
            </label>
            <input
              name="assunto"
              required
              placeholder="Ex: Perícia de engenharia em imóvel residencial"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Tipo de perícia</label>
              <input
                name="tipo"
                placeholder="Ex: Engenharia Civil"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Prazo</label>
              <input
                name="prazo"
                type="date"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Partes</label>
            <input
              name="partes"
              placeholder="Ex: João Silva × Maria Souza"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Endereço da vistoria</label>
            <input
              name="endereco"
              placeholder="Rua, número, bairro, cidade"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-between gap-3 bg-slate-50/50">
          {error ? <p className="text-xs text-rose-600">{error}</p> : <span />}
          <div className="flex gap-2">
            <Link href="/pericias">
              <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-900 font-bold text-sm px-5 py-2 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Criar perícia
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

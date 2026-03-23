'use client'

import { useState, useTransition } from 'react'
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { criarCitacaoManual } from '@/lib/actions/nomeacoes'

interface Props {
  siglas: string[]
  onClose: () => void
}

export function ManualCitacaoForm({ siglas, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [sigla, setSigla] = useState(siglas[0] ?? '')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [texto, setTexto] = useState('')
  const [processo, setProcesso] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) { setError('O texto da citação é obrigatório'); return }
    setError(null)

    startTransition(async () => {
      const result = await criarCitacaoManual({
        diarioSigla: sigla,
        diarioData: data,
        snippetTexto: texto.trim(),
        numeroProcesso: processo.trim() || undefined,
      })

      if (result.ok) {
        setSuccess(true)
        setTimeout(onClose, 1200)
      } else {
        setError(result.error ?? 'Erro ao salvar')
      }
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">Registrar citação manualmente</p>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-800">Citação registrada!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {/* Tribunal + data */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tribunal</label>
                <select
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
                >
                  {siglas.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  {siglas.length === 0 && <option value="">—</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Data do Diário</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
                  required
                />
              </div>
            </div>

            {/* Snippet */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Texto da citação <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Cole ou digite o trecho do diário onde seu nome aparece…"
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
                required
              />
            </div>

            {/* Processo */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Número do processo <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={processo}
                onChange={(e) => setProcesso(e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                <p className="text-xs text-rose-700">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1.5"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Salvar citação
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}

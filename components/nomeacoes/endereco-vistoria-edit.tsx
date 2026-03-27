'use client'

import { useState, useTransition } from 'react'
import { MapPin, Pencil, Check, X, Navigation } from 'lucide-react'
import { atualizarEnderecoVistoria } from '@/lib/actions/nomeacoes-intake'

interface Props {
  nomeacaoId: string
  endereco: string | null
}

export function EnderecoVistoriaEdit({ nomeacaoId, endereco }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(endereco ?? '')
  const [saved, setSaved] = useState(endereco ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await atualizarEnderecoVistoria(nomeacaoId, value)
      if (result.ok) {
        setSaved(value.trim())
        setEditing(false)
      } else {
        setError(result.message)
      }
    })
  }

  function handleCancel() {
    setValue(saved)
    setEditing(false)
    setError(null)
  }

  const mapsUrl = saved
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(saved)}`
    : null

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <MapPin className="h-3 w-3" /> Local da vistoria
        </p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Pencil className="h-2.5 w-2.5" />
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2 mt-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex: Rua das Flores, 123 – Centro – Rio de Janeiro/RJ"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
            autoFocus
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-lime-500 hover:bg-lime-600 text-white font-semibold text-xs px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              {isPending ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 font-semibold text-xs px-3 py-1.5 transition-colors"
            >
              <X className="h-3 w-3" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div>
          {saved ? (
            <div className="space-y-1.5">
              <p className="text-sm text-slate-700 leading-snug">{saved}</p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-lime-600 hover:text-lime-700 transition-colors"
                >
                  <Navigation className="h-2.5 w-2.5" />
                  Ver no mapa
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-slate-400 italic hover:text-slate-600 transition-colors"
            >
              Clique para informar o endereço da vistoria
            </button>
          )}
        </div>
      )}
    </div>
  )
}

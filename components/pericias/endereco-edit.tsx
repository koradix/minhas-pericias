'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { MapPin, Pencil, Check, X, Loader2 } from 'lucide-react'
import { updatePericiaEndereco } from '@/lib/actions/pericias-endereco'
import Link from 'next/link'

interface Props {
  pericoId: string
  endereco: string | null   // valor efetivo já resolvido (override ?? mock)
}

export function EnderecoEdit({ pericoId, endereco }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(endereco ?? '')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function handleCancel() {
    setValue(endereco ?? '')
    setEditing(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updatePericiaEndereco(pericoId, value)
      setEditing(false)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />

        {editing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Rua das Flores, 123, Jardins — São Paulo, SP"
            className="flex-1 min-w-0 rounded-lg border border-brand-500/50 bg-card px-2.5 py-1 text-xs text-foreground placeholder:text-zinc-500 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
          />
        ) : value ? (
          <p className="text-xs text-zinc-400 truncate">{value}</p>
        ) : (
          <p className="text-xs text-zinc-500 italic">Endereço do local não informado</p>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center gap-1.5">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 rounded-lg bg-brand-500 hover:bg-lime-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Salvar
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 hover:border-border hover:text-zinc-300 transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Editar
            </button>
            <Link
              href="/rotas/pericias"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 hover:border-brand-500/50 hover:bg-brand-500/10 hover:text-brand-400 transition-colors"
            >
              <MapPin className="h-3 w-3" />
              Criar rota
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

/**
 * Meta bar editável — clicar num campo abre input inline.
 * Salva via server action ao confirmar.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { atualizarDadosPericia } from '@/lib/actions/pericias-update'

interface Props {
  periciaId: string
  processo: string | null
  autor: string | null
  reu: string | null
  vara: string | null
  perito: string
}

function EditableField({ label, value, fieldKey, periciaId, onSaved }: {
  label: string
  value: string | null
  fieldKey: string
  periciaId: string
  onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, startSave] = useTransition()

  function handleSave() {
    startSave(async () => {
      const data: Record<string, string> = {}
      if (fieldKey === 'processo') data.processo = draft
      if (fieldKey === 'autor' || fieldKey === 'reu') {
        // Reconstruct partes string
        data.partes = draft // Will be handled by caller
      }
      if (fieldKey === 'vara') data.vara = draft

      await atualizarDadosPericia(periciaId, data as never)
      setEditing(false)
      onSaved()
    })
  }

  const displayValue = value || 'Não informado'
  const isEmpty = !value

  if (editing) {
    return (
      <div className="bg-slate-800 px-5 py-4 flex flex-col gap-1.5">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</p>
        <div className="flex items-center gap-2">
          <input
            autoFocus
            className="flex-1 bg-slate-700 text-white text-[12px] font-bold uppercase tracking-tight px-2 py-1 border border-slate-600 focus:border-[#a3e635] focus:outline-none"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          />
          <button onClick={handleSave} disabled={saving} className="text-[#a3e635] hover:text-white transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-slate-900 px-5 py-5 flex flex-col gap-1.5 cursor-pointer hover:bg-slate-800 transition-colors group"
      onClick={() => setEditing(true)}
    >
      <div className="flex items-center justify-between">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</p>
        <Pencil className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className={cn(
        'text-[12px] font-bold tracking-tight uppercase truncate',
        isEmpty ? 'text-slate-500 italic' : 'text-white',
      )}>
        {displayValue}
      </p>
    </div>
  )
}

export function PericiaHeaderEdit({ periciaId, processo, autor, reu, vara, perito }: Props) {
  const router = useRouter()

  return (
    <div className="border-t border-slate-200 bg-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-px bg-slate-800">
        <EditableField label="Processo" value={processo} fieldKey="processo" periciaId={periciaId} onSaved={() => router.refresh()} />
        <EditableField label="Autor" value={autor} fieldKey="autor" periciaId={periciaId} onSaved={() => router.refresh()} />
        <EditableField label="Réu" value={reu} fieldKey="reu" periciaId={periciaId} onSaved={() => router.refresh()} />
        <EditableField label="Vara" value={vara} fieldKey="vara" periciaId={periciaId} onSaved={() => router.refresh()} />
        <div className="bg-slate-900 px-5 py-5 flex flex-col gap-1.5">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Perito</p>
          <p className="text-[12px] font-bold tracking-tight uppercase truncate text-[#a3e635]">{perito}</p>
        </div>
      </div>
    </div>
  )
}

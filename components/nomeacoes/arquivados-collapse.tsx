'use client'

import { useState } from 'react'
import { ChevronDown, Archive } from 'lucide-react'

interface NomeacaoItem {
  id: string
  status: string
  processo: {
    numeroProcesso: string
    tribunal: string
    classe: string | null
  }
}

interface Props {
  nomeacoes: NomeacaoItem[]
}

export function ArquivadosCollapse({ nomeacoes }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-slate-100 pt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[12px] font-inter font-semibold uppercase tracking-[0.08em] text-[#6b7280] hover:text-[#374151] transition-colors"
      >
        <Archive className="h-3.5 w-3.5" />
        Arquivados ({nomeacoes.length})
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {nomeacoes.map((n) => (
            <div key={n.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 opacity-60">
              <p className="text-[13px] font-bold text-slate-500">{n.processo.classe ?? n.processo.numeroProcesso}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{n.processo.tribunal} · {n.processo.numeroProcesso}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

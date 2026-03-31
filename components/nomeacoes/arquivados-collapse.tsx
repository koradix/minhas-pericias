'use client'

import { useState } from 'react'
import { ChevronDown, Archive } from 'lucide-react'
import { NomeacaoCard } from './nomeacao-card'
import type { NomeacaoComProcesso } from '@/lib/data/nomeacoes-datajud'

interface Props {
  nomeacoes: NomeacaoComProcesso[]
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
            <NomeacaoCard key={n.id} nomeacao={n} />
          ))}
        </div>
      )}
    </div>
  )
}

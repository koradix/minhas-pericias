'use client'

import { useState } from 'react'
import { Loader2, Download } from 'lucide-react'
import { solicitarDownloadAutos } from '@/lib/actions/advogado-parceiro'

interface Props {
  cnj: string
}

export function BaixarAutosBtn({ cnj }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleClick() {
    if (!cnj) return
    setLoading(true)
    setResult(null)
    const res = await solicitarDownloadAutos(cnj)
    setResult(res)
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading || !cnj}
        className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 transition-all disabled:opacity-30"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {cnj ? 'Baixar autos do processo' : 'Nº do processo não disponível'}
      </button>
      {result && (
        <p className={`text-[10px] font-bold mt-2 ${result.ok ? 'text-[#4d7c0f]' : 'text-rose-600'}`}>
          {result.message}
        </p>
      )}
    </div>
  )
}

'use client'

/**
 * Botao "Carregar Documentos" — baixa autos via Judit.
 * Só download. Análise IA é etapa separada.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  periciaId: string
  cnj: string | null
}

export function JuditAutosBtn({ periciaId, cnj }: Props) {
  const [loading, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const router = useRouter()

  function handleClick() {
    if (!cnj) return
    startTransition(async () => {
      setResult(null)
      try {
        const res = await fetch('/api/integrations/judit/carregar-autos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ periciaId }),
        })
        const data = await res.json()
        setResult({ ok: data.ok, message: data.message })
        if (data.ok) router.refresh()
      } catch {
        setResult({ ok: false, message: 'Erro de conexao' })
      }
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading || !cnj}
        className="flex items-center gap-2 bg-[#a3e635] text-slate-900 hover:bg-[#bef264] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        {loading ? 'Baixando documentos...' : cnj ? 'Carregar documentos' : 'Sem numero de processo'}
      </button>

      {!loading && result && (
        <div className={cn(
          'flex items-center gap-2 mt-2 text-[10px] font-bold',
          result.ok ? 'text-[#4d7c0f]' : 'text-rose-600',
        )}>
          {result.ok ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {result.message}
        </div>
      )}
    </div>
  )
}

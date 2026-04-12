'use client'

/**
 * Busca nomeações via Judit (CPF do perito).
 * Cria NomeacaoCitacao (NAO Pericia).
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  cpf: string | null
}

export function JuditSearchBtn({ cpf }: Props) {
  const [loading, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const router = useRouter()

  function handleSearch() {
    if (!cpf) return
    startTransition(async () => {
      setResult(null)
      try {
        const res = await fetch('/api/integrations/judit/fetch-by-cpf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf }),
        })
        const data = await res.json()
        setResult({ ok: data.ok, message: data.message })
        if (data.ok) router.refresh()
      } catch {
        setResult({ ok: false, message: 'Erro de conexao' })
      }
    })
  }

  if (!cpf) return null

  return (
    <div className="space-y-3">
      <button
        onClick={handleSearch}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-[#a3e635] text-slate-900 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#bef264] transition-all disabled:opacity-40"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Buscando nomeações...</>
        ) : (
          <><Search className="h-4 w-4" /> Buscar Nomeações</>
        )}
      </button>

      {result && (
        <div className={cn(
          'border px-5 py-4',
          result.ok ? 'border-lime-200 bg-lime-50' : 'border-rose-200 bg-rose-50',
        )}>
          <div className="flex items-center gap-2">
            {result.ok ? <CheckCircle className="h-4 w-4 text-[#4d7c0f]" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
            <p className={cn('text-[11px] font-bold', result.ok ? 'text-[#4d7c0f]' : 'text-rose-600')}>
              {result.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

/**
 * Botao de busca de processos via Judit (CPF).
 *
 * Pesquisa por CPF do perito → encontra processos → cria/atualiza pericias.
 * Isolado do Escavador. Protegido por JUDIT_ENABLED no endpoint.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  cpf: string | null
}

interface SearchResult {
  ok: boolean
  message: string
  totalProcessos?: number
  periciasCriadas?: number
  periciasAtualizadas?: number
  movimentacoesSincronizadas?: number
  anexosSincronizados?: number
  periciaIds?: string[]
}

export function JuditSearchBtn({ cpf }: Props) {
  const [loading, startTransition] = useTransition()
  const [result, setResult] = useState<SearchResult | null>(null)
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
        const data: SearchResult = await res.json()
        setResult(data)
        if (data.ok) {
          router.refresh()
          // Se criou 1 pericia, redireciona direto
          if (data.periciasCriadas === 1 && data.periciaIds?.length === 1) {
            setTimeout(() => router.push(`/pericias/${data.periciaIds![0]}`), 1500)
          }
        }
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
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando processos na Judit...
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Buscar processos por CPF (Judit)
          </>
        )}
      </button>

      {result && (
        <div className={cn(
          'border px-5 py-4 space-y-2',
          result.ok ? 'border-lime-200 bg-lime-50' : 'border-rose-200 bg-rose-50',
        )}>
          <div className="flex items-center gap-2">
            {result.ok
              ? <CheckCircle className="h-4 w-4 text-[#4d7c0f]" />
              : <AlertTriangle className="h-4 w-4 text-rose-600" />
            }
            <p className={cn(
              'text-[11px] font-bold uppercase tracking-widest',
              result.ok ? 'text-[#4d7c0f]' : 'text-rose-600',
            )}>
              {result.message}
            </p>
          </div>

          {result.ok && result.totalProcessos !== undefined && result.totalProcessos > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { label: 'Processos', value: result.totalProcessos },
                { label: 'Criadas', value: result.periciasCriadas },
                { label: 'Atualizadas', value: result.periciasAtualizadas },
                { label: 'Movimentacoes', value: result.movimentacoesSincronizadas },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-[18px] font-black text-slate-900">{s.value ?? 0}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

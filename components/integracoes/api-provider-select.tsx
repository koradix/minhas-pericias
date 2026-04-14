'use client'

/**
 * Seletor de provedor de API para busca de nomeações e documentos.
 *
 * Opções:
 * - Judit: busca por CPF, baixa documentos do tribunal
 * - Escavador: busca por nome nos diários oficiais
 * - Ambos: Escavador acha, Judit enriquece com CNJ + docs
 * - Manual: sem API, perito sobe documentos manualmente
 *
 * Persiste no banco (admin) via server action.
 */

import { useState, useEffect, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ApiProvider = 'escavador' | 'judit' | 'both' | 'manual'

const STORAGE_KEY = 'perilab_api_provider'

const OPTIONS: { id: ApiProvider; label: string; desc: string; badge?: string }[] = [
  { id: 'both',      label: 'Ambos (recomendado)', desc: 'Escavador busca por nome + Judit enriquece com CNJ e baixa documentos', badge: 'Completo' },
  { id: 'judit',     label: 'Apenas Judit',        desc: 'Busca por CPF, baixa documentos do tribunal, análise IA' },
  { id: 'escavador', label: 'Apenas Escavador',    desc: 'Busca por nome nos diários oficiais (sem download de docs)' },
  { id: 'manual',    label: 'Manual',               desc: 'Sem API — perito sobe documentos manualmente para análise IA' },
]

export function getApiProvider(): ApiProvider {
  if (typeof window === 'undefined') return 'escavador'
  return (localStorage.getItem(STORAGE_KEY) as ApiProvider) ?? 'both'
}

export function ApiProviderSelect() {
  const [provider, setProvider] = useState<ApiProvider>('both')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setProvider(getApiProvider())
  }, [])

  function handleSelect(id: ApiProvider) {
    setProvider(id)
    localStorage.setItem(STORAGE_KEY, id)
    startTransition(async () => {
      try {
        await fetch('/api/integracoes/provider', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: id }),
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch {}
    })
  }

  return (
    <div className="space-y-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => handleSelect(opt.id)}
          disabled={isPending}
          className={cn(
            'w-full flex items-center gap-4 border p-4 text-left transition-all',
            provider === opt.id
              ? 'border-[#a3e635] bg-lime-50'
              : 'border-slate-200 bg-white hover:border-slate-300',
          )}
        >
          <div className={cn(
            'flex h-5 w-5 items-center justify-center border-2 flex-shrink-0',
            provider === opt.id
              ? 'border-[#a3e635] bg-[#a3e635]'
              : 'border-slate-300 bg-white',
          )}>
            {provider === opt.id && <Check className="h-3 w-3 text-white" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className={cn(
                'text-[13px] font-semibold',
                provider === opt.id ? 'text-slate-900' : 'text-slate-700',
              )}>
                {opt.label}
              </p>
              {opt.badge && (
                <span className="text-[8px] font-black uppercase tracking-widest bg-slate-900 text-[#a3e635] px-1.5 py-0.5">{opt.badge}</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">{opt.desc}</p>
          </div>
        </button>
      ))}
      {saved && (
        <p className="text-[10px] font-bold text-[#4d7c0f] flex items-center gap-1">
          <Check className="h-3 w-3" /> Configuração salva
        </p>
      )}
    </div>
  )
}

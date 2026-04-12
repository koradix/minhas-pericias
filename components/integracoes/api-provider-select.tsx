'use client'

/**
 * Seletor de provedor de API para busca de nomeações.
 * Opções: Escavador, Judit, ou ambos (complementar).
 * Salva no localStorage — sem persistir no banco.
 */

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ApiProvider = 'escavador' | 'judit' | 'both'

const STORAGE_KEY = 'perilab_api_provider'

const OPTIONS: { id: ApiProvider; label: string; desc: string }[] = [
  { id: 'judit',     label: 'Judit',              desc: 'Busca por CPF na Judit (recomendado)' },
  { id: 'escavador', label: 'Escavador',           desc: 'Busca por nome nos diários oficiais' },
  { id: 'both',      label: 'Ambos (complementar)', desc: 'Usa Judit primeiro, Escavador como fallback' },
]

export function getApiProvider(): ApiProvider {
  if (typeof window === 'undefined') return 'judit'
  return (localStorage.getItem(STORAGE_KEY) as ApiProvider) ?? 'judit'
}

export function ApiProviderSelect() {
  const [provider, setProvider] = useState<ApiProvider>('judit')

  useEffect(() => {
    setProvider(getApiProvider())
  }, [])

  function handleSelect(id: ApiProvider) {
    setProvider(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return (
    <div className="space-y-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => handleSelect(opt.id)}
          className={cn(
            'w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all',
            provider === opt.id
              ? 'border-[#a3e635] bg-lime-50'
              : 'border-slate-200 bg-white hover:border-slate-300',
          )}
        >
          <div className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border-2 flex-shrink-0',
            provider === opt.id
              ? 'border-[#a3e635] bg-[#a3e635]'
              : 'border-slate-300 bg-white',
          )}>
            {provider === opt.id && <Check className="h-3 w-3 text-white" />}
          </div>
          <div>
            <p className={cn(
              'text-[13px] font-semibold',
              provider === opt.id ? 'text-slate-900' : 'text-slate-700',
            )}>
              {opt.label}
            </p>
            <p className="text-[11px] text-slate-500">{opt.desc}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

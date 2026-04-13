'use client'

/**
 * Botão único "Buscar Nomeações" que internamente usa o provedor configurado.
 * - both: chama Escavador + Judit em sequência
 * - judit: só Judit (CPF)
 * - escavador: só Escavador (nome)
 * - manual: esconde o botão de busca
 */

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buscarNomeacoes, setupRadar } from '@/lib/actions/nomeacoes'

type ApiProvider = 'escavador' | 'judit' | 'both' | 'manual'

interface Props {
  cpf: string | null
  siglas: string[]
  radarConfigurado: boolean
}

export function SearchProviderSwitch({ cpf, siglas, radarConfigurado }: Props) {
  const [provider, setProvider] = useState<ApiProvider>('both')
  const [loading, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showManual, setShowManual] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('perilab_api_provider') as ApiProvider | null
    if (stored) setProvider(stored)
  }, [])

  function handleBuscar() {
    startTransition(async () => {
      setResult(null)
      let totalNovas = 0
      const msgs: string[] = []

      // Escavador (busca por nome)
      if (provider === 'escavador' || provider === 'both') {
        try {
          if (!radarConfigurado) await setupRadar()
          const res = await buscarNomeacoes()
          if (res.ok) {
            totalNovas += res.novas
            msgs.push(`Escavador: ${res.novas} novas`)
          } else {
            msgs.push(`Escavador: ${res.error}`)
          }
        } catch {}
      }

      // Judit (busca por CPF)
      if ((provider === 'judit' || provider === 'both') && cpf) {
        try {
          const res = await fetch('/api/integrations/judit/fetch-by-cpf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf }),
          }).then(r => r.json()).catch(() => null)
          if (res?.ok) {
            totalNovas += res.periciasCriadas ?? 0
            msgs.push(`Judit: ${res.totalProcessos ?? 0} processos, ${res.periciasCriadas ?? 0} nomeações`)
          } else if (res?.message) {
            msgs.push(`Judit: ${res.message}`)
          }
        } catch {}
      }

      if (totalNovas > 0) {
        setResult({ ok: true, message: `${totalNovas} nova${totalNovas > 1 ? 's' : ''} nomeaç${totalNovas > 1 ? 'ões' : 'ão'} encontrada${totalNovas > 1 ? 's' : ''}` })
      } else {
        setResult({ ok: msgs.length > 0, message: msgs.join(' · ') || 'Nenhuma nomeação nova encontrada' })
      }
      router.refresh()
    })
  }

  if (provider === 'manual') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setShowManual(!showManual)}
          className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Registrar manualmente
        </button>
        <p className="text-[9px] text-slate-400 uppercase tracking-widest">
          Modo manual · <a href="/integracoes" className="text-slate-500 hover:text-slate-700 underline">Alterar</a>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleBuscar}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {loading ? 'Buscando nomeações...' : 'Buscar nomeações'}
      </button>

      {result && (
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 text-[10px] font-bold',
          result.ok ? 'text-[#4d7c0f] bg-lime-50' : 'text-slate-500 bg-slate-50',
        )}>
          {result.ok ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {result.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowManual(!showManual)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Registrar manualmente
        </button>
        <p className="text-[9px] text-slate-400 uppercase tracking-widest">
          {provider === 'both' ? 'Escavador + Judit' : provider === 'judit' ? 'Judit' : 'Escavador'}
          {' · '}
          <a href="/integracoes" className="text-slate-500 hover:text-slate-700 underline">Alterar</a>
        </p>
      </div>
    </div>
  )
}

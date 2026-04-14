'use client'

/**
 * Buscar Nomeações + Registrar Manualmente — lado a lado.
 * Provedor configurável (Escavador/Judit/ambos/manual).
 */

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buscarNomeacoes, setupRadar } from '@/lib/actions/nomeacoes'
import { NomeacaoDocumentosSection } from '@/components/nomeacoes/nomeacao-documentos'

type ApiProvider = 'escavador' | 'judit' | 'both' | 'manual'

interface Props {
  cpf: string | null
  siglas: string[]
  radarConfigurado: boolean
}

export function SearchProviderSwitch({ cpf, radarConfigurado }: Props) {
  const [provider, setProvider] = useState<ApiProvider>('escavador')
  const [loading, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showUpload, setShowUpload] = useState(false)
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

      if (provider === 'escavador' || provider === 'both') {
        try {
          if (!radarConfigurado) await setupRadar()
          const res = await buscarNomeacoes()
          if (res.ok) { totalNovas += res.novas; msgs.push(`Escavador: ${res.novas} novas`) }
          else msgs.push(`Escavador: ${res.error}`)
        } catch {}
      }

      if ((provider === 'judit' || provider === 'both') && cpf) {
        try {
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), 25000)
          const res = await fetch('/api/integrations/judit/fetch-by-cpf', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf }),
            signal: controller.signal,
          }).then(r => r.json()).catch(() => null)
          clearTimeout(timer)
          if (res?.ok) { totalNovas += res.periciasCriadas ?? 0; msgs.push(`Judit: ${res.periciasCriadas ?? 0} nomeações`) }
          else if (res?.message) msgs.push(`Judit: ${res.message}`)
        } catch {
          msgs.push('Judit: processando...')
        }
      }

      setResult({
        ok: totalNovas > 0,
        message: totalNovas > 0
          ? `${totalNovas} nova${totalNovas > 1 ? 's' : ''} nomeaç${totalNovas > 1 ? 'ões' : 'ão'}`
          : msgs.join(' · ') || 'Nenhuma nomeação nova',
      })
      router.refresh()
    })
  }

  const isManualOnly = provider === 'manual'

  return (
    <div className="space-y-3">
      {/* Botões lado a lado */}
      <div className="flex gap-3">
        {!isManualOnly && (
          <button
            onClick={handleBuscar}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? 'Buscando...' : 'Buscar nomeações'}
          </button>
        )}
        <button
          onClick={() => setShowUpload(!showUpload)}
          className={cn(
            'flex items-center justify-center gap-2 px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-2',
            showUpload
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400',
            isManualOnly && 'flex-1',
          )}
        >
          <Upload className="h-4 w-4" />
          Registrar manualmente
        </button>
      </div>

      {/* Resultado da busca */}
      {result && (
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 text-[10px] font-bold',
          result.ok ? 'text-[#4d7c0f] bg-lime-50' : 'text-slate-500 bg-slate-50',
        )}>
          {result.ok ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {result.message}
        </div>
      )}

      {/* Upload inline */}
      {showUpload && (
        <div className="border border-slate-200 bg-white p-4">
          <NomeacaoDocumentosSection
            variant="minimal"
            nomeacaoId=""
            tribunal="TJRJ"
            numeroProcesso=""
            nomeArquivo={null}
          />
        </div>
      )}

      {/* Provedor oculto — config em /integracoes */}
    </div>
  )
}

'use client'

/**
 * Buscar Nomeações (Escavador) + Registrar Manualmente.
 * MVP: só Escavador. Judit em standby.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buscarNomeacoes, setupRadar } from '@/lib/actions/nomeacoes'
import { NomeacaoDocumentosSection } from '@/components/nomeacoes/nomeacao-documentos'

interface Props {
  cpf: string | null
  siglas: string[]
  radarConfigurado: boolean
}

export function SearchProviderSwitch({ radarConfigurado }: Props) {
  const [loading, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const router = useRouter()

  function handleBuscar() {
    startTransition(async () => {
      setResult(null)
      try {
        if (!radarConfigurado) await setupRadar()
        const res = await buscarNomeacoes()
        if (res.ok) {
          setResult({ ok: true, message: `${res.novas} nova${res.novas !== 1 ? 's' : ''} nomeaç${res.novas !== 1 ? 'ões' : 'ão'}` })
        } else {
          setResult({ ok: false, message: res.error })
        }
      } catch {
        setResult({ ok: false, message: 'Erro ao buscar' })
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          onClick={handleBuscar}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Buscando...' : 'Buscar nomeações'}
        </button>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className={cn(
            'flex items-center justify-center gap-2 px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-2',
            showUpload
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400',
          )}
        >
          <Upload className="h-4 w-4" />
          Registrar manualmente
        </button>
      </div>

      {result && (
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 text-[10px] font-bold',
          result.ok ? 'text-[#4d7c0f] bg-lime-50' : 'text-slate-500 bg-slate-50',
        )}>
          {result.ok ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {result.message}
        </div>
      )}

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
    </div>
  )
}

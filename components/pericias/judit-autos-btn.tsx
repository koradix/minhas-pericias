'use client'

/**
 * Botão "Carregar Documentos" — fluxo async.
 *
 * 1. Click → cria request na Judit (instantâneo)
 * 2. Polling client-side a cada 5s (leve, GET /request-status)
 * 3. Quando completed → sync dados no banco
 * 4. Refresh da página
 */

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  periciaId: string
  cnj: string | null
}

type Fase = 'idle' | 'criando' | 'polling' | 'syncing' | 'done' | 'erro'

const FASE_MSG: Record<Fase, string> = {
  idle: '',
  criando: 'Conectando ao tribunal...',
  polling: 'Aguardando tribunal processar...',
  syncing: 'Sincronizando documentos...',
  done: 'Documentos carregados!',
  erro: '',
}

export function JuditAutosBtn({ periciaId, cnj }: Props) {
  const [fase, setFase] = useState<Fase>('idle')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, startTransition] = useTransition()
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  function handleClick() {
    if (!cnj) return
    startTransition(async () => {
      setError(null)
      setFase('criando')

      try {
        // Fase 1: Criar request (instantâneo)
        const res = await fetch('/api/integrations/judit/carregar-autos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ periciaId, action: 'iniciar' }),
        })
        const data = await res.json()

        if (!data.ok) {
          setFase('erro')
          setError(data.message)
          return
        }

        const reqId = data.requestId
        setRequestId(reqId)
        setFase('polling')

        // Fase 2: Polling client-side
        startPolling(reqId)
      } catch {
        setFase('erro')
        setError('Erro de conexão')
      }
    })
  }

  function startPolling(reqId: string) {
    let attempts = 0
    const maxAttempts = 60 // 5min max

    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > maxAttempts) {
        clearInterval(pollRef.current!)
        setFase('erro')
        setError('Timeout — tente novamente em alguns minutos')
        return
      }

      try {
        const res = await fetch(`/api/integrations/judit/request-status?requestId=${reqId}`)
        const data = await res.json()

        if (data.status === 'completed') {
          clearInterval(pollRef.current!)
          await doSync()
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current!)
          setFase('erro')
          setError('O tribunal não retornou os dados')
        }
        // pending/processing → continua polling
      } catch {
        // Ignora erros de rede no polling
      }
    }, 5000)
  }

  async function doSync() {
    setFase('syncing')
    try {
      const res = await fetch('/api/integrations/judit/carregar-autos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periciaId, action: 'sync' }),
      })
      const data = await res.json()

      if (data.ok) {
        setFase('done')
        router.refresh()
      } else {
        setFase('erro')
        setError(data.message)
      }
    } catch {
      setFase('erro')
      setError('Erro ao sincronizar')
    }
  }

  const isLoading = fase === 'criando' || fase === 'polling' || fase === 'syncing' || loading

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading || !cnj}
        className="flex items-center gap-2 bg-[#a3e635] text-slate-900 hover:bg-[#bef264] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30"
      >
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        {cnj ? (isLoading ? FASE_MSG[fase] || 'Carregando...' : 'Carregar documentos') : 'Sem número de processo'}
      </button>

      {fase === 'done' && (
        <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-[#4d7c0f]">
          <CheckCircle className="h-3 w-3" />
          Documentos carregados com sucesso
        </div>
      )}

      {fase === 'erro' && error && (
        <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-rose-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  )
}

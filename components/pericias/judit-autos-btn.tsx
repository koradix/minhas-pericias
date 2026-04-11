'use client'

/**
 * Botao para baixar autos do processo via Judit.
 *
 * Fluxo: sync pericia (busca dados + movimentacoes + anexos metadata)
 *        → download attachments (baixa arquivos reais pro Vercel Blob)
 *        → refresh da pagina
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Loader2, CheckCircle } from 'lucide-react'
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

      // 1. Sync — busca dados, movimentacoes, metadados dos anexos
      const syncRes = await fetch('/api/integrations/judit/sync-pericia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periciaId }),
      }).then(r => r.json()).catch(() => ({ ok: false, message: 'Erro na sincronizacao' }))

      if (!syncRes.ok) {
        setResult(syncRes)
        return
      }

      // 2. Download — baixa arquivos reais
      const dlRes = await fetch('/api/integrations/judit/download-attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periciaId }),
      }).then(r => r.json()).catch(() => ({ ok: false, message: 'Erro no download' }))

      setResult({
        ok: dlRes.ok,
        message: dlRes.ok
          ? `Sincronizado: ${syncRes.movementsCount ?? 0} movimentacoes, ${dlRes.baixados ?? 0} anexos baixados`
          : dlRes.message,
      })

      if (dlRes.ok) router.refresh()
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading || !cnj}
        className="flex items-center gap-2 bg-[#a3e635] text-slate-900 hover:bg-[#bef264] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {cnj ? 'Baixar autos via Judit' : 'Sem numero de processo'}
      </button>
      {result && (
        <div className={cn(
          'flex items-center gap-2 mt-2 text-[10px] font-bold',
          result.ok ? 'text-[#4d7c0f]' : 'text-rose-600',
        )}>
          {result.ok && <CheckCircle className="h-3 w-3" />}
          {result.message}
        </div>
      )}
    </div>
  )
}

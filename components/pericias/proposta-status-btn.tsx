'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, FileCheck, Send } from 'lucide-react'
import { updatePropostaStatus } from '@/lib/actions/propostas-honorarios'

// ── Shared status display map (safe to use in both server and client) ─────────

export const PROPOSTA_STATUS: Record<string, { label: string; badge: string }> = {
  rascunho: {
    label: 'Rascunho',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  gerada: {
    label: 'Gerada',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  enviada: {
    label: 'Enviada',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
}

// ── Badge-only (usable in server components via import) ───────────────────────

export function PropostaStatusBadge({ status }: { status: string }) {
  const s = PROPOSTA_STATUS[status] ?? PROPOSTA_STATUS.rascunho
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider border rounded-full px-2.5 py-1 ${s.badge}`}
    >
      {s.label}
    </span>
  )
}

// ── Status + transition buttons ───────────────────────────────────────────────

interface PropostaStatusBtnProps {
  pericoId: string
  currentStatus: string
}

export function PropostaStatusBtn({ pericoId, currentStatus }: PropostaStatusBtnProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function advance(next: 'gerada' | 'enviada') {
    startTransition(async () => {
      await updatePropostaStatus(pericoId, next)
      router.refresh()
    })
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      <PropostaStatusBadge status={currentStatus} />

      {currentStatus === 'rascunho' && (
        <button
          onClick={() => advance('gerada')}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 font-semibold text-xs px-3 py-1.5 transition-colors"
        >
          {isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <FileCheck className="h-3.5 w-3.5" />
          }
          Marcar como gerada
        </button>
      )}

      {currentStatus === 'gerada' && (
        <button
          onClick={() => advance('enviada')}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 font-semibold text-xs px-3 py-1.5 transition-colors"
        >
          {isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Send className="h-3.5 w-3.5" />
          }
          Marcar como enviada
        </button>
      )}
    </div>
  )
}

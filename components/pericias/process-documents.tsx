'use client'

/**
 * Documentos do processo vindos da Judit.
 *
 * Separado dos documentos do laudo e dos documentos do Escavador.
 * Exibe: nome, data, status do arquivo, acao para abrir/baixar.
 * NÃO exibe origem do documento (regra do usuario).
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Download, RefreshCw, Loader2, Check, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Attachment {
  id: string
  name: string
  type: string | null
  mimeType: string | null
  isPublic: boolean
  downloadAvailable: boolean
  url: string | null
  blobUrl: string | null
  downloadStatus: string // pending | downloaded | failed | unavailable
  publishedAt: string | null
}

interface Props {
  periciaId: string
  attachments: Attachment[]
}

function formatDate(iso: string | null) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

const STATUS_CONFIG: Record<string, { icon: typeof Check; label: string; className: string }> = {
  downloaded: { icon: Check, label: 'Baixado', className: 'text-[#4d7c0f] bg-lime-50 border-lime-200' },
  pending:    { icon: Clock, label: 'Pendente', className: 'text-amber-600 bg-amber-50 border-amber-200' },
  failed:     { icon: X,     label: 'Erro', className: 'text-rose-600 bg-rose-50 border-rose-200' },
  unavailable:{ icon: X,     label: 'Indisponivel', className: 'text-slate-400 bg-slate-50 border-slate-200' },
}

export function ProcessDocuments({ periciaId, attachments }: Props) {
  const [syncLoading, startSyncTransition] = useTransition()
  const [dlLoading, startDlTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const router = useRouter()

  const hasPending = attachments.some((a) => a.downloadStatus === 'pending' || a.downloadStatus === 'failed')

  function handleSync() {
    startSyncTransition(async () => {
      setResult(null)
      try {
        const res = await fetch('/api/integrations/judit/sync-pericia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ periciaId }),
        })
        const data = await res.json()
        setResult({ ok: data.ok, message: data.message })
        if (data.ok) router.refresh()
      } catch {
        setResult({ ok: false, message: 'Erro ao sincronizar' })
      }
    })
  }

  function handleDownloadAll() {
    startDlTransition(async () => {
      setResult(null)
      try {
        const res = await fetch('/api/integrations/judit/download-attachments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ periciaId }),
        })
        const data = await res.json()
        setResult({ ok: data.ok, message: data.message })
        if (data.ok) router.refresh()
      } catch {
        setResult({ ok: false, message: 'Erro ao baixar anexos' })
      }
    })
  }

  const loading = syncLoading || dlLoading

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">
          Documentos do Processo
        </h2>
        <div className="h-px flex-1 bg-slate-900/10" />
      </div>

      <div className="border border-slate-200 bg-white">
        {attachments.length === 0 ? (
          <div className="px-8 py-12 text-center space-y-4">
            <FileText className="h-8 w-8 text-slate-200 mx-auto" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Nenhum documento do processo sincronizado
            </p>
            <button
              onClick={handleSync}
              disabled={loading}
              className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 transition-all disabled:opacity-30"
            >
              {syncLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Sincronizar documentos
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {attachments.map((att) => {
                const statusCfg = STATUS_CONFIG[att.downloadStatus] ?? STATUS_CONFIG.pending
                const StatusIcon = statusCfg.icon
                const fileUrl = att.blobUrl
                  ? `/api/integrations/judit/attachment?id=${att.id}`
                  : att.url
                const canOpen = att.downloadStatus === 'downloaded' || !!att.url

                return (
                  <div key={att.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                    <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-slate-900 truncate">
                        {att.name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {att.type && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {att.type}
                          </span>
                        )}
                        {formatDate(att.publishedAt) && (
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                            {formatDate(att.publishedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 border',
                        statusCfg.className,
                      )}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {statusCfg.label}
                      </span>
                      {canOpen && fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                          title="Abrir documento"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer with actions */}
            <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {attachments.length} documento{attachments.length !== 1 ? 's' : ''}
                {' · '}
                {attachments.filter((a) => a.downloadStatus === 'downloaded').length} baixado{attachments.filter((a) => a.downloadStatus === 'downloaded').length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-3">
                {hasPending && (
                  <button
                    onClick={handleDownloadAll}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#4d7c0f] hover:text-[#3f6212] transition-colors disabled:opacity-30"
                  >
                    {dlLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    Baixar pendentes
                  </button>
                )}
                <button
                  onClick={handleSync}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-30"
                >
                  {syncLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Atualizar
                </button>
              </div>
            </div>
          </>
        )}

        {result && (
          <div className={cn(
            'px-6 py-3 text-[10px] font-bold border-t',
            result.ok ? 'text-[#4d7c0f] bg-lime-50 border-lime-100' : 'text-rose-600 bg-rose-50 border-rose-100',
          )}>
            {result.message}
          </div>
        )}
      </div>
    </section>
  )
}

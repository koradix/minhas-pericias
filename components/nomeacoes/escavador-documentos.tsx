'use client'

import { useState, useTransition } from 'react'
import {
  FileText, Download, Loader2, Search, AlertCircle, FileX, Calendar, Hash,
} from 'lucide-react'
import { buscarDocumentosNomeacao, listarDocumentosNomeacao, type ProcessoDocumentoRow } from '@/lib/actions/nomeacoes-documentos'

interface Props {
  nomeacaoId: string
  initialDocs: ProcessoDocumentoRow[]
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export function EscavadorDocumentosSection({ nomeacaoId, initialDocs }: Props) {
  const [docs, setDocs]       = useState<ProcessoDocumentoRow[]>(initialDocs)
  const [error, setError]     = useState<string | null>(null)
  const [naoSuportado, setNaoSuportado] = useState(false)
  const [buscado, setBuscado] = useState(initialDocs.length > 0)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleBuscar() {
    setError(null)
    startTransition(async () => {
      const res = await buscarDocumentosNomeacao(nomeacaoId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      if (!res.suportado) {
        setNaoSuportado(true)
        setBuscado(true)
        return
      }
      const atualizados = await listarDocumentosNomeacao(nomeacaoId)
      setDocs(atualizados)
      setBuscado(true)
    })
  }

  async function handleDownload(doc: ProcessoDocumentoRow) {
    setDownloading(doc.id)
    try {
      const res = await fetch(`/api/nomeacoes/doc-download?docId=${doc.id}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        setError(json.error ?? `Erro HTTP ${res.status}`)
        return
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = doc.nome.replace(/[^a-zA-Z0-9._\- ]/g, '_') + '.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar documento')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
            <FileText className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800">Documentos do processo</h2>
          {docs.length > 0 && (
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-500 rounded-md px-1.5 py-0.5">
              {docs.length}
            </span>
          )}
        </div>
        <button
          onClick={handleBuscar}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          {isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Search className="h-3.5 w-3.5" />
          }
          {buscado ? 'Atualizar' : 'Buscar no Escavador'}
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        )}

        {naoSuportado && (
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Este tribunal não disponibiliza os autos eletronicamente via API Escavador.
              Acesse o portal do tribunal diretamente para baixar os documentos.
            </p>
          </div>
        )}

        {!buscado && !naoSuportado && docs.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <FileX className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">
              Clique em &quot;Buscar no Escavador&quot; para verificar se há documentos disponíveis para este processo.
            </p>
          </div>
        )}

        {docs.length > 0 && (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-800 leading-snug">{doc.nome}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    {doc.tipo && (
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {doc.tipo}
                      </span>
                    )}
                    {doc.dataPublicacao && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {fmtDate(doc.dataPublicacao)}
                      </span>
                    )}
                    {doc.paginas && (
                      <span>{doc.paginas} págs.</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloading === doc.id}
                  title="Baixar documento"
                  className="flex items-center gap-1.5 flex-shrink-0 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-[11px] font-semibold px-2.5 py-1.5 transition-colors disabled:opacity-50"
                >
                  {downloading === doc.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Download className="h-3.5 w-3.5" />
                  }
                  Baixar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

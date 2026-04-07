'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Eye, FileText, Hash, Loader2, Plus, X, ShieldCheck, Download, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { marcarVisualizado } from '@/lib/actions/nomeacoes'
import { criarPericiaDeCitacao, rejeitarCitacao } from '@/lib/actions/citacao-to-pericia'
import { buscarDocumentosPorCitacao, listarDocumentosPorCitacao } from '@/lib/actions/citacao-documentos'
import type { CitacaoSerializada } from '@/lib/data/nomeacoes'
import type { CitacaoDocumento } from '@/lib/actions/citacao-documentos'
import { cn } from '@/lib/utils'

interface Props {
  citacoes: CitacaoSerializada[]
}

// ─── Single card ──────────────────────────────────────────────────────────────

function CitacaoCard({ citacao }: { citacao: CitacaoSerializada }) {
  const [expanded, setExpanded] = useState(false)
  const [lida, setLida] = useState(citacao.visualizado)
  const [isPending, startTransition] = useTransition()
  const [isCriando, startCriarTransition] = useTransition()
  const [isRejeitando, startRejeitarTransition] = useTransition()
  const [isBuscandoDocs, startBuscarDocs] = useTransition()
  const [criarErro, setCriarErro] = useState<string | null>(null)
  const [rejeitada, setRejeitada] = useState(false)
  const [docsStatus, setDocsStatus] = useState<'idle' | 'aguardando' | 'encontrado' | 'erro'>('idle')
  const [docsErro, setDocsErro] = useState('')
  const [docs, setDocs] = useState<CitacaoDocumento[]>([])
  const router = useRouter()

  const dataFormatada = new Date(citacao.diarioData).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  function handleMarcarLida() {
    startTransition(async () => {
      await marcarVisualizado(citacao.id)
      setLida(true)
    })
  }

  function handleCriarPericia() {
    setCriarErro(null)
    startCriarTransition(async () => {
      const res = await criarPericiaDeCitacao(citacao.id)
      if (res.ok) {
        setLida(true)
        router.push(`/pericias/${res.periciaId}`)
      } else {
        setCriarErro(res.error)
      }
    })
  }

  function handleRejeitar() {
    startRejeitarTransition(async () => {
      const res = await rejeitarCitacao(citacao.id)
      if (res.ok) setRejeitada(true)
    })
  }

  function handleBuscarDocs() {
    setDocsStatus('idle')
    setDocsErro('')
    startBuscarDocs(async () => {
      const res = await buscarDocumentosPorCitacao(citacao.id)
      if (!res.ok) { setDocsStatus('erro'); setDocsErro(res.error); return }
      if (res.status === 'aguardando') { setDocsStatus('aguardando'); return }
      // Encontrado — busca a lista
      const lista = await listarDocumentosPorCitacao(citacao.id)
      setDocs(lista)
      setDocsStatus('encontrado')
      setLida(true)
    })
  }

  if (rejeitada) return null

  const isLong = citacao.snippet.length > 220
  const snippet = !expanded && isLong ? `${citacao.snippet.slice(0, 220)}…` : citacao.snippet

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-all',
        lida ? 'border-slate-100 bg-white' : 'border-lime-200 bg-lime-50/40',
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <div className="flex-shrink-0 pt-1.5">
          {!lida ? (
            <span className="block h-2 w-2 rounded-full bg-lime-500" />
          ) : (
            <span className="block h-2 w-2 rounded-full bg-slate-200" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {/* Tribunal sigla */}
            <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
              {citacao.diarioSigla}
            </span>

            {/* Date */}
            <span className="text-xs text-slate-500">{dataFormatada}</span>

            {/* Manual badge */}
            {citacao.fonte === 'manual' && (
              <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                manual
              </span>
            )}
          </div>

          {/* Snippet */}
          <p className="text-xs text-slate-700 leading-relaxed">{snippet}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-[11px] font-medium text-lime-700 hover:text-lime-800"
            >
              {expanded ? 'Ver menos' : 'Ver mais'}
            </button>
          )}

          {/* Footer chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {citacao.numeroProcesso && (
              <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700 ring-1 ring-inset ring-blue-200">
                <Hash className="h-2.5 w-2.5" />
                {citacao.numeroProcesso}
              </span>
            )}

            {citacao.linkCitacao && (
              <a
                href={citacao.linkCitacao}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Ver no diário
              </a>
            )}

            <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
              {!lida && (
                <button
                  onClick={handleMarcarLida}
                  disabled={isPending || isCriando || isRejeitando}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-40"
                >
                  <Eye className="h-3 w-3" />
                  Marcar como lida
                </button>
              )}

              <button
                onClick={handleRejeitar}
                disabled={isRejeitando || isCriando}
                title="Descartar"
                className="flex items-center gap-1 rounded-md border border-slate-200 hover:border-rose-300 hover:text-rose-600 px-2 py-1 text-[11px] text-slate-400 transition-colors disabled:opacity-40"
              >
                {isRejeitando ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                Descartar
              </button>

              {/* Buscar documentos via PJe — ação primária quando tem CNJ */}
              {citacao.numeroProcesso && docsStatus === 'idle' && (
                <button
                  onClick={handleBuscarDocs}
                  disabled={isBuscandoDocs}
                  className="flex items-center gap-1 rounded-md bg-[#1f2937] hover:bg-[#374151] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors disabled:opacity-50"
                >
                  {isBuscandoDocs
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Buscando…</>
                    : <><ShieldCheck className="h-3 w-3" /> Buscar via PJe</>
                  }
                </button>
              )}

              {docsStatus === 'aguardando' && (
                <button
                  onClick={handleBuscarDocs}
                  disabled={isBuscandoDocs}
                  className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
                >
                  {isBuscandoDocs ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Aguardando PJe… verificar
                </button>
              )}

              <button
                onClick={handleCriarPericia}
                disabled={isCriando || isPending || isRejeitando}
                className="flex items-center gap-1 rounded-md bg-lime-500 hover:bg-lime-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors disabled:opacity-50"
              >
                {isCriando
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Criando…</>
                  : <><Plus className="h-3 w-3" /> Criar Perícia</>
                }
              </button>
            </div>
          </div>

          {docsStatus === 'erro' && (
            <p className="mt-2 text-[11px] text-rose-600">{docsErro}</p>
          )}

          {docsStatus === 'encontrado' && docs.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-[#416900] uppercase tracking-wider">
                {docs.length} documento{docs.length !== 1 ? 's' : ''} encontrado{docs.length !== 1 ? 's' : ''} no processo
              </p>
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 rounded-lg border border-[#d8f5a2] bg-[#f4fce3] px-3 py-2">
                  <FileText className="h-3.5 w-3.5 text-[#416900] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#1f2937] truncate">{doc.nome}</p>
                    {doc.dataPublicacao && (
                      <p className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
                        <Calendar className="h-2.5 w-2.5" />
                        {doc.dataPublicacao.split('-').reverse().join('/')}
                        {doc.paginas ? ` · ${doc.paginas} pág.` : ''}
                      </p>
                    )}
                  </div>
                  <a
                    href={`/api/nomeacoes/doc-download?docId=${doc.id}`}
                    download
                    title="Baixar PDF"
                    className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-[#d8f5a2] text-[#416900] transition-colors flex-shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {criarErro && (
            <p className="mt-2 text-[11px] text-rose-600">{criarErro}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function CitacoesList({ citacoes }: Props) {
  if (citacoes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhuma citação encontrada ainda"
        description="Clique em 'Buscar nomeações agora' para verificar os diários dos seus tribunais."
      />
    )
  }

  const naoLidas = citacoes.filter((c) => !c.visualizado).length

  return (
    <div className="space-y-2">
      {naoLidas > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-100 px-1.5 text-[10px] font-bold text-lime-700">
            {naoLidas}
          </span>
          <span className="text-xs text-slate-500">não lida{naoLidas > 1 ? 's' : ''}</span>
        </div>
      )}
      {citacoes.map((c) => (
        <CitacaoCard key={c.id} citacao={c} />
      ))}
    </div>
  )
}

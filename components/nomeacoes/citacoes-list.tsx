'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Eye, FileText, Hash, Loader2, Plus, X } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { marcarVisualizado } from '@/lib/actions/nomeacoes'
import { criarPericiaDeCitacao, rejeitarCitacao } from '@/lib/actions/citacao-to-pericia'
import type { CitacaoSerializada } from '@/lib/data/nomeacoes'
import { cn } from '@/lib/utils'

interface Props {
  citacoes: CitacaoSerializada[]
  showCriarPericia?: boolean
}

// ─── Single card — design system PeriLaB ─────────────────────────────────────

function CitacaoCard({ citacao, showCriarPericia = true }: { citacao: CitacaoSerializada; showCriarPericia?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [lida, setLida] = useState(citacao.visualizado)
  const [isPending, startTransition] = useTransition()
  const [isCriando, startCriarTransition] = useTransition()
  const [isRejeitando, startRejeitarTransition] = useTransition()
  const [criarErro, setCriarErro] = useState<string | null>(null)
  const [rejeitada, setRejeitada] = useState(false)
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

  if (rejeitada) return null

  const isLong = citacao.snippet.length > 220
  const snippet = !expanded && isLong ? `${citacao.snippet.slice(0, 220)}…` : citacao.snippet

  return (
    <div className={cn(
      'border bg-white transition-all',
      lida ? 'border-slate-100' : 'border-[#a3e635] bg-lime-50/30',
    )}>
      {/* Content */}
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          {!lida && <span className="h-2 w-2 bg-[#a3e635] flex-shrink-0" />}
          <span className="text-[9px] font-black text-white bg-slate-900 px-2 py-0.5 uppercase tracking-widest">
            {citacao.diarioSigla}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dataFormatada}</span>
          {citacao.fonte === 'manual' && (
            <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 uppercase tracking-widest border border-amber-200">
              Manual
            </span>
          )}
        </div>

        {/* Snippet */}
        <p className="text-[11px] text-slate-600 leading-relaxed">{snippet}</p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-[10px] font-bold text-[#4d7c0f] hover:text-[#3f6212] uppercase tracking-widest"
          >
            {expanded ? 'Ver menos' : 'Ver mais'}
          </button>
        )}

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {citacao.numeroProcesso && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 border border-slate-200">
              <Hash className="h-2.5 w-2.5" />
              {citacao.numeroProcesso}
            </span>
          )}
          {/* Tag docs disponíveis — reservada para quando Judit reativar */}
          {citacao.linkCitacao && (
            <a
              href={citacao.linkCitacao}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-bold text-blue-500 hover:text-blue-700 transition-colors underline"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              Diário
            </a>
          )}
        </div>
      </div>

      {/* Actions bar */}
      <div className="border-t border-slate-100 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!lida && (
            <button
              onClick={handleMarcarLida}
              disabled={isPending || isCriando || isRejeitando}
              className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors disabled:opacity-40"
            >
              <Eye className="h-3 w-3" />
              Lida
            </button>
          )}
          <button
            onClick={handleRejeitar}
            disabled={isRejeitando || isCriando}
            className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-rose-600 uppercase tracking-widest transition-colors disabled:opacity-40"
          >
            <X className="h-3 w-3" />
            Descartar
          </button>
        </div>

        {showCriarPericia && (
          <button
            onClick={handleCriarPericia}
            disabled={isCriando || isPending || isRejeitando}
            className="flex items-center gap-1.5 bg-[#a3e635] hover:bg-[#bef264] px-4 py-1.5 text-[9px] font-black text-slate-900 uppercase tracking-[0.15em] transition-all disabled:opacity-50"
          >
            {isCriando
              ? <><Loader2 className="h-3 w-3 animate-spin" /> Criando...</>
              : <><Plus className="h-3 w-3" /> Criar Perícia</>
            }
          </button>
        )}
      </div>

      {criarErro && (
        <div className="px-6 py-2 text-[10px] font-bold text-rose-600 bg-rose-50 border-t border-rose-100">
          {criarErro}
        </div>
      )}
    </div>
  )
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function CitacoesList({ citacoes, showCriarPericia = true }: Props) {
  if (citacoes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhuma citação encontrada"
        description="Clique em 'Buscar nomeações' para verificar os diários."
      />
    )
  }

  const naoLidas = citacoes.filter((c) => !c.visualizado).length

  return (
    <div className="space-y-3">
      {naoLidas > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-white bg-[#a3e635] text-slate-900 px-2 py-0.5 uppercase tracking-widest">
            {naoLidas}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            não lida{naoLidas !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {citacoes.map((c) => (
        <CitacaoCard key={c.id} citacao={c} showCriarPericia={showCriarPericia} />
      ))}
    </div>
  )
}

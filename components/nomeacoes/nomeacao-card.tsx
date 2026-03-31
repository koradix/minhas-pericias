'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Building2,
  Hash,
  Users,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Loader2,
  CheckCircle2,
  Archive,
  Play,
  ScrollText,
  FileText,
  PackageCheck,
} from 'lucide-react'
import { atualizarStatusNomeacao } from '@/lib/actions/datajud'
import { scoreBadgeLabel, scoreBadgeClass } from '@/lib/utils/match-nomeacao'
import { cn } from '@/lib/utils'
import type { NomeacaoComProcesso } from '@/lib/data/nomeacoes-datajud'

interface Props {
  nomeacao: NomeacaoComProcesso
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ─── Status flow ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  // intake statuses
  novo:                 'Nova',
  nomeacao_recebida:    'Nova',
  documentos_enviados:  'Doc. enviado',
  resumo_pendente:      'Dados extraídos',
  pronta_para_pericia:  'Pronta p/ perícia',
  // workflow statuses
  proposta:             'Proposta gerada',
  em_andamento:         'Em andamento',
  laudo:                'Laudo pendente',
  entregue:             'Entregue',
  arquivado:            'Arquivado',
}

export function NomeacaoCard({ nomeacao }: Props) {
  const [status, setStatus] = useState(nomeacao.status)
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleStatus(novoStatus: string) {
    startTransition(async () => {
      const res = await atualizarStatusNomeacao(nomeacao.id, novoStatus)
      if (res.ok) setStatus(novoStatus)
    })
  }

  const { processo, scoreMatch } = nomeacao
  const partes = processo.partes.slice(0, 3)
  const isLonga = processo.partes.length > 3

  const isNovo      = status === 'novo' || status === 'nomeacao_recebida'
  const isArquivado = status === 'arquivado'
  const isEntregue  = status === 'entregue'
  const isIntake    = ['documentos_enviados', 'resumo_pendente', 'pronta_para_pericia'].includes(status)
  const canArchive  = !isArquivado && !isEntregue

  return (
    <div className={cn(
      'rounded-xl border border-slate-200 bg-white overflow-hidden transition-all',
      isArquivado && 'opacity-60 bg-slate-50/50'
    )}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex flex-wrap items-start gap-3">
        {/* Tribunal + número */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
              <Building2 className="h-3 w-3 text-slate-500" />
              {processo.tribunal}
            </span>
            {scoreMatch < 100 && (
              <span className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border',
                scoreBadgeClass(scoreMatch).replace('border', 'border-opacity-50'),
              )}>
                {scoreMatch}% · {scoreBadgeLabel(scoreMatch)}
              </span>
            )}
            <span className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide',
              isNovo      ? 'bg-[#f4fce3] text-[#416900] border border-[#d8f5a2]' :
              isIntake    ? 'bg-violet-50 text-violet-700 border border-violet-100' :
              isEntregue  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
              isArquivado ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                            'bg-blue-50 text-blue-700 border border-blue-100',
            )}>
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
            <Hash className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <span className="font-mono font-medium truncate">{processo.numeroProcesso}</span>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link href={`/nomeacoes/${nomeacao.id}`}>
            <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
              Abrir <ChevronRight className="h-3 w-3" />
            </button>
          </Link>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Process info */}
      <div className="px-5 pb-4 space-y-1.5 mt-1">
        {processo.classe && (
          <p className="text-[15px] font-manrope font-semibold text-[#1f2937] leading-snug">{processo.classe}</p>
        )}
        {processo.assunto && (
          <p className="text-sm font-inter text-slate-600 leading-snug">{processo.assunto}</p>
        )}
        {processo.orgaoJulgador && (
          <p className="text-[13px] font-inter text-slate-400">{processo.orgaoJulgador}</p>
        )}
      </div>

      {/* Expandable — partes + data */}
      {expanded && (
        <div className="px-5 pb-4 space-y-2 border-t border-slate-50 pt-3">
          {partes.length > 0 && (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Users className="h-3 w-3" /> Partes
              </p>
              {partes.map((parte, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-[10px] font-medium text-slate-400 w-14 flex-shrink-0 uppercase">
                    {parte.tipo || 'Parte'}
                  </span>
                  <span className="truncate">{parte.nome}</span>
                </div>
              ))}
              {isLonga && (
                <p className="text-[10px] text-slate-400">+{processo.partes.length - 3} partes</p>
              )}
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
            <span>Distribuído: {formatDate(processo.dataDistribuicao)}</span>
            <span>Atualizado: {formatDate(processo.dataUltimaAtu)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isArquivado && !isEntregue && (
        <div className="px-5 py-3 border-t border-slate-50 flex flex-wrap items-center gap-2">
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}

          {isIntake && (
            <>
              <Link href={`/nomeacoes/${nomeacao.id}`}>
                <button className="flex items-center gap-1.5 rounded-lg bg-white border border-[#416900] hover:bg-[#f4fce3] text-[#416900] font-semibold text-[13px] px-3.5 py-1.5 transition-colors">
                  <FileText className="h-4 w-4" />
                  Ver análise
                </button>
              </Link>
              <button
                onClick={() => handleStatus('arquivado')}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 font-medium text-[13px] px-3.5 py-1.5 transition-colors disabled:opacity-50"
              >
                <Archive className="h-4 w-4" />
                Arquivar
              </button>
            </>
          )}

          {status === 'novo' && (
            <>
              <button
                onClick={() => handleStatus('proposta')}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[#416900] hover:bg-[#84cc16] hover:text-[#102000] text-white font-semibold text-[13px] px-3.5 py-1.5 transition-colors disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                Aceitar e gerar proposta
              </button>
              <button
                onClick={() => handleStatus('arquivado')}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 font-medium text-[13px] px-3.5 py-1.5 transition-colors disabled:opacity-50"
              >
                <Archive className="h-4 w-4" />
                Arquivar
              </button>
            </>
          )}

          {status === 'proposta' && (
            <>
              <Link href="/pericias">
                <button className="flex items-center gap-1.5 rounded-lg bg-white border border-[#416900] hover:bg-[#f4fce3] text-[#416900] font-semibold text-[13px] px-3.5 py-1.5 transition-colors">
                  <FileText className="h-4 w-4" />
                  Ver proposta
                </button>
              </Link>
              <button
                onClick={() => handleStatus('em_andamento')}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[#416900] hover:bg-[#84cc16] hover:text-[#102000] text-white font-semibold text-[13px] px-3.5 py-1.5 transition-colors disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Iniciar perícia
              </button>
            </>
          )}

          {status === 'em_andamento' && (
            <>
              <Link href="/pericias">
                <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-[13px] px-3.5 py-1.5 transition-colors">
                  <Play className="h-4 w-4" />
                  Ver perícia
                </button>
              </Link>
              <button
                onClick={() => handleStatus('laudo')}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[#416900] hover:bg-[#84cc16] hover:text-[#102000] text-white font-semibold text-[13px] px-3.5 py-1.5 transition-colors disabled:opacity-50"
              >
                <ScrollText className="h-4 w-4" />
                Registrar laudo
              </button>
            </>
          )}

          {status === 'laudo' && (
            <button
              onClick={() => handleStatus('entregue')}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[#1f2937] hover:bg-[#374151] text-white font-semibold text-[13px] px-3.5 py-1.5 transition-colors disabled:opacity-50"
            >
              <PackageCheck className="h-4 w-4" />
              Marcar como entregue
            </button>
          )}
        </div>
      )}

      {isEntregue && (
        <div className="px-5 py-3 border-t border-emerald-50">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Processo concluído e entregue
          </div>
        </div>
      )}
    </div>
  )
}

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
      'rounded-2xl border border-slate-200 bg-white transition-all duration-200 group hover:border-[#416900]/30 hover:shadow-md',
      isArquivado && 'opacity-60 bg-slate-50/50 grayscale-[20%]'
    )}>
      <div className="p-5 sm:p-6">
        {/* Header - Status, Process Number, Tribunal */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-3">
            <span className={cn(
              "text-[12px] font-bold uppercase tracking-widest flex items-center gap-1.5",
              isNovo ? "text-[#416900]" : 
              isIntake ? "text-violet-600" :
              isEntregue ? "text-emerald-600" :
              isArquivado ? "text-slate-500" :
              "text-blue-600"
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {STATUS_LABELS[status] ?? status}
            </span>

            <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>

            <span className="font-mono text-slate-500 text-[14px] font-semibold">
              {processo.numeroProcesso}
            </span>

            <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
            
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500">
              <Building2 className="h-3.5 w-3.5 text-slate-400" /> {processo.tribunal}
            </span>

            {scoreMatch < 100 && (
              <span className="text-[12px] font-bold text-slate-400 ml-2">
                Match: {scoreMatch}%
              </span>
            )}
          </div>
          
          {/* Top Actions */}
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            <Link href={`/nomeacoes/${nomeacao.id}`}>
              <button className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-slate-400 hover:text-[#416900] hover:bg-[#416900]/5 transition-colors">
                Abrir <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Process Info */}
        <div className="space-y-2">
          {processo.classe && (
            <p className="text-[18px] sm:text-[20px] font-manrope font-bold text-slate-900 leading-tight group-hover:text-[#416900] transition-colors">{processo.classe}</p>
          )}
          {processo.assunto && (
            <p className="text-[15px] font-medium text-slate-600 leading-snug">{processo.assunto}</p>
          )}
          {processo.orgaoJulgador && (
            <p className="text-[14px] font-medium text-slate-400 max-w-2xl">{processo.orgaoJulgador}</p>
          )}
        </div>
      </div>

      {/* Expandable — partes + data */}
      {expanded && (
        <div className="px-5 sm:px-6 pb-5 space-y-3 border-t border-slate-100 flex flex-col md:flex-row md:items-start md:justify-between gap-6 pt-4">
          {partes.length > 0 && (
            <div className="space-y-1.5 flex-1 max-w-lg">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                <Users className="h-3.5 w-3.5" /> Partes
              </p>
              {partes.map((parte, i) => (
                <div key={i} className="flex items-start gap-3 text-[13px] text-slate-600">
                  <span className="text-[10px] font-bold text-slate-400 w-14 flex-shrink-0 uppercase pt-0.5">
                    {parte.tipo || 'Parte'}
                  </span>
                  <span className="font-medium text-slate-500 leading-tight">{parte.nome}</span>
                </div>
              ))}
              {isLonga && (
                <p className="text-[11px] font-bold text-slate-400 pt-1">+{processo.partes.length - 3} partes</p>
              )}
            </div>
          )}
          <div className="flex flex-col gap-1.5 text-[13px] font-medium text-slate-400 pt-1">
            <span className="flex items-center justify-between gap-4"><span>Data Distribuição:</span> <span className="text-slate-600">{formatDate(processo.dataDistribuicao)}</span></span>
            <span className="flex items-center justify-between gap-4"><span>Última Atualização:</span> <span className="text-slate-600">{formatDate(processo.dataUltimaAtu)}</span></span>
          </div>
        </div>
      )}

      {/* Actions Footer */}
      {!isArquivado && !isEntregue && (
        <div className="px-5 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}

          {isIntake && (
            <>
              <Link href={`/nomeacoes/${nomeacao.id}`}>
                <button className="flex items-center gap-1.5 rounded-xl bg-white border-2 border-[#416900] hover:bg-[#416900]/5 text-[#416900] font-bold text-[14px] px-4 py-2 transition-all">
                  <FileText className="h-4 w-4" />
                  Ver análise
                </button>
              </Link>
              <button
                onClick={() => handleStatus('arquivado')}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-[#416900]/30 text-slate-600 font-bold text-[14px] px-4 py-2 transition-all disabled:opacity-50"
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
                className="flex items-center gap-1.5 rounded-xl bg-[#416900] hover:bg-[#345300] text-white font-bold text-[14px] px-4 py-2 transition-all disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                Aceitar e gerar proposta
              </button>
              <button
                onClick={() => handleStatus('arquivado')}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-bold text-[14px] px-4 py-2 transition-all disabled:opacity-50"
              >
                <Archive className="h-4 w-4" />
                Arquivar
              </button>
            </>
          )}

          {status === 'proposta' && (
            <>
              <Link href="/pericias">
                <button className="flex items-center gap-1.5 rounded-xl bg-white border-2 border-[#416900] hover:bg-[#416900]/5 text-[#416900] font-bold text-[14px] px-4 py-2 transition-all">
                  <FileText className="h-4 w-4" />
                  Ver proposta
                </button>
              </Link>
              <button
                onClick={() => handleStatus('em_andamento')}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl bg-[#416900] hover:bg-[#345300] text-white font-bold text-[14px] px-4 py-2 transition-all disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Iniciar perícia
              </button>
            </>
          )}

          {status === 'em_andamento' && (
            <>
              <Link href="/pericias">
                <button className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-[#416900]/30 text-slate-600 font-bold text-[14px] px-4 py-2 transition-all">
                  <Play className="h-4 w-4" />
                  Ver perícia
                </button>
              </Link>
              <button
                onClick={() => handleStatus('laudo')}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl bg-[#416900] hover:bg-[#345300] text-white font-bold text-[14px] px-4 py-2 transition-all disabled:opacity-50"
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
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] px-4 py-2 transition-all disabled:opacity-50"
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

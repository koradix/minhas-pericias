'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface NomeacaoProcesso {
  numeroProcesso: string
  tribunal: string
  classe: string | null
  assunto: string | null
  orgaoJulgador: string | null
  dataDistribuicao: string | null
  dataUltimaAtu: string | null
  partes: { nome: string; tipo: string | null }[]
}

interface NomeacaoComProcesso {
  id: string
  status: string
  scoreMatch: number
  processo: NomeacaoProcesso
}

interface Props {
  nomeacao: NomeacaoComProcesso
  onStatusChange?: (id: string, novoStatus: string) => Promise<{ ok: boolean }>
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

export function NomeacaoCard({ nomeacao, onStatusChange }: Props) {
  const [status, setStatus] = useState(nomeacao.status)
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleStatus(novoStatus: string) {
    if (!onStatusChange) return
    startTransition(async () => {
      const res = await onStatusChange(nomeacao.id, novoStatus)
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

  return (
    <div className={cn(
      'rounded-xl border border-slate-200 bg-white transition-all duration-200 group hover:border-[#a3e635]/30 hover:shadow-md',
      isArquivado && 'opacity-60 bg-slate-50/50 grayscale-[20%]'
    )}>
      <div className="p-5 sm:p-6">
        {/* Header - Status, Process Number, Tribunal */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-3">
            <span className={cn(
              "text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
              isNovo ? "text-[#a3e635]" : 
              isIntake ? "text-lime-600" :
              isEntregue ? "text-[#a3e635]" :
              isArquivado ? "text-slate-500" :
              "text-slate-600"
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {STATUS_LABELS[status] ?? status}
            </span>

            <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>

            <span className="text-slate-500 text-[14px] font-bold tracking-tight">
              {processo.numeroProcesso}
            </span>

            <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
            
            <span className="text-[13px] font-bold text-slate-400">
              {processo.tribunal}
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
              <button className="flex items-center gap-1 rounded-none px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                Abrir
              </button>
            </Link>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex-shrink-0 rounded-none px-2 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
            >
              {expanded ? 'Ocultar' : 'Detalhes'}
            </button>
          </div>
        </div>

        {/* Process Info */}
        <div className="space-y-2">
          {processo.classe && (
            <p className="text-[18px] sm:text-[20px] font-bold text-slate-900 tracking-tight leading-tight group-hover:text-[#a3e635] transition-colors">{processo.classe}</p>
          )}
          {processo.assunto && (
            <p className="text-[14px] font-medium text-slate-600 leading-snug">{processo.assunto}</p>
          )}
          {processo.orgaoJulgador && (
            <p className="text-[13px] font-medium text-slate-400 max-w-2xl">{processo.orgaoJulgador}</p>
          )}
        </div>
      </div>

      {/* Expandable — partes + data */}
      {expanded && (
        <div className="px-5 sm:px-6 pb-6 space-y-4 border-t border-slate-100 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {partes.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Partes envolvidas
                </p>
                {partes.map((parte: { nome: string; tipo: string | null }, i: number) => (
                  <div key={i} className="flex items-start gap-4 text-[13px]">
                    <span className="text-[11px] font-bold text-slate-400 w-16 flex-shrink-0 uppercase">
                      {parte.tipo || 'Parte'}
                    </span>
                    <span className="font-semibold text-slate-700 leading-tight">{parte.nome}</span>
                  </div>
                ))}
                {isLonga && (
                  <p className="text-[11px] font-bold text-slate-400 pt-2 pl-20">+{processo.partes.length - 3} partes</p>
                )}
              </div>
            )}
            
            <div className="space-y-3 pt-1">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Cronologia</p>
               <div className="space-y-2">
                 <div className="flex items-center justify-between gap-4 text-[13px] border-b border-slate-50 pb-2">
                   <span className="text-slate-400 font-medium">Distribuição</span> 
                   <span className="text-slate-900 font-bold">{formatDate(processo.dataDistribuicao)}</span>
                 </div>
                 <div className="flex items-center justify-between gap-4 text-[13px] border-b border-slate-50 pb-2">
                   <span className="text-slate-400 font-medium">Última Atualização</span> 
                   <span className="text-slate-900 font-bold">{formatDate(processo.dataUltimaAtu)}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Footer */}
      {!isArquivado && !isEntregue && (
        <div className="px-5 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {isIntake && (
            <>
              <Link href={`/nomeacoes/${nomeacao.id}`}>
                <button className="rounded-none border-2 border-[#a3e635] bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#4d7c0f] hover:bg-[#a3e635]/5 transition-all">
                   Ver análise
                </button>
              </Link>
              <button
                onClick={() => handleStatus('arquivado')}
                disabled={isPending}
                className="rounded-none border border-slate-200 bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all disabled:opacity-50"
              >
                Arquivar
              </button>
            </>
          )}

          {isNovo && (
            <>
              <button
                onClick={() => handleStatus('proposta')}
                disabled={isPending}
                className="rounded-none bg-slate-900 px-6 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-lg shadow-black/5"
              >
                Aceitar e gerar proposta
              </button>
              <button
                onClick={() => handleStatus('arquivado')}
                disabled={isPending}
                className="rounded-none border border-slate-200 bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all"
              >
                Arquivar
              </button>
            </>
          )}

          {status === 'proposta' && (
            <>
              <Link href="/pericias">
                <button className="rounded-none border-2 border-[#a3e635] bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#4d7c0f] hover:bg-[#a3e635]/5 transition-all">
                  Ver proposta
                </button>
              </Link>
              <button
                onClick={() => handleStatus('em_andamento')}
                disabled={isPending}
                className="rounded-none bg-[#a3e635] px-6 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 transition-all shadow-md"
              >
                Iniciar perícia
              </button>
            </>
          )}

          {status === 'em_andamento' && (
            <>
              <Link href="/pericias">
                <button className="rounded-none border border-slate-200 bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">
                  Ver perícia
                </button>
              </Link>
              <button
                onClick={() => handleStatus('laudo')}
                disabled={isPending}
                className="rounded-none bg-slate-900 px-6 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-black/5"
              >
                Registrar laudo
              </button>
            </>
          )}

          {status === 'laudo' && (
            <button
              onClick={() => handleStatus('entregue')}
              disabled={isPending}
              className="rounded-none bg-[#a3e635] px-6 py-2.5 text-[12px] font-bold uppercase tracking-widest text-slate-900 transition-all"
            >
              Marcar como entregue
            </button>
          )}
        </div>
      )}

      {isEntregue && (
        <div className="px-5 py-4 border-t border-[#a3e635]/10 bg-[#a3e635]/5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#4d7c0f]">
            Processo concluído e entregue
          </div>
        </div>
      )}
    </div>
  )
}

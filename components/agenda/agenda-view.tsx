'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgendaItem {
  titulo: string
  tipo: string
  etapa: string
  concluido: boolean
  periciaId: string
  periciaNumero: string
  periciaAssunto: string
  periciaVara: string | null
  dataEstimada: string
}

interface Props {
  items: AgendaItem[]
  peritoNome: string
}

// ─── Email Templates ──────────────────────────────────────────────────────────

const EMAIL_TEMPLATES: Record<string, { assunto: string; corpo: string }> = {
  'Enviar proposta para a Vara': {
    assunto: 'Processo {numero} — Proposta de Honorários Periciais',
    corpo: `Exmo(a). Sr(a). Secretário(a) da {vara},

Ref.: Processo nº {numero}

Sirvo-me do presente para encaminhar a V. Exa. minha proposta de honorários periciais referente ao processo em epígrafe, conforme determinação judicial.

A proposta encontra-se em anexo, detalhando o escopo dos serviços, metodologia e valores.

Coloco-me à disposição para quaisquer esclarecimentos adicionais.

Respeitosamente,
{nome}
Perito Judicial`,
  },
  'Cobrar retorno sobre honorários': {
    assunto: 'Processo {numero} — Solicito retorno sobre honorários',
    corpo: `Exmo(a). Sr(a). Secretário(a),

Ref.: Processo nº {numero}

Venho reiterar minha solicitação de retorno quanto à proposta de honorários periciais encaminhada anteriormente.

Caso haja necessidade de informações complementares, disponho-me a fornecê-las prontamente.

Atenciosamente,
{nome}
Perito Judicial`,
  },
  'Notificar partes sobre a vistoria': {
    assunto: 'Processo {numero} — Intimação para Vistoria Pericial',
    corpo: `Prezados,

Ref.: Processo nº {numero}

Na qualidade de perito judicial nomeado nos autos, informo que a vistoria técnica está agendada conforme abaixo:

Data: [INSERIR DATA]
Horário: [INSERIR HORÁRIO]
Local: [INSERIR ENDEREÇO]

Solicito a gentileza de confirmar ciência e presença, bem como providenciar acesso ao local.

Os assistentes técnicos das partes são bem-vindos, desde que previamente habilitados nos autos.

Atenciosamente,
{nome}
Perito Judicial`,
  },
  'Agendar vistoria técnica': {
    assunto: 'Processo {numero} — Agendamento de Vistoria',
    corpo: `Exmo(a). Sr(a). Secretário(a),

Ref.: Processo nº {numero}

Informo que pretendo realizar a vistoria técnica no imóvel/local objeto da perícia.

Solicito a intimação das partes para que tomem ciência da data e, caso desejem, indiquem assistentes técnicos.

Data pretendida: [INSERIR DATA]

Atenciosamente,
{nome}
Perito Judicial`,
  },
  'Elaborar e entregar laudo pericial': {
    assunto: 'Processo {numero} — Entrega de Laudo Pericial',
    corpo: `Exmo(a). Sr(a). Juiz(a) de Direito,

Ref.: Processo nº {numero}

Na qualidade de perito judicial nomeado nos autos, venho apresentar o LAUDO PERICIAL, elaborado em conformidade com a determinação de V. Exa. e observando os quesitos formulados pelas partes.

O laudo segue em anexo, em formato PDF.

Respeitosamente,
{nome}
Perito Judicial`,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ETAPA_COLORS: Record<string, string> = {
  'NOMEAÇÃO': 'bg-slate-900 text-white',
  'ANÁLISE':  'bg-slate-200 text-slate-700',
  'PROPOSTA': 'bg-amber-100 text-amber-700',
  'VISTORIA': 'bg-blue-100 text-blue-700',
  'MÍDIAS':   'bg-violet-100 text-violet-700',
  'LAUDO':    'bg-[#a3e635] text-slate-900',
}

const TIPO_ICON: Record<string, string> = {
  action: '→',
  deadline: '⏰',
  reminder: '↻',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function formatDateFull(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

function isPast(iso: string) {
  return new Date(iso) < new Date(new Date().toDateString())
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AgendaView({ items, peritoNome }: Props) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue'>('pending')

  const filtered = useMemo(() => {
    let list = items
    if (filter === 'pending') list = list.filter((i) => !i.concluido)
    if (filter === 'overdue') list = list.filter((i) => !i.concluido && isPast(i.dataEstimada))
    return list
  }, [items, filter])

  // Group by date
  const byDate = useMemo(() => {
    const map = new Map<string, AgendaItem[]>()
    for (const item of filtered) {
      const key = new Date(item.dataEstimada).toDateString()
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    // Sort by date
    return Array.from(map.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([dateStr, dateItems]) => ({
        date: dateItems[0].dataEstimada,
        dateStr,
        items: dateItems,
      }))
  }, [filtered])

  const pendingCount = items.filter((i) => !i.concluido).length
  const overdueCount = items.filter((i) => !i.concluido && isPast(i.dataEstimada)).length

  function fillTemplate(template: { assunto: string; corpo: string }, item: AgendaItem) {
    return {
      assunto: template.assunto
        .replace(/\{numero\}/g, item.periciaNumero)
        .replace(/\{nome\}/g, peritoNome)
        .replace(/\{vara\}/g, item.periciaVara ?? 'Vara'),
      corpo: template.corpo
        .replace(/\{numero\}/g, item.periciaNumero)
        .replace(/\{nome\}/g, peritoNome)
        .replace(/\{vara\}/g, item.periciaVara ?? 'Vara'),
    }
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex items-center gap-3">
        {[
          { id: 'pending' as const, label: 'PENDENTES', count: pendingCount },
          { id: 'overdue' as const, label: 'ATRASADAS', count: overdueCount },
          { id: 'all' as const, label: 'TODAS', count: items.length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
              filter === f.id
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-900'
            )}
          >
            {f.label} <span className="ml-1 opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      {byDate.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <p className="text-sm font-semibold text-slate-500">
            {filter === 'overdue' ? 'Nenhuma ação atrasada' : 'Nenhuma ação pendente'}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[79px] top-0 bottom-0 w-px bg-slate-100" />

          {byDate.map((group) => {
            const today = isToday(group.date)
            const past = isPast(group.date) && !today

            return (
              <div key={group.dateStr} className="relative mb-8">
                {/* Date header */}
                <div className="flex items-center gap-0 mb-4">
                  <div className={cn(
                    "w-[80px] text-right pr-6 flex-shrink-0",
                  )}>
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      today ? 'text-[#a3e635]' : past ? 'text-red-400' : 'text-slate-300'
                    )}>
                      {today ? 'HOJE' : formatDate(group.date)}
                    </p>
                  </div>
                  {/* Dot on timeline */}
                  <div className={cn(
                    "w-3 h-3 rounded-full border-2 flex-shrink-0 -ml-[6px] z-10",
                    today ? 'bg-[#a3e635] border-[#a3e635]' : past ? 'bg-red-400 border-red-400' : 'bg-white border-slate-200'
                  )} />
                  <div className="ml-6 flex-1">
                    <p className={cn(
                      "text-[9px] font-bold uppercase tracking-widest",
                      today ? 'text-slate-900' : 'text-slate-300'
                    )}>
                      {formatDateFull(group.date)}
                    </p>
                  </div>
                </div>

                {/* Items for this date */}
                <div className="ml-[98px] space-y-2">
                  {group.items.map((item, idx) => {
                    const template = EMAIL_TEMPLATES[item.titulo]
                    const emailKey = `${group.dateStr}-${idx}`
                    const isEmailOpen = expandedEmail === emailKey

                    return (
                      <div key={idx} className={cn(
                        "border bg-white transition-all",
                        item.concluido ? 'border-slate-50 opacity-40' : past ? 'border-red-100' : 'border-slate-100'
                      )}>
                        <div className="flex items-center gap-4 px-5 py-4">
                          {/* Etapa badge */}
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-1 flex-shrink-0",
                            ETAPA_COLORS[item.etapa] ?? 'bg-slate-100 text-slate-500'
                          )}>
                            {item.etapa}
                          </span>

                          {/* Perícia code */}
                          <Link href={`/pericias/${item.periciaId}`}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors flex-shrink-0 uppercase tracking-wider">
                            {item.periciaNumero}
                          </Link>

                          {/* Action title */}
                          <p className={cn(
                            "text-[12px] font-bold flex-1 min-w-0 truncate",
                            item.concluido ? 'text-slate-300 line-through' : 'text-slate-900'
                          )}>
                            <span className="mr-2 opacity-40">{TIPO_ICON[item.tipo] ?? '→'}</span>
                            {item.titulo}
                          </p>

                          {/* Email template button */}
                          {template && !item.concluido && (
                            <button
                              onClick={() => setExpandedEmail(isEmailOpen ? null : emailKey)}
                              className="text-[8px] font-bold uppercase tracking-widest text-[#a3e635] hover:text-slate-900 transition-colors flex-shrink-0"
                            >
                              {isEmailOpen ? '✕ FECHAR' : '✉ E-MAIL'}
                            </button>
                          )}

                          {/* Status */}
                          {item.concluido && (
                            <span className="text-[8px] font-bold text-[#a3e635] uppercase tracking-widest flex-shrink-0">✓</span>
                          )}
                        </div>

                        {/* Email template expanded */}
                        {isEmailOpen && template && (() => {
                          const filled = fillTemplate(template, item)
                          return (
                            <div className="mx-5 mb-4 border border-slate-100 bg-slate-50 overflow-hidden">
                              <div className="px-5 py-3 border-b border-slate-100 bg-white">
                                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1">ASSUNTO</p>
                                <p className="text-[11px] font-bold text-slate-800">{filled.assunto}</p>
                              </div>
                              <div className="px-5 py-4">
                                <pre className="text-[11px] text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">{filled.corpo}</pre>
                              </div>
                              <div className="px-5 py-3 border-t border-slate-100 bg-white flex gap-3">
                                <button
                                  onClick={() => navigator.clipboard.writeText(`Assunto: ${filled.assunto}\n\n${filled.corpo}`)}
                                  className="text-[9px] font-bold uppercase tracking-widest text-slate-900 bg-slate-100 px-4 py-2 hover:bg-[#a3e635] transition-all"
                                >
                                  COPIAR TUDO
                                </button>
                                <button
                                  onClick={() => navigator.clipboard.writeText(filled.corpo)}
                                  className="text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-4 py-2 hover:bg-slate-50 transition-all"
                                >
                                  COPIAR CORPO
                                </button>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

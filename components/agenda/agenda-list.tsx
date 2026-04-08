'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toggleAgendaItem, criarAgendaItem } from '@/lib/actions/agenda'
import { BadgeStatus } from '@/components/shared/badge-status'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgendaItemData {
  id: string
  periciaId: string
  titulo: string
  descricao: string | null
  tipo: string
  origem: string
  dataLimite: string | null
  status: string
  prioridade: string
  criadoEm: string
}

interface PericiaGroup {
  periciaId: string
  periciaNumero: string
  periciaAssunto: string
  periciaVara: string | null
  periciaStatus: string
  items: AgendaItemData[]
}

interface Props {
  groups: PericiaGroup[]
}

// ─── Email Templates ──────────────────────────────────────────────────────────

const EMAIL_TEMPLATES: Record<string, { assunto: string; corpo: string }> = {
  'Enviar e-mail para Vara': {
    assunto: 'Processo {numero} — Perito Judicial {nome}',
    corpo: `Exmo(a). Sr(a). Secretário(a),

Trata-se do processo nº {numero}, em trâmite nessa vara, no qual fui nomeado(a) perito(a) judicial.

Venho, respeitosamente, solicitar informações sobre o andamento do feito e a disponibilidade dos autos para análise.

Coloco-me à disposição para quaisquer esclarecimentos.

Atenciosamente,
{nome}
Perito Judicial`,
  },
  'Cobrar retorno da Vara': {
    assunto: 'Processo {numero} — Solicitação de retorno',
    corpo: `Exmo(a). Sr(a). Secretário(a),

Referente ao processo nº {numero}, gostaria de reiterar minha solicitação anterior e solicitar retorno sobre o andamento.

Permaneço à disposição.

Atenciosamente,
{nome}
Perito Judicial`,
  },
  'Notificar partes sobre vistoria': {
    assunto: 'Processo {numero} — Agendamento de Vistoria',
    corpo: `Prezado(a),

Em razão da perícia determinada nos autos do processo nº {numero}, informo que a vistoria técnica está agendada para o dia {data}.

Solicito confirmação de presença e indicação do local de acesso.

Atenciosamente,
{nome}
Perito Judicial`,
  },
}

// ─── Suggested actions for each step ──────────────────────────────────────────

const SUGGESTED_ACTIONS = [
  { titulo: 'Enviar e-mail para Vara', tipo: 'action', hasTemplate: true },
  { titulo: 'Cobrar retorno da Vara', tipo: 'reminder', hasTemplate: true },
  { titulo: 'Notificar partes sobre vistoria', tipo: 'action', hasTemplate: true },
  { titulo: 'Agendar reunião com assistentes', tipo: 'action', hasTemplate: false },
  { titulo: 'Solicitar documentos complementares', tipo: 'action', hasTemplate: false },
]

const TIPO_COLORS: Record<string, string> = {
  deadline: 'text-red-500',
  action: 'text-slate-500',
  reminder: 'text-amber-500',
}

const TIPO_LABEL: Record<string, string> = {
  deadline: 'PRAZO',
  action: 'AÇÃO',
  reminder: 'LEMBRETE',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AgendaList({ groups: initialGroups }: Props) {
  const [groups, setGroups] = useState(initialGroups)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle(itemId: string, periciaId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.periciaId === periciaId
          ? { ...g, items: g.items.map((i) => i.id === itemId ? { ...i, status: i.status === 'pending' ? 'completed' : 'pending' } : i) }
          : g
      ),
    )
    startTransition(async () => { await toggleAgendaItem(itemId) })
  }

  function handleAddSuggestion(periciaId: string, titulo: string, tipo: string) {
    startTransition(async () => {
      const res = await criarAgendaItem(periciaId, { titulo, tipo })
      if (res.ok) {
        const newItem: AgendaItemData = {
          id: crypto.randomUUID(),
          periciaId,
          titulo,
          descricao: null,
          tipo,
          origem: 'user',
          dataLimite: null,
          status: 'pending',
          prioridade: 'normal',
          criadoEm: new Date().toISOString(),
        }
        setGroups((prev) =>
          prev.map((g) =>
            g.periciaId === periciaId ? { ...g, items: [newItem, ...g.items] } : g
          ),
        )
        setShowSuggestions(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const pending = group.items.filter((i) => i.status === 'pending')
        const completed = group.items.filter((i) => i.status === 'completed')

        return (
          <div key={group.periciaId} className="border border-slate-200 bg-white overflow-hidden">
            {/* Perícia header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <Link href={`/pericias/${group.periciaId}`} className="flex items-center gap-4 group min-w-0">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 group-hover:text-[#4d7c0f] transition-colors truncate">
                    {group.periciaAssunto}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {group.periciaNumero} {group.periciaVara ? `· ${group.periciaVara}` : ''}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-3 flex-shrink-0">
                <BadgeStatus status={group.periciaStatus} />
                <button
                  onClick={() => setShowSuggestions(showSuggestions === group.periciaId ? null : group.periciaId)}
                  className="text-[9px] font-bold uppercase tracking-widest text-[#a3e635] hover:text-slate-900 transition-colors"
                >
                  + AÇÃO
                </button>
              </div>
            </div>

            {/* Suggested actions */}
            {showSuggestions === group.periciaId && (
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30 space-y-1">
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-2">AÇÕES SUGERIDAS</p>
                {SUGGESTED_ACTIONS.map((sa) => (
                  <button
                    key={sa.titulo}
                    onClick={() => handleAddSuggestion(group.periciaId, sa.titulo, sa.tipo)}
                    disabled={isPending}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className="text-[10px] font-bold text-slate-700">{sa.titulo}</span>
                    <div className="flex items-center gap-2">
                      {sa.hasTemplate && (
                        <span className="text-[8px] font-bold text-[#a3e635] uppercase tracking-widest">TEMPLATE</span>
                      )}
                      <span className={cn("text-[8px] font-bold uppercase tracking-widest", TIPO_COLORS[sa.tipo])}>
                        {TIPO_LABEL[sa.tipo]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Pending items */}
            {pending.length === 0 && completed.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhuma ação</p>
              </div>
            )}

            {pending.length > 0 && (
              <div className="divide-y divide-slate-50">
                {pending.map((item) => {
                  const template = EMAIL_TEMPLATES[item.titulo]
                  const isTemplateOpen = expandedTemplate === item.id

                  return (
                    <div key={item.id}>
                      <div className="flex items-start gap-3 px-6 py-3 group hover:bg-slate-50/50 transition-colors">
                        <button
                          onClick={() => handleToggle(item.id, group.periciaId)}
                          className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center border border-slate-200 hover:border-[#a3e635] transition-colors"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 leading-tight">{item.titulo}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={cn("text-[8px] font-bold uppercase tracking-widest", TIPO_COLORS[item.tipo] ?? 'text-slate-400')}>
                              {TIPO_LABEL[item.tipo] ?? item.tipo}
                            </span>
                            {item.origem !== 'user' && (
                              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-200">
                                {item.origem === 'ai' ? 'IA' : 'AUTO'}
                              </span>
                            )}
                            {item.dataLimite && (
                              <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest">
                                {new Date(item.dataLimite).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                        {template && (
                          <button
                            onClick={() => setExpandedTemplate(isTemplateOpen ? null : item.id)}
                            className="text-[8px] font-bold uppercase tracking-widest text-[#a3e635] hover:text-slate-900 transition-colors mt-1"
                          >
                            {isTemplateOpen ? 'FECHAR' : 'VER E-MAIL'}
                          </button>
                        )}
                      </div>

                      {/* Email template */}
                      {isTemplateOpen && template && (
                        <div className="mx-6 mb-3 border border-slate-100 bg-slate-50 p-4 space-y-3">
                          <div>
                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1">ASSUNTO</p>
                            <p className="text-[11px] font-bold text-slate-700">
                              {template.assunto
                                .replace('{numero}', group.periciaNumero)
                                .replace('{nome}', 'Perito')}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1">CORPO</p>
                            <pre className="text-[11px] text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                              {template.corpo
                                .replace(/\{numero\}/g, group.periciaNumero)
                                .replace(/\{nome\}/g, 'Perito')
                                .replace(/\{data\}/g, 'DD/MM/AAAA')}
                            </pre>
                          </div>
                          <button
                            onClick={() => {
                              const text = template.corpo
                                .replace(/\{numero\}/g, group.periciaNumero)
                                .replace(/\{nome\}/g, 'Perito')
                                .replace(/\{data\}/g, 'DD/MM/AAAA')
                              navigator.clipboard.writeText(text)
                            }}
                            className="text-[9px] font-bold uppercase tracking-widest text-slate-900 bg-white border border-slate-200 px-4 py-2 hover:bg-[#a3e635] hover:border-[#a3e635] transition-all"
                          >
                            COPIAR TEXTO
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Completed items */}
            {completed.length > 0 && (
              <div className="border-t border-slate-100 px-6 py-2">
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1">{completed.length} CONCLUÍDA{completed.length > 1 ? 'S' : ''}</p>
                {completed.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-1.5 group">
                    <button
                      onClick={() => handleToggle(item.id, group.periciaId)}
                      className="flex h-4 w-4 flex-shrink-0 items-center justify-center bg-[#a3e635] text-[8px] font-bold text-slate-900"
                    >
                      ✓
                    </button>
                    <p className="text-[10px] font-bold text-slate-300 line-through flex-1 truncate">{item.titulo}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

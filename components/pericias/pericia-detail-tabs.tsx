'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Loader2,
  ChevronRight,
  ClipboardCheck,
  MapPin,
  CheckCircle2,
  Camera,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { criarRotaDaPericia } from '@/lib/actions/pericias-rota'
import { updateCheckpointStatus } from '@/lib/actions/checkpoint-media'
import { CheckpointMediaPanel } from '@/components/rotas/checkpoint-media-panel'
import { PropostaTab } from '@/components/pericias/proposta-tab'
import type { PropostaTabProps } from '@/components/pericias/proposta-tab'
import { LaudoTab } from '@/components/pericias/laudo-tab'
import type { LaudoTabProps } from '@/components/pericias/laudo-tab'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckpointItem {
  id: string
  ordem: number
  titulo: string
  endereco: string | null
  status: string
  midiaCount: number
}

interface Props {
  periciaId:      string
  periciaStatus:  string
  enderecoPericia: string | null
  checkpoints:    CheckpointItem[]
  resumoContent:  React.ReactNode
  fotosContent:   React.ReactNode
  // Proposta
  propostaProps:  Omit<PropostaTabProps, 'periciaId'>
  hasAnalise:     boolean
  hasProposta:    boolean
  // Laudo
  laudoProps?:    Omit<LaudoTabProps, 'periciaId'> | null
  defaultTab?:    Tab
}

type Tab = 'resumo' | 'proposta' | 'rota' | 'fotos' | 'laudo'

const CP_STATUS_TEXT: Record<string, string> = {
  concluido: 'CONCLUÍDO',
  chegou:    'EM CAMPO',
  pendente:  'PENDENTE',
}

// ─── Step badge ─────────────────────────────────────────────────────────────

function StepBadge({ num, done, active }: { num: number; done?: boolean; active?: boolean }) {
  return (
    <span className={cn(
      "inline-flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-black flex-shrink-0",
      done ? "bg-[#a3e635] text-slate-900" : active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
    )}>
      {num}
    </span>
  )
}

// ─── Rota tab ─────────────────────────────────────────────────────────────────

function RotaContent({
  periciaId,
  enderecoPericia,
  checkpoints: initialCheckpoints,
}: {
  periciaId: string
  enderecoPericia: string | null
  checkpoints: CheckpointItem[]
}) {
  const [checkpoints, setCheckpoints] = useState(initialCheckpoints)
  const hasCheckpoints = checkpoints.length > 0
  const [endereco, setEndereco] = useState(enderecoPericia ?? '')
  const [result,   setResult]   = useState<{ ok: boolean; mensagem: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [concluding, setConcluding] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const router = useRouter()

  function handleCriarVistoria() {
    startTransition(async () => {
      const res = await criarRotaDaPericia(periciaId, endereco)
      if (res.ok) {
        router.refresh()  // Fica na mesma página, recarrega dados
      } else {
        setResult({ ok: res.ok, mensagem: res.message })
      }
    })
  }

  function handleConcluirCheckpoint(cpId: string) {
    setConcluding(cpId)
    startTransition(async () => {
      await updateCheckpointStatus(cpId, 'concluido', { pericoId: periciaId })
      setCheckpoints(prev => prev.map(cp =>
        cp.id === cpId ? { ...cp, status: 'concluido' } : cp
      ))
      setConcluding(null)
    })
  }

  const allDone = checkpoints.length > 0 && checkpoints.every(c => c.status === 'concluido')
  const hasMidias = checkpoints.some(c => c.midiaCount > 0)

  return (
    <div className="space-y-8">

      {/* ── Passo 6: Agendar vistoria ───────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <StepBadge num={6} done={hasCheckpoints} active={!hasCheckpoints} />
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">Agendar vistoria</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Informe o endereço e crie o checkpoint de vistoria</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          {!hasCheckpoints ? (
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Endereço da vistoria
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="RUA, NÚMERO, BAIRRO, CIDADE"
                  className="w-full rounded-none border-2 border-slate-200 bg-white px-5 py-4 text-[13px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 placeholder-slate-200 uppercase tracking-wide transition-all"
                />
              </div>

              {result && (
                <p className={cn(
                  "text-[11px] font-black uppercase tracking-widest px-6 py-4 border-2",
                  result.ok ? "text-[#a3e635] bg-slate-900 border-slate-900" : "text-rose-500 bg-rose-50 border-rose-100"
                )}>
                  {result.mensagem}
                </p>
              )}

              <button
                onClick={handleCriarVistoria}
                disabled={isPending || !endereco.trim()}
                className="w-full bg-[#a3e635] text-slate-900 rounded-none px-8 py-5 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30 shadow-none flex items-center justify-center gap-3"
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> AGUARDE...</>
                ) : (
                  <><MapPin className="h-4 w-4" /> CRIAR VISTORIA</>
                )}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 px-5 py-3">
              <ClipboardCheck className="h-5 w-5 text-[#4d7c0f]" />
              <div>
                <p className="text-[13px] font-semibold text-slate-800">
                  Vistoria agendada — {checkpoints.length} checkpoint{checkpoints.length > 1 ? 's' : ''}
                </p>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {checkpoints.filter(c => c.status === 'concluido').length}/{checkpoints.length} concluídos
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Passo 7: Realizar vistoria ──────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <StepBadge num={7} done={allDone && hasMidias} active={hasCheckpoints && !allDone} />
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">Realizar vistoria</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Clique no checkpoint para registrar evidências e concluir</p>
          </div>
        </div>
        <div className="px-6 py-5">
          {hasCheckpoints ? (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {checkpoints.map((cp) => (
                    <div key={cp.id}>
                      {/* Checkpoint row */}
                      <button
                        type="button"
                        onClick={() => setActivePanel(activePanel === cp.id ? null : cp.id)}
                        className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left"
                      >
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2 rounded flex-shrink-0",
                          cp.status === 'concluido' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-300 border-slate-100"
                        )}>
                          {CP_STATUS_TEXT[cp.status] ?? 'PENDENTE'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-[13px] font-bold',
                            cp.status === 'concluido' ? 'text-slate-400' : 'text-slate-900',
                          )}>
                            {cp.titulo}
                          </p>
                          {cp.endereco && (
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {cp.endereco}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {cp.midiaCount > 0 && (
                            <span className="text-[9px] font-black text-[#a3e635] border border-[#a3e635] px-2 py-0.5 uppercase tracking-widest rounded">
                              {cp.midiaCount} evidência{cp.midiaCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {cp.status !== 'concluido' && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Camera className="h-3.5 w-3.5" />
                              {activePanel === cp.id ? 'Fechar' : 'Abrir'}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Painel de evidências inline */}
                      {activePanel === cp.id && (
                        <div className="border-t border-slate-100 bg-slate-50">
                          <CheckpointMediaPanel
                            checkpointId={cp.id}
                            checkpointTitulo={cp.titulo}
                            endereco={cp.endereco ?? undefined}
                            tipo="PERICIA"
                            onClose={() => setActivePanel(null)}
                            onConcluido={() => {
                              setCheckpoints(prev => prev.map(c =>
                                c.id === cp.id ? { ...c, status: 'concluido' } : c
                              ))
                              setActivePanel(null)
                              router.refresh()
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Iniciar rota completa (GPS, mapa, múltiplos pontos) */}
              {!allDone && !activePanel && (
                <a
                  href="/rotas/pericias"
                  className="flex items-center justify-center gap-2 rounded-lg border-2 border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-50 px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all"
                >
                  <MapPin className="h-4 w-4" />
                  Iniciar rota de vistoria completa (GPS + mapa)
                </a>
              )}

              {allDone && (
                <div className="flex items-center gap-3 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-[#4d7c0f]" />
                  <p className="text-[13px] font-semibold text-slate-800">
                    Vistoria concluída — prossiga para o laudo pericial.
                  </p>
                </div>
              )}

              {!allDone && !activePanel && (
                <p className="text-[12px] text-slate-400 text-center">
                  Clique no checkpoint para registrar evidências e concluir, ou inicie a rota completa acima.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[13px] text-slate-400">
                Agende a vistoria no passo anterior para começar.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PericiaDetailTabs({
  periciaId,
  periciaStatus,
  enderecoPericia,
  checkpoints,
  resumoContent,
  fotosContent,
  propostaProps,
  hasAnalise,
  hasProposta,
  laudoProps,
  defaultTab,
}: Props) {
  const searchParams = useSearchParams()
  const urlTab       = searchParams.get('tab') as Tab | null

  const [activeTab, setActiveTab] = useState<Tab>(
    defaultTab ?? urlTab ?? 'resumo',
  )

  // Sync with URL param on navigation (e.g. clicking "Proposta de honorários" button)
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) setActiveTab(urlTab)
  }, [urlTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Step completion logic
  const hasMidias = checkpoints.some((c) => c.midiaCount > 0)
  const hasVistoria = checkpoints.length > 0
  const completed: Record<Tab, boolean> = {
    resumo:   hasAnalise,
    proposta: hasProposta,
    rota:     hasVistoria,
    fotos:    hasMidias,
    laudo:    periciaStatus === 'concluida',
  }

  const tabs: {
    id:       Tab
    label:    string
    disabled: boolean
    done:     boolean
  }[] = [
    { id: 'resumo',   label: 'Resumo',                disabled: false, done: completed.resumo   },
    { id: 'proposta', label: 'Proposta de Honorários', disabled: false, done: completed.proposta },
    { id: 'rota',     label: 'Vistoria',               disabled: false, done: completed.rota     },
    { id: 'fotos',    label: 'Mídias',                 disabled: false, done: completed.fotos    },
    { id: 'laudo',    label: 'Laudo Pericial',          disabled: false, done: completed.laudo    },
  ]

  return (
    <div className="space-y-8">
      {/* Tab bar */}
      <div className="flex items-center gap-6 border-b border-slate-100 px-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab, idx) => (
          <div key={tab.id} className="flex items-center gap-6">
            <button
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.25em] transition-all border-b-2 -mb-[1px]",
                activeTab === tab.id
                  ? tab.done ? 'border-[#a3e635] text-slate-900' : 'border-slate-900 text-slate-900'
                  : tab.disabled
                    ? 'border-transparent text-slate-200 cursor-not-allowed'
                    : tab.done
                      ? 'border-[#a3e635] text-[#4d7c0f] hover:text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-900 hover:border-slate-300'
              )}
            >
              {tab.label}
            </button>
            {idx < tabs.length - 1 && (
              <ChevronRight className="h-3 w-3 text-slate-200 flex-shrink-0" strokeWidth={3} />
            )}
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {activeTab === 'resumo' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">{resumoContent}</div>
        )}

        {activeTab === 'proposta' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <PropostaTab
              periciaId={periciaId}
              {...propostaProps}
            />
          </div>
        )}

        {activeTab === 'rota' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <RotaContent
              periciaId={periciaId}
              enderecoPericia={enderecoPericia}
              checkpoints={checkpoints}
            />
          </div>
        )}

        {activeTab === 'fotos' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">{fotosContent}</div>
        )}

        {activeTab === 'laudo' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {laudoProps ? (
              <LaudoTab periciaId={periciaId} {...laudoProps} />
            ) : (
              <div className="border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                <p className="text-sm font-semibold text-slate-500">Laudo pericial</p>
                <p className="text-xs text-slate-400 mt-1">Selecione um modelo e gere o rascunho com IA.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

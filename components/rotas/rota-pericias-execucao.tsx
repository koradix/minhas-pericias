'use client'

import { useState, useTransition } from 'react'
import { CheckpointMediaPanel } from '@/components/rotas/checkpoint-media-panel'
import { updateCheckpointStatus } from '@/lib/actions/checkpoint-media'
import { atualizarCheckpointVisita, type VaraVisitaData } from '@/lib/actions/rotas-nova'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckpointItem {
  id: string
  titulo: string
  endereco?: string
  ordem: number
  pericoId?: string
  tipo?: 'FORUM' | 'VARA_CIVEL' | 'ESCRITORIO' | 'PERICIA'
  tribunalSigla?: string
  varaNome?: string
  comarca?: string
  statusCheckpoint?: 'pendente' | 'chegou' | 'concluido'
  varasJson?: string | null
  juizNome?: string | null
  secretarioNome?: string | null
  foiNomeado?: boolean
  observacoes?: string | null
}

interface Props {
  rotaId: string
  checkpoints: CheckpointItem[]
  onFinalizar?: () => void
}

type CPStatus = 'pendente' | 'chegou' | 'concluido'

// ─── Component ────────────────────────────────────────────────────────────────

function parseVaras(json: string | null | undefined): VaraVisitaData[] {
  if (!json) return []
  try { return JSON.parse(json) as VaraVisitaData[] } catch { return [] }
}

export function RotaPericiasExecucao({ rotaId, checkpoints, onFinalizar }: Props) {
  const [statusMap, setStatusMap] = useState<Record<string, CPStatus>>(() =>
    Object.fromEntries(checkpoints.map((c) => [c.id, (c.statusCheckpoint ?? 'pendente') as CPStatus])),
  )
  const [activeCheckpoint, setActiveCheckpoint] = useState<CheckpointItem | null>(null)
  const [expandedCp, setExpandedCp] = useState<string | null>(null)
  const [varasMap, setVarasMap] = useState<Record<string, VaraVisitaData[]>>(() =>
    Object.fromEntries(checkpoints.map((c) => [c.id, parseVaras(c.varasJson)])),
  )
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [savingCp, setSavingCp] = useState<string | null>(null)

  function handleCheguei(cp: CheckpointItem) {
    setLoadingId(cp.id)
    startTransition(async () => {
      await updateCheckpointStatus(cp.id, 'chegou', {
        rotaId,
        ordem: cp.ordem,
        titulo: cp.titulo,
        endereco: cp.endereco,
        pericoId: cp.pericoId,
        tribunalSigla: cp.tribunalSigla,
        varaNome: cp.varaNome,
      })
      setStatusMap((prev) => ({ ...prev, [cp.id]: 'chegou' }))
      setActiveCheckpoint(cp)
      setLoadingId(null)
    })
  }

  function handleConcluido() {
    if (!activeCheckpoint) return
    setStatusMap((prev) => ({ ...prev, [activeCheckpoint.id]: 'concluido' }))
    setActiveCheckpoint(null)
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
          CHECKPOINTS EM CAMPO
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-200">
          {checkpoints.filter((c) => statusMap[c.id] === 'concluido').length} / {checkpoints.length} CONCLUÍDOS
        </span>
      </div>

      <div className="space-y-px bg-slate-100 border border-slate-100 shadow-sm overflow-hidden">
        {checkpoints.map((cp) => {
          const status = statusMap[cp.id]
          const isLoading = loadingId === cp.id
          const isChegou = status === 'chegou'
          const varas = varasMap[cp.id] ?? []
          const hasVaras = varas.length > 0
          const isExpanded = expandedCp === cp.id

          return (
            <div key={cp.id} className={cn(status === 'concluido' ? 'opacity-30 grayscale' : '')}>
              <div className="flex items-center gap-8 bg-white p-6 transition-all">
                {/* Ordem */}
                <div className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center text-[10px] font-bold tracking-widest",
                  status === 'concluido' ? "bg-slate-50 text-slate-300" : isChegou ? "bg-[#a3e635] text-slate-900" : "bg-slate-900 text-white"
                )}>
                  {cp.ordem}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <p className={cn("text-[11px] font-bold uppercase tracking-wider", status === 'concluido' ? 'text-slate-300' : 'text-slate-900')}>{cp.titulo}</p>
                    {hasVaras && (
                      <span className="text-[9px] font-bold text-[#a3e635] uppercase tracking-widest">{varas.length} VARA{varas.length > 1 ? 'S' : ''}</span>
                    )}
                  </div>
                  {cp.endereco && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 truncate">{cp.endereco}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-6">
                  {hasVaras && status !== 'pendente' && (
                    <button
                      onClick={() => setExpandedCp(isExpanded ? null : cp.id)}
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {isExpanded ? 'FECHAR' : 'VARAS'}
                    </button>
                  )}

                  {status === 'pendente' && (
                    <button
                      className="h-10 px-8 bg-white border-2 border-[#a3e635] text-slate-900 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-slate-50 transition-all shadow-sm"
                      onClick={() => { handleCheguei(cp); if (hasVaras) setExpandedCp(cp.id) }}
                      disabled={isPending}
                    >
                      {isLoading ? '...' : 'CHEGUEI'}
                    </button>
                  )}

                  {(status === 'chegou' || status === 'concluido') && (
                    <button
                      onClick={() => setActiveCheckpoint(cp)}
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      EVIDÊNCIAS
                    </button>
                  )}

                  {isChegou && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">NO LOCAL</span>
                  )}
                  {status === 'concluido' && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">OK</span>
                  )}
                </div>
              </div>

              {/* Varas expandidas — editáveis */}
              {isExpanded && hasVaras && (
                <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 space-y-2">
                  {varas.map((v, vi) => (
                    <div key={vi} className="bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">{v.varaNome}</p>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={v.visitada}
                              onChange={() => {
                                const updated = [...varas]
                                updated[vi] = { ...v, visitada: !v.visitada }
                                setVarasMap((p) => ({ ...p, [cp.id]: updated }))
                              }}
                              className="h-3.5 w-3.5 accent-[#a3e635]"
                            />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Visitada</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={v.foiNomeado}
                              onChange={() => {
                                const updated = [...varas]
                                updated[vi] = { ...v, foiNomeado: !v.foiNomeado }
                                setVarasMap((p) => ({ ...p, [cp.id]: updated }))
                              }}
                              className="h-3.5 w-3.5 accent-[#a3e635]"
                            />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nomeado aqui</span>
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Juiz</label>
                          <input
                            type="text"
                            value={v.juizNome ?? ''}
                            onChange={(e) => {
                              const updated = [...varas]
                              updated[vi] = { ...v, juizNome: e.target.value || null }
                              setVarasMap((p) => ({ ...p, [cp.id]: updated }))
                            }}
                            placeholder="Nome do juiz"
                            className="w-full mt-1 h-8 bg-slate-50 border-0 text-[10px] font-bold tracking-wider px-3 focus:ring-0 placeholder:text-slate-200 uppercase"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Secretário(a)</label>
                          <input
                            type="text"
                            value={v.secretarioNome ?? ''}
                            onChange={(e) => {
                              const updated = [...varas]
                              updated[vi] = { ...v, secretarioNome: e.target.value || null }
                              setVarasMap((p) => ({ ...p, [cp.id]: updated }))
                            }}
                            placeholder="Nome do secretário"
                            className="w-full mt-1 h-8 bg-slate-50 border-0 text-[10px] font-bold tracking-wider px-3 focus:ring-0 placeholder:text-slate-200 uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setSavingCp(cp.id)
                      startTransition(async () => {
                        await atualizarCheckpointVisita(cp.id, { varas: varasMap[cp.id] })
                        setSavingCp(null)
                      })
                    }}
                    disabled={savingCp === cp.id}
                    className="w-full h-10 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {savingCp === cp.id ? 'SALVANDO...' : 'SALVAR DADOS DAS VARAS'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress footer */}
      {checkpoints.length > 0 && checkpoints.every((c) => statusMap[c.id] === 'concluido') && (
        <div className="mt-12 pt-12 border-t border-dashed border-slate-100 flex flex-col items-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4">
            TODOS OS CHECKPOINTS CONCLUÍDOS
          </p>
          {onFinalizar && (
            <button
              onClick={onFinalizar}
              className="h-12 px-8 bg-[#a3e635] text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:brightness-105 transition-all"
            >
              FINALIZAR ROTA
            </button>
          )}
        </div>
      )}

      {/* Media panel overlay */}
      {activeCheckpoint && (
        <CheckpointMediaPanel
          checkpointId={activeCheckpoint.id}
          checkpointTitulo={activeCheckpoint.titulo}
          endereco={activeCheckpoint.endereco}
          tipo={activeCheckpoint.tipo}
          tribunalSigla={activeCheckpoint.tribunalSigla}
          varaNome={activeCheckpoint.varaNome}
          onClose={() => setActiveCheckpoint(null)}
          onConcluido={handleConcluido}
        />
      )}
    </>
  )
}

'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Navigation,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { criarRotaDaPericia } from '@/lib/actions/pericias-rota'
import { PropostaTab } from '@/components/pericias/proposta-tab'
import type { PropostaTabProps } from '@/components/pericias/proposta-tab'

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
  defaultTab?:    Tab
}

type Tab = 'resumo' | 'proposta' | 'rota' | 'fotos' | 'laudo'

const CP_STATUS_TEXT: Record<string, string> = {
  concluido: 'CONCLUÍDO',
  chegou:    'EM CAMPO',
  pendente:  'PENDENTE',
}

// ─── Rota tab ─────────────────────────────────────────────────────────────────

function RotaContent({
  periciaId,
  enderecoPericia,
  checkpoints,
}: {
  periciaId: string
  enderecoPericia: string | null
  checkpoints: CheckpointItem[]
}) {
  const hasCheckpoints = checkpoints.length > 0
  const [endereco, setEndereco] = useState(enderecoPericia ?? '')
  const [result,   setResult]   = useState<{ ok: boolean; mensagem: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCriarRota() {
    startTransition(async () => {
      const res = await criarRotaDaPericia(periciaId, endereco)
      if (res.ok && res.rotaId) {
        router.push(`/pericias/${res.rotaId}`)
      } else {
        setResult({ ok: res.ok, mensagem: res.message })
      }
    })
  }

  return (
    <div className="space-y-12">
      {hasCheckpoints ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Checkpoints da vistorias</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {checkpoints.filter(c => c.status === 'concluido').length}/{checkpoints.length} CONCLUÍDOS
            </span>
          </div>
          <div className="border border-slate-200">
            <div className="divide-y divide-slate-100">
              {checkpoints.map((cp) => (
                <div key={cp.id} className="flex items-start gap-6 px-8 py-6 bg-white hover:bg-slate-50 transition-colors">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 border-2",
                    cp.status === 'concluido' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-300 border-slate-100"
                  )}>
                    {CP_STATUS_TEXT[cp.status] ?? 'PENDENTE'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-[13px] font-black uppercase tracking-tight',
                      cp.status === 'concluido' ? 'text-slate-400' : 'text-slate-900',
                    )}>
                      {cp.titulo}
                    </p>
                    {cp.endereco && (
                      <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{cp.endereco}</p>
                    )}
                  </div>
                  {cp.midiaCount > 0 && (
                    <span className="text-[9px] font-black text-[#a3e635] border border-[#a3e635] px-2 py-0.5 uppercase tracking-widest">
                      {cp.midiaCount} EVIDENCE
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-8 max-w-2xl">
          <div className="space-y-3">
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Agendar vistoria em campo</h2>
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">
              Informe o endereço principal para habilitar o módulo de vistorias, registro de evidências e tracking de deslocamento.
            </p>
          </div>
          
          <div className="space-y-6">
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
              onClick={handleCriarRota}
              disabled={isPending || !endereco.trim()}
              className="w-full bg-[#a3e635] text-slate-900 rounded-none px-8 py-5 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30 shadow-none flex items-center justify-center gap-3"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                  AGUARDE...
                </>
              ) : (
                'INICIAR MÓDULO DE VISTORIA'
              )}
            </button>
          </div>
        </section>
      )}
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

  const tabs: {
    id:       Tab
    label:    string
    icon:     React.ReactNode
    disabled: boolean
    badge?:   React.ReactNode
  }[] = [
    {
      id:       'resumo',
      label:    'Resumo',
      icon:     null,
      disabled: false,
    },
    {
      id:       'proposta',
      label:    'Proposta de Honorários',
      icon:     null,
      disabled: false,
      badge:    hasProposta && hasAnalise
        ? <span className="ml-2 flex h-2 w-2 rounded-full bg-[#a3e635]" />
        : undefined,
    },
    {
      id:       'rota',
      label:    'Vistoria',
      icon:     null,
      disabled: false,
    },
    {
      id:       'fotos',
      label:    'Mídias',
      icon:     null,
      disabled: false,
    },
    {
      id:       'laudo',
      label:    'Laudo Pericial',
      icon:     null,
      disabled: false,
    },
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
                  ? 'border-slate-900 text-slate-900'
                  : tab.disabled
                    ? 'border-transparent text-slate-200 cursor-not-allowed'
                    : 'border-transparent text-slate-400 hover:text-slate-900 hover:border-slate-300'
              )}
            >
              {tab.label}
              {tab.badge}
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
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-12">
               <div className="space-y-4">
                  <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Geração de documentos</h2>
                  <p className="text-[13px] font-bold text-slate-400 uppercase tracking-tight max-w-2xl">
                    Utilize os ativos coletados em campo e as informações do processo para gerar automaticamente o laudo pericial final baseado em seus modelos editoriais.
                  </p>
               </div>

               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {periciaStatus === 'concluida' ? (
                    <Link href="/documentos/modelos" className="block transform hover:-translate-y-1 transition-transform">
                      <div className="border border-slate-200 bg-white p-8 space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">SISTEMA DE LAUDO</span>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[14px] font-black uppercase tracking-tight text-slate-900">Gerar Laudo Final</p>
                           <p className="text-[11px] font-bold text-[#a3e635] uppercase tracking-widest">Acesso liberado</p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="border border-slate-100 bg-slate-50 p-8 space-y-6 opacity-60">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">SISTEMA DE LAUDO</span>
                      </div>
                      <div className="space-y-2">
                         <p className="text-[14px] font-black uppercase tracking-tight text-slate-300">Laudo Pericial</p>
                         <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest border border-slate-200 px-2 py-0.5 inline-block">PERÍCIA EM ANDAMENTO</p>
                      </div>
                    </div>
                  )}

                  <div className="border border-slate-100 bg-slate-50 p-8 space-y-6 opacity-40">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">ATIVO EDITORIAIS</span>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[14px] font-black uppercase tracking-tight text-slate-300">Rascunho do laudo</p>
                       <p className="text-[11px] font-black text-slate-200 uppercase tracking-widest">Brevemente</p>
                    </div>
                  </div>
               </div>

               {periciaStatus !== 'concluida' && (
                  <div className="flex items-center gap-3 pt-6">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-900 animate-pulse" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">
                      Conclua o fluxo de trabalho para liberar o gerador.
                    </p>
                  </div>
               )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

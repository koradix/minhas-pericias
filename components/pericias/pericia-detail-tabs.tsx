'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Navigation,
  Camera,
  ScrollText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  ClipboardList,
  Lock,
} from 'lucide-react'
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

const CP_STATUS_ICON: Record<string, React.ReactNode> = {
  concluido: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />,
  chegou:    <AlertCircle  className="h-4 w-4 text-amber-500  flex-shrink-0" />,
  pendente:  <Circle       className="h-4 w-4 text-slate-300  flex-shrink-0" />,
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
    <div className="space-y-5">
      {hasCheckpoints ? (
        <section className="rounded-xl border border-[#e2e8f0] bg-white">
          <div className="flex items-center gap-3 px-6 py-5">
            <h2 className="text-[15px] font-semibold text-[#1f2937] font-manrope">Checkpoints</h2>
            <span className="ml-auto text-[11px] font-semibold text-[#6b7280] bg-[#f2f3f9] rounded-md px-2 py-0.5">
              {checkpoints.filter(c => c.status === 'concluido').length}/{checkpoints.length}
            </span>
          </div>
          <div className="divide-y divide-[#f2f3f9]">
            {checkpoints.map((cp) => (
              <div key={cp.id} className="flex items-start gap-3 px-6 py-4">
                {CP_STATUS_ICON[cp.status] ?? CP_STATUS_ICON.pendente}
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-medium leading-snug ${cp.status === 'concluido' ? 'text-[#9ca3af] line-through' : 'text-[#1f2937]'}`}>
                    {cp.titulo}
                  </p>
                  {cp.endereco && (
                    <p className="text-[12px] text-[#9ca3af] mt-1 truncate">{cp.endereco}</p>
                  )}
                </div>
                {cp.midiaCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-[#416900] bg-[#f4fce3] rounded-md px-2 py-0.5 flex-shrink-0">
                    <Camera className="h-3 w-3" />
                    {cp.midiaCount}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-[#e2e8f0] bg-white">
          <div className="flex items-center gap-3 px-6 py-5">
            <h2 className="text-[15px] font-semibold text-[#1f2937] font-manrope">Agendar vistoria</h2>
          </div>
          <div className="px-6 pb-6 space-y-4">
            <p className="text-[13px] text-[#6b7280]">
              Informe o endereço da vistoria para criar a rota e registrar chegadas e fotos em campo.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-[0.1em] font-inter">
                Endereço da vistoria
              </label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#416900]/20 focus:border-[#416900] placeholder-[#d1d5db] transition-all"
              />
            </div>
            {result && (
              <p className={`text-[13px] rounded-lg px-4 py-2.5 border ${result.ok ? 'text-[#416900] bg-[#f4fce3] border-[#d8f5a2]' : 'text-rose-700 bg-rose-50 border-rose-100'}`}>
                {result.mensagem}
              </p>
            )}
            <button
              onClick={handleCriarRota}
              disabled={isPending || !endereco.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#416900] hover:bg-[#84cc16] hover:text-[#102000] text-white font-semibold text-[14px] px-4 py-3 transition-all disabled:opacity-50"
            >
              {isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando rota…</>
                : <><Navigation className="h-4 w-4" /> Criar rota de vistoria</>
              }
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
      icon:     <FileText   className="h-3.5 w-3.5" />,
      disabled: false,
    },
    {
      id:       'proposta',
      label:    'Proposta',
      icon:     !hasAnalise
        ? <Lock          className="h-3.5 w-3.5" />
        : <ClipboardList className="h-3.5 w-3.5" />,
      disabled: false, // always clickable — shows locked state inside
      badge:    hasProposta && hasAnalise
        ? <span className="ml-1 flex h-2 w-2 rounded-full bg-[#a3e635]" />
        : undefined,
    },
    {
      id:       'rota',
      label:    'Rota',
      icon:     <Navigation className="h-3.5 w-3.5" />,
      disabled: false,
    },
    {
      id:       'fotos',
      label:    'Fotos',
      icon:     <Camera     className="h-3.5 w-3.5" />,
      disabled: false,
    },
    {
      id:       'laudo',
      label:    'Laudo',
      icon:     <ScrollText className="h-3.5 w-3.5" />,
      disabled: false,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Tab bar */}
      <div className="flex gap-8 border-b border-slate-100 px-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-4 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? 'border-slate-900 text-slate-900'
                : tab.disabled
                  ? 'border-transparent text-slate-200 cursor-not-allowed'
                  : 'border-transparent text-slate-400 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge}
          </button>
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
          <section className="rounded-xl border border-slate-200 bg-white animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 px-8 py-8 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 font-manrope uppercase tracking-tight">Laudo pericial</h2>
            </div>
            <div className="px-8 py-8 space-y-6">
              {periciaStatus === 'concluida' ? (
                <Link href="/documentos/modelos" className="block">
                  <button className="w-full flex items-center justify-center gap-3 rounded-xl bg-slate-900 hover:bg-[#a3e635] hover:text-slate-900 text-white font-bold text-[11px] uppercase tracking-wider px-8 py-5 transition-all cursor-pointer">
                    <ScrollText className="h-5 w-5" />
                    Gerar laudo pericial
                  </button>
                </Link>
              ) : (
                <>
                  <button disabled className="w-full flex items-center justify-between gap-4 rounded-none border border-slate-100 bg-slate-50 px-6 py-5 text-left cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-3">
                      <ScrollText className="h-5 w-5 text-slate-300 flex-shrink-0" />
                      <span className="text-[12px] font-black uppercase tracking-widest text-slate-300">Estrutura do laudo</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] border border-slate-200 px-2 py-1">Em breve</span>
                  </button>
                  <button disabled className="w-full flex items-center justify-between gap-4 rounded-none border border-slate-100 bg-slate-50 px-6 py-5 text-left cursor-not-allowed opacity-60">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-300 flex-shrink-0" />
                      <span className="text-[12px] font-black uppercase tracking-widest text-slate-300">Rascunho do laudo</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] border border-slate-200 px-2 py-1">Em breve</span>
                  </button>
                  <div className="flex items-center gap-2 pt-6 border-t border-slate-100">
                    <AlertCircle className="h-4 w-4 text-slate-400" />
                    <p className="text-[12px] font-medium text-slate-400 italic">
                      Conclua a perícia para liberar a geração do documento final.
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

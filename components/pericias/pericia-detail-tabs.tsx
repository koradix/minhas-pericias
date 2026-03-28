'use client'

import { useState, useTransition } from 'react'
import {
  FileText,
  Navigation,
  Camera,
  ScrollText,
  MapPin,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react'
import { criarRotaDaPericia } from '@/lib/actions/pericias-rota'

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
  periciaId: string
  periciaStatus: string
  enderecoPericia: string | null
  checkpoints: CheckpointItem[]
  resumoContent: React.ReactNode
  fotosContent: React.ReactNode
}

type Tab = 'resumo' | 'rota' | 'fotos' | 'laudo'

const CP_STATUS_ICON: Record<string, React.ReactNode> = {
  concluido: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />,
  chegou:    <AlertCircle  className="h-4 w-4 text-amber-500  flex-shrink-0" />,
  pendente:  <Circle       className="h-4 w-4 text-slate-300  flex-shrink-0" />,
}

// ─── Rota tab inner content ────────────────────────────────────────────────────

function RotaContent({
  periciaId,
  enderecoPericia,
  checkpoints,
}: {
  periciaId: string
  enderecoPericia: string | null
  checkpoints: CheckpointItem[]
}) {
  const [endereco, setEndereco] = useState(enderecoPericia ?? '')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCriar() {
    setResult(null)
    startTransition(async () => {
      const res = await criarRotaDaPericia(periciaId, endereco)
      setResult(res)
    })
  }

  const hasCheckpoints = checkpoints.length > 0

  return (
    <div className="space-y-5">

      {/* Checkpoints list */}
      {hasCheckpoints ? (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
              <MapPin className="h-3.5 w-3.5 text-slate-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Checkpoints</h2>
            <span className="ml-auto text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
              {checkpoints.filter(c => c.status === 'concluido').length}/{checkpoints.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {checkpoints.map((cp) => (
              <div key={cp.id} className="flex items-start gap-3 px-5 py-3.5">
                {CP_STATUS_ICON[cp.status] ?? CP_STATUS_ICON.pendente}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${cp.status === 'concluido' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {cp.titulo}
                  </p>
                  {cp.endereco && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{cp.endereco}</p>
                  )}
                </div>
                {cp.midiaCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 flex-shrink-0">
                    <Camera className="h-3 w-3" />
                    {cp.midiaCount}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* New vistoria form */
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-50">
              <Navigation className="h-3.5 w-3.5 text-lime-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Agendar vistoria</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {result && !result.ok && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                {result.message}
              </p>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Endereço da vistoria
              </label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                disabled={isPending}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleCriar}
              disabled={isPending || !endereco.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold text-sm px-4 py-2.5 transition-colors disabled:opacity-50"
            >
              {isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando…</>
                : <><Plus className="h-4 w-4" /> Criar rota de vistoria</>
              }
            </button>
            <p className="text-xs text-slate-400">
              Uma rota será criada com este endereço como ponto de vistoria.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Main tab component ────────────────────────────────────────────────────────

export function PericiaDetailTabs({
  periciaId,
  periciaStatus,
  enderecoPericia,
  checkpoints,
  resumoContent,
  fotosContent,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('resumo')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumo', label: 'Resumo',  icon: <FileText   className="h-3.5 w-3.5" /> },
    { id: 'rota',   label: 'Rota',    icon: <Navigation  className="h-3.5 w-3.5" /> },
    { id: 'fotos',  label: 'Fotos',   icon: <Camera      className="h-3.5 w-3.5" /> },
    { id: 'laudo',  label: 'Laudo',   icon: <ScrollText  className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'resumo' && (
        <div>{resumoContent}</div>
      )}

      {activeTab === 'rota' && (
        <RotaContent
          periciaId={periciaId}
          enderecoPericia={enderecoPericia}
          checkpoints={checkpoints}
        />
      )}

      {activeTab === 'fotos' && (
        <div>{fotosContent}</div>
      )}

      {activeTab === 'laudo' && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
              <ScrollText className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Laudo pericial</h2>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            {periciaStatus === 'concluida' ? (
              <a href="/documentos/modelos">
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-4 py-2.5 transition-colors">
                  <ScrollText className="h-4 w-4" />
                  Gerar laudo
                </button>
              </a>
            ) : (
              <>
                <button
                  disabled
                  className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <ScrollText className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-300">Estrutura do laudo</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Em breve</span>
                </button>
                <button
                  disabled
                  className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-300">Rascunho do laudo</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Em breve</span>
                </button>
                <p className="text-xs text-slate-400 pt-1">
                  Conclua a perícia para gerar o laudo.
                </p>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

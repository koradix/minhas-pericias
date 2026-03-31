'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  periciaTipo: string
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
  const hasCheckpoints = checkpoints.length > 0
  const [endereco, setEndereco] = useState(enderecoPericia ?? '')
  const [result, setResult] = useState<{ ok: boolean; mensagem: string } | null>(null)
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

      {/* Checkpoints list */}
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
        /* Agendar vistoria — formulário simples */
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

// ─── Main tab component ────────────────────────────────────────────────────────

export function PericiaDetailTabs({
  periciaId,
  periciaStatus,
  periciaTipo,
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
      <div className="flex gap-1 rounded-xl bg-[#f2f3f9] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-[#1f2937] shadow-sm font-semibold'
                : 'text-[#9ca3af] hover:text-[#374151]'
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
        <section className="rounded-xl border border-[#e2e8f0] bg-white">
          <div className="flex items-center gap-3 px-6 py-5">
            <h2 className="text-[15px] font-semibold text-[#1f2937] font-manrope">Laudo pericial</h2>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {periciaStatus === 'concluida' ? (
              <Link href="/documentos/modelos" className="w-full">
                <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#416900] hover:bg-[#84cc16] hover:text-[#102000] text-white font-semibold text-[14px] px-4 py-3 transition-all">
                  <ScrollText className="h-4 w-4" />
                  Gerar laudo
                </button>
              </Link>
            ) : (
              <>
                <button
                  disabled
                  className="w-full flex items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] px-4 py-3 text-left cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-[#d1d5db] flex-shrink-0" />
                    <span className="text-[14px] font-medium text-[#d1d5db]">Estrutura do laudo</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#d1d5db] uppercase tracking-[0.1em]">Em breve</span>
                </button>
                <button
                  disabled
                  className="w-full flex items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] px-4 py-3 text-left cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#d1d5db] flex-shrink-0" />
                    <span className="text-[14px] font-medium text-[#d1d5db]">Rascunho do laudo</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#d1d5db] uppercase tracking-[0.1em]">Em breve</span>
                </button>
                <p className="text-[13px] text-[#9ca3af] pt-1">
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

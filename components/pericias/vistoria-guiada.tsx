'use client'

import { useState, useTransition } from 'react'
import {
  CheckCircle2,
  Circle,
  Plus,
  Loader2,
  Navigation,
  ChevronDown,
  ChevronUp,
  Hash,
  Camera,
} from 'lucide-react'
import { criarRotaGuiada } from '@/lib/actions/pericias-rota'
import {
  TEMPLATES_VISTORIA,
  detectarTemplate,
  type TemplateVistoria,
  type ItemTemplate,
} from '@/lib/constants/templates-vistoria'
import { cn } from '@/lib/utils'

// ─── Item card ─────────────────────────────────────────────────────────────────

interface ItemState {
  key: string
  templateIndex: number
  valor: string
  concluido: boolean
}

function ItemCard({
  item,
  state,
  ordem,
  onChange,
}: {
  item: ItemTemplate
  state: ItemState
  ordem: number
  onChange: (s: ItemState) => void
}) {
  const [expanded, setExpanded] = useState(!state.concluido)

  return (
    <div className={cn(
      'rounded-xl border transition-all',
      state.concluido ? 'border-[#d8f5a2] bg-[#f4fce3]/40' : 'border-[#e2e8f0] bg-white',
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3.5 px-5 py-4 text-left"
      >
        <span className={cn(
          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-bold',
          state.concluido
            ? 'border-[#416900] bg-[#416900] text-white'
            : 'border-[#d1d5db] bg-white text-[#9ca3af]',
        )}>
          {state.concluido ? '✓' : ordem}
        </span>
        <span className={cn(
          'flex-1 text-[15px] font-semibold font-manrope',
          state.concluido ? 'text-[#416900] line-through decoration-[#416900]/40' : 'text-[#1f2937]',
        )}>
          {item.titulo}
        </span>
        <span className="flex items-center gap-2 flex-shrink-0">
          {item.precisaFoto && (
            <Camera className="h-4 w-4 text-[#9ca3af]" strokeWidth={1.5} />
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-[#9ca3af]" /> : <ChevronDown className="h-4 w-4 text-[#9ca3af]" />}
        </span>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#f2f3f9]">
          <p className="text-[14px] text-[#6b7280] leading-relaxed mt-4 font-inter">{item.instrucao}</p>

          {/* Lembrete de foto (não captura — vai para aba Fotos) */}
          {item.precisaFoto && (
            <div className="flex items-center gap-2.5 rounded-lg bg-[#f8f9ff] border border-[#e2e8f0] px-4 py-3 text-[13px] text-[#6b7280] font-inter">
              <Camera className="h-4 w-4 flex-shrink-0 text-[#9ca3af]" />
              Registre a foto na aba <strong className="text-[#374151]">Fotos</strong>
            </div>
          )}

          {/* Valor */}
          {item.precisaValor && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] font-inter">
                {item.labelValor}
              </label>
              <input
                type={item.tipoValor === 'number' ? 'number' : 'text'}
                value={state.valor}
                onChange={(e) => onChange({ ...state, valor: e.target.value })}
                placeholder={item.placeholderValor}
                className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#416900]/20 placeholder-[#d1d5db] font-inter"
              />
            </div>
          )}

          {/* Concluir */}
          <button
            onClick={() => {
              onChange({ ...state, concluido: !state.concluido })
              if (!state.concluido) setExpanded(false)
            }}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px] font-semibold transition-all font-inter',
              state.concluido
                ? 'border border-[#e2e8f0] text-[#6b7280] hover:bg-[#f8f9ff]'
                : 'bg-[#1f2937] hover:bg-[#374151] text-white',
            )}
          >
            {state.concluido
              ? <><Circle className="h-4 w-4" /> Desfazer</>
              : <><CheckCircle2 className="h-4 w-4" /> Concluir este item</>
            }
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  periciaId: string
  periciaTipo: string
  enderecoPericia: string | null
}

export function VistoriaGuiada({ periciaId, periciaTipo, enderecoPericia }: Props) {
  const detectedTemplate = detectarTemplate(periciaTipo)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateVistoria | null>(detectedTemplate)
  const [showSelector, setShowSelector] = useState(!detectedTemplate)
  const [endereco, setEndereco] = useState(enderecoPericia ?? '')
  const [criarState, setCriarState] = useState<{ fase: 'idle' | 'ok' | 'erro'; mensagem?: string }>({ fase: 'idle' })
  const [isPending, startTransition] = useTransition()

  // Checklist state (used for field preview only — persisted via checkpoints)
  const [itens, setItens] = useState<ItemState[]>(() =>
    (selectedTemplate?.itens ?? []).map((item, i) => ({
      key: `${i}`,
      templateIndex: i,
      valor: '',
      concluido: false,
    }))
  )

  function handleSelectTemplate(t: TemplateVistoria) {
    setSelectedTemplate(t)
    setShowSelector(false)
    setItens(t.itens.map((item, i) => ({
      key: `${i}`,
      templateIndex: i,
      valor: '',
      concluido: false,
    })))
  }

  function addRepeatItem(templateIndex: number) {
    setItens((prev) => [
      ...prev,
      {
        key: `${templateIndex}-${Date.now()}`,
        templateIndex,
        valor: '',
        concluido: false,
      },
    ])
  }

  function handleCriarRota() {
    if (!selectedTemplate) return
    startTransition(async () => {
      const res = await criarRotaGuiada(periciaId, endereco, selectedTemplate)
      setCriarState(res.ok
        ? { fase: 'ok', mensagem: res.message }
        : { fase: 'erro', mensagem: res.message }
      )
    })
  }

  const concluidos = itens.filter((i) => i.concluido).length
  const total = itens.length

  // ── Se já foi criada a rota (ok), mostra só um banner ──────────────────────
  if (criarState.fase === 'ok') {
    return (
      <div className="rounded-xl border border-[#d8f5a2] bg-[#f4fce3] px-6 py-5 flex items-center gap-4">
        <CheckCircle2 className="h-6 w-6 text-[#416900] flex-shrink-0" />
        <div>
          <p className="text-[15px] font-semibold text-[#416900] font-manrope">Vistoria guiada criada!</p>
          <p className="text-[14px] text-[#416900]/80 mt-1 font-inter">{criarState.mensagem} — Use a aba Rota para executar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Seletor de template ────────────────────────────────────────────── */}
      {showSelector && (
        <section className="rounded-xl border border-[#e2e8f0] bg-white">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#f2f3f9]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Hash className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-[16px] font-semibold text-[#1f2937] font-manrope">Tipo de vistoria</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-3">
            {TEMPLATES_VISTORIA.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                className="flex items-center gap-3 rounded-lg border border-[#e2e8f0] hover:border-[#416900] hover:bg-[#f4fce3]/50 px-4 py-3.5 text-left transition-all group"
              >
                <span className="text-2xl leading-none group-hover:scale-110 transition-transform">{t.icone}</span>
                <span className="text-[13px] font-semibold text-[#374151] font-manrope">{t.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Template selecionado — checklist ──────────────────────────────── */}
      {selectedTemplate && (
        <section className="rounded-xl border border-[#e2e8f0] bg-white">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#f2f3f9]">
            <span className="text-2xl leading-none flex-shrink-0">{selectedTemplate.icone}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-semibold text-[#1f2937] font-manrope">
                Vistoria guiada — {selectedTemplate.label}
              </h2>
              <p className="text-[12px] text-[#9ca3af] mt-1 font-inter">
                {concluidos}/{total} itens • Use este checklist em campo
              </p>
            </div>
            {!showSelector && (
              <button
                onClick={() => setShowSelector(true)}
                className="text-[12px] text-[#9ca3af] hover:text-[#374151] flex-shrink-0 font-medium font-inter underline underline-offset-4"
              >
                Trocar tipo
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#f2f3f9]">
            <div
              className="h-1.5 bg-[#416900] transition-all duration-500"
              style={{ width: total > 0 ? `${(concluidos / total) * 100}%` : '0%' }}
            />
          </div>

          <div className="p-4 space-y-2">
            {/* Render items, inserting "Adicionar" buttons for repeatable items */}
            {(() => {
              const rendered: React.ReactNode[] = []
              let lastRepeatableIndex: number | null = null

              itens.forEach((state, idx) => {
                const item = selectedTemplate.itens[state.templateIndex]
                rendered.push(
                  <ItemCard
                    key={state.key}
                    item={item}
                    state={state}
                    ordem={idx + 1}
                    onChange={(newState) => {
                      setItens((prev) => prev.map((s) => s.key === state.key ? newState : s))
                    }}
                  />
                )
                if (item.repete) lastRepeatableIndex = state.templateIndex
              })

              if (lastRepeatableIndex !== null) {
                const item = selectedTemplate.itens[lastRepeatableIndex]
                rendered.push(
                  <button
                    key="add-repeat"
                    onClick={() => addRepeatItem(lastRepeatableIndex!)}
                    className="flex items-center justify-center gap-2.5 w-full rounded-lg border border-dashed border-[#d1d5db] hover:border-[#416900] hover:text-[#416900] hover:bg-[#f4fce3]/50 px-5 py-4 text-[13px] font-semibold text-[#6b7280] transition-all font-inter mt-2"
                  >
                    <Plus className="h-4 w-4" />
                    {item.rotuloCopiar ?? '+ Adicionar outro'}
                  </button>
                )
              }

              return rendered
            })()}
          </div>
        </section>
      )}

      {/* ── Criar rota no sistema ─────────────────────────────────────────── */}
      {selectedTemplate && (
        <section className="rounded-xl border border-[#e2e8f0] bg-white mt-6">
          <div className="px-6 py-6 space-y-4">
            <p className="text-[15px] font-semibold text-[#1f2937] font-manrope">
              Salvar rota guiada no sistema
            </p>
            <p className="text-[14px] text-[#6b7280] font-inter">
              Gera os checkpoints automaticamente na aba Rota para acompanhamento.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.1em] font-inter">
                Endereço da vistoria
              </label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#416900]/20 placeholder-[#d1d5db] font-inter"
              />
            </div>

            {criarState.fase === 'erro' && (
              <p className="text-[13px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-4 py-3 font-inter">
                {criarState.mensagem}
              </p>
            )}

            <button
              onClick={handleCriarRota}
              disabled={isPending || !endereco.trim()}
              className="w-full flex items-center justify-center gap-2.5 rounded-lg bg-[#1f2937] hover:bg-[#374151] text-white font-semibold text-[15px] px-5 py-3.5 transition-all disabled:opacity-50 font-inter"
            >
              {isPending
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Criando rota…</>
                : <><Navigation className="h-5 w-5" strokeWidth={1.5} /> Criar rota guiada — {selectedTemplate.itens.length} itens</>
              }
            </button>
          </div>
        </section>
      )}

    </div>
  )
}

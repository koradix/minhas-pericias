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
      state.concluido ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-200 bg-white',
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className={cn(
          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold',
          state.concluido
            ? 'border-emerald-400 bg-emerald-400 text-white'
            : 'border-slate-300 bg-white text-slate-400',
        )}>
          {state.concluido ? '✓' : ordem}
        </span>
        <span className={cn(
          'flex-1 text-sm font-semibold',
          state.concluido ? 'text-emerald-700 line-through decoration-emerald-400' : 'text-slate-800',
        )}>
          {item.titulo}
        </span>
        <span className="flex items-center gap-1.5 flex-shrink-0">
          {item.precisaFoto && (
            <Camera className="h-3.5 w-3.5 text-slate-400" />
          )}
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </span>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-50">
          <p className="text-xs text-slate-500 leading-relaxed mt-3">{item.instrucao}</p>

          {/* Lembrete de foto (não captura — vai para aba Fotos) */}
          {item.precisaFoto && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-500">
              <Camera className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              Registre a foto na aba <strong className="text-slate-700">Fotos</strong>
            </div>
          )}

          {/* Valor */}
          {item.precisaValor && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {item.labelValor}
              </label>
              <input
                type={item.tipoValor === 'number' ? 'number' : 'text'}
                value={state.valor}
                onChange={(e) => onChange({ ...state, valor: e.target.value })}
                placeholder={item.placeholderValor}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 placeholder-slate-400"
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
              'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
              state.concluido
                ? 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                : 'bg-lime-500 hover:bg-lime-600 text-white',
            )}
          >
            {state.concluido
              ? <><Circle className="h-3.5 w-3.5" /> Desfazer</>
              : <><CheckCircle2 className="h-3.5 w-3.5" /> Concluir este item</>
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Vistoria guiada criada!</p>
          <p className="text-xs text-emerald-600 mt-0.5">{criarState.mensagem} — Use a aba Rota para executar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Seletor de template ────────────────────────────────────────────── */}
      {showSelector && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
              <Hash className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Tipo de vistoria</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            {TEMPLATES_VISTORIA.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 hover:border-lime-400 hover:bg-lime-50 px-3 py-2.5 text-left transition-all"
              >
                <span className="text-lg leading-none">{t.icone}</span>
                <span className="text-xs font-semibold text-slate-700">{t.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Template selecionado — checklist ──────────────────────────────── */}
      {selectedTemplate && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <span className="text-lg leading-none flex-shrink-0">{selectedTemplate.icone}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-slate-800">
                Vistoria guiada — {selectedTemplate.label}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {concluidos}/{total} itens • Use este checklist em campo
              </p>
            </div>
            {!showSelector && (
              <button
                onClick={() => setShowSelector(true)}
                className="text-[11px] text-slate-400 hover:text-slate-700 flex-shrink-0"
              >
                Trocar tipo
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-slate-100">
            <div
              className="h-1 bg-lime-500 transition-all duration-300"
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
                    className="flex items-center gap-2 w-full rounded-xl border border-dashed border-slate-300 hover:border-lime-400 hover:bg-lime-50 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-lime-700 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
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
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-slate-700">
              Salvar rota guiada no sistema
            </p>
            <p className="text-xs text-slate-500">
              Gera os checkpoints automaticamente na aba Rota para acompanhamento.
            </p>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Endereço da vistoria
              </label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 placeholder-slate-400"
              />
            </div>

            {criarState.fase === 'erro' && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                {criarState.mensagem}
              </p>
            )}

            <button
              onClick={handleCriarRota}
              disabled={isPending || !endereco.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-semibold text-sm px-4 py-2.5 transition-colors disabled:opacity-50"
            >
              {isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando rota…</>
                : <><Navigation className="h-4 w-4" /> Criar rota guiada — {selectedTemplate.itens.length} itens</>
              }
            </button>
          </div>
        </section>
      )}

    </div>
  )
}

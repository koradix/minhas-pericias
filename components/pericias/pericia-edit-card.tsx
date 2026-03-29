'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import {
  Pencil,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Scale,
  AlertCircle,
  Sparkles,
  Clock,
  MapPin,
  Wrench,
  ShieldAlert,
  CheckSquare,
} from 'lucide-react'
import { atualizarDadosPericia, type DadosPericia } from '@/lib/actions/pericias-update'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AnaliseIA {
  // Identificação
  numeroProcesso?: string | null
  autor?: string | null
  reu?: string | null
  vara?: string | null
  tribunal?: string | null
  enderecoVistoria?: string | null
  tipoPericia?: string | null
  // Resumo
  resumoProcesso?: {
    tipoAcao?: string
    partes?: string
    objetoPericia?: string
    areaTecnica?: string
  } | null
  // Nomeação / despacho saneador
  nomeacaoDespacho?: {
    determinacaoJuiz?: string
    quesitos?: string[]
    pontoCriticos?: string[]
    prazoPerito?: string | null
    dataNomeacao?: string | null
  } | null
  // Honorários
  aceiteHonorarios?: {
    complexidade?: string
    prazoAceite?: string | null
    estrategiaHonorarios?: string
    justificativasAumento?: string[]
    valorSugerido?: string | null
  } | null
  // Prazos
  prazos?: {
    prazoAceite?: string | null
    prazoLaudo?: string | null
    outrosPrazos?: string[]
  } | null
  // Local
  localPericia?: {
    enderecoCompleto?: string | null
    cidadeEstado?: string | null
    necessitaDeslocamento?: boolean
    custosLogisticos?: string | null
  } | null
  // Necessidades técnicas
  necessidadesTecnicas?: {
    tipoVistoria?: string
    equipamentos?: string[]
    assistentesTecnicos?: string | null
    coletaDados?: string[]
  } | null
  // Riscos
  riscos?: {
    tecnico?: string[]
    juridico?: string[]
    informacoesFaltando?: string[]
    conflitos?: string[]
  } | null
  // Checklist
  checklist?: string[]
}

interface Props {
  periciaId: string
  assunto: string
  vara: string | null
  partes: string | null
  endereco: string | null
  prazo: string | null
  valorHonorarios: number | null
  analise: AnaliseIA | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pull AI fields, prefer existing pericia value if set */
function buildInitialForm(props: Props): DadosPericia {
  const a = props.analise
  const partes = props.partes
    ?? (a ? [a.autor, a.reu].filter(Boolean).join(' × ') || '' : '')
  const vara   = props.vara     ?? a?.vara     ?? ''
  const end    = props.endereco ?? (a?.enderecoVistoria as string | null) ?? (a?.localPericia?.enderecoCompleto as string | null) ?? ''
  const tipo   = props.assunto
    ?? a?.resumoProcesso?.tipoAcao
    ?? a?.nomeacaoDespacho?.determinacaoJuiz
    ?? ''

  return {
    assunto:  tipo,
    vara:     vara,
    partes:   partes,
    endereco: end,
    prazo:    props.prazo ?? a?.nomeacaoDespacho?.prazoPerito ?? '',
    valorHonorarios: props.valorHonorarios ?? undefined,
  }
}

// ─── Inline field ──────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  editing,
  children,
}: {
  label: string
  value: string | null | undefined
  editing: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="px-5 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      {editing ? children : (
        <p className={cn('text-sm', value ? 'text-slate-800' : 'text-slate-400 italic')}>
          {value || 'Não informado'}
        </p>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function PericiaEditCard(props: Props) {
  const { periciaId, analise } = props

  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const prevAnaliseRef = useRef(analise)

  // Form state — starts auto-filled from AI where pericia fields are missing
  const [form, setForm] = useState<DadosPericia>(() => buildInitialForm(props))

  // Quando analise chega pela primeira vez (ex: após upload + router.refresh()),
  // atualiza o form automaticamente sem exigir clique do usuário
  useEffect(() => {
    if (analise && !prevAnaliseRef.current) {
      setForm(buildInitialForm({ ...props, analise }))
    }
    prevAnaliseRef.current = analise
  }, [analise]) // eslint-disable-line react-hooks/exhaustive-deps

  // Live display values (reflect saves without full page reload)
  const [display, setDisplay] = useState<{
    assunto: string | null; vara: string | null; partes: string | null
    endereco: string | null; prazo: string | null; valorHonorarios: number | null
  }>({
    assunto:  props.assunto,
    vara:     props.vara,
    partes:   props.partes,
    endereco: props.endereco,
    prazo:    props.prazo,
    valorHonorarios: props.valorHonorarios,
  })

  function preencherComIA() {
    if (!analise) return
    const partes = [analise.autor, analise.reu].filter(Boolean).join(' × ') || form.partes || ''
    const vara   = analise.vara ?? form.vara ?? ''
    const tipo   = analise.resumoProcesso?.tipoAcao ?? analise.nomeacaoDespacho?.determinacaoJuiz ?? form.assunto ?? ''
    const end    = (analise.enderecoVistoria as string | null) ?? (analise.localPericia?.enderecoCompleto as string | null) ?? form.endereco ?? ''
    setForm((prev) => ({ ...prev, assunto: tipo, vara, partes, endereco: end }))
    setEditing(true)
  }

  function handleCancel() {
    setForm(buildInitialForm({ ...props,
      assunto:  display.assunto ?? props.assunto,
      vara:     display.vara,
      partes:   display.partes,
      endereco: display.endereco,
      prazo:    display.prazo,
      valorHonorarios: display.valorHonorarios,
    }))
    setEditing(false)
    setSaveError(null)
  }

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const res = await atualizarDadosPericia(periciaId, form)
      if (res.ok) {
        setDisplay({
          assunto:  form.assunto || null,
          vara:     form.vara || null,
          partes:   form.partes || null,
          endereco: form.endereco || null,
          prazo:    form.prazo || null,
          valorHonorarios: form.valorHonorarios ?? null,
        })
        setEditing(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setSaveError(res.error ?? 'Erro ao salvar')
      }
    })
  }

  const inputCls = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-slate-400'

  // AI extras — full AnaliseProcesso fields
  const quesitos             = analise?.nomeacaoDespacho?.quesitos ?? []
  const pontoCriticos        = analise?.nomeacaoDespacho?.pontoCriticos ?? []
  const complexidade         = analise?.aceiteHonorarios?.complexidade ?? null
  const estrategia           = analise?.aceiteHonorarios?.estrategiaHonorarios ?? null
  const justificativas       = analise?.aceiteHonorarios?.justificativasAumento ?? []
  const despacho             = analise?.nomeacaoDespacho?.determinacaoJuiz ?? null
  const objetoPericia        = analise?.resumoProcesso?.objetoPericia ?? null
  const areaTecnica          = analise?.resumoProcesso?.areaTecnica ?? null
  const prazoAceite          = analise?.prazos?.prazoAceite ?? analise?.aceiteHonorarios?.prazoAceite ?? null
  const prazoLaudo           = analise?.prazos?.prazoLaudo ?? null
  const outrosPrazos         = analise?.prazos?.outrosPrazos ?? []
  const necessitaDeslocamento = analise?.localPericia?.necessitaDeslocamento ?? false
  const custosLogisticos     = analise?.localPericia?.custosLogisticos ?? null
  const tipoVistoria         = analise?.necessidadesTecnicas?.tipoVistoria ?? null
  const equipamentos         = analise?.necessidadesTecnicas?.equipamentos ?? []
  const assistentes          = analise?.necessidadesTecnicas?.assistentesTecnicos ?? null
  const coletaDados          = analise?.necessidadesTecnicas?.coletaDados ?? []
  const riscosTecnicos       = analise?.riscos?.tecnico ?? []
  const riscosJuridicos      = analise?.riscos?.juridico ?? []
  const infoFaltando         = analise?.riscos?.informacoesFaltando ?? []
  const checklist            = analise?.checklist ?? []

  const [showDespacho, setShowDespacho] = useState(true)
  const [showQuesitos, setShowQuesitos] = useState(true)
  const [showHonorarios, setShowHonorarios] = useState(true)
  const [showTecnico, setShowTecnico] = useState(false)
  const [showRiscos, setShowRiscos] = useState(false)

  // Check whether any field was auto-filled from AI
  const autoFilled = analise && (
    (!props.vara && form.vara) ||
    (!props.partes && form.partes) ||
    (!props.endereco && form.endereco)
  )

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
          <FileText className="h-3.5 w-3.5 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-slate-800">Dados da perícia</h2>
          {autoFilled && !editing && (
            <p className="text-[11px] text-violet-600 mt-0.5">Campos pré-preenchidos pela IA — revise e salve</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {saved && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <Check className="h-3 w-3" /> Salvo
            </span>
          )}
          {analise && !editing && (
            <button
              onClick={preencherComIA}
              className="flex items-center gap-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2.5 py-1 text-[11px] font-semibold text-violet-700 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Usar dados da IA
            </button>
          )}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex items-center gap-1 rounded-lg border border-slate-200 hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition-colors disabled:opacity-40"
              >
                <X className="h-3 w-3" /> Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-lime-500 hover:bg-lime-600 px-3 py-1 text-[11px] font-semibold text-white transition-colors disabled:opacity-50"
              >
                {isPending
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Salvando…</>
                  : <><Check className="h-3 w-3" /> Salvar</>
                }
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
          <p className="text-xs text-rose-700">{saveError}</p>
        </div>
      )}

      {/* Editable fields */}
      <div className="divide-y divide-slate-50">

        <Field label="Título / assunto" value={display.assunto ?? form.assunto} editing={editing}>
          <input
            className={inputCls}
            value={form.assunto ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, assunto: e.target.value }))}
            placeholder="Ex: Perícia de engenharia — apuração de danos"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-50">
          <Field label="Vara" value={display.vara ?? form.vara} editing={editing}>
            <input
              className={inputCls}
              value={form.vara ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, vara: e.target.value }))}
              placeholder="Ex: 3ª Vara Cível de São Paulo"
            />
          </Field>
          <Field label="Prazo" value={display.prazo ?? form.prazo} editing={editing}>
            <input
              className={inputCls}
              value={form.prazo ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, prazo: e.target.value }))}
              placeholder="Ex: 30/06/2025"
            />
          </Field>
        </div>

        <Field label="Partes" value={display.partes ?? form.partes} editing={editing}>
          <input
            className={inputCls}
            value={form.partes ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, partes: e.target.value }))}
            placeholder="Ex: João Silva × Banco XYZ"
          />
        </Field>

        <Field label="Local da vistoria" value={display.endereco ?? form.endereco} editing={editing}>
          <input
            className={inputCls}
            value={form.endereco ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
            placeholder="Ex: Rua das Flores, 100 — Rio de Janeiro/RJ"
          />
        </Field>

        <Field label="Honorários estimados (R$)" value={display.valorHonorarios ? `R$ ${display.valorHonorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} editing={editing}>
          <input
            type="number" min="0" step="100"
            className={inputCls}
            value={form.valorHonorarios ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, valorHonorarios: e.target.value ? parseFloat(e.target.value) : undefined }))}
            placeholder="Ex: 5000"
          />
        </Field>

      </div>

      {/* ── Análise completa do processo (IA) ────────────────────────────────── */}
      {analise && (
        <div className="border-t border-slate-200">

          {/* Cabeçalho da seção de análise */}
          <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
            <Sparkles className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Análise do processo — IA</p>
          </div>

          <div className="divide-y divide-slate-100">

          {/* Despacho saneador / determinação do juiz */}
          {despacho && (
            <div className="px-5 py-4">
              <button
                onClick={() => setShowDespacho((v) => !v)}
                className="flex w-full items-center gap-2 text-sm font-semibold text-slate-800 hover:text-slate-900 transition-colors"
              >
                <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <span className="flex-1 text-left">Despacho do juiz / Decisão</span>
                {showDespacho ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>
              {showDespacho && (
                <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 px-4 py-4">
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{despacho}</p>
                </div>
              )}
            </div>
          )}

          {/* Quesitos */}
          {quesitos.length > 0 && (
            <div className="px-5 py-4">
              <button
                onClick={() => setShowQuesitos((v) => !v)}
                className="flex w-full items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <Scale className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                <span className="flex-1 text-left">{quesitos.length} quesito{quesitos.length !== 1 ? 's' : ''}</span>
                {showQuesitos ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>
              {showQuesitos && (
                <ol className="mt-3 space-y-2 pl-4 list-decimal">
                  {quesitos.map((q, i) => (
                    <li key={i} className="text-xs text-slate-700 leading-relaxed">{q}</li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Honorários */}
          {(complexidade || estrategia || justificativas.length > 0 || pontoCriticos.length > 0) && (
            <div className="px-5 py-4">
              <button
                onClick={() => setShowHonorarios((v) => !v)}
                className="flex w-full items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <Scale className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span className="flex-1 text-left">Proposta de honorários</span>
                {complexidade && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mr-1 ${
                    complexidade === 'alta' ? 'bg-rose-100 text-rose-700' :
                    complexidade === 'média' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{complexidade}</span>
                )}
                {showHonorarios ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>
              {showHonorarios && (
                <div className="mt-3 space-y-3">
                  {(objetoPericia || areaTecnica) && (
                    <div className="grid grid-cols-2 gap-3">
                      {objetoPericia && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Objeto</p>
                          <p className="text-xs text-slate-700">{objetoPericia}</p>
                        </div>
                      )}
                      {areaTecnica && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Área técnica</p>
                          <p className="text-xs text-slate-700">{areaTecnica}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {estrategia && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Estratégia sugerida</p>
                      <p className="text-xs text-slate-700 leading-relaxed bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">{estrategia}</p>
                    </div>
                  )}
                  {justificativas.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Justificativas para aumento</p>
                      <ul className="space-y-1">
                        {justificativas.map((j, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                            <span className="text-emerald-500 flex-shrink-0 mt-0.5">•</span>
                            {j}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pontoCriticos.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Pontos críticos</p>
                      <ul className="space-y-1">
                        {pontoCriticos.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                            <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Prazos */}
          {(prazoAceite || prazoLaudo || outrosPrazos.length > 0) && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-slate-700">Prazos</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {prazoAceite && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Aceite da nomeação</p>
                    <p className="text-xs font-semibold text-amber-700">{prazoAceite}</p>
                  </div>
                )}
                {prazoLaudo && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Entrega do laudo</p>
                    <p className="text-xs font-semibold text-slate-700">{prazoLaudo}</p>
                  </div>
                )}
              </div>
              {outrosPrazos.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {outrosPrazos.map((p, i) => (
                    <li key={i} className="text-xs text-slate-600">• {p}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Necessidades técnicas */}
          {(tipoVistoria || equipamentos.length > 0 || assistentes || coletaDados.length > 0) && (
            <div className="px-5 py-4">
              <button
                onClick={() => setShowTecnico((v) => !v)}
                className="flex w-full items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <Wrench className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                <span className="flex-1 text-left">Necessidades técnicas</span>
                {showTecnico ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>
              {showTecnico && (
                <div className="mt-3 space-y-2">
                  {tipoVistoria && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Tipo de vistoria</p>
                      <p className="text-xs text-slate-700">{tipoVistoria}</p>
                    </div>
                  )}
                  {equipamentos.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Equipamentos</p>
                      <div className="flex flex-wrap gap-1">
                        {equipamentos.map((e, i) => (
                          <span key={i} className="text-[11px] bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-2 py-0.5">{e}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {assistentes && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Assistentes técnicos</p>
                      <p className="text-xs text-slate-700">{assistentes}</p>
                    </div>
                  )}
                  {coletaDados.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Dados a coletar</p>
                      <ul className="space-y-0.5">
                        {coletaDados.map((d, i) => (
                          <li key={i} className="text-xs text-slate-600">• {d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {necessitaDeslocamento && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                      Necessita deslocamento{custosLogisticos ? ` — ${custosLogisticos}` : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Riscos */}
          {(riscosTecnicos.length > 0 || riscosJuridicos.length > 0 || infoFaltando.length > 0) && (
            <div className="px-5 py-4">
              <button
                onClick={() => setShowRiscos((v) => !v)}
                className="flex w-full items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                <span className="flex-1 text-left">Riscos e informações faltando</span>
                {showRiscos ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>
              {showRiscos && (
                <div className="mt-3 space-y-2">
                  {riscosTecnicos.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Técnicos</p>
                      <ul className="space-y-0.5">
                        {riscosTecnicos.map((r, i) => <li key={i} className="text-xs text-slate-600">• {r}</li>)}
                      </ul>
                    </div>
                  )}
                  {riscosJuridicos.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Jurídicos</p>
                      <ul className="space-y-0.5">
                        {riscosJuridicos.map((r, i) => <li key={i} className="text-xs text-slate-600">• {r}</li>)}
                      </ul>
                    </div>
                  )}
                  {infoFaltando.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Informações faltando</p>
                      <ul className="space-y-0.5">
                        {infoFaltando.map((r, i) => <li key={i} className="text-xs text-rose-700">• {r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Checklist */}
          {checklist.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="h-3.5 w-3.5 text-lime-600 flex-shrink-0" />
                <p className="text-xs font-semibold text-slate-700">Próximos passos (IA)</p>
              </div>
              <ul className="space-y-1">
                {checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                    <span className="text-lime-500 flex-shrink-0 mt-0.5">☐</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          </div>{/* end divide-y */}
        </div>
      )}


    </section>
  )
}

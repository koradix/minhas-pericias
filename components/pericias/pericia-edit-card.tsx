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
    <div className="px-6 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5 font-inter">{label}</p>
      {editing ? children : (
        <p className={cn('text-[14px] font-medium', value ? 'text-[#1f2937]' : 'text-[#d1d5db] italic')}>
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
      setTimeout(() => setForm(buildInitialForm({ ...props, analise })), 0)
    }
    prevAnaliseRef.current = analise
  }, [analise, props]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const inputCls = 'w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-[14px] text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#416900]/20 focus:border-[#416900] placeholder-[#d1d5db] transition-all'

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
    <section className="rounded-xl bg-white border border-[#e2e8f0]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-semibold text-[#1f2937] font-manrope tracking-tight">Dados da perícia</h2>
          {autoFilled && !editing && (
            <p className="text-[12px] text-[#416900] mt-1 font-medium">Campos pré-preenchidos pela IA — revise e salve</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {saved && (
            <span className="flex items-center gap-1 text-[12px] font-semibold text-[#416900]">
              <Check className="h-3.5 w-3.5" /> Salvo
            </span>
          )}
          {analise && !editing && (
            <button
              onClick={preencherComIA}
              className="flex items-center gap-1.5 rounded-lg bg-[#f4fce3] hover:bg-[#ecfccb] border border-[#d8f5a2] px-3 py-1.5 text-[12px] font-semibold text-[#416900] transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Usar dados da IA
            </button>
          )}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] hover:bg-[#f8f9ff] px-3 py-1.5 text-[12px] font-medium text-[#6b7280] transition-all"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] hover:bg-[#f8f9ff] px-3 py-1.5 text-[12px] font-medium text-[#6b7280] transition-all disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" /> Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[#416900] hover:bg-[#84cc16] hover:text-[#102000] px-3.5 py-1.5 text-[12px] font-semibold text-white transition-all disabled:opacity-50"
              >
                {isPending
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…</>
                  : <><Check className="h-3.5 w-3.5" /> Salvar</>
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
      <div className="divide-y divide-[#f2f3f9] border-t border-[#f2f3f9]">

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
        <div className="border-t border-[#e2e8f0]">

          {/* Cabeçalho da seção de análise */}
          <div className="flex items-center gap-3 px-6 py-5 bg-[#f8f9ff]">
            <Sparkles className="h-5 w-5 text-[#416900] flex-shrink-0" />
            <p className="text-[16px] font-semibold text-[#1f2937] font-manrope tracking-tight">Análise do processo — IA</p>
          </div>

          <div className="divide-y divide-[#f2f3f9]">

          {/* Despacho saneador / determinação do juiz */}
          {despacho && (
            <div className="px-6 py-5">
              <button
                onClick={() => setShowDespacho((v) => !v)}
                className="flex w-full items-center gap-2.5 text-[15px] font-semibold text-[#1f2937] hover:text-[#374151] transition-colors font-manrope"
              >
                <FileText className="h-5 w-5 text-[#6b7280] flex-shrink-0" strokeWidth={1.5} />
                <span className="flex-1 text-left">Despacho do juiz / Decisão</span>
                {showDespacho ? <ChevronUp className="h-4 w-4 text-[#9ca3af]" /> : <ChevronDown className="h-4 w-4 text-[#9ca3af]" />}
              </button>
              {showDespacho && (
                <div className="mt-4 rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] px-5 py-4">
                  <p className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-line font-inter">{despacho}</p>
                </div>
              )}
            </div>
          )}

          {/* Quesitos */}
          {quesitos.length > 0 && (
            <div className="px-6 py-5">
              <button
                onClick={() => setShowQuesitos((v) => !v)}
                className="flex w-full items-center gap-2.5 text-[15px] font-semibold text-[#1f2937] hover:text-[#374151] transition-colors font-manrope"
              >
                <Scale className="h-5 w-5 text-[#416900] flex-shrink-0" strokeWidth={1.5} />
                <span className="flex-1 text-left">{quesitos.length} quesito{quesitos.length !== 1 ? 's' : ''}</span>
                {showQuesitos ? <ChevronUp className="h-4 w-4 text-[#9ca3af]" /> : <ChevronDown className="h-4 w-4 text-[#9ca3af]" />}
              </button>
              {showQuesitos && (
                <ol className="mt-4 space-y-3 pl-5 list-decimal">
                  {quesitos.map((q, i) => (
                    <li key={i} className="text-[14px] text-[#374151] leading-relaxed font-inter">{q}</li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Honorários */}
          {(complexidade || estrategia || justificativas.length > 0 || pontoCriticos.length > 0) && (
            <div className="px-6 py-5">
              <button
                onClick={() => setShowHonorarios((v) => !v)}
                className="flex w-full items-center gap-2.5 text-[15px] font-semibold text-[#1f2937] hover:text-[#374151] transition-colors font-manrope"
              >
                <Scale className="h-5 w-5 text-[#416900] flex-shrink-0" strokeWidth={1.5} />
                <span className="flex-1 text-left">Proposta de honorários</span>
                {complexidade && (
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md mr-1 ${
                    complexidade === 'alta' ? 'bg-rose-100 text-rose-700' :
                    complexidade === 'média' ? 'bg-amber-100 text-amber-700' :
                    'bg-[#f2f3f9] text-[#6b7280]'
                  }`}>{complexidade}</span>
                )}
                {showHonorarios ? <ChevronUp className="h-4 w-4 text-[#9ca3af]" /> : <ChevronDown className="h-4 w-4 text-[#9ca3af]" />}
              </button>
              {showHonorarios && (
                <div className="mt-4 space-y-5">
                  {(objetoPericia || areaTecnica) && (
                    <div className="grid grid-cols-2 gap-4">
                      {objetoPericia && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5 font-inter">Objeto</p>
                          <p className="text-[14px] text-[#374151] font-inter">{objetoPericia}</p>
                        </div>
                      )}
                      {areaTecnica && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5 font-inter">Área técnica</p>
                          <p className="text-[14px] text-[#374151] font-inter">{areaTecnica}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {estrategia && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-2 font-inter">Estratégia sugerida</p>
                      <p className="text-[14px] text-[#374151] leading-relaxed bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg px-5 py-4 font-inter">{estrategia}</p>
                    </div>
                  )}
                  {justificativas.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-2 font-inter">Justificativas para aumento</p>
                      <ul className="space-y-2">
                        {justificativas.map((j, i) => (
                          <li key={i} className="flex items-start gap-2 text-[14px] text-[#374151] font-inter">
                            <span className="text-[#416900] flex-shrink-0 mt-0.5">•</span>
                            {j}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pontoCriticos.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-2 font-inter">Pontos críticos</p>
                      <ul className="space-y-2">
                        {pontoCriticos.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-[14px] text-amber-800 font-inter">
                            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
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
            <div className="px-6 py-5">
              <div className="flex items-center gap-2.5 mb-4">
                <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" strokeWidth={1.5} />
                <p className="text-[15px] font-semibold text-[#1f2937] font-manrope">Prazos</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {prazoAceite && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5 font-inter">Aceite da nomeação</p>
                    <p className="text-[14px] font-semibold text-amber-700 font-inter">{prazoAceite}</p>
                  </div>
                )}
                {prazoLaudo && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5 font-inter">Entrega do laudo</p>
                    <p className="text-[14px] font-semibold text-[#374151] font-inter">{prazoLaudo}</p>
                  </div>
                )}
              </div>
              {outrosPrazos.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {outrosPrazos.map((p, i) => (
                    <li key={i} className="text-[14px] text-[#6b7280] font-inter">• {p}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Necessidades técnicas */}
          {(tipoVistoria || equipamentos.length > 0 || assistentes || coletaDados.length > 0) && (
            <div className="px-6 py-5">
              <button
                onClick={() => setShowTecnico((v) => !v)}
                className="flex w-full items-center gap-2.5 text-[15px] font-semibold text-[#1f2937] hover:text-[#374151] transition-colors font-manrope"
              >
                <Wrench className="h-5 w-5 text-[#6b7280] flex-shrink-0" strokeWidth={1.5} />
                <span className="flex-1 text-left">Necessidades técnicas</span>
                {showTecnico ? <ChevronUp className="h-4 w-4 text-[#9ca3af]" /> : <ChevronDown className="h-4 w-4 text-[#9ca3af]" />}
              </button>
              {showTecnico && (
                <div className="mt-4 space-y-4">
                  {tipoVistoria && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5 font-inter">Tipo de vistoria</p>
                      <p className="text-[14px] text-[#374151] font-inter">{tipoVistoria}</p>
                    </div>
                  )}
                  {equipamentos.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-2 font-inter">Equipamentos</p>
                      <div className="flex flex-wrap gap-2">
                        {equipamentos.map((e, i) => (
                          <span key={i} className="text-[13px] bg-[#f4fce3] border border-[#d8f5a2] text-[#416900] rounded-md px-2.5 py-1 font-inter">{e}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {assistentes && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-1.5 font-inter">Assistentes técnicos</p>
                      <p className="text-[14px] text-[#374151] font-inter">{assistentes}</p>
                    </div>
                  )}
                  {coletaDados.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-2 font-inter">Dados a coletar</p>
                      <ul className="space-y-1.5">
                        {coletaDados.map((d, i) => (
                          <li key={i} className="text-[14px] text-[#6b7280] font-inter">• {d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {necessitaDeslocamento && (
                    <p className="text-[14px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 font-inter">
                      Necessita deslocamento{custosLogisticos ? ` — ${custosLogisticos}` : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Riscos */}
          {(riscosTecnicos.length > 0 || riscosJuridicos.length > 0 || infoFaltando.length > 0) && (
            <div className="px-6 py-5">
              <button
                onClick={() => setShowRiscos((v) => !v)}
                className="flex w-full items-center gap-2.5 text-[15px] font-semibold text-[#1f2937] hover:text-[#374151] transition-colors font-manrope"
              >
                <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0" strokeWidth={1.5} />
                <span className="flex-1 text-left">Riscos e informações faltando</span>
                {showRiscos ? <ChevronUp className="h-4 w-4 text-[#9ca3af]" /> : <ChevronDown className="h-4 w-4 text-[#9ca3af]" />}
              </button>
              {showRiscos && (
                <div className="mt-4 space-y-4">
                  {riscosTecnicos.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-2 font-inter">Técnicos</p>
                      <ul className="space-y-1.5">
                        {riscosTecnicos.map((r, i) => <li key={i} className="text-[14px] text-[#6b7280] font-inter">• {r}</li>)}
                      </ul>
                    </div>
                  )}
                  {riscosJuridicos.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-2 font-inter">Jurídicos</p>
                      <ul className="space-y-1.5">
                        {riscosJuridicos.map((r, i) => <li key={i} className="text-[14px] text-[#6b7280] font-inter">• {r}</li>)}
                      </ul>
                    </div>
                  )}
                  {infoFaltando.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-2 font-inter">Informações faltando</p>
                      <ul className="space-y-1.5">
                        {infoFaltando.map((r, i) => <li key={i} className="text-[14px] text-rose-700 font-inter">• {r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Checklist */}
          {checklist.length > 0 && (
            <div className="px-6 py-5">
              <div className="flex items-center gap-2.5 mb-4">
                <CheckSquare className="h-5 w-5 text-[#416900] flex-shrink-0" strokeWidth={1.5} />
                <p className="text-[15px] font-semibold text-[#1f2937] font-manrope">Próximos passos (IA)</p>
              </div>
              <ul className="space-y-2">
                {checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-[#374151] font-inter">
                    <span className="text-[#416900] flex-shrink-0 mt-0.5">☐</span>
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

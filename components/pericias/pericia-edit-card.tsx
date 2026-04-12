'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import {
  Pencil,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
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
  tags?: string[]
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
    <div className="px-8 py-6">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
      {editing ? children : (
        <p className={cn('text-[14px] font-bold uppercase tracking-tight', value ? 'text-slate-900' : 'text-slate-300 italic')}>
          {value || 'Não informado'}
        </p>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

const COMMON_TAGS = ['Água', 'Energia', 'Avaliação Imobiliária', 'Grafotecnia', 'Médica', 'Trabalhista', 'Engenharia Civil', 'Contábil', 'Trânsito']

export function PericiaEditCard(props: Props) {
  const { periciaId, analise } = props

  const [tags, setTags] = useState<string[]>(props.tags ?? [])
  const [expanded, setExpanded] = useState(false)
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
      const res = await atualizarDadosPericia(periciaId, { ...form, tags })
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

  const inputCls = 'w-full rounded-none border-2 border-slate-200 bg-white px-5 py-4 text-[13px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 placeholder-slate-200 uppercase tracking-wide transition-all'

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
    <section className="rounded-none bg-white">
      {/* Header — sempre visível, toggle expand/edit */}
      <div className="flex items-center gap-4 px-8 py-4">
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <button
            onClick={() => { setExpanded(!expanded); if (!expanded) setEditing(false) }}
            className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-700 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Dados cadastrais
          </button>
          {autoFilled && !editing && !expanded && (
            <span className="text-[9px] text-[#a3e635] font-black uppercase tracking-widest bg-slate-900 px-2 py-0.5">IA</span>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#4d7c0f]">
              <Check className="h-3 w-3" /> Salvo
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {!expanded && (
            <button
              onClick={() => { setExpanded(true); setEditing(true) }}
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Editar
            </button>
          )}
          {expanded && !editing && (
            <>
              {analise && (
                <button
                  onClick={preencherComIA}
                  className="flex items-center gap-2 rounded-none bg-slate-50 hover:bg-[#a3e635] hover:text-slate-900 border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-900 transition-all"
                >
                  Preencher via IA
                </button>
              )}
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-none border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Editar dados
              </button>
            </>
          )}
          {expanded && editing && (
            <>
              <button
                onClick={() => { handleCancel(); setEditing(false) }}
                disabled={isPending}
                className="flex items-center gap-2 rounded-none border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 transition-all disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 rounded-none bg-[#a3e635] hover:bg-[#bef264] px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-900 transition-all disabled:opacity-50"
              >
                {isPending
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…</>
                  : 'Salvar'
                }
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="mx-8 mb-4 flex items-center gap-3 rounded-none bg-rose-50 border border-rose-100 px-4 py-3">
          <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">{saveError}</p>
        </div>
      )}

      {/* Editable fields — só aparece quando expandido */}
      <div className={cn('divide-y divide-[#f2f3f9] border-t border-[#f2f3f9]', !expanded && 'hidden')}>

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

        <Field label="Honorários estimados (R$)" value={display.valorHonorarios ? `R$ ${display.valorHonorarios.toFixed(2).replace('.', ',')}` : null} editing={editing}>
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
      {analise && expanded && (
        <div className="border-t border-[#e2e8f0]">

          {/* Cabeçalho da seção de análise */}
          <div className="flex items-center gap-3 px-8 py-6 bg-slate-900">
            <p className="text-[11px] font-black text-[#a3e635] uppercase tracking-[0.3em]">Análise Editorial Profunda — IA</p>
          </div>

          <div className="divide-y divide-[#f2f3f9]">

          {/* Despacho saneador / determinação do juiz */}
          {despacho && (
            <div className="px-8 py-6">
              <button
                onClick={() => setShowDespacho((v) => !v)}
                className="flex w-full items-center justify-between text-[11px] font-black text-slate-900 uppercase tracking-widest"
              >
                <span>Despacho do juiz / Determinação Judicial</span>
                {showDespacho ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {showDespacho && (
                <div className="mt-4 border-2 border-slate-100 bg-slate-50 px-6 py-5">
                  <p className="text-[13px] font-bold text-slate-700 leading-relaxed whitespace-pre-line uppercase tracking-tight">{despacho}</p>
                </div>
              )}
            </div>
          )}

          {/* Quesitos */}
          {quesitos.length > 0 && (
            <div className="px-8 py-6">
              <button
                onClick={() => setShowQuesitos((v) => !v)}
                className="flex w-full items-center justify-between text-[11px] font-black text-slate-900 uppercase tracking-widest"
              >
                <span>{quesitos.length} QUESITOS EXTRAÍDOS</span>
                {showQuesitos ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {showQuesitos && (
                <ol className="mt-6 space-y-4">
                  {quesitos.map((q, i) => (
                    <li key={i} className="text-[12px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight border-l-2 border-slate-200 pl-4">{q}</li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Honorários */}
          {(complexidade || estrategia || justificativas.length > 0 || pontoCriticos.length > 0) && (
            <div className="px-8 py-6">
              <button
                onClick={() => setShowHonorarios((v) => !v)}
                className="flex w-full items-center justify-between text-[11px] font-black text-slate-900 uppercase tracking-widest"
              >
                <span className="flex items-center gap-4">
                  ESTRATÉGIA EDITORIAL DE HONORÁRIOS
                  {complexidade && (
                    <span className="bg-slate-900 text-[#a3e635] px-2 py-0.5 text-[9px]">{complexidade.toUpperCase()}</span>
                  )}
                </span>
                {showHonorarios ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {showHonorarios && (
                <div className="mt-6 space-y-8">
                  {(objetoPericia || areaTecnica) && (
                    <div className="grid grid-cols-2 gap-8">
                      {objetoPericia && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Objeto da Perícia</p>
                          <p className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">{objetoPericia}</p>
                        </div>
                      )}
                      {areaTecnica && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Área técnica</p>
                          <p className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">{areaTecnica}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {estrategia && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Estratégia sugerida</p>
                      <p className="text-[13px] font-bold text-slate-700 leading-relaxed bg-slate-50 border-2 border-slate-100 px-6 py-5 uppercase tracking-tight">{estrategia}</p>
                    </div>
                  )}
                  {justificativas.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Linha de Argumentação (Justificativas)</p>
                      <ul className="space-y-3">
                        {justificativas.map((j, i) => (
                          <li key={i} className="text-[12px] font-bold text-slate-600 uppercase tracking-tight flex items-start gap-3">
                            <span className="text-[#a3e635] flex-shrink-0 mt-1">■</span>
                            {j}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pontoCriticos.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-3">Pontos críticos detectados</p>
                      <ul className="space-y-3">
                        {pontoCriticos.map((p, i) => (
                          <li key={i} className="text-[12px] font-bold text-rose-700 uppercase tracking-tight flex items-start gap-3">
                            <span className="text-rose-500 flex-shrink-0 mt-1">!</span>
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
            <div className="px-8 py-6">
              <div className="flex items-center gap-3 mb-6">
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Prazos e Cronograma</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                {prazoAceite && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Aceite da nomeação</p>
                    <p className="text-[13px] font-black text-rose-600 uppercase tracking-tight">{prazoAceite}</p>
                  </div>
                )}
                {prazoLaudo && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Entrega do laudo</p>
                    <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{prazoLaudo}</p>
                  </div>
                )}
              </div>
              {outrosPrazos.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {outrosPrazos.map((p, i) => (
                    <li key={i} className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">/ {p}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Necessidades técnicas */}
          {(tipoVistoria || equipamentos.length > 0 || assistentes || coletaDados.length > 0) && (
            <div className="px-8 py-6">
              <button
                onClick={() => setShowTecnico((v) => !v)}
                className="flex w-full items-center justify-between text-[11px] font-black text-slate-900 uppercase tracking-widest"
              >
                <span>Requisitos de Inteligência Técnica</span>
                {showTecnico ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {showTecnico && (
                <div className="mt-6 space-y-6">
                  {tipoVistoria && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Metodologia de Vistoria</p>
                      <p className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">{tipoVistoria}</p>
                    </div>
                  )}
                  {equipamentos.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Instrumentação Requerida</p>
                      <div className="flex flex-wrap gap-2">
                        {equipamentos.map((e, i) => (
                          <span key={i} className="text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white rounded-none px-3 py-1.5">{e}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {assistentes && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Consultoria Especializada</p>
                      <p className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">{assistentes}</p>
                    </div>
                  )}
                  {coletaDados.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Pontos de Coleta Estruturada</p>
                      <ul className="space-y-2">
                        {coletaDados.map((d, i) => (
                          <li key={i} className="text-[11px] font-bold text-slate-600 uppercase tracking-widest border-l-2 border-slate-200 pl-4">{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {necessitaDeslocamento && (
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 bg-[#a3e635] inline-block px-3 py-2">
                      DESLOCAMENTO REQUERIDO {custosLogisticos ? `— ${custosLogisticos.toUpperCase()}` : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Riscos */}
          {(riscosTecnicos.length > 0 || riscosJuridicos.length > 0 || infoFaltando.length > 0) && (
            <div className="px-8 py-6">
              <button
                onClick={() => setShowRiscos((v) => !v)}
                className="flex w-full items-center justify-between text-[11px] font-black text-slate-900 uppercase tracking-widest"
              >
                <span>Vulnerabilidades e Riscos</span>
                {showRiscos ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </button>
              {showRiscos && (
                <div className="mt-6 space-y-6">
                  {riscosTecnicos.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Impedimentos Técnicos</p>
                      <ul className="space-y-2">
                        {riscosTecnicos.map((r, i) => (
                          <li key={i} className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">/ {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {riscosJuridicos.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Exposição Jurídica</p>
                      <ul className="space-y-2">
                        {riscosJuridicos.map((r, i) => (
                          <li key={i} className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">/ {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {infoFaltando.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-3">Informações Críticas Ausentes</p>
                      <ul className="space-y-3">
                        {infoFaltando.map((r, i) => (
                          <li key={i} className="text-[12px] font-bold text-rose-700 uppercase tracking-tight flex items-start gap-3">
                            <span className="text-rose-500 mt-1">!</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Checklist */}
          {checklist.length > 0 && (
            <div className="px-8 py-6">
              <div className="flex items-center gap-3 mb-6">
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Protocolo de Próximos Passos</p>
              </div>
              <ul className="space-y-4">
                {checklist.map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-[12px] font-bold text-slate-800 uppercase tracking-tight">
                    <span className="h-4 w-4 border-2 border-slate-200 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          </div>{/* end divide-y */}
        </div>
      )}


      {/* Tags */}
      <div className={cn('px-8 py-4 border-t border-slate-100', !expanded && 'hidden')}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mr-2">TAGS</span>
          {(editing ? COMMON_TAGS : tags).map((tag) => {
            const active = tags.includes(tag)
            if (!editing && !active) return null
            return (
              <button
                key={tag}
                onClick={() => {
                  if (!editing) return
                  setTags((prev) => active ? prev.filter((t) => t !== tag) : [...prev, tag])
                }}
                className={cn(
                  "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 transition-all",
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-300 hover:text-slate-500'
                )}
              >
                {tag}
              </button>
            )
          })}
          {!editing && tags.length === 0 && (
            <span className="text-[9px] font-bold text-slate-200 uppercase tracking-widest">Nenhuma tag</span>
          )}
        </div>
      </div>
    </section>
  )
}

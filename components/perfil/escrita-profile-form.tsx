'use client'

import { useState, useTransition } from 'react'
import {
  PenLine,
  Check,
  Loader2,
  AlertCircle,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { saveEscritaProfile, resetEscritaProfile } from '@/lib/actions/escrita-profile'
import {
  TOM_LABEL,
  TOM_DESC,
  DEFAULT_ESTRUTURA_LAUDO,
  DEFAULT_ESTRUTURA_PROPOSTA,
} from '@/lib/types/escrita-profile'
import type { EscritaProfile, TomEscrita, Abreviatura } from '@/lib/types/escrita-profile'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TONS: TomEscrita[] = ['formal', 'tecnico', 'objetivo', 'detalhado', 'conciso']

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')

  function add() {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }

  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs text-slate-700">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-slate-400 hover:text-red-500 transition-colors">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="flex-1 h-8 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
        />
        <button type="button" onClick={add}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-lime-50 hover:text-lime-700 transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function SectionList({
  label,
  values,
  onChange,
  defaults,
}: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  defaults: string[]
}) {
  const [draft, setDraft] = useState('')

  function add() {
    const v = draft.trim()
    if (v) { onChange([...values, v]); setDraft('') }
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= values.length) return
    const next = [...values]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</label>
        {values.length === 0 && (
          <button type="button" onClick={() => onChange([...defaults])}
            className="text-[10px] text-slate-400 hover:text-lime-600 transition-colors">
            Usar padrão
          </button>
        )}
      </div>
      <div className="space-y-1 mb-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-1.5">
            <span className="flex-1 text-xs text-slate-700">{v}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
              className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
              <ChevronUp className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === values.length - 1}
              className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
              <ChevronDown className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="text-slate-300 hover:text-red-500 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="ex: I. Objeto da Perícia"
          className="flex-1 h-8 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
        />
        <button type="button" onClick={add}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-lime-50 hover:text-lime-700 transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface Props {
  initial: EscritaProfile
}

export function EscritaProfileForm({ initial }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)

  // ── Controlled state ──────────────────────────────────────────────────────
  const [tom, setTom] = useState<TomEscrita>(initial.tom)
  const [estruturaLaudo, setEstruturaLaudo] = useState(initial.estruturaLaudo)
  const [estruturaProposta, setEstruturaProposta] = useState(initial.estruturaProposta)
  const [expressoes, setExpressoes] = useState(initial.expressoes)
  const [palavrasEvitar, setPalavrasEvitar] = useState(initial.palavrasEvitar)
  const [abreviaturas, setAbreviaturas] = useState<Abreviatura[]>(initial.abreviaturas)
  const [estiloConc, setEstiloConc] = useState(initial.estiloConc)
  const [formulaFecho, setFormulaFecho] = useState(initial.formulaFecho)
  const [notasIA, setNotasIA] = useState(initial.notasIA)
  const [contextoRegional, setContextoRegional] = useState(initial.contextoRegional)

  // Abreviatura draft
  const [abrSigla, setAbrSigla] = useState('')
  const [abrExpansao, setAbrExpansao] = useState('')

  function addAbreviatura() {
    if (!abrSigla.trim() || !abrExpansao.trim()) return
    setAbreviaturas([...abreviaturas, { sigla: abrSigla.trim(), expansao: abrExpansao.trim() }])
    setAbrSigla(''); setAbrExpansao('')
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveEscritaProfile({
        tom, estruturaLaudo, estruturaProposta,
        templatesFavoritos: initial.templatesFavoritos,
        expressoes, palavrasEvitar, abreviaturas,
        estiloConc, formulaFecho, notasIA, contextoRegional,
      })
      if (!result.ok) setError(result.error)
      else setSaved(true)
    })
  }

  function handleReset() {
    startTransition(async () => {
      await resetEscritaProfile()
      setTom('formal'); setEstruturaLaudo([]); setEstruturaProposta([])
      setExpressoes([]); setPalavrasEvitar([]); setAbreviaturas([])
      setEstiloConc(''); setFormulaFecho(''); setNotasIA(''); setContextoRegional('')
      setShowReset(false)
    })
  }

  return (
    <div className="space-y-8">

      {/* Tom de escrita */}
      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Tom de Escrita</h3>
        <p className="text-xs text-slate-500 mb-3">Estilo geral que a IA usará ao redigir documentos seus.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {TONS.map((t) => (
            <label key={t} className={cn(
              'flex cursor-pointer flex-col gap-0.5 rounded-xl border-2 px-3 py-2.5 transition-colors',
              tom === t ? 'border-lime-400 bg-lime-50' : 'border-slate-200 hover:border-slate-300',
            )}>
              <input type="radio" name="tom" value={t} checked={tom === t}
                onChange={() => setTom(t)} className="sr-only" />
              <span className="text-xs font-semibold text-slate-800">{TOM_LABEL[t]}</span>
              <span className="text-[10px] text-slate-500">{TOM_DESC[t]}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Estrutura de documentos */}
      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Estrutura de Documentos</h3>
        <p className="text-xs text-slate-500 mb-4">Seções preferidas. A IA respeitará esta ordem ao gerar rascunhos.</p>
        <div className="grid md:grid-cols-2 gap-6">
          <SectionList
            label="Seções do Laudo Pericial"
            values={estruturaLaudo}
            onChange={setEstruturaLaudo}
            defaults={DEFAULT_ESTRUTURA_LAUDO}
          />
          <SectionList
            label="Seções da Proposta de Honorários"
            values={estruturaProposta}
            onChange={setEstruturaProposta}
            defaults={DEFAULT_ESTRUTURA_PROPOSTA}
          />
        </div>
      </section>

      {/* Vocabulary */}
      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Vocabulário</h3>
        <p className="text-xs text-slate-500 mb-4">Expressões favoritas e termos a evitar.</p>
        <div className="grid md:grid-cols-2 gap-6">
          <TagInput
            label="Expressões Recorrentes"
            values={expressoes}
            onChange={setExpressoes}
            placeholder='ex: "Diante do exposto"'
          />
          <TagInput
            label="Termos / Palavras a Evitar"
            values={palavrasEvitar}
            onChange={setPalavrasEvitar}
            placeholder='ex: "obviamente"'
          />
        </div>
      </section>

      {/* Glossary */}
      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Glossário Pessoal</h3>
        <p className="text-xs text-slate-500 mb-3">Siglas e abreviaturas que a IA deve conhecer e expandir.</p>
        <div className="space-y-2 mb-3">
          {abreviaturas.map((a, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
              <span className="w-16 flex-shrink-0 text-xs font-mono font-semibold text-slate-700">{a.sigla}</span>
              <span className="flex-1 text-xs text-slate-600">{a.expansao}</span>
              <button type="button" onClick={() => setAbreviaturas(abreviaturas.filter((_, j) => j !== i))}
                className="text-slate-300 hover:text-red-500 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={abrSigla} onChange={(e) => setAbrSigla(e.target.value.toUpperCase())}
            placeholder="Sigla" className="w-24 h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-lime-400" />
          <input value={abrExpansao} onChange={(e) => setAbrExpansao(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAbreviatura() } }}
            placeholder="Expansão completa" className="flex-1 h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-lime-400" />
          <button type="button" onClick={addAbreviatura}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-lime-50 hover:text-lime-700 transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Conclusion style */}
      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Estilo de Conclusão</h3>
        <p className="text-xs text-slate-500 mb-4">Como você costuma encerrar laudos e propostas.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Fórmula de Encerramento
            </label>
            <input
              value={formulaFecho}
              onChange={(e) => setFormulaFecho(e.target.value)}
              placeholder='ex: "Diante do exposto, concluímos que…"'
              className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Estilo Geral de Conclusão
            </label>
            <textarea
              value={estiloConc}
              onChange={(e) => setEstiloConc(e.target.value)}
              rows={2}
              placeholder="ex: Sempre encerro com resumo dos achados e referência às provas anexas"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none"
            />
          </div>
        </div>
      </section>

      {/* AI notes */}
      <section>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Instruções para a IA</h3>
        <p className="text-xs text-slate-500 mb-4">Notas livres que serão incluídas no prompt de geração de documentos.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Contexto Regional
            </label>
            <input
              value={contextoRegional}
              onChange={(e) => setContextoRegional(e.target.value)}
              placeholder="ex: Foro da Comarca do Rio de Janeiro — TJRJ"
              className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Notas Adicionais para a IA
            </label>
            <textarea
              value={notasIA}
              onChange={(e) => setNotasIA(e.target.value)}
              rows={3}
              placeholder="ex: Use numeração romana para seções. Inclua data e local no cabeçalho."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none"
            />
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Success */}
      {saved && !error && (
        <div className="flex items-center gap-2 rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm text-lime-800">
          <Check className="h-4 w-4 flex-shrink-0" />
          Perfil de escrita salvo com sucesso.
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1.5"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
          Salvar perfil de escrita
        </Button>

        <button
          type="button"
          onClick={() => setShowReset(!showReset)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-600 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Redefinir
        </button>

        {showReset && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Confirmar redefinição
          </Button>
        )}
      </div>
    </div>
  )
}

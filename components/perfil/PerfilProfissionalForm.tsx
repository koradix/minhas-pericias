'use client'

import { Check, Sparkles } from 'lucide-react'
import {
  AREAS_PRINCIPAIS,
  ESPECIALIDADES_POR_AREA,
  KEYWORDS_SUGERIDAS_POR_AREA,
  type AreaPrincipalId,
} from '@/lib/constants/pericias'
import type { PerfilProfissionalData } from '@/lib/actions/perfil'

// ─── Formação → Área principal sugerida ────────────────────────────────────────

const FORMACAO_AREA_MAP: Record<string, AreaPrincipalId> = {
  'Engenheiro Civil':        'engenharia',
  'Engenheiro Eletricista':  'engenharia',
  'Engenheiro Mecânico':     'engenharia',
  'Engenheiro de Produção':  'engenharia',
  'Arquiteto e Urbanista':   'imobiliario',
  'Contador':                'contabilidade',
  'Médico':                  'medicina',
  'Psicólogo':               'psicologia',
  'Advogado':                'outros',
  'Administrador':           'contabilidade',
  'Técnico':                 'engenharia',
}

const FORMACOES = Object.keys(FORMACAO_AREA_MAP).concat(['Outra formação'])

// ─── Re-usable chip button ─────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
        active
          ? 'bg-lime-500 border-lime-500 text-slate-900'
          : 'border-slate-300 text-slate-600 hover:border-lime-400 hover:text-lime-700 bg-white'
      }`}
    >
      {active && <Check className="h-3 w-3" />}
      {label}
    </button>
  )
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  value: PerfilProfissionalData
  onChange: (update: Partial<PerfilProfissionalData>) => void
  showFormacaoRegistro?: boolean
  formacaoCustom?: string
  onFormacaoCustomChange?: (v: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PerfilProfissionalForm({
  value,
  onChange,
  showFormacaoRegistro = true,
  formacaoCustom = '',
  onFormacaoCustomChange,
}: Props) {
  const { areaPrincipal, areasSecundarias, especialidades2, keywords, formacao, registro } = value

  const labelCls = 'block text-xs font-medium text-slate-700 mb-1.5'
  const inputCls = 'w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500'

  // ── Formação change: auto-suggest área principal ────────────────────────────

  function handleFormacaoChange(f: string) {
    const suggested = FORMACAO_AREA_MAP[f] as AreaPrincipalId | undefined
    const update: Partial<PerfilProfissionalData> = { formacao: f }
    // "Outra formação" → no auto-suggest, but clear custom text when switching away
    if (f !== 'Outra formação' && suggested && !areaPrincipal) {
      update.areaPrincipal = suggested
    }
    if (f !== 'Outra formação') {
      // Clear custom text when switching to a known formation
      onFormacaoCustomChange?.('')
    }
    onChange(update)
  }

  // ── Area helpers ────────────────────────────────────────────────────────────

  function setAreaPrincipal(id: AreaPrincipalId) {
    const newSecondary = areaPrincipal && areaPrincipal !== id
      ? [...areasSecundarias.filter((a) => a !== id), areaPrincipal as AreaPrincipalId]
      : areasSecundarias.filter((a) => a !== id)
    onChange({ areaPrincipal: id, areasSecundarias: newSecondary })
  }

  function toggleAreaSecundaria(id: AreaPrincipalId) {
    if (areaPrincipal === id) return
    onChange({
      areasSecundarias: areasSecundarias.includes(id)
        ? areasSecundarias.filter((a) => a !== id)
        : [...areasSecundarias, id],
    })
  }

  function toggleEspec(esp: string) {
    onChange({
      especialidades2: especialidades2.includes(esp)
        ? especialidades2.filter((e) => e !== esp)
        : [...especialidades2, esp],
    })
  }

  function toggleKeyword(kw: string) {
    onChange({
      keywords: keywords.includes(kw)
        ? keywords.filter((k) => k !== kw)
        : [...keywords, kw],
    })
  }

  // Suggested area from current formação
  const suggestedArea = formacao ? FORMACAO_AREA_MAP[formacao] : undefined

  // All active areas (principal + secundárias)
  const allAreas = [
    ...(areaPrincipal ? [areaPrincipal as AreaPrincipalId] : []),
    ...areasSecundarias,
  ] as AreaPrincipalId[]

  const especialidadesDisponiveis = allAreas.length
    ? [...new Set(allAreas.flatMap((a) => ESPECIALIDADES_POR_AREA[a] ?? []))]
    : []

  const keywordsSugeridas = allAreas.length
    ? [...new Set(allAreas.flatMap((a) => KEYWORDS_SUGERIDAS_POR_AREA[a] ?? []))]
    : []

  return (
    <div className="space-y-6">

      {/* ── Seção 1 — Formação + Registro ──────────────────────────────────── */}
      {showFormacaoRegistro && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Formação acadêmica *</label>
              <select
                className={inputCls}
                value={formacao ?? ''}
                onChange={(e) => handleFormacaoChange(e.target.value)}
              >
                <option value="">Selecione...</option>
                {FORMACOES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Registro profissional</label>
              <input
                className={inputCls}
                placeholder="CREA / CRC / CRM / CRP..."
                value={registro ?? ''}
                onChange={(e) => onChange({ registro: e.target.value })}
              />
            </div>
          </div>
          {formacao === 'Outra formação' && (
            <div>
              <label className={labelCls}>Descreva sua formação</label>
              <input
                className={inputCls}
                placeholder="Ex: Biólogo, Geógrafo, Analista de Sistemas..."
                value={formacaoCustom}
                onChange={(e) => onFormacaoCustomChange?.(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Seção 2 — Área principal (sugerida pela formação) ─────────────── */}
      <div>
        <p className={labelCls}>
          Área principal de atuação *
          {suggestedArea && !areaPrincipal && (
            <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600">
              <Sparkles className="h-3 w-3" />
              selecione abaixo
            </span>
          )}
        </p>

        {/* Hint badge when suggested but not yet selected */}
        {suggestedArea && !areaPrincipal && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Com base na sua formação, sugerimos a área{' '}
              <button
                type="button"
                className="font-semibold underline underline-offset-2"
                onClick={() => setAreaPrincipal(suggestedArea)}
              >
                {AREAS_PRINCIPAIS.find((a) => a.id === suggestedArea)?.label}
              </button>
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {AREAS_PRINCIPAIS.map((area) => {
            const isPrimary    = areaPrincipal === area.id
            const isSecondary  = areasSecundarias.includes(area.id)
            const isSuggested  = suggestedArea === area.id && !areaPrincipal

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => isPrimary ? undefined : setAreaPrincipal(area.id as AreaPrincipalId)}
                onContextMenu={(e) => { e.preventDefault(); toggleAreaSecundaria(area.id as AreaPrincipalId) }}
                title={
                  isPrimary   ? 'Área principal selecionada' :
                  isSecondary ? 'Área secundária — clique direito para remover' :
                  isSuggested ? 'Sugerida pela sua formação — clique para selecionar' :
                                'Clique para selecionar como principal'
                }
                className={`relative flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors ${
                  isPrimary
                    ? 'border-lime-500 bg-lime-50 text-lime-800 ring-1 ring-lime-500'
                    : isSuggested
                    ? 'border-amber-300 bg-amber-50/60 text-amber-800 ring-1 ring-amber-300'
                    : isSecondary
                    ? 'border-slate-300 bg-slate-50 text-slate-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {isPrimary && (
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-lime-500">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
                {isSuggested && !isPrimary && (
                  <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                )}
                {isSecondary && !isPrimary && !isSuggested && (
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-slate-300">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
                <span className="leading-tight">{area.label}</span>
                {isPrimary && (
                  <span className="ml-auto text-[9px] font-bold text-lime-600 whitespace-nowrap">principal</span>
                )}
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          Clique para definir a principal. Clique direito para adicionar áreas secundárias.
        </p>
      </div>

      {/* ── Seção 3 — Especialidades ──────────────────────────────────────── */}
      {especialidadesDisponiveis.length > 0 && (
        <div>
          <p className={labelCls}>
            Especialidades em perícia
            {especialidades2.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-lime-100 text-lime-700 text-[10px] font-bold px-1.5 py-0.5">
                {especialidades2.length}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {especialidadesDisponiveis.map((esp) => (
              <Chip
                key={esp}
                label={esp}
                active={especialidades2.includes(esp)}
                onClick={() => toggleEspec(esp)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Seção 4 — Keywords ────────────────────────────────────────────── */}
      {keywordsSugeridas.length > 0 && (
        <div>
          <p className={labelCls}>
            Palavras-chave para busca
            <span className="ml-1 font-normal text-slate-400">— melhoram o matching de demandas</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {keywordsSugeridas.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                active={keywords.includes(kw)}
                onClick={() => toggleKeyword(kw)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

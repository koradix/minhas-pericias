'use client'

import { useState } from 'react'
import { Pencil, X, Save, Loader2, List, Target, AlertTriangle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { salvarResumoEditado } from '@/lib/actions/processos-intake'
import type { ResumoData } from '@/lib/actions/processos-intake'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  intakeId: string
  resumo: ResumoData
}

// ─── View sub-components ──────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: typeof List; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}

function BulletList({ items, color = 'slate' }: { items: string[]; color?: 'slate' | 'amber' | 'violet' }) {
  if (!items.length) return <p className="text-xs text-slate-400 italic">—</p>
  const dotColor = {
    slate:  'bg-slate-300',
    amber:  'bg-amber-400',
    violet: 'bg-violet-400',
  }[color]
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0', dotColor)} />
          <span className="text-sm text-slate-700 leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Edit textarea helpers ────────────────────────────────────────────────────

function FieldTextarea({
  label, value, onChange, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void; rows?: number
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
      />
    </div>
  )
}

function ListTextarea({
  label, items, onChange, hint,
}: {
  label: string; items: string[]; onChange: (v: string[]) => void; hint?: string
}) {
  const text = items.join('\n')
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
        {label}
        {hint && <span className="ml-1 normal-case font-normal text-slate-400">({hint})</span>}
      </label>
      <textarea
        rows={Math.max(items.length + 1, 3)}
        value={text}
        onChange={(e) => onChange(e.target.value.split('\n').filter((l) => l.trim()))}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ResumoBlock({ intakeId, resumo }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Editable draft — starts from server-provided data
  const [draft, setDraft] = useState<ResumoData>({ ...resumo })

  function patch<K extends keyof ResumoData>(key: K, value: ResumoData[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function handleCancel() {
    setDraft({ ...resumo })
    setEditing(false)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await salvarResumoEditado(intakeId, draft)
    setSaving(false)
    if (result.ok) {
      setEditing(false)
    } else {
      setError(result.message)
    }
  }

  // ── View mode ────────────────────────────────────────────────────────────────

  if (!editing) {
    return (
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
            className="h-7 px-2.5 text-xs gap-1.5 text-slate-500 hover:text-slate-800"
          >
            <Pencil className="h-3 w-3" />
            Editar resumo
          </Button>
        </div>

        {/* Resumo curto — full-width callout */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-violet-500" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600">
              Resumo
            </p>
          </div>
          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {draft.resumoCurto}
          </p>
        </div>

        {/* Objeto da perícia */}
        <div>
          <SectionLabel icon={Target} label="Objeto da perícia" />
          <p className="text-sm text-slate-700 leading-relaxed">{draft.objetoDaPericia}</p>
        </div>

        {/* Two-column: pontos + necessidades */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <SectionLabel icon={List} label="Pontos relevantes" />
            <BulletList items={draft.pontosRelevantes} color="violet" />
          </div>
          <div>
            <SectionLabel icon={AlertTriangle} label="Necessidades de campo" />
            <BulletList items={draft.necessidadesDeCampo} color="amber" />
          </div>
        </div>
      </div>
    )
  }

  // ── Edit mode ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Edit header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-3 py-1">
          Modo de edição
        </p>
        <button
          onClick={handleCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Cancelar edição"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Fields */}
      <FieldTextarea
        label="Resumo curto"
        rows={2}
        value={draft.resumoCurto}
        onChange={(v) => patch('resumoCurto', v)}
      />
      <FieldTextarea
        label="Objeto da perícia"
        rows={4}
        value={draft.objetoDaPericia}
        onChange={(v) => patch('objetoDaPericia', v)}
      />
      <ListTextarea
        label="Pontos relevantes"
        hint="um por linha"
        items={draft.pontosRelevantes}
        onChange={(v) => patch('pontosRelevantes', v)}
      />
      <ListTextarea
        label="Necessidades de campo"
        hint="um por linha"
        items={draft.necessidadesDeCampo}
        onChange={(v) => patch('necessidadesDeCampo', v)}
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Save / Cancel */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saving ? 'Salvando...' : 'Salvar resumo'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={saving}
          className="text-slate-500"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}

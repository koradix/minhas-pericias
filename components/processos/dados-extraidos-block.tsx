// Server component — no 'use client' needed.
// Receives extracted data + profile area and renders a profile-aware layout.

import { MapPin, Users, Scale, FileQuestion, Building2, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExtractProcessDataOutput } from '@/lib/ai/types'

// ─── Profile categories ───────────────────────────────────────────────────────

type Emphasis = 'engineering' | 'medicine' | 'default'

const ENGINEERING_AREAS = ['engenharia', 'imobiliario', 'meio_ambiente', 'transito', 'quimica']
const MEDICINE_AREAS    = ['medicina', 'psicologia', 'biologia']

export function getEmphasis(areaPrincipal: string | null | undefined): Emphasis {
  if (!areaPrincipal) return 'default'
  if (ENGINEERING_AREAS.includes(areaPrincipal)) return 'engineering'
  if (MEDICINE_AREAS.includes(areaPrincipal))    return 'medicine'
  return 'default'
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Field({ label, value, mono = false, span2 = false }: {
  label: string; value: string | null | undefined; mono?: boolean; span2?: boolean
}) {
  if (!value) return null
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className={cn('text-sm font-medium text-slate-800', mono && 'font-mono text-xs')}>{value}</p>
    </div>
  )
}

function Quesitos({ quesitos }: { quesitos: string[] }) {
  if (!quesitos.length) return null
  return (
    <div className="sm:col-span-2 mt-1">
      <div className="flex items-center gap-2 mb-2">
        <FileQuestion className="h-3.5 w-3.5 text-slate-400" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Quesitos ({quesitos.length})
        </p>
      </div>
      <ol className="space-y-2">
        {quesitos.map((q, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-slate-700 leading-snug">{q}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function PartesBadges({ autor, reu }: { autor: string | null; reu: string | null }) {
  if (!autor && !reu) return null
  return (
    <div className="sm:col-span-2">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-3.5 w-3.5 text-slate-400" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Partes</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {autor && (
          <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Autor</p>
            <p className="text-sm font-medium text-slate-800">{autor}</p>
          </div>
        )}
        {reu && (
          <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Réu</p>
            <p className="text-sm font-medium text-slate-800">{reu}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EnderecoHighlight({ endereco }: { endereco: string | null }) {
  if (!endereco) return null
  return (
    <div className="sm:col-span-2">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <MapPin className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-0.5">
            Local da vistoria
          </p>
          <p className="text-sm font-semibold text-amber-900">{endereco}</p>
        </div>
      </div>
    </div>
  )
}

function EnderecoSmall({ endereco }: { endereco: string | null }) {
  if (!endereco) return null
  return (
    <div className="sm:col-span-2">
      <div className="flex items-center gap-2 mb-0.5">
        <MapPin className="h-3 w-3 text-slate-400" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Endereço</p>
      </div>
      <p className="text-sm text-slate-600 pl-5">{endereco}</p>
    </div>
  )
}

function TipoBadge({ tipo }: { tipo: string | null }) {
  if (!tipo) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
      {tipo}
    </span>
  )
}

// ─── Layouts by emphasis ──────────────────────────────────────────────────────

function EngineeringLayout({ d }: { d: ExtractProcessDataOutput }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Tipo + número — identity row */}
      <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
        <TipoBadge tipo={d.tipoPericia} />
        {d.numeroProcesso && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5">
            <Hash className="h-2.5 w-2.5" />{d.numeroProcesso}
          </span>
        )}
      </div>

      {/* Address — PROMINENT */}
      <EnderecoHighlight endereco={d.endereco} />

      {/* Vara + tribunal */}
      <Field label="Vara" value={d.vara} span2 />
      <Field label="Tribunal" value={d.tribunal} />
      <Field label="Assunto" value={d.assunto} span2 />

      {/* Parties — secondary */}
      <PartesBadges autor={d.autor} reu={d.reu} />

      {/* Quesitos — prominent */}
      <Quesitos quesitos={d.quesitos ?? []} />
    </div>
  )
}

function MedicineLayout({ d }: { d: ExtractProcessDataOutput }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Tipo + número */}
      <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
        <TipoBadge tipo={d.tipoPericia} />
        {d.numeroProcesso && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5">
            <Hash className="h-2.5 w-2.5" />{d.numeroProcesso}
          </span>
        )}
      </div>

      {/* Parties — PROMINENT for medicine */}
      <PartesBadges autor={d.autor} reu={d.reu} />

      {/* Assunto */}
      <Field label="Assunto / Objeto" value={d.assunto} span2 />

      {/* Vara + tribunal */}
      <Field label="Vara" value={d.vara} />
      <Field label="Tribunal" value={d.tribunal} />

      {/* Quesitos */}
      <Quesitos quesitos={d.quesitos ?? []} />

      {/* Endereco — secondary */}
      <EnderecoSmall endereco={d.endereco} />
    </div>
  )
}

function DefaultLayout({ d }: { d: ExtractProcessDataOutput }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Tipo + número */}
      <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
        <TipoBadge tipo={d.tipoPericia} />
        {d.numeroProcesso && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5">
            <Hash className="h-2.5 w-2.5" />{d.numeroProcesso}
          </span>
        )}
      </div>

      {/* Assunto */}
      <Field label="Assunto" value={d.assunto} span2 />

      {/* Vara + tribunal */}
      <Field label="Tribunal" value={d.tribunal} />
      <Field label="Vara" value={d.vara} />

      {/* Parties */}
      <PartesBadges autor={d.autor} reu={d.reu} />

      {/* Quesitos */}
      <Quesitos quesitos={d.quesitos ?? []} />

      {/* Endereco */}
      <EnderecoSmall endereco={d.endereco} />
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  dados: ExtractProcessDataOutput
  emphasis: Emphasis
}

export function DadosExtraidosBlock({ dados, emphasis }: Props) {
  switch (emphasis) {
    case 'engineering': return <EngineeringLayout d={dados} />
    case 'medicine':    return <MedicineLayout d={dados} />
    default:            return <DefaultLayout d={dados} />
  }
}

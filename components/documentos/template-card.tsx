'use client'

import { useState, useTransition } from 'react'
import {
  FileText,
  Star,
  StarOff,
  ToggleLeft,
  ToggleRight,
  GitBranch,
  Loader2,
  FileUp,
  Cpu,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ativarTemplate,
  desativarTemplate,
  definirPreferido,
} from '@/lib/actions/templates'
import {
  TIPO_TEMPLATE_LABEL,
  TIPO_TEMPLATE_COLOR,
} from '@/lib/types/templates'
import type { TemplateMetadata } from '@/lib/types/templates'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function mimeLabel(mime: string | null): string {
  if (!mime) return ''
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('wordprocessingml')) return 'DOCX'
  if (mime.includes('plain')) return 'TXT'
  return mime.split('/').pop()?.toUpperCase() ?? ''
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  template: TemplateMetadata
  totalVersoes?: number
  onNewVersion?: (id: string) => void
}

export function TemplateCard({ template, totalVersoes = 1, onNewVersion }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [optimisticActive, setOptimisticActive] = useState(template.isActive)
  const [optimisticPreferido, setOptimisticPreferido] = useState(template.preferido)

  function handleToggleActive() {
    setError(null)
    const next = !optimisticActive
    setOptimisticActive(next)
    startTransition(async () => {
      const res = next
        ? await ativarTemplate(template.id)
        : await desativarTemplate(template.id)
      if (!res.ok) {
        setOptimisticActive(!next) // revert
        setError(res.error)
      }
    })
  }

  function handleDefinirPreferido() {
    if (optimisticPreferido) return // already preferred
    setError(null)
    setOptimisticPreferido(true)
    startTransition(async () => {
      const res = await definirPreferido(template.id)
      if (!res.ok) {
        setOptimisticPreferido(false)
        setError(res.error)
      }
    })
  }

  const tipoCor = TIPO_TEMPLATE_COLOR[template.tipo as keyof typeof TIPO_TEMPLATE_COLOR]
    ?? 'bg-slate-50 text-slate-700 border-slate-200'

  const tipoLabel = TIPO_TEMPLATE_LABEL[template.tipo as keyof typeof TIPO_TEMPLATE_LABEL]
    ?? template.tipo

  return (
    <div
      className={cn(
        'rounded-2xl border bg-white shadow-sm transition-opacity',
        !optimisticActive && 'opacity-50',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <FileText className="h-4 w-4 text-slate-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', tipoCor)}>
              {tipoLabel}
            </span>
            <span className="text-[10px] text-slate-400">v{template.versao}</span>
            {totalVersoes > 1 && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                <GitBranch className="h-2.5 w-2.5" />
                {totalVersoes} versões
              </span>
            )}
            {optimisticPreferido && (
              <span className="flex items-center gap-0.5 rounded-md bg-lime-50 border border-lime-200 px-1.5 py-0.5 text-[10px] font-semibold text-lime-700">
                <Star className="h-2.5 w-2.5" />
                Preferido
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-semibold text-slate-800 leading-tight truncate">
            {template.nome}
          </p>
          {template.descricao && (
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{template.descricao}</p>
          )}
        </div>
      </div>

      {/* Metadata strip */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 px-5 py-2">
        {template.especialidade && (
          <span className="text-[10px] text-slate-500">
            <span className="font-medium text-slate-600">{template.especialidade}</span>
            {template.subEspecialidade && ` / ${template.subEspecialidade}`}
          </span>
        )}
        {template.nomeArquivo && (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <FileUp className="h-2.5 w-2.5" />
            {mimeLabel(template.mimeType)}
            {template.tamanhoBytes ? ` · ${formatBytes(template.tamanhoBytes)}` : ''}
          </span>
        )}
        {template.textoExtraido && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600">
            <Cpu className="h-2.5 w-2.5" />
            Texto extraído
            {template.tokenCount ? ` · ~${template.tokenCount.toLocaleString()} tokens` : ''}
          </span>
        )}
        <span className="ml-auto text-[10px] text-slate-300">
          {template.totalUsos} uso{template.totalUsos !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-2 flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-3 py-1.5 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-slate-100 px-4 py-2.5">
        {/* Toggle active */}
        <button
          onClick={handleToggleActive}
          disabled={isPending}
          title={optimisticActive ? 'Desativar template' : 'Ativar template'}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-slate-100 text-slate-500 disabled:opacity-40"
        >
          {isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : optimisticActive
              ? <ToggleRight className="h-3.5 w-3.5 text-lime-600" />
              : <ToggleLeft className="h-3.5 w-3.5" />}
          {optimisticActive ? 'Ativo' : 'Inativo'}
        </button>

        {/* Set preferred */}
        {optimisticActive && !optimisticPreferido && (
          <button
            onClick={handleDefinirPreferido}
            disabled={isPending}
            title="Definir como preferido para este tipo"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40"
          >
            <StarOff className="h-3.5 w-3.5" />
            Preferido
          </button>
        )}

        {/* New version */}
        {onNewVersion && (
          <button
            onClick={() => onNewVersion(template.id)}
            disabled={isPending}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            <GitBranch className="h-3.5 w-3.5" />
            Nova versão
          </button>
        )}
      </div>
    </div>
  )
}

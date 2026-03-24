'use client'

/**
 * Template Management Page — /documentos/templates
 *
 * Admin-ready interface for:
 * - Listing all templates grouped by tipo
 * - Uploading new templates
 * - Creating new versions of existing templates
 * - Activating / deactivating templates
 * - Defining the preferred template per tipo
 *
 * This is a client-side page so that the upload form, toggle actions,
 * and version panel can be used without full page reloads.
 */

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  ChevronRight,
  Plus,
  SlidersHorizontal,
  Loader2,
  FileText,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TemplateCard } from '@/components/documentos/template-card'
import { TemplateUploadForm } from '@/components/documentos/template-upload-form'
import { TIPO_TEMPLATE_LABEL } from '@/lib/types/templates'
import type { TemplateMetadata, TipoTemplate } from '@/lib/types/templates'

// ─── Fetch helper (calls Route Handler) ──────────────────────────────────────

async function fetchTemplates(tipo?: string): Promise<TemplateMetadata[]> {
  const params = tipo ? `?tipo=${encodeURIComponent(tipo)}` : ''
  const res = await fetch(`/api/templates${params}`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const TIPOS: (TipoTemplate | 'TODOS')[] = [
  'TODOS',
  'LAUDO',
  'PROPOSTA_HONORARIOS',
  'PARECER_TECNICO',
  'RESPOSTA_QUESITOS',
]

const TIPO_LABELS: Record<string, string> = {
  TODOS: 'Todos',
  ...TIPO_TEMPLATE_LABEL,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([])
  const [filter, setFilter] = useState<TipoTemplate | 'TODOS'>('TODOS')
  const [showUpload, setShowUpload] = useState(false)
  const [newVersionFor, setNewVersionFor] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function reload(tipo?: TipoTemplate) {
    startTransition(async () => {
      const data = await fetchTemplates(tipo === 'TODOS' as TipoTemplate ? undefined : tipo)
      setTemplates(data)
    })
  }

  useEffect(() => {
    reload(filter === 'TODOS' ? undefined : filter as TipoTemplate)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  function handleFilterChange(next: TipoTemplate | 'TODOS') {
    setFilter(next)
    setShowUpload(false)
    setNewVersionFor(null)
  }

  function handleUploadSuccess() {
    setShowUpload(false)
    setNewVersionFor(null)
    reload(filter === 'TODOS' ? undefined : filter as TipoTemplate)
  }

  const filtered = templates
  const activeCount = filtered.filter((t) => t.isActive).length

  return (
    <div className="space-y-6 pb-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/documentos" className="hover:text-slate-600 transition-colors flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          Documentos
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-600 font-medium">Templates</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Templates de Documentos</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie modelos para laudos e propostas · {activeCount} ativo{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { setShowUpload(!showUpload); setNewVersionFor(null) }}
          className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Template
        </Button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="rounded-2xl border border-lime-200 bg-lime-50/40 p-5">
          <p className="text-xs font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5 text-lime-600" />
            Enviar novo template
          </p>
          <TemplateUploadForm
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* New version panel */}
      {newVersionFor && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
          <p className="text-xs font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-violet-600" />
            Nova versão do template
          </p>
          <TemplateUploadForm
            versaoPaiId={newVersionFor}
            onSuccess={handleUploadSuccess}
            onCancel={() => setNewVersionFor(null)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1 flex-wrap">
        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 mr-1" />
        {TIPOS.map((t) => (
          <button
            key={t}
            onClick={() => handleFilterChange(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === t
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {TIPO_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando…
        </div>
      )}

      {/* Template grid */}
      {!isPending && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Nenhum template encontrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Clique em &ldquo;Novo Template&rdquo; para enviar o primeiro modelo.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowUpload(true)}
            className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Template
          </Button>
        </div>
      )}

      {!isPending && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onNewVersion={(id) => { setNewVersionFor(id); setShowUpload(false) }}
            />
          ))}
        </div>
      )}

      {/* AI readiness note */}
      {!isPending && filtered.some((t) => t.textoExtraido) && (
        <p className="text-center text-[10px] text-slate-400">
          Templates com texto extraído estão prontos para uso como contexto de IA.
        </p>
      )}
    </div>
  )
}

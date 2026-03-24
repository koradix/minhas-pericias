'use client'

import { useState, useTransition, useRef } from 'react'
import { Upload, Loader2, Check, AlertCircle, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { uploadTemplate } from '@/lib/actions/templates'
import { TIPO_TEMPLATE_LABEL } from '@/lib/types/templates'
import type { TipoTemplate } from '@/lib/types/templates'

// ─── Specialty options by tipo ────────────────────────────────────────────────

const ESPECIALIDADES_POR_TIPO: Partial<Record<TipoTemplate, string[]>> = {
  LAUDO: [
    'Avaliação de Imóvel', 'Perícia Contábil', 'Perícia Trabalhista',
    'Engenharia / Construção', 'Avaliação de Empresa', 'Acidente de Trânsito',
    'Saúde / Médica', 'TI / Sistemas',
  ],
  PROPOSTA_HONORARIOS: [
    'Avaliação de Imóvel', 'Perícia Contábil', 'Perícia Trabalhista',
    'Engenharia / Construção', 'Avaliação de Empresa',
  ],
  PARECER_TECNICO: ['Avaliação de Imóvel', 'Engenharia / Construção', 'TI / Sistemas'],
  RESPOSTA_QUESITOS: ['Geral', 'Avaliação de Imóvel', 'Perícia Trabalhista', 'Perícia Contábil'],
}

const TIPOS: TipoTemplate[] = ['LAUDO', 'PROPOSTA_HONORARIOS', 'PARECER_TECNICO', 'RESPOSTA_QUESITOS']

const ACCEPT = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
].join(',')

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  /** Pre-selected tipo (e.g. when creating a version of an existing template) */
  defaultTipo?: TipoTemplate
  /** ID of the template being versioned */
  versaoPaiId?: string
  onSuccess?: (id: string) => void
  onCancel?: () => void
}

export function TemplateUploadForm({ defaultTipo, versaoPaiId, onSuccess, onCancel }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<TipoTemplate>(defaultTipo ?? 'LAUDO')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const especialidades = ESPECIALIDADES_POR_TIPO[selectedTipo] ?? []

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    if (versaoPaiId) formData.set('versaoPaiId', versaoPaiId)

    startTransition(async () => {
      const result = await uploadTemplate(formData)
      if (!result.ok) {
        setError(result.error)
      } else {
        setSuccess(true)
        onSuccess?.(result.data.id)
      }
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-lime-200 bg-lime-50/50 p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-100">
          <Check className="h-5 w-5 text-lime-700" />
        </div>
        <p className="text-sm font-semibold text-slate-800">Template salvo com sucesso!</p>
        <p className="text-xs text-slate-500">O texto será extraído em segundo plano para IA.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Tipo de Documento *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map((t) => (
            <label
              key={t}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                selectedTipo === t
                  ? 'border-lime-400 bg-lime-50 text-lime-800'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300',
                defaultTipo && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name="tipo"
                value={t}
                checked={selectedTipo === t}
                disabled={!!defaultTipo}
                onChange={() => setSelectedTipo(t)}
                className="sr-only"
              />
              {TIPO_TEMPLATE_LABEL[t]}
            </label>
          ))}
        </div>
      </div>

      {/* Nome */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Nome do Template *
        </label>
        <input
          name="nome"
          required
          placeholder="ex: Laudo de Avaliação de Imóvel Residencial"
          className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
        />
      </div>

      {/* Especialidade */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Especialidade
          </label>
          <select
            name="especialidade"
            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
          >
            <option value="">Geral / Sem especialidade</option>
            {especialidades.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Sub-especialidade
          </label>
          <input
            name="subEspecialidade"
            placeholder="ex: Imóvel Residencial"
            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Descrição
        </label>
        <textarea
          name="descricao"
          rows={2}
          placeholder="Breve descrição do template e quando usá-lo"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none"
        />
      </div>

      {/* File upload */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Arquivo (PDF, DOCX ou TXT · máx. 20 MB)
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors',
            selectedFile
              ? 'border-lime-300 bg-lime-50/40'
              : 'border-slate-200 hover:border-slate-300',
          )}
        >
          {selectedFile ? (
            <>
              <FileText className="h-6 w-6 text-lime-600" />
              <p className="text-xs font-medium text-slate-700">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-400">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-600 transition-colors"
              >
                <X className="h-3 w-3" /> Remover
              </button>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-slate-400" />
              <p className="text-xs text-slate-500">
                Clique para selecionar ou arraste o arquivo aqui
              </p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          name="arquivo"
          accept={ACCEPT}
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}
            className="border-slate-200 text-slate-600">
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1.5"
        >
          {isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Upload className="h-3.5 w-3.5" />}
          {versaoPaiId ? 'Salvar nova versão' : 'Salvar template'}
        </Button>
      </div>
    </form>
  )
}

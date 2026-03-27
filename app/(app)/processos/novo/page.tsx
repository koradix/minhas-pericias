'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { criarProcessoIntake } from '@/lib/actions/processos-intake'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function ProcessosNovoPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|doc|docx)$/i)) {
      setError('Apenas arquivos PDF, DOC ou DOCX são aceitos')
      return
    }
    if (f.size > 40 * 1024 * 1024) {
      setError('Arquivo muito grande — máximo 40 MB')
      return
    }
    setError(null)
    setFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) { setError('Selecione um arquivo'); return }
    setIsPending(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('arquivo', file)
      await criarProcessoIntake(fd)
    } catch (err: unknown) {
      // redirect throws, but other errors we show
      if (err instanceof Error && !err.message.includes('NEXT_REDIRECT')) {
        setError(err.message)
        setIsPending(false)
      }
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back */}
      <div>
        <Link href="/processos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Processos
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Enviar processo</h1>
        <p className="text-sm text-slate-500 mt-1">
          Faça upload do PDF ou documento do processo para extração de dados e análise por IA.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer',
            isDragging
              ? 'border-lime-500 bg-lime-50'
              : file
                ? 'border-slate-300 bg-slate-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            name="arquivo"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          {file ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 mb-3">
                <FileText className="h-5 w-5 text-rose-400" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">{formatBytes(file.size)}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-3 w-3" /> Remover arquivo
              </button>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 mb-3">
                <Upload className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Arraste o arquivo ou clique para selecionar
              </p>
              <p className="text-xs text-slate-400 mt-1.5">PDF, DOC ou DOCX — até 40 MB</p>
            </>
          )}
        </div>

        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Info box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 space-y-1.5">
          <p className="font-semibold text-slate-700">O que acontece depois do upload?</p>
          <p>1. O documento é registrado com status <strong>upload feito</strong></p>
          <p>2. Clique em <strong>Extrair dados</strong> para extrair informações do processo por IA</p>
          <p>3. Clique em <strong>Gerar resumo</strong> para criar um resumo executivo</p>
          <p>4. Clique em <strong>Criar card da perícia</strong> para iniciar o processo pericial</p>
        </div>

        <Button
          type="submit"
          disabled={!file || isPending}
          className="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 gap-2 h-11"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
          ) : (
            <><Upload className="h-4 w-4" /> Enviar processo</>
          )}
        </Button>
      </form>
    </div>
  )
}

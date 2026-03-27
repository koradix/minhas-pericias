'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Paperclip,
  Upload,
  FileText,
  Loader2,
  X,
} from 'lucide-react'
import { uploadDocumentoNomeacao } from '@/lib/actions/nomeacoes-intake'

interface Props {
  nomeacaoId: string
  nomeArquivo: string | null
  tamanhoBytes?: number | null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function NomeacaoDocumentosSection({ nomeacaoId, nomeArquivo: initial, tamanhoBytes: initialBytes }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  const [nomeArquivo, setNomeArquivo] = useState(initial)
  const [tamanho, setTamanho] = useState(initialBytes ?? null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorMsg(null)

    const fd = new FormData()
    fd.append('arquivo', file)

    startTransition(async () => {
      const res = await uploadDocumentoNomeacao(nomeacaoId, fd)
      if (res.ok) {
        setNomeArquivo(file.name)
        setTamanho(file.size)
        router.refresh()
      } else {
        setErrorMsg(res.message)
      }
    })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
            <Paperclip className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800">Documentos do processo</h2>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-xs px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          {isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Upload className="h-3.5 w-3.5" />
          }
          {nomeArquivo ? 'Substituir' : 'Adicionar documento'}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleUpload}
      />

      {/* Body */}
      <div className="px-5 py-4">
        {errorMsg && (
          <p className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {errorMsg}
          </p>
        )}

        {nomeArquivo ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800 truncate">{nomeArquivo}</p>
              {tamanho != null && (
                <p className="text-xs text-emerald-600">{formatBytes(tamanho)}</p>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
            className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-8 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200">
              {isPending
                ? <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                : <Upload className="h-5 w-5 text-slate-400" />
              }
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">Clique para enviar</p>
              <p className="text-xs text-slate-400 mt-0.5">PDF ou DOCX · máx 40 MB</p>
            </div>
          </button>
        )}
      </div>
    </section>
  )
}

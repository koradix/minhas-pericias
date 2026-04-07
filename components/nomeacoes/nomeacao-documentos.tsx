'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadFile } from '@/lib/client/upload'
import {
  Paperclip,
  Upload,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

interface Props {
  nomeacaoId: string
  tribunal: string
  numeroProcesso: string
  nomeArquivo: string | null
  tamanhoBytes?: number | null
  periciaId?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type UploadFase = 'idle' | 'enviando' | 'analisando' | 'ok' | 'erro'
type Provider   = 'claude' | 'gemini'

export function NomeacaoDocumentosSection({
  tribunal,
  numeroProcesso,
  nomeArquivo: initial,
  tamanhoBytes: initialBytes,
  periciaId,
}: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [nomeArquivo, setNomeArquivo] = useState(initial)
  const [tamanho, setTamanho] = useState(initialBytes ?? null)
  const [fase, setFase] = useState<UploadFase>('idle')
  const [progresso, setProgresso] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // ── Seletor de provider (temporário — remover após testes) ───────────────
  const [provider, setProvider] = useState<Provider>('claude')

  const isPending = fase === 'enviando' || fase === 'analisando'

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setErrorMsg(null)
    setProgresso(0)

    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowed.includes(file.type)) {
      setErrorMsg('Apenas PDF ou DOCX são aceitos.')
      return
    }

    // ── 1. Upload chunked (mesmo domínio, sem CORS, sem limite de tamanho) ────
    setFase('enviando')
    let blobUrl: string
    try {
      blobUrl = await uploadFile(file, (pct) => setProgresso(pct))
    } catch (err) {
      setFase('erro')
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar arquivo.')
      return
    }

    // ── 2. Análise IA (servidor baixa do Blob, processa, deleta) ──────────────
    setFase('analisando')
    let res: Response
    try {
      res = await fetch('/api/nomeacoes/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blobUrl,
          fileName:  file.name,
          fileSize:  file.size,
          mimeType:  file.type,
          tribunal,
          numero:    numeroProcesso || null,
          provider,
          ...(periciaId ? { periciaId } : {}),
        }),
      })
    } catch {
      setFase('erro')
      setErrorMsg('Erro de conexão. Verifique sua internet e tente novamente.')
      return
    }

    const data = await res.json().catch(() => ({})) as { ok?: boolean; message?: string }
    if (res.ok && data.ok) {
      setNomeArquivo(file.name)
      setTamanho(file.size)
      setFase('ok')
      router.refresh()
    } else {
      setFase('erro')
      setErrorMsg(data.message ?? `Erro HTTP ${res.status}`)
    }
  }

  const faseLabel =
    fase === 'enviando'   ? `Enviando… ${progresso}%` :
    fase === 'analisando' ? 'Analisando com IA…'       :
    nomeArquivo ? 'Substituir' : 'Adicionar documento'

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
        <div className="flex items-center gap-2">
          {/* ── Provider toggle (temporário) ── */}
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-[11px] font-semibold">
            <button
              onClick={() => setProvider('claude')}
              className={`px-2.5 py-1.5 transition-colors ${
                provider === 'claude'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-slate-400 hover:text-slate-600'
              }`}
            >
              Claude
            </button>
            <button
              onClick={() => setProvider('gemini')}
              className={`px-2.5 py-1.5 transition-colors ${
                provider === 'gemini'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-slate-400 hover:text-slate-600'
              }`}
            >
              Gemini
            </button>
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
            {faseLabel}
          </button>
        </div>
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

        {/* Enviando: barra de progresso */}
        {fase === 'enviando' && (
          <div className="mb-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Enviando arquivo…</span>
              <span>{progresso}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-lime-500 transition-all duration-200"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        )}

        {/* Analisando */}
        {fase === 'analisando' && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-500 animate-pulse flex-shrink-0" />
            <p className="text-xs text-violet-700 font-medium">IA lendo o documento e extraindo dados…</p>
          </div>
        )}

        {nomeArquivo ? (
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${fase === 'ok' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${fase === 'ok' ? 'bg-emerald-100' : 'bg-white border border-slate-200'}`}>
              {fase === 'ok'
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                : <FileText className="h-4 w-4 text-slate-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${fase === 'ok' ? 'text-emerald-800' : 'text-slate-700'}`}>
                {nomeArquivo}
              </p>
              <p className={`text-xs ${fase === 'ok' ? 'text-emerald-600' : 'text-slate-400'}`}>
                {tamanho != null ? formatBytes(tamanho) : ''}
                {fase === 'ok' ? ' · Análise IA concluída' : ''}
              </p>
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
              <p className="text-xs text-slate-400 mt-0.5">PDF ou DOCX · sem limite de tamanho · análise IA automática</p>
            </div>
          </button>
        )}
      </div>
    </section>
  )
}

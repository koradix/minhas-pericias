'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadFile } from '@/lib/client/upload'
import { cn } from '@/lib/utils'

interface Props {
  nomeacaoId: string
  tribunal: string
  numeroProcesso: string
  nomeArquivo: string | null
  tamanhoBytes?: number | null
  periciaId?: string
  variant?: 'default' | 'minimal'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type UploadFase = 'idle' | 'enviando' | 'analisando' | 'ok' | 'erro'

export function NomeacaoDocumentosSection({
  tribunal,
  numeroProcesso,
  nomeArquivo: initial,
  tamanhoBytes: initialBytes,
  periciaId,
  variant = 'default',
}: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [nomeArquivo, setNomeArquivo] = useState(initial)
  const [tamanho, setTamanho] = useState(initialBytes ?? null)
  const [fase, setFase] = useState<UploadFase>('idle')
  const [progresso, setProgresso] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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

  if (variant === 'minimal') {
    return (
      <div className="flex flex-col gap-4">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleUpload}
        />
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Documentação do Processo</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
            className="text-[10px] font-black text-slate-900 bg-[#a3e635] px-4 py-2 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30"
          >
            {isPending ? faseLabel : '[ + ] Carregar Arquivo'}
          </button>
        </div>
        {errorMsg && (
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Erro: {errorMsg}</p>
        )}
        {fase === 'analisando' && (
          <p className="text-[9px] font-black text-[#a3e635] uppercase tracking-widest animate-pulse">Inteligência IA em execução...</p>
        )}
      </div>
    )
  }

  return (
    <section className="rounded-none border-t border-slate-100 bg-white pt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Registro de Documentos do Processo</h2>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="text-[10px] font-black text-slate-900 bg-[#a3e635] px-4 py-2 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30"
        >
          {faseLabel}
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
      <div className="space-y-4">
        {errorMsg && (
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 p-4 border border-rose-100">
            ERRO: {errorMsg}
          </p>
        )}

        {/* Enviando */}
        {fase === 'enviando' && (
          <div className="bg-slate-50 p-6 border border-slate-100 space-y-4">
            <div className="flex justify-between text-[10px] font-black text-slate-900 uppercase tracking-widest">
              <span>Carregando arquivo</span>
              <span>{progresso}%</span>
            </div>
            <div className="h-1 w-full bg-slate-200">
              <div
                className="h-full bg-slate-900 transition-all duration-200"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        )}

        {/* Analisando */}
        {fase === 'analisando' && (
          <div className="bg-slate-900 p-6 space-y-2">
             <p className="text-[10px] font-black text-[#a3e635] uppercase tracking-widest animate-pulse">Lendo Documento via Inteligência Artificial...</p>
          </div>
        )}

        {nomeArquivo ? (
          <div className={cn(
            "flex items-center justify-between px-6 py-5 border-2",
            fase === 'ok' ? 'border-[#a3e635] bg-white' : 'border-slate-100 bg-slate-50'
          )}>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight truncate">
                {nomeArquivo}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {tamanho != null ? formatBytes(tamanho) : ''}
                {fase === 'ok' ? ' · ANÁLISE CONCLUÍDA' : ''}
              </p>
            </div>
            {fase === 'ok' && (
               <span className="text-[10px] font-black text-[#a3e635] uppercase tracking-widest">VÁLIDO</span>
            )}
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
            className="w-full flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-900 p-12 transition-all disabled:opacity-30 group"
          >
            <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] group-hover:text-slate-900 transition-colors">
               Arraste ou clique para carregar a Nomeação
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              PDF / DOCX · Protocolo de Análise Automática
            </p>
          </button>
        )}
      </div>
    </section>
  )
}

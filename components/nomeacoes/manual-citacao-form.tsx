'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Upload, Loader2, AlertCircle, FileText, Sparkles,
  CheckCircle2, ChevronRight, Building2, Hash,
} from 'lucide-react'
import { registrarNomeacao } from '@/lib/actions/nomeacoes-upload'
import { criarCitacaoManual } from '@/lib/actions/nomeacoes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  siglas: string[]
  onClose: () => void
}

interface Preview {
  numeroProcesso: string
  tribunal: string | null
  assunto: string | null
  vara: string | null
  autor: string | null
  reu: string | null
  complexidade: string | null
  pontoControvertido: string | null
}

type Phase = 'idle' | 'analyzing' | 'results'

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 leading-snug">{value}</p>
    </div>
  )
}

export function ManualCitacaoForm({ siglas, onClose }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase]       = useState<Phase>('idle')
  const [error, setError]       = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState(0)
  const [preview, setPreview]   = useState<Preview | null>(null)
  const [nomeacaoId, setNomeacaoId] = useState<string | null>(null)
  const [sigla, setSigla]   = useState(siglas[0] ?? 'TJRJ')
  const [numero, setNumero] = useState('')
  const [snippet, setSnippet] = useState('')
  const [mode, setMode] = useState<'upload' | 'manual'>('upload')

  const isPending = phase === 'analyzing'

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) { setFileName(f.name); setFileSize(f.size) }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPhase('analyzing')

    try {
      if (mode === 'upload') {
        const file = fileRef.current?.files?.[0]
        if (!file) { setError('Selecione um documento PDF ou DOCX'); setPhase('idle'); return }

        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowed.includes(file.type)) { setError('Apenas PDF ou DOCX são aceitos'); setPhase('idle'); return }

        const formData = new FormData()
        formData.append('arquivo', file)
        formData.append('tribunal', sigla)
        if (numero.trim()) formData.append('numeroProcesso', numero.trim())

        const result = await registrarNomeacao(formData)
        if (result.ok && result.nomeacaoId) {
          setNomeacaoId(result.nomeacaoId)
          setPreview(result.preview ?? null)
          setPhase('results')
        } else {
          setError(result.message ?? 'Erro ao registrar nomeação')
          setPhase('idle')
        }
      } else {
        if (!snippet.trim()) { setError('Insira o texto ou trecho do processo'); setPhase('idle'); return }

        const result = await criarCitacaoManual({
          diarioSigla: sigla,
          diarioData: new Date().toISOString().split('T')[0],
          snippetTexto: snippet.trim(),
          numeroProcesso: numero.trim() || undefined,
        })

        if (result.ok) {
          setPhase('results')
          setTimeout(() => {
            onClose()
            router.refresh()
          }, 1500)
        } else {
          setError(result.error ?? 'Erro ao criar citação manual')
          setPhase('idle')
        }
      }
    } catch (err) {
      console.error('[submit] ❌ Erro:', err)
      setError('Erro de conexão. Tente novamente.')
      setPhase('idle')
    }
  }

  function handleConfirm() {
    if (nomeacaoId) router.push(`/nomeacoes/${nomeacaoId}`)
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={isPending ? undefined : onClose}
        aria-hidden
      />

      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", phase === 'results' ? 'bg-lime-50' : 'bg-violet-50')}>
              {phase === 'results'
                ? <CheckCircle2 className="h-3.5 w-3.5 text-lime-600" />
                : <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              }
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {phase === 'results' ? 'Processo registrado' : 'Registrar nomeação'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {phase === 'results' && mode === 'upload' && preview ? (
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-lime-50 border border-lime-200 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-lime-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-lime-800">Processo registrado</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-3">
              <div className="flex items-start gap-3">
                <Hash className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-mono text-slate-700 truncate">{preview.numeroProcesso}</p>
                  {preview.tribunal && (
                    <span className="inline-flex items-center gap-1 mt-1 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      <Building2 className="h-2.5 w-2.5" />
                      {preview.tribunal}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-px bg-slate-200" />
              <Row label="Tipo de ação" value={preview.assunto} />
              <Row label="Autor" value={preview.autor} />
              <Row label="Réu" value={preview.reu} />
              <Row label="Vara / Órgão" value={preview.vara} />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
              <Button
                type="button"
                size="sm"
                className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1.5"
                onClick={handleConfirm}
              >
                Ver processo completo
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : phase === 'results' && mode === 'manual' ? (
          <div className="px-5 py-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-50 border border-lime-200">
              <CheckCircle2 className="h-6 w-6 text-lime-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Citação manual registrada!</p>
              <p className="text-xs text-slate-500 mt-1">
                Ela aparecerá na sua lista de nomeações em instantes.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('upload')}
                disabled={isPending}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  mode === 'upload' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Upload de arquivo
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                disabled={isPending}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  mode === 'manual' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Entrada manual
              </button>
            </div>

            {mode === 'upload' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Documento da nomeação</label>
                  <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                  <button
                    type="button"
                    onClick={() => !isPending && fileRef.current?.click()}
                    disabled={isPending}
                    className={cn(
                      "w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 transition-colors disabled:pointer-events-none",
                      fileName ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                    )}
                  >
                    {fileName ? (
                      <>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
                          <FileText className="h-5 w-5 text-violet-600" />
                        </div>
                        <p className="text-sm font-semibold text-violet-800 max-w-xs truncate">{fileName}</p>
                        <p className="text-xs text-violet-400">{formatBytes(fileSize)}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200">
                          <Upload className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-600">Enviar nomeação ou despacho</p>
                          <p className="text-xs text-slate-400 mt-0.5">PDF ou DOCX · máx 50 MB</p>
                        </div>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Descrição / Trecho do Diário</label>
                  <textarea
                    rows={4}
                    value={snippet}
                    onChange={(e) => setSnippet(e.target.value)}
                    disabled={isPending}
                    placeholder="Cole aqui o trecho do Diário Oficial que cita seu nome ou descreva a nomeação..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 disabled:opacity-60 resize-none"
                  />
                  <p className="text-[10px] text-slate-400">Isso criará uma citação no Radar para importação posterior.</p>
                </div>
              </div>
            )}

            {isPending && (
              <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="h-4 w-4 text-violet-500 animate-spin flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-violet-800">{mode === 'upload' ? 'IA analisando o processo…' : 'Registrando no Radar…'}</p>
                  </div>
                </div>
                <div className="w-full h-1 bg-violet-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-400 rounded-full transition-all duration-1000 w-2/3 animate-pulse" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pb-2 border-t border-slate-50 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tribunal</label>
                <select
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  disabled={isPending}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800 focus:border-violet-400 disabled:opacity-60"
                >
                  {siglas.map((s) => <option key={s} value={s}>{s}</option>)}
                  {siglas.length === 0 && <option value="TJRJ">TJRJ</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Processo (opcional)</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  disabled={isPending}
                  placeholder="Nº CNJ"
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 disabled:opacity-60"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending}>Cancelar</Button>
              <Button type="submit" size="sm" className="bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-1.5" disabled={isPending}>
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {mode === 'upload' ? 'Analisar arquivo' : 'Registrar no Radar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}

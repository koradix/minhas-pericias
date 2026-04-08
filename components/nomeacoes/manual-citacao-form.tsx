
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
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="text-[13px] font-bold text-slate-900 leading-tight">{value}</p>
    </div>
  )
}

export function ManualCitacaoForm({ siglas, onClose }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState(0)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [nomeacaoId, setNomeacaoId] = useState<string | null>(null)
  const [sigla, setSigla] = useState(siglas[0] ?? 'TJRJ')
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

      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-none bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b-2 border-slate-900 px-6 py-5">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">
              {phase === 'results' ? 'Processo Registrado' : 'Registrar Nomeação'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1 text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {phase === 'results' && mode === 'upload' && preview ? (
          <div className="px-6 py-6 space-y-6">
            <div className="flex items-center gap-4 border-2 border-[#a3e635] bg-lime-50/20 px-5 py-4">
              <CheckCircle2 className="h-5 w-5 text-slate-900" />
              <p className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Processo Registrado com Sucesso</p>
            </div>

            <div className="border border-slate-100 bg-slate-50 p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center bg-slate-900 flex-shrink-0">
                  <Hash className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-900 tracking-tight">{preview.numeroProcesso}</p>
                  {preview.tribunal && (
                    <span className="inline-flex items-center mt-2 px-2 py-0.5 bg-[#a3e635] text-[10px] font-black text-slate-900 uppercase tracking-widest">
                      {preview.tribunal}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="grid grid-cols-1 gap-4">
                <Row label="Tipo de ação" value={preview.assunto} />
                <Row label="Autor" value={preview.autor} />
                <Row label="Réu" value={preview.reu} />
                <Row label="Vara / Órgão" value={preview.vara} />
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
              >
                Fechar
              </button>
              <button
                type="button"
                className="bg-slate-900 text-white px-8 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-[#a3e635] hover:text-slate-900 transition-all flex items-center gap-3"
                onClick={handleConfirm}
              >
                Ver Processo Completo
                <ChevronRight className="h-4 w-4" />
              </button>
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
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            <div className="flex bg-slate-50 border border-slate-200 p-1">
              <button
                type="button"
                onClick={() => setMode('upload')}
                disabled={isPending}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  mode === 'upload' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
                )}
              >
                Upload de arquivo
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                disabled={isPending}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  mode === 'manual' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
                )}
              >
                Entrada manual
              </button>
            </div>

            {mode === 'upload' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Documento da nomeação</label>
                  <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                  <button
                    type="button"
                    onClick={() => !isPending && fileRef.current?.click()}
                    disabled={isPending}
                    className={cn(
                      "w-full flex flex-col items-center justify-center gap-3 rounded-none border-2 border-dashed px-4 py-10 transition-all disabled:pointer-events-none",
                      fileName ? 'border-[#a3e635] bg-lime-50/30' : 'border-slate-200 bg-slate-50 hover:border-slate-900'
                    )}
                  >
                    {fileName ? (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center bg-slate-900">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest max-w-xs truncate">{fileName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{formatBytes(fileSize)}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center bg-white border border-slate-200">
                          <Upload className="h-5 w-5 text-slate-300" />
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Enviar nomeação ou despacho</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">PDF ou DOCX · máx 50 MB</p>
                        </div>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição / Trecho do Diário</label>
                  <textarea
                    rows={6}
                    value={snippet}
                    onChange={(e) => setSnippet(e.target.value)}
                    disabled={isPending}
                    placeholder="Cole aqui o trecho do Diário Oficial que cita seu nome ou descreva a nomeação..."
                    className="w-full rounded-none border border-slate-200 bg-white px-4 py-4 text-[13px] font-medium text-slate-900 focus:border-slate-900 focus:ring-0 disabled:opacity-60 resize-none placeholder:text-slate-200"
                  />
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Isso criará uma citação no Radar para importação posterior.</p>
                </div>
              </div>
            )}

            {isPending && (
              <div className="border border-slate-900 bg-slate-50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 text-slate-900 animate-spin flex-shrink-0" />
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                    {mode === 'upload' ? 'IA analisando o processo…' : 'Registrando no Radar…'}
                  </p>
                </div>
                <div className="w-full h-1 bg-slate-200">
                  <div className="h-full bg-[#a3e635] transition-all duration-1000 w-2/3 animate-pulse" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pb-4 border-t border-slate-100 pt-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tribunal</label>
                <select
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  disabled={isPending}
                  className="w-full h-12 rounded-none border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-900 focus:border-slate-900 focus:ring-0 disabled:opacity-60 appearance-none"
                >
                  {siglas.map((s) => <option key={s} value={s}>{s}</option>)}
                  {siglas.length === 0 && <option value="TJRJ">TJRJ</option>}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Processo (opcional)</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  disabled={isPending}
                  placeholder="Nº CNJ"
                  className="w-full h-12 rounded-none border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-900 focus:border-slate-900 focus:ring-0 disabled:opacity-60 placeholder:text-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all disabled:opacity-30"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="bg-[#a3e635] hover:bg-slate-900 hover:text-white text-slate-900 px-8 py-3 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-30 flex items-center gap-3"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 bg-slate-900 rounded-none group-hover:bg-white" />
                )}
                {mode === 'upload' ? 'Analisar arquivo' : 'Registrar no Radar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}

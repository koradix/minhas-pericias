'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  addCheckpointMidia,
  deleteCheckpointMidia,
  getCheckpointMidias,
  updateCheckpointStatus,
  updateMidiaTexto,
} from '@/lib/actions/checkpoint-media'
import { getVaraContato, upsertVaraContato, type VaraContatoData } from '@/lib/actions/vara-contato'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MidiaItem {
  id: string
  tipo: string
  url: string | null
  texto: string | null
  descricao: string | null
  criadoEm: string
}

interface Props {
  checkpointId: string
  checkpointTitulo: string
  endereco?: string
  tipo?: 'FORUM' | 'VARA_CIVEL' | 'ESCRITORIO' | 'PERICIA'
  tribunalSigla?: string
  varaNome?: string
  onClose: () => void
  onConcluido: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CheckpointMediaPanel({
  checkpointId,
  checkpointTitulo,
  endereco,
  tipo,
  tribunalSigla,
  varaNome,
  onClose,
  onConcluido,
}: Props) {
  const isVara = tipo === 'FORUM' || tipo === 'VARA_CIVEL'

  const [midias, setMidias] = useState<MidiaItem[]>([])
  const [loadingMidias, setLoadingMidias] = useState(true)

  // active input mode: null | 'nota' | 'audio' | 'camera' | 'contato'
  const [modo, setModo] = useState<null | 'nota' | 'audio' | 'camera' | 'contato'>(null)

  // Contato state
  const [contato, setContato] = useState<VaraContatoData>({})
  const [loadingContato, setLoadingContato] = useState(false)
  const [savedContato, setSavedContato] = useState(false)
  const [nota, setNota] = useState('')
  const [gravando, setGravando] = useState(false)
  const [audioPreview, setAudioPreview] = useState<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [audioTimer, setAudioTimer] = useState(0)
  const [transcrevendo, setTranscrevendo] = useState<Record<string, boolean>>({})
  const audioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const MAX_AUDIO_SECONDS = 60
  const MAX_AUDIOS = 3
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  const fotoInputRef = useRef<HTMLInputElement>(null)
  const arquivoInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [isPending, startTransition] = useTransition()
  const [finalizando, setFinalizando] = useState(false)

  const [pendingFoto, setPendingFoto] = useState<{ base64: string; tipo: 'foto'; nomeArquivo?: string } | null>(null)
  const [pendingCaption, setPendingCaption] = useState('')

  // ── Checklist (localStorage, persisted per checkpoint) ────────────────────
  type ChecklistItem = { id: string; texto: string; feito: boolean }
  const storageKey = `checklist-${checkpointId}`
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]') } catch { return [] }
  })
  const [novoItem, setNovoItem] = useState('')
  const [showChecklist, setShowChecklist] = useState(true)

  function salvarChecklist(items: ChecklistItem[]) {
    setChecklist(items)
    try { localStorage.setItem(storageKey, JSON.stringify(items)) } catch {}
  }

  function adicionarItem() {
    const texto = novoItem.trim()
    if (!texto) return
    salvarChecklist([...checklist, { id: crypto.randomUUID(), texto, feito: false }])
    setNovoItem('')
  }

  function toggleItem(id: string) {
    salvarChecklist(checklist.map((i) => i.id === id ? { ...i, feito: !i.feito } : i))
  }

  function removerItem(id: string) {
    salvarChecklist(checklist.filter((i) => i.id !== id))
  }

  useEffect(() => {
    getCheckpointMidias(checkpointId)
      .then((rows) => setMidias(rows))
      .finally(() => setLoadingMidias(false))
  }, [checkpointId])

  useEffect(() => {
    if (modo === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [modo])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (!isVara || !tribunalSigla || !varaNome) return
    getVaraContato(tribunalSigla, varaNome)
      .then((row) => {
        if (row) setContato({
          telefone: row.telefone,
          email: row.email,
          juizNome: row.juizNome,
          secretarioNome: row.secretarioNome,
          secretarioLinkedin: row.secretarioLinkedin,
          observacoes: row.observacoes,
        })
      })
      .catch(() => {})
  }, [isVara])

  async function handleAbrirCamera(facing: 'environment' | 'user' = facingMode) {
    setCameraError(null)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
      })
      streamRef.current = stream
      setFacingMode(facing)
      setModo('camera')
    } catch {
      fotoInputRef.current?.click()
    }
  }

  function handleFecharCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setModo(null)
  }

  function handleVirarCamera() {
    const novoFacing = facingMode === 'environment' ? 'user' : 'environment'
    handleAbrirCamera(novoFacing)
  }

  async function handleCapturar() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.85)

    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setModo(null)
    setPendingFoto({ base64, tipo: 'foto' })
    setPendingCaption('')
  }

  function handleSalvarPendingFoto() {
    if (!pendingFoto) return
    const caption = pendingCaption.trim()
    startTransition(async () => {
      try {
        const { id, criadoEm } = await addCheckpointMidia(checkpointId, 'foto', {
          url: pendingFoto.base64,
          descricao: caption || pendingFoto.nomeArquivo || undefined,
        })
        setMidias((prev) => [
          ...prev,
          { id, tipo: 'foto', url: pendingFoto.base64, texto: null, descricao: caption || pendingFoto.nomeArquivo || null, criadoEm },
        ])
        setPendingFoto(null)
        setPendingCaption('')
      } catch { /* swallow */ }
    })
  }

  function handleDescartarPendingFoto() {
    setPendingFoto(null)
    setPendingCaption('')
  }

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''
    if (files.length === 1) {
      const base64 = await fileToBase64(files[0])
      setPendingFoto({ base64, tipo: 'foto', nomeArquivo: files[0].name })
      setPendingCaption('')
      return
    }
    for (const file of files) {
      const base64 = await fileToBase64(file)
      startTransition(async () => {
        try {
          const { id, criadoEm } = await addCheckpointMidia(checkpointId, 'foto', { url: base64, descricao: file.name })
          setMidias((prev) => [...prev, { id, tipo: 'foto', url: base64, texto: null, descricao: file.name, criadoEm }])
        } catch { /* swallow */ }
      })
    }
  }

  async function handleArquivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''
    for (const file of files) {
      const isImagem = file.type.startsWith('image/')
      const tipo: 'foto' | 'documento' = isImagem ? 'foto' : 'documento'
      const base64 = await fileToBase64(file)
      startTransition(async () => {
        try {
          const { id, criadoEm } = await addCheckpointMidia(checkpointId, tipo, {
            url: base64,
            descricao: file.name,
          })
          setMidias((prev) => [...prev, { id, tipo, url: base64, texto: null, descricao: file.name, criadoEm }])
        } catch { /* swallow */ }
      })
    }
  }

  const audioCount = midias.filter((m) => m.tipo === 'audio').length
  const audioLimitReached = audioCount >= MAX_AUDIOS

  function clearAudioTimer() {
    if (audioTimerRef.current) { clearInterval(audioTimerRef.current); audioTimerRef.current = null }
    setAudioTimer(0)
  }

  async function handleIniciarGravacao() {
    if (audioLimitReached) return
    setAudioError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        clearAudioTimer()
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const base64 = await blobToBase64(blob)
        setAudioPreview(base64)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setGravando(true)

      // Timer with auto-stop at MAX_AUDIO_SECONDS
      setAudioTimer(0)
      audioTimerRef.current = setInterval(() => {
        setAudioTimer((prev) => {
          const next = prev + 1
          if (next >= MAX_AUDIO_SECONDS) {
            recorder.stop()
            mediaRecorderRef.current = null
            setGravando(false)
          }
          return next
        })
      }, 1000)
    } catch {
      setAudioError('Erro: Permissão de microfone negada.')
    }
  }

  function handlePararGravacao() {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setGravando(false)
    clearAudioTimer()
  }

  async function transcreverAudio(midiaId: string, audioBase64: string) {
    setTranscrevendo((prev) => ({ ...prev, [midiaId]: true }))
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ midiaId, audioBase64 }),
      })
      const json = await res.json()
      if (json.ok && json.textoPericial) {
        await updateMidiaTexto(midiaId, json.textoPericial)
        setMidias((prev) =>
          prev.map((m) => m.id === midiaId ? { ...m, texto: json.textoPericial } : m)
        )
      }
    } catch { /* swallow */ }
    setTranscrevendo((prev) => ({ ...prev, [midiaId]: false }))
  }

  function handleSalvarAudio() {
    if (!audioPreview) return
    const savedBase64 = audioPreview
    startTransition(async () => {
      try {
        const { id, criadoEm } = await addCheckpointMidia(checkpointId, 'audio', {
          url: savedBase64,
        })
        setMidias((prev) => [
          ...prev,
          { id, tipo: 'audio', url: savedBase64, texto: null, descricao: null, criadoEm },
        ])
        setAudioPreview(null)
        setModo(null)
        // Auto-transcribe in background
        transcreverAudio(id, savedBase64)
      } catch { /* swallow */ }
    })
  }

  function handleDescartarAudio() {
    setAudioPreview(null)
    setModo(null)
  }

  function handleSalvarNota() {
    const texto = nota.trim()
    if (!texto) return
    startTransition(async () => {
      try {
        const { id, criadoEm } = await addCheckpointMidia(checkpointId, 'texto', { texto })
        setMidias((prev) => [
          ...prev,
          { id, tipo: 'texto', url: null, texto, descricao: null, criadoEm },
        ])
        setNota('')
        setModo(null)
      } catch { /* swallow */ }
    })
  }

  function handleDelete(midiaId: string) {
    startTransition(async () => {
      try {
        await deleteCheckpointMidia(midiaId)
        setMidias((prev) => prev.filter((m) => m.id !== midiaId))
      } catch { /* swallow */ }
    })
  }

  async function handleSalvarContato() {
    if (!tribunalSigla || !varaNome) return
    setLoadingContato(true)
    try {
      await upsertVaraContato(tribunalSigla, varaNome, contato)
      setSavedContato(true)
      setTimeout(() => setSavedContato(false), 2500)
    } catch { /* swallow */ }
    setLoadingContato(false)
  }

  async function handleFinalizar() {
    setFinalizando(true)
    try {
      await updateCheckpointStatus(checkpointId, 'concluido')
    } catch { /* swallow */ }
    setFinalizando(false)
    onConcluido()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div className="fixed inset-y-0 right-0 z-[1001] flex w-full max-w-md flex-col bg-white shadow-2xl sm:border-l sm:border-slate-100">

        {/* Header */}
        <div className="flex items-start gap-4 border-b border-slate-100 bg-white px-8 py-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight uppercase">{checkpointTitulo}</h2>
            {endereco && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 truncate">{endereco}</p>
            )}
            <div className="mt-4">
              <span className="inline-block bg-[#a3e635] text-slate-900 text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-1 select-none">
                VOCÊ CHEGOU
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors pt-1.5"
          >
            FECHAR
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Action grid */}
          <div className="grid grid-cols-2 gap-px bg-slate-100 border border-slate-100">
            <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleFotoChange} />
            <input ref={arquivoInputRef} type="file" accept="image/*,application/pdf,.docx,.doc,.xlsx,.xls" multiple className="hidden" onChange={handleArquivoChange} />

            <button
              onClick={() => handleAbrirCamera()}
              disabled={isPending}
              className={cn(
                "flex h-24 flex-col items-center justify-center bg-white transition-all disabled:opacity-50",
                modo === 'camera' ? "bg-slate-50 ring-1 ring-inset ring-slate-200" : "hover:bg-slate-50"
              )}
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Câmera</span>
              {modo === 'camera' && <span className="h-0.5 w-4 bg-[#a3e635] mt-2 animate-pulse" />}
            </button>

            <button
              onClick={() => { handleFecharCamera(); setModo(modo === 'audio' ? null : 'audio') }}
              disabled={audioLimitReached && modo !== 'audio'}
              className={cn(
                "flex h-24 flex-col items-center justify-center bg-white transition-all",
                audioLimitReached && modo !== 'audio' ? "opacity-40 cursor-not-allowed" : "",
                modo === 'audio' ? "bg-slate-50 ring-1 ring-inset ring-slate-200" : "hover:bg-slate-50"
              )}
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Áudio</span>
              {audioLimitReached && modo !== 'audio' && (
                <span className="text-[8px] font-bold text-slate-400 mt-1">{MAX_AUDIOS}/{MAX_AUDIOS}</span>
              )}
              {modo === 'audio' && <span className="h-0.5 w-4 bg-[#a3e635] mt-2 animate-pulse" />}
            </button>

            <button
              onClick={() => { handleFecharCamera(); setModo(modo === 'nota' ? null : 'nota') }}
              className={cn(
                "flex h-24 flex-col items-center justify-center bg-white transition-all",
                modo === 'nota' ? "bg-slate-50 ring-1 ring-inset ring-slate-200" : "hover:bg-slate-50"
              )}
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Nota</span>
              {modo === 'nota' && <span className="h-0.5 w-4 bg-[#a3e635] mt-2" />}
            </button>

            <button
              onClick={() => { handleFecharCamera(); setModo(null); arquivoInputRef.current?.click() }}
              disabled={isPending}
              className="flex h-24 flex-col items-center justify-center bg-white hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Arquivo</span>
            </button>

            {isVara && (
              <button
                onClick={() => { handleFecharCamera(); setModo(modo === 'contato' ? null : 'contato') }}
                className={cn(
                  "col-span-2 flex h-14 items-center justify-center bg-white border-t border-slate-100 transition-all",
                  modo === 'contato' ? "bg-slate-50" : "hover:bg-slate-50"
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Contatos da Vara</span>
              </button>
            )}
          </div>

          {/* Pending photo */}
          {pendingFoto && (
            <div className="border border-slate-100 pt-0 overflow-hidden">
              <div className="bg-slate-900 aspect-video flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingFoto.base64} alt="preview" className="w-full h-full object-cover" />
              </div>
              <div className="p-6 space-y-4">
                <input
                  type="text"
                  value={pendingCaption}
                  onChange={(e) => setPendingCaption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSalvarPendingFoto() }}
                  placeholder="LEGENDA DA FOTO..."
                  autoFocus
                  className="w-full text-[11px] font-bold uppercase tracking-widest text-slate-900 placeholder:text-slate-300 bg-transparent border-0 border-b border-slate-100 py-2 focus:border-slate-900 focus:ring-0 transition-all"
                />
                <div className="flex gap-4">
                  <button onClick={handleDescartarPendingFoto} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">DESCARTAR</button>
                  <button onClick={handleSalvarPendingFoto} disabled={isPending} className="flex-1 h-10 bg-[#a3e635] text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:brightness-105 transition-all">SALVAR FOTO</button>
                </div>
              </div>
            </div>
          )}

          {/* Camera Viewfinder */}
          {modo === 'camera' && (
            <div className="border border-slate-100 overflow-hidden">
              <div className="relative aspect-square bg-black overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={handleVirarCamera}
                  className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-2 transition-all"
                >
                  VIRAR
                </button>
              </div>
              <div className="p-6 flex gap-4">
                <button onClick={handleFecharCamera} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">FECHAR</button>
                <button onClick={handleCapturar} disabled={isPending} className="flex-1 h-12 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-all">
                  CAPTURAR
                </button>
              </div>
            </div>
          )}

          {/* Nota Input */}
          {modo === 'nota' && (
            <div className="border border-slate-100 p-6 space-y-4">
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="NOTAS DE OBSERVAÇÃO..."
                rows={4}
                className="w-full text-xs font-medium text-slate-700 bg-slate-50 border-0 p-4 focus:ring-0 placeholder:text-slate-300"
              />
              <div className="flex gap-4 items-center">
                <button onClick={() => { setNota(''); setModo(null) }} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">CANCELAR</button>
                <button onClick={handleSalvarNota} disabled={!nota.trim() || isPending} className="flex-1 h-10 bg-[#a3e635] text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:brightness-105 transition-all">SALVAR NOTA</button>
              </div>
            </div>
          )}

          {/* Audio controls */}
          {modo === 'audio' && (
            <div className="border border-slate-100 p-6 space-y-6">
              {audioLimitReached ? (
                <div className="py-6 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">LIMITE DE {MAX_AUDIOS} ÁUDIOS ATINGIDO</p>
                  <p className="text-[10px] text-slate-300 mt-2">Exclua um áudio existente para gravar outro.</p>
                </div>
              ) : !audioPreview ? (
                <div className="flex flex-col items-center gap-6 py-4">
                  {/* Timer bar */}
                  <div className="w-full max-w-[200px]">
                    <div className="h-1 w-full bg-slate-100 relative overflow-hidden">
                      <div
                        className={cn("h-full transition-all", gravando ? "bg-red-500" : "bg-slate-200")}
                        style={{ width: `${(audioTimer / MAX_AUDIO_SECONDS) * 100}%` }}
                      />
                    </div>
                    {gravando && (
                      <p className="text-[10px] font-mono text-center text-red-400 mt-2">
                        {String(Math.floor(audioTimer / 60)).padStart(1, '0')}:{String(audioTimer % 60).padStart(2, '0')} / 1:00
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                    {gravando ? 'GRAVANDO ÁUDIO...' : `PRONTO PARA GRAVAR (${audioCount}/${MAX_AUDIOS})`}
                  </p>
                  <button
                    onClick={gravando ? handlePararGravacao : handleIniciarGravacao}
                    className={cn(
                      "h-16 w-16 border-2 transition-all flex items-center justify-center text-[10px] font-bold tracking-tighter",
                      gravando ? "border-red-500 text-red-500 animate-pulse" : "border-slate-900 text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {gravando ? 'STOP' : 'REC'}
                  </button>
                  {audioError && <p className="text-[10px] text-red-500">{audioError}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <audio src={audioPreview} controls className="w-full h-8" />
                  <div className="flex gap-4 items-center">
                    <button onClick={handleDescartarAudio} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">DESCARTAR</button>
                    <button onClick={handleSalvarAudio} disabled={isPending} className="flex-1 h-10 bg-[#a3e635] text-slate-900 text-[10px] font-bold uppercase tracking-widest">SALVAR ÁUDIO</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Media list */}
          <div className="pt-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-4">
              EVIDÊNCIAS COLETADAS
              <span className="h-px flex-1 bg-slate-100" />
            </h3>
            
            {midias.length === 0 && !loadingMidias && (
              <div className="py-12 text-center border border-dashed border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">NENHUMA MÍDIA COLETADA</p>
              </div>
            )}

            <div className="space-y-3">
              {midias.map((m) => (
                <div key={m.id} className="group border border-slate-100 p-4 transition-all hover:border-slate-200">
                  <div className="flex gap-4">
                    {m.tipo === 'foto' && m.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="" className="h-16 w-16 grayscale hover:grayscale-0 transition-all object-cover" />
                    ) : (
                      <div className="h-16 w-16 bg-slate-50 flex items-center justify-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{m.tipo}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 py-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">{m.tipo}</p>
                      <p className="text-xs font-bold text-slate-900 mt-1 truncate">{m.descricao || m.texto || 'SEM DESCRIÇÃO'}</p>
                      <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase">
                        {new Date(m.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-red-300 hover:text-red-500 transition-all"
                    >
                      EXCLUIR
                    </button>
                  </div>
                  {/* Audio transcription status */}
                  {m.tipo === 'audio' && (
                    <div className="mt-3 pl-20">
                      {transcrevendo[m.id] ? (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 animate-pulse">
                          TRANSCREVENDO...
                        </p>
                      ) : m.texto ? (
                        <div className="bg-slate-50 p-3">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">TRANSCRIÇÃO PERICIAL</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{m.texto}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => m.url && transcreverAudio(m.id, m.url)}
                          className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          TRANSCREVER ÁUDIO
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="border border-slate-100">
            <button
              onClick={() => setShowChecklist((v) => !v)}
              className="flex w-full items-center justify-between px-6 py-5 hover:bg-slate-50 transition-all"
            >
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">CHECKLIST DA VISTORIA</h3>
              <span className="text-[10px] font-bold text-slate-300">{showChecklist ? 'FECHAR' : 'ABRIR'}</span>
            </button>

            {showChecklist && (
              <div className="p-6 pt-0 space-y-4">
                <div className="space-y-1">
                  {checklist.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className="flex w-full items-center gap-4 py-2 text-left group"
                    >
                      <div className={cn("h-4 w-4 border transition-all", item.feito ? "bg-slate-900 border-slate-900" : "border-slate-200 group-hover:border-slate-900")} />
                      <span className={cn("text-xs font-medium transition-all", item.feito ? "text-slate-300 line-through" : "text-slate-700")}>{item.texto}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-4">
                  <input
                    type="text"
                    value={novoItem}
                    onChange={(e) => setNovoItem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') adicionarItem() }}
                    placeholder="ADICIONAR ITEM..."
                    className="flex-1 bg-slate-50 border-0 text-[11px] font-bold tracking-widest h-10 px-4 focus:ring-0"
                  />
                  <button onClick={adicionarItem} disabled={!novoItem.trim()} className="h-10 px-4 bg-slate-900 text-white text-[10px] font-bold tracking-widest disabled:opacity-20 transition-all">OK</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100">
          <button
            onClick={handleFinalizar}
            disabled={finalizando || isPending}
            className="w-full h-16 bg-[#a3e635] hover:brightness-105 transition-all text-slate-900 text-[11px] font-bold uppercase tracking-[0.3em] disabled:opacity-50"
          >
            {finalizando ? 'FINALIZANDO...' : 'FINALIZAR CHECKPOINT'}
          </button>
          <p className="mt-4 text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest">
            SALVA EVIDÊNCIAS E FINALIZA O PONTO
          </p>
        </div>
      </div>
    </>
  )
}

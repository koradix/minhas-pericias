'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import {
  X,
  Camera,
  Mic,
  MicOff,
  Type,
  Trash2,
  CheckCircle2,
  Square,
  ImageIcon,
  Volume2,
  FileText,
  MapPin,
  Loader2,
  SwitchCamera,
  ZapOff,
  Users,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import {
  addCheckpointMidia,
  deleteCheckpointMidia,
  getCheckpointMidias,
  updateCheckpointStatus,
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

const tipoBadgeClass: Record<string, string> = {
  foto: 'bg-blue-50 text-blue-700',
  audio: 'bg-violet-50 text-violet-700',
  texto: 'bg-slate-100 text-slate-700',
  documento: 'bg-amber-50 text-amber-700',
}

const tipoLabel: Record<string, string> = {
  foto: 'Foto',
  audio: 'Áudio',
  texto: 'Nota',
  documento: 'Documento',
}

const tipoIcon: Record<string, typeof ImageIcon> = {
  foto: ImageIcon,
  audio: Volume2,
  texto: FileText,
  documento: FileText,
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
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  const fotoInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [isPending, startTransition] = useTransition()
  const [finalizando, setFinalizando] = useState(false)

  // ── Load existing midias on mount ──────────────────────────────────────────
  useEffect(() => {
    getCheckpointMidias(checkpointId)
      .then((rows) => setMidias(rows))
      .finally(() => setLoadingMidias(false))
  }, [checkpointId])

  // ── Camera — attach stream to video element after modo='camera' renders ───
  useEffect(() => {
    if (modo === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [modo])

  // ── Cleanup stream on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // ── Load existing vara contact on mount (FORUM/VARA only) ──────────────────
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
      .catch(() => {/* VaraContato table may not exist yet — ignore */})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVara])

  async function handleAbrirCamera(facing: 'environment' | 'user' = facingMode) {
    setCameraError(null)
    // Stop any existing stream before opening new one
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
      // Fallback to file input when camera not available / permission denied
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

    startTransition(async () => {
      try {
        const { id, criadoEm } = await addCheckpointMidia(checkpointId, 'foto', { url: base64 })
        setMidias((prev) => [
          ...prev,
          { id, tipo: 'foto', url: base64, texto: null, descricao: null, criadoEm },
        ])
      } catch { /* swallow — DB error shouldn't crash the capture flow */ }
    })
  }

  // ── Foto ───────────────────────────────────────────────────────────────────
  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    // Reset input so same file can be re-selected
    e.target.value = ''

    for (const file of files) {
      const base64 = await fileToBase64(file)
      startTransition(async () => {
        try {
          const { id, criadoEm } = await addCheckpointMidia(checkpointId, 'foto', { url: base64 })
          setMidias((prev) => [
            ...prev,
            { id, tipo: 'foto', url: base64, texto: null, descricao: null, criadoEm },
          ])
        } catch { /* swallow */ }
      })
    }
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  async function handleIniciarGravacao() {
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
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const base64 = await blobToBase64(blob)
        setAudioPreview(base64)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setGravando(true)
    } catch {
      setAudioError('Permissão de microfone negada ou indisponível.')
    }
  }

  function handlePararGravacao() {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setGravando(false)
  }

  function handleSalvarAudio() {
    if (!audioPreview) return
    startTransition(async () => {
      try {
        const { id, criadoEm } = await addCheckpointMidia(checkpointId, 'audio', {
          url: audioPreview,
        })
        setMidias((prev) => [
          ...prev,
          { id, tipo: 'audio', url: audioPreview, texto: null, descricao: null, criadoEm },
        ])
        setAudioPreview(null)
        setModo(null)
      } catch { /* swallow */ }
    })
  }

  function handleDescartarAudio() {
    setAudioPreview(null)
    setModo(null)
  }

  // ── Nota ─────────────────────────────────────────────────────────────────
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

  // ── Delete ────────────────────────────────────────────────────────────────
  function handleDelete(midiaId: string) {
    startTransition(async () => {
      try {
        await deleteCheckpointMidia(midiaId)
        setMidias((prev) => prev.filter((m) => m.id !== midiaId))
      } catch { /* swallow */ }
    })
  }

  // ── Contato ───────────────────────────────────────────────────────────────
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

  // ── Finalizar ─────────────────────────────────────────────────────────────
  async function handleFinalizar() {
    setFinalizando(true)
    try {
      await updateCheckpointStatus(checkpointId, 'concluido')
    } catch { /* swallow — status update failure shouldn't block navigation */ }
    setFinalizando(false)
    onConcluido()
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop — z-[1000] stays above Leaflet's max z-index (~700) */}
      <div
        className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-[1001] flex w-full max-w-md flex-col bg-white shadow-2xl sm:border-l sm:border-slate-200">

        {/* Header */}
        <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-lime-100">
            <MapPin className="h-5 w-5 text-lime-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{checkpointTitulo}</p>
            {endereco && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{endereco}</p>
            )}
            <Badge className="mt-1.5" variant="warning">Você chegou</Badge>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Action row */}
          <div className="flex gap-2">
            {/* Hidden file input — fallback when camera unavailable */}
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFotoChange}
            />

            {/* Câmera */}
            <button
              onClick={() => handleAbrirCamera()}
              disabled={isPending}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 transition-all disabled:opacity-50 ${
                modo === 'camera'
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <Camera className="h-5 w-5" />
              <span className="text-[11px] font-medium">Câmera</span>
            </button>

            {/* Áudio */}
            <button
              onClick={() => { handleFecharCamera(); setModo(modo === 'audio' ? null : 'audio') }}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 transition-all ${
                modo === 'audio'
                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700'
              }`}
            >
              <Mic className="h-5 w-5" />
              <span className="text-[11px] font-medium">Áudio</span>
            </button>

            {/* Nota */}
            <button
              onClick={() => { handleFecharCamera(); setModo(modo === 'nota' ? null : 'nota') }}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 transition-all ${
                modo === 'nota'
                  ? 'border-lime-400 bg-lime-50 text-lime-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-lime-400 hover:bg-lime-50 hover:text-lime-700'
              }`}
            >
              <Type className="h-5 w-5" />
              <span className="text-[11px] font-medium">Nota</span>
            </button>

            {/* Contato — only for FORUM/VARA_CIVEL */}
            {isVara && (
              <button
                onClick={() => { handleFecharCamera(); setModo(modo === 'contato' ? null : 'contato') }}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 transition-all ${
                  modo === 'contato'
                    ? 'border-violet-400 bg-violet-50 text-violet-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700'
                }`}
              >
                <Users className="h-5 w-5" />
                <span className="text-[11px] font-medium">Contato</span>
              </button>
            )}
          </div>

          {/* Camera viewfinder */}
          {modo === 'camera' && (
            <div className="rounded-xl border border-blue-200 bg-slate-900 overflow-hidden space-y-0">
              {cameraError && (
                <p className="text-xs text-red-400 bg-red-950/50 px-3 py-2 flex items-center gap-1.5">
                  <ZapOff className="h-3.5 w-3.5 flex-shrink-0" />
                  {cameraError}
                </p>
              )}
              {/* Viewfinder */}
              <div className="relative aspect-[4/3] bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                {/* Flip camera button */}
                <button
                  onClick={handleVirarCamera}
                  className="absolute top-2 right-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                  title="Virar câmera"
                >
                  <SwitchCamera className="h-4 w-4" />
                </button>
              </div>
              {/* Controls */}
              <div className="flex items-center gap-2 p-3 bg-slate-800">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={handleFecharCamera}
                >
                  Fechar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-semibold gap-1.5"
                  onClick={handleCapturar}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <><Camera className="h-3.5 w-3.5" /> Tirar foto</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Nota input */}
          {modo === 'nota' && (
            <div className="rounded-xl border border-lime-200 bg-lime-50 p-3 space-y-2">
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Descreva o que observou neste local..."
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => { setNota(''); setModo(null) }}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold"
                  onClick={handleSalvarNota}
                  disabled={!nota.trim() || isPending}
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Salvar nota'}
                </Button>
              </div>
            </div>
          )}

          {/* Audio controls */}
          {modo === 'audio' && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 space-y-3">
              {audioError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{audioError}</p>
              )}

              {!audioPreview ? (
                <div className="flex items-center gap-3">
                  {!gravando ? (
                    <Button
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                      onClick={handleIniciarGravacao}
                    >
                      <Mic className="h-3.5 w-3.5" />
                      Iniciar gravação
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white gap-1.5 animate-pulse"
                      onClick={handlePararGravacao}
                    >
                      <Square className="h-3 w-3 fill-current" />
                      Parar gravação
                    </Button>
                  )}
                  {gravando && (
                    <span className="text-xs text-violet-700 font-medium flex items-center gap-1.5">
                      <MicOff className="h-3.5 w-3.5" />
                      Gravando…
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <audio src={audioPreview} controls className="w-full h-9" />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={handleDescartarAudio}>
                      Descartar
                    </Button>
                    <Button
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                      onClick={handleSalvarAudio}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Salvar áudio'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contato form — FORUM/VARA only */}
          {modo === 'contato' && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 space-y-3">
              <p className="text-xs font-semibold text-violet-800 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Contatos da Vara / Fórum
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Telefone</label>
                  <input
                    type="tel"
                    value={contato.telefone ?? ''}
                    onChange={(e) => setContato((p) => ({ ...p, telefone: e.target.value }))}
                    placeholder="(11) 9999-9999"
                    className="mt-0.5 w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">E-mail</label>
                  <input
                    type="email"
                    value={contato.email ?? ''}
                    onChange={(e) => setContato((p) => ({ ...p, email: e.target.value }))}
                    placeholder="vara@tjsp.jus.br"
                    className="mt-0.5 w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Nome do Juiz</label>
                <input
                  type="text"
                  value={contato.juizNome ?? ''}
                  onChange={(e) => setContato((p) => ({ ...p, juizNome: e.target.value }))}
                  placeholder="Dr. João Silva"
                  className="mt-0.5 w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Secretário(a)</label>
                  <input
                    type="text"
                    value={contato.secretarioNome ?? ''}
                    onChange={(e) => setContato((p) => ({ ...p, secretarioNome: e.target.value }))}
                    placeholder="Maria Costa"
                    className="mt-0.5 w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">LinkedIn</label>
                  <input
                    type="url"
                    value={contato.secretarioLinkedin ?? ''}
                    onChange={(e) => setContato((p) => ({ ...p, secretarioLinkedin: e.target.value }))}
                    placeholder="linkedin.com/in/..."
                    className="mt-0.5 w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Observações</label>
                <textarea
                  value={contato.observacoes ?? ''}
                  onChange={(e) => setContato((p) => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Horário de atendimento, preferências..."
                  rows={2}
                  className="mt-0.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                {savedContato && (
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Salvo
                  </span>
                )}
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                  onClick={handleSalvarContato}
                  disabled={loadingContato}
                >
                  {loadingContato ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Salvar contato
                </Button>
              </div>
            </div>
          )}

          {/* Media grid */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Evidências coletadas
            </p>

            {loadingMidias ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
              </div>
            ) : midias.length === 0 ? (
              <EmptyState
                icon={Camera}
                title="Nenhuma evidência ainda"
                description="Adicione fotos, áudios ou notas acima."
                className="py-8"
              />
            ) : (
              <div className="space-y-2">
                {midias.map((m) => {
                  const TipoIcon = tipoIcon[m.tipo] ?? FileText
                  return (
                    <div
                      key={m.id}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3"
                    >
                      {/* Preview */}
                      <div className="flex-shrink-0">
                        {m.tipo === 'foto' && m.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.url}
                            alt={m.descricao ?? 'Foto'}
                            className="h-14 w-14 rounded-lg object-cover border border-slate-100"
                          />
                        ) : m.tipo === 'audio' && m.url ? (
                          <audio src={m.url} controls className="h-9 w-36" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                            <TipoIcon className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${tipoBadgeClass[m.tipo] ?? 'bg-slate-100 text-slate-600'}`}
                          >
                            {tipoLabel[m.tipo] ?? m.tipo}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(m.criadoEm).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {m.tipo === 'texto' && m.texto && (
                          <p className="text-xs text-slate-700 line-clamp-3">{m.texto}</p>
                        )}
                        {m.descricao && (
                          <p className="text-xs text-slate-500 mt-0.5">{m.descricao}</p>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={isPending}
                        className="flex-shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-white px-4 py-3">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold"
            onClick={handleFinalizar}
            disabled={finalizando}
          >
            {finalizando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Finalizar Checkpoint
          </Button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Salva evidências e marca este ponto como concluído
          </p>
        </div>
      </div>
    </>
  )
}

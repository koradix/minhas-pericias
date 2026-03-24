'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Camera,
  ImageIcon,
  Volume2,
  FileText,
  Loader2,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CheckpointMediaPanel } from '@/components/rotas/checkpoint-media-panel'
import { criarCheckpointParaPericia } from '@/lib/actions/pericias-media'
import type { MidiaDaPericia } from '@/lib/data/checkpoint-media'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  pericoId: string
  midias: MidiaDaPericia[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const tipoBadgeClass: Record<string, string> = {
  foto: 'bg-blue-50 text-blue-700',
  audio: 'bg-violet-50 text-violet-700',
  texto: 'bg-slate-100 text-slate-700',
}

const tipoLabel: Record<string, string> = {
  foto: 'Foto',
  audio: 'Áudio',
  texto: 'Nota',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PericiaMediaSection({ pericoId, midias }: Props) {
  const router = useRouter()
  const [checkpointId, setCheckpointId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  function handleAbrir() {
    setActionError(null)
    startTransition(async () => {
      try {
        const cpId = await criarCheckpointParaPericia(pericoId)
        setCheckpointId(cpId)
      } catch {
        setActionError('Não foi possível abrir o registro. Tente novamente.')
      }
    })
  }

  function handleFechar() {
    setCheckpointId(null)
    router.refresh()
  }

  const fotos = midias.filter((m) => m.tipo === 'foto')
  const audios = midias.filter((m) => m.tipo === 'audio')
  const notas = midias.filter((m) => m.tipo === 'texto')

  return (
    <>
      {midias.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
            <Camera className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Nenhum registro ainda</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Use o botão abaixo para abrir a câmera e registrar evidências.
          </p>
          <Button
            size="sm"
            className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1.5"
            onClick={handleAbrir}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            Abrir câmera / Registrar
          </Button>
          {actionError && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {actionError}
            </p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {/* Fotos grid */}
          {fotos.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" /> Fotos ({fotos.length})
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {fotos.map((m) => (
                  m.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={m.id}
                      src={m.url}
                      alt={m.descricao ?? 'Foto da perícia'}
                      className="aspect-square w-full rounded-xl object-cover border border-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
                      title={new Date(m.criadoEm).toLocaleString('pt-BR')}
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {/* Audios */}
          {audios.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Volume2 className="h-3 w-3" /> Áudios ({audios.length})
              </p>
              <div className="space-y-2">
                {audios.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
                    <span className="text-[10px] text-violet-500 font-medium whitespace-nowrap">
                      {new Date(m.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.url && <audio src={m.url} controls className="h-8 flex-1 min-w-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {notas.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Notas ({notas.length})
              </p>
              <div className="space-y-2">
                {notas.map((m) => (
                  <div key={m.id} className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">
                      {new Date(m.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{m.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add more button */}
          <div className="px-5 py-3">
            <button
              onClick={handleAbrir}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-3 text-xs font-semibold text-slate-400 hover:border-lime-400 hover:text-lime-600 transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Adicionar mais evidências
            </button>
          </div>
        </div>
      )}

      {/* Checkpoint media panel — slide-over */}
      {checkpointId && (
        <CheckpointMediaPanel
          checkpointId={checkpointId}
          checkpointTitulo="Registro de evidências"
          onClose={handleFechar}
          onConcluido={handleFechar}
        />
      )}
    </>
  )
}

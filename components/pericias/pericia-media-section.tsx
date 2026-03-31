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
  foto: 'bg-[#f4fce3] text-[#416900]',
  audio: 'bg-[#f8f9ff] text-[#374151]',
  texto: 'bg-[#f8f9ff] text-[#374151]',
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
        <div className="px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f8f9ff] border border-[#f2f3f9]">
            <Camera className="h-6 w-6 text-[#9ca3af]" strokeWidth={1.5} />
          </div>
          <p className="text-[16px] font-semibold text-[#1f2937] font-manrope">Nenhum registro ainda</p>
          <p className="text-[14px] text-[#6b7280] mt-1.5 mb-6 font-inter max-w-[280px] mx-auto">
            Abra a câmera para registrar evidências, fotos e anotações técnicas.
          </p>
          <Button
            size="lg"
            className="bg-[#1f2937] hover:bg-[#374151] text-white font-semibold gap-2 rounded-lg"
            onClick={handleAbrir}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Registrar evidências
          </Button>
          {actionError && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-rose-600 font-inter">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {actionError}
            </p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-[#f2f3f9]">
          {/* Fotos grid */}
          {fotos.length > 0 && (
            <div className="px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-4 flex items-center gap-2 font-inter">
                <ImageIcon className="h-4 w-4" strokeWidth={1.5} /> Fotos ({fotos.length})
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {fotos.map((m) => (
                  m.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={m.id}
                      src={m.url}
                      alt={m.descricao ?? 'Foto da perícia'}
                      className="aspect-square w-full rounded-lg object-cover border border-[#e2e8f0] cursor-pointer hover:opacity-90 transition-opacity"
                      title={new Date(m.criadoEm).toLocaleString('pt-BR')}
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {/* Audios */}
          {audios.length > 0 && (
            <div className="px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-4 flex items-center gap-2 font-inter">
                <Volume2 className="h-4 w-4" strokeWidth={1.5} /> Áudios ({audios.length})
              </p>
              <div className="space-y-3">
                {audios.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 rounded-lg bg-[#f8f9ff] border border-[#e2e8f0] px-4 py-3">
                    <span className="text-[12px] text-[#6b7280] font-semibold font-inter whitespace-nowrap">
                      {new Date(m.criadoEm).toLocaleString('pt-BR', { day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.url && <audio src={m.url} controls className="h-8 flex-1 min-w-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {notas.length > 0 && (
            <div className="px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] mb-4 flex items-center gap-2 font-inter">
                <FileText className="h-4 w-4" strokeWidth={1.5} /> Notas ({notas.length})
              </p>
              <div className="space-y-3">
                {notas.map((m) => (
                  <div key={m.id} className="rounded-lg bg-[#f8f9ff] border border-[#e2e8f0] px-5 py-4">
                    <p className="text-[12px] text-[#9ca3af] mb-1.5 font-inter">
                      {new Date(m.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[14px] text-[#374151] leading-relaxed font-inter">{m.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add more button */}
          <div className="px-6 py-5">
            <button
              onClick={handleAbrir}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#d1d5db] py-4 text-[13px] font-semibold text-[#6b7280] hover:border-[#416900] hover:text-[#416900] hover:bg-[#f4fce3]/50 transition-all disabled:opacity-50 font-inter"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar novas evidências
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

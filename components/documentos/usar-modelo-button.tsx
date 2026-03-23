'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, X, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { pericias } from '@/lib/mocks/pericias'
import { gerarDocumento } from '@/lib/actions/documentos'
import { tipoDocumentoLabels } from '@/lib/mocks/documentos'
import type { ModeloDocumento } from '@/lib/types/documentos'

interface Props {
  modelo: ModeloDocumento
  /** se true, exibe badge de IA disponível */
  iaAtiva?: boolean
}

export function UsarModeloButton({ modelo, iaAtiva = false }: Props) {
  const [open, setOpen] = useState(false)
  const [periciaNum, setPericiaNum] = useState('')
  const [instrucao, setInstrucao] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleOpen() {
    setOpen(true)
    setPericiaNum('')
    setInstrucao('')
  }

  function handleGerar() {
    if (!periciaNum) return
    startTransition(async () => {
      const id = await gerarDocumento(modelo.id, modelo.tipo, periciaNum, instrucao || undefined)
      setOpen(false)
      router.push(`/documentos/${id}`)
    })
  }

  const periciaSelected = pericias.find((p) => p.numero === periciaNum)

  return (
    <>
      <Button
        size="sm"
        className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-700"
        onClick={handleOpen}
      >
        <Zap className="h-3 w-3" />
        Usar
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="relative w-full max-w-lg rounded-xl bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-foreground">Gerar documento</h2>
                  {iaAtiva && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                      <Sparkles className="h-2.5 w-2.5" />
                      IA ativa
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">{modelo.nome}</span>
                  {' · '}
                  <span>{tipoDocumentoLabels[modelo.tipo]}</span>
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-4 rounded-lg p-1 text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Seleção de perícia */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Selecionar perícia <span className="text-red-500">*</span>
                </label>
                <select
                  value={periciaNum}
                  onChange={(e) => setPericiaNum(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                  disabled={isPending}
                >
                  <option value="">Selecione uma perícia...</option>
                  {pericias.map((p) => (
                    <option key={p.numero} value={p.numero}>
                      {p.numero} — {p.assunto}
                    </option>
                  ))}
                </select>
                {periciaSelected && (
                  <p className="mt-1.5 text-[11px] text-zinc-500">
                    {periciaSelected.vara} · Proc. {periciaSelected.processo}
                  </p>
                )}
              </div>

              {/* Instrução extra */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Instrução para o documento{' '}
                  <span className="text-zinc-500 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={instrucao}
                  onChange={(e) => setInstrucao(e.target.value)}
                  rows={3}
                  placeholder={
                    modelo.tipo === 'PROPOSTA_HONORARIOS'
                      ? 'Ex: Incluir cláusula de adiantamento de 30%, prazo de 45 dias...'
                      : 'Ex: Enfatizar metodologia ABNT NBR 14653, incluir análise comparativa...'
                  }
                  className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                  disabled={isPending}
                />
              </div>

              {/* Info box */}
              {iaAtiva ? (
                <div className="flex items-start gap-2.5 rounded-lg bg-violet-50 border border-violet-100 p-3">
                  <Sparkles className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-violet-700 leading-relaxed">
                    O documento será gerado com IA (Claude), usando os dados da perícia e sua
                    instrução como base. O resultado será salvo no histórico para revisão.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    IA não configurada — documento será gerado via template estruturado. Para
                    ativar a IA, adicione sua{' '}
                    <span className="font-mono font-medium">ANTHROPIC_API_KEY</span> no arquivo{' '}
                    <span className="font-mono font-medium">.env</span>.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t border-border px-5 py-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={handleGerar}
                disabled={!periciaNum || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {iaAtiva ? 'Gerando com IA...' : 'Gerando...'}
                  </>
                ) : (
                  <>
                    {iaAtiva ? <Sparkles className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                    Gerar documento
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

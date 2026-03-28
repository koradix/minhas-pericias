'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  FileText,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import {
  extrairDadosNomeacao,
  gerarResumoNomeacao,
  criarPericiaDeNomeacao,
} from '@/lib/actions/nomeacoes-intake'

interface Props {
  nomeacaoId: string
  nomeArquivo: string | null
  hasExtracted: boolean
  hasSummary: boolean
  periciaId: string | null
  periciaNumero?: string | null
}

function StepCircle({ n, done, active }: { n: number; done: boolean; active: boolean }) {
  if (done) return <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
  if (active) return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white flex-shrink-0">
      {n}
    </span>
  )
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-400 flex-shrink-0">
      {n}
    </span>
  )
}

export function NomeacaoIntakeActions({
  nomeacaoId,
  nomeArquivo,
  hasExtracted: initialExtracted,
  hasSummary: initialSummary,
  periciaId: initialPericiaId,
  periciaNumero: initialNumero,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [hasExtracted, setHasExtracted] = useState(initialExtracted)
  const [hasSummary, setHasSummary]     = useState(initialSummary)
  const [periciaId, setPericiaId]       = useState(initialPericiaId)
  const [periciaNumero, setPericiaNumero] = useState(initialNumero ?? null)

  const [activeStep, setActiveStep]     = useState<number | null>(null)
  const [errorMsg, setErrorMsg]         = useState<string | null>(null)

  async function handleExtract() {
    setErrorMsg(null)
    setActiveStep(1)
    startTransition(async () => {
      const res = await extrairDadosNomeacao(nomeacaoId)
      if (res.ok) {
        setHasExtracted(true)
        router.refresh()
      } else {
        setErrorMsg(res.message)
      }
      setActiveStep(null)
    })
  }

  async function handleSummary() {
    setErrorMsg(null)
    setActiveStep(2)
    startTransition(async () => {
      const res = await gerarResumoNomeacao(nomeacaoId)
      if (res.ok) {
        setHasSummary(true)
        router.refresh()
      } else {
        setErrorMsg(res.message)
      }
      setActiveStep(null)
    })
  }

  async function handleCreatePericia() {
    setErrorMsg(null)
    setActiveStep(3)
    startTransition(async () => {
      const res = await criarPericiaDeNomeacao(nomeacaoId)
      if (res.ok && res.periciaId) {
        router.push(`/pericias/${res.periciaId}`)
      } else {
        setErrorMsg(res.message)
        setActiveStep(null)
      }
    })
  }

  const isRunning = isPending

  // If péricia already exists — show done state
  if (periciaId) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">Perícia criada</p>
            {periciaNumero && (
              <p className="text-xs text-emerald-600">{periciaNumero}</p>
            )}
          </div>
          <Link href={`/pericias/${periciaId}`}>
            <button className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
              Abrir <ChevronRight className="h-3 w-3" />
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">

      {/* Error */}
      {errorMsg && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {errorMsg}
        </p>
      )}

      {/* Step 1 — Extrair dados */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
        <StepCircle n={1} done={hasExtracted} active={activeStep === 1} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${hasExtracted ? 'text-emerald-700' : 'text-slate-700'}`}>
            {hasExtracted ? 'Dados extraídos' : 'Extrair dados do processo'}
          </p>
        </div>
        {!hasExtracted && (
          <button
            onClick={handleExtract}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {isRunning && activeStep === 1
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />
            }
            Extrair
          </button>
        )}
      </div>

      {/* Step 2 — Gerar resumo */}
      <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
        !hasExtracted ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-100 bg-white'
      }`}>
        <StepCircle n={2} done={hasSummary} active={activeStep === 2} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${hasSummary ? 'text-emerald-700' : 'text-slate-700'}`}>
            {hasSummary ? 'Resumo gerado' : 'Gerar resumo'}
          </p>
        </div>
        {!hasExtracted && <Lock className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />}
        {hasExtracted && !hasSummary && (
          <button
            onClick={handleSummary}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {isRunning && activeStep === 2
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <FileText className="h-3.5 w-3.5" />
            }
            Gerar
          </button>
        )}
      </div>

      {/* Step 3 — Aceitar e criar péricia */}
      {(() => {
        const canCreate = true // processo sempre está linkado
        return (
          <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
            !canCreate ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-lime-200 bg-lime-50'
          }`}>
            <StepCircle n={3} done={false} active={activeStep === 3} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700">Aceitar e criar perícia</p>
              {!hasSummary && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {hasExtracted ? 'Com dados extraídos' : 'A partir dos dados do processo'}
                </p>
              )}
            </div>
            <button
              onClick={handleCreatePericia}
              disabled={isRunning}
              className="flex items-center gap-1.5 rounded-lg bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold text-xs px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {isRunning && activeStep === 3
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <ChevronRight className="h-3.5 w-3.5" />
              }
              Aceitar
            </button>
          </div>
        )
      })()}
    </div>
  )
}

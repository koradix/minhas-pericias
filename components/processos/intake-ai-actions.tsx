'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Cpu, Sparkles, FileCheck, Loader2, CheckCircle2, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { extrairDadosIA, gerarResumoIA, criarCardPericiaIA } from '@/lib/actions/processos-intake'
import type { AIActionResult } from '@/lib/actions/processos-intake'

interface Props {
  intakeId: string
  status: string
  /** Whether extractProcessData has already been persisted (hasData from server) */
  hasData: boolean
  /** Whether generateProcessSummary has already been persisted (hasResumo from server) */
  hasResumo: boolean
}

type ActionKey = 'extrair' | 'resumo' | 'card'

interface ActionState {
  loading: boolean
  result: AIActionResult | null
  done: boolean  // persisted to DB (from server-state prop)
}

export function IntakeAIActions({ intakeId, status, hasData, hasResumo }: Props) {
  const router = useRouter()
  const isCardCreated = status === 'card_criado'

  // Track periciaId + numero from the card step result
  const [cardCreated, setCardCreated] = useState<{ periciaId: string; numero: string } | null>(
    isCardCreated ? null : null,   // server shows Bloco 4 when card exists; this is for mid-session feedback
  )

  const [states, setStates] = useState<Record<ActionKey, ActionState>>({
    extrair: { loading: false, result: null, done: hasData        },
    resumo:  { loading: false, result: null, done: hasResumo      },
    card:    { loading: false, result: null, done: isCardCreated  },
  })

  async function runAction(key: ActionKey, fn: (id: string) => Promise<AIActionResult>) {
    setStates((s) => ({ ...s, [key]: { ...s[key], loading: true, result: null } }))
    const result = await fn(intakeId)
    setStates((s) => ({
      ...s,
      [key]: { loading: false, result, done: result.ok ? true : s[key].done },
    }))
    // Capture card creation result for success banner
    if (key === 'card' && result.ok && result.periciaId) {
      setCardCreated({ periciaId: result.periciaId, numero: result.periciaNumero ?? result.periciaId })
    }
    if (result.ok) router.refresh()
  }

  // If card was just created in this session, show success banner
  if (cardCreated) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-900">Fluxo concluído</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Dados extraídos · Resumo gerado · Card da perícia criado
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                Perícia criada
              </p>
              <p className="text-sm font-mono font-bold text-emerald-800">{cardCreated.numero}</p>
            </div>
            <Link
              href={`/pericias/${cardCreated.periciaId}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 transition-colors"
            >
              Abrir perícia <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 mt-0.5">
            <ArrowRight className="h-3 w-3 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">Próximo passo: agendar vistoria</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Acesse o card da perícia para adicionar à rota, definir o prazo e iniciar o campo.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isCardCreated) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-800">Fluxo concluído</p>
          <p className="text-xs text-emerald-600">Dados extraídos · Resumo gerado · Card da perícia criado.</p>
        </div>
        <Link
          href="/pericias"
          className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
        >
          Ver péricias <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    )
  }

  const actions: {
    key: ActionKey
    label: string
    sublabel: string
    icon: typeof Cpu
    fn: (id: string) => Promise<AIActionResult>
    /** Whether this step requires a previous step to be done first */
    requiresDone?: boolean
  }[] = [
    {
      key: 'extrair',
      label: 'Extrair dados do processo',
      sublabel: 'Número, tribunal, partes, vara e endereço',
      icon: Cpu,
      fn: extrairDadosIA,
    },
    {
      key: 'resumo',
      label: 'Gerar resumo',
      sublabel: 'Resumo executivo do processo em linguagem técnica',
      icon: Sparkles,
      fn: gerarResumoIA,
      requiresDone: !states.extrair.done,
    },
    {
      key: 'card',
      label: 'Criar card da perícia',
      sublabel: 'Inicia o processo pericial com dados pré-preenchidos',
      icon: FileCheck,
      fn: criarCardPericiaIA,
      requiresDone: !states.extrair.done,
    },
  ]

  return (
    <div className="space-y-2.5">
      {actions.map(({ key, label, sublabel, icon: Icon, fn, requiresDone }, idx) => {
        const { loading, result, done } = states[key]
        const isLocked = Boolean(requiresDone)
        const isActive = !isLocked && !done

        return (
          <div
            key={key}
            className={cn(
              'rounded-xl border p-4 transition-colors',
              done
                ? 'border-emerald-200 bg-emerald-50/50'
                : isLocked
                  ? 'border-slate-100 bg-slate-50 opacity-60'
                  : 'border-slate-200 bg-white',
            )}
          >
            {/* Step number + content */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* Step indicator */}
                <div className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  done
                    ? 'bg-emerald-100 text-emerald-700'
                    : isLocked
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-violet-100 text-violet-700',
                )}>
                  {done
                    ? <CheckCircle2 className="h-3.5 w-3.5" />
                    : isLocked
                      ? <Lock className="h-3 w-3" />
                      : idx + 1}
                </div>

                <div>
                  <p className={cn(
                    'text-sm font-semibold',
                    done ? 'text-emerald-800' : isLocked ? 'text-slate-400' : 'text-slate-800',
                  )}>
                    {label}
                    {done && <span className="ml-2 text-[10px] font-normal text-emerald-600">✓ concluído</span>}
                  </p>
                  <p className={cn(
                    'text-xs mt-0.5',
                    done ? 'text-emerald-600' : 'text-slate-400',
                  )}>
                    {sublabel}
                  </p>
                </div>
              </div>

              {/* Action button */}
              {!done && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading || isLocked}
                  onClick={() => runAction(key, fn)}
                  className={cn(
                    'flex-shrink-0 h-8 px-3 text-xs gap-1.5',
                    isActive && 'bg-violet-600 hover:bg-violet-700 text-white border-transparent',
                    isLocked && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isLocked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <>
                      <Icon className="h-3 w-3" />
                      Executar
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Result message */}
            {result && (
              <div className={cn(
                'mt-2.5 flex items-start gap-2 rounded-lg px-3 py-2 text-xs',
                result.ok
                  ? 'bg-emerald-100 border border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border border-rose-200 text-rose-700',
              )}>
                {result.ok
                  ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  : <span className="flex-shrink-0 mt-0.5">⚠</span>}
                {result.message}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

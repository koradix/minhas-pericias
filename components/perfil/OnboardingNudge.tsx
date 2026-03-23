'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, X, CheckCircle2, Loader2 } from 'lucide-react'
import { PerfilProfissionalForm } from '@/components/perfil/PerfilProfissionalForm'
import { updatePerfilProfissional, type PerfilProfissionalData } from '@/lib/actions/perfil'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'onboarding_nudge_dismissed'

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingNudge() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(DISMISS_KEY) === '1'
  })
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [perfil, setPerfil] = useState<PerfilProfissionalData>({
    areaPrincipal: '' as PerfilProfissionalData['areaPrincipal'],
    areasSecundarias: [],
    especialidades2: [],
    keywords: [],
    formacao: '',
    registro: '',
  })

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  function handleSave() {
    if (!perfil.areaPrincipal) {
      setErr('Selecione ao menos a área principal de atuação.')
      return
    }
    setErr(null)
    startTransition(async () => {
      const result = await updatePerfilProfissional(perfil)
      if (result.ok) {
        setSaved(true)
        setTimeout(() => {
          setOpen(false)
          handleDismiss()
        }, 1500)
      } else {
        setErr(result.error)
      }
    })
  }

  if (dismissed) return null

  return (
    <>
      {/* ── Banner ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-3.5">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">Complete seu perfil profissional</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Defina sua área e especialidades para receber demandas compatíveis
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="h-8 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs"
          >
            Completar agora
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-7 w-7 items-center justify-center rounded-full text-amber-500 hover:bg-amber-100 transition-colors"
            title="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Slide-over overlay ──────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Perfil profissional</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esses dados personalizam suas demandas sugeridas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {saved ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-800">Perfil salvo com sucesso!</p>
                </div>
              ) : (
                <PerfilProfissionalForm
                  value={perfil}
                  onChange={(update) => setPerfil((p) => ({ ...p, ...update }))}
                  showFormacaoRegistro
                />
              )}

              {err && (
                <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {err}
                </p>
              )}
            </div>

            {/* Footer */}
            {!saved && (
              <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="h-9"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending}
                  className="h-9 bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold gap-1.5"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Salvar perfil
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

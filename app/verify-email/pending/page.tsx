'use client'

// ─── /verify-email/pending ────────────────────────────────────────────────────
// Shown to logged-in users whose emailVerified is still null.

import { useState, useTransition } from 'react'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { resendVerificationEmail } from '@/lib/actions/verify-email'
import { signOut } from 'next-auth/react'

export default function VerifyEmailPendingPage() {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function handleResend() {
    setError('')
    startTransition(async () => {
      const res = await resendVerificationEmail()
      if (res.ok) {
        setSent(true)
      } else {
        setError(res.error ?? 'Erro ao enviar. Tente novamente.')
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-100 shadow-sm p-8 text-center space-y-5">
        <div className="flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
            <Mail className="h-7 w-7 text-amber-500" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-black text-slate-900">Verifique seu e-mail</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Enviamos um link de verificação para o seu e-mail.
            Clique no link para ativar sua conta.
          </p>
        </div>

        {sent ? (
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#84cc16]">
            <CheckCircle2 className="h-4 w-4" />
            Novo link enviado!
          </div>
        ) : (
          <button
            onClick={handleResend}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-bold px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Reenviar e-mail
          </button>
        )}

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="block w-full text-xs text-slate-400 hover:text-slate-600 transition-colors pt-2"
        >
          Entrar com outra conta
        </button>
      </div>
    </div>
  )
}

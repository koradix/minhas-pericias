'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Google icon (inline SVG — no extra dep) ─────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess('E-mail verificado com sucesso! Faça login para continuar.')
    }
  }, [searchParams])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Ops! Verifique seu e-mail e senha.')
        setLoading(false)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Algo deu errado. Tente novamente em instantes.')
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {success && (
        <div className="flex items-center gap-3 rounded-2xl bg-lime-50 border border-lime-100 px-5 py-4 text-sm text-lime-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50/50 border border-red-100 px-5 py-4 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0 opacity-80" />
          <p className="font-semibold tracking-tight">{error}</p>
        </div>
      )}

      {/* ── Credentials ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.16em] ml-1 font-display" htmlFor="email">
            E-mail Profissional
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemplo@perilab.com.br"
            className="w-full h-14 rounded-2xl border-none bg-slate-100/60 px-5 text-sm font-medium transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#84cc16] focus:outline-none"
            disabled={loading || googleLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.16em] font-display" htmlFor="password">
              Senha secreta
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-14 rounded-2xl border-none bg-slate-100/60 px-5 pr-14 text-sm font-medium transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#84cc16] focus:outline-none"
              disabled={loading || googleLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex justify-end pr-1">
            <Link
              href="/forgot-password"
              className="text-[11px] font-bold text-slate-400 hover:text-[#84cc16] uppercase tracking-wider transition-colors font-display"
            >
              Recuperar senha
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="brand"
          className="w-full h-14 text-lg font-black tracking-widest active:scale-[0.98] disabled:opacity-50 font-display transition-transform"
          disabled={loading || googleLoading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              Entrando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3 uppercase tracking-widest">
              Entrar
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Ops! Verifique seu e-mail e senha.')
        setLoading(false)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Algo deu errado. Tente novamente em instantes.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-700">
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50/50 border border-red-100 px-5 py-4 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0 opacity-80" />
          <p className="font-semibold tracking-tight">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Email Field */}
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
            disabled={loading}
          />
        </div>

        {/* Password Field */}
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
              disabled={loading}
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
      </div>

      <Button 
        type="submit" 
        variant="brand"
        className="w-full h-14 text-lg font-black tracking-widest active:scale-[0.98] disabled:opacity-50 font-display transition-transform" 
        disabled={loading}
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
  )
}

import type { Metadata } from 'next'
import LoginForm from './login-form'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lime-500 text-slate-900 font-black text-xl">
            P
          </div>
          <h1 className="text-xl font-bold text-slate-900">PeriLaB</h1>
          <p className="mt-1 text-sm text-slate-500">Entre na sua conta para continuar</p>
        </div>
        <LoginForm />
        <p className="mt-4 text-center text-xs text-slate-500">
          Não tem conta?{' '}
          <a href="/signup" className="font-medium text-lime-600 hover:text-lime-700">
            Criar conta grátis
          </a>
        </p>
      </div>
    </div>
  )
}

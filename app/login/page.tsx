import type { Metadata } from 'next'
import LoginForm from './login-form'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg">
            MP
          </div>
          <h1 className="text-xl font-bold text-slate-900">Minhas Perícias</h1>
          <p className="mt-1 text-sm text-slate-500">Entre na sua conta para continuar</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Image from 'next/image'
import LoginForm from './login-form'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/logo.svg" alt="PeriLaB" width={180} height={68} priority />
          <p className="mt-3 text-sm text-slate-500">Entre na sua conta para continuar</p>
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

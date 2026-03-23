import type { Metadata } from 'next'
import Image from 'next/image'
import LoginForm from './login-form'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/logo.svg" alt="PeriLaB" width={180} height={68} priority />
          <p className="mt-3 text-sm text-zinc-400">Entre na sua conta para continuar</p>
        </div>
        <LoginForm />
        <p className="mt-4 text-center text-xs text-zinc-400">
          Não tem conta?{' '}
          <a href="/signup" className="font-medium text-brand-500 hover:text-brand-400">
            Criar conta grátis
          </a>
        </p>
      </div>
    </div>
  )
}

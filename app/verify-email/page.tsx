// ─── /verify-email?token=xxx ─────────────────────────────────────────────────
// Handles the click on the verification link sent by email.

import { verifyEmail } from '@/lib/actions/verify-email'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <VerifyLayout icon="error" title="Link inválido" description="O link de verificação está incompleto. Solicite um novo." />
  }

  const result = await verifyEmail(token)

  if (result.ok) {
    return (
      <VerifyLayout icon="success" title="E-mail verificado!" description="Sua conta está ativa. Faça login para continuar.">
        <Link
          href="/login?verified=true"
          className="inline-flex items-center gap-2 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-white font-bold px-6 py-3 text-sm transition-colors"
        >
          Fazer login
        </Link>
      </VerifyLayout>
    )
  }

  const messages: Record<string, { title: string; description: string }> = {
    expired_token: {
      title: 'Link expirado',
      description: 'O link de verificação expirou. Faça login para receber um novo.',
    },
    already_verified: {
      title: 'E-mail já verificado',
      description: 'Sua conta já está ativa.',
    },
    invalid_token: {
      title: 'Link inválido',
      description: 'Este link não é válido ou já foi utilizado.',
    },
    unknown: {
      title: 'Erro inesperado',
      description: 'Algo deu errado. Tente novamente ou entre em contato com o suporte.',
    },
  }

  const msg = messages[result.error] ?? messages.unknown
  const isAlreadyVerified = result.error === 'already_verified'

  return (
    <VerifyLayout icon={isAlreadyVerified ? 'success' : 'error'} title={msg.title} description={msg.description}>
      <Link href="/login" className="text-sm font-semibold text-[#84cc16] hover:underline">
        Ir para o login
      </Link>
    </VerifyLayout>
  )
}

// ─── Layout helper ────────────────────────────────────────────────────────────

function VerifyLayout({
  icon,
  title,
  description,
  children,
}: {
  icon: 'success' | 'error' | 'pending'
  title: string
  description: string
  children?: React.ReactNode
}) {
  const Icon = icon === 'success' ? CheckCircle2 : icon === 'error' ? XCircle : Clock
  const iconColor = icon === 'success' ? 'text-[#84cc16]' : icon === 'error' ? 'text-rose-500' : 'text-amber-400'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-100 shadow-sm p-8 text-center space-y-4">
        <Icon className={`mx-auto h-12 w-12 ${iconColor}`} />
        <h1 className="text-xl font-black text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{description}</p>
        {children}
      </div>
    </div>
  )
}

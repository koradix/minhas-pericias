import type { Metadata } from 'next'
import Link from 'next/link'
import LoginForm from './login-form'

export const metadata: Metadata = { title: 'Entrar — Perilab' }

function PeriLabLogo() {
  return (
    <div style={{ fontFamily: '"Montserrat", ui-sans-serif, system-ui, sans-serif', lineHeight: 1 }}>
      <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
        <span style={{ color: 'white' }}>Peri</span>
        <span style={{ color: '#84cc16' }}>LaB</span>
      </div>
      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '4px' }}>
        de perito para perito
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">

      {/* ── Lado esquerdo — branding dark ── */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between p-12 flex-shrink-0"
        style={{ background: '#0f172a' }}
      >
        {/* Logo */}
        <Link href="/">
          <PeriLabLogo />
        </Link>

        {/* Benefícios */}
        <div className="space-y-8">
          <div>
            <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              Gestão pericial<br />
              <span style={{ color: '#84cc16' }}>do processo ao laudo.</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '1rem', lineHeight: 1.7 }}>
              Radar de nomeações, rotas, documentos e IA — tudo num só lugar.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              'Monitore varas e nomeações automaticamente',
              'Gere propostas e laudos com IA',
              'Organize rotas e vistorias de campo',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-full"
                  style={{ width: 20, height: 20, background: 'rgba(132,204,22,0.15)', border: '1px solid rgba(132,204,22,0.3)' }}
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#84cc16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rodapé do painel */}
        <p style={{ color: '#334155', fontSize: '0.75rem' }}>
          © {new Date().getFullYear()} Perilab · Todos os direitos reservados
        </p>
      </div>

      {/* ── Lado direito — formulário ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        {/* Logo mobile */}
        <div className="mb-8 lg:hidden">
          <Link href="/">
            <div style={{ fontFamily: '"Montserrat", ui-sans-serif, system-ui, sans-serif', lineHeight: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
                <span style={{ color: '#1f2937' }}>Peri</span>
                <span style={{ color: '#84cc16' }}>LaB</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h1 style={{ color: '#0f172a', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Bem-vindo de volta
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>
              Entre na sua conta para continuar
            </p>
          </div>

          <LoginForm />

          <p className="mt-5 text-center text-xs text-slate-400">
            Não tem conta?{' '}
            <Link href="/signup" className="font-medium text-lime-600 hover:text-lime-700">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}

'use client'

import React from 'react'
import Link from 'next/link'
import LoginForm from './login-form'
import { cn } from '@/lib/utils'

function PeriLabLogo() {
  return (
    <div className="font-display leading-tight select-none">
      <div className="text-[2rem] font-black tracking-tightest leading-none">
        <span className="text-white">Peri</span>
        <span className="text-[#84cc16]">LaB</span>
      </div>
      <div className="text-[0.6rem] font-medium tracking-[0.14em] uppercase mt-1.5 text-white/40">
        de perito para perito
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-white font-display">

      {/* ── Lado esquerdo — branding dark (Restaurado conforme Print) ── */}
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
            <h2 className="text-white text-[1.75rem] font-extrabold tracking-tight leading-[1.25]">
              Gestão pericial<br />
              <span className="text-[#84cc16]">do processo ao laudo.</span>
            </h2>
            <p className="text-[#64748b] text-[0.9rem] mt-4 leading-[1.7]">
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
                  style={{ width: 22, height: 22, background: 'rgba(132,204,22,0.15)', border: '1px solid rgba(132,204,22,0.3)' }}
                >
                  <svg width="11" height="9" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="text-[#94a3b8] text-[0.875rem] font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rodapé do painel */}
        <p className="text-[#334155] text-[0.75rem] font-medium tracking-wide">
          © {new Date().getFullYear()} Perilab · Todos os direitos reservados
        </p>
      </div>

      {/* ── Lado direito — formulário (Opção Stitch) ── */}
      <main className="flex flex-1 flex-col items-center justify-center px-8 lg:px-12 py-16">
        
        {/* Logo mobile */}
        <div className="mb-12 lg:hidden">
          <Link href="/">
            <div className="text-3xl font-black tracking-tighter">
              <span className="text-slate-900">Peri</span>
              <span className="text-[#84cc16]">LaB</span>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-[2.25rem] font-black text-slate-900 tracking-tightest font-display leading-tight">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-slate-500 text-sm font-medium">
              Acesse sua conta para gerenciar suas perícias.
            </p>
          </div>

          {/* Form Container (Aesthetic Stitch Option) */}
          <div className="p-1">
            <LoginForm />
          </div>

          <p className="mt-10 text-center text-sm text-slate-400 font-medium tracking-tight">
            Não tem uma conta?{' '}
            <Link 
              href="/signup" 
              className="font-bold text-[#84cc16] hover:text-[#345300] transition-colors underline decoration-[#84cc16]/30 underline-offset-4 hover:decoration-[#84cc16]"
            >
              Crie sua conta gratuitamente
            </Link>
          </p>
        </div>
      </main>

    </div>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Radar,
  MapPin,
  FileOutput,
  DollarSign,
  Users,
  Star,
  Sparkles,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    title: 'Gestão de Pericias',
    description: 'Centralize processos, prazos, documentos e laudos. Acompanhe cada etapa com visibilidade total do fluxo pericial.',
  },
  {
    title: 'Radar de Nomeações',
    description: 'Monitore varas e juízes estratégicos. Identifique padrões de nomeação e antecipe oportunidades de trabalho.',
  },
  {
    title: 'Rotas Inteligentes',
    description: 'Planeje deslocamentos entre visitas e vistorias. Reduza tempo e custo com organização eficiente de rotas.',
  },
  {
    title: 'Geração de Documentos',
    description: 'Gere laudos, propostas de honorários e pareceres com agilidade. Modelos profissionais prontos para uso.',
  },
]

function getFeatureIcon(title: string) {
  const t = title.toLowerCase()
  if (t.includes('perícia') || t.includes('gestão')) return FileText
  if (t.includes('radar') || t.includes('nomeaç')) return Radar
  if (t.includes('rota') || t.includes('vistoria')) return MapPin
  if (t.includes('documento') || t.includes('laudo') || t.includes('relatório')) return FileOutput
  if (t.includes('financeiro') || t.includes('honorário')) return DollarSign
  if (t.includes('parceiro') || t.includes('demanda')) return Users
  return Star
}

const prospectionFeatures = [
  { text: 'Envio automatizado de e-mails para advogados e escritórios' },
  { text: 'Cadastro e organização de leads qualificados' },
  { text: 'Envio de propostas e currículo profissional' },
  { text: 'Acompanhamento de funil e taxa de resposta' },
  { text: 'Identificação automática de oportunidades' },
]

const plans = [
  {
    name: 'Essencial',
    price: 'Grátis',
    period: '',
    description: 'Para quem está começando a organizar sua atuação pericial.',
    highlight: false,
    badge: null,
    features: [
      'Até 20 péricias ativas',
      'Gestão de documentos',
      'Controle de visitas',
      'Contatos e parceiros',
      'Dashboard financeiro',
    ],
    cta: 'Começar grátis',
    ctaStyle: 'secondary',
  },
  {
    name: 'Pro (IA)',
    price: 'R$ 189',
    period: '/mês',
    description: 'Para peritos que querem crescer com inteligência artificial.',
    highlight: true,
    badge: 'Mais popular',
    features: [
      'Pericias ilimitadas',
      'Resumo automático de processos',
      'Geração de proposta de honorários',
      'Rascunho de laudo com IA',
      'Radar de Nomeações',
      'Rotas inteligentes',
    ],
    cta: 'Começar agora',
    ctaStyle: 'primary',
  },
  {
    name: 'Avançado',
    price: 'R$ 389',
    period: '/mês',
    description: 'Automação completa para maximizar sua captação de trabalhos.',
    highlight: false,
    badge: null,
    features: [
      'Tudo do Pro (IA)',
      'CRM de advogados e escritórios',
      'Automação de e-mails de prospecção',
      'Gestão de contatos de varas',
      'Leads qualificados',
      'Suporte prioritário',
    ],
    cta: 'Falar com consultor',
    ctaStyle: 'secondary',
  },
]

// ─── Logo components ─────────────────────────────────────────────────────────

function PeriLabLogo({ dark = true }: { dark?: boolean }) {
  return (
    <div style={{ fontFamily: 'var(--font-montserrat), "Montserrat", ui-sans-serif, system-ui, sans-serif', lineHeight: 1 }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
        <span style={{ color: dark ? '#1f2937' : 'white' }}>Peri</span>
        <span style={{ color: '#84cc16' }}>LaB</span>
      </div>
      <div style={{ fontSize: '0.6rem', color: dark ? '#9ca3af' : 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '3px' }}>
        de perito para perito
      </div>
    </div>
  )
}

/** Compact two-letter mark: P (preto/branco) + B (lime) */
function PeriLabMark({ size = 32, dark = false }: { size?: number; dark?: boolean }) {
  const textColor = dark ? '#ffffff' : '#111827'
  return (
    <div
      style={{
        fontFamily: 'var(--font-montserrat), "Montserrat", ui-sans-serif, system-ui, sans-serif',
        fontWeight: 900,
        letterSpacing: '-0.05em',
        lineHeight: 1,
        fontSize: size * 0.65,
        userSelect: 'none',
      }}
    >
      <span style={{ color: textColor }}>P</span>
      <span style={{ color: '#84cc16' }}>B</span>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Navbar ── */}
      <header
        className="fixed top-0 z-50 w-full transition-all duration-300"
        style={
          scrolled
            ? { background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
            : { background: 'transparent' }
        }
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <PeriLabLogo dark />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#funcionalidades" className="text-sm font-medium text-slate-700 transition-colors hover:text-lime-600">
              Funcionalidades
            </a>
            <a href="#prospeccao" className="text-sm font-medium text-slate-700 transition-colors hover:text-lime-600">
              Prospecção
            </a>
            <a href="#planos" className="text-sm font-medium text-slate-700 transition-colors hover:text-lime-600">
              Planos
            </a>
          </nav>

          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-lime-500 px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-lime-400"
          >
            Entrar
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        {/* Blurred background image */}
        <div
          aria-hidden
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
          }}
        />
        {/* White overlay */}
        <div aria-hidden className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.88)' }} />

        {/* Main content — centered single column */}
        <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 pb-32 pt-32 text-center sm:px-6">

          {/* Headline */}
          <h1
            className="mb-6"
            style={{
              color: '#1f2937',
              fontWeight: 800,
              fontSize: 'clamp(3rem, 6vw, 5.5rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              textAlign: 'center',
              fontFamily: 'var(--font-montserrat), "Montserrat", ui-sans-serif, system-ui, sans-serif',
            }}
          >
            Gestão pericial completa,<br />
            <em style={{ color: '#84cc16', fontStyle: 'italic' }}>do processo ao laudo.</em>
          </h1>

          <p
            className="mb-10"
            style={{ color: '#6b7280', fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', maxWidth: '600px', lineHeight: 1.7, textAlign: 'center', margin: '0 auto 2.5rem' }}
          >
            O Perilab organiza suas péricias, identifica oportunidades de nomeação e gera documentos profissionais com precisão.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 transition-all hover:bg-lime-400"
              style={{ background: '#84cc16', color: '#1f2937', fontWeight: 600, padding: '16px 36px', fontSize: '1.05rem', borderRadius: '0.75rem' }}
            >
              Acessar plataforma
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#planos"
              className="inline-flex items-center justify-center gap-2 transition-all hover:border-slate-400"
              style={{ border: '1px solid #d1d5db', color: '#374151', background: 'transparent', padding: '16px 36px', fontSize: '1.05rem', fontWeight: 600, borderRadius: '0.75rem' }}
            >
              Ver planos
            </a>
          </div>
        </div>

        {/* ── Stats bar (bottom of hero) ── */}
        <div
          className="relative w-full"
          style={{
            background: 'rgba(255,255,255,0.96)',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center px-4 sm:px-6">
            {[
              { value: '200+', label: 'Peritos ativos' },
              { value: '5.000+', label: 'Pericias gerenciadas' },
              { value: '12.000+', label: 'Documentos gerados' },
            ].map((s, i) => (
              <div
                key={s.label}
                className="flex flex-col items-center py-6 px-10 sm:px-16"
                style={i > 0 ? { borderLeft: '1px solid rgba(0,0,0,0.1)' } : {}}
              >
                <p style={{ color: '#1f2937', fontSize: '2rem', fontWeight: 800, lineHeight: 1, fontFamily: 'var(--font-montserrat), ui-sans-serif, system-ui, sans-serif' }}>{s.value}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="funcionalidades" className="py-24">
        <div className="mx-auto max-w-[1100px] px-6">
          {/* Header */}
          <div className="mb-12 max-w-xl">
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', color: '#84cc16', textTransform: 'uppercase', marginBottom: '12px' }}>
              Funcionalidades
            </p>
            <h2 style={{ fontSize: 'clamp(2rem, 3vw, 2.8rem)', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.02em', lineHeight: 1.2, fontFamily: 'var(--font-montserrat), ui-sans-serif, system-ui, sans-serif' }}>
              Tudo que o perito precisa
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: '560px', marginTop: '12px', lineHeight: 1.7 }}>
              Do controle de processos à geração de laudos — uma plataforma integrada para profissionalizar sua atuação pericial.
            </p>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #e2e8f0' }} />

          {/* Editorial list */}
          {features.map((f, i) => (
            <div
              key={f.title}
              className="transition-colors duration-150"
              style={{
                display: 'grid',
                gridTemplateColumns: '3rem 1fr 2fr',
                gap: '2rem',
                padding: '2rem 0',
                borderBottom: '1px solid #e2e8f0',
                alignItems: 'start',
                cursor: 'default',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#fafafa' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#84cc16', letterSpacing: '0.05em', paddingTop: '3px' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', letterSpacing: '-0.01em', margin: 0 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#6b7280', lineHeight: 1.7, margin: 0 }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Prospection ── */}
      <section
        id="prospeccao"
        className="py-20 sm:py-28"
        style={{ background: '#0f172a' }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left column */}
            <div>
              {/* Label pill */}
              <div
                className="mb-4 inline-block"
                style={{
                  background: 'rgba(132,204,22,0.15)',
                  border: '1px solid rgba(132,204,22,0.3)',
                  color: '#a3e635',
                  borderRadius: '999px',
                  padding: '4px 14px',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                }}
              >
                Módulo de Prospecção
              </div>
              <h2
                className="font-heading mb-5 text-3xl tracking-tight sm:text-[2.1rem]"
                style={{ color: 'white', fontWeight: 800 }}
              >
                Conquiste novos trabalhos{' '}
                <span style={{ color: '#84cc16' }}>no piloto automático</span>
              </h2>
              <p
                className="mb-8 text-base leading-relaxed"
                style={{ color: '#d1d5db' }}
              >
                O Perilab automatiza a prospecção de advogados, escritórios e seguradoras. Envie
                e-mails personalizados, propostas e currículo de forma organizada e escalável —
                enquanto você foca nas péricias.
              </p>
              <ul className="space-y-3.5">
                {prospectionFeatures.map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: '#84cc16', width: '20px', height: '20px' }}
                    />
                    <span className="text-sm leading-relaxed" style={{ color: '#d1d5db' }}>{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <a
                  href="#planos"
                  className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                  style={{ color: '#a3e635' }}
                >
                  Disponível nos planos Pro e Avançado
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Right column — clean dark card */}
            <div
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '1.5rem',
                padding: '1.5rem',
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: 'white' }}>Campanha ativa</p>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#34d399' }} />
                  Enviando
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  { nome: 'Dr. Ricardo Alves', status: 'Respondeu', bg: 'rgba(52,211,153,0.15)', color: '#34d399' },
                  { nome: 'Escritório Martins & Assoc.', status: 'Abriu e-mail', bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
                  { nome: 'Dra. Camila Santos', status: 'Enviado', bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
                  { nome: 'Braz Advogados', status: 'Enviado', bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
                  { nome: 'Dr. Fernando Costa', status: 'Agendou reunião', bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
                ].map((lead) => (
                  <div
                    key={lead.nome}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                      >
                        {lead.nome[0]}
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{lead.nome}</span>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: lead.bg, color: lead.color }}
                    >
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="mt-4 grid grid-cols-3 gap-2 pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
              >
                {[
                  { label: 'Enviados', value: '124' },
                  { label: 'Abertos', value: '68' },
                  { label: 'Respondidos', value: '19' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-base font-bold tabular-nums" style={{ color: 'white' }}>{s.value}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="planos" className="py-20 sm:py-28" style={{ background: '#f8fafc' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 max-w-lg">
            {/* Pill label */}
            <div
              className="mb-4 inline-block"
              style={{
                background: '#f0fdf4',
                color: '#4d7c0f',
                border: '1px solid #bbf7d0',
                borderRadius: '999px',
                padding: '4px 14px',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
              }}
            >
              Planos
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem]">
              Escolha o seu plano
            </h2>
            <p className="mt-4 text-base text-slate-500">
              Comece grátis por 1 mês. Sem cartão de crédito.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="relative flex flex-col transition-all"
                style={
                  plan.highlight
                    ? {
                        background: '#1f2937',
                        border: '2px solid #84cc16',
                        borderRadius: '1.5rem',
                        padding: '2rem',
                        position: 'relative',
                      }
                    : {
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '1.5rem',
                        padding: '2rem',
                      }
                }
              >
                {plan.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#84cc16',
                        color: '#1f2937',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 16px',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Sparkles style={{ width: '12px', height: '12px' }} />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p
                    className="mb-1 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: plan.highlight ? '#a3e635' : '#94a3b8' }}
                  >
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span
                      className="font-heading text-4xl font-bold tabular-nums tracking-tight"
                      style={{ color: plan.highlight ? '#84cc16' : '#0f172a' }}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className="text-sm"
                        style={{ color: plan.highlight ? '#6b7280' : '#94a3b8' }}
                      >
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-2.5 text-sm leading-relaxed"
                    style={{ color: plan.highlight ? '#9ca3af' : '#64748b' }}
                  >
                    {plan.description}
                  </p>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: '#84cc16', width: '16px', height: '16px' }}
                      />
                      <span style={{ color: plan.highlight ? '#d1d5db' : '#475569' }}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-xl text-sm transition-all"
                  style={
                    plan.ctaStyle === 'primary'
                      ? {
                          background: '#84cc16',
                          color: '#1f2937',
                          fontWeight: 700,
                        }
                      : {
                          border: '2px solid #e2e8f0',
                          color: '#1f2937',
                          background: 'transparent',
                          fontWeight: 600,
                        }
                  }
                  onMouseEnter={(e) => {
                    const el = e.currentTarget
                    if (plan.ctaStyle !== 'primary') {
                      el.style.borderColor = '#84cc16'
                      el.style.color = '#4d7c0f'
                    } else {
                      el.style.background = '#a3e635'
                    }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget
                    if (plan.ctaStyle !== 'primary') {
                      el.style.borderColor = '#e2e8f0'
                      el.style.color = '#1f2937'
                    } else {
                      el.style.background = '#84cc16'
                    }
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Todos os planos incluem 1 mês de teste gratuito · Cancele a qualquer momento
          </p>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-slate-950 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5 text-xs text-slate-400">
            <span style={{ fontFamily: 'var(--font-montserrat), ui-sans-serif', fontWeight: 900, fontSize: '11px', letterSpacing: '-0.03em', lineHeight: 1 }}>
              <span style={{ color: 'white' }}>P</span><span style={{ color: '#84cc16' }}>B</span>
            </span>
            Dados seguros · LGPD compliant
          </div>
          <h2 className="font-heading mb-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Pronto para profissionalizar<br className="hidden sm:block" /> sua atuação pericial?
          </h2>
          <p className="mb-8 text-base leading-relaxed text-slate-400">
            Junte-se a centenas de peritos que já usam o Perilab para organizar processos e
            conquistar novos trabalhos com mais eficiência.
          </p>
          <Link
            href="/login"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-lime-500 px-8 text-sm font-bold text-slate-900 transition-all hover:bg-lime-400 hover:scale-105"
          >
            Acessar a plataforma
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <PeriLabMark size={30} dark />
                <span style={{ fontFamily: 'var(--font-montserrat), "Montserrat", ui-sans-serif, system-ui, sans-serif', fontWeight: 700, color: '#e2e8f0', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                  Peri<span style={{ color: '#84cc16' }}>LaB</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                Plataforma de gestão pericial para profissionais do direito.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Produto</p>
              {['Funcionalidades', 'Prospecção', 'Planos'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/g, 'c').replace(/ã/g, 'a')}`}
                  className="text-xs text-slate-500 transition-colors hover:text-lime-400"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Legal</p>
              {['Termos de uso', 'Privacidade', 'LGPD'].map((item) => (
                <span key={item} className="text-xs text-slate-500">{item}</span>
              ))}
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-6">
            <p className="text-center text-[11px] text-slate-600">
              © {new Date().getFullYear()} Perilab — de perito para perito. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

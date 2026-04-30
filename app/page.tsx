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
  return FileText
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
    description: 'Para quem está começando',
    highlight: false,
    badge: null,
    features: [
      'Até 3 processos ativos',
      'Gestão básica de documentos',
      'Controle de visitas',
      'Contatos e parceiros',
    ],
    micro: 'Ideal para testar antes de escalar',
    cta: 'Começar grátis',
    ctaStyle: 'secondary',
  },
  {
    name: 'Profissional',
    price: 'R$ 97',
    period: '/mês',
    description: 'Para quem quer crescer com organização',
    highlight: true,
    badge: 'Mais popular',
    features: [
      'Processos ilimitados',
      'Gestão completa de processos',
      'Geração de propostas de honorários',
      'Apoio de IA para laudos',
      'Radar de nomeações',
      'Rotas inteligentes',
    ],
    micro: 'Mais utilizado por peritos ativos',
    cta: 'Começar agora',
    ctaStyle: 'primary',
  },
  {
    name: 'Avançado',
    price: 'R$ 250',
    period: '/mês',
    description: 'Para quem quer máxima performance',
    highlight: false,
    badge: null,
    features: [
      'Tudo do Profissional',
      'CRM de advogados e escritórios',
      'Automação de prospecção',
      'Gestão de contas e varas',
      'Leads qualificados',
      'Suporte prioritário',
    ],
    micro: null,
    cta: 'Falar com consultor',
    ctaStyle: 'secondary',
  },
]

// ─── Logo components ─────────────────────────────────────────────────────────

function PeriLabLogo({ dark = true }: { dark?: boolean }) {
  return (
    <div style={{ fontFamily: 'var(--font-montserrat), "Montserrat", ui-sans-serif, system-ui, sans-serif', lineHeight: 1 }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
        <span style={{ color: dark ? '#0f172a' : '#ffffff' }}>Peri</span>
        <span style={{ color: dark ? '#3f5226' : '#cbd5e1' }}>lab</span>
        <span style={{ color: '#84cc16' }}>.</span>
      </div>
    </div>
  )
}

/** Compact mark: P + . (lime) */
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
      <span style={{ color: '#84cc16' }}>.</span>
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
      <section className="relative pt-28 pb-10 lg:pt-36 lg:pb-16 overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* Left Column - Typography & CTA */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left z-10">
            <h1 className="text-[#111827] font-black leading-[1.05] tracking-tight mb-8"
                style={{ fontSize: 'clamp(3.3rem, 5.7vw, 5.2rem)', fontFamily: 'var(--font-manrope), var(--font-montserrat), ui-sans-serif, system-ui, sans-serif' }}>
              Gestão pericial completa,<br/>
              <span className="text-[#84cc16]">do processo ao laudo.</span>
            </h1>
            
            <p className="text-[#6b7280] text-lg sm:text-xl font-medium mb-10 max-w-md leading-relaxed">
              Organize suas perícias, evite perdas de prazo e produza laudos mais rápido para conquistar mais nomeações.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/login" 
                    className="flex bg-[#a3e635] hover:bg-[#84cc16] text-[#111827] font-bold px-8 py-4 rounded-full transition-transform hover:scale-105 active:scale-95 text-lg items-center gap-2">
                Começar agora
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#funcionalidades"
                 className="bg-[#1f2937] hover:bg-[#111827] text-white font-bold px-8 py-4 rounded-full transition-transform hover:scale-105 active:scale-95 text-lg">
                Ver como funciona
              </a>
            </div>


          </div>

          {/* Right Column - Hero Image */}
          <div className="w-full lg:w-1/2 relative lg:h-[650px] mt-10 lg:mt-0 flex justify-end">
            <div className="relative w-full max-w-lg aspect-[4/5] lg:aspect-auto lg:h-[90%] lg:absolute right-0 top-0">
              <img
                src="/hero-perito.webp"
                alt="Perito usando o sistema no celular"
                className="w-full h-full object-cover shadow-2xl"
                style={{
                  borderRadius: '160px 40px 20px 160px',
                }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-10">
          Peritos que já estão organizando sua atuação com o PeriLab
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { nome: 'Carlos Henrique', cargo: 'Perito Judicial', frase: 'Depois que comecei a usar, nunca mais perdi prazo. Mudou completamente minha rotina.', iniciais: 'CH' },
            { nome: 'Fernanda Souza', cargo: 'Perita Contábil', frase: 'Consigo organizar várias perícias ao mesmo tempo sem me perder.', iniciais: 'FS' },
            { nome: 'Ricardo Alves', cargo: 'Perito Engenheiro', frase: 'O laudo ficou muito mais rápido de fazer.', iniciais: 'RA' },
          ].map((t) => (
            <div key={t.nome} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <p className="text-slate-600 text-[15px] leading-relaxed mb-5 italic">&ldquo;{t.frase}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0">
                  {t.iniciais}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.nome}</p>
                  <p className="text-xs text-slate-400">{t.cargo}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Secondary Section (Stats and Proof mapped from Example 2) ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 my-20">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Stat Block 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 flex flex-col justify-center items-center text-center hover:scale-[1.02] transition-transform">
               <h3 className="text-slate-900 text-5xl sm:text-6xl font-black mb-4">200+</h3>
               <p className="text-slate-600 font-bold text-lg uppercase tracking-wide">Peritos Ativos</p>
            </div>

            {/* Stat Block 2 */}
            <div className="bg-lime-500 rounded-[32px] p-8 flex flex-col justify-center items-center text-center hover:scale-[1.02] transition-transform shadow-sm">
               <h3 className="text-slate-900 text-5xl sm:text-6xl font-black mb-4">5.000+</h3>
               <p className="text-slate-800 font-bold text-lg uppercase tracking-wide">Péricias Gerenciadas</p>
            </div>

            {/* Stat Block 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 flex flex-col justify-center items-center text-center hover:scale-[1.02] transition-transform">
               <h3 className="text-slate-900 text-5xl sm:text-6xl font-black mb-4">12.000+</h3>
               <p className="text-slate-600 font-bold text-lg uppercase tracking-wide">Documentos Gerados</p>
            </div>
         </div>
      </section>

      {/* ── Features List Section (Mapped from Example 3) ── */}
      <section id="funcionalidades" className="mx-auto max-w-7xl px-4 sm:px-6 my-28">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            {/* Left Photo */}
            <div className="w-full relative lg:sticky lg:top-36">
               <div className="inline-block px-4 py-2 mb-4 text-[11px] font-bold text-[#84cc16] uppercase tracking-[0.15em]">
                  Funcionalidades
               </div>
               <h2 className="text-[#1f2937] text-3xl sm:text-4xl lg:text-5xl font-black font-manrope leading-[1.1] mb-6 tracking-tight">
                 Tudo que o perito precisa
               </h2>
               <p className="mb-8 text-[#6b7280] text-lg">Do controle de processos à geração de laudos — uma plataforma integrada para profissionalizar sua atuação pericial.</p>
               
               <div className="aspect-[4/3] w-full rounded-[40px] overflow-hidden mt-10">
                 <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1470" className="w-full h-full object-cover" alt="Team meeting"/>
               </div>
            </div>

            {/* Right Feature List */}
            <div className="flex flex-col gap-10 lg:pt-16 bg-slate-50 rounded-[40px] p-6 sm:p-10 lg:p-14 border border-slate-100">
               {features.map((f, i) => (
                  <div key={f.title} className="flex gap-6 items-start group">
                     {/* Green Number box */}
                     <div className="w-16 h-16 rounded-2xl bg-[#a3e635] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-md">
                     <span className="text-[#111827] font-black text-xl">{String(i+1).padStart(2, '0')}</span>
                     </div>
                     <div className="pt-2">
                        <h3 className="text-[#111827] text-2xl font-bold mb-3 tracking-tight">{f.title}</h3>
                        <p className="text-slate-500 text-base leading-relaxed">{f.description}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* ── Prospection Section ── */}
      <section id="prospeccao" className="mx-auto max-w-7xl px-4 sm:px-6 my-28">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div>
               <div className="inline-block px-4 py-2 mb-4 text-[11px] font-bold text-[#84cc16] uppercase tracking-[0.15em]">
                  Módulo de Prospecção
               </div>
               <h2 className="text-[#1f2937] text-3xl sm:text-4xl lg:text-5xl font-black font-manrope leading-[1.1] mb-6 tracking-tight">
                 Conquiste novos trabalhos <br /><span className="text-[#84cc16]">no piloto automático</span>
               </h2>
               <p className="mb-8 text-[#6b7280] text-lg leading-relaxed">
                 O Perilab automatiza a prospecção de advogados, escritórios e seguradoras. Envie e-mails personalizados, propostas e currículo de forma organizada e escalável — enquanto você foca nas péricias.
               </p>
               
               <ul className="space-y-4 mb-10 text-left">
                 {prospectionFeatures.map((item) => (
                   <li key={item.text} className="flex items-center gap-3">
                     <CheckCircle2 className="flex-shrink-0 text-[#84cc16] w-6 h-6" />
                     <span className="text-[#1f2937] font-bold text-[15px]">{item.text}</span>
                   </li>
                 ))}
               </ul>
               
               <Link href="#planos" className="inline-flex items-center gap-2 text-[#84cc16] font-bold text-base hover:text-[#65a30d] transition-colors border-b-2 border-transparent hover:border-[#84cc16] pb-1">
                  Disponível nos planos Pro e Avançado
                  <ArrowRight className="w-4 h-4" />
               </Link>
            </div>

            {/* Right Dashboard Mockup */}
            <div className="bg-white border-2 border-slate-100 rounded-[40px] p-8 sm:p-10 shadow-2xl">
               <div className="mb-8 flex items-center justify-between">
                 <p className="text-[#1f2937] font-black text-xl tracking-tight">Campanha ativa</p>
                 <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Enviando
                 </span>
               </div>
               
               <div className="space-y-3">
                 {[
                   { nome: 'Dr. Ricardo Alves', status: 'Respondeu', bg: 'bg-[#bbf7d0]', color: 'text-[#064e3b]' },
                   { nome: 'Escritório Martins & Assoc.', status: 'Abriu e-mail', bg: 'bg-yellow-100', color: 'text-yellow-700' },
                   { nome: 'Dra. Camila Santos', status: 'Enviado', bg: 'bg-slate-100', color: 'text-slate-500' },
                   { nome: 'Braz Advogados', status: 'Enviado', bg: 'bg-slate-100', color: 'text-slate-500' },
                   { nome: 'Dr. Fernando Costa', status: 'Agendou reunião', bg: 'bg-slate-100', color: 'text-slate-600' },
                 ].map((lead) => (
                   <div key={lead.nome} className="flex items-center justify-between rounded-2xl px-4 py-3 bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer">
                     <div className="flex items-center gap-3">
                       <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-[#1f2937] font-bold shadow-sm">
                         {lead.nome[0]}
                       </div>
                       <span className="text-[#1f2937] font-bold text-[13px]">{lead.nome}</span>
                     </div>
                     <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${lead.bg} ${lead.color}`}>
                       {lead.status}
                     </span>
                   </div>
                 ))}
               </div>

               <div className="mt-10 grid grid-cols-3 gap-2 pt-6 border-t-2 border-slate-100">
                 {[
                   { label: 'Enviados', value: '124' },
                   { label: 'Abertos', value: '68' },
                   { label: 'Respondidos', value: '19' },
                 ].map((s) => (
                   <div key={s.label} className="text-center">
                     <p className="text-[#1f2937] text-3xl font-black font-manrope">{s.value}</p>
                     <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
                   </div>
                 ))}
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
              Escolha o plano ideal para sua atuação.
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
                  {plan.micro && (
                    <p className="mt-2 text-[11px] font-medium italic" style={{ color: plan.highlight ? '#6b7280' : '#94a3b8' }}>
                      {plan.micro}
                    </p>
                  )}
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

        </div>
      </section>

      {/* ── CTA Banner (Editorial Design) ── */}
      <section className="bg-[#a3e635] pt-28 pb-32 border-b-[16px] border-[#1f2937]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-16">
            
            <div className="max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-4">
                <div className="w-16 h-[3px] bg-[#1f2937]" />
                <span className="text-[#1f2937] font-black uppercase tracking-[0.2em] text-[11px]">
                  Próximo Passo
                </span>
              </div>
              <h2 className="font-manrope text-5xl sm:text-6xl lg:text-[5rem] font-black tracking-tighter text-[#1f2937] leading-[0.95]">
                Profissionalize sua atuação pericial <br className="hidden lg:block"/>e pare de perder oportunidades.
              </h2>
            </div>
            
            <div className="flex flex-col items-start lg:items-end gap-8 flex-shrink-0">
              <p className="text-[#1f2937] font-medium text-xl max-w-md lg:text-right leading-relaxed">
                Junte-se a peritos que já estão organizando seus processos e aumentando sua produtividade.
              </p>
              <Link
                href="/login"
                className="inline-flex h-16 items-center gap-4 bg-[#1f2937] px-10 text-[15px] font-black text-white hover:bg-black transition-colors rounded-full shadow-2xl shadow-[#1f2937]/30"
              >
                Começar agora
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

          </div>
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
                <span style={{ fontFamily: 'var(--font-montserrat), "Montserrat", ui-sans-serif, system-ui, sans-serif', fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.03em' }}>
                  <span style={{ color: '#e2e8f0' }}>Peri</span>
                  <span style={{ color: '#94a3b8' }}>lab</span>
                  <span style={{ color: '#84cc16' }}>.</span>
                </span>
              </div>
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
              © {new Date().getFullYear()} Perilab. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

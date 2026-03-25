import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Radar,
  Navigation,
  Zap,
  Mail,
  Users,
  Send,
  BarChart3,
  Shield,
  Sparkles,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: FileText,
    title: 'Gestão de Péricias',
    description: 'Centralize processos, prazos, documentos e laudos. Acompanhe cada etapa com visibilidade total do fluxo pericial.',
    accent: 'bg-lime-50 text-lime-600 ring-lime-100',
  },
  {
    icon: Radar,
    title: 'Radar de Nomeações',
    description: 'Monitore varas e juízes estratégicos. Identifique padrões de nomeação e antecipe oportunidades de trabalho.',
    accent: 'bg-violet-50 text-violet-600 ring-violet-100',
  },
  {
    icon: Navigation,
    title: 'Rotas Inteligentes',
    description: 'Planeje deslocamentos entre visitas e vistorias. Reduza tempo e custo com organização eficiente de rotas.',
    accent: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  },
  {
    icon: Zap,
    title: 'Geração de Documentos',
    description: 'Gere laudos, propostas de honorários e pareceres com agilidade. Modelos profissionais prontos para uso.',
    accent: 'bg-amber-50 text-amber-600 ring-amber-100',
  },
]

const prospectionFeatures = [
  { icon: Mail, text: 'Envio automatizado de e-mails para advogados e escritórios' },
  { icon: Users, text: 'Cadastro e organização de leads qualificados' },
  { icon: Send, text: 'Envio de propostas e currículo profissional' },
  { icon: BarChart3, text: 'Acompanhamento de funil e taxa de resposta' },
  { icon: Zap, text: 'Identificação automática de oportunidades' },
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
      'Péricias ilimitadas',
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Image src="/logo.svg" alt="Perilab" width={130} height={48} priority />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#funcionalidades" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Funcionalidades
            </a>
            <a href="#prospeccao" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Prospecção
            </a>
            <a href="#planos" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
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
      <section className="border-b border-slate-100 bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* LEFT — text */}
            <div>
              {/* Pill */}
              <div className="mb-7 inline-flex cursor-pointer items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3.5 py-1 text-xs font-semibold text-lime-700 transition-all hover:bg-lime-100 ring-1 ring-lime-200/50">
                <span className="flex h-1.5 w-1.5 rounded-full bg-lime-500" />
                Novo Radar de Nomeações V2.0
                <ArrowRight className="h-3 w-3 ml-0.5" />
              </div>

              {/* Headline */}
              <h1 className="font-heading mb-6 text-[2.6rem] font-bold leading-[1.06] tracking-[-0.03em] text-slate-900 sm:text-5xl lg:text-[3.25rem]">
                Gestão pericial completa,<br />
                <em className="not-italic italic font-bold text-lime-500">do processo ao laudo.</em>
              </h1>

              <p className="mb-8 max-w-[480px] text-lg leading-relaxed text-slate-500">
                O Perilab organiza suas péricias, identifica oportunidades de nomeação e gera documentos profissionais com precisão.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-lime-500 px-8 text-sm font-bold text-slate-900 shadow-sm shadow-lime-300/40 transition-all hover:bg-lime-400 hover:shadow-md hover:shadow-lime-300/50"
                >
                  Acessar plataforma
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#planos"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-8 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                  Ver planos
                </a>
              </div>

              {/* Stats */}
              <div className="mt-12 flex flex-wrap gap-8 border-t border-slate-100 pt-8">
                {[
                  { value: '200+', label: 'Peritos ativos' },
                  { value: '5.000+', label: 'Péricias gerenciadas' },
                  { value: '12.000+', label: 'Documentos gerados' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="font-heading text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{s.value}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — product mockup, transparent on white */}
            <div className="flex items-center justify-end">
              <Image
                src="/hero-mockup.png"
                alt="Perilab no laptop e no celular"
                width={560}
                height={420}
                className="w-full max-w-[320px] object-contain mix-blend-multiply"
                priority
              />
            </div>

          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="funcionalidades" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-lime-600">
              Funcionalidades
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem]">
              Tudo que o perito precisa
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Do controle de processos à geração de laudos — uma plataforma integrada para profissionalizar sua atuação pericial.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-100/80"
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${f.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Prospection ── */}
      <section id="prospeccao" className="bg-slate-50/60 py-20 sm:py-28 border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-lime-600">
                Módulo de Prospecção
              </p>
              <h2 className="font-heading mb-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem]">
                Conquiste novos trabalhos{' '}
                <span className="text-lime-600">no piloto automático</span>
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-500">
                O Perilab automatiza a prospecção de advogados, escritórios e seguradoras. Envie
                e-mails personalizados, propostas e currículo de forma organizada e escalável —
                enquanto você foca nas péricias.
              </p>
              <ul className="space-y-3.5">
                {prospectionFeatures.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.text} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-lime-100">
                        <Icon className="h-3.5 w-3.5 text-lime-600" />
                      </div>
                      <span className="text-sm text-slate-700 leading-relaxed">{item.text}</span>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-10">
                <a
                  href="#planos"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-lime-600 hover:text-lime-700 transition-colors"
                >
                  Disponível nos planos Pro e Avançado
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Visual card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Campanha ativa</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Enviando
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  { nome: 'Dr. Ricardo Alves', status: 'Respondeu', color: 'bg-emerald-50 text-emerald-700' },
                  { nome: 'Escritório Martins & Assoc.', status: 'Abriu e-mail', color: 'bg-amber-50 text-amber-700' },
                  { nome: 'Dra. Camila Santos', status: 'Enviado', color: 'bg-slate-100 text-slate-500' },
                  { nome: 'Braz Advogados', status: 'Enviado', color: 'bg-slate-100 text-slate-500' },
                  { nome: 'Dr. Fernando Costa', status: 'Agendou reunião', color: 'bg-violet-50 text-violet-700' },
                ].map((lead) => (
                  <div
                    key={lead.nome}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {lead.nome[0]}
                      </div>
                      <span className="text-xs font-medium text-slate-800">{lead.nome}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${lead.color}`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                {[
                  { label: 'Enviados', value: '124' },
                  { label: 'Abertos', value: '68' },
                  { label: 'Respondidos', value: '19' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-base font-bold text-slate-900 tabular-nums">{s.value}</p>
                    <p className="text-[10px] text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="planos" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 max-w-lg">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-lime-600">
              Planos
            </p>
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
                className={`relative flex flex-col rounded-2xl border p-8 transition-all ${
                  plan.highlight
                    ? 'border-slate-800 bg-slate-950 text-white shadow-xl shadow-slate-900/30 scale-[1.02]'
                    : 'border-slate-200 bg-white text-slate-900 hover:shadow-md'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-500 px-3 py-1 text-[10px] font-bold text-slate-900 tracking-wide uppercase">
                      <Sparkles className="h-3 w-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className={`mb-1 text-xs font-semibold uppercase tracking-wider ${plan.highlight ? 'text-lime-400' : 'text-slate-400'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`font-heading text-4xl font-bold tabular-nums tracking-tight ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-sm ${plan.highlight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`mt-2.5 text-sm leading-relaxed ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          plan.highlight ? 'text-lime-400' : 'text-emerald-500'
                        }`}
                      />
                      <span className={plan.highlight ? 'text-slate-300' : 'text-slate-600'}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    plan.ctaStyle === 'primary'
                      ? 'bg-lime-500 text-slate-900 hover:bg-lime-400 shadow-sm shadow-lime-400/30'
                      : plan.highlight
                      ? 'border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
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
            <Shield className="h-3.5 w-3.5 text-lime-400" />
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
      <footer className="border-t border-slate-800 bg-slate-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-lime-500 text-[9px] font-bold text-slate-900 select-none">
              PL
            </div>
            <span className="font-heading text-sm font-semibold text-slate-400">Perilab</span>
          </div>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Perilab. Todos os direitos reservados.
          </p>
          <div className="flex gap-5 text-xs text-slate-600">
            <a href="#" className="hover:text-slate-400 transition-colors">Termos de uso</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Privacidade</a>
            <Link href="/login" className="hover:text-slate-400 transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

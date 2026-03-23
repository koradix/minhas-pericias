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
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: FileText,
    title: 'Gestão de Péricias',
    description:
      'Centralize processos, prazos, documentos e laudos. Acompanhe cada etapa com visibilidade total do fluxo pericial.',
    accent: 'bg-brand-500/10 text-brand-500 ring-lime-100',
  },
  {
    icon: Radar,
    title: 'Radar de Nomeações',
    description:
      'Monitore varas e juízes estratégicos. Identifique padrões de nomeação e antecipe oportunidades de trabalho.',
    accent: 'bg-violet-50 text-violet-600 ring-violet-100',
  },
  {
    icon: Navigation,
    title: 'Rotas Inteligentes',
    description:
      'Planeje deslocamentos entre visitas e vistorias. Reduza tempo e custo com organização eficiente de rotas.',
    accent: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  },
  {
    icon: Zap,
    title: 'Geração de Documentos',
    description:
      'Gere laudos, propostas de honorários e pareceres com agilidade. Modelos profissionais prontos para uso.',
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
    price: 'R$ 89',
    period: '/mês',
    description: 'Para quem está começando a organizar sua atuação pericial.',
    highlight: false,
    features: [
      'Até 20 péricias ativas',
      'Gestão de documentos',
      'Controle de visitas',
      'Contatos e parceiros',
      'Dashboard financeiro',
    ],
    cta: 'Começar agora',
  },
  {
    name: 'Profissional',
    price: 'R$ 189',
    period: '/mês',
    description: 'Para peritos que querem crescer e prospectar ativamente.',
    highlight: true,
    features: [
      'Péricias ilimitadas',
      'Tudo do Essencial',
      'Radar de Nomeações',
      'Rotas inteligentes',
      'Prospecção por e-mail',
      'Envio de propostas e currículo',
    ],
    cta: 'Começar agora',
  },
  {
    name: 'Premium',
    price: 'R$ 389',
    period: '/mês',
    description: 'Automação completa para maximizar sua captação de trabalhos.',
    highlight: false,
    features: [
      'Tudo do Profissional',
      'Automação de prospecção',
      'Leads qualificados',
      'Geração de documentos com IA',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    cta: 'Falar com consultor',
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-card text-foreground antialiased">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Image src="/logo.svg" alt="PeriLaB" width={130} height={48} priority />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#funcionalidades" className="text-sm font-medium text-zinc-400 hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#prospeccao" className="text-sm font-medium text-zinc-400 hover:text-foreground transition-colors">
              Prospecção
            </a>
            <a href="#planos" className="text-sm font-medium text-zinc-400 hover:text-foreground transition-colors">
              Planos
            </a>
          </nav>

          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-lime-400"
          >
            Entrar
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

        {/* ── Hero ── */}
      <section className="relative border-b border-border overflow-hidden bg-background py-24 sm:py-32 lg:py-36">
        {/* Glow effect */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-500/20 to-zinc-800/10 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>

        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 relative z-10">
          
          {/* Announcement Pill */}
          <div className="mb-8 inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-500 ring-1 ring-inset ring-brand-500/10 transition-all hover:bg-brand-500/20">
            <span className="flex h-2 w-2 rounded-full bg-brand-500"></span>
            Conheça o novo Radar de Nomeações V2.0
            <ArrowRight className="h-3 w-3 ml-1" />
          </div>

          <h1 className="mb-7 text-[2.6rem] font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
            Gestão pericial completa,{' '}
            <span className="text-brand-500">do processo ao laudo.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-[540px] text-lg leading-relaxed text-zinc-400">
            O PeriLaB centraliza suas péricias, monitora nomeações em varas estratégicas
            e gera documentos profissionais automaticamente.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-500 px-8 text-sm font-bold text-zinc-950 shadow-saas-glow hover:bg-brand-400 hover:scale-105 transition-all duration-300"
            >
              Acessar a plataforma
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#planos"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-8 text-sm font-semibold text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 transition-all duration-300"
            >
              Ver planos
            </a>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-lg grid-cols-3 gap-8 border-t border-border/50 pt-10">
            {[
              { value: '200+', label: 'Peritos ativos' },
              { value: '5K+', label: 'Péricias gerenciadas' },
              { value: '12K+', label: 'Laudos gerados' },
            ].map((s) => (
              <div key={s.label} className="text-center group">
                <p className="text-3xl font-bold text-foreground tabular-nums group-hover:text-brand-500 transition-colors">{s.value}</p>
                <p className="mt-2 text-xs text-zinc-500 font-medium uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Features ── */}
      <section id="funcionalidades" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-brand-500">
              Funcionalidades
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2.1rem]">
              Tudo que o perito precisa
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              Do controle de processos à geração de laudos — uma plataforma integrada para
              profissionalizar sua atuação pericial.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group rounded-xl border border-border bg-card p-6 shadow-saas transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${f.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Prospection ── */}
      <section id="prospeccao" className="bg-muted/70 py-20 sm:py-28 border-y border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-brand-500">
                Módulo de Prospecção
              </p>
              <h2 className="mb-5 text-3xl font-bold tracking-tight text-foreground sm:text-[2.1rem]">
                Conquiste novos trabalhos{' '}
                <span className="text-brand-500">no piloto automático</span>
              </h2>
              <p className="mb-8 text-base leading-relaxed text-zinc-400">
                O PeriLaB automatiza a prospecção de advogados, escritórios e seguradoras. Envie
                e-mails personalizados, propostas e currículo de forma organizada e escalável —
                enquanto você foca nas péricias.
              </p>
              <ul className="space-y-3.5">
                {prospectionFeatures.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.text} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-brand-500/20">
                        <Icon className="h-3.5 w-3.5 text-brand-500" />
                      </div>
                      <span className="text-sm text-zinc-300 leading-relaxed">{item.text}</span>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-10">
                <a
                  href="#planos"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-400 transition-colors"
                >
                  Disponível nos planos Profissional e Premium
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Visual card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-saas">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Campanha ativa</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Enviando
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  { nome: 'Dr. Ricardo Alves', status: 'Respondeu', color: 'bg-emerald-50 text-emerald-700' },
                  { nome: 'Escritório Martins & Assoc.', status: 'Abriu e-mail', color: 'bg-amber-50 text-amber-700' },
                  { nome: 'Dra. Camila Santos', status: 'Enviado', color: 'bg-zinc-900/50 text-zinc-400' },
                  { nome: 'Braz Advogados', status: 'Enviado', color: 'bg-zinc-900/50 text-zinc-400' },
                  { nome: 'Dr. Fernando Costa', status: 'Agendou reunião', color: 'bg-violet-50 text-violet-700' },
                ].map((lead) => (
                  <div
                    key={lead.nome}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/50 text-xs font-semibold text-zinc-400">
                        {lead.nome[0]}
                      </div>
                      <span className="text-xs font-medium text-foreground">{lead.nome}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${lead.color}`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
                {[
                  { label: 'Enviados', value: '124' },
                  { label: 'Abertos', value: '68' },
                  { label: 'Respondidos', value: '19' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-base font-bold text-foreground tabular-nums">{s.value}</p>
                    <p className="text-[10px] text-zinc-500">{s.label}</p>
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-brand-500">
              Planos
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2.1rem]">
              Escolha o seu plano
            </h2>
            <p className="mt-4 text-base text-zinc-400">
              Comece grátis por 1 mês. Sem cartão de crédito.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border p-8 transition-shadow hover:shadow-md ${
                  plan.highlight
                    ? 'border-slate-700 bg-slate-950 text-white shadow-lg shadow-slate-900/30'
                    : 'border-border bg-card text-foreground shadow-saas'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-brand-500 px-3 py-1 text-[10px] font-bold text-foreground tracking-wide uppercase">
                      Mais popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className={`mb-1 text-xs font-semibold uppercase tracking-wider ${plan.highlight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-4xl font-bold tabular-nums ${plan.highlight ? 'text-white' : 'text-foreground'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={`mt-2.5 text-sm leading-relaxed ${plan.highlight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          plan.highlight ? 'text-brand-400' : 'text-emerald-500'
                        }`}
                      />
                      <span className={plan.highlight ? 'text-zinc-600' : 'text-zinc-400'}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-brand-500 text-foreground hover:bg-lime-400'
                      : 'border border-border bg-muted text-zinc-300 hover:bg-zinc-900/50 hover:border-border'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-zinc-500">
            Todos os planos incluem 1 mês de teste gratuito · Cancele a qualquer momento
          </p>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-slate-950 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5 text-xs text-zinc-500">
            <Shield className="h-3.5 w-3.5 text-brand-400" />
            Dados seguros · LGPD compliant
          </div>
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Pronto para profissionalizar<br className="hidden sm:block" /> sua atuação pericial?
          </h2>
          <p className="mb-8 text-base leading-relaxed text-zinc-500">
            Junte-se a centenas de peritos que já usam o PeriLaB para organizar processos e
            conquistar novos trabalhos com mais eficiência.
          </p>
          <Link
            href="/login"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-7 text-sm font-semibold text-foreground transition-all hover:bg-lime-400"
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
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-[9px] font-bold text-foreground select-none">
              PL
            </div>
            <span className="text-sm font-semibold text-zinc-500">PeriLaB</span>
          </div>
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} PeriLaB. Todos os direitos reservados.
          </p>
          <div className="flex gap-5 text-xs text-zinc-400">
            <a href="#" className="hover:text-zinc-500 transition-colors">Termos de uso</a>
            <a href="#" className="hover:text-zinc-500 transition-colors">Privacidade</a>
            <Link href="/login" className="hover:text-zinc-500 transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

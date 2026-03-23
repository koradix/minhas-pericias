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
    accent: 'bg-lime-50 text-lime-600 ring-lime-100',
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
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Image src="/logo.svg" alt="PeriLaB" width={130} height={48} priority />
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
      <section className="border-b border-slate-100 bg-white py-24 sm:py-32 lg:py-36">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">

          <h1 className="mb-7 text-[2.6rem] font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
            Gestão pericial completa,{' '}
            <span className="text-lime-500">do processo ao laudo.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-[500px] text-[1.05rem] leading-relaxed text-slate-500">
            O PeriLaB centraliza suas péricias, monitora nomeações em varas estratégicas
            e gera documentos profissionais.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-lime-500 px-7 text-sm font-semibold text-slate-900 transition-all hover:bg-lime-400"
            >
              Acessar a plataforma
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#planos"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-7 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              Ver planos
            </a>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-sm grid-cols-3 gap-6 border-t border-slate-100 pt-10">
            {[
              { value: '200+', label: 'Peritos ativos' },
              { value: '5.000+', label: 'Péricias gerenciadas' },
              { value: '12.000+', label: 'Documentos gerados' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="mt-1 text-[11px] text-slate-400 leading-snug">{s.label}</p>
              </div>
            ))}
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
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem]">
              Tudo que o perito precisa
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
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
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${f.accent}`}>
                    <Icon className="h-4.5 w-4.5" />
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
      <section id="prospeccao" className="bg-slate-50/70 py-20 sm:py-28 border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-lime-600">
                Módulo de Prospecção
              </p>
              <h2 className="mb-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem]">
                Conquiste novos trabalhos{' '}
                <span className="text-lime-600">no piloto automático</span>
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-500">
                O PeriLaB automatiza a prospecção de advogados, escritórios e seguradoras. Envie
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
                  Disponível nos planos Profissional e Premium
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
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.1rem]">
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
                className={`relative flex flex-col rounded-2xl border p-8 transition-shadow hover:shadow-md ${
                  plan.highlight
                    ? 'border-slate-700 bg-slate-950 text-white shadow-lg shadow-slate-900/30'
                    : 'border-slate-200 bg-white text-slate-900 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-lime-500 px-3 py-1 text-[10px] font-bold text-slate-900 tracking-wide uppercase">
                      Mais popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className={`mb-1 text-xs font-semibold uppercase tracking-wider ${plan.highlight ? 'text-slate-400' : 'text-slate-400'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-4xl font-bold tabular-nums ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {plan.period}
                    </span>
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
                    plan.highlight
                      ? 'bg-lime-500 text-slate-900 hover:bg-lime-400'
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
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Pronto para profissionalizar<br className="hidden sm:block" /> sua atuação pericial?
          </h2>
          <p className="mb-8 text-base leading-relaxed text-slate-400">
            Junte-se a centenas de peritos que já usam o PeriLaB para organizar processos e
            conquistar novos trabalhos com mais eficiência.
          </p>
          <Link
            href="/login"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-lime-500 px-7 text-sm font-semibold text-slate-900 transition-all hover:bg-lime-400"
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
            <span className="text-sm font-semibold text-slate-400">PeriLaB</span>
          </div>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} PeriLaB. Todos os direitos reservados.
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
